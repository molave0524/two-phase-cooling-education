/**
 * Cart API Routes
 * GET - Get cart by session/user
 * POST - Create/Update cart
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, carts, cartItems } from '@/db'
import { eq, and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

// Helper to get or create session ID
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('cart_session_id')?.value

  if (!sessionId) {
    sessionId = randomUUID()
  }

  return sessionId
}

// GET /api/cart - Get current cart
export async function GET() {
  try {
    const sessionId = await getSessionId()

    // Find cart by session (guest) or user (authenticated)
    const cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
      with: {
        items: true,
      },
    })

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 })
    }

    return NextResponse.json(cart)
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

// POST /api/cart - Add/Update cart item
export async function POST(request: NextRequest) {
  try {
    const sessionId = await getSessionId()
    const body = await request.json()

    const { productId, productName, productImage, variantId, variantName, quantity, price } = body

    // Validation
    if (!productId || !productName || !productImage || quantity < 1 || !price) {
      return NextResponse.json({ error: 'Invalid cart item data' }, { status: 400 })
    }

    // Find or create cart
    let cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    })

    if (!cart) {
      const now = new Date()
      const [newCart] = await db
        .insert(carts)
        .values({
          sessionId,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      cart = newCart
    }

    // Check if item already exists in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
        variantId ? eq(cartItems.variantId, variantId) : eq(cartItems.variantId, null)
      ),
    })

    if (existingItem) {
      // Update quantity
      await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
    } else {
      // Insert new item
      const now = new Date()
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        productName,
        productImage,
        variantId: variantId || null,
        variantName: variantName || null,
        quantity,
        price,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Update cart timestamp
    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id))

    // Set session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('cart_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}
