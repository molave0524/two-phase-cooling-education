/**
 * Product Components API
 * GET    /api/admin/products/:id/components - Get product component tree
 * POST   /api/admin/products/:id/components - Add component to product
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  addComponent,
  getComponentTree,
  calculateComponentsPrice,
} from '@/services/component-management'

/**
 * GET /api/admin/products/:id/components
 * Get product component tree
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const includePricing = searchParams.get('pricing') === 'true'

    const tree = await getComponentTree(params.id)

    if (includePricing) {
      const pricing = await calculateComponentsPrice(params.id)
      return NextResponse.json({ tree, pricing })
    }

    return NextResponse.json(tree)
  } catch (error) {
    // console.error('Component tree fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch component tree' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products/:id/components
 * Add component to product
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const {
      componentProductId,
      quantity,
      isRequired,
      isIncluded,
      priceOverride,
      displayName,
      sortOrder,
    } = body

    if (!componentProductId) {
      return NextResponse.json({ error: 'componentProductId is required' }, { status: 400 })
    }

    const component = await addComponent({
      parentProductId: params.id,
      componentProductId,
      quantity,
      isRequired,
      isIncluded,
      priceOverride,
      displayName,
      sortOrder,
    })

    return NextResponse.json(component, { status: 201 })
  } catch (error) {
    // console.error('Component add error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add component' },
      { status: 400 }
    )
  }
}
