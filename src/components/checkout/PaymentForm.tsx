'use client'

import React, { useState } from 'react'
import { useStripe, useElements, CardElement, CardElementProps } from '@stripe/react-stripe-js'
import { toast } from 'react-hot-toast'
import { Order, OrderCustomer, OrderShippingAddress } from '@/lib/orders'
import { PRODUCT_CONFIG } from '@/constants'
import styles from './PaymentForm.module.css'

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
      color: '#374151', // Dark gray (equivalent to var(--color-secondary-700))
      '::placeholder': {
        color: '#9ca3af', // Medium gray for placeholders
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#dc2626', // Red for validation errors
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    }).format(amount)
  }

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
            phone: customer.phone || null,
            address: {
              line1: shippingAddress.addressLine1,
              line2: shippingAddress.addressLine2 || null,
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
    <div className={styles.paymentContainer}>
      <h3 className={styles.title}>Payment Information</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Order Summary */}
        <div className={styles.orderSummary}>
          <h4 className={styles.summaryTitle}>Order Summary</h4>
          <div className={styles.summaryContent}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subtotal</span>
              <span className={styles.summaryValue}>
                {formatCurrency(order.totals?.subtotal || 0)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Shipping</span>
              <span className={styles.summaryValue}>
                {formatCurrency(order.totals?.shipping || 0)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Tax</span>
              <span className={styles.summaryValue}>{formatCurrency(order.totals?.tax || 0)}</span>
            </div>
            {order.totals?.discount && order.totals.discount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Discount</span>
                <span>-{formatCurrency(order.totals.discount)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{formatCurrency(order.totals?.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Card Information */}
        <div className={styles.cardSection}>
          <label className={styles.cardLabel}>Card Information</label>
          <div className={styles.cardElementContainer}>
            <CardElement options={cardElementOptions} onChange={handleCardChange} />
          </div>
          {cardError && (
            <p className={styles.cardError} role='alert'>
              {cardError}
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className={styles.securityNotice}>
          <div className={styles.securityContent}>
            <svg
              className={styles.securityIcon}
              fill='none'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'></path>
            </svg>
            <p className={styles.securityText}>
              Your payment information is secure and encrypted. We never store your card details.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={!stripe || processing || isLoading}
          className={`${styles.submitButton} ${
            !stripe || processing || isLoading
              ? styles.submitButtonDisabled
              : styles.submitButtonEnabled
          }`}
        >
          {processing || isLoading ? (
            <div className={styles.submitButtonContent}>
              <svg
                className={styles.loadingSpinner}
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className={styles.spinnerCircle}
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className={styles.spinnerPath}
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Processing...
            </div>
          ) : (
            `Pay ${formatCurrency(order.totals?.total || 0)}`
          )}
        </button>
      </form>
    </div>
  )
}
