import { NextRequest } from 'next/server'
import { updatePaymentStatus, getOrder } from '@/lib/orders'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { verifyOrderToken, generateOrderToken } from '@/lib/order-token'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiInternalError,
  apiValidationError,
  ERROR_CODES,
} from '@/lib/api-response'

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
    const customerData =
      typeof updatedOrder.customer === 'string'
        ? JSON.parse(updatedOrder.customer)
        : updatedOrder.customer
    const accessToken = generateOrderToken(updatedOrder.id, customerData.email)

    // TODO: Send confirmation email when payment succeeds
    if (status === 'succeeded') {
      logger.info('Payment confirmed - email notification should be sent', {
        orderNumber: updatedOrder.orderNumber,
      })
      // This would trigger email notification in a real implementation
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
    const token = searchParams.get('token')

    if (!orderId) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Order ID is required', { status: 400 })
    }

    const order = await getOrder(orderId)
    if (!order) {
      return apiNotFound('Order')
    }

    // Parse customer data to get email
    const customerData =
      typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer

    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    // Allow access if:
    // 1. Valid access token is provided (for guest checkout)
    // 2. User is authenticated AND their email matches the order's customer email
    // 3. User is an admin (if you have admin role implemented)
    const hasValidToken = token && verifyOrderToken(orderId, customerData.email, token)
    const isCustomer = session?.user?.email === customerData.email
    const isAdmin = (session?.user as any)?.role === 'admin' // Type assertion for optional role field

    if (!hasValidToken && !isCustomer && !isAdmin) {
      logger.warn('Unauthorized order access attempt', {
        orderId,
        attemptedBy: session?.user?.email || 'anonymous',
        orderEmail: customerData.email,
        hasToken: !!token,
      })
      return apiError(ERROR_CODES.UNAUTHORIZED, 'You do not have permission to view this order', {
        status: 403,
      })
    }

    return apiSuccess({ order })
  } catch (error) {
    logger.error('Failed to retrieve order', error)
    return apiInternalError('Failed to retrieve order', { error })
  }
}
