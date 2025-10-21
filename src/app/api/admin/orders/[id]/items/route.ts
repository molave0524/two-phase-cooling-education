/**
 * Admin Order Items API
 * GET /api/admin/orders/[id]/items - Get order items
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orderItems } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    await requireAdmin()

    const orderId = parseInt(params.id)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: { message: 'Invalid order ID' } }, { status: 400 })
    }

    // Fetch order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))

    return NextResponse.json({
      success: true,
      items,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching order items:', error)

    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: { message: 'Admin access required' } }, { status: 403 })
    }

    return NextResponse.json({ error: { message: 'Failed to fetch order items' } }, { status: 500 })
  }
}
