/**
 * Orders Management API
 * GET - Fetch all user orders with items
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orders, orderItems } from '@/db/schema-pg'
import { eq, desc } from 'drizzle-orm'
import { apiSuccess, apiUnauthorized, apiInternalError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    // Fetch orders for the user
    const userOrders = await (db as any)
      .select()
      .from(orders)
      .where(eq(orders.userId, session.user.id))
      .orderBy(desc(orders.createdAt))

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order: any) => {
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

    return apiSuccess(ordersWithItems)
  } catch (error) {
    logger.error('Failed to fetch user orders', { error, userId: _req.headers.get('user-id') })
    return apiInternalError('Failed to load orders')
  }
}
