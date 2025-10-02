'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { aiService } from '@/services/ai/AIService'
import { knowledgeBase } from '@/services/ai/KnowledgeBase'
import { ChatMessage, AIContext, CartAction } from '@/types/ai'
import { ChatInterface } from './ChatInterface'
import { SuggestedQuestions } from './SuggestedQuestions'
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'
import { logger } from '@/lib/logger'
import styles from './AIAssistant.module.css'
interface AIAssistantProps {
  isOpen: boolean
  onToggle: () => void
  context?: Partial<AIContext>
  className?: string
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onToggle,
  context,
  className = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substring(2)}`
  )

  const cartStore = useCartStore()

  // Initialize AI service and knowledge base
  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([aiService.initialize(), knowledgeBase.initialize()])
        setIsInitialized(true)

        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content:
            "Hi! I'm your two-phase cooling expert. I can help you with technical questions, product recommendations, troubleshooting, and more. What would you like to know?",
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
      } catch (error) {
        logger.error('Failed to initialize AI assistant', error)
        setError('Failed to initialize AI assistant')
      }
    }

    initialize()
  }, [])

  // Build AI context from current state
  const buildContext = useCallback((): AIContext => {
    return {
      sessionId,
      cartItems: cartStore.items.map(item => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      recentQuestions: messages
        .filter(m => m.role === 'user')
        .slice(-3)
        .map(m => m.content),
      ...context,
    }
  }, [sessionId, cartStore.items, messages, context])

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!isInitialized || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const currentContext = buildContext()
      const response = await aiService.generateResponse([...messages, userMessage], currentContext)

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      // Handle cart actions if any
      if (response.cartActions && response.cartActions.length > 0) {
        await handleCartActions(response.cartActions)
      }
    } catch (error) {
      logger.error('Failed to get AI response', error, { messageContent: content })
      setError('Sorry, I encountered an error. Please try again.')

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          "I'm sorry, I encountered an error processing your request. Please try asking again or rephrase your question.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cart actions from AI responses
  const handleCartActions = async (actions: CartAction[]) => {
    for (const action of actions) {
      if (action.requiresConfirmation) {
        const confirmed = window.confirm(`${action.description}\n\nDo you want to proceed?`)
        if (!confirmed) continue
      }

      try {
        switch (action.type) {
          case 'add':
            // Fetch product from API
            try {
              const response = await fetch(`/api/products/${action.productId}`)
              const result = await response.json()

              if (result.success && result.data) {
                cartStore.addItem(result.data, action.quantity || 1)
                toast.success(`Added ${result.data.name} to cart`)
              } else {
                toast.error('Product not found')
              }
            } catch (fetchError) {
              logger.error('Failed to fetch product', fetchError, { productId: action.productId })
              toast.error('Failed to load product')
            }
            break

          case 'remove':
            cartStore.removeItem(action.productId)
            toast.success('Item removed from cart')
            break

          case 'update_quantity':
            if (action.quantity !== undefined) {
              cartStore.updateQuantity(action.productId, action.quantity)
              toast.success('Cart updated')
            }
            break
        }
      } catch (error) {
        logger.error('Cart action failed', error, {
          actionType: action.type,
          productId: action.productId,
        })
        toast.error(`Failed to ${action.type} item`)
      }
    }
  }

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  // Clear conversation
  const handleClearConversation = () => {
    if (confirm('Clear conversation history?')) {
      setMessages([])
      setError(null)
    }
  }

  // Get provider info for display
  const providerInfo = aiService.getProviderInfo()

  if (!isOpen) {
    // Floating toggle button
    return (
      <button
        onClick={onToggle}
        className={`${styles.floatingButton} ${className}`}
        aria-label='Open AI Assistant'
      >
        <ChatBubbleLeftRightIcon />
      </button>
    )
  }

  return (
    <div className={`${styles.chatContainer} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>
            <SparklesIcon />
          </div>
          <div className={styles.headerInfo}>
            <h3>AI Assistant</h3>
            {providerInfo && (
              <p>
                {providerInfo.name} • {providerInfo.isAvailable ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleClearConversation}
            className={styles.iconButton}
            title='Clear conversation'
          >
            <Cog6ToothIcon />
          </button>

          <button onClick={onToggle} className={styles.iconButton} aria-label='Close AI Assistant'>
            <XMarkIcon />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <InformationCircleIcon />
          <p>{error}</p>
        </div>
      )}

      {/* Initialization State */}
      {!isInitialized ? (
        <div className={styles.initializing}>
          <div className={styles.initializingContent}>
            <div className={styles.spinner}></div>
            <p>Initializing AI Assistant...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Interface */}
          <div className={styles.chatContent}>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder='Ask about cooling systems, products, or troubleshooting...'
            />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className={styles.suggestedQuestionsContainer}>
              <SuggestedQuestions onQuestionClick={handleSuggestedQuestion} />
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p>AI responses may not always be accurate. Verify important information.</p>
      </div>
    </div>
  )
}
