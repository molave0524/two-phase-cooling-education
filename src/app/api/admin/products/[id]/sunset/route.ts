/**
 * Product Sunset/Discontinue API
 * POST /api/admin/products/:id/sunset - Sunset product
 * POST /api/admin/products/:id/discontinue - Discontinue product
 */

import { NextRequest, NextResponse } from 'next/server'
import { sunsetProduct, discontinueProduct } from '@/services/product-versioning'

/**
 * POST /api/admin/products/:id/sunset
 * Sunset product (make unavailable for purchase)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { reason, replacementProductId } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    await sunsetProduct(params.id, reason, replacementProductId)

    return NextResponse.json({
      message: 'Product sunset successfully'
    })
  } catch (error) {
    console.error('Product sunset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sunset product' },
      { status: 500 }
    )
  }
}
