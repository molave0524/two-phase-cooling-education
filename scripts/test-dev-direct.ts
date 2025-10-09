import postgres from 'postgres'

// Connect with separate parameters (no URL encoding needed)
const sql = postgres({
  host: 'ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  username: 'neondb_owner',
  password: 'd30dc874-9108-4e12-a18b-425e75ff883b!',
  ssl: 'require',
})

async function testConnection() {
  try {
    console.log('🔍 Testing DEV connection with direct parameters...\n')

    const result = await sql`SELECT current_database() as db, version() as ver`
    console.log('✅ Connected successfully!')
    console.log('Database:', result[0].db)
    console.log('Version:', result[0].ver.substring(0, 50))

    await sql.end()
  } catch (error) {
    console.error('❌ Connection failed:', error)
    await sql.end()
    process.exit(1)
  }
}

testConnection()
