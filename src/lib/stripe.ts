/**
 * Stripe Configuration and Helper Functions
 * Handles payment processing integration with Stripe API
 */

import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Environment variables validation
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!STRIPE_SECRET_KEY && typeof window === 'undefined') {
  console.warn('Missing STRIPE_SECRET_KEY - Payment processing will not work')
}

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn(
    'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Client-side payment processing will not work'
  )
}

// Server-side Stripe instance
export const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Client-side Stripe promise
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key')

// Payment intent creation
export interface CreatePaymentIntentParams {
  amount: number // Amount in cents
  currency?: string
  customerId?: string
  metadata?: Record<string, string>
  description?: string
  shippingAddress?: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const {
    amount,
    currency = 'usd',
    customerId,
    metadata = {},
    description,
    shippingAddress,
  } = params

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure integer
      currency,
      ...(customerId && { customer: customerId }),
      metadata,
      ...(description && { description }),
      ...(shippingAddress && {
        shipping: {
          name: shippingAddress.name,
          address: shippingAddress.address,
        },
      }),
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return paymentIntent
  } catch (error) {
    console.error('Failed to create payment intent:', error)
    throw new Error('Failed to create payment intent')
  }
}

// Customer creation and management
export interface CreateCustomerParams {
  email: string
  name?: string
  phone?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  metadata?: Record<string, string>
}

export async function createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
  try {
    const customer = await stripe.customers.create({
      email: params.email,
      ...(params.name && { name: params.name }),
      ...(params.phone && { phone: params.phone }),
      ...(params.address && { address: params.address }),
      metadata: params.metadata || {},
    })

    return customer
  } catch (error) {
    console.error('Failed to create customer:', error)
    throw new Error('Failed to create customer')
  }
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer as Stripe.Customer
  } catch (error) {
    console.error('Failed to get customer:', error)
    return null
  }
}

// Payment method management
export async function attachPaymentMethodToCustomer(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    return paymentMethod
  } catch (error) {
    console.error('Failed to attach payment method:', error)
    throw new Error('Failed to attach payment method')
  }
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  endpointSecret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Webhook signature verification failed')
  }
}

// Price formatting utilities
export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100) // Convert from cents
}

export function convertToCents(amount: number): number {
  return Math.round(amount * 100)
}

export function convertFromCents(amount: number): number {
  return amount / 100
}

// Payment status helpers
export function isPaymentSuccessful(paymentIntent: Stripe.PaymentIntent): boolean {
  return paymentIntent.status === 'succeeded'
}

export function isPaymentPending(paymentIntent: Stripe.PaymentIntent): boolean {
  return ['processing', 'requires_action', 'requires_confirmation'].includes(paymentIntent.status)
}

export function isPaymentFailed(paymentIntent: Stripe.PaymentIntent): boolean {
  return ['canceled', 'failed', 'requires_payment_method'].includes(paymentIntent.status)
}

// Error handling
export class StripeError extends Error {
  constructor(
    message: string,
    public stripeError?: Stripe.errors.StripeError
  ) {
    super(message)
    this.name = 'StripeError'
  }
}

export function handleStripeError(error: any): StripeError {
  if (error.type === 'StripeCardError') {
    return new StripeError(`Payment failed: ${error.message}`, error)
  }

  if (error.type === 'StripeRateLimitError') {
    return new StripeError('Too many requests made to the API too quickly', error)
  }

  if (error.type === 'StripeInvalidRequestError') {
    return new StripeError('Invalid parameters were supplied to Stripe', error)
  }

  if (error.type === 'StripeAPIError') {
    return new StripeError('An error occurred internally with Stripe', error)
  }

  if (error.type === 'StripeConnectionError') {
    return new StripeError('Network communication with Stripe failed', error)
  }

  if (error.type === 'StripeAuthenticationError') {
    return new StripeError('Authentication with Stripe failed', error)
  }

  return new StripeError('An unexpected error occurred', error)
}

// Development/testing utilities
export const STRIPE_TEST_CARDS = {
  VISA_SUCCESS: '4242424242424242',
  VISA_DECLINED: '4000000000000002',
  MASTERCARD_SUCCESS: '5555555555554444',
  AMEX_SUCCESS: '378282246310005',
  REQUIRES_AUTHENTICATION: '4000002500003155',
} as const

// Default configuration for development
export const STRIPE_CONFIG = {
  currency: 'usd',
  locale: 'en-US',
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0070f3',
      colorBackground: '#ffffff',
      colorText: '#000000',
      borderRadius: '8px',
    },
  },
} as const
