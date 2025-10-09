'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, useParams } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { logger } from '@/lib/logger'

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<TwoPhaseCoolingProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0)
  const [selectedImageType, setSelectedImageType] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${slug}`)
        if (!response.ok) {
          notFound()
        }
        const result = await response.json()

        // Handle new standardized response format
        if (result.success && result.data) {
          setProduct(result.data)
        } else {
          // Handle error response
          logger.error('Failed to fetch product', result.error, { slug })
          notFound()
        }
      } catch (error) {
        logger.error('Failed to fetch product', error, { slug })
        notFound()
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [slug])

  if (loading) {
    return <div className='container mx-auto px-4 py-8'>Loading...</div>
  }

  if (!product) {
    notFound()
  }

  // Normalize images to handle both string[] and object[] formats
  const normalizedImages = (product.images || []).map(img => {
    if (typeof img === 'string') {
      return { url: img, altText: product.name, type: 'main' }
    }
    return img
  })

  // Filter images based on selected type
  const filteredImages = selectedImageType
    ? normalizedImages.filter(img => img.type === selectedImageType)
    : normalizedImages

  // Reset indices when filter changes
  const handleTypeFilter = (type: string | null) => {
    setSelectedImageType(type)
    setSelectedImageIndex(0)
    setThumbnailStartIndex(0)
  }

  // Add to cart handler
  const handleAddToCart = () => {
    if (product.inStock) {
      addItem(product, quantity)
    }
  }
  const isOnSale = product.originalPrice && product.originalPrice > product.price

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        paddingTop: '20px',
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '16px 0',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
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

      {/* Product content */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px',
        }}
      >
        {/* Left column - Product image gallery */}
        <div
          style={{
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Main Image - Show only the first image */}
          <div
            style={{
              aspectRatio: '1',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <Image
              src={
                filteredImages[selectedImageIndex]?.url ||
                'https://placehold.co/600x600/f1f5f9/64748b?text=Product+Image'
              }
              alt={filteredImages[selectedImageIndex]?.altText || product.name}
              width={600}
              height={600}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              unoptimized
            />
          </div>

          {/* Thumbnail Navigation - Only show if multiple images */}
          {filteredImages.length > 1 && (
            <div>
              {/* Navigation arrows for more than 4 images */}
              {filteredImages.length > 4 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <button
                    onClick={() => setThumbnailStartIndex(Math.max(0, thumbnailStartIndex - 4))}
                    disabled={thumbnailStartIndex === 0}
                    style={{
                      padding: '8px',
                      backgroundColor: thumbnailStartIndex === 0 ? '#f1f5f9' : '#0284c7',
                      color: thumbnailStartIndex === 0 ? '#94a3b8' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: thumbnailStartIndex === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ← Prev
                  </button>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    {thumbnailStartIndex + 1}-
                    {Math.min(thumbnailStartIndex + 4, filteredImages.length)} of{' '}
                    {filteredImages.length}
                  </span>
                  <button
                    onClick={() =>
                      setThumbnailStartIndex(
                        Math.min(filteredImages.length - 4, thumbnailStartIndex + 4)
                      )
                    }
                    disabled={thumbnailStartIndex + 4 >= filteredImages.length}
                    style={{
                      padding: '8px',
                      backgroundColor:
                        thumbnailStartIndex + 4 >= filteredImages.length ? '#f1f5f9' : '#0284c7',
                      color: thumbnailStartIndex + 4 >= filteredImages.length ? '#94a3b8' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor:
                        thumbnailStartIndex + 4 >= filteredImages.length
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Thumbnail Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(filteredImages.length, 4)}, 1fr)`,
                  gap: '8px',
                }}
              >
                {filteredImages
                  .slice(thumbnailStartIndex, thumbnailStartIndex + 4)
                  .map((image, index) => {
                    const actualIndex = thumbnailStartIndex + index
                    return (
                      <div
                        key={image.url}
                        onClick={() => setSelectedImageIndex(actualIndex)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedImageIndex(actualIndex)
                          }
                        }}
                        role='button'
                        tabIndex={0}
                        style={{
                          aspectRatio: '1',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border:
                            actualIndex === selectedImageIndex
                              ? '2px solid #0284c7'
                              : '2px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease',
                        }}
                      >
                        <Image
                          src={image.url || '/placeholder-product.jpg'}
                          alt={image.altText}
                          width={100}
                          height={100}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          unoptimized
                        />
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Image Type Filters */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            {/* Show All button */}
            <button
              onClick={() => handleTypeFilter(null)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedImageType === null ? '#0284c7' : '#f1f5f9',
                color: selectedImageType === null ? 'white' : '#64748b',
                transition: 'all 0.2s ease',
              }}
            >
              All Images ({normalizedImages.length})
            </button>

            {/* Type filter buttons */}
            {Array.from(new Set(normalizedImages.map(img => img.type)))
              .filter(type => type) // Remove undefined/null values
              .map(type => {
                const typeCount = normalizedImages.filter(img => img.type === type).length
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeFilter(type)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedImageType === type ? '#0284c7' : '#f1f5f9',
                      color: selectedImageType === type ? 'white' : '#64748b',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} View ({typeCount})
                  </button>
                )
              })}
          </div>
        </div>

        {/* Right column - Product info */}
        <div>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#0f172a',
              marginBottom: '8px',
              lineHeight: '1.1',
            }}
          >
            {product.name}
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '16px',
              fontFamily: 'monospace',
            }}
          >
            SKU: {product.sku}
          </p>
          <p
            style={{
              fontSize: '20px',
              color: '#475569',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}
          >
            {product.shortDescription}
          </p>

          <div
            style={{
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#0284c7',
              }}
            >
              ${product.price.toLocaleString()}
            </span>
            {isOnSale && (
              <span
                style={{
                  fontSize: '24px',
                  color: '#94a3b8',
                  textDecoration: 'line-through',
                  marginLeft: '16px',
                }}
              >
                ${product.originalPrice?.toLocaleString()}
              </span>
            )}
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: product.inStock ? '#22c55e' : '#ef4444',
                }}
              ></div>
              <span
                style={{
                  fontWeight: '500',
                  color: '#0f172a',
                }}
              >
                {product.inStock ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <label
              htmlFor='quantity-input'
              style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#0f172a',
              }}
            >
              Quantity:
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: 'white',
              }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label='Decrease quantity'
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#64748b',
                }}
              >
                −
              </button>
              <span
                id='quantity-input'
                role='status'
                aria-live='polite'
                style={{
                  padding: '8px 16px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#0f172a',
                  minWidth: '40px',
                  textAlign: 'center',
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                disabled={quantity >= product.stockQuantity}
                aria-label='Increase quantity'
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: quantity >= product.stockQuantity ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: quantity >= product.stockQuantity ? '#94a3b8' : '#64748b',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || !product.isAvailableForPurchase}
              style={{
                padding: '16px 24px',
                backgroundColor:
                  !product.inStock || !product.isAvailableForPurchase ? '#f1f5f9' : '#0284c7',
                color: !product.inStock || !product.isAvailableForPurchase ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor:
                  !product.inStock || !product.isAvailableForPurchase ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={e => {
                if (product.inStock && product.isAvailableForPurchase) {
                  e.currentTarget.style.backgroundColor = '#0369a1'
                }
              }}
              onMouseLeave={e => {
                if (product.inStock && product.isAvailableForPurchase) {
                  e.currentTarget.style.backgroundColor = '#0284c7'
                }
              }}
            >
              {!product.inStock
                ? 'Out of Stock'
                : !product.isAvailableForPurchase
                  ? 'Kit Only - Not Sold Separately'
                  : `Add ${quantity} to Cart`}
            </button>

            <Link
              href='#product-details'
              className='btn btn-secondary'
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '12px 24px',
              }}
            >
              View Details & Specifications
            </Link>
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div
        id='product-details'
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '64px 16px',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#0f172a',
            marginBottom: '24px',
          }}
        >
          Product Description
        </h2>
        <p
          style={{
            fontSize: '18px',
            color: '#475569',
            lineHeight: '1.6',
            marginBottom: '32px',
          }}
        >
          {product.description}
        </p>

        <h3
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0f172a',
            marginBottom: '16px',
          }}
        >
          Key Features
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {product.features.map((feature, index) => (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '12px',
                fontSize: '16px',
                color: '#475569',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    margin: '4px auto',
                  }}
                ></span>
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {/* Included Products Section */}
        {(product as any).components && (product as any).components.length > 0 && (
          <>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#0f172a',
                marginBottom: '16px',
                marginTop: '32px',
              }}
            >
              Included Products
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              {(product as any).components.map((component: any) => (
                <Link
                  key={component.id}
                  href={`/products/${component.slug}`}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9'
                    e.currentTarget.style.borderColor = '#0284c7'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  {/* Component Image */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={
                        Array.isArray(component.images) && component.images.length > 0
                          ? typeof component.images[0] === 'string'
                            ? component.images[0]
                            : component.images[0]?.url || '/placeholder-product.jpg'
                          : '/placeholder-product.jpg'
                      }
                      alt={component.name}
                      width={80}
                      height={80}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      unoptimized
                    />
                  </div>

                  {/* Component Details */}
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#0f172a',
                        marginBottom: '4px',
                      }}
                    >
                      {component.name}
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontFamily: 'monospace',
                        marginBottom: '8px',
                      }}
                    >
                      SKU: {component.sku}
                    </p>
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#475569',
                        marginBottom: '8px',
                      }}
                    >
                      {component.shortDescription || component.description}
                    </p>
                    {component.quantity > 1 && (
                      <p
                        style={{
                          fontSize: '14px',
                          color: '#0284c7',
                          fontWeight: '500',
                        }}
                      >
                        Quantity: {component.quantity}
                      </p>
                    )}
                  </div>

                  {/* Component Price */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      minWidth: '120px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: component.isAvailableForPurchase === false ? '#94a3b8' : '#0284c7',
                      }}
                    >
                      ${component.price.toLocaleString()}
                    </span>
                    {component.isAvailableForPurchase === false && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          fontWeight: '500',
                          marginTop: '4px',
                        }}
                      >
                        Kit Only
                      </span>
                    )}
                    {component.componentPrice && component.componentPrice !== component.price && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          textDecoration: 'line-through',
                        }}
                      >
                        ${component.componentPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <h3
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0f172a',
            marginBottom: '16px',
            marginTop: '32px',
          }}
        >
          Specifications
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            backgroundColor: '#f8fafc',
            padding: '24px',
            borderRadius: '8px',
          }}
        >
          <div>
            <h4
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              Cooling Performance
            </h4>
            <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>
              {(product.specifications as any)?.cooling?.capacity || '350W TDP'}
            </p>
          </div>
          <div>
            <h4
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              Noise Level
            </h4>
            <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>
              {(product.specifications as any)?.performance?.noiseLevel ||
                (product.specifications as any)?.environmental?.noiseLevel ||
                'Quiet Operation'}
            </p>
          </div>
          <div>
            <h4
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              Warranty
            </h4>
            <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>
              {(product.specifications as any)?.warranty?.duration || '3 years'}
            </p>
          </div>
          <div>
            <h4
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              Estimated Shipping
            </h4>
            <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>
              {product.estimatedShipping}
            </p>
          </div>
        </div>

        {/* Used In Products Section - Only show for components */}
        {(product as any).usedInProducts && (product as any).usedInProducts.length > 0 && (
          <>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#0f172a',
                marginBottom: '16px',
                marginTop: '48px',
              }}
            >
              Included In Complete Systems
            </h3>
            <p
              style={{
                fontSize: '16px',
                color: '#64748b',
                marginBottom: '16px',
              }}
            >
              This component is included in the following standalone builds:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px',
              }}
            >
              {(product as any).usedInProducts.map((build: any) => (
                <Link
                  key={build.id}
                  href={`/products/${build.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9'
                    e.currentTarget.style.borderColor = '#0284c7'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  {/* Build Image */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={
                        Array.isArray(build.images) && build.images.length > 0
                          ? typeof build.images[0] === 'string'
                            ? build.images[0]
                            : build.images[0]?.url || '/placeholder-product.jpg'
                          : '/placeholder-product.jpg'
                      }
                      alt={build.name}
                      width={80}
                      height={80}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      unoptimized
                    />
                  </div>

                  {/* Build Details */}
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#0f172a',
                        marginBottom: '4px',
                      }}
                    >
                      {build.name}
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontFamily: 'monospace',
                        marginBottom: '4px',
                      }}
                    >
                      SKU: {build.sku}
                    </p>
                    {build.displayName && (
                      <p
                        style={{
                          fontSize: '14px',
                          color: '#0284c7',
                          fontWeight: '500',
                        }}
                      >
                        Used as: {build.displayName}
                        {build.quantity > 1 && ` (×${build.quantity})`}
                      </p>
                    )}
                  </div>

                  {/* Build Price */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      minWidth: '120px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#0284c7',
                      }}
                    >
                      ${build.price.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '4px',
                      }}
                    >
                      View Build →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
