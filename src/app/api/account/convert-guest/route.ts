/**
 * Guest Conversion API
 * POST - Convert guest user to registered account with order linking
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, orders } from '@/db/schema-pg'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, validatePassword } from '@/lib/password'

const convertGuestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = convertGuestSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { email, password, name } = validation.data

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: 'Invalid password', details: passwordValidation.errors },
      { status: 400 }
    )
  }

  // Check if user already exists
  const [existingUser] = await (db as any)
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (existingUser) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const [newUser] = await (db as any)
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      hashedPassword,
      emailVerified: new Date(), // Auto-verify since they used this email for order
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  // Link guest orders to new user account
  const linkedOrders = await (db as any)
    .update(orders)
    .set({ userId: newUser.id })
    .where(
      sql`${orders.userId} IS NULL AND (${orders.customer}->>'email')::text = ${email.toLowerCase()}`
    )
    .returning()

  return NextResponse.json({
    message: 'Account created successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
    ordersLinked: linkedOrders.length,
  })
}
