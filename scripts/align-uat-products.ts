/**
 * Align UAT catalog.products schema with LOCAL/DEV
 * Truncates table and adds missing columns
 */

const postgres = require('postgres')

async function alignUATProducts() {
  const connectionString =
    'postgresql://neondb_owner:f998ab36-768d-4389-917b-68435e3557bc!@ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

  console.log('Connecting to UAT database...')
  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\n=== Aligning catalog.products schema ===\n')

    // Truncate table first
    console.log('Truncating catalog.products...')
    await sql.unsafe(`TRUNCATE TABLE catalog.products CASCADE`)
    console.log('  ✓ Table truncated\n')

    // Add missing columns
    console.log('Adding missing columns:')

    // SKU versioning fields
    await sql.unsafe(
      `ALTER TABLE catalog.products ADD COLUMN sku_prefix varchar(3) NOT NULL DEFAULT 'TPC'`
    )
    console.log('  ✓ sku_prefix')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD COLUMN sku_category varchar(3) NOT NULL DEFAULT 'XXX'`
    )
    console.log('  ✓ sku_category')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD COLUMN sku_product_code varchar(3) NOT NULL DEFAULT 'XXX'`
    )
    console.log('  ✓ sku_product_code')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD COLUMN sku_version varchar(3) NOT NULL DEFAULT 'V01'`
    )
    console.log('  ✓ sku_version')

    // Pricing
    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN component_price real`)
    console.log('  ✓ component_price')

    // Versioning fields
    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN version integer NOT NULL DEFAULT 1`)
    console.log('  ✓ version')

    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN base_product_id text`)
    console.log('  ✓ base_product_id')

    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN previous_version_id text`)
    console.log('  ✓ previous_version_id')

    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN replaced_by text`)
    console.log('  ✓ replaced_by')

    // Lifecycle management
    await sql.unsafe(
      `ALTER TABLE catalog.products ADD COLUMN status text NOT NULL DEFAULT 'active'`
    )
    console.log('  ✓ status')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD COLUMN is_available_for_purchase boolean NOT NULL DEFAULT true`
    )
    console.log('  ✓ is_available_for_purchase')

    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN sunset_date timestamptz(6)`)
    console.log('  ✓ sunset_date')

    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN discontinued_date timestamptz(6)`)
    console.log('  ✓ discontinued_date')

    await sql.unsafe(`ALTER TABLE catalog.products ADD COLUMN sunset_reason text`)
    console.log('  ✓ sunset_reason')

    // Product type
    await sql.unsafe(
      `ALTER TABLE catalog.products ADD COLUMN product_type text NOT NULL DEFAULT 'standalone'`
    )
    console.log('  ✓ product_type')

    // Add foreign key constraints
    console.log('\nAdding foreign key constraints:')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD CONSTRAINT products_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES catalog.products(id)`
    )
    console.log('  ✓ previous_version_id foreign key')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD CONSTRAINT products_replaced_by_fkey FOREIGN KEY (replaced_by) REFERENCES catalog.products(id)`
    )
    console.log('  ✓ replaced_by foreign key')

    // Add check constraints for SKU fields
    console.log('\nAdding check constraints:')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD CONSTRAINT sku_prefix_format CHECK (LENGTH(sku_prefix) = 3 AND sku_prefix NOT LIKE '% %')`
    )
    console.log('  ✓ sku_prefix_format')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD CONSTRAINT sku_category_format CHECK (LENGTH(sku_category) = 3 AND sku_category NOT LIKE '% %')`
    )
    console.log('  ✓ sku_category_format')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD CONSTRAINT sku_product_code_format CHECK (LENGTH(sku_product_code) = 3 AND sku_product_code NOT LIKE '% %')`
    )
    console.log('  ✓ sku_product_code_format')

    await sql.unsafe(
      `ALTER TABLE catalog.products ADD CONSTRAINT sku_version_format CHECK (LENGTH(sku_version) = 3 AND sku_version NOT LIKE '% %')`
    )
    console.log('  ✓ sku_version_format')

    console.log('\n✓ UAT catalog.products schema aligned successfully!')
    console.log('\nTotal columns should now match LOCAL/DEV (36 columns)')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    await sql.end()
    process.exit(1)
  }
}

alignUATProducts()
