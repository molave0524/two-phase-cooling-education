/**
 * Forgot Password API
 * POST - Request password reset email
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateResetToken } from '@/lib/password'
import { sendPasswordResetEmail } from '@/lib/email-verification'
import { apiSuccess, apiValidationError, apiInternalError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const { email } = validation.data

    // Find user
    const [user] = await (db as any)
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return apiSuccess({
        message: 'If an account exists, a password reset email has been sent.',
      })
    }

    // Generate reset token
    const token = generateResetToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token in users table
    await (db as any)
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      })
      .where(eq(users.id, user.id))

    // Send email
    await sendPasswordResetEmail(user.email, token, user.name || 'User')

    return apiSuccess({
      message: 'If an account exists, a password reset email has been sent.',
    })
  } catch (error) {
    logger.error('Failed to process forgot password request', { error })
    return apiInternalError('Failed to process password reset request')
  }
}
