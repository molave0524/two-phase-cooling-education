/**
 * NextAuth Configuration
 * Handles authentication with Google, GitHub OAuth, and email/password
 * Uses Drizzle ORM adapter for database persistence
 */

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/db/schemas/auth'
import { verifyPassword } from '@/lib/password'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { DEFAULTS } from '@/constants/defaults'

// Drizzle adapter for NextAuth database persistence
const adapter = DrizzleAdapter(db as any, {
  usersTable: users as any,
  accountsTable: accounts as any,
  sessionsTable: sessions as any,
  verificationTokensTable: verificationTokens as any,
}) as any

// Auto-detect NEXTAUTH_URL on Vercel using VERCEL_BRANCH_URL for stable git-based URLs
const getNextAuthUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  // Use VERCEL_BRANCH_URL for stable git-branch URLs (e.g., *-git-develop-*.vercel.app)
  // Falls back to VERCEL_URL for deployment-specific URLs
  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return DEFAULTS.APP_URL
}

export const authOptions: NextAuthOptions = {
  adapter,

  secret: process.env.NEXTAUTH_SECRET || '',

  // Explicitly set the URL for OAuth redirects
  // This is needed because NextAuth doesn't auto-detect VERCEL_URL properly
  ...(typeof window === 'undefined' && { url: getNextAuthUrl() }),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        // Lazy load database to avoid build-time import
        const { db } = await import('@/db')
        const { users } = await import('@/db/schema-pg')

        // Find user by email
        const [user] = await (db as any)
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .limit(1)

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid email or password')
        }

        // Verify password
        const isValid = await verifyPassword(credentials.password, user.hashedPassword)

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],

  session: {
    strategy: 'database', // Use database sessions for better persistence
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async session({ session, user }) {
      // In database mode, user object is from database
      if (session.user && user) {
        session.user.id = user.id
        session.user.email = user.email
        session.user.name = user.name ?? null
        session.user.image = user.image ?? null
      }
      return session
    },
  },

  events: {
    async signIn({ user }) {
      logger.info('[auth] User signed in', { userId: user.id, email: user.email })
      // Auto-link guest orders when user signs in
      if (user.email) {
        try {
          // Lazy load database to avoid build-time import
          const { db } = await import('@/db')
          const { orders } = await import('@/db/schema-pg')
          const { sql } = await import('drizzle-orm')

          await (db as any)
            .update(orders)
            .set({ userId: user.id }) // user_id is now TEXT to support OAuth provider IDs
            .where(
              sql`${orders.userId} IS NULL AND (${orders.customer}->>'email')::text = ${user.email.toLowerCase()}`
            )
        } catch (error) {
          // Silently fail - order linking can be done manually later
          logger.warn('[auth] Failed to link guest orders', { error })
        }
      }
    },
    async signOut({ session }) {
      logger.info('[auth] User signed out', { sessionId: session?.user?.id })
    },
    async linkAccount({ user, account }) {
      logger.info('[auth] Account linked', {
        userId: user.id,
        provider: account.provider,
      })
    },
  },

  logger: {
    error(code, metadata) {
      logger.error(`[auth] NextAuth Error: ${code}`, new Error(code), metadata as any)
    },
    warn(code) {
      logger.warn(`[auth] NextAuth Warning: ${code}`)
    },
    debug(code, metadata) {
      logger.debug(`[auth] NextAuth Debug: ${code}`, metadata as any)
    },
  },

  debug: process.env.NODE_ENV === 'development',
}
