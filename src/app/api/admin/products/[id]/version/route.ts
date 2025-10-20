/**
 * Product Versioning API
 * POST /api/admin/products/:id/version - Create new version of product
 */

import { NextRequest } from 'next/server'
import { createProductVersion, isProductInOrders } from '@/services/product-versioning'
import { apiSuccess, apiError, apiInternalError, ERROR_CODES } from '@/lib/api-response'
import { logger } from '@/lib/logger'

/**
 * POST /api/admin/products/:id/version
 * Create new version of product
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const productId = params.id

    const inOrders = await isProductInOrders(productId)

    if (!inOrders) {
      return apiError(
        ERROR_CODES.INVALID_INPUT,
        'Product has no orders. Modify directly instead of versioning.',
        { status: 400 }
      )
    }

    const newProduct = await createProductVersion(productId, body)

    logger.info('Product version created', {
      productId,
      newProductId: newProduct.id,
    })

    return apiSuccess(
      {
        message: 'New product version created successfully',
        product: newProduct,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Product version creation failed', error, { productId: params.id })
    return apiInternalError('Failed to create product version', { error })
  }
}
