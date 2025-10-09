import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })
const db = drizzle(pool)

async function checkComponentSKUs() {
  try {
    const result = await db.execute(sql`
      SELECT id, name, sku, sku_category
      FROM products
      WHERE product_type = 'component'
      ORDER BY sku_category, name
    `)

    console.log('📦 All Component Products:\n')
    for (const row of result.rows as any[]) {
      console.log(`${row.sku_category?.padEnd(20)} | SKU: ${row.sku?.padEnd(10)} | ${row.name}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkComponentSKUs()
