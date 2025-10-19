/**
 * Migrate Neon UAT database to modular schemas
 */

const postgres = require('postgres')

async function migrateUATDatabase() {
  // UAT connection string
  const connectionString =
    'postgresql://neondb_owner:f998ab36-768d-4389-917b-68435e3557bc!@ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

  console.log('Connecting to Neon UAT database...')
  console.log('Endpoint: ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech')

  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    // First check current state
    console.log('\n=== Current State ===')
    const currentTables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `

    const bySchema: Record<string, string[]> = {}
    currentTables.forEach((t: any) => {
      if (!bySchema[t.table_schema]) bySchema[t.table_schema] = []
      bySchema[t.table_schema].push(t.table_name)
    })

    Object.keys(bySchema)
      .sort()
      .forEach(schema => {
        console.log(`${schema}: ${bySchema[schema].join(', ')}`)
      })

    // Run migration
    console.log('\n=== Running Migration ===')

    console.log('Creating schemas...')
    await sql`CREATE SCHEMA IF NOT EXISTS auth`
    console.log('  ✓ auth schema created')
    await sql`CREATE SCHEMA IF NOT EXISTS catalog`
    console.log('  ✓ catalog schema created')
    await sql`CREATE SCHEMA IF NOT EXISTS store`
    console.log('  ✓ store schema created')

    console.log('\nMoving tables to new schemas...\n')

    // Auth schema tables
    console.log('Moving AUTH tables...')
    await sql`ALTER TABLE IF EXISTS public.users SET SCHEMA auth`
    console.log('  ✓ users → auth.users')

    await sql`ALTER TABLE IF EXISTS public.accounts SET SCHEMA auth`
    console.log('  ✓ accounts → auth.accounts')

    await sql`ALTER TABLE IF EXISTS public.sessions SET SCHEMA auth`
    console.log('  ✓ sessions → auth.sessions')

    await sql`ALTER TABLE IF EXISTS public.verification_tokens SET SCHEMA auth`
    console.log('  ✓ verification_tokens → auth.verification_tokens')

    await sql`ALTER TABLE IF EXISTS public.addresses SET SCHEMA auth`
    console.log('  ✓ addresses → auth.addresses')

    // Catalog schema tables
    console.log('\nMoving CATALOG tables...')
    await sql`ALTER TABLE IF EXISTS public.products SET SCHEMA catalog`
    console.log('  ✓ products → catalog.products')

    await sql`ALTER TABLE IF EXISTS public.product_components SET SCHEMA catalog`
    console.log('  ✓ product_components → catalog.product_components')

    // Store schema tables
    console.log('\nMoving STORE tables...')
    await sql`ALTER TABLE IF EXISTS public.carts SET SCHEMA store`
    console.log('  ✓ carts → store.carts')

    await sql`ALTER TABLE IF EXISTS public.cart_items SET SCHEMA store`
    console.log('  ✓ cart_items → store.cart_items')

    await sql`ALTER TABLE IF EXISTS public.orders SET SCHEMA store`
    console.log('  ✓ orders → store.orders')

    await sql`ALTER TABLE IF EXISTS public.order_items SET SCHEMA store`
    console.log('  ✓ order_items → store.order_items')

    // Verify final state
    console.log('\n=== Final State ===')
    const finalTables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `

    const finalBySchema: Record<string, string[]> = {}
    finalTables.forEach((t: any) => {
      if (!finalBySchema[t.table_schema]) finalBySchema[t.table_schema] = []
      finalBySchema[t.table_schema].push(t.table_name)
    })

    Object.keys(finalBySchema)
      .sort()
      .forEach(schema => {
        console.log(`${schema}: (${finalBySchema[schema].length} tables)`)
        finalBySchema[schema].forEach(table => {
          console.log(`  - ${table}`)
        })
      })

    console.log('\n✓ UAT Migration completed successfully!')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    await sql.end()
    process.exit(1)
  }
}

migrateUATDatabase()
