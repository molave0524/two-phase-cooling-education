/**
 * Link Orders API
 * POST - Manually link guest orders to authenticated user account
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orders } from '@/db/schema-pg'
import { sql } from 'drizzle-orm'
import { apiSuccess, apiUnauthorized, apiInternalError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.email) {
      return apiUnauthorized()
    }

    // Find guest orders with matching email and link them to the user
    const linkedOrders = await (db as any)
      .update(orders)
      .set({ userId: session.user.id })
      .where(
        sql`${orders.userId} IS NULL AND (${orders.customer}->>'email')::text = ${session.user.email.toLowerCase()}`
      )
      .returning()

    logger.info('Linked guest orders to user account', {
      userId: session.user.id,
      email: session.user.email,
      count: linkedOrders.length,
    })

    return apiSuccess({
      message: `Linked ${linkedOrders.length} order(s) to your account`,
      count: linkedOrders.length,
      orders: linkedOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        createdAt: order.createdAt,
      })),
    })
  } catch (error) {
    logger.error('Failed to link orders', { error, userId: _req.headers.get('user-id') })
    return apiInternalError('Failed to link orders to account')
  }
}
