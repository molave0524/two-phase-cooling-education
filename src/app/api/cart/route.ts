import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabaseClient } from '@/lib/database/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(1).max(99),
  customOptions: z.record(z.any()).optional()
})

const AddToCartSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(CartItemSchema).min(1).max(20)
})

const UpdateCartSchema = z.object({
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().min(0).max(99) // 0 means remove item
})

const SyncCartSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1).max(99),
    customOptions: z.record(z.any()).optional()
  }))
})

// ============================================================================
// CART SERVICE FUNCTIONS
// ============================================================================

async function getCartItems(userId: string) {
  const db = getDatabaseClient()

  const cartItems = await db.cartItems.findMany({
    where: { user_id: userId },
    include: {
      product: true
    },
    orderBy: { created_at: 'desc' }
  })

  return cartItems.map(item => ({
    id: item.id,
    product: item.product,
    quantity: item.quantity,
    customOptions: item.custom_options as Record<string, any> || {},
    addedAt: item.created_at,
    updatedAt: item.updated_at
  }))
}

async function addItemToCart(userId: string, productId: string, quantity: number, customOptions?: Record<string, any>) {
  const db = getDatabaseClient()

  // Check if product exists and is available
  const product = await db.products.findUnique({
    where: { id: productId }
  })

  if (!product) {
    throw new Error('Product not found')
  }

  if (!product.is_active) {
    throw new Error('Product is not available')
  }

  if (product.stock_quantity < quantity) {
    throw new Error('Insufficient stock')
  }

  // Check if item already exists in cart
  const existingItem = await db.cartItems.findFirst({
    where: {
      user_id: userId,
      product_id: productId,
      custom_options: customOptions ? JSON.stringify(customOptions) : null
    }
  })

  if (existingItem) {
    // Update existing item
    const newQuantity = existingItem.quantity + quantity
    if (newQuantity > product.stock_quantity) {
      throw new Error('Total quantity exceeds available stock')
    }

    const updatedItem = await db.cartItems.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        updated_at: new Date()
      },
      include: { product: true }
    })

    return {
      id: updatedItem.id,
      product: updatedItem.product,
      quantity: updatedItem.quantity,
      customOptions: updatedItem.custom_options as Record<string, any> || {},
      addedAt: updatedItem.created_at,
      updatedAt: updatedItem.updated_at
    }
  } else {
    // Create new item
    const newItem = await db.cartItems.create({
      data: {
        user_id: userId,
        product_id: productId,
        quantity,
        custom_options: customOptions ? JSON.stringify(customOptions) : null
      },
      include: { product: true }
    })

    return {
      id: newItem.id,
      product: newItem.product,
      quantity: newItem.quantity,
      customOptions: newItem.custom_options as Record<string, any> || {},
      addedAt: newItem.created_at,
      updatedAt: newItem.updated_at
    }
  }
}

async function updateCartItem(userId: string, productId: string, quantity: number) {
  const db = getDatabaseClient()

  if (quantity === 0) {
    // Remove item from cart
    await db.cartItems.deleteMany({
      where: {
        user_id: userId,
        product_id: productId
      }
    })
    return null
  }

  // Check stock availability
  const product = await db.products.findUnique({
    where: { id: productId }
  })

  if (!product) {
    throw new Error('Product not found')
  }

  if (product.stock_quantity < quantity) {
    throw new Error('Insufficient stock')
  }

  // Update quantity
  const updatedItem = await db.cartItems.updateMany({
    where: {
      user_id: userId,
      product_id: productId
    },
    data: {
      quantity,
      updated_at: new Date()
    }
  })

  if (updatedItem.count === 0) {
    throw new Error('Item not found in cart')
  }

  // Return updated cart items
  return await getCartItems(userId)
}

async function clearCart(userId: string) {
  const db = getDatabaseClient()

  await db.cartItems.deleteMany({
    where: { user_id: userId }
  })
}

async function syncCart(userId: string, items: Array<{productId: string, quantity: number, customOptions?: Record<string, any>}>) {
  const db = getDatabaseClient()

  await db.$transaction(async (tx) => {
    // Clear existing cart
    await tx.cartItems.deleteMany({
      where: { user_id: userId }
    })

    // Add new items
    for (const item of items) {
      const product = await tx.products.findUnique({
        where: { id: item.productId }
      })

      if (product && product.is_active && product.stock_quantity >= item.quantity) {
        await tx.cartItems.create({
          data: {
            user_id: userId,
            product_id: item.productId,
            quantity: item.quantity,
            custom_options: item.customOptions ? JSON.stringify(item.customOptions) : null
          }
        })
      }
    }
  })
}

// ============================================================================
// GET - Retrieve cart contents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Validate userId format
    const userIdValidation = z.string().uuid().safeParse(userId)
    if (!userIdValidation.success) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 }
      )
    }

    const items = await getCartItems(userId)

    // Calculate cart summary
    const subtotal = items.reduce((total, item) => total + (item.product.price_cents * item.quantity), 0)
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)

    // Calculate tax (simplified - 8.5%)
    const tax = Math.round(subtotal * 0.085)

    // Calculate shipping (free over $500, otherwise $15)
    const shipping = subtotal >= 50000 ? 0 : 1500

    const total = subtotal + tax + shipping

    return NextResponse.json({
      items,
      summary: {
        subtotal: subtotal / 100,
        tax: tax / 100,
        shipping: shipping / 100,
        total: total / 100,
        itemCount,
        currency: 'USD'
      }
    })

  } catch (error) {
    console.error('Error retrieving cart:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cart' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Add items to cart
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle single item add (legacy format)
    if (body.productId && body.userId) {
      const singleItemValidation = z.object({
        userId: z.string().uuid(),
        productId: z.string().uuid(),
        quantity: z.number().min(1).max(99).default(1),
        customOptions: z.record(z.any()).optional()
      }).safeParse(body)

      if (!singleItemValidation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: singleItemValidation.error.issues },
          { status: 400 }
        )
      }

      const { userId, productId, quantity, customOptions } = singleItemValidation.data

      const addedItem = await addItemToCart(userId, productId, quantity, customOptions)

      return NextResponse.json({
        success: true,
        item: addedItem,
        message: 'Item added to cart successfully'
      })
    }

    // Handle batch add
    const validation = AddToCartSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { userId, items } = validation.data
    const addedItems = []

    for (const item of items) {
      try {
        const addedItem = await addItemToCart(userId, item.productId, item.quantity, item.customOptions)
        addedItems.push(addedItem)
      } catch (error) {
        console.error(`Error adding item ${item.productId}:`, error)
        // Continue with other items
      }
    }

    return NextResponse.json({
      success: true,
      addedItems,
      message: `${addedItems.length} items added to cart successfully`
    })

  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add items to cart' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update cart item or sync entire cart
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a sync operation
    if (body.items && Array.isArray(body.items)) {
      const validation = SyncCartSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid sync data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { userId, items } = validation.data
      await syncCart(userId, items)

      const updatedCart = await getCartItems(userId)

      return NextResponse.json({
        success: true,
        items: updatedCart,
        message: 'Cart synchronized successfully'
      })
    }

    // Handle single item update
    const validation = UpdateCartSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { userId, productId, quantity } = validation.data

    const updatedCart = await updateCartItem(userId, productId, quantity)

    return NextResponse.json({
      success: true,
      items: updatedCart,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully'
    })

  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Clear cart
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Validate userId format
    const userIdValidation = z.string().uuid().safeParse(userId)
    if (!userIdValidation.success) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 }
      )
    }

    await clearCart(userId)

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}