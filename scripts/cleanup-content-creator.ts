import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function cleanup() {
  try {
    await db.execute(sql`
      DELETE FROM products WHERE id IN (
        'prod_cpu_7950x',
        'prod_mobo_x670e',
        'prod_gpu_4070ti',
        'prod_cooler_x73',
        'prod_ssd_990pro_2tb_cc',
        'prod_content_creator_build'
      )
    `)
    console.log('✅ Deleted all Content Creator products')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

cleanup()
