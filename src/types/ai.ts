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
