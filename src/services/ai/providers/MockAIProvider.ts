import { AIProvider, ChatMessage, AIContext, AIResponse } from '@/types/ai'
import { knowledgeBase } from '@/services/ai/KnowledgeBase'
import { PRODUCTS } from '@/data/products'

export class MockAIProvider implements AIProvider {
  public readonly name = 'Mock AI Provider'
  private isInitialized = false

  async initialize(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Initialize knowledge base
    await knowledgeBase.initialize()

    this.isInitialized = true
  }

  isAvailable(): boolean {
    return this.isInitialized
  }

  async generateResponse(messages: ChatMessage[], context: AIContext): Promise<AIResponse> {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('No user message found')
    }

    const userQuestion = lastMessage.content.toLowerCase()

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Knowledge base search
    const knowledgeResults = knowledgeBase.search(userQuestion, { maxResults: 3, minScore: 0.2 })
    if (knowledgeResults.length > 0 && knowledgeResults[0]) {
      const bestResult = knowledgeResults[0]
      return {
        message: bestResult.item.content,
        confidence: bestResult.relevanceScore,
        suggestedQuestions: this.getSuggestedQuestions(bestResult.item.category),
        metadata: {
          confidence: bestResult.relevanceScore,
          sources: ['Knowledge Base'],
          relatedTopics: [bestResult.item.category],
        },
      }
    }

    // Product-related responses
    const productResponse = this.findProductMatch(userQuestion, context)
    if (productResponse) {
      return productResponse
    }

    // Video context responses
    if (context.currentVideo) {
      const videoResponse = this.generateVideoContextResponse(userQuestion, context)
      if (videoResponse) {
        return videoResponse
      }
    }

    // Cart-related responses
    if (this.isCartRelated(userQuestion)) {
      return this.generateCartResponse(userQuestion, context)
    }

    // Default response
    return this.generateDefaultResponse(userQuestion, context)
  }

  private findProductMatch(question: string, _context: AIContext): AIResponse | null {
    const productKeywords = ['product', 'buy', 'price', 'cost', 'purchase', 'spec', 'specification']

    if (!productKeywords.some(keyword => question.includes(keyword))) {
      return null
    }

    // Find relevant products
    const relevantProducts = PRODUCTS.filter(product => {
      const searchText =
        `${product.name} ${product.description} ${product.categories.join(' ')}`.toLowerCase()
      return this.calculateTextSimilarity(question, searchText) > 0.2
    })

    if (relevantProducts.length === 0) {
      return {
        message:
          'I can help you find the right two-phase cooling solution. Our products include various cooling cases and systems. What specific requirements do you have?',
        suggestedQuestions: [
          "What's the difference between Pro and Compact cooling cases?",
          'Which cooling system is best for gaming?',
          'Show me products under $2000',
        ],
        confidence: 0.7,
      }
    }

    const topProduct = relevantProducts[0]
    if (!topProduct) {
      return null
    }

    return {
      message: `I recommend the ${topProduct.name} for $${topProduct.price}. ${topProduct.shortDescription} Would you like me to add it to your cart or tell you more about its specifications?`,
      suggestedQuestions: [
        `Tell me more about ${topProduct.name}`,
        `Add ${topProduct.name} to cart`,
        'Compare with other products',
        "What's included in the package?",
      ],
      cartActions: [
        {
          type: 'add',
          productId: topProduct.id,
          quantity: 1,
          requiresConfirmation: true,
          description: `Add ${topProduct.name} to cart ($${topProduct.price})`,
        },
      ],
      confidence: 0.85,
    }
  }

  private generateVideoContextResponse(question: string, context: AIContext): AIResponse | null {
    if (!context.currentVideo) return null

    const video = context.currentVideo

    // Video-specific responses
    if (question.includes('video') || question.includes('tutorial')) {
      return {
        message: `You're currently watching "${video.title}" in the ${video.category} category. This video covers important concepts about two-phase cooling. Is there something specific from this video you'd like me to explain further?`,
        suggestedQuestions: [
          'Explain the concepts from this video',
          'What products relate to this video?',
          'Skip to the most important part',
        ],
        confidence: 0.8,
      }
    }

    return null
  }

  private generateCartResponse(_question: string, context: AIContext): AIResponse {
    const cartCount = context.cartItems?.length || 0

    if (cartCount === 0) {
      return {
        message:
          'Your cart is currently empty. I can help you find the perfect two-phase cooling solution based on your needs. What type of system are you looking to cool?',
        suggestedQuestions: [
          'Show me gaming cooling solutions',
          "What's your most popular product?",
          'I need help choosing a cooling system',
        ],
        confidence: 0.9,
      }
    }

    const totalValue =
      context.cartItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0

    return {
      message: `You have ${cartCount} item${cartCount > 1 ? 's' : ''} in your cart totaling $${totalValue.toFixed(2)}. Would you like me to help optimize your selection or proceed to checkout?`,
      suggestedQuestions: [
        'Optimize my cart selection',
        'Are there any compatible accessories?',
        'Check for available discounts',
      ],
      confidence: 0.9,
    }
  }

  private generateDefaultResponse(_question: string, _context: AIContext): AIResponse {
    const responses = [
      "I'm here to help you with two-phase cooling systems! What specific information are you looking for?",
      'I can assist with product recommendations, technical questions, or troubleshooting. What would you like to know?',
      "As your cooling systems expert, I'm ready to help. What questions do you have about two-phase cooling?",
      "I'd be happy to help you find the right cooling solution. What are your specific requirements?",
    ]

    const randomIndex = Math.floor(Math.random() * responses.length)
    const selectedResponse = responses[randomIndex] ?? responses[0] ?? ''
    return {
      message: selectedResponse,
      suggestedQuestions: [
        'How does two-phase cooling work?',
        "What's the best cooling system for my setup?",
        'Show me your most popular products',
        'Help me troubleshoot my cooling system',
      ],
      confidence: 0.6,
    }
  }

  private getSuggestedQuestions(category: string): string[] {
    const suggestions: Record<string, string[]> = {
      technology: [
        'How does vapor chamber technology work?',
        "What's the difference between air and liquid cooling?",
        'Explain phase change cooling principles',
      ],
      performance: [
        'How much temperature reduction can I expect?',
        "What's the noise level compared to traditional cooling?",
        'How does this affect overclocking potential?',
      ],
      environmental: [
        "What's the environmental impact?",
        'How energy efficient are these systems?',
        'What refrigerants are used?',
      ],
      products: [
        'Which product is right for my system?',
        "What's included in the package?",
        'How do I install this cooling system?',
      ],
    }

    return suggestions[category] ?? suggestions.technology ?? []
  }

  private isCartRelated(question: string): boolean {
    const cartKeywords = ['cart', 'checkout', 'order', 'buy', 'purchase', 'add to cart']
    return cartKeywords.some(keyword => question.includes(keyword))
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ').filter(w => w.length > 2)
    const words2 = text2.split(' ').filter(w => w.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const commonWords = words1.filter(word => words2.includes(word))
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  getCostEstimate(_messages: ChatMessage[]): number {
    // Mock provider is free
    return 0
  }
}
