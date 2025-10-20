/**
 * Individual Product API
 * GET    /api/admin/products/:id - Get product details
 * PATCH  /api/admin/products/:id - Update product
 * DELETE /api/admin/products/:id - Delete product
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { isProductInOrders, createProductVersion } from '@/services/product-versioning'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiInternalError,
  ERROR_CODES,
  HTTP_STATUS,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/products/:id
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, params.id),
    })

    if (!product) {
      return apiNotFound('Product')
    }

    return apiSuccess(product)
  } catch (error) {
    logger.error('Failed to fetch product', { error, productId: params.id })
    return apiInternalError('Failed to fetch product')
  }
}

/**
 * PATCH /api/admin/products/:id
 * Update product (creates new version if product has orders)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const productId = params.id

    // Check if product exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    })

    if (!existingProduct) {
      return apiNotFound('Product')
    }

    // Check if product is in orders
    const inOrders = await isProductInOrders(productId)

    if (inOrders) {
      // Product has orders - create new version
      const newProduct = await createProductVersion(productId, {
        updateFields: body,
      })

      return apiSuccess({
        message: 'Product has orders. New version created.',
        versioned: true,
        product: newProduct,
      })
    } else {
      // No orders - safe to update directly
      const [updatedProduct] = await db
        .update(products)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning()

      return apiSuccess({
        message: 'Product updated successfully',
        versioned: false,
        product: updatedProduct,
      })
    }
  } catch (error) {
    logger.error('Failed to update product', { error, productId: params.id })
    return apiInternalError('Failed to update product')
  }
}

/**
 * DELETE /api/admin/products/:id
 * Delete product (only if not in orders)
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    // Check if product is in orders
    const inOrders = await isProductInOrders(productId)

    if (inOrders) {
      return apiError(
        ERROR_CODES.INVALID_INPUT,
        'Cannot delete product that exists in orders. Use sunset instead.',
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    await db.delete(products).where(eq(products.id, productId))

    return apiSuccess({ message: 'Product deleted successfully' })
  } catch (error) {
    logger.error('Failed to delete product', { error, productId: params.id })
    return apiInternalError('Failed to delete product')
  }
}
