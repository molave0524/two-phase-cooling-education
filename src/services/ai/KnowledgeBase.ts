import { FAQ_CONTENT } from '@/data/faq-content'
import { PRODUCTS } from '@/data/products'

export interface KnowledgeItem {
  id: string
  type: 'faq' | 'product' | 'video' | 'guide'
  category: string
  title: string
  content: string
  keywords: string[]
  priority: number
  metadata?: Record<string, any>
}

export interface SearchResult {
  item: KnowledgeItem
  relevanceScore: number
  matchedKeywords: string[]
}

class KnowledgeBase {
  private items: KnowledgeItem[] = []
  private isInitialized = false

  /**
   * Initialize the knowledge base with all available content
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    this.items = [
      ...this.processFAQContent(),
      ...this.processProductContent(),
      // TODO: Add video content and guides
    ]

    this.isInitialized = true
  }

  /**
   * Search for relevant knowledge items
   */
  search(
    query: string,
    options?: {
      type?: KnowledgeItem['type']
      category?: string
      maxResults?: number
      minScore?: number
    }
  ): SearchResult[] {
    if (!this.isInitialized) {
      throw new Error('Knowledge base not initialized')
    }

    const { type, category, maxResults = 5, minScore = 0.1 } = options || {}

    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(' ').filter(word => word.length > 2)

    let filteredItems = this.items

    // Apply filters
    if (type) {
      filteredItems = filteredItems.filter(item => item.type === type)
    }

    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category)
    }

    // Calculate relevance scores
    const results: SearchResult[] = filteredItems
      .map(item => {
        const score = this.calculateRelevanceScore(queryWords, item)
        const matchedKeywords = this.findMatchedKeywords(queryWords, item)

        return {
          item,
          relevanceScore: score,
          matchedKeywords,
        }
      })
      .filter(result => result.relevanceScore >= minScore)
      .sort((a, b) => {
        // Sort by priority first, then by relevance score
        const priorityDiff = b.item.priority - a.item.priority
        if (priorityDiff !== 0) return priorityDiff
        return b.relevanceScore - a.relevanceScore
      })
      .slice(0, maxResults)

    return results
  }

  /**
   * Get all items of a specific type
   */
  getByType(type: KnowledgeItem['type']): KnowledgeItem[] {
    return this.items.filter(item => item.type === type)
  }

  /**
   * Get all categories for a type
   */
  getCategories(type?: KnowledgeItem['type']): string[] {
    const items = type ? this.getByType(type) : this.items
    return Array.from(new Set(items.map(item => item.category)))
  }

  /**
   * Get suggested questions based on category
   */
  getSuggestedQuestions(category?: string): string[] {
    const items = category ? this.items.filter(item => item.category === category) : this.items

    return items
      .filter(item => item.type === 'faq')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4)
      .map(item => item.title)
  }

  /**
   * Process FAQ content into knowledge items
   */
  private processFAQContent(): KnowledgeItem[] {
    const items: KnowledgeItem[] = []

    // FAQ_CONTENT is an array, not an object with categories
    FAQ_CONTENT.forEach((faq, index) => {
      items.push({
        id: faq.id || `faq-${index}`,
        type: 'faq',
        category: faq.category,
        title: faq.question,
        content: faq.answer,
        keywords: this.extractKeywords(faq.question + ' ' + faq.answer),
        priority: this.getFAQPriority(faq.category, faq.question),
        metadata: {
          originalQuestion: faq.question,
          originalAnswer: faq.answer,
        },
      })
    })

    return items
  }

  /**
   * Process product content into knowledge items
   */
  private processProductContent(): KnowledgeItem[] {
    return PRODUCTS.map(product => ({
      id: `product-${product.id}`,
      type: 'product' as const,
      category: product.categories[0] || 'cooling-systems',
      title: product.name,
      content: `${product.description} ${product.shortDescription} Price: $${product.price}`,
      keywords: this.extractKeywords(
        `${product.name} ${product.description} ${product.shortDescription} ${product.categories.join(' ')} ${product.tags.join(' ')}`
      ),
      priority: this.getProductPriority(product),
      metadata: {
        product,
        price: product.price,
        category: product.categories[0],
        inStock: product.stockQuantity > 0,
      },
    }))
  }

  /**
   * Calculate relevance score for a knowledge item
   */
  private calculateRelevanceScore(queryWords: string[], item: KnowledgeItem): number {
    const titleWords = item.title.toLowerCase().split(' ')
    const contentWords = item.content.toLowerCase().split(' ')
    const keywords = item.keywords.map(k => k.toLowerCase())

    let score = 0

    // Title matches (highest weight)
    queryWords.forEach(word => {
      if (titleWords.some(titleWord => titleWord.includes(word))) {
        score += 0.4
      }
    })

    // Keyword matches (medium weight)
    queryWords.forEach(word => {
      if (keywords.some(keyword => keyword.includes(word))) {
        score += 0.3
      }
    })

    // Content matches (lower weight)
    queryWords.forEach(word => {
      if (contentWords.some(contentWord => contentWord.includes(word))) {
        score += 0.1
      }
    })

    // Normalize by query length
    return Math.min(score / queryWords.length, 1.0)
  }

  /**
   * Find matched keywords for highlighting
   */
  private findMatchedKeywords(queryWords: string[], item: KnowledgeItem): string[] {
    const matched: string[] = []
    const allWords = [
      ...item.title.toLowerCase().split(' '),
      ...item.keywords.map(k => k.toLowerCase()),
    ]

    queryWords.forEach(word => {
      const match = allWords.find(w => w.includes(word))
      if (match && !matched.includes(match)) {
        matched.push(match)
      }
    })

    return matched
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 2)

    // Remove common words
    const commonWords = [
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'had',
      'her',
      'was',
      'one',
      'our',
      'out',
      'day',
      'get',
      'has',
      'him',
      'his',
      'how',
      'its',
      'may',
      'new',
      'now',
      'old',
      'see',
      'two',
      'who',
      'boy',
      'did',
      'man',
      'way',
    ]

    return Array.from(new Set(words.filter(word => !commonWords.includes(word))))
  }

  /**
   * Determine FAQ priority based on category and content
   */
  private getFAQPriority(category: string, question: string): number {
    const highPriorityCategories = ['technology', 'performance']
    const highPriorityKeywords = ['how', 'what', 'why', 'install', 'setup', 'problem', 'issue']

    let priority = 5 // base priority

    if (highPriorityCategories.includes(category)) {
      priority += 2
    }

    if (highPriorityKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
      priority += 1
    }

    return priority
  }

  /**
   * Determine product priority based on features
   */
  private getProductPriority(product: any): number {
    let priority = 5 // base priority

    if (product.tags.includes('featured')) {
      priority += 3
    }

    if (product.tags.includes('bestseller')) {
      priority += 2
    }

    if (product.stockQuantity > 0) {
      priority += 1
    }

    return priority
  }

  /**
   * Get knowledge base statistics
   */
  getStats(): {
    totalItems: number
    byType: Record<string, number>
    byCategory: Record<string, number>
  } {
    const byType: Record<string, number> = {}
    const byCategory: Record<string, number> = {}

    this.items.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1
      byCategory[item.category] = (byCategory[item.category] || 0) + 1
    })

    return {
      totalItems: this.items.length,
      byType,
      byCategory,
    }
  }
}

// Export singleton instance
export const knowledgeBase = new KnowledgeBase()

// Export class for testing
export { KnowledgeBase }
