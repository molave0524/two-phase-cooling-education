/**
 * Add product_slug column to order_items table
 */

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function migrate() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    throw new Error('No database connection string found')
  }

  console.log('Connecting to database...')
  const sql = postgres(connectionString, { max: 1 })

  try {
    console.log('\nAdding product_slug column to order_items...')

    await sql`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS product_slug TEXT NOT NULL DEFAULT ''
    `

    console.log('✅ Column added successfully!')

    // Update existing records to have slugs based on product_id
    console.log('\nUpdating existing order items with slugs...')

    await sql`
      UPDATE order_items
      SET product_slug = LOWER(REPLACE(product_id, '_', '-'))
      WHERE product_slug = ''
    `

    console.log('✅ Updated existing records!')

  } catch (error) {
    console.error('Error running migration:', error)
    throw error
  } finally {
    await sql.end()
  }
}

migrate()
  .then(() => {
    console.log('\nMigration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
