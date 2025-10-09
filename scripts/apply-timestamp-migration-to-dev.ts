import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const DEV_POSTGRES_URL = process.env.DEV_POSTGRES_URL

if (!DEV_POSTGRES_URL) {
  console.error('❌ DEV_POSTGRES_URL not found in .env.local')
  console.error('   Please add DEV_POSTGRES_URL to apply migration to DEV')
  process.exit(1)
}

const pool = new Pool({ connectionString: DEV_POSTGRES_URL })
const db = drizzle(pool)

async function applyMigration() {
  try {
    console.log('🔧 Applying timestamp alignment migration to DEV...\n')
    console.log('Target: DEV database')
    console.log('Migration: align_dev_timestamps_with_local.sql\n')

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      'drizzle/migrations/align_dev_timestamps_with_local.sql'
    )

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath)
      process.exit(1)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📝 Migration SQL:')
    console.log('─'.repeat(80))
    console.log(migrationSQL)
    console.log('─'.repeat(80))

    console.log('\n⚠️  This will modify the DEV database schema.')
    console.log('   All timestamp columns will be changed to timestamp(6)\n')

    // Split by semicolon and execute each statement
    // Remove comment lines first, then split
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')

    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log(`Executing ${statements.length} SQL statements...\n`)

    let successCount = 0
    for (const statement of statements) {
      if (statement.startsWith('SELECT')) {
        // This is the verification query at the end
        console.log('\n📊 Verification Results:')
        console.log('─'.repeat(80))
        const result = await db.execute(sql.raw(statement))
        console.table(result.rows)
        console.log('─'.repeat(80))
      } else {
        // Execute ALTER TABLE statements
        await db.execute(sql.raw(statement))
        successCount++

        // Extract table name from ALTER TABLE statement
        const match = statement.match(/ALTER TABLE (\w+)/)
        if (match) {
          console.log(`✅ Updated ${match[1]}`)
        }
      }
    }

    console.log(`\n✅ Migration complete! ${successCount} statements executed successfully.\n`)
    console.log('💡 Run the comparison script again to verify alignment:')
    console.log('   npx tsx scripts/compare-local-dev-schema.ts\n')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

applyMigration()
