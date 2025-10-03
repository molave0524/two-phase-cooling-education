/**
 * Single Address Management API
 * PATCH - Update address
 * DELETE - Delete address
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { addresses } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const addressUpdateSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']).optional(),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  company: z.string().max(100).optional(),
  address1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(50).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().min(2).max(2).optional(),
  phone: z.string().max(20).optional(),
})

// PATCH - Update address
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const addressId = parseInt(params.id)
  const body = await req.json()
  const validation = addressUpdateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const data = validation.data

  // If setting as default, unset other defaults of the same type
  if (data.isDefault && data.type) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, parseInt(session.user.id)), eq(addresses.type, data.type)))
  }

  const [updatedAddress] = await db
    .update(addresses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, parseInt(session.user.id))))
    .returning()

  if (!updatedAddress) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  return NextResponse.json(updatedAddress)
}

// DELETE - Delete address
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const addressId = parseInt(params.id)

  const [deleted] = await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, parseInt(session.user.id))))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Address deleted successfully' })
}
