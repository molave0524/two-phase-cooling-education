/**
 * Link Orders API
 * POST - Manually link guest orders to authenticated user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orders } from '@/db/schema-pg'
import { sql } from 'drizzle-orm'

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find guest orders with matching email and link them to the user
  const linkedOrders = await (db as any)
    .update(orders)
    .set({ userId: parseInt(session.user.id) })
    .where(
      sql`${orders.userId} IS NULL AND (${orders.customer}->>'email')::text = ${session.user.email.toLowerCase()}`
    )
    .returning()

  return NextResponse.json({
    message: `Linked ${linkedOrders.length} order(s) to your account`,
    count: linkedOrders.length,
    orders: linkedOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      createdAt: order.createdAt,
    })),
  })
}
