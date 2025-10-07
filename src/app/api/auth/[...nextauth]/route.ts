/**
 * NextAuth API Route Handler
 * Handles all authentication requests including OAuth callbacks
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Use Node.js runtime explicitly to avoid worker issues
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
