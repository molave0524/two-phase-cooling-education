import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, ChatMessage, AIContext, AIResponse } from '@/types/ai'
import { knowledgeBase } from '@/services/ai/KnowledgeBase'

export class GeminiAIProvider implements AIProvider {
  public readonly name = 'Google Gemini'
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null
  private isInitialized = false

  async initialize(): Promise<void> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    console.log('[Gemini] Initializing provider...')
    console.log('[Gemini] API key present:', !!apiKey)
    console.log('[Gemini] API key length:', apiKey?.length || 0)

    if (!apiKey) {
      console.warn('[Gemini] API key not found. Provider will not be available.')
      return
    }

    try {
      console.log('[Gemini] Creating GoogleGenerativeAI instance...')
      this.genAI = new GoogleGenerativeAI(apiKey)

      console.log('[Gemini] Getting generative model (gemini-2.5-flash)...')
      // Using Gemini 2.5 Flash - free tier, fast, good quality
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      console.log('[Gemini] Initializing knowledge base...')
      // Initialize knowledge base
      await knowledgeBase.initialize()

      this.isInitialized = true
      console.log('[Gemini] ✓ Provider initialized successfully')
    } catch (error) {
      console.error('[Gemini] Failed to initialize provider:', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && this.model !== null
  }

  async generateResponse(messages: ChatMessage[], context: AIContext): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini provider not initialized')
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('No user message found')
    }

    const userQuestion = lastMessage.content

    // Search knowledge base for relevant FAQs
    const knowledgeResults = knowledgeBase.search(userQuestion, {
      maxResults: 5,
      minScore: 0.1,
    })

    // Build context from FAQ results
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
      context.cartItems && context.cartItems.length > 0
        ? `\n\nCurrent Shopping Cart:
${context.cartItems.map(item => `- ${item.productName} (Qty: ${item.quantity}, Price: $${item.price})`).join('\n')}
Total Items: ${context.cartItems.length}
Total Value: $${context.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
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
  .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
  .join('\n')}
`

    try {
      console.log('[Gemini] Starting chat session...')
      // Generate response
      const chat = this.model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
      })

      console.log('[Gemini] Sending message to API...')
      const result = await chat.sendMessage(`${systemPrompt}\n\nUser Question: ${userQuestion}`)
      console.log('[Gemini] Received response from API')

      const response = result.response
      const text = response.text()

      // Parse for potential cart actions (simple detection)
      const cartActions = this.detectCartActions(text, userQuestion)

      // Generate suggested questions based on FAQ category
      const suggestedQuestions =
        knowledgeResults.length > 0 && knowledgeResults[0]
          ? this.getSuggestedQuestions(knowledgeResults[0].item.category)
          : this.getDefaultSuggestedQuestions()

      console.log('[Gemini] ✓ Response generated successfully')
      return {
        message: text,
        confidence:
          knowledgeResults.length > 0 && knowledgeResults[0]
            ? knowledgeResults[0].relevanceScore
            : 0.5,
        suggestedQuestions,
        cartActions,
        metadata: {
          confidence:
            knowledgeResults.length > 0 && knowledgeResults[0]
              ? knowledgeResults[0].relevanceScore
              : 0.5,
          sources: knowledgeResults.length > 0 ? ['Knowledge Base'] : ['General Knowledge'],
          relatedTopics: knowledgeResults
            .map(r => r.item.category)
            .filter((v, i, a) => a.indexOf(v) === i),
        },
      }
    } catch (error) {
      console.error('[Gemini] API error details:', error)
      if (error instanceof Error) {
        console.error('[Gemini] Error message:', error.message)
        console.error('[Gemini] Error stack:', error.stack)
      }
      throw new Error(
        `Failed to generate response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private detectCartActions(aiResponse: string, userQuestion: string): any[] {
    const actions: any[] = []
    const lowerResponse = aiResponse.toLowerCase()
    const lowerQuestion = userQuestion.toLowerCase()

    // Simple detection - in real implementation, Gemini would use function calling
    // For now, just detect if AI suggests adding a product
    if (
      (lowerResponse.includes('add') || lowerResponse.includes('recommend')) &&
      (lowerResponse.includes('cart') ||
        lowerQuestion.includes('buy') ||
        lowerQuestion.includes('purchase'))
    ) {
      // This is a simplified version - you'd want to parse product IDs from the response
      // For now, we'll let the Mock provider handle cart actions
      return []
    }

    return actions
  }

  private getSuggestedQuestions(category: string): string[] {
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

    return suggestions[category] || this.getDefaultSuggestedQuestions()
  }

  private getDefaultSuggestedQuestions(): string[] {
    return [
      'How does two-phase cooling work?',
      'What products do you offer?',
      'What are the benefits vs traditional cooling?',
      'How much does it cost?',
    ]
  }

  getCostEstimate(messages: ChatMessage[]): number {
    // Gemini Flash is free for first 1500 requests/day
    // After that: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    // Average conversation: ~500 input + 300 output tokens
    const estimatedInputTokens = messages.reduce((sum, m) => sum + m.content.length / 4, 0)
    const estimatedOutputTokens = 300

    // Cost in dollars (usually $0 due to free tier)
    const cost = (estimatedInputTokens / 1000000) * 0.075 + (estimatedOutputTokens / 1000000) * 0.3
    return cost
  }
}
