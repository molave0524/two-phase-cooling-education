/**
 * Single Address Management API
 * PATCH - Update address
 * DELETE - Delete address
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { addresses } from '@/db/schema-pg'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiError,
  apiInternalError,
  ERROR_CODES,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

const addressUpdateSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']).optional(),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  company: z.string().max(100).optional().nullable(),
  address1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(50).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().min(2).max(50).optional(),
  phone: z.string().max(20).optional().nullable(),
})

// PATCH - Update address
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    // Validate address ID
    const addressId = parseInt(params.id, 10)
    if (isNaN(addressId)) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Invalid address ID', { status: 400 })
    }

    const body = await req.json()
    const validation = addressUpdateSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const data = validation.data

    // If setting as default, unset other defaults of the same type
    if (data.isDefault && data.type) {
      await (db as any)
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, session.user.id), eq(addresses.type, data.type)))
    }

    const [updatedAddress] = await (db as any)
      .update(addresses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)))
      .returning()

    if (!updatedAddress) {
      return apiNotFound('Address')
    }

    return apiSuccess(updatedAddress)
  } catch (error) {
    logger.error('Failed to update address', { error, addressId: params.id })
    return apiInternalError('Failed to update address')
  }
}

// DELETE - Delete address
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    // Validate address ID
    const addressId = parseInt(params.id, 10)
    if (isNaN(addressId)) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Invalid address ID', { status: 400 })
    }

    const [deleted] = await (db as any)
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)))
      .returning()

    if (!deleted) {
      return apiNotFound('Address')
    }

    return apiSuccess({ message: 'Address deleted successfully' })
  } catch (error) {
    logger.error('Failed to delete address', { error, addressId: params.id })
    return apiInternalError('Failed to delete address')
  }
}
