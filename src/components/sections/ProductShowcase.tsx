'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  maxProducts = 6,
}) => {
  // State for fetched products
  const [featuredProducts, setFeaturedProducts] = useState<TwoPhaseCoolingProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch products from database
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        // Get only featured products (complete-cases category) and limit
        const featured = data
          .filter((p: TwoPhaseCoolingProduct) => p.categories.includes('complete-cases'))
          .slice(0, maxProducts)
        setFeaturedProducts(featured)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [maxProducts])

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
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  // Update products when featuredProducts changes
  useEffect(() => {
    const converted = convertToLegacyFormat(featuredProducts)
    setProducts(converted)
  }, [featuredProducts])

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
              <h2 className={styles.title}>Products</h2>
            </div>
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

                  <div className={styles.filtersGrid}>
                    {/* Category Filter */}
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Category</label>
                      <select
                        value={filters.category}
                        onChange={e => handleFilterChange({ category: e.target.value })}
                        className={styles.filterSelect}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Price Range</label>
                      <div className={styles.priceRangeGroup}>
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
                          className={styles.filterInput}
                        />
                        <div className={styles.priceDisplay}>
                          ${filters.priceRange[0]} - ${filters.priceRange[1]}
                        </div>
                      </div>
                    </div>

                    {/* Sort By */}
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Sort By</label>
                      <select
                        value={filters.sortBy}
                        onChange={e => handleFilterChange({ sortBy: e.target.value as any })}
                        className={styles.filterSelect}
                      >
                        <option value='featured'>Featured</option>
                        <option value='name'>Name A-Z</option>
                        <option value='price_low'>Price: Low to High</option>
                        <option value='price_high'>Price: High to Low</option>
                        <option value='newest'>Newest First</option>
                      </select>
                    </div>

                    {/* Stock Filter */}
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel}>Availability</label>
                      <label className={styles.checkboxGroup}>
                        <input
                          type='checkbox'
                          checked={filters.inStock}
                          onChange={e => handleFilterChange({ inStock: e.target.checked })}
                          className={styles.checkboxInput}
                        />
                        <span className={styles.checkboxLabel}>In Stock Only</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* View Controls */}
                <div className={styles.viewControls}>
                  <div className={styles.viewToggle}>
                    <span className={styles.viewLabel}>View:</span>
                    <div className={styles.viewButtons}>
                      <button
                        onClick={() => handleViewModeChange({ type: 'grid' })}
                        className={`${styles.viewButton} ${viewMode.type === 'grid' ? styles.active : ''}`}
                        aria-label='Grid view'
                      >
                        <Squares2X2Icon className={styles.smallIcon} />
                      </button>
                      <button
                        onClick={() => handleViewModeChange({ type: 'list' })}
                        className={`${styles.viewButton} ${viewMode.type === 'list' ? styles.active : ''}`}
                        aria-label='List view'
                      >
                        <ListBulletIcon className={styles.smallIcon} />
                      </button>
                    </div>
                  </div>

                  {viewMode.type === 'grid' && (
                    <div className={styles.columnSelect}>
                      <span className={styles.viewLabel}>Columns:</span>
                      <select
                        value={viewMode.gridCols}
                        onChange={e =>
                          handleViewModeChange({ gridCols: parseInt(e.target.value) as any })
                        }
                        className={styles.columnSelectInput}
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
              <div className={styles.resultsSummary}>
                <p className={styles.resultsText}>
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
            </div>
          )}

          {/* Products Grid/List */}
          <div className={styles.productsSection}>
            {loading ? (
              <div className={styles.loadingState}>Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.noProducts}>
                <div className={styles.noProductsIcon}>🔍</div>
                <h3 className={styles.noProductsTitle}>No products found</h3>
                <p className={styles.noProductsText}>
                  Try adjusting your filters or search criteria
                </p>
                <button onClick={resetFilters} className={styles.noProductsButton}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode.type === 'grid'
                    ? `${styles.productsGrid} ${styles[`productsGrid${viewMode.gridCols}`] || styles.productsGrid2}`
                    : styles.productsList
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
                            {product.features.slice(0, 2).map((feature: string, index: number) => (
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
            <div className={styles.viewAllSection}>
              <Link href='/products' className={styles.viewAllButton}>
                View All Products & Specifications
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
