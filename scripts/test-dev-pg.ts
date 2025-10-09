import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const DEV_URL = process.env.DEV_POSTGRES_URL

if (!DEV_URL) {
  console.error('❌ DEV_POSTGRES_URL not found')
  process.exit(1)
}

console.log('🔍 Testing DEV connection with pg Pool...\n')
console.log('Connection string (masked):', DEV_URL.replace(/:[^:@]+@/, ':****@'))

const pool = new Pool({
  connectionString: DEV_URL,
  ssl: { rejectUnauthorized: false },
})

async function testConnection() {
  try {
    const result = await pool.query('SELECT current_database() as db, version() as ver')
    console.log('\n✅ Connected successfully!')
    console.log('Database:', result.rows[0].db)
    console.log('Version:', result.rows[0].ver.substring(0, 50))

    await pool.end()
  } catch (error) {
    console.error('\n❌ Connection failed:', error)
    await pool.end()
    process.exit(1)
  }
}

testConnection()
