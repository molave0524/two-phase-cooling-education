/**
 * Clear Cart API Route
 * DELETE - Clear all cart items
 */

import { NextResponse } from 'next/server'
import { db, carts, cartItems } from '@/db'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

// DELETE /api/cart/clear - Clear cart
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('cart_session_id')?.value

    if (!sessionId) {
      return NextResponse.json({ success: true })
    }

    // Find cart
    const cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    })

    if (cart) {
      // Delete all cart items
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart CLEAR error:', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}
