/**
 * Email Change API
 * PATCH - Request email change with verification
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateVerificationToken } from '@/lib/password'
import { sendEmailVerification, sendEmailChangeNotification } from '@/lib/email-verification'
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiConflict,
  apiInternalError,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

const emailSchema = z.object({
  newEmail: z.string().email(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    const body = await req.json()
    const validation = emailSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const { newEmail } = validation.data

    // Check if email already exists
    const [existingUser] = await (db as any)
      .select()
      .from(users)
      .where(eq(users.email, newEmail.toLowerCase()))
      .limit(1)

    if (existingUser) {
      return apiConflict('Email already in use')
    }

    // Generate verification token
    const token = generateVerificationToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store pending email change
    await (db as any)
      .update(users)
      .set({
        newEmail: newEmail.toLowerCase(),
        emailVerificationToken: token,
        emailVerificationExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    // Send verification email to new address
    await sendEmailVerification(newEmail, token)

    // Notify old email of change attempt
    if (session.user.email) {
      await sendEmailChangeNotification(session.user.email, newEmail)
    }

    return apiSuccess({
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error) {
    logger.error('Failed to process email change', { error, userId: req.headers.get('user-id') })
    return apiInternalError('Failed to change email')
  }
}
