/**
 * Test connection to DEV database
 */
import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

async function testConnection() {
  const connectionUrl = process.env.DEV_POSTGRES_URL

  if (!connectionUrl) {
    console.error('❌ DEV_POSTGRES_URL not found in environment')
    process.exit(1)
  }

  console.log('🔌 Testing connection to DEV database...\n')
  console.log('URL:', connectionUrl.replace(/:[^:@]+@/, ':***@'))

  const sql = postgres(connectionUrl, { max: 1 })

  try {
    // Test connection
    const result = await sql`SELECT current_database(), current_user, version()`
    console.log('\n✅ Connection successful!')
    console.log('Database:', result[0].current_database)
    console.log('User:', result[0].current_user)
    console.log('\n📋 Checking for drizzle migrations table...')

    const tables = await sql`
      SELECT schemaname, tablename FROM pg_tables
      WHERE schemaname IN ('public', 'auth', 'catalog', 'store', 'drizzle')
      ORDER BY schemaname, tablename
    `
    console.log(`\nFound ${tables.length} tables`)

    if (tables.length > 0) {
      console.log('\nTables:')
      tables.forEach((t: any) => console.log(`  - ${t.schemaname}.${t.tablename}`))
    }

    // Check for __drizzle_migrations table
    const drizzleMigrations = await sql`
      SELECT * FROM information_schema.tables
      WHERE table_name = '__drizzle_migrations'
    `
    console.log(
      `\n📝 Drizzle migrations table exists: ${drizzleMigrations.length > 0 ? 'YES' : 'NO'}`
    )

    if (drizzleMigrations.length > 0) {
      const appliedMigrations = await sql`
        SELECT * FROM __drizzle_migrations ORDER BY created_at
      `
      console.log(`Applied migrations: ${appliedMigrations.length}`)
      appliedMigrations.forEach((m: any) =>
        console.log(`  - ${m.hash} (${new Date(m.created_at).toISOString()})`)
      )
    }

    // Check schemas
    const schemas = await sql`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `
    console.log(`\n📁 Schemas:`)
    schemas.forEach((s: any) => console.log(`  - ${s.schema_name}`))
  } catch (error) {
    console.error('\n❌ Connection failed!')
    if (error instanceof Error) {
      console.error('Error:', error.message)
      console.error('\nStack:', error.stack)
    }
    process.exit(1)
  } finally {
    await sql.end()
  }
}

testConnection()
