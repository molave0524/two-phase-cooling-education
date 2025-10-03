# Account Management System - Technical Specification

**Document Version:** 1.0
**Date:** 2025-10-03
**Project:** Two-Phase Cooling Education Platform
**Feature:** User Account Management & Guest Conversion

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema Changes](#database-schema-changes)
4. [Authentication System](#authentication-system)
5. [API Endpoints](#api-endpoints)
6. [UI Components & Pages](#ui-components--pages)
7. [Guest Conversion Flow](#guest-conversion-flow)
8. [Security Considerations](#security-considerations)
9. [Implementation Phases](#implementation-phases)
10. [Testing Strategy](#testing-strategy)

---

## Overview

### Goals

- Enable users to manage their account information (profile, addresses, orders)
- Add email/password authentication alongside existing OAuth
- Convert guest checkout users to registered accounts
- Auto-link guest orders when users create accounts

### Current State

- ✅ NextAuth configured with Google & GitHub OAuth
- ✅ Guest checkout system using order tokens
- ✅ Database: SQLite with Drizzle ORM
- ✅ Orders stored with nullable `userId` for guest orders

### Target State

- Users can signup/login with email/password
- Unified account dashboard with profile, security, addresses, and orders
- Guest users prompted to create accounts post-checkout
- Automatic order linking by email when guests register

---

## System Architecture

### Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** SQLite (local) / PostgreSQL (production) via Drizzle ORM
- **Auth:** NextAuth.js v4
- **Password:** bcrypt for hashing
- **Email:** Existing email utilities (`src/lib/email.ts`)
- **State:** Zustand (if needed for account state)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Account Dashboard (/account)                 │   │
│  │  ├── Profile Tab                              │   │
│  │  ├── Security Tab                             │   │
│  │  ├── Addresses Tab                            │   │
│  │  └── Orders Tab                               │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Auth Pages                                   │   │
│  │  ├── /auth/signup (email/password)            │   │
│  │  ├── /auth/signin (enhanced)                  │   │
│  │  ├── /auth/forgot-password                    │   │
│  │  └── /auth/reset-password                     │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Guest Conversion                             │   │
│  │  ├── Post-Checkout Modal                      │   │
│  │  └── Email Signup Link                        │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                     API Layer                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  NextAuth Routes                              │   │
│  │  └── /api/auth/[...nextauth]                  │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Account Management API                       │   │
│  │  ├── /api/account/profile (GET, PATCH)        │   │
│  │  ├── /api/account/email (PATCH)               │   │
│  │  ├── /api/account/password (PATCH)            │   │
│  │  ├── /api/account/addresses (GET, POST)       │   │
│  │  ├── /api/account/addresses/[id] (PATCH, DEL) │   │
│  │  └── /api/account/orders (GET)                │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Guest Conversion API                         │   │
│  │  ├── /api/account/convert-guest (POST)        │   │
│  │  └── /api/account/link-orders (POST)          │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Password Reset API                           │   │
│  │  ├── /api/auth/forgot-password (POST)         │   │
│  │  └── /api/auth/reset-password (POST)          │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Database Layer                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Tables                                       │   │
│  │  ├── users (enhanced with password)           │   │
│  │  ├── addresses (NEW)                          │   │
│  │  ├── orders (existing)                        │   │
│  │  ├── password_reset_tokens (NEW)              │   │
│  │  └── email_verification_tokens (NEW)          │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### 1. Update Users Table

**File:** `src/db/schema.ts`

```typescript
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),

  // NEW: Password authentication fields
  hashedPassword: text('hashed_password'), // bcrypt hash

  // NEW: Email verification (for email changes)
  newEmail: text('new_email'), // Pending email change
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: integer('email_verification_expires', { mode: 'timestamp' }),

  // Existing NextAuth fields
  emailVerified: integer('email_verified', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
```

### 2. Create Addresses Table (NEW)

```typescript
export const addresses = sqliteTable('addresses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Address type
  type: text('type').notNull(), // 'shipping' | 'billing' | 'both'
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),

  // Address fields
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

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Address = typeof addresses.$inferSelect
export type NewAddress = typeof addresses.$inferInsert
```

### 3. Create Password Reset Tokens Table (NEW)

```typescript
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert
```

### 4. Migration Strategy

**File:** `drizzle/migrations/0XXX_account_management.sql`

```sql
-- Add password fields to users table
ALTER TABLE users ADD COLUMN hashed_password TEXT;
ALTER TABLE users ADD COLUMN new_email TEXT;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires INTEGER;

-- Create addresses table
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  address1 TEXT NOT NULL,
  address2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(user_id, is_default);

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
```

---

## Authentication System

### 1. Password Utilities

**File:** `src/lib/password.ts` (NEW)

```typescript
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate a secure token for email verification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Password validation rules
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

### 2. Update NextAuth Configuration

**File:** `src/lib/auth.ts` (UPDATE)

```typescript
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials' // NEW
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/db/schema'
import { verifyPassword } from '@/lib/password' // NEW
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ... existing adapter code ...

export const authOptions: NextAuthOptions = {
  adapter,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),

    // NEW: Credentials Provider for email/password
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
        const [user] = await db
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
        // @ts-expect-error - Extending default session user type
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

  debug: process.env.NODE_ENV === 'development',
}
```

### 3. Session Type Extension

**File:** `src/types/next-auth.d.ts` (NEW)

```typescript
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
```

---

## API Endpoints

### 1. Profile Management

#### GET/PATCH `/api/account/profile`

**File:** `src/app/api/account/profile/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional().nullable(),
})

// GET - Fetch user profile
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validation = profileSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      ...validation.data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parseInt(session.user.id)))
    .returning()

  return NextResponse.json(updatedUser)
}
```

#### PATCH `/api/account/email`

**File:** `src/app/api/account/email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateVerificationToken } from '@/lib/password'
import { sendEmailVerification } from '@/lib/email'

const emailSchema = z.object({
  newEmail: z.string().email(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validation = emailSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { newEmail } = validation.data

  // Check if email already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, newEmail.toLowerCase()))
    .limit(1)

  if (existingUser) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  // Generate verification token
  const token = generateVerificationToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Store pending email change
  await db
    .update(users)
    .set({
      newEmail: newEmail.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parseInt(session.user.id)))

  // Send verification email to new address
  await sendEmailVerification(newEmail, token)

  // Notify old email of change attempt
  // await sendEmailChangeNotification(session.user.email, newEmail)

  return NextResponse.json({
    message: 'Verification email sent. Please check your inbox.',
  })
}
```

#### POST `/api/account/verify-email`

**File:** `src/app/api/account/verify-email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = verifySchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const { token } = validation.data

  // Find user with this verification token
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(eq(users.emailVerificationToken, token), gt(users.emailVerificationExpires, new Date()))
    )
    .limit(1)

  if (!user || !user.newEmail) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  // Update email
  await db
    .update(users)
    .set({
      email: user.newEmail,
      newEmail: null,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      emailVerified: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return NextResponse.json({
    message: 'Email updated successfully',
  })
}
```

### 2. Password Management

#### PATCH `/api/account/password`

**File:** `src/app/api/account/password/route.ts`

```typescript
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
```

#### POST `/api/auth/forgot-password`

**File:** `src/app/api/auth/forgot-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateResetToken } from '@/lib/password'
import { sendPasswordResetEmail } from '@/lib/email'

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
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)

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
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expires,
  })

  // Send email
  await sendPasswordResetEmail(user.email, token, user.name || 'User')

  return NextResponse.json({
    message: 'If an account exists, a password reset email has been sent.',
  })
}
```

#### POST `/api/auth/reset-password`

**File:** `src/app/api/auth/reset-password/route.ts`

```typescript
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
  const [resetToken] = await db
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
  await db
    .update(users)
    .set({
      hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, resetToken.userId))

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, resetToken.id))

  return NextResponse.json({
    message: 'Password reset successfully',
  })
}
```

### 3. Address Management

#### GET/POST `/api/account/addresses`

**File:** `src/app/api/account/addresses/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { addresses } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  company: z.string().max(100).optional(),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(2).default('US'),
  phone: z.string().max(20).optional(),
})

// GET - Fetch all addresses
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, parseInt(session.user.id)))
    .orderBy(addresses.isDefault, addresses.createdAt)

  return NextResponse.json(userAddresses)
}

// POST - Create new address
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validation = addressSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const data = validation.data

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, parseInt(session.user.id)), eq(addresses.type, data.type)))
  }

  const [newAddress] = await db
    .insert(addresses)
    .values({
      userId: parseInt(session.user.id),
      ...data,
    })
    .returning()

  return NextResponse.json(newAddress, { status: 201 })
}
```

#### PATCH/DELETE `/api/account/addresses/[id]`

**File:** `src/app/api/account/addresses/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { addresses } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']).optional(),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  company: z.string().max(100).optional(),
  address1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(50).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().min(2).max(2).optional(),
  phone: z.string().max(20).optional(),
})

// PATCH - Update address
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const addressId = parseInt(params.id)
  const body = await req.json()
  const validation = addressSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const data = validation.data

  // If setting as default, unset other defaults
  if (data.isDefault && data.type) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, parseInt(session.user.id)), eq(addresses.type, data.type)))
  }

  const [updatedAddress] = await db
    .update(addresses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, parseInt(session.user.id))))
    .returning()

  if (!updatedAddress) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  return NextResponse.json(updatedAddress)
}

// DELETE - Delete address
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const addressId = parseInt(params.id)

  const [deleted] = await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, parseInt(session.user.id))))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Address deleted successfully' })
}
```

### 4. Orders Management

#### GET `/api/account/orders`

**File:** `src/app/api/account/orders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orders, orderItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch orders with items
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, parseInt(session.user.id)))
    .orderBy(orders.createdAt)

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    userOrders.map(async order => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))

      return {
        ...order,
        items,
      }
    })
  )

  return NextResponse.json(ordersWithItems)
}
```

### 5. Guest Conversion

#### POST `/api/account/convert-guest`

**File:** `src/app/api/account/convert-guest/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { hashPassword, validatePassword } from '@/lib/password'

const convertGuestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = convertGuestSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { email, password, name } = validation.data

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: 'Invalid password', details: passwordValidation.errors },
      { status: 400 }
    )
  }

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (existingUser) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      hashedPassword,
      emailVerified: new Date(), // Auto-verify since they used this email for order
    })
    .returning()

  // Link guest orders to new user
  await db
    .update(orders)
    .set({ userId: newUser.id })
    .where(eq(orders.customer.email, email.toLowerCase()))

  return NextResponse.json({
    message: 'Account created successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
  })
}
```

#### POST `/api/account/link-orders`

**File:** `src/app/api/account/link-orders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find guest orders with matching email
  const linkedOrders = await db
    .update(orders)
    .set({ userId: parseInt(session.user.id) })
    .where(
      sql`${orders.userId} IS NULL AND json_extract(${orders.customer}, '$.email') = ${session.user.email.toLowerCase()}`
    )
    .returning()

  return NextResponse.json({
    message: `Linked ${linkedOrders.length} order(s) to your account`,
    count: linkedOrders.length,
  })
}
```

---

## UI Components & Pages

### 1. Account Dashboard Layout

**File:** `src/app/account/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Tab } from '@headlessui/react'
import { UserIcon, ShieldCheckIcon, MapPinIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import ProfileSection from '@/components/account/ProfileSection'
import SecuritySection from '@/components/account/SecuritySection'
import AddressesSection from '@/components/account/AddressesSection'
import OrdersSection from '@/components/account/OrdersSection'

const tabs = [
  { name: 'Profile', icon: UserIcon, component: ProfileSection },
  { name: 'Security', icon: ShieldCheckIcon, component: SecuritySection },
  { name: 'Addresses', icon: MapPinIcon, component: AddressesSection },
  { name: 'Orders', icon: ShoppingBagIcon, component: OrdersSection },
]

export default function AccountPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin?callbackUrl=/account')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your profile, addresses, and orders
        </p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-8">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
                ${selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
                }`
              }
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {tabs.map((tab) => (
            <Tab.Panel key={tab.name} className="rounded-xl bg-white p-6 shadow">
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
```

### 2. Profile Section Component

**File:** `src/components/account/ProfileSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface ProfileFormData {
  name: string
  image: string
}

interface EmailFormData {
  newEmail: string
}

export default function ProfileSection() {
  const { data: session, update } = useSession()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: session?.user?.name || '',
      image: session?.user?.image || '',
    },
  })

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    reset: resetEmail,
  } = useForm<EmailFormData>()

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdating(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update profile')

      await update({ name: data.name, image: data.image })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const onUpdateEmail = async (data: EmailFormData) => {
    setIsUpdatingEmail(true)
    try {
      const res = await fetch('/api/account/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update email')
      }

      toast.success('Verification email sent. Please check your inbox.')
      resetEmail()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Info */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              {...registerProfile('name', { required: 'Name is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {profileErrors.name && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Profile Image URL
            </label>
            <input
              {...registerProfile('image')}
              type="url"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Email */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Email Address</h2>
        <p className="text-sm text-gray-600 mb-4">
          Current email: <strong>{session?.user?.email}</strong>
        </p>

        <form onSubmit={handleEmailSubmit(onUpdateEmail)} className="space-y-4">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
              New Email Address
            </label>
            <input
              {...registerEmail('newEmail', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter new email"
            />
            {emailErrors.newEmail && (
              <p className="mt-1 text-sm text-red-600">{emailErrors.newEmail.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isUpdatingEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdatingEmail ? 'Sending...' : 'Update Email'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### 3. Security Section Component

**File:** `src/components/account/SecuritySection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface PasswordFormData {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}

export default function SecuritySection() {
  const { data: session } = useSession()
  const [isUpdating, setIsUpdating] = useState(false)

  // Check if user has password (credentials) or only OAuth
  const hasPassword = true // You'd determine this from session/user data

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PasswordFormData>()

  const newPassword = watch('newPassword')

  const onSubmit = async (data: PasswordFormData) => {
    setIsUpdating(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update password')
      }

      toast.success('Password updated successfully')
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {hasPassword ? 'Change Password' : 'Set Password'}
      </h2>

      <p className="text-sm text-gray-600 mb-6">
        {hasPassword
          ? 'Update your password to keep your account secure'
          : 'Set a password to enable email/password login'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        {hasPassword && (
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              {...register('currentPassword', { required: 'Current password is required' })}
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            {...register('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain uppercase, lowercase, and number',
              },
            })}
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            })}
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : hasPassword ? 'Update Password' : 'Set Password'}
        </button>
      </form>
    </div>
  )
}
```

### 4. Addresses Section Component

**File:** `src/components/account/AddressesSection.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Address {
  id: number
  type: 'shipping' | 'billing' | 'both'
  isDefault: boolean
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export default function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<Omit<Address, 'id'>>()

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/account/addresses')
      if (!res.ok) throw new Error('Failed to fetch addresses')
      const data = await res.json()
      setAddresses(data)
    } catch (error) {
      toast.error('Failed to load addresses')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: Omit<Address, 'id'>) => {
    try {
      const url = editingId
        ? `/api/account/addresses/${editingId}`
        : '/api/account/addresses'

      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to save address')

      toast.success(editingId ? 'Address updated' : 'Address added')
      reset()
      setShowForm(false)
      setEditingId(null)
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to save address')
    }
  }

  const deleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete address')

      toast.success('Address deleted')
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to delete address')
    }
  }

  if (isLoading) return <div>Loading addresses...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Saved Addresses</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            reset()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add Address
        </button>
      </div>

      {/* Address Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                {...register('firstName', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                {...register('lastName', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address Type</label>
            <select
              {...register('type', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="shipping">Shipping</option>
              <option value="billing">Billing</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                {...register('isDefault')}
                type="checkbox"
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Set as default</span>
            </label>
          </div>

          {/* More fields... */}

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingId ? 'Update' : 'Save'} Address
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                reset()
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      <div className="grid gap-4">
        {addresses.map((address) => (
          <div key={address.id} className="border rounded-lg p-4 flex justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{address.firstName} {address.lastName}</span>
                {address.isDefault && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{address.address1}</p>
              {address.address2 && <p className="text-sm text-gray-600">{address.address2}</p>}
              <p className="text-sm text-gray-600">
                {address.city}, {address.state} {address.postalCode}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(address.id)
                  setShowForm(true)
                  reset(address)
                }}
                className="p-2 text-gray-600 hover:text-blue-600"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => deleteAddress(address.id)}
                className="p-2 text-gray-600 hover:text-red-600"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5. Orders Section Component

**File:** `src/components/account/OrdersSection.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface OrderItem {
  id: number
  productName: string
  productImage: string
  quantity: number
  price: number
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  createdAt: string
  trackingNumber?: string
  trackingUrl?: string
  items: OrderItem[]
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/account/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) return <div>Loading orders...</div>

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No orders yet</p>
        <Link href="/products" className="text-blue-600 hover:underline">
          Start shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Order History</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium">Order #{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(order.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <p className="mt-2 font-medium">${order.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tracking */}
            {order.trackingNumber && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  Tracking: <strong>{order.trackingNumber}</strong>
                </p>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Track shipment →
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 6. Guest Conversion Modal

**File:** `src/components/checkout/GuestConversionModal.tsx`

```typescript
'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface GuestConversionModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
}

interface ConversionFormData {
  password: string
  confirmPassword: string
  name: string
}

export default function GuestConversionModal({ isOpen, onClose, email }: GuestConversionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ConversionFormData>()

  const password = watch('password')

  const onSubmit = async (data: ConversionFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/account/convert-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: data.password,
          name: data.name,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create account')
      }

      toast.success('Account created! Redirecting...')
      onClose()

      // Sign in automatically
      const signInRes = await fetch('/api/auth/signin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: data.password }),
      })

      if (signInRes.ok) {
        router.push('/account')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Create Your Account
                </Dialog.Title>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Track your order and manage future purchases by creating an account.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Min 8 characters' },
                      })}
                      type="password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm password',
                        validate: (value) => value === password || 'Passwords do not match',
                      })}
                      type="password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Account'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Skip
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
```

---

## Guest Conversion Flow

### 1. Post-Checkout Integration

**File:** `src/app/order-confirmation/page.tsx` (UPDATE)

Add the guest conversion modal after successful order:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import GuestConversionModal from '@/components/checkout/GuestConversionModal'

export default function OrderConfirmationPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [orderEmail, setOrderEmail] = useState('')

  useEffect(() => {
    // If user is not logged in and we have order info, show conversion modal
    if (!session && searchParams.get('email')) {
      setOrderEmail(searchParams.get('email') || '')
      setShowConversionModal(true)
    }
  }, [session, searchParams])

  return (
    <>
      {/* Existing order confirmation UI */}

      <GuestConversionModal
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        email={orderEmail}
      />
    </>
  )
}
```

### 2. Email Integration

**File:** `src/lib/email.ts` (UPDATE)

Add account creation link to order confirmation emails:

```typescript
export async function sendOrderConfirmation(order: Order, customerEmail: string) {
  const accountCreationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup?email=${encodeURIComponent(customerEmail)}&source=order`

  const emailContent = `
    <h1>Order Confirmation</h1>
    <p>Thank you for your order!</p>

    <!-- Existing order details -->

    <!-- NEW: Account creation CTA -->
    <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
      <h2>Track Your Order</h2>
      <p>Create an account to track your order and manage future purchases.</p>
      <a href="${accountCreationLink}"
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Create Account
      </a>
    </div>
  `

  // Send email...
}
```

### 3. Auto-Link Orders on Login

**File:** `src/lib/auth.ts` (UPDATE)

Add callback to link orders when user signs in:

```typescript
export const authOptions: NextAuthOptions = {
  // ... existing config ...

  events: {
    async signIn({ user, isNewUser }) {
      if (user.email) {
        // Auto-link guest orders when user signs in
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/account/link-orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Include auth somehow or make this a server-side call
            },
          })
        } catch (error) {
          console.error('Failed to auto-link orders:', error)
        }
      }
    },
  },
}
```

---

## Security Considerations

### 1. Password Security

- ✅ Use bcrypt with 12 salt rounds
- ✅ Enforce strong password policy (8+ chars, upper, lower, number)
- ✅ Never log or expose passwords
- ✅ Use timing-safe comparison for tokens

### 2. Email Verification

- ✅ Generate cryptographically secure tokens
- ✅ Set expiration times (24h for email change, 1h for password reset)
- ✅ One-time use tokens (mark as used after verification)
- ✅ Notify old email on change attempts

### 3. Session Management

- ✅ Use JWT with 30-day expiration
- ✅ Validate session on all protected routes
- ✅ Support session updates (for profile changes)

### 4. Rate Limiting

- ✅ Limit password reset requests (5 per hour per email)
- ✅ Limit failed login attempts
- ✅ Implement CAPTCHA for sensitive operations

### 5. Input Validation

- ✅ Use Zod schemas for all API inputs
- ✅ Sanitize user inputs (especially names, addresses)
- ✅ Validate email formats
- ✅ Check for SQL injection patterns

### 6. Authorization

- ✅ Verify user owns resource before CRUD operations
- ✅ Use session user ID, never trust client-provided IDs
- ✅ Implement middleware for protected routes

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)

- [ ] Update database schema
- [ ] Run migrations
- [ ] Install dependencies (bcrypt)
- [ ] Create password utilities
- [ ] Add Credentials provider to NextAuth
- [ ] Test email/password auth

### Phase 2: API Layer (Days 3-4)

- [ ] Profile management API
- [ ] Email change API with verification
- [ ] Password management API
- [ ] Password reset flow API
- [ ] Address CRUD API
- [ ] Orders API
- [ ] Guest conversion API

### Phase 3: UI Components (Days 5-7)

- [ ] Account dashboard layout
- [ ] Profile section
- [ ] Security section
- [ ] Addresses section
- [ ] Orders section with tracking
- [ ] Guest conversion modal
- [ ] Email/password signup page
- [ ] Password reset pages

### Phase 4: Integration (Day 8)

- [ ] Integrate conversion modal in checkout flow
- [ ] Update order confirmation emails
- [ ] Auto-link orders on signin
- [ ] Protected route middleware
- [ ] Session management updates

### Phase 5: Testing & Polish (Days 9-10)

- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Error handling
- [ ] UI polish
- [ ] Documentation

---

## Testing Strategy

### 1. Unit Tests

- Password utilities (hash, verify, validate)
- Token generation
- Email validation
- Input sanitization

### 2. Integration Tests

- Auth flow (signup, signin, password reset)
- Profile updates
- Address CRUD operations
- Order fetching
- Guest conversion

### 3. E2E Tests

- Complete guest checkout → conversion flow
- Account creation → order → tracking
- Email change with verification
- Password reset flow
- Address management

### 4. Security Tests

- SQL injection attempts
- XSS attempts
- CSRF protection
- Rate limiting
- Token expiration
- Authorization bypass attempts

### 5. Manual Testing Checklist

- [ ] Guest checkout flow
- [ ] Account creation
- [ ] Email/password login
- [ ] OAuth login (Google, GitHub)
- [ ] Profile updates
- [ ] Email change with verification
- [ ] Password change
- [ ] Password reset
- [ ] Address CRUD
- [ ] Order viewing
- [ ] Guest conversion modal
- [ ] Order auto-linking
- [ ] Mobile responsiveness
- [ ] Error states
- [ ] Loading states

---

## Environment Variables

Add to `.env.local`:

```bash
# Existing
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# NEW: Order token secret
ORDER_TOKEN_SECRET=your-order-token-secret

# Email service (if not already configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Dependencies to Install

```bash
npm install bcrypt @types/bcrypt
# or
pnpm add bcrypt @types/bcrypt
```

---

## Database Migration Commands

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Or push directly (development)
npm run db:push
```

---

## API Documentation Summary

### Authentication

- `POST /api/auth/signin` - Sign in (OAuth or credentials)
- `POST /api/auth/signup` - Sign up (NEW)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/account/verify-email` - Verify email change

### Account Management

- `GET /api/account/profile` - Get user profile
- `PATCH /api/account/profile` - Update profile
- `PATCH /api/account/email` - Request email change
- `PATCH /api/account/password` - Update password

### Addresses

- `GET /api/account/addresses` - List addresses
- `POST /api/account/addresses` - Create address
- `PATCH /api/account/addresses/:id` - Update address
- `DELETE /api/account/addresses/:id` - Delete address

### Orders

- `GET /api/account/orders` - List user orders

### Guest Conversion

- `POST /api/account/convert-guest` - Convert guest to registered user
- `POST /api/account/link-orders` - Link guest orders to account

---

## Next Steps

Once implementation is complete:

1. **Production Considerations**
   - Set up production email service (SendGrid, AWS SES, etc.)
   - Configure production database (PostgreSQL)
   - Set secure environment variables
   - Enable HTTPS
   - Add monitoring/logging

2. **Future Enhancements**
   - Two-factor authentication (2FA)
   - Social login (Twitter, Apple, etc.)
   - Order notifications (SMS, push)
   - Wishlist functionality
   - Referral system
   - Customer reviews

3. **Analytics**
   - Track conversion rates (guest → registered)
   - Monitor account creation sources
   - Track order frequency by user type

---

## Support & Maintenance

### Common Issues & Solutions

1. **Password reset email not received**
   - Check spam folder
   - Verify SMTP configuration
   - Check rate limits

2. **Email verification failing**
   - Token may have expired (24h limit)
   - Request new verification email

3. **Orders not auto-linking**
   - Email must match exactly (case-insensitive)
   - Check database logs

4. **Session issues**
   - Clear cookies
   - Check NEXTAUTH_SECRET consistency
   - Verify JWT expiration

---

**End of Technical Specification**

For implementation questions or clarifications, refer to this document and the existing codebase structure.
