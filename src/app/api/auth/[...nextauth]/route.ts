/**
 * NextAuth API Route Handler
 * Handles all authentication requests including OAuth callbacks
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Use Node.js runtime explicitly to avoid worker issues
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Set NEXTAUTH_URL from VERCEL_BRANCH_URL if not already set
// This must be done before NextAuth initializes
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_BRANCH_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_BRANCH_URL}`
} else if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
