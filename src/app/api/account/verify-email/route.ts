/**
 * Email Verification API
 * POST - Verify email change with token
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema-pg'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiInternalError,
  ERROR_CODES,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

const verifySchema = z.object({
  token: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = verifySchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const { token } = validation.data

    // Find user with this verification token
    const [user] = await (db as any)
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, token),
          gt(users.emailVerificationExpires!, new Date())
        )
      )
      .limit(1)

    if (!user || !user.newEmail) {
      return apiError(ERROR_CODES.INVALID_TOKEN, 'Invalid or expired token', { status: 400 })
    }

    // Update email
    await (db as any)
      .update(users)
      .set({
        email: user.newEmail,
        newEmail: null,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        emailVerified: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return apiSuccess({
      message: 'Email updated successfully',
    })
  } catch (error) {
    logger.error('Failed to verify email', { error })
    return apiInternalError('Failed to verify email')
  }
}
