'use client'

import React from 'react'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { CartItem } from '@/types/cart'
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'

export default function CartDrawer() {
  const {
    isOpen,
    items,
    itemCount,
    subtotal,
    tax,
    shipping,
    total,
    appliedCoupon,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCartStore()

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity)
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50 z-40 lg:z-50' onClick={closeCart} />

      {/* Cart Drawer */}
      <div className='fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-50'>
        {/* Header - Fixed */}
        <div className='absolute top-0 left-0 right-0 bg-white border-b border-secondary-200 p-6 z-10'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-secondary-900'>
              Shopping Cart ({itemCount})
            </h2>
            <button
              onClick={closeCart}
              className='p-2 hover:bg-secondary-100 rounded-full transition-colors'
              aria-label='Close cart'
            >
              <XMarkIcon className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Cart Content - Scrollable */}
        <div
          className='absolute left-0 right-0 overflow-y-scroll border-2 border-red-500'
          style={{
            top: '88px',
            height: items.length > 0 ? 'calc(100vh - 88px - 300px)' : 'calc(100vh - 88px)',
            maxHeight: items.length > 0 ? 'calc(100vh - 88px - 300px)' : 'calc(100vh - 88px)',
          }}
        >
          {items.length === 0 ? (
            // Empty Cart
            <div className='flex flex-col items-center justify-center h-full p-6 text-center'>
              <ShoppingBagIcon className='w-16 h-16 text-secondary-300 mb-4' />
              <h3 className='text-lg font-medium text-secondary-900 mb-2'>Your cart is empty</h3>
              <p className='text-secondary-600 mb-6'>Add some products to get started</p>
              <Link href='/products' onClick={closeCart} className='btn btn-primary'>
                Shop Products
              </Link>
            </div>
          ) : (
            // Cart Items with forced content
            <div className='p-6 space-y-6'>
              {items.map(item => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}
              {/* Force scrollable content */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={`test-${i}`} className='bg-blue-50 border border-blue-200 p-4 rounded'>
                  <p className='text-blue-800'>Test scroll item {i + 1}</p>
                  <p className='text-sm text-blue-600'>
                    This should be scrollable if the fix works
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className='absolute bottom-0 left-0 right-0 border-t border-secondary-200 bg-secondary-50 p-6'>
            {/* Applied Coupon */}
            {appliedCoupon && (
              <div className='mb-4 p-3 bg-success-50 border border-success-200 rounded-lg'>
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
            )}

            {/* Price Summary */}
            <div className='space-y-2 mb-4'>
              <div className='flex justify-between text-sm'>
                <span className='text-secondary-600'>Subtotal:</span>
                <span className='text-secondary-900'>${subtotal.toFixed(2)}</span>
              </div>

              {shipping > 0 ? (
                <div className='flex justify-between text-sm'>
                  <span className='text-secondary-600'>Shipping:</span>
                  <span className='text-secondary-900'>${shipping.toFixed(2)}</span>
                </div>
              ) : (
                <div className='flex justify-between text-sm'>
                  <span className='text-secondary-600'>Shipping:</span>
                  <span className='text-success-600 font-medium'>FREE</span>
                </div>
              )}

              <div className='flex justify-between text-sm'>
                <span className='text-secondary-600'>Tax:</span>
                <span className='text-secondary-900'>${tax.toFixed(2)}</span>
              </div>

              {subtotal < 500 && (
                <div className='text-xs text-secondary-500 mt-2'>
                  Add ${(500 - subtotal).toFixed(2)} more for free shipping
                </div>
              )}
            </div>

            {/* Total */}
            <div className='flex justify-between items-center py-3 border-t border-secondary-300'>
              <span className='text-lg font-semibold text-secondary-900'>Total:</span>
              <span className='text-lg font-bold text-primary-600'>${total.toFixed(2)}</span>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3 mt-4'>
              <Link href='/cart' onClick={closeCart} className='btn btn-secondary w-full'>
                View Cart
              </Link>
              <Link href='/checkout' onClick={closeCart} className='btn btn-primary w-full'>
                Secure Checkout
              </Link>
            </div>

            {/* Security Notice */}
            <div className='mt-3 text-xs text-center text-secondary-500'>
              🔒 Secure SSL Checkout • Free Returns • 5-Year Warranty
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Individual Cart Item Component
function CartItemComponent({
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
    <div className='flex gap-4'>
      {/* Product Image */}
      <div className='flex-shrink-0'>
        <Link href={`/products/${item.product.slug}`}>
          <img
            src={mainImage?.url}
            alt={mainImage?.altText || item.product.name}
            className='w-20 h-20 object-cover rounded-lg border border-secondary-200'
          />
        </Link>
      </div>

      {/* Product Info */}
      <div className='flex-1 min-w-0'>
        <div className='flex justify-between items-start mb-2'>
          <div>
            <Link
              href={`/products/${item.product.slug}`}
              className='text-sm font-medium text-secondary-900 hover:text-primary-600 line-clamp-2'
            >
              {item.product.name}
            </Link>
            {item.selectedVariantId && (
              <p className='text-xs text-secondary-600'>
                Variant: {item.product.variants?.find(v => v.id === item.selectedVariantId)?.name}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className='p-1 hover:bg-secondary-100 rounded-full transition-colors'
            aria-label='Remove item'
          >
            <TrashIcon className='w-4 h-4 text-secondary-400' />
          </button>
        </div>

        {/* Price and Quantity Controls */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className='p-1 hover:bg-secondary-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed'
              aria-label='Decrease quantity'
            >
              <MinusIcon className='w-4 h-4' />
            </button>

            <span className='text-sm font-medium text-secondary-900 min-w-[2rem] text-center'>
              {item.quantity}
            </span>

            <button
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.product.stockQuantity}
              className='p-1 hover:bg-secondary-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed'
              aria-label='Increase quantity'
            >
              <PlusIcon className='w-4 h-4' />
            </button>
          </div>

          <div className='text-right'>
            <div className='text-sm font-semibold text-secondary-900'>
              ${(currentPrice * item.quantity).toFixed(2)}
            </div>
            {item.quantity > 1 && (
              <div className='text-xs text-secondary-500'>${currentPrice.toFixed(2)} each</div>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {item.product.stockQuantity <= 5 && (
          <div className='mt-1 text-xs text-accent-600'>
            Only {item.product.stockQuantity} left in stock
          </div>
        )}
      </div>
    </div>
  )
}
