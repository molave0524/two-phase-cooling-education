'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { FAQ_CONTENT, FAQ_CATEGORIES } from '@/data/faq-content'
import { knowledgeBase, SearchResult } from '@/services/ai/KnowledgeBase'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import styles from './FAQSection.module.css'

export const FAQSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [useSmartSearch, setUseSmartSearch] = useState(false)
  const [smartSearchResults, setSmartSearchResults] = useState<SearchResult[]>([])
  const [isKnowledgeBaseReady, setIsKnowledgeBaseReady] = useState(false)

  // Initialize knowledge base
  useEffect(() => {
    const initKB = async () => {
      try {
        await knowledgeBase.initialize()
        setIsKnowledgeBaseReady(true)
      } catch (error) {
        console.error('Failed to initialize knowledge base:', error)
      }
    }
    initKB()
  }, [])

  // Perform smart search when enabled
  useEffect(() => {
    const performSmartSearch = async () => {
      if (!searchQuery.trim() || !isKnowledgeBaseReady || !useSmartSearch) {
        setSmartSearchResults([])
        return
      }

      try {
        const searchOptions: {
          type: 'faq'
          category?: string
          maxResults: number
          minScore: number
        } = {
          type: 'faq',
          maxResults: 10,
          minScore: 0.1,
        }

        if (selectedCategory !== 'all') {
          searchOptions.category = selectedCategory
        }

        const results = knowledgeBase.search(searchQuery, searchOptions)
        setSmartSearchResults(results)
      } catch (error) {
        console.error('Smart search failed:', error)
        setSmartSearchResults([])
      }
    }

    const debounceTimer = setTimeout(performSmartSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, selectedCategory, useSmartSearch, isKnowledgeBaseReady])

  // Filter FAQs based on category and search query
  const filteredFAQs = useMemo(() => {
    // If using smart search and have results, use those
    if (useSmartSearch && smartSearchResults.length > 0) {
      return smartSearchResults
        .map(result => {
          const faqId = result.item.id.replace('faq-', '').split('-').slice(1).join('-')
          return FAQ_CONTENT.find(
            faq =>
              faq.question === result.item.title ||
              faq.id === faqId ||
              faq.question.includes(result.item.title.slice(0, 50))
          )
        })
        .filter(Boolean) as typeof FAQ_CONTENT
    }

    // Otherwise use traditional filtering
    let filtered = FAQ_CONTENT

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim() && !useSmartSearch) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        faq =>
          faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [selectedCategory, searchQuery, useSmartSearch, smartSearchResults])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const expandAll = () => {
    setExpandedItems(new Set(filteredFAQs.map(faq => faq.id)))
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  return (
    <div className={styles.faqWrapper}>
      {/* Search and Filters */}
      <div className={styles.searchControls}>
        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchIconContainer}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
          </div>
          <input
            type='text'
            placeholder={
              useSmartSearch ? 'Ask any question about two-phase cooling...' : 'Search FAQ...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {isKnowledgeBaseReady && (
            <button
              onClick={() => setUseSmartSearch(!useSmartSearch)}
              className={`${styles.smartSearchToggle} ${useSmartSearch ? styles.smartSearchActive : ''}`}
              title={useSmartSearch ? 'Switch to basic search' : 'Switch to AI-powered search'}
            >
              <SparklesIcon className='w-4 h-4' />
              {useSmartSearch ? 'Smart' : 'Basic'}
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className={styles.categoryFilters}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`${styles.categoryButton} ${
              selectedCategory === 'all'
                ? styles.categoryButtonActive
                : styles.categoryButtonInactive
            }`}
          >
            All Questions ({FAQ_CONTENT.length})
          </button>
          {FAQ_CATEGORIES.map(category => {
            const count = FAQ_CONTENT.filter(faq => faq.category === category.id).length
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.id
                    ? styles.categoryButtonActive
                    : styles.categoryButtonInactive
                }`}
              >
                {category.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Expand/Collapse Controls */}
        {filteredFAQs.length > 0 && (
          <div className={styles.expandControls}>
            <button onClick={expandAll} className={styles.expandButton}>
              Expand All
            </button>
            <span className={styles.expandSeparator}>|</span>
            <button onClick={collapseAll} className={styles.expandButton}>
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className={styles.resultsCount}>
          <span>
            Found {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </span>
          {useSmartSearch && smartSearchResults.length > 0 && (
            <span className={styles.smartSearchBadge}>
              <SparklesIcon className='w-3 h-3' />
              AI-powered results
            </span>
          )}
        </div>
      )}

      {/* FAQ Items */}
      <div className={styles.faqContainer}>
        {filteredFAQs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateMessage}>
              {searchQuery
                ? 'No questions found matching your search.'
                : 'No questions in this category.'}
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={styles.emptyStateClearButton}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredFAQs.map(faq => {
            const isExpanded = expandedItems.has(faq.id)
            const category = FAQ_CATEGORIES.find(cat => cat.id === faq.category)

            return (
              <div key={faq.id} className={styles.faqItem}>
                <button onClick={() => toggleExpanded(faq.id)} className={styles.faqButton}>
                  <div className={styles.faqButtonContent}>
                    <h3 className={styles.faqQuestion}>{faq.question}</h3>
                    <div className={styles.faqCategoryContainer}>
                      <span
                        className={`${styles.faqCategoryBadge} ${
                          category?.id === 'technology'
                            ? styles.faqCategoryTechnology
                            : category?.id === 'performance'
                              ? styles.faqCategoryPerformance
                              : category?.id === 'environmental'
                                ? styles.faqCategoryEnvironmental
                                : styles.faqCategorySupport
                        }`}
                      >
                        {category?.name}
                      </span>
                    </div>
                  </div>
                  <div className={styles.faqToggleIcon}>
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </div>
                </button>

                {isExpanded && (
                  <div className={styles.faqAnswer}>
                    <div className={styles.faqAnswerContent}>
                      <p className={styles.faqAnswerText}>{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
