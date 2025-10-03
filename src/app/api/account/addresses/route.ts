/**
 * Address Management API
 * GET - Fetch all user addresses
 * POST - Create new address
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { addresses } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']),
  isDefault: z.boolean().optional().default(false),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  company: z.string().max(100).optional(),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(2).default('US'),
  phone: z.string().max(20).optional(),
})

// GET - Fetch all addresses
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, parseInt(session.user.id)))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt))

  return NextResponse.json(userAddresses)
}

// POST - Create new address
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validation = addressSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const data = validation.data

  // If setting as default, unset other defaults of the same type
  if (data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, parseInt(session.user.id)), eq(addresses.type, data.type)))
  }

  const [newAddress] = await db
    .insert(addresses)
    .values({
      userId: parseInt(session.user.id),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return NextResponse.json(newAddress, { status: 201 })
}
