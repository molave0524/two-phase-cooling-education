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

async function checkProductImages() {
  try {
    console.log('🔍 Checking product images...\n')

    const result = await db.execute(sql`
      SELECT id, name, slug, images, product_type
      FROM products
      WHERE product_type = 'standalone'
      ORDER BY created_at DESC
      LIMIT 5
    `)

    console.log('Products with images:')
    result.rows.forEach((product: any) => {
      console.log('\n---')
      console.log('Product:', product.name)
      console.log('Slug:', product.slug)
      console.log('Type:', product.product_type)
      console.log('Images:', JSON.stringify(product.images, null, 2))
    })
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkProductImages()
