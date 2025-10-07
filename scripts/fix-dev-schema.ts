/**
 * Fix Dev Schema - Add Missing Columns
 * Manually adds columns that drizzle-kit failed to add
 */

import postgres from 'postgres'

async function fixDevSchema() {
  const devUrl = process.env.DEV_POSTGRES_URL

  if (!devUrl) {
    console.error('❌ DEV_POSTGRES_URL not found in environment')
    process.exit(1)
  }

  const sql = postgres(devUrl, { max: 1 })

  try {
    console.log('🔧 Fixing order_items table in dev database...\n')

    // Add all missing columns
    console.log('Adding missing columns...')
    await sql`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS product_slug text DEFAULT '' NOT NULL,
      ADD COLUMN IF NOT EXISTS product_version integer DEFAULT 1 NOT NULL,
      ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'standalone' NOT NULL,
      ADD COLUMN IF NOT EXISTS component_tree jsonb DEFAULT '[]' NOT NULL,
      ADD COLUMN IF NOT EXISTS base_price real DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS included_components_price real DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS optional_components_price real DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS line_total real DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS current_product_id text
    `
    console.log('✓ All columns added\n')

    // Remove old variant columns
    console.log('Removing old variant columns...')
    await sql`
      ALTER TABLE order_items
      DROP COLUMN IF EXISTS variant_id,
      DROP COLUMN IF EXISTS variant_name
    `
    console.log('✓ Old columns removed\n')

    console.log('✅ Dev schema fixed successfully!')
  } catch (error) {
    console.error('❌ Error fixing schema:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

fixDevSchema()
