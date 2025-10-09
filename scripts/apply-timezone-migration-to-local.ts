import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const LOCAL_POSTGRES_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!LOCAL_POSTGRES_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  console.error('   Please check your .env.local configuration')
  process.exit(1)
}

const pool = new Pool({ connectionString: LOCAL_POSTGRES_URL })
const db = drizzle(pool)

async function applyMigration() {
  try {
    console.log('🔧 Applying timezone migration to LOCAL database...\n')
    console.log('Target: LOCAL database')
    console.log('Migration: local_timestamps_with_timezone.sql\n')

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      'drizzle/migrations/local_timestamps_with_timezone.sql'
    )

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath)
      process.exit(1)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📝 Migration Summary:')
    console.log('─'.repeat(80))
    console.log('Changing all timestamp columns from:')
    console.log('  timestamp(6) without time zone')
    console.log('To:')
    console.log('  timestamp(6) with time zone')
    console.log('─'.repeat(80))

    console.log('\n⚠️  This will modify the LOCAL database schema.')
    console.log('   All timestamp columns will become timezone-aware\n')

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
    console.log('💡 All timestamp columns are now timezone-aware (timestamp with time zone)\n')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

applyMigration()
