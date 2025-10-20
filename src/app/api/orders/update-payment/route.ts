import { NextRequest } from 'next/server'
import { updatePaymentStatus, getOrder } from '@/lib/orders'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateOrderToken } from '@/lib/order-token'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiInternalError,
  apiValidationError,
  ERROR_CODES,
} from '@/lib/api-response'
import { getReservationByPaymentIntent, completeReservation, incrementStock } from '@/lib/inventory'

const UpdatePaymentSchema = z.object({
  orderId: z.union([z.string(), z.number()]).transform(String),
  paymentIntentId: z.string(),
  status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentIntentId, status } = UpdatePaymentSchema.parse(body)

    // Get the order to verify it exists
    const existingOrder = await getOrder(orderId)
    if (!existingOrder) {
      return apiNotFound('Order')
    }

    // Verify payment intent matches
    if (existingOrder.paymentIntentId !== paymentIntentId) {
      logger.error('Payment intent mismatch', undefined, {
        orderId,
        expected: existingOrder.paymentIntentId,
        received: paymentIntentId,
      })
      return apiError(ERROR_CODES.INVALID_INPUT, 'Payment intent mismatch', { status: 400 })
    }

    // Update payment status
    const updatedOrder = await updatePaymentStatus(orderId, status)
    if (!updatedOrder) {
      return apiInternalError('Failed to update order payment status')
    }

    logger.info('Order payment status updated', {
      orderNumber: updatedOrder.orderNumber,
      status,
    })

    // Generate access token for order confirmation page
    let customerData
    try {
      customerData =
        typeof updatedOrder.customer === 'string'
          ? JSON.parse(updatedOrder.customer)
          : updatedOrder.customer
    } catch (error) {
      logger.error('Failed to parse customer data for order token', {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return apiInternalError('Failed to generate order access token')
    }
    const accessToken = generateOrderToken(updatedOrder.id, customerData.email)

    // Handle payment success - complete reservation and decrement stock
    if (status === 'succeeded') {
      logger.info('Payment confirmed', {
        orderNumber: updatedOrder.orderNumber,
        paymentIntentId,
      })

      // Find and complete the inventory reservation
      const reservationId = await getReservationByPaymentIntent(paymentIntentId)
      if (reservationId) {
        const result = await completeReservation(reservationId)
        if (result.success) {
          logger.info('Inventory reservation completed and stock decremented', {
            orderNumber: updatedOrder.orderNumber,
            reservationId,
          })
        } else {
          logger.error('Failed to complete inventory reservation', {
            orderNumber: updatedOrder.orderNumber,
            reservationId,
            error: result.message,
          })
        }
      } else {
        logger.warn('No reservation found for payment intent', {
          orderNumber: updatedOrder.orderNumber,
          paymentIntentId,
        })
      }

      // TODO: Send confirmation email when payment succeeds
      // This would trigger email notification in a real implementation
    }

    // Handle payment refunds/cancellations - restore stock
    if (status === 'refunded' || status === 'failed') {
      logger.info('Payment refunded or failed - restoring stock', {
        orderNumber: updatedOrder.orderNumber,
        status,
      })

      // Restore stock for all items in the order
      for (const item of updatedOrder.items) {
        const restored = await incrementStock(item.productId, item.quantity)
        if (restored) {
          logger.info('Stock restored for cancelled/refunded order', {
            orderNumber: updatedOrder.orderNumber,
            productId: item.productId,
            quantity: item.quantity,
          })
        } else {
          logger.error('Failed to restore stock for cancelled/refunded order', {
            orderNumber: updatedOrder.orderNumber,
            productId: item.productId,
            quantity: item.quantity,
          })
        }
      }
    }

    return apiSuccess({
      order: updatedOrder,
      accessToken,
      message: 'Payment status updated successfully',
    })
  } catch (error) {
    logger.error('Failed to update payment status', error)

    if (error instanceof z.ZodError) {
      return apiValidationError(error)
    }

    return apiInternalError('Failed to update payment status. Please try again.', { error })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Order ID is required', { status: 400 })
    }

    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      logger.warn('Unauthorized order access attempt - not authenticated', {
        orderId,
      })
      return apiError(ERROR_CODES.UNAUTHORIZED, 'Please log in to view this order.', {
        status: 401,
      })
    }

    const order = await getOrder(orderId)
    if (!order) {
      return apiNotFound('Order')
    }

    // Parse customer data to get email
    let customerData
    try {
      customerData =
        typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer
    } catch (error) {
      logger.error('Failed to parse customer data for authorization check', {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return apiInternalError('Failed to verify order access')
    }

    // Allow access if:
    // 1. User is authenticated AND their email matches the order's customer email
    // 2. User is an admin (if you have admin role implemented)
    const isCustomer = session.user.email === customerData.email
    const isAdmin = (session.user as any)?.role === 'admin' // Type assertion for optional role field

    if (!isCustomer && !isAdmin) {
      logger.warn('Unauthorized order access attempt - wrong user', {
        orderId,
        attemptedBy: session.user.email,
        orderEmail: customerData.email,
      })
      return apiError(ERROR_CODES.UNAUTHORIZED, 'You do not have permission to view this order.', {
        status: 403,
      })
    }

    return apiSuccess({ order })
  } catch (error) {
    logger.error('Failed to retrieve order', error)
    return apiInternalError('Failed to retrieve order', { error })
  }
}
