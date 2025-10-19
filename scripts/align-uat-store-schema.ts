/**
 * Align UAT store schema (orders and order_items) with LOCAL/DEV
 * Truncates tables and updates schema
 */

import { config as dotenvConfig } from 'dotenv'

// Load environment variables
dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function alignUATStoreSchema() {
  const connectionString = process.env.UAT_DATABASE_URL

  if (!connectionString) {
    console.error('❌ UAT_DATABASE_URL environment variable not set')
    process.exit(1)
  }

  console.log('Connecting to UAT database...')
  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\n=== Aligning UAT store schema ===\n')

    // ========================================================================
    // Fix store.orders
    // ========================================================================
    console.log('ORDERS TABLE:')
    console.log('Truncating store.orders...')
    await sql.unsafe(`TRUNCATE TABLE store.orders CASCADE`)
    console.log('  ✓ Table truncated\n')

    // Drop cart_id column if it exists
    try {
      await sql.unsafe(`ALTER TABLE store.orders DROP COLUMN IF EXISTS cart_id`)
      console.log('  ✓ Dropped cart_id column\n')
    } catch (e) {
      console.log('  ~ cart_id column already removed\n')
    }

    // ========================================================================
    // Fix store.order_items
    // ========================================================================
    console.log('ORDER_ITEMS TABLE:')
    console.log('Truncating store.order_items...')
    await sql.unsafe(`TRUNCATE TABLE store.order_items CASCADE`)
    console.log('  ✓ Table truncated\n')

    // Drop old columns
    console.log('Dropping old columns:')
    await sql.unsafe(`ALTER TABLE store.order_items DROP COLUMN IF EXISTS variant_id`)
    console.log('  ✓ variant_id')

    await sql.unsafe(`ALTER TABLE store.order_items DROP COLUMN IF EXISTS variant_name`)
    console.log('  ✓ variant_name\n')

    // Add missing columns
    console.log('Adding missing columns:')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS product_slug text NOT NULL DEFAULT ''`
    )
    console.log('  ✓ product_slug')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS product_version integer NOT NULL DEFAULT 1`
    )
    console.log('  ✓ product_version')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'standalone'`
    )
    console.log('  ✓ product_type')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS component_tree jsonb NOT NULL DEFAULT '[]'`
    )
    console.log('  ✓ component_tree')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS base_price real NOT NULL DEFAULT 0`
    )
    console.log('  ✓ base_price')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS included_components_price real NOT NULL DEFAULT 0`
    )
    console.log('  ✓ included_components_price')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS optional_components_price real NOT NULL DEFAULT 0`
    )
    console.log('  ✓ optional_components_price')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS line_total real NOT NULL DEFAULT 0`
    )
    console.log('  ✓ line_total')

    await sql.unsafe(
      `ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS current_product_id text`
    )
    console.log('  ✓ current_product_id')

    console.log('\n✓ UAT store schema aligned successfully!')
    console.log('\nstore.orders: 33 columns (cart_id removed)')
    console.log('store.order_items: 18 columns (7 new, 2 old removed)')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    await sql.end()
    process.exit(1)
  }
}

alignUATStoreSchema()
