import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Try connecting with explicit Neon-compatible SSL settings
const client = new Client({
  host: 'ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'd30dc874-9108-4e12-a18b-425e75ff883b!',
  ssl: {
    rejectUnauthorized: false,
  },
  // Neon-specific settings
  options: '-c statement_timeout=60000',
  connectionTimeoutMillis: 10000,
})

async function testConnection() {
  try {
    console.log('🔍 Testing DEV connection with Neon-specific settings...\n')

    await client.connect()
    console.log('✅ Connected successfully!')

    const result = await client.query('SELECT current_database() as db, version() as ver')
    console.log('Database:', result.rows[0].db)
    console.log('Version:', result.rows[0].ver.substring(0, 50))

    // Try to see what user we connected as
    const userResult = await client.query('SELECT current_user, session_user')
    console.log('Current user:', userResult.rows[0])

    await client.end()
  } catch (error) {
    console.error('❌ Connection failed:', error)
    try {
      await client.end()
    } catch {}
    process.exit(1)
  }
}

testConnection()
