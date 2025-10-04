/**
 * Database Connection - Drizzle ORM
 * Using PostgreSQL for both local development (Docker) and production
 * Using postgres-js everywhere for consistency
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { logger } from '@/lib/logger'
import * as schema from './schema-pg'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

logger.info(`Connecting to PostgreSQL database...`)

// Configure postgres-js client
const client = postgres(connectionString, {
  prepare: false,
  max: 1, // Serverless-friendly: use single connection
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Silence notices
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
  carts,
  cartItems,
  orders,
  orderItems,
  addresses,
} = schema
