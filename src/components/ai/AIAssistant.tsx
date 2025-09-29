'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAI } from '@/app/providers'
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon, LightBulbIcon } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'
// import { AIConversations, AIMessages } from '@prisma/client'
// Mock types for demo mode
// interface AIConversations {
//   id: string
//   title: string
//   created_at: Date
// }
// interface AIMessages {
//   id: string
//   content: string
//   role: string
//   created_at: Date
// }

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AIAssistantProps {
  className?: string
  initialContext?: {
    type: 'general' | 'video_specific' | 'product_inquiry'
    data?: any
    videoId?: string
    productId?: string
  }
  onConversationStart?: (conversationId: string) => void
  onConversationEnd?: (conversationId: string, satisfaction?: number) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isLoading?: boolean
  isFallback?: boolean
  confidence?: number
  helpfulnessRating?: 'helpful' | 'not_helpful' | 'needs_improvement'
}

interface ConversationState {
  id: string | null
  messages: Message[]
  isActive: boolean
  context: {
    type: string
    data?: any
  }
  sessionStartTime: Date
  totalMessages: number
  fallbackCount: number
  averageResponseTime: number
}

interface SuggestedQuestion {
  id: string
  text: string
  category: 'basics' | 'technical' | 'safety' | 'products'
  icon: React.ReactNode
}

// ============================================================================
// SUGGESTED QUESTIONS DATA
// ============================================================================

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'basics-1',
    text: 'What is two-phase cooling and how does it work?',
    category: 'basics',
    icon: <LightBulbIcon className='w-4 h-4' />,
  },
  {
    id: 'basics-2',
    text: 'How is two-phase cooling different from traditional air cooling?',
    category: 'basics',
    icon: <LightBulbIcon className='w-4 h-4' />,
  },
  {
    id: 'technical-1',
    text: 'What are the GWP and ODP ratings of your cooling fluid?',
    category: 'technical',
    icon: <SparklesIcon className='w-4 h-4' />,
  },
  {
    id: 'technical-2',
    text: 'How do you measure cooling performance under load?',
    category: 'technical',
    icon: <SparklesIcon className='w-4 h-4' />,
  },
  {
    id: 'safety-1',
    text: 'What safety precautions should I take with two-phase cooling?',
    category: 'safety',
    icon: <ExclamationTriangleIcon className='w-4 h-4' />,
  },
  {
    id: 'products-1',
    text: 'Which case model would be best for my build?',
    category: 'products',
    icon: <ChatBubbleLeftRightIcon className='w-4 h-4' />,
  },
]

// ============================================================================
// AI ASSISTANT COMPONENT
// ============================================================================

export const AIAssistant: React.FC<AIAssistantProps> = ({
  className = '',
  initialContext,
  onConversationStart,
  onConversationEnd,
}) => {
  // AI service from context (demo mode)
  const { sendMessage: aiSendMessage } = useAI()
  const isAvailable = true // Demo mode always available
  const fallbackMode = false // Demo mode

  // Component state
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentInput, setCurrentInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Conversation state
  const [conversation, setConversation] = useState<ConversationState>({
    id: null,
    messages: [],
    isActive: false,
    context: initialContext || { type: 'general' },
    sessionStartTime: new Date(),
    totalMessages: 0,
    fallbackCount: 0,
    averageResponseTime: 0,
  })

  // UI refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const conversationRef = useRef<HTMLDivElement>(null)

  // Response time tracking
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null)
  const [responseTimes, setResponseTimes] = useState<number[]>([])

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  const startConversation = useCallback(async () => {
    // Demo mode - always start conversation

    try {
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      setConversation(prev => ({
        ...prev,
        id: conversationId,
        isActive: true,
        sessionStartTime: new Date(),
      }))

      // Add welcome message
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: getWelcomeMessage(conversation.context.type),
        timestamp: new Date(),
        isFallback: fallbackMode,
      }

      setConversation(prev => ({
        ...prev,
        messages: [welcomeMessage],
      }))

      if (onConversationStart) {
        onConversationStart(conversationId)
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start AI assistant')
    }
  }, [conversation.context.type, fallbackMode, onConversationStart])

  const saveConversation = useCallback(
    async (satisfaction?: number) => {
      if (!conversation.id || conversation.messages.length === 0) return

      try {
        const conversationData = {
          id: conversation.id,
          title: conversation.messages[1]?.content.slice(0, 50) + '...' || 'Untitled Conversation',
          context_type: conversation.context.type,
          context_data: conversation.context.data,
          total_messages: conversation.totalMessages,
          avg_response_time: Math.round(conversation.averageResponseTime),
          fallback_count: conversation.fallbackCount,
          satisfaction_rating: satisfaction,
          started_at: conversation.sessionStartTime,
          ended_at: new Date(),
          messages: conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            message_type: msg.role === 'user' ? 'question' : 'answer',
            is_fallback: msg.isFallback || false,
            confidence_score: msg.confidence,
            user_feedback: msg.helpfulnessRating,
            created_at: msg.timestamp,
          })),
        }

        await fetch('/api/ai/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationData),
        })
      } catch (error) {
        console.error('Failed to save conversation:', error)
      }
    },
    [conversation]
  )

  const endConversation = useCallback(
    async (satisfaction?: number) => {
      if (!conversation.id) return

      try {
        // Save conversation to database
        await saveConversation(satisfaction)

        if (onConversationEnd) {
          onConversationEnd(conversation.id, satisfaction)
        }

        // Reset conversation state
        setConversation(prev => ({
          ...prev,
          id: null,
          isActive: false,
          messages: [],
        }))
      } catch (error) {
        console.error('Failed to end conversation:', error)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [conversation.id, onConversationEnd, saveConversation]
  )

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }

      // Add user message
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        totalMessages: prev.totalMessages + 1,
      }))

      // Clear input
      setCurrentInput('')

      // Add loading assistant message
      const loadingMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      }

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, loadingMessage],
      }))

      // Start response time tracking
      setResponseStartTime(Date.now())
      setIsTyping(true)

      try {
        // Demo mode - use simplified AI response
        const response = await aiSendMessage(content)
        let isFallback = false

        // Calculate response time
        const responseTime = responseStartTime ? Date.now() - responseStartTime : 0
        setResponseTimes(prev => [...prev, responseTime])

        // Update average response time
        setConversation(prev => ({
          ...prev,
          averageResponseTime:
            responseTimes.length > 0
              ? [...responseTimes, responseTime].reduce((a, b) => a + b) /
                (responseTimes.length + 1)
              : responseTime,
        }))

        // Replace loading message with actual response
        setConversation(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: response,
                  isLoading: false,
                  isFallback,
                  timestamp: new Date(),
                }
              : msg
          ),
        }))
      } catch (error) {
        console.error('Failed to get AI response:', error)

        // Replace loading message with error
        setConversation(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content:
                    "I apologize, but I'm having trouble responding right now. Please try asking your question again, or browse our FAQ section for common answers.",
                  isLoading: false,
                  isFallback: true,
                  timestamp: new Date(),
                }
              : msg
          ),
          fallbackCount: prev.fallbackCount + 1,
        }))

        toast.error('AI assistant is temporarily unavailable')
      } finally {
        setIsTyping(false)
        setResponseStartTime(null)
      }
    },
    [aiSendMessage, responseStartTime, responseTimes]
  )

  const handleSuggestedQuestion = useCallback(
    (question: SuggestedQuestion) => {
      sendMessage(question.text)
    },
    [sendMessage]
  )

  const rateMessage = useCallback(
    (messageId: string, rating: 'helpful' | 'not_helpful' | 'needs_improvement') => {
      setConversation(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId ? { ...msg, helpfulnessRating: rating } : msg
        ),
      }))

      // Show feedback toast
      const feedbackMessages = {
        helpful: 'Thank you for your feedback! 😊',
        not_helpful: "Thank you for the feedback. We'll work to improve our responses.",
        needs_improvement:
          "Thank you for the feedback. We'll use this to enhance our AI assistant.",
      }

      toast.success(feedbackMessages[rating])
    },
    []
  )

  // ============================================================================
  // UI HANDLERS
  // ============================================================================

  const handleToggleOpen = useCallback(() => {
    if (!isOpen && !conversation.isActive) {
      startConversation()
    }
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }, [isOpen, conversation.isActive, startConversation])

  const handleMinimize = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (conversation.isActive) {
      endConversation()
    }
  }, [conversation.isActive, endConversation])

  const handleInputSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      sendMessage(currentInput)
    },
    [currentInput, sendMessage]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage(currentInput)
      }
    },
    [currentInput, sendMessage]
  )

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Handle initial context
  useEffect(() => {
    if (initialContext) {
      setConversation(prev => ({
        ...prev,
        context: initialContext,
      }))
    }
  }, [initialContext])

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getWelcomeMessage = (contextType: string): string => {
    switch (contextType) {
      case 'video_specific':
        return "Hi! I'm here to help you understand this video better. Feel free to ask me any questions about the concepts, techniques, or applications shown in the demonstration."
      case 'product_inquiry':
        return 'Hello! I can help you learn more about our two-phase cooling products and find the right solution for your needs. What would you like to know?'
      default:
        return "Hi! I'm your AI assistant for two-phase cooling technology. I can help you understand concepts, answer technical questions, and guide you through our educational content. What would you like to learn about?"
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isAvailable && !fallbackMode) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <div className='bg-secondary-100 text-secondary-600 px-4 py-2 rounded-equipment shadow-lg'>
          <div className='flex items-center gap-2'>
            <ExclamationTriangleIcon className='w-5 h-5' />
            <span className='text-sm'>AI Assistant temporarily unavailable</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={handleToggleOpen}
          className='btn-primary w-14 h-14 rounded-full shadow-equipment flex items-center justify-center relative'
          aria-label='Open AI Assistant'
        >
          <ChatBubbleLeftRightIcon className='w-6 h-6' />
          {fallbackMode && (
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full'></div>
          )}
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div
          className={`glass bg-white rounded-equipment shadow-equipment w-96 h-96 flex flex-col ${isMinimized ? 'h-14' : ''}`}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-secondary-200'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center'>
                <SparklesIcon className='w-4 h-4 text-white' />
              </div>
              <div>
                <h3 className='font-semibold text-secondary-900'>AI Assistant</h3>
                <div className='flex items-center gap-2 text-xs text-secondary-500'>
                  {isAvailable && !fallbackMode ? (
                    <>
                      <div className='w-2 h-2 bg-success-500 rounded-full'></div>
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <div className='w-2 h-2 bg-accent-500 rounded-full'></div>
                      <span>FAQ Mode</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-1'>
              <button
                onClick={handleMinimize}
                className='w-8 h-8 flex items-center justify-center text-secondary-400 hover:text-secondary-600 rounded'
                aria-label='Minimize'
              >
                —
              </button>
              <button
                onClick={handleClose}
                className='w-8 h-8 flex items-center justify-center text-secondary-400 hover:text-secondary-600 rounded'
                aria-label='Close'
              >
                <XMarkIcon className='w-5 h-5' />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div ref={conversationRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
                {conversation.messages.length === 0 && (
                  <div className='space-y-4'>
                    <p className='text-secondary-600 text-sm'>
                      Get started with a suggested question:
                    </p>
                    <div className='grid gap-2'>
                      {SUGGESTED_QUESTIONS.slice(0, 3).map(question => (
                        <button
                          key={question.id}
                          onClick={() => handleSuggestedQuestion(question)}
                          className='text-left p-3 bg-secondary-50 hover:bg-secondary-100 rounded-technical transition-colors text-sm'
                        >
                          <div className='flex items-center gap-2'>
                            {question.icon}
                            <span>{question.text}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {conversation.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-technical px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : message.isFallback
                            ? 'bg-accent-50 border border-accent-200 text-secondary-900'
                            : 'bg-secondary-100 text-secondary-900'
                      }`}
                    >
                      {message.isLoading ? (
                        <div className='flex items-center gap-2'>
                          <div className='loading-spinner w-4 h-4 border-secondary-400'></div>
                          <span className='text-sm'>Thinking...</span>
                        </div>
                      ) : (
                        <>
                          <p className='text-sm whitespace-pre-wrap'>{message.content}</p>

                          {message.role === 'assistant' && !message.isLoading && (
                            <div className='flex items-center justify-between mt-2'>
                              <div className='flex items-center gap-1'>
                                {message.isFallback && (
                                  <span className='text-xs text-accent-600 bg-accent-100 px-1 rounded'>
                                    FAQ
                                  </span>
                                )}
                              </div>

                              {!message.helpfulnessRating && (
                                <div className='flex items-center gap-1'>
                                  <button
                                    onClick={() => rateMessage(message.id, 'helpful')}
                                    className='text-xs text-success-600 hover:bg-success-100 px-1 rounded'
                                    title='Helpful'
                                  >
                                    👍
                                  </button>
                                  <button
                                    onClick={() => rateMessage(message.id, 'not_helpful')}
                                    className='text-xs text-danger-600 hover:bg-danger-100 px-1 rounded'
                                    title='Not helpful'
                                  >
                                    👎
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className='border-t border-secondary-200 p-4'>
                <form onSubmit={handleInputSubmit} className='flex gap-2'>
                  <input
                    ref={inputRef}
                    type='text'
                    value={currentInput}
                    onChange={e => setCurrentInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder='Ask about two-phase cooling...'
                    className='flex-1 input text-sm'
                    disabled={isTyping}
                  />
                  <button
                    type='submit'
                    disabled={!currentInput.trim() || isTyping}
                    className='btn-primary w-10 h-10 flex items-center justify-center'
                    aria-label='Send message'
                  >
                    <PaperAirplaneIcon className='w-4 h-4' />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
