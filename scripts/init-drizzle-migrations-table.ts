/**
 * Initialize Drizzle Migrations Table
 * Creates __drizzle_migrations table and marks migrations 0000-0009 as applied
 * This allows us to apply only migrations 0010+ which are pending
 */
import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'
import { readFile } from 'fs/promises'
import crypto from 'crypto'
import path from 'path'

dotenvConfig({ path: '.env.local' })

async function initMigrationsTable() {
  const connectionUrl = process.env.DEV_POSTGRES_URL!
  const sql = postgres(connectionUrl, { max: 1 })

  try {
    console.log('🚀 Initializing Drizzle migrations table for DEV database...\n')

    // Check if table already exists
    const existing = await sql`
      SELECT * FROM information_schema.tables
      WHERE table_name = '__drizzle_migrations'
    `

    if (existing.length > 0) {
      console.log('⚠️  __drizzle_migrations table already exists!')
      const migrations = await sql`SELECT * FROM __drizzle_migrations ORDER BY created_at`
      console.log(`Current migrations: ${migrations.length}`)
      migrations.forEach((m: any) => console.log(`  - ${m.hash}`))
      console.log('\nSkipping initialization.')
      return
    }

    // Create the migrations table
    console.log('Creating __drizzle_migrations table...')
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `
    console.log('✅ Table created\n')

    // Mark migrations 0000-0009 as applied
    console.log('Marking migrations 0000-0009 as already applied...\n')

    const migrationsToMark = [
      '0000_orange_anthem.sql',
      '0001_gifted_umar.sql',
      '0002_funny_blindfold.sql',
      '0003_catalog_versioning.sql',
      '0004_add_product_fk_to_order_items.sql',
      '0005_add_schema_comparison_sp.sql',
      '0006_remove_cart_id_from_orders.sql',
      '0007_remove_created_at_from_sessions.sql',
      '0008_fix_sessions_table_structure.sql',
      '0009_schema_separation.sql',
    ]

    for (const migrationFile of migrationsToMark) {
      const filePath = path.join(process.cwd(), 'drizzle/postgres', migrationFile)
      const content = await readFile(filePath, 'utf-8')
      const hash = crypto.createHash('sha256').update(content).digest('hex')
      const timestamp = Date.now()

      await sql`
        INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES (${hash}, ${timestamp})
      `

      console.log(`✅ Marked ${migrationFile} as applied`)
    }

    console.log('\n✅ Initialization complete!')
    console.log('\n💡 Next steps:')
    console.log('   1. Run: npm run db:migrate:run dev')
    console.log('   2. This will apply migrations 0010-0016\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

initMigrationsTable()
