/**
 * Database Connection - Drizzle ORM
 * Using PostgreSQL for both local development (Docker) and production
 * Using @neondatabase/serverless on Vercel, postgres-js locally
 */

import { logger } from '@/lib/logger'
import * as schema from './schema-pg'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

// Validate connection string
if (!connectionString || connectionString === 'undefined') {
  throw new Error(
    'DATABASE_URL or POSTGRES_URL environment variable is required but not set. Please configure your database connection string.'
  )
}

const isVercel = process.env.VERCEL === '1'

let db: any

if (isVercel) {
  // Use Neon serverless driver on Vercel
  const { neon } = require('@neondatabase/serverless')
  const { drizzle } = require('drizzle-orm/neon-http')

  logger.info('Using @neondatabase/serverless (Vercel)')
  const sql = neon(connectionString)
  db = drizzle(sql, { schema })
} else {
  // Use postgres-js for local development
  const { drizzle } = require('drizzle-orm/postgres-js')
  const postgres = require('postgres')

  logger.info('Using postgres-js (local)')
  const client = postgres(connectionString, {
    prepare: false,
    onnotice: () => {},
  })
  db = drizzle(client, { schema })
}

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
