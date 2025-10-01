/**
 * Database Connection - Drizzle ORM
 * Supports both PostgreSQL (production) and SQLite (local development)
 */

import { drizzle as drizzlePg } from 'drizzle-orm/vercel-postgres'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { sql as vercelSql } from '@vercel/postgres'
import Database from 'better-sqlite3'
import { join } from 'path'

// Determine which database to use based on environment
const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

let db: any
let schema: any

if (usePostgres) {
  // Production: Use Vercel Postgres
  console.log('🐘 Using PostgreSQL database')
  schema = require('./schema-pg')
  db = drizzlePg(vercelSql, { schema })
} else {
  // Development: Use SQLite
  console.log('💾 Using SQLite database')
  schema = require('./schema')
  const dbPath = process.env.DATABASE_PATH || join(process.cwd(), '.data', 'app.db')

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  db = drizzleSqlite(sqlite, { schema })
}

export { db }

// Export all tables from the appropriate schema
export const { users, sessions, products, carts, cartItems, orders, orderItems } = schema
