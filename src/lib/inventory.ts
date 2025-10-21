/**
 * Inventory Management Utility Functions
 * Handles stock tracking, reservations, and inventory operations
 */

import { db } from '@/db'
import { products, inventoryReservations } from '@/db/schema-pg'
import { eq, and, lt, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

/**
 * Inventory status types
 */
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder'

/**
 * Calculate available quantity for a product (stock - active reservations)
 */
export async function getAvailableQuantity(productId: string): Promise<number> {
  try {
    // Get product stock
    const product = await (db as any)
      .select({ stockQuantity: products.stockQuantity })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)

    if (!product || product.length === 0) {
      throw new Error(`Product ${productId} not found`)
    }

    const stockQuantity = product[0].stockQuantity

    // Calculate total active reservations
    const reservations = await (db as any)
      .select({
        total: sql<number>`COALESCE(SUM(${inventoryReservations.quantity}), 0)`,
      })
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.productId, productId),
          eq(inventoryReservations.status, 'active'),
          sql`${inventoryReservations.expiresAt} > NOW()`
        )
      )

    const reservedQuantity = Number(reservations[0]?.total || 0)

    return Math.max(0, stockQuantity - reservedQuantity)
  } catch (error) {
    logger.error('Failed to calculate available quantity', { error, productId })
    throw error
  }
}

/**
 * Get inventory status for a product
 */
export async function getInventoryStatus(productId: string): Promise<{
  status: InventoryStatus
  availableQuantity: number
  stockQuantity: number
  reservedQuantity: number
  lowStockThreshold: number
}> {
  try {
    const product = await (db as any)
      .select({
        stockQuantity: products.stockQuantity,
        lowStockThreshold: products.lowStockThreshold,
        inStock: products.inStock,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)

    if (!product || product.length === 0) {
      throw new Error(`Product ${productId} not found`)
    }

    const { stockQuantity, lowStockThreshold } = product[0]
    const availableQuantity = await getAvailableQuantity(productId)
    const reservedQuantity = stockQuantity - availableQuantity

    let status: InventoryStatus
    if (availableQuantity <= 0) {
      status = 'backorder' // Allow backorders as per requirements
    } else if (availableQuantity <= lowStockThreshold) {
      status = 'low_stock'
    } else {
      status = 'in_stock'
    }

    return {
      status,
      availableQuantity,
      stockQuantity,
      reservedQuantity,
      lowStockThreshold,
    }
  } catch (error) {
    logger.error('Failed to get inventory status', { error, productId })
    throw error
  }
}

/**
 * Reserve inventory for checkout (15 minute hold)
 */
export async function reserveInventory(params: {
  productId: string
  quantity: number
  reservedBy: string // User ID or session ID
  stripePaymentIntentId?: string
  reservationType?: 'checkout' | 'order' | 'manual'
  expirationMinutes?: number
}): Promise<{ success: boolean; reservationId?: number; message?: string }> {
  const {
    productId,
    quantity,
    reservedBy,
    stripePaymentIntentId,
    reservationType = 'checkout',
    expirationMinutes = 15,
  } = params

  try {
    // Check if enough inventory is available
    const availableQuantity = await getAvailableQuantity(productId)

    // Allow backorders - don't block reservation if insufficient stock
    if (availableQuantity < quantity) {
      logger.warn('Reserving inventory on backorder', {
        productId,
        quantity,
        availableQuantity,
      })
    }

    // Create reservation
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)

    const reservation = await (db as any)
      .insert(inventoryReservations)
      .values({
        productId,
        quantity,
        reservedBy,
        reservationType,
        stripePaymentIntentId,
        expiresAt,
        status: 'active',
      })
      .returning()

    logger.info('Inventory reserved successfully', {
      reservationId: reservation[0].id,
      productId,
      quantity,
      expiresAt,
    })

    return {
      success: true,
      reservationId: reservation[0].id,
      message: availableQuantity < quantity ? 'Reserved on backorder' : 'Reserved successfully',
    }
  } catch (error) {
    logger.error('Failed to reserve inventory', { error, productId, quantity })
    return {
      success: false,
      message: 'Failed to reserve inventory',
    }
  }
}

/**
 * Release/cancel a reservation
 */
export async function releaseReservation(reservationId: number): Promise<boolean> {
  try {
    await (db as any)
      .update(inventoryReservations)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventoryReservations.id, reservationId))

    logger.info('Reservation released', { reservationId })
    return true
  } catch (error) {
    logger.error('Failed to release reservation', { error, reservationId })
    return false
  }
}

/**
 * Complete a reservation and decrement stock (called when order is confirmed)
 */
export async function completeReservation(
  reservationId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    // Get reservation details
    const reservation = await (db as any)
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.id, reservationId))
      .limit(1)

    if (!reservation || reservation.length === 0) {
      return { success: false, message: 'Reservation not found' }
    }

    const { productId, quantity, status } = reservation[0]

    if (status !== 'active') {
      return { success: false, message: `Reservation is ${status}` }
    }

    // Decrement stock quantity
    await (db as any)
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))

    // Mark reservation as completed
    await (db as any)
      .update(inventoryReservations)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventoryReservations.id, reservationId))

    logger.info('Reservation completed and stock decremented', {
      reservationId,
      productId,
      quantity,
    })

    return { success: true }
  } catch (error) {
    logger.error('Failed to complete reservation', { error, reservationId })
    return { success: false, message: 'Failed to complete reservation' }
  }
}

/**
 * Decrement stock without reservation (direct purchase)
 */
export async function decrementStock(productId: string, quantity: number): Promise<boolean> {
  try {
    await (db as any)
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))

    logger.info('Stock decremented', { productId, quantity })
    return true
  } catch (error) {
    logger.error('Failed to decrement stock', { error, productId, quantity })
    return false
  }
}

/**
 * Increment stock (for cancellations/refunds)
 */
export async function incrementStock(productId: string, quantity: number): Promise<boolean> {
  try {
    await (db as any)
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))

    logger.info('Stock incremented', { productId, quantity })
    return true
  } catch (error) {
    logger.error('Failed to increment stock', { error, productId, quantity })
    return false
  }
}

/**
 * Clean up expired reservations
 */
export async function cleanupExpiredReservations(): Promise<number> {
  try {
    const result = await (db as any)
      .update(inventoryReservations)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryReservations.status, 'active'),
          lt(inventoryReservations.expiresAt, new Date())
        )
      )
      .returning({ id: inventoryReservations.id })

    const count = result.length
    logger.info('Cleaned up expired reservations', { count })
    return count
  } catch (error) {
    logger.error('Failed to cleanup expired reservations', { error })
    return 0
  }
}

/**
 * Get reservation by payment intent ID
 */
export async function getReservationByPaymentIntent(
  paymentIntentId: string
): Promise<number | null> {
  try {
    const reservation = await (db as any)
      .select({ id: inventoryReservations.id })
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.stripePaymentIntentId, paymentIntentId),
          eq(inventoryReservations.status, 'active')
        )
      )
      .limit(1)

    return reservation && reservation.length > 0 ? reservation[0].id : null
  } catch (error) {
    logger.error('Failed to get reservation by payment intent', { error, paymentIntentId })
    return null
  }
}

/**
 * Extend reservation expiration (e.g., if payment processing takes longer)
 */
export async function extendReservation(
  reservationId: number,
  additionalMinutes: number
): Promise<boolean> {
  try {
    await (db as any)
      .update(inventoryReservations)
      .set({
        expiresAt: sql`${inventoryReservations.expiresAt} + INTERVAL '${sql.raw(additionalMinutes.toString())} minutes'`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryReservations.id, reservationId))

    logger.info('Reservation extended', { reservationId, additionalMinutes })
    return true
  } catch (error) {
    logger.error('Failed to extend reservation', { error, reservationId })
    return false
  }
}
