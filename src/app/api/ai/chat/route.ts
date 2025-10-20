/**
 * AI Chat API Route - Server-side Gemini Integration
 * Handles AI chat requests with server-side API key protection
 */

import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { knowledgeBase } from '@/services/ai/KnowledgeBase'
import { sanitizeChatMessage } from '@/lib/sanitize'
import { withRateLimit } from '@/lib/with-rate-limit'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiInternalError, ERROR_CODES } from '@/lib/api-response'
import { CartAction, AIContext } from '@/types/ai'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { db, products, orders, orderItems } from '@/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize knowledge base on module load
let isKnowledgeBaseInitialized = false

async function ensureKnowledgeBase() {
  if (!isKnowledgeBaseInitialized) {
    await knowledgeBase.initialize()
    isKnowledgeBaseInitialized = true
  }
}

/**
 * Fetch all products from database
 */
async function fetchProducts(): Promise<TwoPhaseCoolingProduct[]> {
  try {
    const allProducts = await db.select().from(products)
    return allProducts as TwoPhaseCoolingProduct[]
  } catch (error) {
    logger.error('Failed to fetch products for AI', error)
    return []
  }
}

/**
 * Fetch user orders securely (ONLY for authenticated user)
 * Returns ONLY orders belonging to the logged-in user
 */
async function fetchUserOrders(userId: string) {
  try {
    // Fetch ONLY orders for this specific user (security critical)
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(10) // Last 10 orders

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async order => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          createdAt: order.createdAt,
          items: items.map(item => ({
            productId: item.productId,
            productSnapshot: item.productSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }
      })
    )

    return ordersWithItems
  } catch (error) {
    logger.error('Failed to fetch user orders for AI', { error, userId })
    return []
  }
}

/**
 * Get maintenance information for a product
 */
function getProductMaintenance(productName: string) {
  const maintenanceData: Record<
    string,
    {
      consumables: Array<{
        item: string
        frequency: string
        quantity: string
        estimatedCost: string
      }>
      maintenanceTasks: Array<{ task: string; frequency: string }>
      warrantyInfo: string
    }
  > = {
    'thermosphere pro pc case': {
      consumables: [
        {
          item: 'Distilled water / coolant refill',
          frequency: 'Every 12-18 months',
          quantity: '500ml',
          estimatedCost: '$15-25',
        },
        {
          item: 'Thermal paste replacement',
          frequency: 'Every 24 months',
          quantity: '1 tube (3-5g)',
          estimatedCost: '$10-15',
        },
        {
          item: 'Dust filter cleaning/replacement',
          frequency: 'Every 3-6 months',
          quantity: 'Clean (free) or replace ($20)',
          estimatedCost: '$0-20',
        },
      ],
      maintenanceTasks: [
        { task: 'Visual inspection of coolant levels', frequency: 'Monthly' },
        { task: 'Check for leaks around fittings', frequency: 'Monthly' },
        { task: 'Clean dust filters', frequency: 'Every 3 months' },
        { task: 'System pressure check', frequency: 'Every 6 months' },
      ],
      warrantyInfo: '5-year limited warranty on vapor chamber, 2-year on pump assembly',
    },
    'cryoflow elite gpu cooler': {
      consumables: [
        {
          item: 'Thermal pads replacement',
          frequency: 'Every 24-36 months',
          quantity: '1 set (varies by GPU)',
          estimatedCost: '$15-30',
        },
        {
          item: 'Thermal paste for GPU die',
          frequency: 'Every 18-24 months',
          quantity: '2-3g',
          estimatedCost: '$10-15',
        },
      ],
      maintenanceTasks: [
        { task: 'Fan bearing lubrication', frequency: 'Every 12 months' },
        { task: 'Thermal performance monitoring', frequency: 'Monthly' },
        { task: 'Clean heatsink fins', frequency: 'Every 6 months' },
      ],
      warrantyInfo: '3-year limited warranty',
    },
    'quantum freeze cpu cooler': {
      consumables: [
        {
          item: 'Thermal paste replacement',
          frequency: 'Every 18-24 months',
          quantity: '3-5g',
          estimatedCost: '$8-12',
        },
      ],
      maintenanceTasks: [
        { task: 'Fan operation check', frequency: 'Monthly' },
        { task: 'Mounting pressure inspection', frequency: 'Every 6 months' },
        { task: 'Clean heatsink', frequency: 'Every 6 months' },
      ],
      warrantyInfo: '2-year limited warranty',
    },
  }

  // Find matching product (case-insensitive)
  const productKey = Object.keys(maintenanceData).find(key =>
    productName.toLowerCase().includes(key.toLowerCase())
  )

  if (productKey) {
    return maintenanceData[productKey]
  }

  // Default maintenance for two-phase cooling products
  return {
    consumables: [
      {
        item: 'Coolant/working fluid check',
        frequency: 'Every 12 months',
        quantity: 'As needed',
        estimatedCost: '$15-25',
      },
      {
        item: 'Thermal interface material',
        frequency: 'Every 24 months',
        quantity: '1 application',
        estimatedCost: '$10-15',
      },
    ],
    maintenanceTasks: [
      { task: 'Visual inspection', frequency: 'Monthly' },
      { task: 'Performance monitoring', frequency: 'Monthly' },
      { task: 'Cleaning', frequency: 'Every 6 months' },
    ],
    warrantyInfo: 'Contact support for warranty information',
  }
}

/**
 * Detect cart actions from AI response and user question
 */
function detectCartActions(
  aiResponse: string,
  userQuestion: string,
  products: TwoPhaseCoolingProduct[],
  context?: AIContext
): CartAction[] {
  const actions: CartAction[] = []
  const lowerResponse = aiResponse.toLowerCase()
  const lowerQuestion = userQuestion.toLowerCase()

  // Detect "add to cart" intent
  const addPatterns = [
    /add.*to.*cart/i,
    /I'll add/i,
    /adding.*to.*cart/i,
    /put.*in.*cart/i,
    /would you like.*add/i,
  ]

  const hasAddIntent = addPatterns.some(
    pattern => pattern.test(lowerResponse) || pattern.test(lowerQuestion)
  )

  if (hasAddIntent) {
    // Try to find specific product mentions in the conversation
    // First, try to match exact product names (most specific)
    let matchedProduct = products.find(product => {
      const productName = product.name.toLowerCase()
      return lowerQuestion.includes(productName) || lowerResponse.includes(productName)
    })

    // If no exact match, try matching by slug
    if (!matchedProduct) {
      matchedProduct = products.find(product => {
        const productSlug = product.slug.toLowerCase()
        return lowerQuestion.includes(productSlug) || lowerResponse.includes(productSlug)
      })
    }

    // If still no match, try matching by SKU
    if (!matchedProduct) {
      matchedProduct = products.find(product => {
        const productSKU = product.sku.toLowerCase()
        return lowerQuestion.includes(productSKU) || lowerResponse.includes(productSKU)
      })
    }

    // If still no match, try matching key distinguishing words
    if (!matchedProduct) {
      // Look for distinguishing words like "pro", "elite", "basic"
      if (lowerQuestion.includes('elite') || lowerResponse.includes('elite')) {
        matchedProduct = products.find(p => p.name.toLowerCase().includes('elite'))
      } else if (lowerQuestion.includes('pro') || lowerResponse.includes('pro')) {
        matchedProduct = products.find(p => p.name.toLowerCase().includes('pro'))
      } else if (lowerQuestion.includes('basic') || lowerResponse.includes('basic')) {
        matchedProduct = products.find(p => p.name.toLowerCase().includes('basic'))
      }
    }

    // If we found a specific product, add only that one
    if (matchedProduct) {
      actions.push({
        type: 'add',
        productId: matchedProduct.slug, // Use slug instead of ID for API compatibility
        quantity: 1,
        description: `Add ${matchedProduct.name} to cart`,
        requiresConfirmation: true,
      })
    }
  }

  // Detect "remove from cart" intent
  const removePatterns = [
    /remove.*from.*cart/i,
    /delete.*from.*cart/i,
    /take.*out.*of.*cart/i,
    /clear.*cart/i,
  ]

  const hasRemoveIntent = removePatterns.some(
    pattern => pattern.test(lowerResponse) || pattern.test(lowerQuestion)
  )

  if (hasRemoveIntent && context?.cartItems && context.cartItems.length > 0) {
    // If user mentions specific product, remove it
    context.cartItems.forEach(item => {
      const productName = item.productName?.toLowerCase() || ''
      if (lowerQuestion.includes(productName) || lowerResponse.includes(productName)) {
        actions.push({
          type: 'remove',
          productId: item.id,
          description: `Remove ${item.productName} from cart`,
          requiresConfirmation: true,
        })
      }
    })

    // If no specific product mentioned and "clear cart", remove all
    if (actions.length === 0 && /clear.*cart/i.test(lowerQuestion)) {
      context.cartItems.forEach(item => {
        actions.push({
          type: 'remove',
          productId: item.id,
          description: `Remove ${item.productName} from cart`,
          requiresConfirmation: true,
        })
      })
    }
  }

  return actions
}

async function handlePOST(request: Request | NextRequest) {
  try {
    // Get server-side API key (not exposed to client)
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      logger.error('Gemini API key not configured', { context: 'AI API' })
      return apiInternalError('AI service not configured')
    }

    const body = await request.json()
    const { messages, context } = body

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Invalid messages format', { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return apiError(ERROR_CODES.INVALID_INPUT, 'No user message found', { status: 400 })
    }

    // Sanitize user input to prevent XSS
    const userQuestion = sanitizeChatMessage(lastMessage.content)

    // Get authenticated user session (SECURITY: Only fetch orders for logged-in user)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    // Initialize knowledge base
    await ensureKnowledgeBase()

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Search knowledge base
    const knowledgeResults = knowledgeBase.search(userQuestion, {
      maxResults: 5,
      minScore: 0.1,
    })

    // Build FAQ context
    const faqContext = knowledgeResults
      .map(
        (result, index) => `
FAQ ${index + 1} (Relevance: ${(result.relevanceScore * 100).toFixed(0)}%):
Q: ${result.item.title}
A: ${result.item.content}
`
      )
      .join('\n')

    // Build cart context
    const cartContext =
      context?.cartItems && context.cartItems.length > 0
        ? `\n\nCurrent Shopping Cart:
${context.cartItems.map((item: { productName: string; quantity: number; price: number }) => `- ${item.productName} (Qty: ${item.quantity}, Price: $${item.price})`).join('\n')}
Total Items: ${context.cartItems.length}
Total Value: $${context.cartItems.reduce((sum: number, item: { productName: string; quantity: number; price: number }) => sum + item.price * item.quantity, 0).toFixed(2)}
`
        : '\n\nShopping cart is currently empty.'

    // Build order history context (ONLY for logged-in users - SECURITY CRITICAL)
    let orderContext = ''
    if (userId) {
      const userOrders = await fetchUserOrders(userId)

      if (userOrders.length > 0) {
        orderContext = `\n\nUser Order History (${userEmail}):
${userOrders
  .map((order, index) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString()
    const products = order.items
      .map(item => {
        try {
          const snapshot =
            typeof item.productSnapshot === 'string'
              ? JSON.parse(item.productSnapshot)
              : item.productSnapshot
          return `  - ${snapshot.name} (Qty: ${item.quantity}, $${item.unitPrice})`
        } catch {
          return `  - Product ID ${item.productId} (Qty: ${item.quantity})`
        }
      })
      .join('\n')

    return `${index + 1}. Order #${order.orderNumber} - Placed ${orderDate}
   Status: ${order.status}
   Payment: ${order.paymentStatus}
   Total: $${order.total}
   Products:
${products}`
  })
  .join('\n\n')}

Note: You can provide maintenance guidance for products in these orders.
`
      } else {
        orderContext = '\n\nUser has no order history yet.'
      }
    } else {
      orderContext =
        '\n\nUser is not logged in. Cannot access order history. Suggest logging in for personalized order tracking.'
    }

    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for a two-phase cooling technology company.

Your role:
- Answer questions about two-phase cooling technology
- Recommend products based on customer needs
- Help customers with their shopping cart
- Provide ORDER STATUS information (ONLY for logged-in users)
- Provide MAINTENANCE guidance for purchased products
- Provide technical support and education

IMPORTANT INSTRUCTIONS:
1. Base your answers primarily on the FAQ content provided below
2. If the FAQ doesn't contain the answer, use your general knowledge about cooling systems
3. Be concise and friendly
4. When recommending products, explain why they're suitable
5. If asked about cart actions (add/remove items), suggest them but ALWAYS mention the user needs to confirm

ORDER STATUS QUERIES:
- When user asks about "order status", "my order", "where is my order", check the order history below
- Provide order number, status, payment status, and products
- If user is NOT logged in, ask them to log in to access order information
- NEVER make up order information - only use data from the order history below

MAINTENANCE GUIDANCE:
- When user asks about "maintenance", "consumables", "what do I need", check their order history
- Identify products they've purchased
- Provide specific maintenance schedules and consumable requirements
- Include frequency, quantity, and estimated costs
- Be helpful and proactive about maintenance reminders

Available FAQ Knowledge:
${faqContext}

${cartContext}

${orderContext}

Conversation History:
${messages
  .slice(0, -1)
  .map(
    (m: { role: string; content: string }) =>
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  )
  .join('\n')}
`

    // Generate response
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    })

    const result = await chat.sendMessage(`${systemPrompt}\n\nUser Question: ${userQuestion}`)
    const response = result.response
    const text = response.text()

    // Check if user has orders for suggested questions
    const hasOrders = userId ? (await fetchUserOrders(userId)).length > 0 : false

    // Generate suggested questions
    const suggestedQuestions =
      knowledgeResults.length > 0 && knowledgeResults[0]
        ? getSuggestedQuestions(knowledgeResults[0].item.category, hasOrders)
        : getDefaultSuggestedQuestions(hasOrders)

    // Calculate confidence
    const confidence =
      knowledgeResults.length > 0 && knowledgeResults[0] ? knowledgeResults[0].relevanceScore : 0.5

    // Fetch products from database for cart action detection
    const allProducts = await fetchProducts()

    // Detect cart actions from AI response and user question
    const cartActions = detectCartActions(text, userQuestion, allProducts, context)

    return apiSuccess({
      message: text,
      confidence,
      suggestedQuestions,
      cartActions,
      metadata: {
        confidence,
        sources: knowledgeResults.length > 0 ? ['Knowledge Base'] : ['General Knowledge'],
        relatedTopics: knowledgeResults
          .map(r => r.item.category)
          .filter((v, i, a) => a.indexOf(v) === i),
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    logger.error('Failed to generate AI response', {
      context: 'AI API',
      error: errorMessage,
      stack: errorStack,
      hasApiKey: !!process.env.GEMINI_API_KEY,
    })
    return apiInternalError('Failed to generate AI response: ' + errorMessage, {
      error: errorMessage,
    })
  }
}

function getSuggestedQuestions(category: string, hasOrders: boolean): string[] {
  const suggestions: Record<string, string[]> = {
    technology: [
      'How does vapor chamber technology work?',
      'What makes two-phase cooling different?',
      'Is it safe for home use?',
    ],
    performance: [
      'What temperature improvements can I expect?',
      'How quiet is the system?',
      'What about power consumption?',
    ],
    environmental: [
      'What is the environmental impact?',
      'How energy efficient are these systems?',
      'What refrigerants are used?',
    ],
    product: [
      'Which product is right for my system?',
      'What is included in the package?',
      'How do I install the cooling system?',
    ],
    orders: [
      "What's the status of my order?",
      'When will my order arrive?',
      'Can I track my shipment?',
    ],
    maintenance: [
      'What maintenance does my system need?',
      'What consumables do I need to buy?',
      'How often should I service my cooling system?',
    ],
  }

  // If user has orders, prioritize order/maintenance suggestions
  if (hasOrders && (category === 'orders' || category === 'maintenance')) {
    return suggestions[category] || getDefaultSuggestedQuestions(hasOrders)
  }

  return suggestions[category] || getDefaultSuggestedQuestions(hasOrders)
}

function getDefaultSuggestedQuestions(hasOrders: boolean = false): string[] {
  if (hasOrders) {
    return [
      'How does two-phase cooling work?',
      "What's the status of my order?",
      'What maintenance does my product need?',
      'What consumables should I stock up on?',
    ]
  }

  return [
    'How does two-phase cooling work?',
    'What products do you offer?',
    'What are the benefits vs traditional cooling?',
    'How much does it cost?',
  ]
}

export const POST = withRateLimit({ id: 'ai-chat' }, handlePOST)
