import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4000),
  timestamp: z.string().datetime().optional()
})

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationHistory: z.array(ChatMessageSchema).max(20).optional(),
  userId: z.string().uuid().optional(),
  context: z.object({
    currentVideo: z.string().optional(),
    userProgress: z.object({
      completedVideos: z.number().optional(),
      currentLevel: z.string().optional()
    }).optional(),
    hardwareContext: z.object({
      cpu: z.string().optional(),
      gpu: z.string().optional(),
      useCase: z.string().optional()
    }).optional()
  }).optional()
})

// ============================================================================
// AI CONFIGURATION
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const SYSTEM_PROMPT = `You are a knowledgeable AI assistant specializing in two-phase cooling technology for the Two-Phase Cooling Education Center. Your role is to help users understand:

1. Two-Phase Cooling Technology:
   - Basic principles of phase change cooling
   - Heat transfer mechanisms and efficiency
   - Environmental benefits (GWP 20, Zero ODP)
   - Performance advantages over traditional cooling

2. Technical Specifications:
   - Thermal performance characteristics
   - Compatibility with various hardware configurations
   - Installation and maintenance requirements
   - Safety considerations and certifications

3. Educational Guidance:
   - Learning path recommendations
   - Concept explanations at appropriate levels
   - Practical applications and use cases
   - Performance optimization tips

4. Product Information:
   - Computer case specifications and features
   - Educational kit contents and applications
   - Pricing and availability information
   - Technical support and warranty details

Communication Guidelines:
- Be educational and informative, not sales-focused
- Use clear, accessible language while maintaining technical accuracy
- Provide specific, actionable guidance when possible
- Reference real performance data and scientific principles
- Suggest relevant educational content and demonstrations
- Always prioritize user learning and understanding

When discussing environmental impact, emphasize:
- GWP rating of 20 (equivalent to gasoline)
- Zero ODP (ozone depletion potential)
- 98.6% reduction in environmental impact vs traditional refrigerants
- Superior performance with minimal ecological footprint

For technical questions, consider:
- User's hardware configuration and requirements
- Performance expectations and use cases
- Installation complexity and space requirements
- Compatibility with existing systems
- Maintenance and long-term reliability

Always maintain a helpful, educational tone focused on empowering users with knowledge rather than pushing products.`

// ============================================================================
// FALLBACK FAQ SYSTEM
// ============================================================================

const FAQ_RESPONSES = {
  'two-phase cooling': 'Two-phase cooling uses the phase change from liquid to vapor to transfer heat more efficiently than traditional cooling methods. The process leverages the latent heat of vaporization, providing superior thermal performance with minimal energy consumption.',

  'environmental impact': 'Our cooling fluid has a Global Warming Potential (GWP) of 20, equivalent to gasoline, and zero Ozone Depletion Potential (ODP). This represents a 98.6% reduction in environmental impact compared to traditional refrigerants.',

  'performance comparison': 'Two-phase cooling achieves 47% lower peak temperatures, 33% higher thermal efficiency, and 60% quieter operation compared to traditional air cooling systems, while maintaining superior performance under sustained loads.',

  'compatibility': 'Our cases support standard ATX, Micro-ATX, and Mini-ITX motherboards, with compatibility for all major CPU and GPU configurations. The system can handle up to 850W of thermal load.',

  'installation': 'Installation is straightforward with our guided setup process. The system includes pre-filled cooling fluid, transparent monitoring panels, and comprehensive documentation for safe installation.',

  'maintenance': 'Two-phase cooling requires minimal maintenance compared to traditional liquid cooling. No pump maintenance is needed, and the sealed system design ensures long-term reliability with periodic visual inspections.',

  'safety': 'Our cooling fluid is non-toxic, non-flammable, and safe for home use. The system includes multiple safety features, transparent design for visual monitoring, and meets all relevant safety certifications.',

  'learning resources': 'We offer structured learning paths for enthusiasts, students, and professionals, including interactive video demonstrations, educational kits, and comprehensive documentation covering thermal dynamics principles.'
}

function findFallbackResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase()

  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (lowerMessage.includes(keyword.replace('-', ' '))) {
      return response
    }
  }

  return null
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)

  if (!userLimit || now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  userLimit.count++
  return true
}

// ============================================================================
// POST - Chat with AI Assistant
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = ChatRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { message, conversationHistory = [], userId, context } = validation.data

    // Rate limiting
    const identifier = userId || request.ip || 'anonymous'
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending another message.' },
        { status: 429 }
      )
    }

    // Check if OpenAI is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not available, using fallback response')
      const fallbackResponse = findFallbackResponse(message)

      if (fallbackResponse) {
        return NextResponse.json({
          success: true,
          response: fallbackResponse,
          fallback: true,
          message: 'Response generated from knowledge base (AI assistant temporarily unavailable)'
        })
      }

      return NextResponse.json({
        success: true,
        response: "I apologize, but I'm currently experiencing technical difficulties. Please try asking about two-phase cooling basics, environmental impact, performance comparisons, or check our FAQ section for immediate assistance.",
        fallback: true,
        message: 'AI assistant temporarily unavailable'
      })
    }

    try {
      // Prepare conversation for OpenAI
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT }
      ]

      // Add context if provided
      if (context) {
        let contextMessage = 'Additional context: '
        if (context.currentVideo) {
          contextMessage += `User is currently watching: ${context.currentVideo}. `
        }
        if (context.userProgress) {
          contextMessage += `User progress: ${context.userProgress.completedVideos || 0} videos completed, level: ${context.userProgress.currentLevel || 'beginner'}. `
        }
        if (context.hardwareContext) {
          contextMessage += `Hardware context: CPU: ${context.hardwareContext.cpu || 'not specified'}, GPU: ${context.hardwareContext.gpu || 'not specified'}, Use case: ${context.hardwareContext.useCase || 'not specified'}. `
        }

        messages.push({ role: 'system', content: contextMessage })
      }

      // Add conversation history
      conversationHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content })
        }
      })

      // Add current message
      messages.push({ role: 'user', content: message })

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      const response = completion.choices[0]?.message?.content

      if (!response) {
        throw new Error('No response from OpenAI')
      }

      return NextResponse.json({
        success: true,
        response,
        usage: completion.usage,
        model: completion.model
      })

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError)

      // Fallback to FAQ system
      const fallbackResponse = findFallbackResponse(message)

      if (fallbackResponse) {
        return NextResponse.json({
          success: true,
          response: fallbackResponse,
          fallback: true,
          message: 'Response generated from knowledge base (AI assistant temporarily unavailable)'
        })
      }

      return NextResponse.json({
        success: false,
        error: 'AI assistant temporarily unavailable',
        fallback: true,
        response: "I'm currently experiencing technical difficulties. Please try asking about two-phase cooling basics, environmental impact, performance comparisons, or visit our educational resources section."
      })
    }

  } catch (error) {
    console.error('Error in AI chat endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Health check and FAQ
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'faq') {
    return NextResponse.json({
      faqs: Object.entries(FAQ_RESPONSES).map(([topic, answer]) => ({
        topic: topic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        answer
      }))
    })
  }

  if (action === 'health') {
    return NextResponse.json({
      status: 'healthy',
      openaiAvailable: !!process.env.OPENAI_API_KEY,
      fallbackEnabled: true,
      rateLimit: {
        window: RATE_LIMIT_WINDOW,
        maxRequests: RATE_LIMIT_MAX_REQUESTS
      }
    })
  }

  return NextResponse.json({
    message: 'AI Chat API - Use POST to send messages, GET with ?action=faq for FAQ, or ?action=health for status'
  })
}