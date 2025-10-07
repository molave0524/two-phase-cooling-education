/**
 * Apply Migration to Dev
 * Directly applies the migration SQL file to dev database
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function applyMigrationToDev() {
  const devUrl = process.env.DEV_POSTGRES_URL

  if (!devUrl) {
    console.error('❌ DEV_POSTGRES_URL not found in environment')
    process.exit(1)
  }

  const sql = postgres(devUrl, { max: 1 })

  try {
    // Get migration file from command line argument, default to latest
    const migrationFile = process.argv[2] || '0007_remove_created_at_from_sessions.sql'

    console.log(`🚀 Applying migration ${migrationFile} to DEV database...\n`)

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle/postgres', migrationFile)
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log(`Executing migration file...\n`)

    try {
      // Execute the entire migration as one transaction
      await sql.unsafe(migrationSQL)
      console.log(`✓ Migration executed successfully\n`)
    } catch (error: any) {
      console.error(`✗ Error:`, error.message)
      console.error(`\nFull error:`, error)
      throw error
    }

    console.log('✅ Migration applied successfully to DEV!')
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

applyMigrationToDev()
