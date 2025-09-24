import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent, createCustomer, handleStripeError } from '@/lib/stripe'
import { createOrder, validateOrderInventory, reserveInventory } from '@/lib/orders'
import { useCartStore } from '@/stores/cartStore'
import { z } from 'zod'

const CreatePaymentIntentSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
  }),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    company: z.string().optional(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().default('US'),
    phone: z.string().optional(),
  }),
  order: z
    .object({
      items: z.array(z.any()).optional(),
      totals: z
        .object({
          subtotal: z.number(),
          tax: z.number(),
          taxRate: z.number(),
          shipping: z.number(),
          shippingMethod: z.string(),
          discount: z.number(),
          discountCode: z.string().optional(),
          total: z.number(),
        })
        .optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreatePaymentIntentSchema.parse(body)

    const { customer, shippingAddress, order } = validatedData

    // Get cart items (in a real app, this would come from session/database)
    // For now, we'll use the order data passed in
    const cartItems = order?.items || []
    const totals = order?.totals

    if (!totals || !cartItems.length) {
      return NextResponse.json(
        { error: 'Invalid order data. Cart is empty or totals are missing.' },
        { status: 400 }
      )
    }

    // Validate inventory availability
    const inventoryValidation = await validateOrderInventory(cartItems)
    if (!inventoryValidation.valid) {
      return NextResponse.json(
        { error: 'Inventory validation failed', details: inventoryValidation.errors },
        { status: 400 }
      )
    }

    // Create or get Stripe customer
    let stripeCustomer
    try {
      stripeCustomer = await createCustomer({
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        address: {
          line1: shippingAddress.addressLine1,
          line2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
        metadata: {
          source: 'two-phase-cooling-checkout',
        },
      })
    } catch (error) {
      console.error('Failed to create Stripe customer:', error)
      // Continue without customer - Stripe can handle guest payments
    }

    // Create order record
    const newOrder = await createOrder({
      customer,
      shippingAddress,
      items: cartItems,
      totals,
      stripeCustomerId: stripeCustomer?.id,
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        source: 'checkout',
      },
    })

    // Reserve inventory
    await reserveInventory(newOrder.items)

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent({
      amount: Math.round(totals.total * 100), // Convert to cents
      currency: 'usd',
      customerId: stripeCustomer?.id,
      description: `Two-Phase Cooling Order #${newOrder.orderNumber}`,
      metadata: {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerEmail: customer.email,
      },
      shippingAddress: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        address: {
          line1: shippingAddress.addressLine1,
          line2: shippingAddress.addressLine2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
      },
    })

    // Update order with payment intent ID
    newOrder.paymentIntentId = paymentIntent.id

    console.log(`Payment intent created for order ${newOrder.orderNumber}: ${paymentIntent.id}`)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
    })
  } catch (error) {
    console.error('Create payment intent error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Stripe-specific errors
    if (error.type && error.type.startsWith('Stripe')) {
      const stripeError = handleStripeError(error)
      return NextResponse.json({ error: stripeError.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent. Please try again.' },
      { status: 500 }
    )
  }
}
