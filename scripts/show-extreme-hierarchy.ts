import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function showHierarchy() {
  try {
    console.log('🏗️  3-LEVEL PRODUCT HIERARCHY: Extreme PC Build\n')
    console.log('═══════════════════════════════════════════════════════════\n')

    // Level 0: Extreme PC Build
    const build = await db.execute(sql`
      SELECT * FROM products WHERE id = 'prod_extreme_wc_pc_001'
    `)
    const buildData = build.rows[0] as any

    console.log(`📦 LEVEL 0: ${buildData.name}`)
    console.log(`   Price: $${buildData.price.toFixed(2)} | SKU: ${buildData.sku}`)
    console.log(
      `   Available for Purchase: ${buildData.is_available_for_purchase ? '✅ Yes' : '❌ No'}\n`
    )

    // Get Level 1 components
    const level1 = await db.execute(sql`
      SELECT
        pc.display_name,
        pc.quantity,
        p.id,
        p.name,
        p.sku,
        p.price,
        p.product_type,
        p.is_available_for_purchase,
        EXISTS (
          SELECT 1 FROM product_components pc2
          WHERE pc2.parent_product_id = p.id
        ) as has_children
      FROM product_components pc
      INNER JOIN products p ON pc.component_product_id = p.id
      WHERE pc.parent_product_id = 'prod_extreme_wc_pc_001'
      ORDER BY pc.display_order
    `)

    console.log('   └── LEVEL 1 Components:')
    for (const comp of level1.rows as any[]) {
      const qty = comp.quantity > 1 ? ` (x${comp.quantity})` : ''
      const available = comp.is_available_for_purchase ? '✅' : '❌'
      console.log(`\n       ├── ${comp.display_name}${qty}`)
      console.log(`       │   ${comp.name}`)
      console.log(`       │   $${comp.price.toFixed(2)} | SKU: ${comp.sku}`)
      console.log(`       │   Available for Purchase: ${available}`)

      // If this component has children (Level 2), show them
      if (comp.has_children) {
        const level2 = await db.execute(sql`
          SELECT
            pc.display_name,
            pc.quantity,
            p.name,
            p.sku,
            p.price,
            p.is_available_for_purchase
          FROM product_components pc
          INNER JOIN products p ON pc.component_product_id = p.id
          WHERE pc.parent_product_id = ${comp.id}
          ORDER BY pc.display_order
        `)

        console.log(`       │   └── LEVEL 2 Sub-components:`)
        for (const sub of level2.rows as any[]) {
          const subQty = sub.quantity > 1 ? ` (x${sub.quantity})` : ''
          const subAvailable = sub.is_available_for_purchase ? '✅' : '❌'
          console.log(`       │       ├── ${sub.display_name}${subQty}`)
          console.log(`       │       │   ${sub.name}`)
          console.log(`       │       │   $${sub.price.toFixed(2)} | SKU: ${sub.sku}`)
          console.log(`       │       │   Available for Purchase: ${subAvailable}`)
        }
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════')
    console.log('📊 PURCHASE AVAILABILITY SUMMARY:')
    console.log('═══════════════════════════════════════════════════════════\n')

    const available = await db.execute(sql`
      SELECT COUNT(*) as count FROM products
      WHERE is_available_for_purchase = true
    `)

    const notAvailable = await db.execute(sql`
      SELECT name, sku FROM products
      WHERE is_available_for_purchase = false
      ORDER BY name
    `)

    console.log(
      `✅ Available for individual purchase: ${(available.rows[0] as any).count} products`
    )
    console.log(`❌ NOT available for individual purchase: ${notAvailable.rows.length} products`)

    if (notAvailable.rows.length > 0) {
      console.log(`\nKit-only items (cannot be purchased individually):`)
      for (const item of notAvailable.rows as any[]) {
        console.log(`   • ${item.name} (${item.sku})`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

showHierarchy()
