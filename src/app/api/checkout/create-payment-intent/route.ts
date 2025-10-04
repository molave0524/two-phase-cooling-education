import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPaymentIntent, createCustomer, handleStripeError } from '@/lib/stripe'
import { createOrder, validateOrderInventory, reserveInventory } from '@/lib/orders'
import { sanitizeCustomerData, sanitizeAddressData } from '@/lib/sanitize'
import { withRateLimit } from '@/lib/with-rate-limit'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import {
  apiSuccess,
  apiError,
  apiInternalError,
  apiValidationError,
  ERROR_CODES,
} from '@/lib/api-response'
import { db } from '@/db'
import { orders, addresses } from '@/db/schema-pg'
import { eq, and } from 'drizzle-orm'

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

async function handlePOST(request: Request | NextRequest) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions)

    const body = await request.json()
    const validatedData = CreatePaymentIntentSchema.parse(body)

    // Sanitize input data to prevent XSS
    const sanitizedCustomer = sanitizeCustomerData(validatedData.customer)
    const sanitizedAddress = sanitizeAddressData({
      addressLine1: validatedData.shippingAddress.addressLine1,
      addressLine2: validatedData.shippingAddress.addressLine2,
      city: validatedData.shippingAddress.city,
      state: validatedData.shippingAddress.state,
      zipCode: validatedData.shippingAddress.zipCode,
      country: validatedData.shippingAddress.country,
    })

    const customer = sanitizedCustomer
    const shippingAddress = {
      ...sanitizedAddress,
      firstName: validatedData.shippingAddress.firstName,
      lastName: validatedData.shippingAddress.lastName,
      company: validatedData.shippingAddress.company,
      phone: validatedData.shippingAddress.phone,
    }
    const order = validatedData.order

    // Get cart items (in a real app, this would come from session/database)
    // For now, we'll use the order data passed in
    const cartItems = order?.items || []
    const totals = order?.totals

    if (!totals || !cartItems.length) {
      return apiError(
        ERROR_CODES.INVALID_INPUT,
        'Invalid order data. Cart is empty or totals are missing.',
        { status: 400 }
      )
    }

    // Validate inventory availability
    const inventoryValidation = await validateOrderInventory(cartItems)
    if (!inventoryValidation.valid) {
      return apiError(ERROR_CODES.INSUFFICIENT_INVENTORY, 'Inventory validation failed', {
        status: 400,
        details: inventoryValidation.errors,
      })
    }

    // Create or get Stripe customer
    let stripeCustomer
    try {
      stripeCustomer = await createCustomer({
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        ...(customer.phone && { phone: customer.phone }),
        address: {
          line1: shippingAddress.addressLine1,
          ...(shippingAddress.addressLine2 && { line2: shippingAddress.addressLine2 }),
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
      logger.warn('Failed to create Stripe customer, continuing with guest payment', { error })
      // Continue without customer - Stripe can handle guest payments
    }

    // Create order record
    const newOrder = await createOrder({
      userId: session?.user?.id ? parseInt(session.user.id) : undefined,
      customer: {
        ...customer,
        phone: customer.phone || '',
      },
      shippingAddress: {
        ...shippingAddress,
        company: shippingAddress.company || '',
        addressLine2: shippingAddress.addressLine2 || '',
        phone: shippingAddress.phone || '',
      },
      items: cartItems,
      totals: {
        ...totals,
        discountCode: totals.discountCode || '',
      },
      stripeCustomerId: stripeCustomer?.id || '',
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        source: 'checkout',
      },
    })

    // Reserve inventory
    await reserveInventory(newOrder.items)

    // Save shipping address to user's addresses if logged in
    if (session?.user?.id) {
      try {
        // Check if this exact address already exists
        const existingAddresses = await db
          .select()
          .from(addresses)
          .where(
            and(
              eq(addresses.userId, parseInt(session.user.id)),
              eq(addresses.address1, shippingAddress.addressLine1),
              eq(addresses.city, shippingAddress.city),
              eq(addresses.state, shippingAddress.state),
              eq(addresses.postalCode, shippingAddress.zipCode)
            )
          )

        // Only save if address doesn't already exist
        if (existingAddresses.length === 0) {
          await db.insert(addresses).values({
            userId: parseInt(session.user.id),
            type: 'shipping',
            isDefault: false,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            company: shippingAddress.company || null,
            address1: shippingAddress.addressLine1,
            address2: shippingAddress.addressLine2 || null,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.zipCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          logger.info('Saved shipping address for user', { userId: session.user.id })
        }
      } catch (error) {
        // Log error but don't fail the checkout if address save fails
        logger.warn('Failed to save address for user', { userId: session.user.id, error })
      }
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent({
      amount: Math.round(totals.total * 100), // Convert to cents
      currency: 'usd',
      ...(stripeCustomer?.id && { customerId: stripeCustomer.id }),
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
          ...(shippingAddress.addressLine2 && { line2: shippingAddress.addressLine2 }),
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
      },
    })

    // Update order with payment intent ID in the database
    await (db.update as any)(orders)
      .set({ stripePaymentIntentId: paymentIntent.id })
      .where(eq(orders.id, parseInt(newOrder.id, 10)))

    logger.info('Payment intent created', {
      orderNumber: newOrder.orderNumber,
      paymentIntentId: paymentIntent.id,
    })

    return apiSuccess({
      clientSecret: paymentIntent.client_secret,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
    })
  } catch (error) {
    // Log the full error details
    logger.error('Create payment intent error', error)

    if (error instanceof z.ZodError) {
      return apiValidationError(error)
    }

    // Handle Stripe-specific errors
    if (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      typeof error.type === 'string' &&
      error.type.startsWith('Stripe')
    ) {
      const stripeError = handleStripeError(error)
      return apiError(ERROR_CODES.PAYMENT_PROVIDER_ERROR, stripeError.message, {
        status: 400,
        error,
      })
    }

    return apiInternalError('Failed to create payment intent. Please try again.', { error })
  }
}

export const POST = withRateLimit({ id: 'checkout-payment-intent' }, handlePOST)
