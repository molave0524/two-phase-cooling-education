/**
 * Cart Item API Routes
 * PUT - Update cart item quantity
 * DELETE - Remove cart item
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, cartItems } from '@/db'
import { eq } from 'drizzle-orm'

// PUT /api/cart/[itemId] - Update item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, parseInt(itemId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart item UPDATE error:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE /api/cart/[itemId] - Remove item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params

    await db.delete(cartItems).where(eq(cartItems.id, parseInt(itemId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart item DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
  }
}
