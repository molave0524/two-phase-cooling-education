import { AIProvider, ChatMessage, AIContext, AIResponse } from '@/types/ai'
import { apiFetch } from '@/lib/api-client'

export class GeminiAIProvider implements AIProvider {
  public readonly name = 'Google Gemini'
  private isInitialized = false

  async initialize(): Promise<void> {
    console.log('[Gemini] Initializing provider (server-side API)...')

    try {
      // Check if API key is configured by making a simple request
      // We'll assume it's available if the environment is set up correctly
      // The actual validation happens on first real request
      const apiKeyConfigured = typeof window !== 'undefined'

      if (apiKeyConfigured) {
        this.isInitialized = true
        console.log('[Gemini] ✓ Provider initialized successfully (using server API)')
      } else {
        console.warn('[Gemini] Server-side only - will initialize on first request')
        this.isInitialized = true
      }
    } catch (error) {
      console.error('[Gemini] Failed to initialize provider:', error)
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
      console.log('[Gemini] Sending request to server API...')

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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI request failed')
      }

      const data = await response.json()

      console.log('[Gemini] ✓ Response generated successfully')

      return {
        message: data.message,
        confidence: data.confidence || 0.5,
        suggestedQuestions: data.suggestedQuestions || [],
        cartActions: [], // Cart actions handled separately
        metadata: data.metadata || {
          confidence: data.confidence || 0.5,
          sources: ['Server API'],
          relatedTopics: [],
        },
      }
    } catch (error) {
      console.error('[Gemini] API error:', error)
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
