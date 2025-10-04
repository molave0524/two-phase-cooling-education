/**
 * Forgot Password API
 * POST - Request password reset email
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateResetToken } from '@/lib/password'
import { sendPasswordResetEmail } from '@/lib/email-verification'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = forgotPasswordSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { email } = validation.data

  // Find user
  const [user] = await (db as any)
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  // Don't reveal if user exists or not
  if (!user) {
    return NextResponse.json({
      message: 'If an account exists, a password reset email has been sent.',
    })
  }

  // Generate reset token
  const token = generateResetToken()
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Store reset token
  await (db as any).insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expires,
    used: false,
    createdAt: new Date(),
  })

  // Send email
  await sendPasswordResetEmail(user.email, token, user.name || 'User')

  return NextResponse.json({
    message: 'If an account exists, a password reset email has been sent.',
  })
}
