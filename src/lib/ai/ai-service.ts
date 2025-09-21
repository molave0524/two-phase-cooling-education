/**
 * AI Service with Circuit Breaker Integration
 *
 * Resilient AI assistant service that gracefully handles OpenAI API failures
 * Provides seamless fallback to FAQ responses when AI service is unavailable
 */

import OpenAI from 'openai';
import { CircuitBreaker, DEFAULT_AI_CIRCUIT_CONFIG, CircuitBreakerConfig } from './circuit-breaker';
import { FallbackFAQService, FallbackResponse } from './fallback-faq';
import { logger } from '../monitoring/logger';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface AIResponse {
  content: string;
  role: 'assistant';
  timestamp: number;
  source: 'openai' | 'cached' | 'faq' | 'fallback';
  confidence?: number;
  fallback?: boolean;
  context?: {
    conversationId?: string;
    relatedContent?: {
      videos?: string[];
      faqEntries?: string[];
    };
  };
  metadata?: {
    tokensUsed?: number;
    responseTime?: number;
    modelUsed?: string;
  };
}

export interface AIContext {
  conversationId: string;
  userId?: string;
  currentTopic?: string;
  userLearningLevel?: 'beginner' | 'intermediate' | 'advanced';
  recentVideosWatched?: string[];
  progressData?: {
    completedTopics: string[];
    currentFocus: string;
  };
}

/**
 * Resilient AI service with circuit breaker protection
 */
export class AIService {
  private openai: OpenAI;
  private circuitBreaker: CircuitBreaker;
  private fallbackService: FallbackFAQService;
  private conversationCache = new Map<string, AIMessage[]>();
  private responseCache = new Map<string, AIResponse>();

  constructor(
    apiKey: string,
    circuitConfig: CircuitBreakerConfig = DEFAULT_AI_CIRCUIT_CONFIG
  ) {
    this.openai = new OpenAI({ apiKey });
    this.circuitBreaker = new CircuitBreaker(circuitConfig);
    this.fallbackService = new FallbackFAQService();
  }

  /**
   * Process user message with circuit breaker protection
   */
  async processMessage(
    message: string,
    context: AIContext,
    conversationHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Execute with circuit breaker protection
      const response = await this.circuitBreaker.execute(
        // Primary operation: OpenAI API call
        () => this.callOpenAI(message, context, conversationHistory),
        // Fallback operation: FAQ search
        () => this.getFallbackResponse(message, context)
      );

      // Cache successful AI responses for future fallback use
      if (response.source === 'openai') {
        this.cacheResponse(message, response);
        this.fallbackService.cacheAIResponse(message, response.content);
      }

      // Update conversation history
      this.updateConversationHistory(context.conversationId, [
        { role: 'user', content: message, timestamp: startTime },
        { role: 'assistant', content: response.content, timestamp: response.timestamp }
      ]);

      return response;

    } catch (error) {
      logger.error('AI service error', error as Error, { context, message });
      return this.getEmergencyFallback(message);
    }
  }

  /**
   * Call OpenAI API with proper error handling
   */
  private async callOpenAI(
    message: string,
    context: AIContext,
    conversationHistory: AIMessage[]
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = this.buildMessageHistory(systemPrompt, conversationHistory, message);

    const startTime = Date.now();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      temperature: 0.3,
      max_tokens: 1000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const responseTime = Date.now() - startTime;
    const choice = completion.choices[0];

    if (!choice?.message?.content) {
      throw new Error('Empty response from OpenAI');
    }

    return {
      content: choice.message.content,
      role: 'assistant',
      timestamp: Date.now(),
      source: 'openai',
      confidence: 1,
      context: {
        conversationId: context.conversationId,
        relatedContent: await this.findRelatedContent(message)
      },
      metadata: {
        tokensUsed: completion.usage?.total_tokens,
        responseTime,
        modelUsed: completion.model
      }
    };
  }

  /**
   * Get fallback response using FAQ service
   */
  private async getFallbackResponse(message: string, context: AIContext): Promise<AIResponse> {
    // Try cached response first
    const cached = this.getCachedResponse(message);
    if (cached) {
      return {
        ...cached,
        timestamp: Date.now(),
        context: { conversationId: context.conversationId }
      };
    }

    // Use FAQ service
    const faqResponse = await this.fallbackService.searchFAQ(message);

    return {
      content: faqResponse.content,
      role: 'assistant',
      timestamp: Date.now(),
      source: faqResponse.source as any,
      confidence: faqResponse.confidence,
      fallback: true,
      context: {
        conversationId: context.conversationId,
        relatedContent: faqResponse.relatedContent
      }
    };
  }

  /**
   * Build system prompt based on context
   */
  private buildSystemPrompt(context: AIContext): string {
    const basePrompt = `You are a technical expert specializing in two-phase cooling technology for high-performance computing. You help enthusiasts understand advanced cooling science and make informed decisions.

Key areas of expertise:
- Two-phase cooling principles and science
- Thermal management for modern CPUs and GPUs
- Comparison with air cooling and traditional liquid cooling
- Safety and environmental considerations
- Installation and troubleshooting guidance

Response guidelines:
- Provide accurate, technical information in accessible language
- Reference specific examples (i9-14900KS, RTX 4090, etc.) when relevant
- Explain the science behind cooling performance
- Be honest about complexity and limitations
- Encourage further learning through videos and documentation`;

    // Customize based on user context
    if (context.userLearningLevel) {
      return `${basePrompt}\n\nUser skill level: ${context.userLearningLevel}. Adjust technical depth accordingly.`;
    }

    if (context.currentTopic) {
      return `${basePrompt}\n\nCurrent focus topic: ${context.currentTopic}. Prioritize information relevant to this topic.`;
    }

    return basePrompt;
  }

  /**
   * Build message history for OpenAI
   */
  private buildMessageHistory(
    systemPrompt: string,
    history: AIMessage[],
    newMessage: string
  ): AIMessage[] {
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add relevant conversation history (last 10 messages)
    const recentHistory = history.slice(-10);
    messages.push(...recentHistory);

    // Add new user message
    messages.push({ role: 'user', content: newMessage });

    return messages;
  }

  /**
   * Find related content for the user's question
   */
  private async findRelatedContent(message: string): Promise<{ videos?: string[]; faqEntries?: string[] }> {
    // This would integrate with your video catalog and FAQ system
    // For now, return some example related content
    const keywords = message.toLowerCase();

    const relatedVideos: string[] = [];
    const relatedFAQs: string[] = [];

    if (keywords.includes('two-phase') || keywords.includes('cooling')) {
      relatedVideos.push('intro-to-two-phase', 'cooling-comparison');
      relatedFAQs.push('faq-001', 'faq-002');
    }

    if (keywords.includes('safety') || keywords.includes('safe')) {
      relatedVideos.push('safety-demonstration');
      relatedFAQs.push('faq-004');
    }

    if (keywords.includes('install') || keywords.includes('setup')) {
      relatedVideos.push('installation-guide');
      relatedFAQs.push('faq-006', 'faq-007');
    }

    return {
      videos: relatedVideos.length > 0 ? relatedVideos : undefined,
      faqEntries: relatedFAQs.length > 0 ? relatedFAQs : undefined
    };
  }

  /**
   * Cache successful responses for fallback use
   */
  private cacheResponse(question: string, response: AIResponse): void {
    const cacheKey = this.normalizeText(question);
    this.responseCache.set(cacheKey, response);

    // Limit cache size
    if (this.responseCache.size > 1000) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  /**
   * Get cached response if available
   */
  private getCachedResponse(question: string): AIResponse | null {
    const cacheKey = this.normalizeText(question);
    return this.responseCache.get(cacheKey) || null;
  }

  /**
   * Update conversation history
   */
  private updateConversationHistory(conversationId: string, messages: AIMessage[]): void {
    const existing = this.conversationCache.get(conversationId) || [];
    const updated = [...existing, ...messages];

    // Keep last 50 messages per conversation
    if (updated.length > 50) {
      updated.splice(0, updated.length - 50);
    }

    this.conversationCache.set(conversationId, updated);
  }

  /**
   * Get emergency fallback when all else fails
   */
  private getEmergencyFallback(message: string): AIResponse {
    return {
      content: "I'm experiencing technical difficulties and can't process your question right now. Please try browsing our video library for comprehensive information about two-phase cooling, or visit our FAQ section for answers to common questions. You can also try asking again in a few minutes.",
      role: 'assistant',
      timestamp: Date.now(),
      source: 'fallback',
      confidence: 0,
      fallback: true,
      context: {
        relatedContent: {
          videos: ['intro-to-two-phase', 'cooling-comparison', 'safety-demonstration'],
          faqEntries: ['faq-001', 'faq-002', 'faq-004']
        }
      }
    };
  }

  /**
   * Normalize text for caching
   */
  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics() {
    return {
      circuitBreaker: this.circuitBreaker.getMetrics(),
      cache: {
        conversationCache: this.conversationCache.size,
        responseCache: this.responseCache.size
      }
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): AIMessage[] {
    return this.conversationCache.get(conversationId) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversationCache.delete(conversationId);
  }

  /**
   * Reset circuit breaker (for testing/admin)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}