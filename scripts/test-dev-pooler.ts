import { Client } from 'pg'

// Try with pooler endpoint (like PRD uses)
const client = new Client({
  host: 'ep-rough-lab-addes3ze-pooler.c-2.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'd30dc874-9108-4e12-a18b-425e75ff883b!',
  ssl: {
    rejectUnauthorized: false,
  },
})

async function testConnection() {
  try {
    console.log('🔍 Testing DEV connection with POOLER endpoint...\n')

    await client.connect()
    console.log('✅ Connected successfully!')

    const result = await client.query('SELECT current_database() as db, current_user')
    console.log('Database:', result.rows[0].db)
    console.log('User:', result.rows[0].current_user)

    await client.end()
  } catch (error: any) {
    console.error('❌ Connection failed with pooler endpoint')
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    try {
      await client.end()
    } catch {}
    process.exit(1)
  }
}

testConnection()
