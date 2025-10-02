import { AIProvider, ChatMessage, AIContext, AIResponse } from '@/types/ai'
import { apiFetch } from '@/lib/api-client'
import { logger } from '@/lib/logger'

export class GeminiAIProvider implements AIProvider {
  public readonly name = 'Google Gemini'
  private isInitialized = false

  async initialize(): Promise<void> {
    logger.debug('Initializing Gemini provider (server-side API)')

    try {
      // Server-side API handles all API key validation
      // Client just needs to make requests to /api/ai/chat
      this.isInitialized = true
      logger.info('Gemini provider initialized successfully (using server API)')
    } catch (error) {
      logger.error('Failed to initialize Gemini provider', error)
    }
  }

  isAvailable(): boolean {
    return this.isInitialized
  }

  async generateResponse(messages: ChatMessage[], context: AIContext): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini provider not initialized')
    }

    try {
      logger.debug('Sending request to Gemini server API')

      // Call server-side API with CSRF protection
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          context,
        }),
      })

      const result = await response.json()

      // Handle new standardized API response format
      if (!result.success || !result.data) {
        const errorMessage = result.error?.message || 'AI request failed'
        throw new Error(errorMessage)
      }

      const data = result.data

      logger.debug('Gemini response generated successfully')

      return {
        message: data.message,
        confidence: data.confidence || 0.5,
        suggestedQuestions: data.suggestedQuestions || [],
        cartActions: data.cartActions || [],
        metadata: data.metadata || {
          confidence: data.confidence || 0.5,
          sources: ['Server API'],
          relatedTopics: [],
        },
      }
    } catch (error) {
      logger.error('Gemini API error', error)
      throw new Error(
        `Failed to generate response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
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
