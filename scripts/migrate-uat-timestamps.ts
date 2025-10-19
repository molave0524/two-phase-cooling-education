/**
 * Migrate UAT timestamp columns to timestamptz to match LOCAL and DEV
 */

const postgres = require('postgres')

async function migrateUATTimestamps() {
  const connectionString =
    'postgresql://neondb_owner:f998ab36-768d-4389-917b-68435e3557bc!@ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

  console.log('Connecting to UAT database...')
  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\n=== Migrating timestamps to timestamptz ===\n')

    // Auth schema
    console.log('AUTH schema:')
    await sql.unsafe(
      `ALTER TABLE auth.addresses ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ addresses.created_at')

    await sql.unsafe(
      `ALTER TABLE auth.addresses ALTER COLUMN updated_at TYPE timestamptz(6) USING updated_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ addresses.updated_at')

    // Fix sessions table structure to match schema
    console.log('\\nFIXING sessions table structure:')

    // Rename expires_at to expires and convert to timestamptz
    await sql.unsafe(`ALTER TABLE auth.sessions RENAME COLUMN expires_at TO expires`)
    console.log('  ✓ Renamed expires_at to expires')

    await sql.unsafe(
      `ALTER TABLE auth.sessions ALTER COLUMN expires TYPE timestamptz(6) USING expires AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ Converted expires to timestamptz(6)')

    // Drop created_at (not in schema)
    await sql.unsafe(`ALTER TABLE auth.sessions DROP COLUMN created_at`)
    console.log('  ✓ Dropped created_at')

    // Add session_token (missing from UAT)
    await sql.unsafe(`ALTER TABLE auth.sessions ADD COLUMN session_token text NOT NULL DEFAULT ''`)
    console.log('  ✓ Added session_token')

    await sql.unsafe(
      `ALTER TABLE auth.sessions ADD CONSTRAINT sessions_session_token_unique UNIQUE (session_token)`
    )
    console.log('  ✓ Added unique constraint on session_token')

    await sql.unsafe(
      `ALTER TABLE auth.users ALTER COLUMN email_verified TYPE timestamptz(6) USING email_verified AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ users.email_verified')

    await sql.unsafe(
      `ALTER TABLE auth.users ALTER COLUMN email_verification_expires TYPE timestamptz(6) USING email_verification_expires AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ users.email_verification_expires')

    await sql.unsafe(
      `ALTER TABLE auth.users ALTER COLUMN reset_password_expires TYPE timestamptz(6) USING reset_password_expires AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ users.reset_password_expires')

    await sql.unsafe(
      `ALTER TABLE auth.users ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ users.created_at')

    await sql.unsafe(
      `ALTER TABLE auth.users ALTER COLUMN updated_at TYPE timestamptz(6) USING updated_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ users.updated_at')

    await sql.unsafe(
      `ALTER TABLE auth.verification_tokens ALTER COLUMN expires TYPE timestamptz(6) USING expires AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ verification_tokens.expires')

    // Catalog schema
    console.log('\nCATALOG schema:')

    // Check if product_components exists
    const productComponentsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'catalog'
        AND table_name = 'product_components'
      ) as exists
    `

    if (productComponentsExists[0].exists) {
      await sql.unsafe(
        `ALTER TABLE catalog.product_components ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
      )
      console.log('  ✓ product_components.created_at')

      await sql.unsafe(
        `ALTER TABLE catalog.product_components ALTER COLUMN updated_at TYPE timestamptz(6) USING updated_at AT TIME ZONE 'UTC'`
      )
      console.log('  ✓ product_components.updated_at')
    } else {
      console.log(
        '  ~ product_components table does not exist (OK - may not have been created yet)'
      )
    }

    await sql.unsafe(
      `ALTER TABLE catalog.products ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ products.created_at')

    await sql.unsafe(
      `ALTER TABLE catalog.products ALTER COLUMN updated_at TYPE timestamptz(6) USING updated_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ products.updated_at')

    // Check for sunset_date and discontinued_date columns
    const productCols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'catalog'
        AND table_name = 'products'
        AND column_name IN ('sunset_date', 'discontinued_date')
    `

    if (productCols.find((c: any) => c.column_name === 'sunset_date')) {
      await sql.unsafe(
        `ALTER TABLE catalog.products ALTER COLUMN sunset_date TYPE timestamptz(6) USING sunset_date AT TIME ZONE 'UTC'`
      )
      console.log('  ✓ products.sunset_date')
    }

    if (productCols.find((c: any) => c.column_name === 'discontinued_date')) {
      await sql.unsafe(
        `ALTER TABLE catalog.products ALTER COLUMN discontinued_date TYPE timestamptz(6) USING discontinued_date AT TIME ZONE 'UTC'`
      )
      console.log('  ✓ products.discontinued_date')
    }

    // Store schema
    console.log('\nSTORE schema:')
    await sql.unsafe(
      `ALTER TABLE store.cart_items ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ cart_items.created_at')

    await sql.unsafe(
      `ALTER TABLE store.cart_items ALTER COLUMN updated_at TYPE timestamptz(6) USING updated_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ cart_items.updated_at')

    await sql.unsafe(
      `ALTER TABLE store.carts ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ carts.created_at')

    await sql.unsafe(
      `ALTER TABLE store.carts ALTER COLUMN updated_at TYPE timestamptz(6) USING updated_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ carts.updated_at')

    await sql.unsafe(
      `ALTER TABLE store.order_items ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ order_items.created_at')

    await sql.unsafe(
      `ALTER TABLE store.orders ALTER COLUMN estimated_delivery TYPE timestamptz(6) USING estimated_delivery AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ orders.estimated_delivery')

    await sql.unsafe(
      `ALTER TABLE store.orders ALTER COLUMN paid_at TYPE timestamptz(6) USING paid_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ orders.paid_at')

    await sql.unsafe(
      `ALTER TABLE store.orders ALTER COLUMN shipped_at TYPE timestamptz(6) USING shipped_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ orders.shipped_at')

    await sql.unsafe(
      `ALTER TABLE store.orders ALTER COLUMN delivered_at TYPE timestamptz(6) USING delivered_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ orders.delivered_at')

    await sql.unsafe(
      `ALTER TABLE store.orders ALTER COLUMN cancelled_at TYPE timestamptz(6) USING cancelled_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ orders.cancelled_at')

    await sql.unsafe(
      `ALTER TABLE store.orders ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ orders.created_at')

    await sql.unsafe(
      `ALTER TABLE store.orders ALTER COLUMN updated_at TYPE timestamptz(6) USING updated_at AT TIME ZONE 'UTC'`
    )
    console.log('  ✓ orders.updated_at')

    console.log('\n✓ UAT timestamp migration completed successfully!')
    console.log('\nAll timestamp columns converted to timestamptz (timestamp with time zone)')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    await sql.end()
    process.exit(1)
  }
}

migrateUATTimestamps()
