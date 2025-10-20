/**
 * Product Components API
 * GET    /api/admin/products/:id/components - Get product component tree
 * POST   /api/admin/products/:id/components - Add component to product
 */

import { NextRequest } from 'next/server'
import {
  addComponent,
  getComponentTree,
  calculateComponentsPrice,
} from '@/services/component-management'
import {
  apiSuccess,
  apiError,
  apiInternalError,
  ERROR_CODES,
  HTTP_STATUS,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

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
      return apiSuccess({ tree, pricing })
    }

    return apiSuccess(tree)
  } catch (error) {
    logger.error('Failed to fetch component tree', { error, productId: params.id })
    return apiInternalError('Failed to fetch component tree')
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
      return apiError(ERROR_CODES.INVALID_INPUT, 'componentProductId is required', {
        status: HTTP_STATUS.BAD_REQUEST,
      })
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

    return apiSuccess(component, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    logger.error('Failed to add component', { error, productId: params.id })
    return apiInternalError('Failed to add component')
  }
}
