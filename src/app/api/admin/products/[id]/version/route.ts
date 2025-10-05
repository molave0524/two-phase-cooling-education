/**
 * Product Versioning API
 * POST /api/admin/products/:id/version - Create new version of product
 */

import { NextRequest, NextResponse } from 'next/server'
import { createProductVersion, isProductInOrders } from '@/services/product-versioning'

/**
 * POST /api/admin/products/:id/version
 * Create new version of product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const productId = params.id

    const inOrders = await isProductInOrders(productId)

    if (!inOrders) {
      return NextResponse.json(
        { error: 'Product has no orders. Modify directly instead of versioning.' },
        { status: 400 }
      )
    }

    const newProduct = await createProductVersion(productId, body)

    return NextResponse.json({
      message: 'New product version created successfully',
      product: newProduct
    }, { status: 201 })
  } catch (error) {
    console.error('Version creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product version' },
      { status: 500 }
    )
  }
}
