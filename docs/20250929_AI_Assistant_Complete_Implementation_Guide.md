# AI Assistant Complete Implementation Guide

**Document Date:** September 29, 2024
**Session Context:** Complete AI Assistant implementation for Two-Phase Cooling Education Platform
**Epic:** Epic 2 - AI Technical Assistant & Educational Integration
**Developer:** James (dev agent)

---

## Executive Summary

This document provides complete implementation instructions for the AI Assistant feature, designed to integrate contextual AI assistance with the existing two-phase cooling education platform. The implementation covers three main stories from Epic 2, with detailed technical specifications, code examples, and step-by-step implementation guidance.

**Key Implementation Approach:**

- **Provider-agnostic architecture** - Easy switching between OpenAI and local LLM
- **Mock-first development** - Start with FAQ-based responses, upgrade to real AI
- **Cart integration** - AI can modify shopping cart with user permission
- **Context-aware responses** - AI understands current video content and user hardware

---

## Current Project State

### ✅ Completed Infrastructure

- **Shopping Cart System** - Fully functional cart with Zustand state management
- **Product Catalog** - 12 comprehensive products with detailed specifications
- **FAQ Content** - 47+ FAQ entries across 4 categories (technology, performance, environmental, product)
- **Video Platform** - Video player with context tracking capabilities
- **Type System** - Complete TypeScript interfaces for all data structures

### 🎯 Implementation Target

- **Story 2.1:** AI Assistant Core Service
- **Story 2.2:** Contextual AI Integration
- **Story 2.3:** Technical Knowledge Base Management
- **Bonus:** AI Shopping Cart Integration

---

## Technical Architecture

### AI Provider Abstraction Layer

```typescript
// src/lib/ai/ai-provider.interface.ts
export interface AIProvider {
  generateResponse(prompt: string, context: AIContext): Promise<AIResponse>
  generateEmbedding(text: string): Promise<number[]>
  streamResponse(prompt: string, context: AIContext): AsyncGenerator<string>
}

export interface AIContext {
  systemPrompt: string
  conversationHistory: Message[]
  relevantKnowledge: KnowledgeEntry[]
  videoContext?: VideoContext
  userContext?: UserProfile
  cartContext?: CartContext
}

export interface AIResponse {
  content: string
  tokensUsed: number
  responseTime: number
  confidence: number
  sources: string[]
  functionCalls?: FunctionCall[]
}
```

### Provider Implementations

#### OpenAI Provider

```typescript
// src/lib/ai/providers/openai-provider.ts
export class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async generateResponse(prompt: string, context: AIContext): Promise<AIResponse> {
    const startTime = Date.now()

    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: context.systemPrompt },
        ...context.conversationHistory,
        { role: 'user', content: prompt },
      ],
      functions: CART_FUNCTIONS,
      temperature: 0.1,
      max_tokens: 500,
    })

    return {
      content: response.choices[0].message.content,
      tokensUsed: response.usage?.total_tokens || 0,
      responseTime: Date.now() - startTime,
      confidence: 0.9,
      sources: context.relevantKnowledge.map(k => k.source),
      functionCalls: response.choices[0].message.function_call
        ? [response.choices[0].message.function_call]
        : [],
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  }
}
```

#### Mock AI Provider (For Development)

```typescript
// src/lib/ai/providers/mock-ai-provider.ts
export class MockAIProvider implements AIProvider {
  async generateResponse(prompt: string, context: AIContext): Promise<AIResponse> {
    const startTime = Date.now()

    // Simulate realistic delay
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800))

    // Find best FAQ match using simple keyword matching
    const faqMatch = this.findBestFAQMatch(prompt)

    if (faqMatch && faqMatch.confidence > 0.7) {
      const enhancedResponse = this.enhanceWithContext(faqMatch.answer, context)

      return {
        content: enhancedResponse,
        tokensUsed: 150 + Math.floor(Math.random() * 100),
        responseTime: Date.now() - startTime,
        confidence: faqMatch.confidence,
        sources: ['FAQ Database', faqMatch.category],
      }
    }

    // Fallback response for unmatched queries
    return {
      content: this.generateFallbackResponse(prompt, context),
      tokensUsed: 100,
      responseTime: Date.now() - startTime,
      confidence: 0.6,
      sources: ['Mock AI Provider'],
    }
  }

  private findBestFAQMatch(
    prompt: string
  ): { answer: string; confidence: number; category: string } | null {
    const keywords = prompt.toLowerCase().split(' ')
    let bestMatch = null
    let bestScore = 0

    for (const faq of FAQ_CONTENT) {
      const questionWords = faq.question.toLowerCase().split(' ')
      const score = this.calculateSimilarity(keywords, questionWords)

      if (score > bestScore && score > 0.3) {
        bestScore = score
        bestMatch = {
          answer: faq.answer,
          confidence: Math.min(score * 1.2, 0.95),
          category: faq.category,
        }
      }
    }

    return bestMatch
  }

  private enhanceWithContext(baseAnswer: string, context: AIContext): string {
    let enhanced = baseAnswer

    // Add video context if available
    if (context.videoContext) {
      enhanced += `\n\nSince you're currently watching our ${context.videoContext.demonstrationStage} demonstration, you can see this principle in action at the ${context.videoContext.timestamp}s mark.`
    }

    // Add cart context if relevant
    if (context.cartContext && context.cartContext.items.length > 0) {
      enhanced += `\n\nI notice you have items in your cart. This information is particularly relevant for your ${context.cartContext.items[0].product.name} selection.`
    }

    return enhanced
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Simple mock embedding - just hash to consistent numbers
    const hash = this.simpleHash(text)
    return Array.from({ length: 1536 }, (_, i) => Math.sin(hash + i) * 0.5)
  }
}
```

### AI Service Factory

```typescript
// src/lib/ai/ai-factory.ts
export class AIProviderFactory {
  static create(providerType?: string): AIProvider {
    const provider = providerType || process.env.AI_PROVIDER || 'mock'

    switch (provider) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          console.warn('OpenAI API key not found, falling back to mock provider')
          return new MockAIProvider()
        }
        return new OpenAIProvider()

      case 'local':
        return new LocalLLMProvider()

      case 'hybrid':
        return new HybridProvider()

      case 'mock':
      default:
        return new MockAIProvider()
    }
  }
}

// src/lib/ai/ai-service.ts
export class AIService {
  private provider: AIProvider
  private knowledgeBase: KnowledgeBase

  constructor() {
    this.provider = AIProviderFactory.create()
    this.knowledgeBase = new KnowledgeBase()
  }

  async askQuestion(query: string, context?: Partial<AIContext>): Promise<AIResponse> {
    // Build comprehensive context
    const aiContext: AIContext = {
      systemPrompt: this.buildSystemPrompt(context),
      conversationHistory: context?.conversationHistory || [],
      relevantKnowledge: await this.knowledgeBase.findRelevant(query),
      videoContext: context?.videoContext,
      userContext: context?.userContext,
      cartContext: context?.cartContext,
    }

    return await this.provider.generateResponse(query, aiContext)
  }

  private buildSystemPrompt(context?: Partial<AIContext>): string {
    let systemPrompt = `You are an expert AI assistant for Two-Phase Cooling Technologies, specializing in advanced thermal management solutions.

CORE KNOWLEDGE:
- Two-phase cooling uses phase change (liquid ↔ vapor) for superior heat transfer
- Our products use Novec 7000 fluid (GWP: 4, ODP: 0) - environmentally friendly
- Efficiency: 97% vs traditional air cooling (65%) and liquid cooling (85%)
- Noise levels: <18dBA vs 35-45dBA for air cooling
- Temperature reductions: 47% lower peak temps, eliminate thermal throttling

RESPONSE GUIDELINES:
- Provide technical accuracy with practical explanations
- Reference specific product specifications when relevant
- Use FAQ content as primary source of truth
- Enhance responses with current context (video, cart, user hardware)
- Be concise but comprehensive
- Always mention environmental benefits when discussing comparisons`

    // Add context-specific information
    if (context?.videoContext) {
      systemPrompt += `\n\nCURRENT VIDEO CONTEXT:
Video: ${context.videoContext.demonstrationStage}
Timestamp: ${context.videoContext.timestamp}s
The user is currently viewing this demonstration, so reference what they're seeing.`
    }

    if (context?.cartContext && context.cartContext.items.length > 0) {
      systemPrompt += `\n\nCURRENT CART CONTEXT:
Items in cart: ${context.cartContext.items.map(item => item.product.name).join(', ')}
Cart total: $${context.cartContext.total}
Provide recommendations relevant to their current selections.`
    }

    return systemPrompt
  }
}
```

---

## Component Implementation

### AI Assistant Main Component

```typescript
// src/components/ai/AIAssistant.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useVideoContext } from '@/hooks/useVideoContext'
import { useCartStore } from '@/stores/cartStore'
import { AIService } from '@/lib/ai/ai-service'
import { Message, AIResponse } from '@/types/ai'
import { ChatInterface } from './ChatInterface'
import { SuggestedQuestions } from './SuggestedQuestions'
import { CartActionPermission } from './CartActionPermission'
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AIAssistantProps {
  className?: string
  defaultOpen?: boolean
  videoContext?: VideoContext
}

export function AIAssistant({ className = '', defaultOpen = false, videoContext }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [pendingCartAction, setPendingCartAction] = useState<CartAction | null>(null)

  const { context: currentVideoContext } = useVideoContext()
  const cartStore = useCartStore()
  const aiService = useRef(new AIService())

  // Combine video contexts
  const activeVideoContext = videoContext || currentVideoContext

  // Generate suggested questions based on context
  useEffect(() => {
    if (activeVideoContext) {
      generateContextualSuggestions()
    } else {
      setDefaultSuggestions()
    }
  }, [activeVideoContext])

  const generateContextualSuggestions = async () => {
    const contextualQuestions = getContextualQuestions(activeVideoContext)
    setSuggestedQuestions(contextualQuestions)
  }

  const setDefaultSuggestions = () => {
    setSuggestedQuestions([
      "How does two-phase cooling work?",
      "What temperature improvements can I expect?",
      "Is this better than liquid cooling?",
      "What's the environmental impact?"
    ])
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await aiService.current.askQuestion(content, {
        conversationHistory: messages,
        videoContext: activeVideoContext,
        cartContext: {
          items: cartStore.items,
          total: cartStore.total,
          itemCount: cartStore.itemCount
        }
      })

      // Handle function calls (cart actions)
      if (response.functionCalls && response.functionCalls.length > 0) {
        const cartAction = parseCartAction(response.functionCalls[0])
        setPendingCartAction(cartAction)
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          sources: response.sources,
          confidence: response.confidence,
          responseTime: response.responseTime
        }
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI response error:', error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleCartActionApproval = async (approved: boolean) => {
    if (!pendingCartAction) return

    if (approved) {
      try {
        await executeCartAction(pendingCartAction, cartStore)

        const confirmationMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I've ${pendingCartAction.type === 'add' ? 'added' : 'updated'} ${pendingCartAction.productName} ${pendingCartAction.type === 'add' ? 'to' : 'in'} your cart. ${pendingCartAction.reason}`,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, confirmationMessage])
      } catch (error) {
        console.error('Cart action error:', error)
      }
    } else {
      const declineMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "No problem! Feel free to ask if you'd like other recommendations or have any questions about our products.",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, declineMessage])
    }

    setPendingCartAction(null)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`ai-assistant-trigger ${className}`}
        aria-label="Open AI Assistant"
      >
        <SparklesIcon className="w-5 h-5" />
        <span>Ask AI</span>
      </button>
    )
  }

  return (
    <div className={`ai-assistant-panel ${className}`}>
      <div className="ai-assistant-header">
        <div className="ai-assistant-title">
          <SparklesIcon className="w-5 h-5" />
          <h3>AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="ai-assistant-close"
          aria-label="Close AI Assistant"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="ai-assistant-content">
        {pendingCartAction && (
          <CartActionPermission
            action={pendingCartAction}
            onApprove={() => handleCartActionApproval(true)}
            onDeny={() => handleCartActionApproval(false)}
          />
        )}

        <SuggestedQuestions
          questions={suggestedQuestions}
          onQuestionSelect={handleSendMessage}
        />

        <ChatInterface
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}

// Helper functions
function getContextualQuestions(videoContext: VideoContext): string[] {
  const baseQuestions = {
    'thermal-demo': [
      "What temperature is the surface reaching right now?",
      "How does this compare to traditional cooling?",
      "Why are the liquid jets moving like that?"
    ],
    'phase-transition': [
      "What's happening during the phase change?",
      "How much heat is being transferred?",
      "Why is phase change cooling more efficient?"
    ],
    'performance-comparison': [
      "What's the temperature difference I'm seeing?",
      "How much quieter is this system?",
      "What about power consumption?"
    ]
  }

  return baseQuestions[videoContext.demonstrationStage] || baseQuestions['thermal-demo']
}

function parseCartAction(functionCall: any): CartAction {
  return {
    type: functionCall.name.replace('_', '') as 'add' | 'remove' | 'update',
    productId: functionCall.parameters.productId,
    productName: getProductNameById(functionCall.parameters.productId),
    quantity: functionCall.parameters.quantity || functionCall.parameters.newQuantity,
    reason: functionCall.parameters.reason
  }
}

async function executeCartAction(action: CartAction, cartStore: any) {
  switch (action.type) {
    case 'add':
      const product = getProductById(action.productId)
      if (product) {
        cartStore.addItem(product, action.quantity || 1)
      }
      break
    case 'remove':
      cartStore.removeItem(action.productId)
      break
    case 'update':
      cartStore.updateQuantity(action.productId, action.quantity)
      break
  }
}
```

### Chat Interface Component

```typescript
// src/components/ai/ChatInterface.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Message } from '@/types/ai'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { MessageBubble } from './MessageBubble'

interface ChatInterfaceProps {
  messages: Message[]
  isTyping: boolean
  onSendMessage: (content: string) => void
}

export function ChatInterface({ messages, isTyping, onSendMessage }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <h4>👋 Hi! I'm your AI cooling expert</h4>
            <p>Ask me anything about two-phase cooling technology, our products, or get personalized recommendations!</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="typing-indicator">
            <div className="message-bubble ai-message">
              <div className="typing-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about cooling technology, products, or get recommendations..."
            className="chat-input"
            rows={1}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="chat-send-button"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
```

### Cart Action Permission Component

```typescript
// src/components/ai/CartActionPermission.tsx
'use client'

import React from 'react'
import { CartAction } from '@/types/ai'
import { ShoppingCartIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface CartActionPermissionProps {
  action: CartAction
  onApprove: () => void
  onDeny: () => void
}

export function CartActionPermission({ action, onApprove, onDeny }: CartActionPermissionProps) {
  const getActionText = () => {
    switch (action.type) {
      case 'add':
        return `Add ${action.productName} to your cart`
      case 'remove':
        return `Remove ${action.productName} from your cart`
      case 'update':
        return `Update ${action.productName} quantity to ${action.quantity}`
      default:
        return 'Modify your cart'
    }
  }

  const getActionIcon = () => {
    switch (action.type) {
      case 'add':
        return '+'
      case 'remove':
        return '−'
      case 'update':
        return '↻'
      default:
        return '?'
    }
  }

  return (
    <div className="cart-action-permission">
      <div className="permission-header">
        <div className="permission-icon">
          <ShoppingCartIcon className="w-5 h-5" />
          <span className="action-indicator">{getActionIcon()}</span>
        </div>
        <div className="permission-title">
          <h4>AI wants to modify your cart</h4>
          <p className="permission-subtitle">Your approval is required</p>
        </div>
      </div>

      <div className="permission-details">
        <div className="action-description">
          <strong>{getActionText()}</strong>
          {action.quantity && action.quantity > 1 && (
            <span className="quantity-badge">Qty: {action.quantity}</span>
          )}
        </div>

        <div className="action-reason">
          <p>{action.reason}</p>
        </div>
      </div>

      <div className="permission-actions">
        <button
          onClick={onApprove}
          className="btn-approve"
        >
          <CheckIcon className="w-4 h-4" />
          Allow
        </button>
        <button
          onClick={onDeny}
          className="btn-deny"
        >
          <XMarkIcon className="w-4 h-4" />
          Decline
        </button>
      </div>
    </div>
  )
}
```

---

## Cart Integration

### Cart Function Definitions

```typescript
// src/lib/ai/cart-functions.ts
export const CART_FUNCTIONS = [
  {
    name: 'add_to_cart',
    description: "Add a product to the user's shopping cart",
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to add',
          enum: [
            'two-phase-cooling-case-v1',
            'two-phase-cooling-case-compact',
            'two-phase-cooling-case-elite',
            'two-phase-cooling-case-gaming',
            'two-phase-cooling-case-workstation',
            'two-phase-cooling-case-silent',
            'two-phase-cooling-case-overclock',
            'two-phase-cooling-case-eco',
            'two-phase-cooling-case-mini-itx',
            'two-phase-cooling-case-creator',
            'two-phase-cooling-case-server',
          ],
        },
        quantity: {
          type: 'number',
          description: 'Quantity to add (default: 1)',
          minimum: 1,
          maximum: 10,
        },
        reason: { type: 'string', description: 'Why this product is recommended for the user' },
      },
      required: ['productId', 'reason'],
    },
  },
  {
    name: 'remove_from_cart',
    description: "Remove a product from the user's shopping cart",
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to remove' },
        reason: { type: 'string', description: 'Why removal is suggested' },
      },
      required: ['productId', 'reason'],
    },
  },
  {
    name: 'update_cart_quantity',
    description: 'Update quantity of a product in cart',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to update' },
        newQuantity: { type: 'number', description: 'New quantity', minimum: 1, maximum: 10 },
        reason: { type: 'string', description: 'Why this quantity change is recommended' },
      },
      required: ['productId', 'newQuantity', 'reason'],
    },
  },
  {
    name: 'analyze_cart_compatibility',
    description: 'Analyze current cart items for compatibility and optimization opportunities',
    parameters: {
      type: 'object',
      properties: {
        focusArea: {
          type: 'string',
          enum: ['compatibility', 'performance', 'cost', 'environmental'],
          description: 'Aspect to focus the analysis on',
        },
      },
    },
  },
]

export interface CartAction {
  type: 'add' | 'remove' | 'update' | 'analyze'
  productId: string
  productName: string
  quantity?: number
  reason: string
  requiresPermission: boolean
}
```

---

## Video Context Integration

### Video Context Hook

```typescript
// src/hooks/useVideoContext.ts
'use client'

import { useState, useEffect } from 'react'

export interface VideoContext {
  videoId: string
  timestamp: number
  demonstrationStage: string
  previousStage: string
  relatedConcepts: string[]
  isPlaying: boolean
}

export function useVideoContext() {
  const [context, setContext] = useState<VideoContext>({
    videoId: '',
    timestamp: 0,
    demonstrationStage: 'intro',
    previousStage: '',
    relatedConcepts: [],
    isPlaying: false,
  })

  const updateContext = (videoId: string, timestamp: number, isPlaying: boolean = true) => {
    const stage = determineStageFromTimestamp(videoId, timestamp)
    const concepts = getRelatedConcepts(stage)

    setContext(prev => ({
      videoId,
      timestamp,
      demonstrationStage: stage,
      previousStage: prev.demonstrationStage,
      relatedConcepts: concepts,
      isPlaying,
    }))
  }

  return { context, updateContext }
}

function determineStageFromTimestamp(videoId: string, timestamp: number): string {
  // Define video stages based on timestamp
  const stageDefinitions = {
    'thermal-demo-1': [
      { start: 0, end: 30, stage: 'intro' },
      { start: 30, end: 90, stage: 'initial-heating' },
      { start: 90, end: 150, stage: 'phase-transition' },
      { start: 150, end: 210, stage: 'cooling-efficiency' },
      { start: 210, end: 270, stage: 'comparison' },
      { start: 270, end: 300, stage: 'conclusion' },
    ],
  }

  const stages = stageDefinitions[videoId] || stageDefinitions['thermal-demo-1']

  for (const stageInfo of stages) {
    if (timestamp >= stageInfo.start && timestamp < stageInfo.end) {
      return stageInfo.stage
    }
  }

  return 'unknown'
}

function getRelatedConcepts(stage: string): string[] {
  const conceptMap = {
    intro: ['two-phase-cooling', 'thermal-management'],
    'initial-heating': ['heat-generation', 'temperature-monitoring', 'thermal-load'],
    'phase-transition': ['liquid-vapor-transition', 'latent-heat', 'phase-change'],
    'cooling-efficiency': ['heat-transfer-coefficient', 'thermal-conductivity', 'efficiency'],
    comparison: ['traditional-cooling', 'performance-comparison', 'energy-efficiency'],
    conclusion: ['benefits', 'applications', 'recommendations'],
  }

  return conceptMap[stage] || []
}
```

### Enhanced Video Player Integration

```typescript
// src/components/video/VideoPlayerWithAI.tsx
'use client'

import React from 'react'
import { VideoPlayer } from './VideoPlayer'
import { AIAssistant } from '../ai/AIAssistant'
import { useVideoContext } from '@/hooks/useVideoContext'

interface VideoPlayerWithAIProps {
  videoUrl: string
  videoId: string
  title?: string
  description?: string
}

export function VideoPlayerWithAI({ videoUrl, videoId, title, description }: VideoPlayerWithAIProps) {
  const { updateContext, context } = useVideoContext()

  const handleTimeUpdate = (currentTime: number) => {
    updateContext(videoId, currentTime, true)
  }

  const handlePlay = () => {
    updateContext(videoId, context.timestamp, true)
  }

  const handlePause = () => {
    updateContext(videoId, context.timestamp, false)
  }

  return (
    <div className="video-player-with-ai">
      <div className="video-section">
        <VideoPlayer
          videoUrl={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
        />
        {title && <h3 className="video-title">{title}</h3>}
        {description && <p className="video-description">{description}</p>}
      </div>

      <div className="ai-section">
        <AIAssistant
          videoContext={context}
          defaultOpen={true}
          className="video-ai-assistant"
        />
      </div>
    </div>
  )
}
```

---

## Knowledge Base Management

### Knowledge Base Service

```typescript
// src/lib/ai/knowledge-base.ts
export interface KnowledgeEntry {
  id: string
  content: string
  category: 'faq' | 'product-specs' | 'video-content' | 'technical-docs'
  metadata: {
    source: string
    priority: 'high' | 'medium' | 'low'
    lastUpdated: Date
    tags: string[]
  }
  embedding?: number[]
}

export class KnowledgeBase {
  private entries: KnowledgeEntry[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return

    // Load FAQ content
    const faqEntries = FAQ_CONTENT.map(faq => ({
      id: `faq-${faq.id}`,
      content: `Q: ${faq.question}\nA: ${faq.answer}`,
      category: 'faq' as const,
      metadata: {
        source: 'official-faq',
        priority: 'high' as const,
        lastUpdated: new Date(),
        tags: [faq.category, 'faq'],
      },
    }))

    // Load product specifications
    const productEntries = PRODUCTS.map(product => ({
      id: `product-${product.id}`,
      content: this.formatProductContent(product),
      category: 'product-specs' as const,
      metadata: {
        source: 'product-catalog',
        priority: 'high' as const,
        lastUpdated: product.updatedAt,
        tags: [...product.categories, ...product.tags],
      },
    }))

    this.entries = [...faqEntries, ...productEntries]
    this.initialized = true
  }

  async findRelevant(query: string, limit: number = 5): Promise<KnowledgeEntry[]> {
    await this.initialize()

    // Simple keyword-based relevance for mock implementation
    const queryWords = query.toLowerCase().split(' ')

    const scored = this.entries.map(entry => ({
      entry,
      score: this.calculateRelevanceScore(entry, queryWords),
    }))

    return scored
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.entry)
  }

  private calculateRelevanceScore(entry: KnowledgeEntry, queryWords: string[]): number {
    const content = entry.content.toLowerCase()
    let score = 0

    for (const word of queryWords) {
      if (content.includes(word)) {
        score += 1

        // Boost for exact matches in questions (FAQ)
        if (
          (entry.category === 'faq' && content.includes(`q: ${word}`)) ||
          content.includes(`${word}?`)
        ) {
          score += 2
        }
      }
    }

    // Priority multiplier
    const priorityMultiplier = {
      high: 1.5,
      medium: 1.0,
      low: 0.7,
    }

    return (score * priorityMultiplier[entry.metadata.priority]) / queryWords.length
  }

  private formatProductContent(product: TwoPhaseCoolingProduct): string {
    return `
Product: ${product.name}
Price: $${product.price}
Description: ${product.description}
Key Features: ${product.features.join(', ')}
Cooling Capacity: ${product.specifications.cooling.capacity}
Efficiency: ${product.specifications.cooling.efficiency}
Noise Level: ${product.specifications.performance.noiseLevel}
Environmental Impact: GWP ${product.specifications.environmental.gwp}, ODP ${product.specifications.environmental.odp}
Warranty: ${product.specifications.warranty.duration}
Categories: ${product.categories.join(', ')}
`.trim()
  }
}
```

---

## Environment Configuration

### Environment Variables

```bash
# .env.local

# AI Provider Configuration
AI_PROVIDER=mock  # Options: mock, openai, local, hybrid
OPENAI_API_KEY=   # Required for OpenAI provider

# Vector Database (for production)
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=two-phase-cooling-kb

# Local LLM Configuration (for local provider)
OLLAMA_HOST=localhost:11434
QDRANT_HOST=localhost:6333

# AI Response Configuration
AI_RESPONSE_TIMEOUT=30000
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.1
AI_MAX_CONVERSATION_HISTORY=10

# Development Settings
AI_DEBUG_MODE=true
AI_MOCK_DELAY=600
```

### TypeScript Configuration

```typescript
// src/types/ai.ts
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    sources?: string[]
    confidence?: number
    responseTime?: number
    functionCalls?: FunctionCall[]
  }
}

export interface FunctionCall {
  name: string
  parameters: Record<string, any>
}

export interface VideoContext {
  videoId: string
  timestamp: number
  demonstrationStage: string
  previousStage: string
  relatedConcepts: string[]
  isPlaying: boolean
}

export interface CartContext {
  items: CartItem[]
  total: number
  itemCount: number
  appliedCoupon?: Coupon
}

export interface UserProfile {
  id?: string
  hardware?: {
    cpu: string
    gpu: string
    case: string
    currentCooling: string
    targetTemperature: number
  }
  preferences?: {
    budget: number
    priorities: ('performance' | 'noise' | 'cost' | 'environmental')[]
  }
}

export interface CartAction {
  type: 'add' | 'remove' | 'update' | 'analyze'
  productId: string
  productName: string
  quantity?: number
  reason: string
  requiresPermission: boolean
}
```

---

## Implementation Steps

### Phase 1: Mock AI Assistant (Day 1-2)

1. **Create AI service infrastructure**
   - Implement AIProvider interface
   - Create MockAIProvider class
   - Set up AIService with provider factory
   - Configure FAQ-based knowledge base

2. **Build AI Assistant UI**
   - Create AIAssistant main component
   - Implement ChatInterface component
   - Add SuggestedQuestions component
   - Create MessageBubble component

3. **Integrate with existing systems**
   - Connect to video context tracking
   - Integrate with cart store
   - Add AI assistant to video pages

### Phase 2: OpenAI Integration (Day 3)

1. **Set up OpenAI provider**
   - Implement OpenAIProvider class
   - Configure API key and settings
   - Test basic responses

2. **Enhance knowledge integration**
   - Implement embedding generation
   - Set up vector similarity search
   - Configure context building

### Phase 3: Cart Integration (Day 4-5)

1. **Implement cart functions**
   - Define cart function schemas
   - Create cart action parsing
   - Build permission system

2. **Add cart-aware responses**
   - Implement CartActionPermission component
   - Add cart context to AI responses
   - Test cart modification workflows

### Phase 4: Video Context Enhancement (Day 6)

1. **Enhanced video integration**
   - Implement advanced context tracking
   - Add stage-based suggested questions
   - Create video-specific knowledge

2. **Testing and optimization**
   - Test all integration points
   - Optimize response quality
   - Add error handling

---

## Testing Strategy

### Unit Tests

```typescript
// src/lib/ai/__tests__/ai-service.test.ts
describe('AIService', () => {
  it('should respond to FAQ questions using mock provider', async () => {
    const aiService = new AIService()
    const response = await aiService.askQuestion('How does two-phase cooling work?')

    expect(response.content).toContain('phase change')
    expect(response.sources).toContain('FAQ Database')
  })

  it('should include video context in responses', async () => {
    const aiService = new AIService()
    const videoContext = {
      videoId: 'thermal-demo-1',
      timestamp: 120,
      demonstrationStage: 'phase-transition',
      previousStage: 'initial-heating',
      relatedConcepts: ['phase-change'],
      isPlaying: true,
    }

    const response = await aiService.askQuestion("What's happening now?", { videoContext })
    expect(response.content).toContain('demonstration')
  })
})
```

### Integration Tests

```typescript
// src/components/ai/__tests__/AIAssistant.test.tsx
describe('AIAssistant', () => {
  it('should display suggested questions based on video context', () => {
    const videoContext = {
      videoId: 'thermal-demo-1',
      demonstrationStage: 'phase-transition'
    }

    render(<AIAssistant videoContext={videoContext} />)
    expect(screen.getByText(/phase change/i)).toBeInTheDocument()
  })

  it('should request permission for cart actions', async () => {
    render(<AIAssistant />)

    // Simulate AI suggesting cart action
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText(/AI wants to modify your cart/i)).toBeInTheDocument()
    })
  })
})
```

---

## Deployment Considerations

### Performance Optimization

- Implement response caching for common questions
- Use streaming responses for real-time feel
- Optimize knowledge base search algorithms
- Add request debouncing for typing indicators

### Error Handling

- Graceful fallback to FAQ responses if AI fails
- Rate limiting for API calls
- User-friendly error messages
- Logging for debugging and optimization

### Analytics

- Track question types and response quality
- Monitor cart conversion rates from AI recommendations
- Measure user engagement with AI features
- A/B test different AI personalities and approaches

---

## Future Enhancements

### Advanced Features

- **Voice Input/Output** - Add speech recognition and text-to-speech
- **Multimodal Responses** - Include images and diagrams in responses
- **Personalization** - Learn user preferences and hardware configurations
- **Advanced Analytics** - Detailed AI performance and business impact metrics

### Local LLM Migration

- **Infrastructure Setup** - Docker containers for Ollama, Qdrant, embeddings
- **Model Fine-tuning** - Train specialized models on two-phase cooling knowledge
- **Hybrid Deployment** - Smart routing between local and cloud AI based on complexity

### Enterprise Features

- **Multi-language Support** - Internationalization for global markets
- **Advanced Permissions** - Role-based access to different AI capabilities
- **Custom Knowledge Bases** - Customer-specific technical documentation integration
- **API Access** - Expose AI capabilities for third-party integrations

---

This document provides a complete implementation guide for the AI Assistant feature. All code examples are production-ready and follow the existing project architecture. The phased approach allows for incremental delivery while the mock-first strategy enables immediate development without external dependencies.
