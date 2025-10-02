/**
 * Stripe Webhook Handler
 * Verifies webhook signatures and processes payment events
 */

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { updateOrderPaymentStatus } from '@/lib/orders'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'
import { apiSuccess, apiError, apiInternalError, ERROR_CODES } from '@/lib/api-response'

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      logger.error('Stripe webhook missing signature header')
      return apiError(ERROR_CODES.INVALID_INPUT, 'Missing signature', { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured')
      return apiInternalError('Webhook not configured')
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', { error: err })
      return apiError(
        ERROR_CODES.INVALID_INPUT,
        `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        { status: 400, error: err }
      )
    }

    logger.info('Stripe webhook received', { eventType: event.type })

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentCanceled(paymentIntent)
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        logger.info('Stripe charge succeeded', { chargeId: charge.id })
        // Additional charge processing can go here
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      default:
        logger.debug('Unhandled Stripe webhook event type', { eventType: event.type })
    }

    return apiSuccess({ received: true })
  } catch (error) {
    logger.error('Stripe webhook processing failed', { error })
    return apiInternalError('Webhook processing failed', { error })
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    logger.warn('Payment intent missing orderId in metadata', {
      paymentIntentId: paymentIntent.id,
    })
    return
  }

  try {
    await updateOrderPaymentStatus(orderId, {
      status: 'paid',
      paymentIntentId: paymentIntent.id,
      paidAt: new Date(),
    })

    logger.info('Order marked as paid', {
      orderId,
      paymentIntentId: paymentIntent.id,
    })

    // TODO: Send confirmation email
    // TODO: Trigger fulfillment process
  } catch (error) {
    logger.error('Failed to update order payment status', { orderId, error })
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    logger.warn('Payment intent missing orderId in metadata', {
      paymentIntentId: paymentIntent.id,
    })
    return
  }

  try {
    await updateOrderPaymentStatus(orderId, {
      status: 'payment_failed',
      paymentIntentId: paymentIntent.id,
    })

    logger.info('Order marked as payment failed', {
      orderId,
      paymentIntentId: paymentIntent.id,
    })

    // TODO: Send payment failed email
    // TODO: Release inventory
  } catch (error) {
    logger.error('Failed to update order payment status', { orderId, error })
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    logger.warn('Payment intent missing orderId in metadata', {
      paymentIntentId: paymentIntent.id,
    })
    return
  }

  try {
    await updateOrderPaymentStatus(orderId, {
      status: 'cancelled',
      paymentIntentId: paymentIntent.id,
    })

    logger.info('Order marked as cancelled', {
      orderId,
      paymentIntentId: paymentIntent.id,
    })

    // TODO: Release inventory
  } catch (error) {
    logger.error('Failed to update order payment status', { orderId, error })
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) {
    logger.warn('Charge missing payment_intent', { chargeId: charge.id })
    return
  }

  try {
    // Find order by payment intent ID
    // TODO: Implement findOrderByPaymentIntentId
    logger.info('Charge refunded', { paymentIntentId, chargeId: charge.id })

    // TODO: Update order status to refunded
    // TODO: Restore inventory
    // TODO: Send refund confirmation email
  } catch (error) {
    logger.error('Failed to handle refund', { paymentIntentId, error })
  }
}
