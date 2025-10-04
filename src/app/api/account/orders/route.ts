/**
 * Orders Management API
 * GET - Fetch all user orders with items
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orders, orderItems } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch orders for the user
  const userOrders = await (db as any)
    .select()
    .from(orders)
    .where(eq(orders.userId, parseInt(session.user.id)))
    .orderBy(desc(orders.createdAt))

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    userOrders.map(async order => {
      const items = await (db as any)
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))

      return {
        ...order,
        items,
      }
    })
  )

  return NextResponse.json(ordersWithItems)
}
