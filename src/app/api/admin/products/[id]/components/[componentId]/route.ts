/**
 * Individual Component Relationship API
 * PATCH  /api/admin/products/:id/components/:componentId - Update component relationship
 * DELETE /api/admin/products/:id/components/:componentId - Remove component
 */

import { NextRequest, NextResponse } from 'next/server'
import { removeComponent, updateComponent } from '@/services/component-management'

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

    return NextResponse.json(updated)
  } catch (error) {
    // console.error('Component update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update component' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/admin/products/:id/components/:componentId
 * Remove component from product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; componentId: string } }
) {
  try {
    await removeComponent(params.id, params.componentId)

    return NextResponse.json({ message: 'Component removed successfully' })
  } catch (error) {
    // console.error('Component remove error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove component' },
      { status: 500 }
    )
  }
}
