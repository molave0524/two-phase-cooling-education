'use client'

import React from 'react'
import Link from 'next/link'
import { PRODUCTS } from '@/data/products'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { useCartStore } from '@/stores/cartStore'

export default function ProductsPage() {
  return (
    <div className='min-h-screen bg-secondary-50'>
      {/* Header Section */}
      <div className='bg-gradient-to-b from-primary-600 to-primary-700 text-white py-16 pt-24'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4'>Two-Phase Cooling Systems</h1>
          <p className='text-xl text-primary-100 max-w-3xl'>
            Discover our revolutionary cooling technology that delivers unmatched performance,
            whisper-quiet operation, and environmental sustainability.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className='container mx-auto px-4 max-w-7xl py-16'>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {PRODUCTS.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Product Card Component
function ProductCard({ product }: { product: TwoPhaseCoolingProduct }) {
  const { addItem } = useCartStore()
  const mainImage = product.images.find(img => img.type === 'main') || product.images[0]
  const isOnSale = product.originalPrice && product.originalPrice > product.price

  const handleAddToCart = () => {
    if (product.inStock) {
      addItem(product, 1)
    }
  }

  return (
    <div className='bg-white rounded-equipment shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300'>
      {/* Product Image */}
      <div className='relative aspect-[4/3] overflow-hidden'>
        <img
          src={mainImage?.url || '/placeholder-product.jpg'}
          alt={mainImage?.altText || product.name}
          className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
        />

        {/* Stock Status Badge */}
        <div className='absolute top-4 left-4'>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              product.inStock ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
            }`}
          >
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Sale Badge */}
        {isOnSale && (
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

        <p className='text-secondary-600 mb-4 line-clamp-3'>{product.shortDescription}</p>

        {/* Key Features */}
        <div className='mb-4'>
          <div className='flex flex-wrap gap-2 mb-3'>
            {product.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full'
              >
                {feature.length > 25 ? `${feature.substring(0, 25)}...` : feature}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className='mb-4'>
          <div className='flex items-center gap-2'>
            <span className='text-2xl font-bold text-primary-600'>
              ${product.price.toLocaleString()}
            </span>
            {isOnSale && (
              <span className='text-lg text-secondary-400 line-through'>
                ${product.originalPrice?.toLocaleString()}
              </span>
            )}
          </div>
          <p className='text-sm text-secondary-500'>Free shipping • {product.estimatedShipping}</p>
        </div>

        {/* Key Specs */}
        <div className='mb-6 p-3 bg-secondary-50 rounded-lg'>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <span className='font-medium text-secondary-700'>Cooling:</span>
              <p className='text-secondary-600'>{product.specifications.cooling.capacity}</p>
            </div>
            <div>
              <span className='font-medium text-secondary-700'>Noise:</span>
              <p className='text-secondary-600'>{product.specifications.performance.noiseLevel}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-2'>
          <Link href={`/products/${product.slug}`} className='btn btn-primary btn-lg w-full'>
            View Details & Specifications
          </Link>

          <button
            onClick={handleAddToCart}
            className='btn btn-secondary w-full'
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
