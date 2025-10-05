/**
 * Individual Product API
 * GET    /api/admin/products/:id - Get product details
 * PATCH  /api/admin/products/:id - Update product
 * DELETE /api/admin/products/:id - Delete product
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { isProductInOrders, createProductVersion } from '@/services/product-versioning'

/**
 * GET /api/admin/products/:id
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, params.id),
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    // console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is in orders
    const inOrders = await isProductInOrders(productId)

    if (inOrders) {
      // Product has orders - create new version
      const newProduct = await createProductVersion(productId, {
        updateFields: body,
      })

      return NextResponse.json({
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

      return NextResponse.json({
        message: 'Product updated successfully',
        versioned: false,
        product: updatedProduct,
      })
    }
  } catch (error) {
    // console.error('Product update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: 'Cannot delete product that exists in orders. Use sunset instead.' },
        { status: 400 }
      )
    }

    await db.delete(products).where(eq(products.id, productId))

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    // console.error('Product delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    )
  }
}
