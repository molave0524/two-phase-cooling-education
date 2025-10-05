'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  CheckCircleIcon,
  TruckIcon,
  DocumentTextIcon,
  PrinterIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import styles from './order-confirmation.module.css'

interface OrderItem {
  id: string
  name: string
  sku: string
  slug: string
  price: number
  quantity: number
  image: string
}

interface ShippingAddress {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface OrderData {
  id: string
  email: string
  orderDate: string
  estimatedDelivery: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress: ShippingAddress
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const orderId = searchParams.get('id')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
    }
  }, [status])

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId || status !== 'authenticated') return

      try {
        // Fetch order without token (requires authentication)
        const url = `/api/orders/update-payment?orderId=${orderId}`
        const response = await fetch(url)
        const result = await response.json()

        // Handle unauthorized access
        if (!response.ok) {
          if (response.status === 403) {
            setError('You do not have permission to view this order.')
          } else {
            setError('Failed to load order details.')
          }
          return
        }

        if (result.success && result.data?.order) {
          const order = result.data.order
          const customer =
            typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer
          const shippingAddr =
            typeof order.shippingAddress === 'string'
              ? JSON.parse(order.shippingAddress)
              : order.shippingAddress

          setOrderData({
            id: order.orderNumber,
            email: customer.email,
            orderDate: order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            items: order.items.map((item: any) => ({
              id: item.id,
              name: item.product.name,
              sku: item.product.sku || '',
              slug: item.product.slug || '',
              price: item.unitPrice,
              quantity: item.quantity,
              image:
                typeof item.product.images === 'string'
                  ? item.product.images
                  : item.product.images?.[0] || '/images/placeholder-product.jpg',
            })),
            subtotal: order.totals.subtotal,
            tax: order.totals.tax,
            shipping: order.totals.shipping,
            total: order.totals.total,
            shippingAddress: {
              firstName: shippingAddr.firstName,
              lastName: shippingAddr.lastName,
              address: shippingAddr.addressLine1,
              city: shippingAddr.city,
              state: shippingAddr.state,
              zipCode: shippingAddr.zipCode,
              country: shippingAddr.country,
            },
          })
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch order:', error)
      }
    }

    fetchOrder()
  }, [orderId, status])

  if (error) {
    return (
      <div className='min-h-screen bg-secondary-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-secondary-900 mb-4'>Access Denied</h1>
          <p className='text-secondary-600 mb-6'>{error}</p>
          <Link href='/' className='btn btn-primary'>
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!orderId || !orderData) {
    return (
      <div className='min-h-screen bg-secondary-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-secondary-900 mb-4'>Order Not Found</h1>
          <p className='text-secondary-600 mb-6'>
            We couldn&apos;t find the order you&apos;re looking for.
          </p>
          <Link href='/' className='btn btn-primary'>
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Success Header */}
        <div className={styles.successHeader}>
          <div className={styles.iconContainer}>
            <CheckCircleIcon className={`${styles.iconLarge} ${styles.successIcon}`} />
          </div>
          <h1 className={styles.title}>Order Confirmed!</h1>
          <p className={styles.subtitle}>
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
          <span className={styles.orderNumber}>Order #{orderData.id}</span>
        </div>

        {/* Order Details */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Order Summary</h2>
              <p className='text-secondary-600' style={{ marginTop: '0.5rem' }}>
                Placed on {orderData.orderDate}
              </p>
            </div>
            <div className={styles.cardActions}>
              <button className='btn btn-outline'>
                <PrinterIcon className={styles.icon} />
                Print Receipt
              </button>
              <button className='btn btn-outline'>
                <ShareIcon className={styles.icon} />
                Share
              </button>
            </div>
          </div>

          {/* Order Items */}
          <div className='mb-6'>
            <h3 className='font-semibold text-secondary-900 mb-4'>Items Ordered</h3>
            <div className='space-y-4'>
              {orderData.items.map(item => (
                <div
                  key={item.id}
                  className='flex gap-4 py-4 border-b border-secondary-200 last:border-b-0'
                >
                  <Link href={`/products/sku/${item.sku}`}>
                    <Image
                      src={item.image || '/images/placeholder-product.jpg'}
                      alt={item.name}
                      width={64}
                      height={64}
                      className='w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer'
                    />
                  </Link>
                  <div className='flex-1'>
                    <Link href={`/products/sku/${item.sku}`}>
                      <h4 className='font-medium text-secondary-900 hover:text-primary-600 transition-colors cursor-pointer'>
                        {item.name}
                      </h4>
                    </Link>
                    {item.sku && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontFamily: 'monospace',
                          marginTop: '2px',
                        }}
                      >
                        SKU: {item.sku}
                      </p>
                    )}
                    <p className='text-sm text-secondary-600'>Quantity: {item.quantity}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium text-secondary-900'>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className='border-t border-secondary-200 pt-4'>
            <div className='flex justify-end'>
              <div className='w-full max-w-sm'>
                <div className='flex justify-between text-sm mb-2'>
                  <span className='text-secondary-600'>Subtotal:</span>
                  <span className='text-secondary-900'>${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm mb-2'>
                  <span className='text-secondary-600'>Shipping:</span>
                  <span className='text-secondary-900'>
                    {orderData.shipping > 0 ? `$${orderData.shipping.toFixed(2)}` : 'FREE'}
                  </span>
                </div>
                <div className='flex justify-between text-sm mb-4'>
                  <span className='text-secondary-600'>Tax:</span>
                  <span className='text-secondary-900'>${orderData.tax.toFixed(2)}</span>
                </div>
                <div className='flex justify-between items-center py-2 border-t border-secondary-300'>
                  <span className='text-lg font-semibold text-secondary-900'>Total:</span>
                  <span className='text-lg font-bold text-primary-600'>
                    ${orderData.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Info */}
        <div className={styles.gridTwo}>
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              <TruckIcon className={styles.sectionIcon} />
              Shipping Details
            </h3>
            <div className='space-y-2 text-sm'>
              <p className='font-medium text-secondary-900'>
                {orderData.shippingAddress.firstName} {orderData.shippingAddress.lastName}
              </p>
              <p className='text-secondary-600'>{orderData.shippingAddress.address}</p>
              <p className='text-secondary-600'>
                {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{' '}
                {orderData.shippingAddress.zipCode}
              </p>
              <p className='text-secondary-600'>{orderData.shippingAddress.country}</p>
            </div>
            <div className='mt-4 p-3 bg-primary-50 rounded-lg'>
              <p className='text-sm font-medium text-primary-800'>
                Estimated Delivery: {orderData.estimatedDelivery}
              </p>
              <p className='text-xs text-primary-600 mt-1'>
                You&apos;ll receive tracking information via email once your order ships.
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              <DocumentTextIcon className={styles.sectionIcon} />
              Order Updates
            </h3>
            <div className='space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='w-2 h-2 bg-success-500 rounded-full mt-2'></div>
                <div>
                  <p className='text-sm font-medium text-secondary-900'>Order Received</p>
                  <p className='text-xs text-secondary-600'>
                    We&apos;ve received your order and payment
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='w-2 h-2 bg-secondary-300 rounded-full mt-2'></div>
                <div>
                  <p className='text-sm font-medium text-secondary-600'>Processing</p>
                  <p className='text-xs text-secondary-500'>Your order is being prepared</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='w-2 h-2 bg-secondary-300 rounded-full mt-2'></div>
                <div>
                  <p className='text-sm font-medium text-secondary-600'>Shipped</p>
                  <p className='text-xs text-secondary-500'>Your order is on its way</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='w-2 h-2 bg-secondary-300 rounded-full mt-2'></div>
                <div>
                  <p className='text-sm font-medium text-secondary-600'>Delivered</p>
                  <p className='text-xs text-secondary-500'>Your order has arrived</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Email Notice */}
        <div className='bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6'>
          <h3 className='font-semibold text-primary-800 mb-2'>Confirmation Email Sent</h3>
          <p className='text-sm text-primary-700'>
            We&apos;ve sent a confirmation email to <strong>{orderData.email}</strong> with your
            order details and tracking information. If you don&apos;t see it, please check your spam
            folder.
          </p>
        </div>

        {/* Next Steps */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h3 className='text-lg font-semibold text-secondary-900 mb-4'>What&apos;s Next?</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='font-medium text-secondary-900 mb-2'>Track Your Order</h4>
              <p className='text-sm text-secondary-600 mb-3'>
                You&apos;ll receive tracking information via email once your order ships.
              </p>
              <Link
                href='/track-order'
                className='text-sm text-primary-600 hover:text-primary-700 font-medium'
              >
                Track Order →
              </Link>
            </div>
            <div>
              <h4 className='font-medium text-secondary-900 mb-2'>Need Help?</h4>
              <p className='text-sm text-secondary-600 mb-3'>
                Our support team is here to help with any questions about your order.
              </p>
              <Link
                href='/support'
                className='text-sm text-primary-600 hover:text-primary-700 font-medium'
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className='text-center mt-8'>
          <Link href='/products' className='btn btn-primary'>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-secondary-50 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
            <p className='text-secondary-600'>Loading order details...</p>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  )
}
