/**
 * Reset Password API
 * POST - Reset password with token
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema-pg'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, validatePassword } from '@/lib/password'
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiInternalError,
  ERROR_CODES,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const { token, password } = validation.data

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return apiError(ERROR_CODES.VALIDATION_ERROR, 'Invalid password', {
        status: 400,
        details: passwordValidation.errors,
      })
    }

    // Find user with valid reset token
    const [user] = await (db as any)
      .select()
      .from(users)
      .where(and(eq(users.resetPasswordToken, token), gt(users.resetPasswordExpires!, new Date())))
      .limit(1)

    if (!user) {
      return apiError(ERROR_CODES.INVALID_TOKEN, 'Invalid or expired token', { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update password and clear reset token
    await (db as any)
      .update(users)
      .set({
        hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return apiSuccess({
      message: 'Password reset successfully',
    })
  } catch (error) {
    logger.error('Failed to reset password', { error })
    return apiInternalError('Failed to reset password')
  }
}
