/**
 * Address Management API
 * GET - Fetch all user addresses
 * POST - Create new address
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { addresses } from '@/db/schema-pg'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  HTTP_STATUS,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

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
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    const userAddresses = await (db as any)
      .select()
      .from(addresses)
      .where(eq(addresses.userId, session.user.id))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt))

    return apiSuccess(userAddresses)
  } catch (error) {
    logger.error('Failed to fetch addresses', { error, userId: _req.headers.get('user-id') })
    return apiInternalError('Failed to load addresses')
  }
}

// POST - Create new address
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    const body = await req.json()
    const validation = addressSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const data = validation.data

    // If setting as default, unset other defaults of the same type
    if (data.isDefault) {
      await (db as any)
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, session.user.id), eq(addresses.type, data.type)))
    }

    const [newAddress] = await (db as any)
      .insert(addresses)
      .values({
        userId: session.user.id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return apiSuccess(newAddress, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    logger.error('Failed to create address', { error, userId: req.headers.get('user-id') })
    return apiInternalError('Failed to create address')
  }
}
