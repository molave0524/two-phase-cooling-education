import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentStatus, getOrder } from '@/lib/orders'
import { z } from 'zod'
import { logger } from '@/lib/logger'

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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify payment intent matches
    if (existingOrder.paymentIntentId !== paymentIntentId) {
      logger.error('Payment intent mismatch', undefined, {
        orderId,
        expected: existingOrder.paymentIntentId,
        received: paymentIntentId,
      })
      return NextResponse.json({ error: 'Payment intent mismatch' }, { status: 400 })
    }

    // Update payment status
    const updatedOrder = await updatePaymentStatus(orderId, status)
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order payment status' }, { status: 500 })
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

    return NextResponse.json({
      order: updatedOrder,
      message: 'Payment status updated successfully',
    })
  } catch (error) {
    logger.error('Failed to update payment status', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update payment status. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await getOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    logger.error('Failed to retrieve order', error)
    return NextResponse.json({ error: 'Failed to retrieve order' }, { status: 500 })
  }
}
