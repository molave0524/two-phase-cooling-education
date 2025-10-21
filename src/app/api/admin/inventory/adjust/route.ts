/**
 * Admin Inventory Adjustment API
 * Allows admins to manually adjust product stock levels
 */

import { NextRequest } from 'next/server'
import { db, products } from '@/db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin'
import { apiSuccess, apiError, ERROR_CODES } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

interface AdjustStockRequest {
  productId: string
  newStockQuantity: number
  lowStockThreshold: number
  adjustmentType: 'set' | 'add' | 'subtract'
  quantity: number
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAdmin()

    // Parse request body
    const body: AdjustStockRequest = await request.json()
    const { productId, newStockQuantity, lowStockThreshold, adjustmentType, quantity, reason } =
      body

    // Validate input
    if (!productId) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, 'Product ID is required')
    }

    if (newStockQuantity < 0) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, 'Stock quantity cannot be negative')
    }

    if (lowStockThreshold < 0) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, 'Low stock threshold cannot be negative')
    }

    // Get the product
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)

    if (!product) {
      return apiError(ERROR_CODES.NOT_FOUND, 'Product not found', { status: 404 })
    }

    const oldStockQuantity = product.stockQuantity

    // Update the product stock
    await db
      .update(products)
      .set({
        stockQuantity: newStockQuantity,
        lowStockThreshold,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))

    logger.info('Stock adjusted by admin', {
      admin: session.user.email,
      productId,
      productSku: product.sku,
      adjustmentType,
      quantity,
      oldStockQuantity,
      newStockQuantity,
      lowStockThreshold,
      reason,
    })

    return apiSuccess({
      message: 'Stock adjusted successfully',
      product: {
        id: productId,
        sku: product.sku,
        name: product.name,
      },
      adjustment: {
        type: adjustmentType,
        quantity,
        oldStockQuantity,
        newStockQuantity,
        lowStockThreshold,
        reason,
        adjustedBy: session.user.email,
        adjustedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return apiError(ERROR_CODES.FORBIDDEN, 'Admin access required', { status: 403 })
    }

    logger.error('Failed to adjust stock', { error })
    return apiError(ERROR_CODES.INTERNAL_ERROR, 'Failed to adjust stock', { status: 500 })
  }
}
