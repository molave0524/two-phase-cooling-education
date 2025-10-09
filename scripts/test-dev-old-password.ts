import { Client } from 'pg'

// Try with the OLD password that was in the original scripts
const client = new Client({
  host: 'ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_2LT0RAEwKjeN',
  ssl: {
    rejectUnauthorized: false,
  },
})

async function testConnection() {
  try {
    console.log('🔍 Testing DEV connection with OLD password...\n')

    await client.connect()
    console.log('✅ Connected successfully with OLD password!')

    const result = await client.query('SELECT current_database() as db, current_user')
    console.log('Database:', result.rows[0].db)
    console.log('User:', result.rows[0].current_user)

    await client.end()
  } catch (error: any) {
    console.error('❌ Connection failed with OLD password')
    console.error('Error code:', error.code)
    try {
      await client.end()
    } catch {}
    process.exit(1)
  }
}

testConnection()
