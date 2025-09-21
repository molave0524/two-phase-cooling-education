/**
 * React Hook for AI Assistant with Circuit Breaker
 *
 * Provides React integration for the resilient AI service
 * Handles state management, error handling, and user experience
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AIService, AIResponse, AIMessage, AIContext } from '@/lib/ai/ai-service';
import { CircuitState } from '@/lib/ai/circuit-breaker';

export interface UseAIAssistantOptions {
  conversationId: string;
  userId?: string;
  userLearningLevel?: 'beginner' | 'intermediate' | 'advanced';
  currentTopic?: string;
  autoSaveHistory?: boolean;
}

export interface AIAssistantState {
  messages: AIMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  isAIAvailable: boolean;
  circuitState: CircuitState;
  lastResponse: AIResponse | null;
  metrics: {
    totalQuestions: number;
    fallbackResponses: number;
    averageResponseTime: number;
  };
}

export interface AIAssistantActions {
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  resetCircuitBreaker: () => void;
  retryLastMessage: () => Promise<void>;
  setContext: (context: Partial<AIContext>) => void;
}

/**
 * Custom hook for AI Assistant functionality
 */
export function useAIAssistant(
  options: UseAIAssistantOptions
): AIAssistantState & AIAssistantActions {
  const aiServiceRef = useRef<AIService | null>(null);
  const [context, setContextState] = useState<AIContext>({
    conversationId: options.conversationId,
    userId: options.userId,
    userLearningLevel: options.userLearningLevel,
    currentTopic: options.currentTopic
  });

  const [state, setState] = useState<AIAssistantState>({
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null,
    isAIAvailable: true,
    circuitState: CircuitState.CLOSED,
    lastResponse: null,
    metrics: {
      totalQuestions: 0,
      fallbackResponses: 0,
      averageResponseTime: 0
    }
  });

  const [lastMessage, setLastMessage] = useState<string>('');

  // Initialize AI service
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found');
      setState(prev => ({
        ...prev,
        error: 'AI service configuration error',
        isAIAvailable: false
      }));
      return;
    }

    aiServiceRef.current = new AIService(apiKey);

    // Load conversation history if auto-save is enabled
    if (options.autoSaveHistory) {
      loadConversationHistory();
    }
  }, [options.conversationId, options.autoSaveHistory]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (aiServiceRef.current) {
        const metrics = aiServiceRef.current.getMetrics();
        setState(prev => ({
          ...prev,
          circuitState: metrics.circuitBreaker.currentState,
          isAIAvailable: metrics.circuitBreaker.currentState !== CircuitState.OPEN,
          metrics: {
            totalQuestions: metrics.circuitBreaker.totalRequests,
            fallbackResponses: metrics.circuitBreaker.fallbackResponses,
            averageResponseTime: metrics.circuitBreaker.averageResponseTime
          }
        }));
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!aiServiceRef.current || !message.trim()) return;

    setLastMessage(message);
    setState(prev => ({
      ...prev,
      isLoading: true,
      isTyping: true,
      error: null
    }));

    // Add user message to chat immediately
    const userMessage: AIMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    try {
      const startTime = Date.now();
      const response = await aiServiceRef.current.processMessage(
        message.trim(),
        context,
        state.messages
      );

      const responseTime = Date.now() - startTime;

      // Add AI response to chat
      const aiMessage: AIMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
        isTyping: false,
        lastResponse: response,
        metrics: {
          ...prev.metrics,
          averageResponseTime: (prev.metrics.averageResponseTime + responseTime) / 2
        }
      }));

      // Save to local storage if auto-save enabled
      if (options.autoSaveHistory) {
        saveConversationHistory([...state.messages, userMessage, aiMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isTyping: false,
        error: 'Failed to send message. Please try again.'
      }));
    }
  }, [context, state.messages, options.autoSaveHistory]);

  /**
   * Clear the conversation
   */
  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
      lastResponse: null
    }));

    if (aiServiceRef.current) {
      aiServiceRef.current.clearConversation(options.conversationId);
    }

    if (options.autoSaveHistory) {
      localStorage.removeItem(`ai-conversation-${options.conversationId}`);
    }
  }, [options.conversationId, options.autoSaveHistory]);

  /**
   * Reset the circuit breaker
   */
  const resetCircuitBreaker = useCallback(() => {
    if (aiServiceRef.current) {
      aiServiceRef.current.resetCircuitBreaker();
      setState(prev => ({
        ...prev,
        circuitState: CircuitState.CLOSED,
        isAIAvailable: true,
        error: null
      }));
    }
  }, []);

  /**
   * Retry the last message
   */
  const retryLastMessage = useCallback(async () => {
    if (lastMessage) {
      await sendMessage(lastMessage);
    }
  }, [lastMessage, sendMessage]);

  /**
   * Update AI context
   */
  const setContext = useCallback((newContext: Partial<AIContext>) => {
    setContextState(prev => ({ ...prev, ...newContext }));
  }, []);

  /**
   * Load conversation history from local storage
   */
  const loadConversationHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem(`ai-conversation-${options.conversationId}`);
      if (saved) {
        const messages = JSON.parse(saved) as AIMessage[];
        setState(prev => ({ ...prev, messages }));
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }, [options.conversationId]);

  /**
   * Save conversation history to local storage
   */
  const saveConversationHistory = useCallback((messages: AIMessage[]) => {
    try {
      localStorage.setItem(
        `ai-conversation-${options.conversationId}`,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }, [options.conversationId]);

  return {
    // State
    ...state,

    // Actions
    sendMessage,
    clearConversation,
    resetCircuitBreaker,
    retryLastMessage,
    setContext
  };
}

/**
 * Helper hook for circuit breaker status
 */
export function useCircuitBreakerStatus(aiService: AIService | null) {
  const [status, setStatus] = useState({
    state: CircuitState.CLOSED,
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackResponses: 0,
      circuitBreakerTrips: 0
    }
  });

  useEffect(() => {
    if (!aiService) return;

    const interval = setInterval(() => {
      const metrics = aiService.getMetrics();
      setStatus({
        state: metrics.circuitBreaker.currentState,
        metrics: metrics.circuitBreaker
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [aiService]);

  return status;
}