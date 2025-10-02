/* eslint-disable no-console */
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const connectionString = envVars.POSTGRES_URL

async function migrate() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Connected to production database')

    // Add productSku column to order_items if it doesn't exist
    console.log('Adding productSku column to order_items table...')
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'order_items' AND column_name = 'product_sku'
          ) THEN
              ALTER TABLE order_items ADD COLUMN product_sku TEXT NOT NULL DEFAULT '';
          END IF;
      END $$;
    `)
    console.log('productSku column added successfully')

    // Verify the changes
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `)

    console.log('\norder_items table schema:')
    result.rows.forEach(row => {
      console.log(
        `  ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`
      )
    })
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\nMigration completed successfully!')
  }
}

migrate()
