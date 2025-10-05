'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { useCartStore } from '@/stores/cartStore'
import { logger } from '@/lib/logger'
import styles from './products.module.css'

export default function ProductsPage() {
  const [products, setProducts] = useState<TwoPhaseCoolingProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products')
        const result = await response.json()

        // Handle new standardized response format
        if (result.success && result.data) {
          // Filter to only show standalone products (not individual components)
          const standaloneProducts = result.data.filter(
            (p: any) => p.productType === 'standalone'
          )
          setProducts(standaloneProducts)
        } else {
          // Handle error response
          logger.error('Failed to fetch products', result.error)
          setProducts([])
        }
      } catch (error) {
        logger.error('Failed to fetch products', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContainer}>
          <h1 className={styles.headerTitle}>Two-Phase Cooling Systems</h1>
          <p className={styles.headerDescription}>
            Discover our revolutionary cooling technology that delivers unmatched performance,
            whisper-quiet operation, and environmental sustainability.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.productsContainer}>
        {loading ? (
          <div className='text-center py-8'>Loading products...</div>
        ) : (
          <div className={styles.productsGrid}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Product Card Component
function ProductCard({ product }: { product: any }) {
  const { addItem } = useCartStore()

  // Safely get main image
  let mainImage = { url: '/placeholder-product.jpg', altText: product?.name || 'Product' }
  try {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      if (typeof product.images[0] === 'string') {
        mainImage = { url: product.images[0], altText: product.name }
      } else if (product.images[0]?.url) {
        mainImage = product.images.find((img: any) => img.type === 'main') || product.images[0]
      }
    }
  } catch (e) {
    // Use default
  }

  const isOnSale = product?.originalPrice && product.originalPrice > product.price

  const handleAddToCart = () => {
    try {
      if (product?.inStock) {
        addItem(product, 1)
      }
    } catch (e) {
      console.error('Failed to add to cart:', e)
    }
  }

  return (
    <div className={styles.productCard}>
      {/* Product Image */}
      <div className={styles.imageContainer}>
        <Image
          src={mainImage?.url || '/placeholder-product.jpg'}
          alt={mainImage?.altText || product.name}
          width={400}
          height={300}
          className={styles.productImage}
          unoptimized
        />

        {/* Stock Status Badge */}
        <div className={styles.stockBadge}>
          <span
            className={product.inStock ? styles.stockBadgeInStock : styles.stockBadgeOutOfStock}
          >
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Sale Badge */}
        {isOnSale && (
          <div className={styles.saleBadge}>
            <span className={styles.saleBadge}>Sale</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.cardContent}>
        <h3 className={styles.productTitle}>{product?.name || 'Product'}</h3>
        {product?.sku && (
          <p
            style={{
              fontSize: '12px',
              color: '#64748b',
              fontFamily: 'monospace',
              marginTop: '4px',
              marginBottom: '8px',
            }}
          >
            SKU: {product.sku}
          </p>
        )}

        <p className={styles.productDescription}>{product?.shortDescription || ''}</p>

        {/* Key Features */}
        {product.features && Array.isArray(product.features) && product.features.length > 0 && (
          <div className={styles.featuresSection}>
            <div className={styles.featuresContainer}>
              {product.features.slice(0, 3).map((feature, index) => (
                <span key={index} className={styles.featureTag}>
                  {typeof feature === 'string' && feature.length > 25 ? `${feature.substring(0, 25)}...` : feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className={styles.pricingSection}>
          <div className={styles.priceContainer}>
            <span className={styles.currentPrice}>${product.price.toLocaleString()}</span>
            {isOnSale && (
              <span className={styles.originalPrice}>
                ${product.originalPrice?.toLocaleString()}
              </span>
            )}
          </div>
          <p className={styles.shippingInfo}>
            Free shipping • {product.estimatedShipping || '2-5 business days'}
          </p>
        </div>

        {/* Key Specs */}
        {product.specifications && (
          <div className={styles.specsSection}>
            <div className={styles.specsGrid}>
              <div>
                <span className={styles.specLabel}>Cooling:</span>
                <p className={styles.specValue}>
                  {(product.specifications as any)?.cooling?.capacity ||
                   (product.specifications as any)?.capacity ||
                   'High Performance'}
                </p>
              </div>
              <div>
                <span className={styles.specLabel}>Noise:</span>
                <p className={styles.specValue}>
                  {(product.specifications as any)?.performance?.noiseLevel ||
                   (product.specifications as any)?.environmental?.noiseLevel ||
                   (product.specifications as any)?.noise ||
                   'Quiet Operation'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actionsContainer}>
          <Link href={`/products/${product.slug}`} className={styles.primaryButton}>
            View Details & Specifications
          </Link>

          <button
            onClick={handleAddToCart}
            className={styles.secondaryButton}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
