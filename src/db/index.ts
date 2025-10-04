/**
 * Database Connection - Drizzle ORM
 * Using PostgreSQL for both local development (Docker) and production
 */

import { logger } from '@/lib/logger'
import * as schema from './schema-pg'

// Use Vercel Postgres in production/Vercel environment, postgres-js locally
const isVercel = process.env.VERCEL === '1'

let db: any

if (isVercel) {
  // Use Vercel Postgres for serverless
  const { drizzle } = require('drizzle-orm/vercel-postgres')
  const { sql } = require('@vercel/postgres')

  logger.info('Using Vercel Postgres (serverless)')
  db = drizzle(sql, { schema })
} else {
  // Use postgres-js for local development
  const { drizzle } = require('drizzle-orm/postgres-js')
  const postgres = require('postgres')

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

  logger.info('Using postgres-js (local)')

  const client = postgres(connectionString, {
    prepare: false,
    onnotice: () => {},
    debug: process.env.NODE_ENV === 'development',
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
  carts,
  cartItems,
  orders,
  orderItems,
  addresses,
} = schema
