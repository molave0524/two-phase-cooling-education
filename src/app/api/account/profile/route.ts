/**
 * Profile Management API
 * GET - Fetch user profile
 * PATCH - Update user profile (name, image)
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiInternalError,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional().nullable(),
})

// GET - Fetch user profile
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    const [user] = await (db as any)
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return apiNotFound('User')
    }

    return apiSuccess(user)
  } catch (error) {
    logger.error('Failed to fetch user profile', { error, userId: _req.headers.get('user-id') })
    return apiInternalError('Failed to load profile')
  }
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    const body = await req.json()
    const validation = profileSchema.safeParse(body)

    if (!validation.success) {
      return apiValidationError(validation.error)
    }

    const [updatedUser] = await (db as any)
      .update(users)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning()

    return apiSuccess(updatedUser)
  } catch (error) {
    logger.error('Failed to update user profile', { error, userId: req.headers.get('user-id') })
    return apiInternalError('Failed to update profile')
  }
}
