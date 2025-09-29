'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/stores/cartStore'
import { CartItem } from '@/types/cart'
import { CART_CONFIG } from '@/constants'
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import styles from './cart.module.css'

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
    <div className={`${styles.cartPage} input-autofill-override`}>
      {/* Hero Section */}
      <div id='hero' className={styles.heroSection} aria-labelledby='hero-heading'>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroTitle}>
              <ShoppingBagIcon className={styles.heroIcon} />
              <h1 id='hero-heading' className='section-title text-3xl font-bold text-secondary-900'>
                Shopping Cart
              </h1>
            </div>
            {itemCount > 0 && (
              <p className='text-lg text-secondary-600 max-w-3xl mx-auto'>
                {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
              </p>
            )}

            {/* Action buttons */}
            <div className={styles.heroActions}>
              <Link href='/products' className={styles.continueShoppingLink}>
                <ArrowLeftIcon className={styles.continueShoppingIcon} />
                <span>Continue Shopping</span>
              </Link>
              {items.length > 0 && (
                <button onClick={handleClearCart} className={styles.clearCartButton}>
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
          className={styles.cartSection}
        >
          <div className={styles.container}>
            <div className={styles.emptyCartContent}>
              <ShoppingBagIcon className={styles.emptyCartIcon} />
              <h2 className={styles.emptyCartTitle}>Your cart is empty</h2>
              <p className={styles.emptyCartDescription}>
                Discover our revolutionary two-phase cooling systems and add some products to get
                started.
              </p>
              <div className={styles.emptyCartActions}>
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
          className={styles.cartSection}
        >
          <div className={styles.container}>
            <div className={styles.cartGrid}>
              {/* Cart Items */}
              <div>
                <div className={styles.cartItems}>
                  <div className={styles.cartItemsHeader}>
                    <h2 className={styles.cartItemsTitle}>Cart Items ({itemCount})</h2>
                  </div>

                  <div className={styles.cartItemsList}>
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
              <div>
                <div className={styles.orderSummary}>
                  <div className={styles.orderSummaryContent}>
                    <h2 className={styles.orderSummaryTitle}>Order Summary</h2>

                    {/* Coupon Section */}
                    <CouponSection appliedCoupon={appliedCoupon} />

                    {/* Price Breakdown */}
                    <div className={styles.priceBreakdown}>
                      <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Subtotal ({itemCount} items):</span>
                        <span className={styles.priceValue}>${subtotal.toFixed(2)}</span>
                      </div>

                      <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Shipping:</span>
                        {shipping > 0 ? (
                          <span className={styles.priceValue}>${shipping.toFixed(2)}</span>
                        ) : (
                          <span className={styles.priceValueFree}>FREE</span>
                        )}
                      </div>

                      <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>Estimated Tax:</span>
                        <span className={styles.priceValue}>${tax.toFixed(2)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className={styles.priceRow}>
                          <span className={styles.priceLabel}>Coupon Discount:</span>
                          <span className={styles.priceValueDiscount}>
                            -
                            {appliedCoupon.type === 'percentage'
                              ? `${appliedCoupon.value}%`
                              : `$${appliedCoupon.value.toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Total:</span>
                      <span className={styles.totalValue}>${total.toFixed(2)}</span>
                    </div>

                    {/* Free Shipping Progress */}
                    {subtotal < CART_CONFIG.FREE_SHIPPING_THRESHOLD && (
                      <div className={styles.shippingProgress}>
                        <div className={styles.shippingProgressHeader}>
                          <TagIcon className={styles.shippingProgressIcon} />
                          <span className={styles.shippingProgressText}>
                            Add ${(CART_CONFIG.FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more
                            for free shipping
                          </span>
                        </div>
                        <div className={styles.shippingProgressBar}>
                          <div
                            className={styles.shippingProgressFill}
                            style={{
                              width: `${Math.min((subtotal / CART_CONFIG.FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {subtotal >= CART_CONFIG.FREE_SHIPPING_THRESHOLD && (
                      <div className={styles.shippingQualified}>
                        <div className={styles.shippingQualifiedContent}>
                          <CheckCircleIcon className={styles.shippingQualifiedIcon} />
                          <span className={styles.shippingQualifiedText}>
                            You qualify for free shipping!
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Checkout Button */}
                    <div className={styles.checkoutActions}>
                      <Link href='/checkout' className='btn btn-primary btn-lg w-full'>
                        Secure Checkout
                      </Link>

                      <div className={styles.secureNotice}>
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
    <div className={styles.cartItem}>
      <div className={styles.cartItemContent}>
        {/* Product Image */}
        <div className={styles.cartItemImage}>
          <Link href={`/products/${item.product.slug}`} className={styles.cartItemImageLink}>
            <Image
              src={mainImage?.url || '/placeholder-product.jpg'}
              alt={mainImage?.altText || item.product.name}
              width={120}
              height={120}
              className={styles.cartItemImg}
            />
          </Link>
        </div>

        {/* Product Details */}
        <div className={styles.cartItemDetails}>
          {/* Header Section with Title and Remove Button */}
          <div className={styles.cartItemHeader}>
            <div className={styles.cartItemTitleSection}>
              <Link href={`/products/${item.product.slug}`} className={styles.cartItemTitle}>
                {item.product.name}
              </Link>

              {item.selectedVariantId && (
                <div className={styles.cartItemVariant}>
                  <span className={styles.cartItemVariantBadge}>
                    {item.product.variants?.find(v => v.id === item.selectedVariantId)?.name}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => onRemove(item.id)}
              className={styles.removeButton}
              aria-label='Remove item'
            >
              <TrashIcon className={styles.removeIcon} />
            </button>
          </div>

          {/* Description Section */}
          <div className={styles.cartItemDescription}>
            <p className={styles.cartItemDescriptionText}>{item.product.shortDescription}</p>
          </div>

          {/* Controls Section */}
          <div className={styles.cartItemControls}>
            {/* Quantity Controls */}
            <div className={styles.quantitySection}>
              <span className={styles.quantityLabel}>Quantity:</span>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className={`${styles.quantityButton} ${styles.quantityButtonLeft}`}
                  aria-label='Decrease quantity'
                >
                  <MinusIcon className={styles.quantityIcon} />
                </button>

                <span className={styles.quantityDisplay}>{item.quantity}</span>

                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  disabled={item.quantity >= CART_CONFIG.MAX_QUANTITY_PER_ITEM}
                  className={`${styles.quantityButton} ${styles.quantityButtonRight}`}
                  aria-label='Increase quantity'
                >
                  <PlusIcon className={styles.quantityIcon} />
                </button>
              </div>

              {/* Stock Warning */}
              {item.product.stockQuantity <= CART_CONFIG.LOW_STOCK_THRESHOLD && (
                <span className={styles.stockWarning}>Only {item.product.stockQuantity} left</span>
              )}
            </div>

            {/* Pricing */}
            <div className={styles.cartItemPricing}>
              <div className={styles.cartItemTotal}>
                ${(currentPrice * item.quantity).toFixed(2)}
              </div>
              {item.quantity > 1 && (
                <div className={styles.cartItemUnitPrice}>${currentPrice.toFixed(2)} each</div>
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
    <div className={styles.couponSection}>
      {appliedCoupon ? (
        <div className={styles.appliedCoupon}>
          <div className={styles.appliedCouponContent}>
            <span className={styles.appliedCouponCode}>Coupon: {appliedCoupon.code}</span>
            <span className={styles.appliedCouponValue}>
              -
              {appliedCoupon.type === 'percentage'
                ? `${appliedCoupon.value}%`
                : `$${appliedCoupon.value}`}
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.couponPlaceholder}>
          <p>Have a coupon code? Enter it at checkout.</p>
        </div>
      )}
    </div>
  )
}
