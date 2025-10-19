/**
 * Check DEV Database Schema
 * Inspects the DEV database structure to compare with local
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function checkDevSchema() {
  const devUrl = process.env.DEV_POSTGRES_URL

  if (!devUrl) {
    console.error('❌ DEV_POSTGRES_URL not found')
    process.exit(1)
  }

  console.log('📡 Connecting to DEV database...')
  const client = postgres(devUrl)

  try {
    // Check schemas
    const schemas = await client`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `
    console.log('\n📂 Schemas in DEV:')
    schemas.forEach((s: any) => console.log(`  - ${s.schema_name}`))

    // Check tables in catalog schema
    const catalogTables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'catalog'
      ORDER BY table_name
    `
    console.log('\n📋 Tables in catalog schema:')
    catalogTables.forEach((t: any) => console.log(`  - ${t.table_name}`))

    // Check products table structure
    const productsColumns = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'catalog' AND table_name = 'products'
      ORDER BY ordinal_position
    `
    console.log('\n🔍 Products table columns in DEV:')
    productsColumns.forEach((c: any) => {
      console.log(
        `  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`
      )
    })
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkDevSchema()
