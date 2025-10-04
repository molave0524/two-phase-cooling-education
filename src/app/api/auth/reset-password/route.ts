/**
 * Reset Password API
 * POST - Reset password with token
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, validatePassword } from '@/lib/password'

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = resetPasswordSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { token, password } = validation.data

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: 'Invalid password', details: passwordValidation.errors },
      { status: 400 }
    )
  }

  // Find valid reset token
  const [resetToken] = await (db as any)
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expires, new Date())
      )
    )
    .limit(1)

  if (!resetToken) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  // Hash new password
  const hashedPassword = await hashPassword(password)

  // Update password
  await (db as any)
    .update(users)
    .set({
      hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, resetToken.userId))

  // Mark token as used
  await (db as any)
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, resetToken.id))

  return NextResponse.json({
    message: 'Password reset successfully',
  })
}
