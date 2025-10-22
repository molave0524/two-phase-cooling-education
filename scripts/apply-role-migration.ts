import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: '.env.local' })

async function applyMigration() {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  console.log('Applying role column migration to remote database...')

  const sql = postgres(dbUrl, { max: 1 })

  try {
    await sql`ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'customer' NOT NULL`
    console.log('✓ Migration applied successfully')
  } catch (error) {
    console.error('✗ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

applyMigration()
