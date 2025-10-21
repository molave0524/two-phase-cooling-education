/**
 * Set Admin Role Script
 * Promotes a user to admin role by email
 *
 * Usage: node --import tsx --env-file=.env.local scripts/set-admin-role.ts <email>
 */

import { db } from '../src/db'
import { users } from '../src/db/schemas/auth'
import { eq } from 'drizzle-orm'

const email = process.argv[2]

if (!email) {
  console.error('Usage: node --import tsx --env-file=.env.local scripts/set-admin-role.ts <email>')
  process.exit(1)
}

async function setAdminRole() {
  try {
    console.log(`Looking for user with email: ${email}`)

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      console.error(`❌ User not found with email: ${email}`)
      process.exit(1)
    }

    console.log(`Found user: ${user.name || user.email} (${user.id})`)
    console.log(`Current role: ${user.role}`)

    if (user.role === 'admin') {
      console.log('✓ User is already an admin')
      process.exit(0)
    }

    // Update user role to admin
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id))

    console.log('✓ Successfully promoted user to admin')
    console.log(`  Email: ${user.email}`)
    console.log(`  Name: ${user.name || 'N/A'}`)
    console.log(`  Role: customer → admin`)

    process.exit(0)
  } catch (error) {
    console.error('Error setting admin role:', error)
    process.exit(1)
  }
}

setAdminRole()
