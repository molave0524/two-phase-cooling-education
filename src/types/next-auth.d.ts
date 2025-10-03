/**
 * NextAuth Type Extensions
 * Extends the default NextAuth types to include user ID
 */

import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}
