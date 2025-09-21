/**
 * AI Assistant Component with Circuit Breaker UI
 *
 * Provides a complete AI chat interface with graceful degradation
 * Shows appropriate UI states based on circuit breaker status
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, RefreshCw, HelpCircle, Video, FileText } from 'lucide-react';
import { useAIAssistant } from '@/hooks/use-ai-assistant';
import { CircuitState } from '@/lib/ai/circuit-breaker';

interface AIAssistantProps {
  conversationId: string;
  userId?: string;
  userLearningLevel?: 'beginner' | 'intermediate' | 'advanced';
  currentTopic?: string;
  className?: string;
  onVideoSuggestion?: (videoId: string) => void;
  onFAQSuggestion?: (faqId: string) => void;
}

export function AIAssistant({
  conversationId,
  userId,
  userLearningLevel,
  currentTopic,
  className = '',
  onVideoSuggestion,
  onFAQSuggestion
}: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isTyping,
    error,
    isAIAvailable,
    circuitState,
    lastResponse,
    metrics,
    sendMessage,
    clearConversation,
    resetCircuitBreaker,
    retryLastMessage
  } = useAIAssistant({
    conversationId,
    userId,
    userLearningLevel,
    currentTopic,
    autoSaveHistory: true
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleSuggestedAction = (action: string) => {
    switch (action) {
      case 'Browse Video Library':
        onVideoSuggestion?.('intro-to-two-phase');
        break;
      case 'View FAQ Section':
        onFAQSuggestion?.('faq-001');
        break;
      case 'Try Again Later':
        setTimeout(() => retryLastMessage(), 60000); // Retry in 1 minute
        break;
      default:
        break;
    }
  };

  const getCircuitStateColor = (state: CircuitState) => {
    switch (state) {
      case CircuitState.CLOSED: return 'text-green-500';
      case CircuitState.HALF_OPEN: return 'text-yellow-500';
      case CircuitState.OPEN: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getCircuitStateIcon = (state: CircuitState) => {
    switch (state) {
      case CircuitState.CLOSED: return '🟢';
      case CircuitState.HALF_OPEN: return '🟡';
      case CircuitState.OPEN: return '🔴';
      default: return '⚪';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 ${className}`}
        aria-label="Open AI Assistant"
      >
        <HelpCircle size={24} />
        {!isAIAvailable && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            AI
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Technical Assistant</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>{getCircuitStateIcon(circuitState)}</span>
              <span className={getCircuitStateColor(circuitState)}>
                {circuitState.toLowerCase().replace('_', '-')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {circuitState === CircuitState.OPEN && (
            <button
              onClick={resetCircuitBreaker}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Reset AI Connection"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close AI Assistant"
          >
            ×
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {!isAIAvailable && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle size={16} />
            <span className="text-sm">
              AI temporarily unavailable - using knowledge base
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Ask me anything about two-phase cooling technology!
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setInput("What is two-phase cooling?")}
                className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                "What is two-phase cooling?"
              </button>
              <button
                onClick={() => setInput("How does it compare to air cooling?")}
                className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                "How does it compare to air cooling?"
              </button>
              <button
                onClick={() => setInput("Is it safe for electronics?")}
                className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                "Is it safe for electronics?"
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && lastResponse?.fallback && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    {lastResponse.source === 'faq' ? '📚 From Knowledge Base' : '⚡ Cached Response'}
                  </p>
                  {lastResponse.context?.relatedContent && (
                    <div className="space-y-1">
                      {lastResponse.context.relatedContent.videos && (
                        <div className="flex flex-wrap gap-1">
                          {lastResponse.context.relatedContent.videos.map(videoId => (
                            <button
                              key={videoId}
                              onClick={() => onVideoSuggestion?.(videoId)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center space-x-1 hover:bg-blue-200"
                            >
                              <Video size={12} />
                              <span>Watch Video</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {lastResponse.context.relatedContent.faqEntries && (
                        <div className="flex flex-wrap gap-1">
                          {lastResponse.context.relatedContent.faqEntries.map(faqId => (
                            <button
                              key={faqId}
                              onClick={() => onFAQSuggestion?.(faqId)}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center space-x-1 hover:bg-green-200"
                            >
                              <FileText size={12} />
                              <span>Read FAQ</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle size={16} />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={retryLastMessage}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAIAvailable ? "Ask about cooling technology..." : "Search knowledge base..."}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Metrics (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>Questions: {metrics.totalQuestions} | Fallbacks: {metrics.fallbackResponses}</div>
            <div>Avg Response: {Math.round(metrics.averageResponseTime)}ms</div>
          </div>
        )}
      </form>
    </div>
  );
}