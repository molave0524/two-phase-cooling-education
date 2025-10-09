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

async function checkProducts() {
  try {
    const result = await db.execute(sql`
      SELECT id, name, slug, product_type, status, is_available_for_purchase
      FROM products
      WHERE product_type = 'standalone'
      ORDER BY created_at DESC
    `)

    console.log('📊 Standalone Products:')
    console.log(JSON.stringify(result.rows, null, 2))

    const allProducts = await db.execute(sql`
      SELECT product_type, COUNT(*) as count
      FROM products
      GROUP BY product_type
    `)

    console.log('\n📈 Products by type:')
    console.log(JSON.stringify(allProducts.rows, null, 2))
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkProducts()
