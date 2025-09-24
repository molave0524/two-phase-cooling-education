'use client'

import React, { useState, useMemo } from 'react'
import { FAQ_CONTENT, FAQ_CATEGORIES, FAQItem } from '@/data/faq-content'
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export const FAQSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Filter FAQs based on category and search query
  const filteredFAQs = useMemo(() => {
    let filtered = FAQ_CONTENT

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        faq =>
          faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [selectedCategory, searchQuery])

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
    <div className='space-y-8'>
      {/* Search and Filters */}
      <div className='space-y-6'>
        {/* Search Bar */}
        <div className='relative max-w-md mx-auto'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <MagnifyingGlassIcon className='h-5 w-5 text-secondary-400' />
          </div>
          <input
            type='text'
            placeholder='Search FAQ...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='block w-full pl-10 pr-3 py-3 border border-secondary-300 rounded-equipment text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          />
        </div>

        {/* Category Filters */}
        <div className='flex flex-wrap justify-center gap-2'>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-equipment text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
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
                className={`px-4 py-2 rounded-equipment text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                {category.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Expand/Collapse Controls */}
        {filteredFAQs.length > 0 && (
          <div className='flex justify-center gap-4'>
            <button
              onClick={expandAll}
              className='text-sm text-secondary-700 hover:text-secondary-900 font-medium'
            >
              Expand All
            </button>
            <span className='text-secondary-400'>|</span>
            <button
              onClick={collapseAll}
              className='text-sm text-secondary-700 hover:text-secondary-900 font-medium'
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className='text-center text-secondary-600'>
          Found {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      )}

      {/* FAQ Items */}
      <div className='space-y-4 max-w-4xl mx-auto'>
        {filteredFAQs.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-secondary-500 text-lg'>
              {searchQuery
                ? 'No questions found matching your search.'
                : 'No questions in this category.'}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='mt-4 text-primary-600 hover:text-primary-700 font-medium'
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredFAQs.map(faq => {
            const isExpanded = expandedItems.has(faq.id)
            const category = FAQ_CATEGORIES.find(cat => cat.id === faq.category)

            return (
              <div
                key={faq.id}
                className='bg-white border border-secondary-200 rounded-equipment shadow-sm hover:shadow-md transition-shadow'
              >
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className='w-full px-6 py-4 text-left flex items-center justify-between hover:bg-secondary-50 transition-colors rounded-equipment'
                >
                  <div className='flex-1 space-y-1'>
                    <h3 className='text-lg font-semibold text-secondary-900 pr-4'>
                      {faq.question}
                    </h3>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          category?.id === 'technology'
                            ? 'bg-secondary-100 text-secondary-700'
                            : category?.id === 'performance'
                              ? 'bg-secondary-100 text-secondary-700'
                              : category?.id === 'environmental'
                                ? 'bg-secondary-100 text-secondary-700'
                                : 'bg-secondary-100 text-secondary-700'
                        }`}
                      >
                        {category?.name}
                      </span>
                    </div>
                  </div>
                  <div className='flex-shrink-0 ml-4'>
                    {isExpanded ? (
                      <ChevronUpIcon className='h-5 w-5 text-secondary-400' />
                    ) : (
                      <ChevronDownIcon className='h-5 w-5 text-secondary-400' />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className='px-6 pb-4'>
                    <div className='border-t border-secondary-200 pt-4'>
                      <p className='text-secondary-700 leading-relaxed whitespace-pre-line'>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Category Overview */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <div className='mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {FAQ_CATEGORIES.map(category => {
            const count = FAQ_CONTENT.filter(faq => faq.category === category.id).length
            return (
              <div
                key={category.id}
                className='text-center p-6 bg-secondary-50 rounded-equipment hover:bg-secondary-100 transition-colors cursor-pointer'
                onClick={() => setSelectedCategory(category.id)}
              >
                <h3 className='text-lg font-semibold text-secondary-900 mb-2'>{category.name}</h3>
                <p className='text-sm text-secondary-600 mb-3'>{category.description}</p>
                <p className='text-primary-600 font-medium'>
                  {count} question{count !== 1 ? 's' : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
