/**
 * Database Connection - Drizzle ORM
 * Supports both PostgreSQL (production) and SQLite (local development)
 */

import { drizzle as drizzlePg } from 'drizzle-orm/vercel-postgres'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { sql as vercelSql } from '@vercel/postgres'
import Database from 'better-sqlite3'
import { join } from 'path'
import { logger } from '@/lib/logger'

// Determine which database to use based on environment
const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

let db: any
let schema: any

// Initialize database connection
if (usePostgres) {
  // Production: Use Vercel Postgres
  logger.info('Using PostgreSQL database')
  schema = require('./schema-pg')
  db = drizzlePg(vercelSql, { schema })
} else {
  // Development: Use SQLite
  logger.info('Using SQLite database')
  schema = require('./schema')
  const dbPath = process.env.DATABASE_PATH || join(process.cwd(), '.data', 'app.db')

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  db = drizzleSqlite(sqlite, { schema })
}

export { db }

// Export all tables from the appropriate schema
export const { users, sessions, products, carts, cartItems, orders, orderItems } = schema
