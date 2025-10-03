/**
 * Password Management API
 * PATCH - Update user password
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, verifyPassword, validatePassword } from '@/lib/password'

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validation = passwordSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { currentPassword, newPassword } = validation.data

  // Validate new password
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: 'Invalid password', details: passwordValidation.errors },
      { status: 400 }
    )
  }

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // If user has a password, verify current password
  if (user.hashedPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password required' }, { status: 400 })
    }

    const isValid = await verifyPassword(currentPassword, user.hashedPassword)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }
  }

  // Hash and update password
  const hashedPassword = await hashPassword(newPassword)

  await db
    .update(users)
    .set({
      hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parseInt(session.user.id)))

  return NextResponse.json({
    message: 'Password updated successfully',
  })
}
