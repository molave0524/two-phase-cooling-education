'use client'

import React from 'react'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { CartItem } from '@/types/cart'
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    tax,
    shipping,
    total,
    appliedCoupon,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartStore()

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity)
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId)
  }

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <div
        id='hero'
        className='relative pt-6 pb-12'
        aria-labelledby='hero-heading'
        style={{
          backgroundColor: '#e2e8f0',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        <div className='max-w-6xl mx-auto px-6'>
          <div className='text-center space-y-6 max-w-4xl mx-auto'>
            <div className='flex items-center justify-center gap-2'>
              <ShoppingBagIcon className='w-8 h-8 text-primary-600' />
              <h1
                id='hero-heading'
                className='section-title text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900'
              >
                Shopping Cart
              </h1>
            </div>
            {itemCount > 0 && (
              <p className='text-lg text-secondary-600 max-w-3xl mx-auto'>
                {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
              </p>
            )}

            {/* Action buttons */}
            <div className='flex items-center justify-between mt-8'>
              <Link
                href='/products'
                className='flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors'
              >
                <ArrowLeftIcon className='w-5 h-5' />
                <span>Continue Shopping</span>
              </Link>
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className='text-secondary-500 hover:text-danger-600 transition-colors text-sm'
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        // Empty Cart
        <section
          id='cart-content'
          aria-labelledby='cart-content-heading'
          style={{
            backgroundColor: 'var(--color-section-background)',
            paddingTop: 'var(--spacing-section-top)',
            paddingBottom: 'var(--spacing-section-bottom)',
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
          }}
        >
          <div className='max-w-6xl mx-auto px-6'>
            <div className='text-center max-w-md mx-auto'>
              <ShoppingBagIcon className='w-24 h-24 text-secondary-300 mx-auto mb-6' />
              <h2 className='text-2xl font-bold text-secondary-900 mb-4'>Your cart is empty</h2>
              <p className='text-secondary-600 mb-8'>
                Discover our revolutionary two-phase cooling systems and add some products to get
                started.
              </p>
              <div className='space-y-4'>
                <Link href='/products' className='btn btn-primary btn-lg w-full'>
                  Shop All Products
                </Link>
                <Link href='/' className='btn btn-secondary w-full'>
                  Back to Homepage
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        // Cart with Items
        <section
          id='cart-items'
          aria-labelledby='cart-items-heading'
          style={{
            backgroundColor: 'var(--color-section-background)',
            paddingTop: 'var(--spacing-section-top)',
            paddingBottom: 'var(--spacing-section-bottom)',
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
          }}
        >
          <div className='max-w-6xl mx-auto px-6'>
            <div className='grid lg:grid-cols-3 gap-8'>
              {/* Cart Items */}
              <div className='lg:col-span-2'>
                <div className='bg-white rounded-equipment shadow-sm border border-secondary-200'>
                  <div className='p-6 border-b border-secondary-200'>
                    <h2 className='text-lg font-semibold text-secondary-900'>
                      Cart Items ({itemCount})
                    </h2>
                  </div>

                  <div className='divide-y divide-secondary-200'>
                    {items.map(item => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className='lg:col-span-1'>
                <div className='bg-white rounded-equipment shadow-sm border border-secondary-200 sticky top-8'>
                  <div className='p-6'>
                    <h2 className='text-lg font-semibold text-secondary-900 mb-4'>Order Summary</h2>

                    {/* Coupon Section */}
                    <CouponSection appliedCoupon={appliedCoupon} />

                    {/* Price Breakdown */}
                    <div className='space-y-3 py-4 border-t border-secondary-200'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-secondary-600'>Subtotal ({itemCount} items):</span>
                        <span className='text-secondary-900 font-medium'>
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className='flex justify-between text-sm'>
                        <span className='text-secondary-600'>Shipping:</span>
                        {shipping > 0 ? (
                          <span className='text-secondary-900 font-medium'>
                            ${shipping.toFixed(2)}
                          </span>
                        ) : (
                          <span className='text-success-600 font-medium'>FREE</span>
                        )}
                      </div>

                      <div className='flex justify-between text-sm'>
                        <span className='text-secondary-600'>Estimated Tax:</span>
                        <span className='text-secondary-900 font-medium'>${tax.toFixed(2)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className='flex justify-between text-sm text-success-600'>
                          <span>Coupon Discount:</span>
                          <span className='font-medium'>
                            -
                            {appliedCoupon.type === 'percentage'
                              ? `${appliedCoupon.value}%`
                              : `$${appliedCoupon.value.toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className='flex justify-between items-center py-4 border-t border-secondary-300'>
                      <span className='text-lg font-semibold text-secondary-900'>Total:</span>
                      <span className='text-xl font-bold text-primary-600'>
                        ${total.toFixed(2)}
                      </span>
                    </div>

                    {/* Free Shipping Progress */}
                    {subtotal < 500 && (
                      <div className='mb-4 p-3 bg-accent-50 border border-accent-200 rounded-lg'>
                        <div className='flex items-center gap-2 mb-2'>
                          <TagIcon className='w-4 h-4 text-accent-600' />
                          <span className='text-sm font-medium text-accent-800'>
                            Add ${(500 - subtotal).toFixed(2)} more for free shipping
                          </span>
                        </div>
                        <div className='w-full bg-accent-200 rounded-full h-2'>
                          <div
                            className='bg-accent-500 h-2 rounded-full transition-all duration-300'
                            style={{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {subtotal >= 500 && (
                      <div className='mb-4 p-3 bg-success-50 border border-success-200 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          <CheckCircleIcon className='w-5 h-5 text-success-500' />
                          <span className='text-sm font-medium text-success-800'>
                            You qualify for free shipping!
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Checkout Button */}
                    <div className='space-y-3'>
                      <Link href='/checkout' className='btn btn-primary btn-lg w-full'>
                        Secure Checkout
                      </Link>

                      <div className='text-center text-xs text-secondary-500'>
                        🔒 Secure SSL Checkout • Free Returns • 5-Year Warranty
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// Individual Cart Item Row Component
function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem
  onQuantityChange: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}) {
  const mainImage = item.product.images[0]
  const currentPrice = item.selectedVariantId
    ? item.product.variants?.find(v => v.id === item.selectedVariantId)?.price || item.product.price
    : item.product.price

  return (
    <div className='p-6'>
      <div className='flex gap-6'>
        {/* Product Image */}
        <div className='flex-shrink-0'>
          <Link href={`/products/${item.product.slug}`}>
            <img
              src={mainImage?.url}
              alt={mainImage?.altText || item.product.name}
              className='w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg border border-secondary-200 hover:opacity-75 transition-opacity'
            />
          </Link>
        </div>

        {/* Product Details */}
        <div className='flex-1 min-w-0'>
          <div className='flex justify-between items-start mb-2'>
            <div className='flex-1'>
              <Link
                href={`/products/${item.product.slug}`}
                className='text-lg font-semibold text-secondary-900 hover:text-primary-600 line-clamp-2'
              >
                {item.product.name}
              </Link>

              {item.selectedVariantId && (
                <p className='text-sm text-secondary-600 mt-1'>
                  Configuration:{' '}
                  {item.product.variants?.find(v => v.id === item.selectedVariantId)?.name}
                </p>
              )}

              <p className='text-sm text-secondary-600 mt-2 line-clamp-2'>
                {item.product.shortDescription}
              </p>
            </div>

            <button
              onClick={() => onRemove(item.id)}
              className='p-2 ml-4 hover:bg-secondary-100 rounded-full transition-colors'
              aria-label='Remove item'
            >
              <TrashIcon className='w-5 h-5 text-secondary-400 hover:text-danger-500' />
            </button>
          </div>

          {/* Price and Controls */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4'>
            {/* Quantity Controls */}
            <div className='flex items-center gap-3'>
              <span className='text-sm text-secondary-600'>Qty:</span>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className='p-2 hover:bg-secondary-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  aria-label='Decrease quantity'
                >
                  <MinusIcon className='w-4 h-4' />
                </button>

                <span className='text-base font-medium text-secondary-900 min-w-[3rem] text-center'>
                  {item.quantity}
                </span>

                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stockQuantity}
                  className='p-2 hover:bg-secondary-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  aria-label='Increase quantity'
                >
                  <PlusIcon className='w-4 h-4' />
                </button>
              </div>

              {/* Stock Warning */}
              {item.product.stockQuantity <= 5 && (
                <span className='text-xs text-accent-600'>
                  Only {item.product.stockQuantity} left
                </span>
              )}
            </div>

            {/* Pricing */}
            <div className='text-right'>
              <div className='text-xl font-bold text-secondary-900'>
                ${(currentPrice * item.quantity).toFixed(2)}
              </div>
              {item.quantity > 1 && (
                <div className='text-sm text-secondary-500'>${currentPrice.toFixed(2)} each</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Coupon Section Component
function CouponSection({ appliedCoupon }: { appliedCoupon?: any }) {
  // This would integrate with actual coupon system
  return (
    <div className='mb-4'>
      {appliedCoupon ? (
        <div className='p-3 bg-success-50 border border-success-200 rounded-lg'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-success-800'>
              Coupon: {appliedCoupon.code}
            </span>
            <span className='text-sm text-success-700'>
              -
              {appliedCoupon.type === 'percentage'
                ? `${appliedCoupon.value}%`
                : `$${appliedCoupon.value}`}
            </span>
          </div>
        </div>
      ) : (
        <div className='text-sm text-secondary-500'>
          <p>Have a coupon code? Enter it at checkout.</p>
        </div>
      )}
    </div>
  )
}
