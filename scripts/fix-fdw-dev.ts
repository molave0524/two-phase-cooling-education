import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const LOCAL_DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL
const DEV_DB_URL = process.env.DEV_POSTGRES_URL

if (!LOCAL_DB_URL) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

if (!DEV_DB_URL) {
  console.error('❌ DEV_POSTGRES_URL not found')
  process.exit(1)
}

// Extract connection details from DEV URL
const devUrl = new URL(DEV_DB_URL)
const devPassword = devUrl.password

async function fixFDW() {
  const pool = new Pool({ connectionString: LOCAL_DB_URL })
  const db = drizzle(pool)

  try {
    console.log('🔧 Fixing FDW server for DEV with new password...\n')

    // Drop old server
    await db.execute(sql.raw(`DROP SERVER IF EXISTS dev_server CASCADE`))
    console.log('✅ Dropped old dev_server')

    // Create new server
    await db.execute(
      sql.raw(`
      CREATE SERVER dev_server
      FOREIGN DATA WRAPPER postgres_fdw
      OPTIONS (
        host 'ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech',
        dbname 'neondb',
        port '5432',
        sslmode 'require'
      )
    `)
    )
    console.log('✅ Created new dev_server')

    // Create user mapping with new password
    await db.execute(
      sql.raw(`
      CREATE USER MAPPING FOR CURRENT_USER
      SERVER dev_server
      OPTIONS (
        user 'neondb_owner',
        password '${devPassword}'
      )
    `)
    )
    console.log('✅ Created user mapping with new password')

    // Create schema and import
    await db.execute(sql.raw(`DROP SCHEMA IF EXISTS dev_remote CASCADE`))
    await db.execute(sql.raw(`CREATE SCHEMA dev_remote`))
    await db.execute(
      sql.raw(`
      IMPORT FOREIGN SCHEMA public
      FROM SERVER dev_server
      INTO dev_remote
    `)
    )
    console.log('✅ Imported foreign schema')

    console.log('\n✅ FDW server fixed successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

fixFDW()
