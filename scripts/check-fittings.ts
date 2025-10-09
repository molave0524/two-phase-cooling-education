import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function checkFittings() {
  const result = await db.execute(sql`
    SELECT
      id, name, sku, slug,
      is_available_for_purchase,
      in_stock,
      status
    FROM products
    WHERE slug = 'ek-torque-fittings-30pc'
  `)

  console.log('EK Torque Fittings Kit:\n')
  const product = result.rows[0] as any
  console.log('  Name:', product.name)
  console.log('  SKU:', product.sku)
  console.log('  Slug:', product.slug)
  console.log('  is_available_for_purchase:', product.is_available_for_purchase)
  console.log('  in_stock:', product.in_stock)
  console.log('  status:', product.status)

  console.log('\n Expected behavior:')
  if (product.is_available_for_purchase === false) {
    console.log('  ❌ This product should NOT be available for individual purchase')
    console.log('  ❌ The "Add to Cart" button should be DISABLED or show "Kit Only"')
    console.log('  ✅ This product can ONLY be purchased as part of the Water Cooling Kit')
  } else {
    console.log('  ✅ This product CAN be purchased individually')
  }

  await pool.end()
}

checkFittings()
