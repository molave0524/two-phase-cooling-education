/**
 * Update UAT timestamp precision to timestamptz(6)
 */

const postgres = require('postgres')

async function updateUATPrecision() {
  const connectionString =
    'postgresql://neondb_owner:f998ab36-768d-4389-917b-68435e3557bc!@ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

  console.log('Connecting to UAT database...')
  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\n=== Updating timestamp precision to timestamptz(6) ===\n')

    // Auth schema
    console.log('AUTH schema:')
    await sql.unsafe(`ALTER TABLE auth.addresses ALTER COLUMN created_at TYPE timestamptz(6)`)
    console.log('  ✓ addresses.created_at')

    await sql.unsafe(`ALTER TABLE auth.addresses ALTER COLUMN updated_at TYPE timestamptz(6)`)
    console.log('  ✓ addresses.updated_at')

    await sql.unsafe(`ALTER TABLE auth.sessions ALTER COLUMN expires TYPE timestamptz(6)`)
    console.log('  ✓ sessions.expires')

    await sql.unsafe(`ALTER TABLE auth.users ALTER COLUMN email_verified TYPE timestamptz(6)`)
    console.log('  ✓ users.email_verified')

    await sql.unsafe(
      `ALTER TABLE auth.users ALTER COLUMN email_verification_expires TYPE timestamptz(6)`
    )
    console.log('  ✓ users.email_verification_expires')

    await sql.unsafe(
      `ALTER TABLE auth.users ALTER COLUMN reset_password_expires TYPE timestamptz(6)`
    )
    console.log('  ✓ users.reset_password_expires')

    await sql.unsafe(`ALTER TABLE auth.users ALTER COLUMN created_at TYPE timestamptz(6)`)
    console.log('  ✓ users.created_at')

    await sql.unsafe(`ALTER TABLE auth.users ALTER COLUMN updated_at TYPE timestamptz(6)`)
    console.log('  ✓ users.updated_at')

    await sql.unsafe(
      `ALTER TABLE auth.verification_tokens ALTER COLUMN expires TYPE timestamptz(6)`
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
        `ALTER TABLE catalog.product_components ALTER COLUMN created_at TYPE timestamptz(6)`
      )
      console.log('  ✓ product_components.created_at')

      await sql.unsafe(
        `ALTER TABLE catalog.product_components ALTER COLUMN updated_at TYPE timestamptz(6)`
      )
      console.log('  ✓ product_components.updated_at')
    } else {
      console.log('  ~ product_components table does not exist')
    }

    await sql.unsafe(`ALTER TABLE catalog.products ALTER COLUMN created_at TYPE timestamptz(6)`)
    console.log('  ✓ products.created_at')

    await sql.unsafe(`ALTER TABLE catalog.products ALTER COLUMN updated_at TYPE timestamptz(6)`)
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
      await sql.unsafe(`ALTER TABLE catalog.products ALTER COLUMN sunset_date TYPE timestamptz(6)`)
      console.log('  ✓ products.sunset_date')
    }

    if (productCols.find((c: any) => c.column_name === 'discontinued_date')) {
      await sql.unsafe(
        `ALTER TABLE catalog.products ALTER COLUMN discontinued_date TYPE timestamptz(6)`
      )
      console.log('  ✓ products.discontinued_date')
    }

    // Store schema
    console.log('\nSTORE schema:')
    await sql.unsafe(`ALTER TABLE store.cart_items ALTER COLUMN created_at TYPE timestamptz(6)`)
    console.log('  ✓ cart_items.created_at')

    await sql.unsafe(`ALTER TABLE store.cart_items ALTER COLUMN updated_at TYPE timestamptz(6)`)
    console.log('  ✓ cart_items.updated_at')

    await sql.unsafe(`ALTER TABLE store.carts ALTER COLUMN created_at TYPE timestamptz(6)`)
    console.log('  ✓ carts.created_at')

    await sql.unsafe(`ALTER TABLE store.carts ALTER COLUMN updated_at TYPE timestamptz(6)`)
    console.log('  ✓ carts.updated_at')

    await sql.unsafe(`ALTER TABLE store.order_items ALTER COLUMN created_at TYPE timestamptz(6)`)
    console.log('  ✓ order_items.created_at')

    await sql.unsafe(`ALTER TABLE store.orders ALTER COLUMN estimated_delivery TYPE timestamptz(6)`)
    console.log('  ✓ orders.estimated_delivery')

    await sql.unsafe(`ALTER TABLE store.orders ALTER COLUMN paid_at TYPE timestamptz(6)`)
    console.log('  ✓ orders.paid_at')

    await sql.unsafe(`ALTER TABLE store.orders ALTER COLUMN shipped_at TYPE timestamptz(6)`)
    console.log('  ✓ orders.shipped_at')

    await sql.unsafe(`ALTER TABLE store.orders ALTER COLUMN delivered_at TYPE timestamptz(6)`)
    console.log('  ✓ orders.delivered_at')

    await sql.unsafe(`ALTER TABLE store.orders ALTER COLUMN cancelled_at TYPE timestamptz(6)`)
    console.log('  ✓ orders.cancelled_at')

    await sql.unsafe(`ALTER TABLE store.orders ALTER COLUMN created_at TYPE timestamptz(6)`)
    console.log('  ✓ orders.created_at')

    await sql.unsafe(`ALTER TABLE store.orders ALTER COLUMN updated_at TYPE timestamptz(6)`)
    console.log('  ✓ orders.updated_at')

    console.log('\n✓ UAT precision update completed successfully!')
    console.log('\nAll timestamp columns now use timestamptz(6)')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Update failed:', error)
    await sql.end()
    process.exit(1)
  }
}

updateUATPrecision()
