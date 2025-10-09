// Check Neon DEV database using environment variable
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const NEON_DEV_URL = process.env.DEV_POSTGRES_URL

if (!NEON_DEV_URL) {
  console.error('❌ DEV_POSTGRES_URL not found in .env.local')
  process.exit(1)
}

async function checkNeonDev() {
  const sql = postgres(NEON_DEV_URL)

  try {
    console.log('\n🔍 Connecting to Neon DEV database...\n')

    const dbInfo = await sql`SELECT current_database() as db, version() as ver`
    console.log('📊 Database:', dbInfo[0].db)
    console.log('📊 Version:', dbInfo[0].ver.substring(0, 50) + '...')

    const productCount = await sql`SELECT COUNT(*) as count FROM products`
    console.log(`\n📦 Products in Neon DEV: ${productCount[0].count}`)

    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    console.log(`\n📋 Tables: ${tables.length}`)
    tables.forEach(t => console.log(`   - ${t.tablename}`))

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    await sql.end()
    process.exit(1)
  }
}

checkNeonDev()
