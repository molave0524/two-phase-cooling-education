/**
 * Final fix for user_id conversion
 * Uses actual constraint names from the database
 */
import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

async function fixUserIdType() {
  const sql = postgres(process.env.DEV_POSTGRES_URL!, { max: 1 })

  try {
    console.log('🔧 Converting user_id from INTEGER to TEXT...\n')

    // Step 1: Drop ACTUAL FK constraints (only sessions has one)
    console.log('Step 1: Dropping FK constraint...')
    await sql`ALTER TABLE auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey`
    console.log('✅ FK constraint dropped\n')

    // Step 2: Convert auth.users.id
    console.log('Step 2: Converting auth.users.id to TEXT...')
    await sql`ALTER TABLE auth.users ALTER COLUMN id DROP DEFAULT`
    await sql`ALTER TABLE auth.users ALTER COLUMN id TYPE TEXT USING id::text`
    await sql`DROP SEQUENCE IF EXISTS auth.users_id_seq`
    console.log('✅ auth.users.id is now TEXT\n')

    // Step 3: Convert user_id columns
    console.log('Step 3: Converting user_id columns to TEXT...')

    // Check if accounts.user_id exists
    const accountsCol = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'accounts' AND column_name = 'user_id'
    `
    if (accountsCol.length > 0) {
      await sql`ALTER TABLE auth.accounts ALTER COLUMN user_id TYPE TEXT USING user_id::text`
      console.log('  ✓ auth.accounts.user_id')
    }

    await sql`ALTER TABLE auth.sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text`
    console.log('  ✓ auth.sessions.user_id')

    // Check if addresses exists
    const addressesCol = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'addresses' AND column_name = 'user_id'
    `
    if (addressesCol.length > 0) {
      await sql`ALTER TABLE auth.addresses ALTER COLUMN user_id DROP DEFAULT`
      await sql`ALTER TABLE auth.addresses ALTER COLUMN user_id TYPE TEXT USING user_id::text`
      console.log('  ✓ auth.addresses.user_id')
    }

    // Check if carts.user_id exists
    const cartsCol = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'store' AND table_name = 'carts' AND column_name = 'user_id'
    `
    if (cartsCol.length > 0) {
      await sql`ALTER TABLE store.carts ALTER COLUMN user_id TYPE TEXT USING user_id::text`
      console.log('  ✓ store.carts.user_id')
    }

    // Check if orders.user_id exists
    const ordersCol = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'store' AND table_name = 'orders' AND column_name = 'user_id'
    `
    if (ordersCol.length > 0) {
      await sql`ALTER TABLE store.orders ALTER COLUMN user_id TYPE TEXT USING user_id::text`
      console.log('  ✓ store.orders.user_id')
    }

    console.log('\n✅ All user_id columns converted!\n')

    // Step 4: Recreate FK constraint for sessions
    console.log('Step 4: Recreating FK constraint...')
    await sql`
      ALTER TABLE auth.sessions
      ADD CONSTRAINT sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    `
    console.log('✅ FK constraint recreated\n')

    // Verify
    const check = await sql`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id'
    `
    console.log(`\n✅ COMPLETE! auth.users.id is now: ${check[0].data_type.toUpperCase()}\n`)
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await sql.end()
  }
}

fixUserIdType()
