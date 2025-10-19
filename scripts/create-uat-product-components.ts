/**
 * Create catalog.product_components table in UAT
 */

import { config as dotenvConfig } from 'dotenv'

// Load environment variables
dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function createProductComponentsTable() {
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
    console.log('\n=== Creating catalog.product_components table ===\n')

    await sql.unsafe(`
      CREATE TABLE catalog.product_components (
        id serial PRIMARY KEY,
        parent_product_id text NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
        component_product_id text NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
        quantity integer NOT NULL DEFAULT 1,
        is_required boolean NOT NULL DEFAULT true,
        is_included boolean NOT NULL DEFAULT true,
        price_override real,
        display_name text,
        display_order integer NOT NULL DEFAULT 0,
        sort_order integer NOT NULL DEFAULT 0,
        notes text,
        created_at timestamptz(6) NOT NULL DEFAULT now(),
        updated_at timestamptz(6) NOT NULL DEFAULT now(),
        CONSTRAINT product_components_parent_product_id_component_product_id_unique UNIQUE (parent_product_id, component_product_id),
        CONSTRAINT no_self_reference CHECK (parent_product_id != component_product_id)
      )
    `)
    console.log('✓ catalog.product_components table created')

    console.log('\nTable structure:')
    console.log('  - id: serial (primary key)')
    console.log('  - parent_product_id: text (FK to products)')
    console.log('  - component_product_id: text (FK to products)')
    console.log('  - quantity: integer')
    console.log('  - is_required: boolean')
    console.log('  - is_included: boolean')
    console.log('  - price_override: real')
    console.log('  - display_name: text')
    console.log('  - display_order: integer')
    console.log('  - sort_order: integer')
    console.log('  - notes: text')
    console.log('  - created_at: timestamptz(6)')
    console.log('  - updated_at: timestamptz(6)')
    console.log('\nConstraints:')
    console.log('  - Unique constraint on (parent_product_id, component_product_id)')
    console.log('  - Check constraint: no self-reference')

    console.log('\n✓ Table creation completed successfully!')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Table creation failed:', error)
    await sql.end()
    process.exit(1)
  }
}

createProductComponentsTable()
