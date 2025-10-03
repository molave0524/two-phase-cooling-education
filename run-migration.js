/* eslint-disable no-console */
/**
 * Production Database Migration Script
 * Executes PostgreSQL schema migration on Neon database
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const connectionString =
  'postgresql://neondb_owner:npg_2LT0RAEwKjeN@ep-damp-fire-ad4x3c36-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log('Connecting to production database...')
    await client.connect()
    console.log('✓ Connected successfully\n')

    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'migrate-postgres-schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Executing migration...')
    console.log('='.repeat(60))

    // Execute migration
    const result = await client.query(migrationSQL)

    console.log('='.repeat(60))
    console.log('✓ Migration completed successfully!\n')

    // Display any notices from the migration
    if (result.rows && result.rows.length > 0) {
      console.log('Migration summary:')
      result.rows.forEach(row => {
        console.log(row)
      })
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✓ Database connection closed')
  }
}

runMigration()
