/**
 * Move Tables to New Schemas
 * Execute ALTER TABLE statements to move tables from public to domain schemas
 */

import { config as dotenvConfig } from 'dotenv'

// Load environment variables from .env.local
dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function moveTables() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

  console.log('Connecting to database...')
  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\nCreating schemas...')
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

    console.log('\n✓ All tables moved successfully!')
    console.log('\nSchema organization:')
    console.log('  auth.*    - users, accounts, sessions, verification_tokens, addresses')
    console.log('  catalog.* - products, product_components')
    console.log('  store.*   - carts, cart_items, orders, order_items')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    await sql.end()
    process.exit(1)
  }
}

moveTables()
