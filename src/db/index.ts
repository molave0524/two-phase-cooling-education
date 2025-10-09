/**
 * Database Connection - Drizzle ORM
 * Using PostgreSQL for both local development (Docker) and production
 * Using @neondatabase/serverless on Vercel, postgres-js locally
 */

import { logger } from '@/lib/logger'
import * as schema from './schema-pg'

// Get connection string, ensuring we don't use empty strings
const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
const connectionString =
  rawUrl.trim() || 'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

// Validate connection string
if (
  !connectionString ||
  connectionString === 'undefined' ||
  connectionString === 'null' ||
  connectionString.trim() === ''
) {
  throw new Error(
    'DATABASE_URL or POSTGRES_URL environment variable is required but not set. Please configure your database connection string in Vercel environment variables.'
  )
}

// Validate URL format
try {
  new URL(connectionString)
} catch (error) {
  throw new Error(
    `Invalid DATABASE_URL format: "${connectionString}". Please ensure it's a valid PostgreSQL connection string (postgresql://...)`
  )
}

// Use postgres-js everywhere for consistency
const { drizzle } = require('drizzle-orm/postgres-js')
const postgres = require('postgres')

logger.info('Using postgres-js')
const client = postgres(connectionString, {
  prepare: false,
  onnotice: () => {},
})
const db = drizzle(client, { schema })

export { db }

// Export all tables from schema
export const {
  users,
  accounts,
  sessions,
  verificationTokens,
  products,
  productComponents,
  carts,
  cartItems,
  orders,
  orderItems,
  addresses,
} = schema
