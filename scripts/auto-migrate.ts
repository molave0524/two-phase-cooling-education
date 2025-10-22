/**
 * Automatic Database Migration Script
 * Runs migrations automatically during Vercel deployments
 *
 * This script:
 * 1. Detects the environment (develop, uat, main)
 * 2. Runs pending migrations against the appropriate database
 * 3. Logs results for deployment tracking
 */

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function runMigrations() {
  const env = process.env.VERCEL_GIT_COMMIT_REF || process.env.NODE_ENV || 'development'
  const dbUrl = process.env.DATABASE_URL

  console.log(`[AUTO-MIGRATE] Starting migrations for environment: ${env}`)
  console.log(`[AUTO-MIGRATE] Database URL configured: ${dbUrl ? 'Yes' : 'No'}`)

  if (!dbUrl) {
    console.error('[AUTO-MIGRATE] ERROR: DATABASE_URL not set')
    process.exit(1)
  }

  try {
    // Create postgres connection for migrations
    const migrationClient = postgres(dbUrl, { max: 1 })
    const db = drizzle(migrationClient)

    console.log('[AUTO-MIGRATE] Running migrations...')

    // Run migrations from the postgres folder
    await migrate(db, { migrationsFolder: './drizzle/postgres' })

    console.log('[AUTO-MIGRATE] ✓ Migrations completed successfully')

    // Close connection
    await migrationClient.end()

    process.exit(0)
  } catch (error) {
    console.error('[AUTO-MIGRATE] ✗ Migration failed:', error)
    console.error(
      '[AUTO-MIGRATE] Error details:',
      error instanceof Error ? error.message : String(error)
    )

    // Exit with error code to fail the build if migrations fail
    process.exit(1)
  }
}

// Run migrations
runMigrations().catch(err => {
  console.error('[AUTO-MIGRATE] Unexpected error:', err)
  process.exit(1)
})
