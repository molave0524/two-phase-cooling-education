/**
 * Product Sunset/Discontinue API
 * POST /api/admin/products/:id/sunset - Sunset product
 * POST /api/admin/products/:id/discontinue - Discontinue product
 */

import { NextRequest } from 'next/server'
import { sunsetProduct } from '@/services/product-versioning'
import {
  apiSuccess,
  apiError,
  apiInternalError,
  ERROR_CODES,
  HTTP_STATUS,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

/**
 * POST /api/admin/products/:id/sunset
 * Sunset product (make unavailable for purchase)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { reason, replacementProductId } = body

    if (!reason) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Reason is required', {
        status: HTTP_STATUS.BAD_REQUEST,
      })
    }

    await sunsetProduct(params.id, reason, replacementProductId)

    return apiSuccess({
      message: 'Product sunset successfully',
    })
  } catch (error) {
    logger.error('Failed to sunset product', { error, productId: params.id })
    return apiInternalError('Failed to sunset product')
  }
}
