import {
  AIProvider,
  AIProviderType,
  AIConfiguration,
  ChatMessage,
  AIContext,
  AIResponse,
} from '@/types/ai'
import { MockAIProvider } from './providers/MockAIProvider'
import { GeminiAIProvider } from './providers/GeminiAIProvider'

class AIService {
  private currentProvider: AIProvider | null = null
  private config: AIConfiguration = {
    provider: 'gemini', // Default to Gemini, fallback to Mock if no API key
    temperature: 0.7,
    maxTokens: 500,
  }

  /**
   * Initialize the AI service with a specific provider
   */
  async initialize(config?: Partial<AIConfiguration>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config }
    }

    try {
      this.currentProvider = this.createProvider(this.config.provider)
      await this.currentProvider.initialize()

      // If Gemini provider failed to initialize (no API key), fallback to Mock
      if (!this.currentProvider.isAvailable() && this.config.provider === 'gemini') {
        console.warn(
          'Gemini provider not available (likely missing API key). Falling back to Mock provider.'
        )
        this.config.provider = 'mock'
        this.currentProvider = this.createProvider('mock')
        await this.currentProvider.initialize()
      }

      console.log(`AI Service initialized with provider: ${this.currentProvider.name}`)
    } catch (error) {
      console.error('Failed to initialize AI provider:', error)
      // Fallback to mock on any error
      console.warn('Falling back to Mock provider due to initialization error')
      this.config.provider = 'mock'
      this.currentProvider = this.createProvider('mock')
      await this.currentProvider.initialize()
    }
  }

  /**
   * Switch to a different AI provider
   */
  async switchProvider(
    providerType: AIProviderType,
    config?: Partial<AIConfiguration>
  ): Promise<void> {
    const newConfig: AIConfiguration = {
      ...this.config,
      provider: providerType,
      ...config,
    }

    const newProvider = this.createProvider(providerType)
    await newProvider.initialize()

    this.currentProvider = newProvider
    this.config = newConfig
  }

  /**
   * Generate AI response
   */
  async generateResponse(messages: ChatMessage[], context: AIContext): Promise<AIResponse> {
    if (!this.currentProvider) {
      throw new Error('AI Service not initialized. Call initialize() first.')
    }

    if (!this.currentProvider.isAvailable()) {
      throw new Error(`${this.currentProvider.name} is not available`)
    }

    try {
      return await this.currentProvider.generateResponse(messages, context)
    } catch (error) {
      console.error('AI Provider error:', error)

      // Fallback to mock provider if current provider fails
      if (this.config.provider !== 'mock') {
        console.warn('Falling back to mock provider due to error')
        await this.switchProvider('mock')
        return await this.currentProvider!.generateResponse(messages, context)
      }

      throw error
    }
  }

  /**
   * Get current provider info
   */
  getProviderInfo(): { name: string; type: AIProviderType; isAvailable: boolean } | null {
    if (!this.currentProvider) {
      return null
    }

    return {
      name: this.currentProvider.name,
      type: this.config.provider,
      isAvailable: this.currentProvider.isAvailable(),
    }
  }

  /**
   * Get cost estimate for a conversation
   */
  getCostEstimate(messages: ChatMessage[]): number {
    if (!this.currentProvider || !this.currentProvider.getCostEstimate) {
      return 0
    }

    return this.currentProvider.getCostEstimate(messages)
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.currentProvider !== null && this.currentProvider.isAvailable()
  }

  /**
   * Get current configuration
   */
  getConfiguration(): AIConfiguration {
    return { ...this.config }
  }

  /**
   * Create provider instance based on type
   */
  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case 'mock':
        return new MockAIProvider()

      case 'gemini':
        return new GeminiAIProvider()

      case 'openai':
        // TODO: Implement OpenAIProvider
        throw new Error('OpenAI provider not yet implemented. Use gemini or mock provider for now.')

      case 'local':
        // TODO: Implement LocalLLMProvider
        throw new Error(
          'Local LLM provider not yet implemented. Use gemini or mock provider for now.'
        )

      default:
        throw new Error(`Unknown provider type: ${type}`)
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.currentProvider = null
  }
}

// Export singleton instance
export const aiService = new AIService()

// Export class for testing or multiple instances if needed
export { AIService }
