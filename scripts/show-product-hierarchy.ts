import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function showProductHierarchy() {
  try {
    // Get the Content Creator build details
    const build = await db.execute(sql`
      SELECT id, name, sku, price, product_type
      FROM products
      WHERE id = 'prod_content_creator_build'
    `)

    const buildData = build.rows[0] as any

    console.log('🏗️  PRODUCT HIERARCHY: Content Creator Workstation Build')
    console.log('═══════════════════════════════════════════════════════════════\n')
    console.log(`📦 ${buildData.name}`)
    console.log(`   SKU: ${buildData.sku}`)
    console.log(`   Price: $${buildData.price.toFixed(2)}`)
    console.log(`   Type: ${buildData.product_type}\n`)

    // Get all components
    const components = await db.execute(sql`
      SELECT
        pc.display_order,
        pc.display_name,
        pc.quantity,
        p.id,
        p.name,
        p.sku,
        p.price,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM product_components pc2
            WHERE pc2.component_product_id = p.id
            AND pc2.parent_product_id != pc.parent_product_id
          ) THEN true
          ELSE false
        END as is_shared
      FROM product_components pc
      INNER JOIN products p ON pc.component_product_id = p.id
      WHERE pc.parent_product_id = 'prod_content_creator_build'
      ORDER BY pc.display_order
    `)

    console.log('   └── Components:')
    console.log(
      '       ├─────────────────────────────────────────────────────────────────────────────────'
    )

    let totalPrice = 0
    for (const row of components.rows as any[]) {
      const sharedBadge = row.is_shared ? ' 🔗 [SHARED]' : ''
      const price = row.price * row.quantity
      totalPrice += price
      const qty = row.quantity > 1 ? ` (x${row.quantity})` : ''

      console.log(`       │ ${row.display_name}${qty}${sharedBadge}`)
      console.log(`       │   ├── ${row.name}`)
      console.log(`       │   ├── SKU: ${row.sku}`)
      console.log(`       │   ├── Price: $${price.toFixed(2)}`)
      console.log(`       │   └── ID: ${row.id}`)
      console.log('       │')
    }

    console.log(
      '       └─────────────────────────────────────────────────────────────────────────────────'
    )
    console.log(`\n   Total Component Price: $${totalPrice.toFixed(2)}`)
    console.log(`   Standalone Build Price: $${buildData.price.toFixed(2)}`)
    console.log(`   Assembly/Labor Markup: $${(buildData.price - totalPrice).toFixed(2)}\n`)

    // Show which products share components
    const sharedWith = await db.execute(sql`
      SELECT DISTINCT
        parent.id,
        parent.name,
        parent.sku
      FROM product_components pc
      INNER JOIN products parent ON pc.parent_product_id = parent.id
      WHERE pc.component_product_id IN (
        SELECT component_product_id
        FROM product_components
        WHERE parent_product_id = 'prod_content_creator_build'
      )
      AND pc.parent_product_id != 'prod_content_creator_build'
    `)

    if (sharedWith.rows.length > 0) {
      console.log('🔗 Shares components with:')
      for (const row of sharedWith.rows as any[]) {
        console.log(`   • ${row.name} (${row.sku})`)
      }
      console.log()
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

showProductHierarchy()
