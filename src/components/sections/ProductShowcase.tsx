'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/product/ProductCard'
import { getFeaturedProducts } from '@/data/products'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { useCartStore } from '@/stores/cartStore'
import {
  SparklesIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

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

const LEGACY_SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'Two-Phase Cooling Case Pro',
    slug: 'two-phase-cooling-case-pro',
    description:
      'Our flagship computer case featuring integrated two-phase cooling system with transparent panels for visual monitoring.',
    price: 899,
    price_cents: 89900,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=640&h=480',
    compare_at_price: 119900,
    currency: 'USD',
    category: 'Computer Cases',
    specifications: {
      formFactor: 'Mid-Tower ATX',
      cooling: { gwpRating: '20', type: 'Two-Phase Immersion' },
      compatibility: { motherboard: ['ATX', 'Micro-ATX', 'Mini-ITX'] },
    },
    features: [
      'Integrated two-phase cooling system',
      'Transparent tempered glass panels',
      'Real-time temperature monitoring',
      'RGB lighting system',
    ],
    images: [
      'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=640&h=480',
      'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=640&h=480',
      'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=640&h=480',
    ],
    stock_quantity: 50,
    sku: 'TPC-CASE-PRO-001',
    is_digital: false,
    is_active: true,
    is_featured: true,
    sort_order: 1,
    meta_title: 'Two-Phase Cooling Case Pro',
    meta_description: 'Revolutionary computer case with two-phase cooling technology',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    name: 'Two-Phase Cooling Case Essential',
    slug: 'two-phase-cooling-case-essential',
    description:
      'Entry-level two-phase cooling case perfect for enthusiasts wanting to experience revolutionary cooling technology.',
    price: 599,
    price_cents: 59900,
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=640&h=480',
    compare_at_price: 79900,
    currency: 'USD',
    category: 'Computer Cases',
    specifications: {
      formFactor: 'Micro-ATX',
      cooling: { gwpRating: '20', type: 'Two-Phase Immersion' },
      compatibility: { motherboard: ['Micro-ATX', 'Mini-ITX'] },
    },
    features: [
      'Compact two-phase cooling system',
      'Acrylic viewing panels',
      'Silent operation',
      'Easy installation',
    ],
    images: [
      'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=640&h=480',
      'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=640&h=480',
    ],
    stock_quantity: 75,
    sku: 'TPC-CASE-ESS-001',
    is_digital: false,
    is_active: true,
    is_featured: false,
    sort_order: 2,
    meta_title: 'Two-Phase Cooling Case Essential',
    meta_description: 'Affordable two-phase cooling case for enthusiasts',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '3',
    name: 'Educational Kit - Thermal Dynamics',
    slug: 'educational-kit-thermal-dynamics',
    description:
      'Comprehensive educational kit for understanding thermal dynamics principles in two-phase cooling systems.',
    price: 199,
    price_cents: 19900,
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=640&h=480',
    // compare_at_price: undefined,
    currency: 'USD',
    category: 'Educational Materials',
    specifications: {
      contents: ['Demo unit', 'Sensors', 'Workbook', 'Video access'],
      educational: true,
    },
    features: [
      'Hands-on learning experience',
      'Real-time data collection',
      'Curriculum-aligned materials',
      'STEM education certified',
    ],
    images: [
      'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=640&h=480',
      'https://images.unsplash.com/photo-1616469829271-0a7e8ebcb668?w=640&h=480',
    ],
    stock_quantity: 100,
    sku: 'TPC-EDU-KIT-001',
    is_digital: false,
    is_active: true,
    is_featured: true,
    sort_order: 3,
    meta_title: 'Educational Kit - Thermal Dynamics',
    meta_description: 'Learn thermal dynamics with hands-on educational kit',
    created_at: new Date(),
    updated_at: new Date(),
  },
]

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
  const [filteredProducts, setFilteredProducts] = useState<Products[]>(products)

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

  const handleAddToWishlist = async (product: Products) => {
    try {
      // In production, make actual API call
      const response = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to update wishlist')
      }

      const result = await response.json()
      toast.success(result.added ? 'Added to wishlist!' : 'Removed from wishlist')
    } catch (error) {
      console.error('Wishlist error:', error)
      toast.error('Failed to update wishlist')
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
    <div className={`space-y-8 ${className}`}>
      {/* Section Header */}
      <div className='text-center space-y-4'>
        <div className='flex items-center justify-center gap-2'>
          <SparklesIcon className='w-8 h-8 text-primary-600' />
          <h2 className='text-3xl font-bold text-secondary-900'>Revolutionary Products</h2>
        </div>
        <p className='text-lg text-secondary-600 max-w-3xl mx-auto'>
          Experience the future of computer cooling with our innovative two-phase cooling solutions.
          Each product is engineered for superior thermal performance and environmental
          responsibility.
        </p>
      </div>

      {/* Filters and Controls */}
      {showFilters && (
        <div className='bg-white rounded-equipment shadow-glass border border-secondary-200 p-6'>
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Filter Controls */}
            <div className='flex-1 space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-secondary-900 flex items-center gap-2'>
                  <FunnelIcon className='w-5 h-5' />
                  Filters
                </h3>
                <button
                  onClick={resetFilters}
                  className='text-sm text-primary-600 hover:text-primary-700 font-medium'
                >
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
                    <Squares2X2Icon className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleViewModeChange({ type: 'list' })}
                    className={`p-2 ${viewMode.type === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-600'}`}
                    aria-label='List view'
                  >
                    <ListBulletIcon className='w-4 h-4' />
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
            <p className='text-secondary-600 mb-4'>Try adjusting your filters or search criteria</p>
            <button onClick={resetFilters} className='btn-primary'>
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode.type === 'grid'
                ? `grid grid-cols-1 md:grid-cols-${viewMode.gridCols} gap-6`
                : 'space-y-4'
            }
          >
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className='bg-white rounded-equipment shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300'
              >
                {/* Product Image */}
                <div className='relative aspect-[4/3] overflow-hidden'>
                  <img
                    src={product.image}
                    alt={product.name}
                    className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                  />
                  {product.compare_at_price && (
                    <div className='absolute top-4 right-4'>
                      <span className='bg-accent-500 text-white px-3 py-1 text-xs font-semibold rounded-full'>
                        Sale
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className='p-6'>
                  <h3 className='text-xl font-semibold text-secondary-900 mb-2'>{product.name}</h3>
                  <p className='text-secondary-600 mb-4 line-clamp-3'>{product.description}</p>

                  {/* Key Features */}
                  {product.features && (
                    <div className='mb-4'>
                      <div className='flex flex-wrap gap-2'>
                        {product.features.slice(0, 2).map((feature, index) => (
                          <span
                            key={index}
                            className='inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full'
                          >
                            {feature.length > 25 ? `${feature.substring(0, 25)}...` : feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className='mb-4'>
                    <div className='flex items-center gap-2'>
                      <span className='text-2xl font-bold text-primary-600'>
                        ${product.price.toLocaleString()}
                      </span>
                      {product.compare_at_price && (
                        <span className='text-lg text-secondary-400 line-through'>
                          ${(product.compare_at_price / 100).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex flex-col gap-2'>
                    <Link
                      href={`/products/${product.slug}`}
                      className='btn btn-primary w-full text-center'
                    >
                      View Details & Specifications
                    </Link>
                    <button
                      className='btn btn-secondary w-full'
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
  )
}
