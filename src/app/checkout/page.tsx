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
import {
  TruckIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, itemCount, subtotal, tax, shipping, total, appliedCoupon, clearCart } =
    useCartStore()

  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [isProcessing] = useState(false)
  const [customer, setCustomer] = useState<OrderCustomer | null>(null)
  const [shippingAddress, setShippingAddress] = useState<OrderShippingAddress | null>(null)

  // Redirect if cart is empty
  useEffect(() => {
    if (itemCount === 0) {
      router.push('/cart')
    }
  }, [itemCount, router])

  const handleShippingSubmit = (
    customerData: OrderCustomer,
    shippingData: OrderShippingAddress
  ) => {
    setCustomer(customerData)
    setShippingAddress(shippingData)
    setStep('payment')
  }

  const handlePaymentSuccess = (order: Order) => {
    clearCart()
    router.push(`/order-confirmation?id=${order.id}`)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
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
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Your cart is empty</h1>
          <Link href='/products' className='btn btn-primary'>
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-secondary-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-secondary-900 mb-2'>Secure Checkout</h1>
          <div className='flex items-center text-sm text-secondary-600'>
            <LockClosedIcon className='w-4 h-4 mr-1' />
            SSL Secured • Your information is protected
          </div>
        </div>

        {/* Progress Steps */}
        <div className='mb-8'>
          <div className='flex items-center justify-center'>
            <div
              className={`flex items-center ${step === 'shipping' ? 'text-primary-600' : 'text-success-600'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'shipping' ? 'bg-primary-100 border-2 border-primary-600' : 'bg-success-100 border-2 border-success-600'}`}
              >
                1
              </div>
              <span className='ml-2 text-sm font-medium'>Shipping</span>
            </div>

            <ChevronRightIcon className='w-5 h-5 mx-4 text-secondary-400' />

            <div
              className={`flex items-center ${step === 'payment' ? 'text-primary-600' : 'text-secondary-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'payment' ? 'bg-primary-100 border-2 border-primary-600' : 'bg-secondary-200 border-2 border-secondary-400'}`}
              >
                2
              </div>
              <span className='ml-2 text-sm font-medium'>Payment</span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2'>
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
              <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
                <p className='text-yellow-800'>Please complete the shipping information first.</p>
                <button
                  onClick={() => setStep('shipping')}
                  className='mt-2 text-yellow-600 hover:text-yellow-700 font-medium'
                >
                  Go back to shipping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-sm p-6 sticky top-8'>
              <h3 className='text-lg font-semibold text-secondary-900 mb-4'>Order Summary</h3>

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

              {/* Price Breakdown */}
              <div className='space-y-2 mb-4'>
                <div className='flex justify-between text-sm'>
                  <span className='text-secondary-600'>Subtotal ({itemCount} items):</span>
                  <span className='text-secondary-900'>${subtotal.toFixed(2)}</span>
                </div>

                <div className='flex justify-between text-sm'>
                  <span className='text-secondary-600'>Shipping:</span>
                  <span className='text-secondary-900'>
                    {shipping > 0 ? (
                      `$${shipping.toFixed(2)}`
                    ) : (
                      <span className='text-success-600 font-medium'>FREE</span>
                    )}
                  </span>
                </div>

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

              {/* Security Features */}
              <div className='mt-6 space-y-2'>
                <div className='flex items-center text-sm text-secondary-600'>
                  <ShieldCheckIcon className='w-4 h-4 mr-2 text-success-500' />
                  SSL Secure Checkout
                </div>
                <div className='flex items-center text-sm text-secondary-600'>
                  <TruckIcon className='w-4 h-4 mr-2 text-success-500' />
                  Free Returns
                </div>
                <div className='flex items-center text-sm text-secondary-600'>
                  <ShieldCheckIcon className='w-4 h-4 mr-2 text-success-500' />
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
