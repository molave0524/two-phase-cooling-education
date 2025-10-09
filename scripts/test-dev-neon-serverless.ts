import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const DEV_URL = process.env.DEV_POSTGRES_URL

if (!DEV_URL) {
  console.error('❌ DEV_POSTGRES_URL not found')
  process.exit(1)
}

async function testConnection() {
  try {
    console.log('🔍 Testing DEV with Neon serverless driver...\n')

    const sql = neon(DEV_URL)
    const result = await sql`SELECT current_database() as db, current_user, version()`

    console.log('✅ Connected successfully!')
    console.log('Database:', result[0].db)
    console.log('User:', result[0].current_user)
    console.log('Version:', result[0].version.substring(0, 50))
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message)
    console.error('Code:', error.code)
    process.exit(1)
  }
}

testConnection()
