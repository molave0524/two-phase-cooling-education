'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { useCartStore } from '@/stores/cartStore'
import { logger } from '@/lib/logger'
import styles from './products.module.css'

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<TwoPhaseCoolingProduct[]>([])
  const [products, setProducts] = useState<TwoPhaseCoolingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'standalone' | 'component'>(
    'standalone'
  )

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products')
        const result = await response.json()

        // Handle new standardized response format
        if (result.success && result.data) {
          setAllProducts(result.data)
          // Initially show standalone products
          const standaloneProducts = result.data.filter((p: any) => p.productType === 'standalone')
          setProducts(standaloneProducts)
        } else {
          // Handle error response
          logger.error('Failed to fetch products', result.error)
          setAllProducts([])
          setProducts([])
        }
      } catch (error) {
        logger.error('Failed to fetch products', error)
        setAllProducts([])
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Filter products when filter changes
  useEffect(() => {
    if (productTypeFilter === 'all') {
      setProducts(allProducts)
    } else {
      const filtered = allProducts.filter((p: any) => p.productType === productTypeFilter)
      setProducts(filtered)
    }
  }, [productTypeFilter, allProducts])

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

      {/* Product Type Filter */}
      <div className={styles.filterSection}>
        <div className={styles.filterContainer}>
          <span className={styles.filterLabel}>Show:</span>
          <div className={styles.filterButtons}>
            <button
              onClick={() => setProductTypeFilter('standalone')}
              className={`${styles.filterButton} ${productTypeFilter === 'standalone' ? styles.filterButtonActive : ''}`}
            >
              Complete Systems (
              {allProducts.filter((p: any) => p.productType === 'standalone').length})
            </button>
            <button
              onClick={() => setProductTypeFilter('component')}
              className={`${styles.filterButton} ${productTypeFilter === 'component' ? styles.filterButtonActive : ''}`}
            >
              Components ({allProducts.filter((p: any) => p.productType === 'component').length})
            </button>
            <button
              onClick={() => setProductTypeFilter('all')}
              className={`${styles.filterButton} ${productTypeFilter === 'all' ? styles.filterButtonActive : ''}`}
            >
              All Products ({allProducts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.productsContainer}>
        {loading ? (
          <div className='text-center py-8'>Loading products...</div>
        ) : products.length === 0 ? (
          <div className={styles.noProducts}>
            <div className={styles.noProductsIcon}>📦</div>
            <h3 className={styles.noProductsTitle}>No products found</h3>
            <p className={styles.noProductsText}>
              {productTypeFilter === 'standalone' && 'No complete systems available at this time.'}
              {productTypeFilter === 'component' && 'No components available at this time.'}
              {productTypeFilter === 'all' && 'No products available at this time.'}
            </p>
          </div>
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
      logger.error('Failed to add to cart', e)
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
              {product.features.slice(0, 3).map((feature: any, index: number) => (
                <span key={index} className={styles.featureTag}>
                  {typeof feature === 'string' && feature.length > 25
                    ? `${feature.substring(0, 25)}...`
                    : feature}
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
        {product?.specifications && (
          <div className={styles.specsSection}>
            <div className={styles.specsGrid}>
              <div>
                <span className={styles.specLabel}>Cooling:</span>
                <p className={styles.specValue}>
                  {(() => {
                    try {
                      const specs = product.specifications as any
                      if (!specs) return 'High Performance'
                      if (specs.cooling?.type) return specs.cooling.type
                      if (specs.cooling?.capacity) return specs.cooling.capacity
                      if (specs.capacity) return specs.capacity
                      return 'High Performance'
                    } catch {
                      return 'High Performance'
                    }
                  })()}
                </p>
              </div>
              <div>
                <span className={styles.specLabel}>Noise:</span>
                <p className={styles.specValue}>
                  {(() => {
                    try {
                      const specs = product.specifications as any
                      if (!specs) return 'Quiet Operation'
                      if (specs.performance?.noiseLevel) return specs.performance.noiseLevel
                      if (specs.environmental?.noiseLevel) return specs.environmental.noiseLevel
                      if (specs.noise) return specs.noise
                      return 'Quiet Operation'
                    } catch {
                      return 'Quiet Operation'
                    }
                  })()}
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
