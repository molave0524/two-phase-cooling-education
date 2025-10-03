'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { useCartStore } from '@/stores/cartStore'
import { stripePromise } from '@/lib/stripe'
import { ShippingForm } from '@/components/checkout/ShippingForm'
import { PaymentForm } from '@/components/checkout/PaymentForm'
import { Order, OrderCustomer, OrderShippingAddress } from '@/lib/orders'
import { CART_CONFIG } from '@/constants'
import {
  TruckIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'
import styles from './checkout.module.css'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, itemCount, subtotal, tax, shipping, total, appliedCoupon, clearCart } =
    useCartStore()

  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [isProcessing] = useState(false)
  const [customer, setCustomer] = useState<OrderCustomer | null>(null)
  const [shippingAddress, setShippingAddress] = useState<OrderShippingAddress | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for hydration before checking cart
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Redirect if cart is empty (only after hydration)
  useEffect(() => {
    if (isHydrated && itemCount === 0) {
      router.push('/cart')
    }
  }, [isHydrated, itemCount, router])

  const handleShippingSubmit = (
    customerData: OrderCustomer,
    shippingData: OrderShippingAddress
  ) => {
    setCustomer(customerData)
    setShippingAddress(shippingData)
    setStep('payment')
  }

  const handlePaymentSuccess = (order: Order, accessToken?: string) => {
    clearCart()
    // Include access token in URL for secure guest access
    const redirectUrl = `/order-confirmation?id=${order.id}${accessToken ? `&token=${accessToken}` : ''}`
    // Use window.location.href for more reliable redirect after payment
    window.location.href = redirectUrl
  }

  const handlePaymentError = (error: string) => {
    logger.error('Payment error', new Error(error))
    // Error is already displayed in the PaymentForm component
  }

  // Create order data for payment form
  const orderData = {
    items: items.map(item => ({
      ...item,
      unitPrice: item.product.price,
      totalPrice: item.product.price * item.quantity,
    })),
    totals: {
      subtotal,
      tax,
      taxRate: 0.08, // This would be calculated based on shipping address
      shipping,
      shippingMethod: shipping === 0 ? 'Free Standard Shipping' : 'Standard Shipping',
      discount: appliedCoupon
        ? appliedCoupon.type === 'percentage'
          ? subtotal * (appliedCoupon.value / 100)
          : appliedCoupon.value
        : 0,
      discountCode: appliedCoupon?.code || '',
      total,
    },
  }

  if (itemCount === 0) {
    return (
      <div className={styles.emptyCartContainer}>
        <div className={styles.emptyCartContent}>
          <h1 className={styles.emptyCartTitle}>Your cart is empty</h1>
          <Link href='/products' className='btn btn-primary'>
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.checkoutPage} input-autofill-override`}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Secure Checkout</h1>
          <div className={styles.securityNotice}>
            <LockClosedIcon className={styles.securityIcon} />
            SSL Secured • Your information is protected
          </div>
        </div>

        {/* Progress Steps */}
        <div className={styles.progressSection}>
          <div className={styles.progressContainer}>
            <div
              className={`${styles.progressStep} ${
                step === 'shipping' ? styles.progressStepActive : styles.progressStepCompleted
              }`}
            >
              <div
                className={`${styles.progressStepIcon} ${
                  step === 'shipping'
                    ? styles.progressStepIconActive
                    : styles.progressStepIconCompleted
                }`}
              >
                1
              </div>
              <span className={styles.progressStepLabel}>Shipping</span>
            </div>

            <ChevronRightIcon className={styles.progressArrow} />

            <div
              className={`${styles.progressStep} ${
                step === 'payment' ? styles.progressStepActive : styles.progressStepInactive
              }`}
            >
              <div
                className={`${styles.progressStepIcon} ${
                  step === 'payment'
                    ? styles.progressStepIconActive
                    : styles.progressStepIconInactive
                }`}
              >
                2
              </div>
              <span className={styles.progressStepLabel}>Payment</span>
            </div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          {/* Main Content */}
          <div className={styles.mainContent}>
            {step === 'shipping' && (
              <ShippingForm onSubmit={handleShippingSubmit} isLoading={isProcessing} />
            )}

            {step === 'payment' && customer && shippingAddress && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  order={orderData}
                  customer={customer}
                  shippingAddress={shippingAddress}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isLoading={isProcessing}
                />
              </Elements>
            )}

            {step === 'payment' && (!customer || !shippingAddress) && (
              <div className={styles.warningCard}>
                <p className={styles.warningText}>
                  Please complete the shipping information first.
                </p>
                <button onClick={() => setStep('shipping')} className={styles.warningButton}>
                  Go back to shipping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className={styles.orderSummary}>
              <h3 className={styles.orderSummaryTitle}>Order Summary</h3>

              {/* Applied Coupon */}
              {appliedCoupon && (
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
              )}

              {/* Price Breakdown */}
              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span className={styles.priceLabel}>Subtotal ({itemCount} items):</span>
                  <span className={styles.priceValue}>${subtotal.toFixed(2)}</span>
                </div>

                <div className={styles.priceRow}>
                  <span className={styles.priceLabel}>Shipping:</span>
                  <span className={styles.priceValue}>
                    {shipping > 0 ? (
                      `$${shipping.toFixed(2)}`
                    ) : (
                      <span className={styles.priceValueFree}>FREE</span>
                    )}
                  </span>
                </div>

                <div className={styles.priceRow}>
                  <span className={styles.priceLabel}>Tax:</span>
                  <span className={styles.priceValue}>${tax.toFixed(2)}</span>
                </div>

                {subtotal < CART_CONFIG.FREE_SHIPPING_THRESHOLD && (
                  <div className={styles.shippingNotice}>
                    Add ${(CART_CONFIG.FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free
                    shipping
                  </div>
                )}
              </div>

              {/* Total */}
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total:</span>
                <span className={styles.totalValue}>${total.toFixed(2)}</span>
              </div>

              {/* Security Features */}
              <div className={styles.securityFeatures}>
                <div className={styles.securityFeature}>
                  <ShieldCheckIcon className={styles.securityFeatureIcon} />
                  SSL Secure Checkout
                </div>
                <div className={styles.securityFeature}>
                  <TruckIcon className={styles.securityFeatureIcon} />
                  Free Returns
                </div>
                <div className={styles.securityFeature}>
                  <ShieldCheckIcon className={styles.securityFeatureIcon} />
                  5-Year Warranty
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
