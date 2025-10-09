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

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate product IDs...\n')

    const result = await db.execute(sql`
      SELECT id, COUNT(*) as count
      FROM products
      GROUP BY id
      HAVING COUNT(*) > 1
    `)

    if (result.rows.length === 0) {
      console.log('✅ No duplicate product IDs found')
    } else {
      console.log('⚠️  Found duplicate product IDs:')
      console.log(JSON.stringify(result.rows, null, 2))
    }

    // Check for duplicate SKUs
    const skuResult = await db.execute(sql`
      SELECT sku, COUNT(*) as count
      FROM products
      GROUP BY sku
      HAVING COUNT(*) > 1
    `)

    if (skuResult.rows.length === 0) {
      console.log('✅ No duplicate SKUs found')
    } else {
      console.log('\n⚠️  Found duplicate SKUs:')
      console.log(JSON.stringify(skuResult.rows, null, 2))
    }

    // Check for prod_cable_cablemod specifically
    const cableResult = await db.execute(sql`
      SELECT id, name, sku, product_type
      FROM products
      WHERE id = 'prod_cable_cablemod'
    `)

    console.log('\n🔍 Products with ID prod_cable_cablemod:')
    console.log(JSON.stringify(cableResult.rows, null, 2))
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkDuplicates()
