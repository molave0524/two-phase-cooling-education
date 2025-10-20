/**
 * Manually apply user_id conversion
 * Run the ALTER statements from migration 0014 directly
 */
import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

async function fixUserIdType() {
  const sql = postgres(process.env.DEV_POSTGRES_URL!, { max: 1 })

  try {
    console.log('🔧 Manually converting user_id from INTEGER to TEXT...\n')

    // Step 1: Drop FK constraints
    console.log('Step 1: Dropping foreign key constraints...')
    await sql`ALTER TABLE auth.accounts DROP CONSTRAINT IF EXISTS accounts_user_id_users_id_fk`
    await sql`ALTER TABLE auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_users_id_fk`
    await sql`ALTER TABLE auth.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_users_id_fk`
    await sql`ALTER TABLE store.carts DROP CONSTRAINT IF EXISTS carts_user_id_users_id_fk`
    await sql`ALTER TABLE store.orders DROP CONSTRAINT IF EXISTS orders_user_id_users_id_fk`
    console.log('✅ FK constraints dropped\n')

    // Step 2: Convert auth.users.id
    console.log('Step 2: Converting auth.users.id...')
    await sql`ALTER TABLE auth.users ALTER COLUMN id DROP DEFAULT`
    await sql`ALTER TABLE auth.users ALTER COLUMN id TYPE TEXT USING id::text`
    await sql`DROP SEQUENCE IF EXISTS auth.users_id_seq`
    console.log('✅ auth.users.id converted to TEXT\n')

    // Step 3: Convert user_id columns
    console.log('Step 3: Converting user_id foreign key columns...')
    await sql`ALTER TABLE auth.accounts ALTER COLUMN user_id TYPE TEXT USING user_id::text`
    await sql`ALTER TABLE auth.sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text`
    await sql`ALTER TABLE auth.addresses ALTER COLUMN user_id DROP DEFAULT`
    await sql`ALTER TABLE auth.addresses ALTER COLUMN user_id TYPE TEXT USING user_id::text`
    await sql`ALTER TABLE store.carts ALTER COLUMN user_id TYPE TEXT USING user_id::text`
    await sql`ALTER TABLE store.orders ALTER COLUMN user_id TYPE TEXT USING user_id::text`
    console.log('✅ All user_id columns converted to TEXT\n')

    // Step 4: Recreate FK constraints
    console.log('Step 4: Recreating foreign key constraints...')
    await sql`
      ALTER TABLE auth.accounts
      ADD CONSTRAINT accounts_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    `
    await sql`
      ALTER TABLE auth.sessions
      ADD CONSTRAINT sessions_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    `
    await sql`
      ALTER TABLE auth.addresses
      ADD CONSTRAINT addresses_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    `
    await sql`
      ALTER TABLE store.carts
      ADD CONSTRAINT carts_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    `
    await sql`
      ALTER TABLE store.orders
      ADD CONSTRAINT orders_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
    `
    console.log('✅ FK constraints recreated\n')

    //  Verify
    const check = await sql`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id'
    `
    console.log(
      `\n✅ Conversion complete! auth.users.id is now: ${check[0].data_type.toUpperCase()}\n`
    )
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await sql.end()
  }
}

fixUserIdType()
