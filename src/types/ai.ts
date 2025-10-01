/**
 * AI Assistant related TypeScript type definitions
 */

// Chat message types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isTyping?: boolean
}

// AI assistant capabilities
export interface AssistantCapability {
  id: string
  title: string
  description: string
  icon: string
  category: 'technical' | 'troubleshooting' | 'optimization' | 'maintenance'
  examples: string[]
}

// Configuration suggestions
export interface ConfigSuggestion {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  benefits: string[]
}

// Conversation state
export interface ConversationState {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
  sessionId: string
  startTime: Date
}

// AI response metadata
export interface AIResponseMetadata {
  confidence: number
  sources?: string[]
  suggestedActions?: string[]
  relatedTopics?: string[]
}

// Provider system types
export interface AIResponse {
  message: string
  suggestedQuestions?: string[]
  cartActions?: CartAction[]
  confidence?: number
  metadata?: AIResponseMetadata
}

export interface CartAction {
  type: 'add' | 'remove' | 'update_quantity'
  productId: string
  quantity?: number
  requiresConfirmation: boolean
  description: string
}

export interface AIContext {
  currentVideo?: {
    slug: string
    title: string
    category: string
    duration: number
    currentTime: number
  }
  cartItems?: Array<{
    id: string
    productName: string
    quantity: number
    price: number
  }>
  userHardware?: {
    cpu?: string
    gpu?: string
    motherboard?: string
    coolingSystem?: string
  }
  recentQuestions?: string[]
  sessionId: string
}

export interface AIProvider {
  name: string
  initialize(): Promise<void>
  generateResponse(messages: ChatMessage[], context: AIContext): Promise<AIResponse>
  isAvailable(): boolean
  getCostEstimate?(messages: ChatMessage[]): number
}

export type AIProviderType = 'mock' | 'openai' | 'gemini' | 'local'

export interface AIConfiguration {
  provider: AIProviderType
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
  endpoint?: string
}
