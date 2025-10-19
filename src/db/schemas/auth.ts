/**
 * Auth Schema - User & Authentication Domain
 * PostgreSQL schema definitions for user management and authentication
 */

import { pgSchema, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { randomUUID } from 'crypto'

// Create auth schema
export const authSchema = pgSchema('auth')

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = authSchema.table('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()), // OAuth provider IDs or UUID
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'), // Profile picture URL
  hashedPassword: text('hashed_password'),
  emailVerified: timestamp('email_verified', { withTimezone: true }), // NextAuth compatibility
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: timestamp('email_verification_expires', { withTimezone: true }),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// ACCOUNTS TABLE (for OAuth providers - NextAuth)
// ============================================================================

export const accounts = authSchema.table('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // oauth, email, credentials
  provider: text('provider').notNull(), // google, github, credentials, etc
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
})

// ============================================================================
// SESSIONS TABLE (for authentication - NextAuth)
// ============================================================================

export const sessions = authSchema.table('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
})

// ============================================================================
// VERIFICATION TOKENS TABLE (for email verification - NextAuth)
// ============================================================================

export const verificationTokens = authSchema.table('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
})

// ============================================================================
// ADDRESSES TABLE
// ============================================================================

export const addresses = authSchema.table('addresses', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'shipping', 'billing', 'both'
  isDefault: text('is_default').notNull().$type<'true' | 'false'>().default('false'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  company: text('company'),
  address1: text('address1').notNull(),
  address2: text('address2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('US'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert

export type Address = typeof addresses.$inferSelect
export type NewAddress = typeof addresses.$inferInsert
