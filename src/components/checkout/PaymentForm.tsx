'use client'

import React, { useState } from 'react'
import { useStripe, useElements, CardElement, CardElementProps } from '@stripe/react-stripe-js'
import { toast } from 'react-hot-toast'
import { Order, OrderCustomer, OrderShippingAddress } from '@/lib/orders'

interface PaymentFormProps {
  order: Partial<Order>
  customer: OrderCustomer
  shippingAddress: OrderShippingAddress
  onSuccess: (order: Order) => void
  onError: (error: string) => void
  isLoading?: boolean
}

const cardElementOptions: CardElementProps['options'] = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  order,
  customer,
  shippingAddress,
  onSuccess,
  onError,
  isLoading = false,
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message)
    } else {
      setCardError(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe has not loaded yet. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error('Card element not found')
      return
    }

    setProcessing(true)
    setCardError(null)

    try {
      // Create payment intent on server
      const response = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order,
          customer,
          shippingAddress,
        }),
      })

      const { clientSecret, orderId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer.phone,
            address: {
              line1: shippingAddress.addressLine1,
              line2: shippingAddress.addressLine2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: shippingAddress.country,
            },
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update order status on server
        const updateResponse = await fetch('/api/orders/update-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            paymentIntentId: paymentIntent.id,
            status: 'succeeded',
          }),
        })

        const { order: updatedOrder, error: updateError } = await updateResponse.json()

        if (updateError) {
          throw new Error(updateError)
        }

        toast.success('Payment successful!')
        onSuccess(updatedOrder)
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      const errorMessage = error.message || 'Payment failed. Please try again.'
      setCardError(errorMessage)
      onError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>Payment Information</h3>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Order Summary */}
        <div className='border-b border-gray-200 pb-4'>
          <h4 className='font-medium text-gray-900 mb-3'>Order Summary</h4>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Subtotal</span>
              <span className='font-medium'>${order.totals?.subtotal.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Shipping</span>
              <span className='font-medium'>${order.totals?.shipping.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Tax</span>
              <span className='font-medium'>${order.totals?.tax.toFixed(2)}</span>
            </div>
            {order.totals?.discount && order.totals.discount > 0 && (
              <div className='flex justify-between text-green-600'>
                <span>Discount</span>
                <span>-${order.totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className='flex justify-between text-lg font-semibold border-t pt-2'>
              <span>Total</span>
              <span>${order.totals?.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card Information */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Card Information</label>
          <div className='border border-gray-300 rounded-md p-3 bg-white'>
            <CardElement options={cardElementOptions} onChange={handleCardChange} />
          </div>
          {cardError && (
            <p className='mt-2 text-sm text-red-600' role='alert'>
              {cardError}
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className='bg-gray-50 rounded-md p-4'>
          <div className='flex items-center'>
            <svg
              className='h-5 w-5 text-green-500 mr-2'
              fill='none'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'></path>
            </svg>
            <p className='text-sm text-gray-600'>
              Your payment information is secure and encrypted. We never store your card details.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={!stripe || processing || isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            !stripe || processing || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {processing || isLoading ? (
            <div className='flex items-center justify-center'>
              <svg
                className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Processing...
            </div>
          ) : (
            `Pay $${order.totals?.total.toFixed(2)}`
          )}
        </button>

        {/* Test Card Notice (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
            <p className='text-sm text-yellow-800'>
              <strong>Test Mode:</strong> Use test card 4242 4242 4242 4242 with any valid expiry
              and CVC.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
