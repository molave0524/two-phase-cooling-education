'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Products } from '@prisma/client'
import {
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  CheckIcon,
  SparklesIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ProductCardProps {
  product: Products
  variant?: 'default' | 'featured' | 'compact'
  showQuickAdd?: boolean
  onAddToCart?: (product: Products) => void
  onAddToWishlist?: (product: Products) => void
  className?: string
}

interface ProductFeature {
  icon: React.ReactNode
  text: string
  highlight?: boolean
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'default',
  showQuickAdd = true,
  onAddToCart,
  onAddToWishlist,
  className = '',
}) => {
  // Component state
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
  }).format(product.price_cents / 100)

  const formattedComparePrice = product.compare_at_price
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: product.currency || 'USD',
      }).format(product.compare_at_price / 100)
    : null

  const discountPercentage = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price_cents) / product.compare_at_price) * 100)
    : 0

  const isOnSale = discountPercentage > 0
  const isOutOfStock = product.stock_quantity <= 0
  const isLowStock = product.stock_quantity <= 5 && product.stock_quantity > 0

  // Extract key features from specifications
  const keyFeatures: ProductFeature[] = [
    {
      icon: <SparklesIcon className="w-4 h-4" />,
      text: 'Two-Phase Cooling',
      highlight: true,
    },
    {
      icon: <CheckIcon className="w-4 h-4" />,
      text: `${product.specifications?.cooling?.gwpRating || 'Low'} GWP Rating`,
    },
    {
      icon: <CheckIcon className="w-4 h-4" />,
      text: `${product.specifications?.formFactor || 'ATX'} Compatible`,
    },
    {
      icon: <FireIcon className="w-4 h-4" />,
      text: 'Superior Thermal Performance',
      highlight: true,
    },
  ]

  // Mock rating (in production, this would come from reviews)
  const rating = 4.8
  const reviewCount = 127

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) {
      toast.error('Product is out of stock')
      return
    }

    try {
      if (onAddToCart) {
        await onAddToCart(product)
        toast.success('Added to cart! 🛒')
      }
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      if (onAddToWishlist) {
        await onAddToWishlist(product)
        setIsInWishlist(!isInWishlist)
        toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist! ❤️')
      }
    } catch (error) {
      toast.error('Failed to update wishlist')
    }
  }

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index)
  }

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  if (variant === 'compact') {
    return (
      <div className={`card-hover ${className}`}>
        <Link href={`/products/${product.slug}`}>
          <div className="p-4">
            <div className="flex gap-4">
              {/* Compact Image */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={product.images[0] || '/images/products/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover rounded-technical"
                  sizes="80px"
                />
                {isOnSale && (
                  <div className="absolute -top-2 -right-2 bg-danger-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    -{discountPercentage}%
                  </div>
                )}
              </div>

              {/* Compact Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-secondary-900 truncate">{product.name}</h3>
                <p className="text-sm text-secondary-600 line-clamp-2 mt-1">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-secondary-900">{formattedPrice}</span>
                    {formattedComparePrice && (
                      <span className="text-sm text-secondary-500 line-through">
                        {formattedComparePrice}
                      </span>
                    )}
                  </div>

                  {showQuickAdd && (
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="btn-primary btn-sm"
                    >
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // Default and Featured variants
  const cardClasses = `
    card-hover relative overflow-hidden
    ${variant === 'featured' ? 'ring-2 ring-primary-200 bg-gradient-to-br from-white to-primary-50' : ''}
    ${className}
  `

  return (
    <div className={cardClasses}>
      <Link href={`/products/${product.slug}`}>
        {/* Product Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {isOnSale && (
            <div className="bg-danger-500 text-white text-sm px-2 py-1 rounded-technical font-medium">
              Save {discountPercentage}%
            </div>
          )}
          {product.is_featured && (
            <div className="bg-primary-600 text-white text-sm px-2 py-1 rounded-technical font-medium flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              Featured
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div className="bg-accent-500 text-white text-sm px-2 py-1 rounded-technical font-medium">
              Low Stock
            </div>
          )}
          {isOutOfStock && (
            <div className="bg-secondary-500 text-white text-sm px-2 py-1 rounded-technical font-medium">
              Out of Stock
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleAddToWishlist}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-secondary-600 hover:text-danger-500 transition-colors"
          aria-label="Add to wishlist"
        >
          {isInWishlist ? (
            <HeartSolidIcon className="w-5 h-5 text-danger-500" />
          ) : (
            <HeartIcon className="w-5 h-5" />
          )}
        </button>

        {/* Product Image */}
        <div className="relative aspect-square bg-secondary-100">
          <Image
            src={product.images[currentImageIndex] || '/images/products/placeholder.jpg'}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            sizes={variant === 'featured' ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 33vw'}
            onLoadingComplete={() => setIsImageLoading(false)}
          />

          {/* Image Loading Placeholder */}
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="loading-spinner w-8 h-8 border-primary-500"></div>
            </div>
          )}

          {/* Image Navigation Dots */}
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleImageChange(index)
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-primary-600' : 'bg-white/60'
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Content */}
        <div className="p-6">
          {/* Product Category */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-primary-600 font-medium uppercase tracking-wide">
              {product.category}
            </span>
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarSolidIcon
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(rating) ? 'text-accent-500' : 'text-secondary-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-secondary-600">({reviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-lg text-secondary-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Product Description */}
          <p className="text-secondary-600 text-sm line-clamp-3 mb-4">
            {product.description}
          </p>

          {/* Key Features */}
          <div className="space-y-2 mb-4">
            {keyFeatures.slice(0, variant === 'featured' ? 4 : 2).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={`text-${feature.highlight ? 'primary' : 'success'}-600`}>
                  {feature.icon}
                </div>
                <span className={`${feature.highlight ? 'font-medium text-secondary-900' : 'text-secondary-600'}`}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-secondary-900">{formattedPrice}</span>
              {formattedComparePrice && (
                <span className="text-sm text-secondary-500 line-through">
                  {formattedComparePrice}
                </span>
              )}
            </div>
            {product.sku && (
              <span className="text-xs text-secondary-500 font-mono">
                SKU: {product.sku}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-4">
            {isOutOfStock ? (
              <div className="text-danger-600 text-sm font-medium">Out of Stock</div>
            ) : isLowStock ? (
              <div className="text-accent-600 text-sm font-medium">
                Only {product.stock_quantity} left in stock
              </div>
            ) : (
              <div className="text-success-600 text-sm font-medium">In Stock</div>
            )}
          </div>

          {/* Action Buttons */}
          {showQuickAdd && (
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'} flex items-center justify-center gap-2`}
              >
                <ShoppingCartIcon className="w-4 h-4" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}