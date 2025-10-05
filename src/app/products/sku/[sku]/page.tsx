'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, useParams } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { logger } from '@/lib/logger'

export default function ProductBySKUPage() {
  const params = useParams()
  const sku = params.sku as string

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/by-sku/${sku}`)
        if (!response.ok) {
          notFound()
        }
        const result = await response.json()

        if (result.success && result.data) {
          setProduct(result.data)
        } else {
          logger.error('Failed to fetch product by SKU', result.error, { sku })
          notFound()
        }
      } catch (error) {
        logger.error('Failed to fetch product by SKU', error, { sku })
        notFound()
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [sku])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading product...</div>
  }

  if (!product) {
    notFound()
  }

  // Check if product is available for purchase
  const isAvailableForPurchase = product.isAvailableForPurchase && product.inStock && product.status === 'active'

  // Handle add to cart
  const handleAddToCart = () => {
    if (isAvailableForPurchase) {
      addItem(product, quantity)
    }
  }

  const image = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : '/placeholder-product.jpg'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', paddingTop: '20px' }}>
      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#f8fafc', padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <nav style={{ fontSize: '14px' }}>
            <span>
              <a href='/' style={{ color: '#0284c7', textDecoration: 'none' }}>
                Home
              </a>
              <span style={{ color: '#94a3b8', margin: '0 8px' }}>/</span>
              <a href='/products' style={{ color: '#0284c7', textDecoration: 'none' }}>
                Products
              </a>
              <span style={{ color: '#94a3b8', margin: '0 8px' }}>/</span>
              <span style={{ color: '#475569' }}>{product.name}</span>
            </span>
          </nav>
        </div>
      </div>

      {/* Sunset Warning Banner */}
      {!isAvailableForPurchase && (
        <div style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 16px' }}>
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#f59e0b' }} fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
              </svg>
              <p style={{ color: '#92400e', fontWeight: '500', margin: 0 }}>
                This product version is no longer available for purchase. You previously ordered this item.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product Content */}
      <div style={{  maxWidth: '1280px', margin: '0 auto', padding: '32px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
        {/* Left - Image */}
        <div>
          <div style={{ aspectRatio: '1', backgroundColor: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <Image
              src={image}
              alt={product.name}
              width={600}
              height={600}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              unoptimized
            />
          </div>
        </div>

        {/* Right - Info */}
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', lineHeight: '1.1' }}>
            {product.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', fontFamily: 'monospace' }}>
            SKU: {product.sku}
          </p>
          <p style={{ fontSize: '20px', color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>
            {product.shortDescription}
          </p>

          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7' }}>
              ${product.price.toLocaleString()}
            </span>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: product.inStock ? '#22c55e' : '#ef4444' }} />
              <span style={{ fontWeight: '500', color: '#0f172a' }}>
                {product.inStock ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <label style={{ fontSize: '16px', fontWeight: '500', color: '#0f172a' }}>
              Quantity:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={!isAvailableForPurchase}
                style={{ padding: '8px 12px', backgroundColor: 'transparent', border: 'none', cursor: isAvailableForPurchase ? 'pointer' : 'not-allowed', fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}
              >
                −
              </button>
              <span style={{ padding: '8px 16px', fontSize: '16px', fontWeight: '500', color: '#0f172a', minWidth: '40px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                disabled={!isAvailableForPurchase || quantity >= product.stockQuantity}
                style={{ padding: '8px 12px', backgroundColor: 'transparent', border: 'none', cursor: (!isAvailableForPurchase || quantity >= product.stockQuantity) ? 'not-allowed' : 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!isAvailableForPurchase}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: !isAvailableForPurchase ? '#f1f5f9' : '#0284c7',
              color: !isAvailableForPurchase ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: !isAvailableForPurchase ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            {!isAvailableForPurchase ? 'No Longer Available' : `Add ${quantity} to Cart`}
          </button>

          {/* Product Features */}
          {product.features && product.features.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>
                Key Features
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {product.features.map((feature: string, idx: number) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '16px', color: '#475569' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0, marginTop: '2px' }}>
                      <span style={{ display: 'block', width: '12px', height: '12px', backgroundColor: 'white', borderRadius: '50%', margin: '4px auto' }} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>
                Specifications
              </h3>
              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                    Cooling Performance
                  </h4>
                  <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>
                    {(product.specifications as any)?.cooling?.capacity || '350W TDP'}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                    Warranty
                  </h4>
                  <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>
                    {(product.specifications as any)?.warranty?.duration || '3 years'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Description */}
      {product.description && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 16px', borderTop: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginBottom: '24px' }}>
            Product Description
          </h2>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.6' }}>
            {product.description}
          </p>
        </div>
      )}
    </div>
  )
}
