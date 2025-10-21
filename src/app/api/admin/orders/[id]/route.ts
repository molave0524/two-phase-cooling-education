/**
 * Admin Order Detail API
 * PATCH /api/admin/orders/[id] - Update order status and details
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orders } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    await requireAdmin()

    const orderId = parseInt(params.id)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: { message: 'Invalid order ID' } }, { status: 400 })
    }

    const body = await request.json()
    const { status, paymentStatus, trackingNumber, shippingCarrier, internalNotes } = body

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (status !== undefined) {
      updateData.status = status

      // Update status timestamps
      if (status === 'shipped' && !updateData.shippedAt) {
        updateData.shippedAt = new Date()
      }
      if (status === 'delivered' && !updateData.deliveredAt) {
        updateData.deliveredAt = new Date()
      }
      if (status === 'cancelled' && !updateData.cancelledAt) {
        updateData.cancelledAt = new Date()
      }
    }

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus

      // Update payment timestamp
      if (paymentStatus === 'paid' && !updateData.paidAt) {
        updateData.paidAt = new Date()
      }
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber
    }

    if (shippingCarrier !== undefined) {
      updateData.shippingCarrier = shippingCarrier
    }

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes
    }

    // Update order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json({ error: { message: 'Order not found' } }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating order:', error)

    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: { message: 'Admin access required' } }, { status: 403 })
    }

    return NextResponse.json({ error: { message: 'Failed to update order' } }, { status: 500 })
  }
}
