'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircleIcon,
  TruckIcon,
  DocumentTextIcon,
  PrinterIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    // In a real app, this would fetch order details from API
    if (orderId) {
      const mockOrderData = {
        id: orderId,
        email: 'customer@example.com',
        orderDate: new Date().toLocaleDateString(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        items: [
          {
            id: '1',
            name: 'Two-Phase Cooling Case Pro',
            price: 1299.0,
            quantity: 1,
            image: '/images/case-pro.jpg',
          },
        ],
        subtotal: 1299.0,
        tax: 103.92,
        shipping: 0,
        total: 1402.92,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
        },
      }
      setOrderData(mockOrderData)
    }
  }, [orderId])

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
    <div className='min-h-screen bg-secondary-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Success Header */}
          <div className='text-center mb-8'>
            <div className='flex justify-center mb-4'>
              <CheckCircleIcon className='w-20 h-20 text-success-500' />
            </div>
            <h1 className='text-3xl font-bold text-secondary-900 mb-2'>Order Confirmed!</h1>
            <p className='text-lg text-secondary-600'>
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
          </div>

          {/* Order Details */}
          <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6'>
              <div>
                <h2 className='text-xl font-semibold text-secondary-900'>Order #{orderData.id}</h2>
                <p className='text-secondary-600'>Placed on {orderData.orderDate}</p>
              </div>
              <div className='mt-4 md:mt-0 flex gap-3'>
                <button className='btn btn-outline'>
                  <PrinterIcon className='w-4 h-4 mr-2' />
                  Print Receipt
                </button>
                <button className='btn btn-outline'>
                  <ShareIcon className='w-4 h-4 mr-2' />
                  Share
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div className='mb-6'>
              <h3 className='font-semibold text-secondary-900 mb-4'>Items Ordered</h3>
              <div className='space-y-4'>
                {orderData.items.map((item: any) => (
                  <div
                    key={item.id}
                    className='flex gap-4 py-4 border-b border-secondary-200 last:border-b-0'
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className='w-16 h-16 object-cover rounded-lg'
                      onError={e => {
                        e.currentTarget.src = '/images/placeholder-product.jpg'
                      }}
                    />
                    <div className='flex-1'>
                      <h4 className='font-medium text-secondary-900'>{item.name}</h4>
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <div className='flex items-center mb-4'>
                <TruckIcon className='w-6 h-6 text-primary-600 mr-2' />
                <h3 className='text-lg font-semibold text-secondary-900'>Shipping Details</h3>
              </div>
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

            <div className='bg-white rounded-lg shadow-sm p-6'>
              <div className='flex items-center mb-4'>
                <DocumentTextIcon className='w-6 h-6 text-primary-600 mr-2' />
                <h3 className='text-lg font-semibold text-secondary-900'>Order Updates</h3>
              </div>
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
              order details and tracking information. If you don&apos;t see it, please check your
              spam folder.
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
