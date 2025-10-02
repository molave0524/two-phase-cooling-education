import { NextRequest } from 'next/server'
import { updatePaymentStatus, getOrder } from '@/lib/orders'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiInternalError,
  apiValidationError,
  ERROR_CODES,
} from '@/lib/api-response'

const UpdatePaymentSchema = z.object({
  orderId: z.string().uuid(),
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

    // TODO: Send confirmation email when payment succeeds
    if (status === 'succeeded') {
      logger.info('Payment confirmed - email notification should be sent', {
        orderNumber: updatedOrder.orderNumber,
      })
      // This would trigger email notification in a real implementation
    }

    return apiSuccess({
      order: updatedOrder,
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

    const order = await getOrder(orderId)
    if (!order) {
      return apiNotFound('Order')
    }

    return apiSuccess({ order })
  } catch (error) {
    logger.error('Failed to retrieve order', error)
    return apiInternalError('Failed to retrieve order', { error })
  }
}
