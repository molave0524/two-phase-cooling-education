/**
 * Email Verification API
 * POST - Verify email change with token
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = verifySchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const { token } = validation.data

  // Find user with this verification token
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(eq(users.emailVerificationToken, token), gt(users.emailVerificationExpires!, new Date()))
    )
    .limit(1)

  if (!user || !user.newEmail) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  // Update email
  await db
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

  return NextResponse.json({
    message: 'Email updated successfully',
  })
}
