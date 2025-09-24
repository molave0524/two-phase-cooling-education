'use client'

import React, { useState } from 'react'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { useCartStore } from '@/stores/cartStore'
import { ShoppingCartIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'

interface ProductPurchaseProps {
  product: TwoPhaseCoolingProduct
}

export default function ProductPurchase({ product }: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id)

  const { addItem } = useCartStore()

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stockQuantity) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error('This product is currently out of stock')
      return
    }

    addItem(product, quantity, selectedVariant)
  }

  const handleBuyNow = () => {
    if (!product.inStock) {
      toast.error('This product is currently out of stock')
      return
    }

    // Add to cart and redirect to checkout
    addItem(product, quantity, selectedVariant)

    // Small delay to allow cart update, then redirect
    setTimeout(() => {
      window.location.href = '/checkout'
    }, 500)
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: product.shortDescription,
          url: window.location.href,
        })
        .catch(() => {
          // Fallback to clipboard
          navigator.clipboard.writeText(window.location.href)
          toast.success('Link copied to clipboard!')
        })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const totalPrice = product.price * quantity

  return (
    <div className='space-y-6 p-6 bg-secondary-50 rounded-equipment'>
      {/* Variants Selection (if available) */}
      {product.variants && product.variants.length > 0 && (
        <div>
          <label className='block text-sm font-medium text-secondary-700 mb-2'>Configuration</label>
          <select
            value={selectedVariant}
            onChange={e => setSelectedVariant(e.target.value)}
            className='w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          >
            {product.variants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.name} - ${variant.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label className='block text-sm font-medium text-secondary-700 mb-2'>Quantity</label>
        <div className='flex items-center gap-4'>
          <div className='flex items-center border border-secondary-300 rounded-lg'>
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className='px-3 py-2 text-secondary-600 hover:text-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              −
            </button>
            <input
              type='number'
              value={quantity}
              onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)}
              min='1'
              max={product.stockQuantity}
              className='w-16 text-center border-none focus:ring-0 py-2'
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stockQuantity}
              className='px-3 py-2 text-secondary-600 hover:text-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              +
            </button>
          </div>
          <span className='text-sm text-secondary-600'>{product.stockQuantity} available</span>
        </div>
      </div>

      {/* Total Price */}
      {quantity > 1 && (
        <div className='flex justify-between items-center py-2 border-t border-secondary-200'>
          <span className='font-medium text-secondary-900'>Total:</span>
          <span className='text-xl font-bold text-primary-600'>${totalPrice.toLocaleString()}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className='space-y-3'>
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className='w-full btn btn-secondary btn-lg disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <ShoppingCartIcon className='w-5 h-5 mr-2' />
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={!product.inStock}
          className='w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {product.inStock ? 'Buy Now' : 'Notify When Available'}
        </button>
      </div>

      {/* Secondary Actions */}
      <div className='flex items-center justify-center gap-6 pt-4 border-t border-secondary-200'>
        <button
          onClick={handleWishlist}
          className='flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors'
        >
          {isWishlisted ? (
            <HeartSolidIcon className='w-5 h-5 text-primary-600' />
          ) : (
            <HeartIcon className='w-5 h-5' />
          )}
          <span className='text-sm'>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
        </button>

        <button
          onClick={handleShare}
          className='flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors'
        >
          <ShareIcon className='w-5 h-5' />
          <span className='text-sm'>Share</span>
        </button>
      </div>

      {/* Financing Options */}
      <div className='mt-6 p-4 bg-white rounded-lg border border-secondary-200'>
        <h4 className='font-medium text-secondary-900 mb-2'>Financing Available</h4>
        <div className='space-y-1 text-sm text-secondary-600'>
          <p>
            <span className='font-medium'>Pay in 4:</span> ${(totalPrice / 4).toFixed(2)} × 4
            payments
          </p>
          <p>
            <span className='font-medium'>12 months:</span> ${(totalPrice / 12).toFixed(2)}/month at
            0% APR
          </p>
          <p className='text-xs text-secondary-500 mt-2'>
            Subject to credit approval. Terms and conditions apply.
          </p>
        </div>
      </div>
    </div>
  )
}
