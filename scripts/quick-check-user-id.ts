import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

async function check() {
  const sql = postgres(process.env.DEV_POSTGRES_URL!, { max: 1 })
  try {
    const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id'
    `
    console.log('auth.users.id:', result[0])

    const result2 = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'accounts' AND column_name = 'user_id'
    `
    console.log('auth.accounts.user_id:', result2[0])
  } finally {
    await sql.end()
  }
}
check()
