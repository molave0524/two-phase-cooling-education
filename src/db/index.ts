/**
 * Database Connection - Drizzle ORM
 * Using PostgreSQL for both local development (Docker) and production
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { logger } from '@/lib/logger'
import * as schema from './schema-pg'

// PostgreSQL connection
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

logger.info('Using PostgreSQL database')

// Create postgres client with proper configuration
// Disable prefetch for serverless compatibility
const client = postgres(connectionString, {
  prepare: false, // Disable prepared statements for serverless
})

// Create drizzle instance with schema
const db = drizzle(client, { schema })

export { db }

// Export all tables from schema
export const {
  users,
  accounts,
  sessions,
  verificationTokens,
  products,
  carts,
  cartItems,
  orders,
  orderItems,
  addresses,
} = schema
