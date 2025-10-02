/**
 * AI Chat API Route - Server-side Gemini Integration
 * Handles AI chat requests with server-side API key protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { knowledgeBase } from '@/services/ai/KnowledgeBase'
import { sanitizeChatMessage } from '@/lib/sanitize'
import { withRateLimit } from '@/lib/with-rate-limit'

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

async function handlePOST(request: NextRequest) {
  try {
    // Get server-side API key (not exposed to client)
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('[AI API] Gemini API key not configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { messages, context } = body

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 })
    }

    // Sanitize user input to prevent XSS
    const userQuestion = sanitizeChatMessage(lastMessage.content)

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
${context.cartItems.map((item: any) => `- ${item.productName} (Qty: ${item.quantity}, Price: $${item.price})`).join('\n')}
Total Items: ${context.cartItems.length}
Total Value: $${context.cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0).toFixed(2)}
`
        : '\n\nShopping cart is currently empty.'

    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for a two-phase cooling technology company.

Your role:
- Answer questions about two-phase cooling technology
- Recommend products based on customer needs
- Help customers with their shopping cart
- Provide technical support and education

IMPORTANT INSTRUCTIONS:
1. Base your answers primarily on the FAQ content provided below
2. If the FAQ doesn't contain the answer, use your general knowledge about cooling systems
3. Be concise and friendly
4. When recommending products, explain why they're suitable
5. If asked about cart actions (add/remove items), suggest them but ALWAYS mention the user needs to confirm

Available FAQ Knowledge:
${faqContext}

${cartContext}

Conversation History:
${messages
  .slice(0, -1)
  .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
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

    // Generate suggested questions
    const suggestedQuestions =
      knowledgeResults.length > 0 && knowledgeResults[0]
        ? getSuggestedQuestions(knowledgeResults[0].item.category)
        : getDefaultSuggestedQuestions()

    // Calculate confidence
    const confidence =
      knowledgeResults.length > 0 && knowledgeResults[0] ? knowledgeResults[0].relevanceScore : 0.5

    return NextResponse.json({
      message: text,
      confidence,
      suggestedQuestions,
      metadata: {
        confidence,
        sources: knowledgeResults.length > 0 ? ['Knowledge Base'] : ['General Knowledge'],
        relatedTopics: knowledgeResults
          .map(r => r.item.category)
          .filter((v, i, a) => a.indexOf(v) === i),
      },
    })
  } catch (error) {
    console.error('[AI API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function getSuggestedQuestions(category: string): string[] {
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
  }

  return suggestions[category] || getDefaultSuggestedQuestions()
}

function getDefaultSuggestedQuestions(): string[] {
  return [
    'How does two-phase cooling work?',
    'What products do you offer?',
    'What are the benefits vs traditional cooling?',
    'How much does it cost?',
  ]
}

export const POST = withRateLimit({ id: 'ai-chat' }, handlePOST)
