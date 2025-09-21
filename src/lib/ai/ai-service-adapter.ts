// AI Service Adapter
// Two-Phase Cooling Education Center
//
// Adapter to integrate the existing AI service with the new AIAssistant component

import { AIService, AIResponse, AIContext, AIMessage } from './ai-service'
import { CircuitState } from './circuit-breaker'

// ============================================================================
// ADAPTER CLASS
// ============================================================================

export class AIServiceAdapter {
  private aiService: AIService
  private sessionId: string

  constructor(apiKey: string, sessionId?: string) {
    this.aiService = new AIService(apiKey)
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ============================================================================
  // MAIN INTERFACE METHODS
  // ============================================================================

  /**
   * Get general cooling advice
   */
  async getCoolingAdvice(
    question: string,
    conversationHistory: { role: string; content: string }[] = []
  ): Promise<string> {
    const context: AIContext = {
      conversationId: this.sessionId,
      currentTopic: 'general-cooling',
      userLearningLevel: 'intermediate', // Default to intermediate
    }

    const history: AIMessage[] = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: Date.now(),
    }))

    const response = await this.aiService.processMessage(question, context, history)
    return response.content
  }

  /**
   * Get video-specific advice
   */
  async getVideoSpecificAdvice(
    question: string,
    videoId: string,
    conversationHistory: { role: string; content: string }[] = []
  ): Promise<string> {
    const context: AIContext = {
      conversationId: this.sessionId,
      currentTopic: 'video-specific',
      userLearningLevel: 'intermediate',
      recentVideosWatched: [videoId],
    }

    const history: AIMessage[] = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: Date.now(),
    }))

    const response = await this.aiService.processMessage(question, context, history)
    return response.content
  }

  /**
   * Get product advice
   */
  async getProductAdvice(
    question: string,
    conversationHistory: { role: string; content: string }[] = []
  ): Promise<string> {
    const context: AIContext = {
      conversationId: this.sessionId,
      currentTopic: 'product-inquiry',
      userLearningLevel: 'intermediate',
    }

    const history: AIMessage[] = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: Date.now(),
    }))

    const response = await this.aiService.processMessage(question, context, history)
    return response.content
  }

  // ============================================================================
  // CIRCUIT BREAKER INTERFACE
  // ============================================================================

  /**
   * Get circuit breaker state for UI display
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    const metrics = this.aiService.getMetrics()
    return metrics.circuitBreaker.currentState
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.getState() === 'CLOSED'
  }

  /**
   * Check if in fallback mode
   */
  isFallbackMode(): boolean {
    return this.getState() === 'OPEN'
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return this.aiService.getMetrics()
  }

  /**
   * Reset circuit breaker (admin function)
   */
  resetCircuitBreaker(): void {
    this.aiService.resetCircuitBreaker()
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  /**
   * Get conversation history
   */
  getConversationHistory(): AIMessage[] {
    return this.aiService.getConversationHistory(this.sessionId)
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.aiService.clearConversation(this.sessionId)
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create AI service adapter instance
 */
export function createAIServiceAdapter(sessionId?: string): AIServiceAdapter {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  return new AIServiceAdapter(apiKey, sessionId)
}