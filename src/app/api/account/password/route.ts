/**
 * Password Management API
 * PATCH - Update user password
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, verifyPassword, validatePassword } from '@/lib/password'
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

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    const body = await req.json()
    const validation = passwordSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const { currentPassword, newPassword } = validation.data

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, 'Invalid password', {
        status: 400,
        details: passwordValidation.errors,
      })
    }

    // Get user
    const [user] = await (db as any)
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return apiNotFound('User')
    }

    // If user has a password, verify current password
    if (user.hashedPassword) {
      if (!currentPassword) {
        return apiError(ERROR_CODES.VALIDATION_ERROR, 'Current password required', {
          status: 400,
        })
      }

      const isValid = await verifyPassword(currentPassword, user.hashedPassword)
      if (!isValid) {
        return apiUnauthorized('Current password is incorrect')
      }
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword)

    await (db as any)
      .update(users)
      .set({
        hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return apiSuccess({
      message: 'Password updated successfully',
    })
  } catch (error) {
    logger.error('Failed to update password', { error, userId: req.headers.get('user-id') })
    return apiInternalError('Failed to update password')
  }
}
