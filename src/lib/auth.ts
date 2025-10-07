/**
 * NextAuth Configuration
 * Handles authentication with Google, GitHub OAuth, and email/password
 * Uses Drizzle ORM adapter for database persistence
 */

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
// Temporarily disable Drizzle adapter to fix Jest worker issue
// import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users } from '@/db/schema-pg'
import { verifyPassword } from '@/lib/password'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'

// Temporarily removed adapter to fix Jest worker issues on Windows + Node v24
// const adapter = DrizzleAdapter(db as any, {
//   usersTable: users as any,
//   accountsTable: accounts as any,
//   sessionsTable: sessions as any,
//   verificationTokensTable: verificationTokens as any,
// }) as any

export const authOptions: NextAuthOptions = {
  // adapter: removed temporarily to fix worker issues

  secret: process.env.NEXTAUTH_SECRET,

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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id
      }

      // Handle session updates (e.g., profile changes)
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
        token.picture = session.image
      }

      return token
    },
  },

  events: {
    async signIn({ user }) {
      logger.info('[auth] User signed in', { userId: user.id, email: user.email })
      // Auto-link guest orders when user signs in
      if (user.email) {
        try {
          const { orders } = await import('@/db/schema-pg')
          const { sql } = await import('drizzle-orm')

          await (db as any)
            .update(orders)
            .set({ userId: parseInt(user.id) })
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
