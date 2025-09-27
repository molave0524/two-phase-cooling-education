'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedProducts } from '@/data/products'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { useCartStore } from '@/stores/cartStore'
import {
  SparklesIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import styles from './ProductShowcase.module.css'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ProductShowcaseProps {
  className?: string
  showFilters?: boolean
  maxProducts?: number
}

interface FilterState {
  category: string
  priceRange: [number, number]
  sortBy: 'name' | 'price_low' | 'price_high' | 'featured' | 'newest'
  inStock: boolean
}

interface ViewMode {
  type: 'grid' | 'list'
  gridCols: 2 | 3 | 4
}

// ============================================================================
// LEGACY SAMPLE DATA (keeping for backwards compatibility)
// ============================================================================

// ============================================================================
// PRODUCT SHOWCASE COMPONENT
// ============================================================================

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  className = '',
  showFilters = false,
  maxProducts = 4,
}) => {
  // Get featured products from new data structure
  const featuredProducts = getFeaturedProducts().slice(0, maxProducts)

  // Legacy conversion for backward compatibility
  const convertToLegacyFormat = (products: TwoPhaseCoolingProduct[]) => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      price_cents: product.price * 100,
      currency: product.currency,
      compare_at_price: product.originalPrice ? product.originalPrice * 100 : undefined,
      stock_quantity: product.stockQuantity,
      image: product.images[0]?.url || '',
      images: product.images.map(img => img.url),
      category: product.categories[0] || 'Computer Cases',
      sku: product.sku,
      is_featured: product.categories.includes('complete-cases'),
      is_digital: false,
      is_active: product.inStock,
      sort_order: 1,
      meta_title: product.metaTitle,
      meta_description: product.metaDescription,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
      specifications: {
        cooling: {
          gwpRating: product.specifications.environmental.gwp.toString(),
          type: 'Two-Phase Immersion',
        },
        formFactor: 'Mid-Tower ATX',
        compatibility: {
          motherboard: product.specifications.compatibility.cpuSockets,
        },
        contents: [],
        educational: false,
      },
      features: product.features,
    }))
  }

  // Component state
  const [products] = useState(convertToLegacyFormat(featuredProducts))
  const [filteredProducts, setFilteredProducts] = useState(products)

  // Filter and view state
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 2000],
    sortBy: 'featured',
    inStock: false,
  })

  const [viewMode, setViewMode] = useState<ViewMode>({
    type: 'grid',
    gridCols: 3,
  })

  // const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]
  const maxPrice = Math.max(...products.map(p => p.price_cents / 100))

  // ============================================================================
  // FILTERING AND SORTING
  // ============================================================================

  useEffect(() => {
    let filtered = [...products]

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category)
    }

    // Price range filter
    filtered = filtered.filter(p => {
      const price = p.price_cents / 100
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(p => p.stock_quantity > 0)
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price_low':
          return a.price_cents - b.price_cents
        case 'price_high':
          return b.price_cents - a.price_cents
        case 'featured':
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          return (a.sort_order || 0) - (b.sort_order || 0)
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
  }, [products, filters])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleViewModeChange = (newViewMode: Partial<ViewMode>) => {
    setViewMode(prev => ({ ...prev, ...newViewMode }))
  }

  const { addItem } = useCartStore()

  const handleAddToCart = (product: any) => {
    // Convert legacy format back to TwoPhaseCoolingProduct for cart
    const originalProduct = featuredProducts.find(p => p.id === product.id)
    if (originalProduct) {
      addItem(originalProduct, 1)
    }
  }

  const resetFilters = () => {
    setFilters({
      category: 'all',
      priceRange: [0, maxPrice],
      sortBy: 'featured',
      inStock: false,
    })
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.showcaseSection}>
      <div className={styles.container}>
        <div className={`${styles.content} ${className}`}>
          {/* Section Header */}
          <div className={styles.header}>
            <div className={styles.titleWrapper}>
              <SparklesIcon className={styles.titleIcon} />
              <h2 className={styles.title}>Revolutionary Products</h2>
            </div>
            <p className={styles.subtitle}>
              Experience the future of computer cooling with our innovative two-phase cooling
              solutions. Each product is engineered for superior thermal performance and
              environmental responsibility.
            </p>
          </div>

          {/* Filters and Controls */}
          {showFilters && (
            <div className={styles.filtersPanel}>
              <div className={styles.filtersContent}>
                {/* Filter Controls */}
                <div className={styles.filtersMain}>
                  <div className={styles.filtersHeader}>
                    <h3 className={styles.filtersTitle}>
                      <FunnelIcon className={styles.filtersIcon} />
                      Filters
                    </h3>
                    <button onClick={resetFilters} className={styles.resetButton}>
                      Reset All
                    </button>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {/* Category Filter */}
                    <div>
                      <label className='block text-sm font-medium text-secondary-700 mb-2'>
                        Category
                      </label>
                      <select
                        value={filters.category}
                        onChange={e => handleFilterChange({ category: e.target.value })}
                        className='input w-full'
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className='block text-sm font-medium text-secondary-700 mb-2'>
                        Price Range
                      </label>
                      <div className='space-y-2'>
                        <input
                          type='range'
                          min='0'
                          max={maxPrice}
                          value={filters.priceRange[1]}
                          onChange={e =>
                            handleFilterChange({
                              priceRange: [filters.priceRange[0], parseInt(e.target.value)],
                            })
                          }
                          className='w-full'
                        />
                        <div className='text-sm text-secondary-600'>
                          ${filters.priceRange[0]} - ${filters.priceRange[1]}
                        </div>
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className='block text-sm font-medium text-secondary-700 mb-2'>
                        Sort By
                      </label>
                      <select
                        value={filters.sortBy}
                        onChange={e => handleFilterChange({ sortBy: e.target.value as any })}
                        className='input w-full'
                      >
                        <option value='featured'>Featured</option>
                        <option value='name'>Name A-Z</option>
                        <option value='price_low'>Price: Low to High</option>
                        <option value='price_high'>Price: High to Low</option>
                        <option value='newest'>Newest First</option>
                      </select>
                    </div>

                    {/* Stock Filter */}
                    <div>
                      <label className='block text-sm font-medium text-secondary-700 mb-2'>
                        Availability
                      </label>
                      <label className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={filters.inStock}
                          onChange={e => handleFilterChange({ inStock: e.target.checked })}
                          className='rounded border-secondary-300 text-primary-600 focus:ring-primary-500'
                        />
                        <span className='ml-2 text-sm text-secondary-700'>In Stock Only</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* View Controls */}
                <div className='flex items-center gap-4 lg:border-l lg:border-secondary-200 lg:pl-6'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-secondary-700'>View:</span>
                    <div className='flex rounded-technical border border-secondary-300 overflow-hidden'>
                      <button
                        onClick={() => handleViewModeChange({ type: 'grid' })}
                        className={`p-2 ${viewMode.type === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-600'}`}
                        aria-label='Grid view'
                      >
                        <Squares2X2Icon className={styles.smallIcon} />
                      </button>
                      <button
                        onClick={() => handleViewModeChange({ type: 'list' })}
                        className={`p-2 ${viewMode.type === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-600'}`}
                        aria-label='List view'
                      >
                        <ListBulletIcon className={styles.smallIcon} />
                      </button>
                    </div>
                  </div>

                  {viewMode.type === 'grid' && (
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-secondary-700'>Columns:</span>
                      <select
                        value={viewMode.gridCols}
                        onChange={e =>
                          handleViewModeChange({ gridCols: parseInt(e.target.value) as any })
                        }
                        className='input text-sm py-1'
                      >
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Summary */}
              <div className='mt-4 pt-4 border-t border-secondary-200'>
                <p className='text-sm text-secondary-600'>
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
            </div>
          )}

          {/* Products Grid/List */}
          <div className='space-y-6'>
            {filteredProducts.length === 0 ? (
              <div className='text-center py-12'>
                <div className='text-secondary-400 text-6xl mb-4'>🔍</div>
                <h3 className='text-xl font-semibold text-secondary-900 mb-2'>No products found</h3>
                <p className='text-secondary-600 mb-4'>
                  Try adjusting your filters or search criteria
                </p>
                <button onClick={resetFilters} className='btn-primary'>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode.type === 'grid'
                    ? `${styles.productsGrid} ${styles[`productsGrid${viewMode.gridCols}`] || styles.productsGrid2}`
                    : 'space-y-4'
                }
              >
                {filteredProducts.map(product => (
                  <div key={product.id} className={styles.productCard}>
                    {/* Product Image */}
                    <div className={styles.productImageContainer}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        className={styles.productImage}
                        fill
                        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      />
                      {product.compare_at_price && <div className={styles.saleTag}>Sale</div>}
                    </div>

                    {/* Product Info */}
                    <div className={styles.productInfo}>
                      <h3 className={styles.productTitle}>{product.name}</h3>
                      <p className={styles.productDescription}>{product.description}</p>

                      {/* Key Features */}
                      {product.features && (
                        <div className={styles.productFeatures}>
                          <div className={styles.featuresContainer}>
                            {product.features.slice(0, 2).map((feature, index) => (
                              <span key={index} className={styles.featureTag}>
                                {feature.length > 25 ? `${feature.substring(0, 25)}...` : feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pricing */}
                      <div className={styles.productPricing}>
                        <div className={styles.pricingContainer}>
                          <span className={styles.currentPrice}>
                            ${product.price.toLocaleString()}
                          </span>
                          {product.compare_at_price && (
                            <span className={styles.originalPrice}>
                              ${(product.compare_at_price / 100).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={styles.productActions}>
                        <Link
                          href={`/products/${product.slug}`}
                          className={`${styles.actionButton} ${styles.primaryButton}`}
                        >
                          View Details & Specifications
                        </Link>
                        <button
                          className={`${styles.actionButton} ${styles.secondaryButton}`}
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock_quantity === 0}
                        >
                          {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View All Products Link */}
          {!showFilters && (
            <div className='text-center mt-12'>
              <Link href='/products' className='btn btn-primary btn-lg'>
                View All Products & Specifications
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
