import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const url = process.env.DEV_POSTGRES_URL

if (url) {
  const parsed = new URL(url)
  console.log('🔍 Parsed URL components:')
  console.log('Host:', parsed.hostname)
  console.log('Port:', parsed.port)
  console.log('Database:', parsed.pathname.substring(1))
  console.log('Username:', parsed.username)
  console.log('Password length:', parsed.password.length)
  console.log('Password:', parsed.password)
  console.log('Search params:', parsed.search)
} else {
  console.log('❌ DEV_POSTGRES_URL not found')
}
