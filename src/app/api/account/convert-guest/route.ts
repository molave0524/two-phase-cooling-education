/**
 * Guest Conversion API
 * POST - Convert guest user to registered account with order linking
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users, orders } from '@/db/schema-pg'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, validatePassword } from '@/lib/password'
import {
  apiSuccess,
  apiValidationError,
  apiConflict,
  apiError,
  apiInternalError,
  ERROR_CODES,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

const convertGuestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = convertGuestSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const { email, password, name } = validation.data

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, 'Invalid password', {
        status: 400,
        details: passwordValidation.errors,
      })
    }

    // Check if user already exists
    const [existingUser] = await (db as any)
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existingUser) {
      return apiConflict('Email already registered')
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

    logger.info('Guest user converted to registered account', {
      userId: newUser.id,
      email: newUser.email,
      ordersLinked: linkedOrders.length,
    })

    return apiSuccess({
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      ordersLinked: linkedOrders.length,
    })
  } catch (error) {
    logger.error('Failed to convert guest to user', { error })
    return apiInternalError('Failed to create account')
  }
}
