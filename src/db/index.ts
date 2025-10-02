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
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { VercelPgDatabase } from 'drizzle-orm/vercel-postgres'

// Determine which database to use based on environment
const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

// Type for the database instance (union of both possible types)
// Note: Using Record<string, any> here as the schema is dynamically determined at runtime
// between PostgreSQL and SQLite schemas. This is a necessary trade-off for the
// dual-database architecture. The `any` type is acceptable here because:
// 1. The schema structure varies between SQLite and PostgreSQL implementations
// 2. Drizzle ORM provides runtime type safety through its query builders
// 3. This allows the codebase to support both databases without duplication
type DatabaseInstance =
  | BetterSQLite3Database<Record<string, any>>
  | VercelPgDatabase<Record<string, any>>
type SchemaType = Record<string, any>

let db: DatabaseInstance
let schema: SchemaType

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
