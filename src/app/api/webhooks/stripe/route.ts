/**
 * Stripe Webhook Handler
 * Verifies webhook signatures and processes payment events
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { updateOrderPaymentStatus } from '@/lib/orders'
import Stripe from 'stripe'

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Stripe Webhook] Missing webhook secret in environment')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err)
      return NextResponse.json(
        {
          error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
        { status: 400 }
      )
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`)

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
        console.log(`[Stripe Webhook] Charge succeeded: ${charge.id}`)
        // Additional charge processing can go here
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    console.warn('[Stripe Webhook] Payment intent missing orderId in metadata')
    return
  }

  try {
    await updateOrderPaymentStatus(orderId, {
      status: 'paid',
      paymentIntentId: paymentIntent.id,
      paidAt: new Date(),
    })

    console.log(`[Stripe Webhook] ✓ Order ${orderId} marked as paid`)

    // TODO: Send confirmation email
    // TODO: Trigger fulfillment process
  } catch (error) {
    console.error(`[Stripe Webhook] Failed to update order ${orderId}:`, error)
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    console.warn('[Stripe Webhook] Payment intent missing orderId in metadata')
    return
  }

  try {
    await updateOrderPaymentStatus(orderId, {
      status: 'payment_failed',
      paymentIntentId: paymentIntent.id,
    })

    console.log(`[Stripe Webhook] Order ${orderId} marked as payment failed`)

    // TODO: Send payment failed email
    // TODO: Release inventory
  } catch (error) {
    console.error(`[Stripe Webhook] Failed to update order ${orderId}:`, error)
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId

  if (!orderId) {
    console.warn('[Stripe Webhook] Payment intent missing orderId in metadata')
    return
  }

  try {
    await updateOrderPaymentStatus(orderId, {
      status: 'cancelled',
      paymentIntentId: paymentIntent.id,
    })

    console.log(`[Stripe Webhook] Order ${orderId} marked as cancelled`)

    // TODO: Release inventory
  } catch (error) {
    console.error(`[Stripe Webhook] Failed to update order ${orderId}:`, error)
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) {
    console.warn('[Stripe Webhook] Charge missing payment_intent')
    return
  }

  try {
    // Find order by payment intent ID
    // TODO: Implement findOrderByPaymentIntentId
    console.log(`[Stripe Webhook] Charge refunded for payment intent: ${paymentIntentId}`)

    // TODO: Update order status to refunded
    // TODO: Restore inventory
    // TODO: Send refund confirmation email
  } catch (error) {
    console.error(`[Stripe Webhook] Failed to handle refund for ${paymentIntentId}:`, error)
  }
}
