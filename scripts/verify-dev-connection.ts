import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function verifyConnection() {
  try {
    console.log('\n🔍 Verifying DEV database connection...\n')

    // Get database connection info
    const dbInfo = await db.execute(sql`
      SELECT
        current_database() as database_name,
        current_schema() as schema_name,
        version() as postgres_version
    `)

    console.log('📊 Database Connection Info:')
    console.log(JSON.stringify(dbInfo, null, 2))

    // Count products
    const count = await db.execute(sql`SELECT COUNT(*) as count FROM public.products`)
    console.log(`\n📦 Product count:`)
    console.log(JSON.stringify(count, null, 2))

    // List all tables in public schema
    const tables = await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    console.log('\n📋 Tables in public schema:')
    console.log(JSON.stringify(tables, null, 2))

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

verifyConnection()
