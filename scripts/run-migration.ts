import postgres from 'postgres'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    throw new Error('No database connection string found')
  }

  console.log('Connecting to database...')
  const sql = postgres(connectionString, { max: 1 })

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', 'postgres', '0003_catalog_versioning.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Running migration...')
    await sql.unsafe(migrationSQL)

    console.log('✓ Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await sql.end()
  }
}

runMigration().catch((error) => {
  console.error(error)
  process.exit(1)
})
