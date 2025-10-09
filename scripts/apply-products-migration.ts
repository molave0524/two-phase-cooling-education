/**
 * Apply Products Table Migration
 * Truncates products table and applies VARCHAR(3) constraints to SKU fields
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Read DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment')
  process.exit(1)
}

console.log('📦 Connecting to database...')
const pool = new Pool({
  connectionString: DATABASE_URL,
})

const db = drizzle(pool)

async function applyMigration() {
  try {
    console.log('📄 Reading migration file...')
    const migrationPath = path.join(
      process.cwd(),
      'drizzle',
      'migrations',
      'alter_products_sku_fields_3char.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('⚠️  WARNING: This will TRUNCATE the products table and delete ALL data!')
    console.log('⏳ Applying migration in 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('🔄 Executing migration...')
    await db.execute(sql.raw(migrationSQL))

    console.log('✅ Migration applied successfully!')
    console.log('')
    console.log('✨ Products table schema updated:')
    console.log('   - sku_prefix: VARCHAR(3) NOT NULL')
    console.log('   - sku_category: VARCHAR(3) NOT NULL')
    console.log('   - sku_product_code: VARCHAR(3) NOT NULL')
    console.log('   - sku_version: VARCHAR(3) NOT NULL')
    console.log('   - CHECK constraints added (exactly 3 chars, no spaces)')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
    console.log('👋 Database connection closed')
  }
}

applyMigration()
