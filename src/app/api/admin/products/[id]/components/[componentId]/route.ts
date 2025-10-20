/**
 * Individual Component Relationship API
 * PATCH  /api/admin/products/:id/components/:componentId - Update component relationship
 * DELETE /api/admin/products/:id/components/:componentId - Remove component
 */

import { NextRequest } from 'next/server'
import { removeComponent, updateComponent } from '@/services/component-management'
import { apiSuccess, apiInternalError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/admin/products/:id/components/:componentId
 * Update component relationship properties
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; componentId: string } }
) {
  try {
    const body = await request.json()

    const updated = await updateComponent(params.id, params.componentId, body)

    logger.info('Component relationship updated', {
      productId: params.id,
      componentId: params.componentId,
    })

    return apiSuccess(updated)
  } catch (error) {
    logger.error('Component update failed', error, {
      productId: params.id,
      componentId: params.componentId,
    })
    return apiInternalError('Failed to update component', { error })
  }
}

/**
 * DELETE /api/admin/products/:id/components/:componentId
 * Remove component from product
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; componentId: string } }
) {
  try {
    await removeComponent(params.id, params.componentId)

    logger.info('Component removed from product', {
      productId: params.id,
      componentId: params.componentId,
    })

    return apiSuccess({ message: 'Component removed successfully' })
  } catch (error) {
    logger.error('Component removal failed', error, {
      productId: params.id,
      componentId: params.componentId,
    })
    return apiInternalError('Failed to remove component', { error })
  }
}
