import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function checkVisibility() {
  try {
    console.log('🔍 Analyzing Component Visibility on Products Page\n')

    // What the products page shows (product_type = 'component')
    const componentsShown = await db.execute(sql`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.product_type,
        p.is_available_for_purchase,
        EXISTS (
          SELECT 1 FROM product_components pc
          WHERE pc.component_product_id = p.id
        ) as is_used_in_builds,
        EXISTS (
          SELECT 1 FROM product_components pc
          WHERE pc.parent_product_id = p.id
        ) as has_children
      FROM products p
      WHERE p.product_type = 'component'
      AND p.is_available_for_purchase = true
      ORDER BY p.name
    `)

    console.log(`📦 Components with product_type='component' AND is_available_for_purchase=true:`)
    console.log(`   Total: ${componentsShown.rows.length}\n`)

    // Check specifically for water cooling items
    const wcItems = (componentsShown.rows as any[]).filter(
      r =>
        r.sku.includes('WCL') ||
        r.name.toLowerCase().includes('water') ||
        r.name.toLowerCase().includes('coolant') ||
        r.name.toLowerCase().includes('ek')
    )

    console.log('   Water Cooling Related Items:')
    for (const item of wcItems) {
      console.log(`   • ${item.name}`)
      console.log(`     SKU: ${item.sku}`)
      console.log(`     Available: ${item.is_available_for_purchase ? '✅' : '❌'}`)
      console.log(`     Used in builds: ${item.is_used_in_builds ? 'Yes' : 'No'}`)
      console.log(`     Has children: ${item.has_children ? 'Yes (Kit)' : 'No'}`)
      console.log()
    }

    // Check coolant specifically
    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('🔬 Coolant Analysis:\n')

    const coolant = await db.execute(sql`
      SELECT
        p.*,
        EXISTS (
          SELECT 1 FROM product_components pc
          WHERE pc.component_product_id = p.id
        ) as is_part_of_something
      FROM products p
      WHERE p.sku = 'TPC-WCL-FLD-V01'
    `)

    const coolantData = coolant.rows[0] as any
    console.log(`   Name: ${coolantData.name}`)
    console.log(`   SKU: ${coolantData.sku}`)
    console.log(`   Product Type: ${coolantData.product_type}`)
    console.log(
      `   Is Available for Purchase: ${coolantData.is_available_for_purchase ? '✅ Yes' : '❌ No'}`
    )
    console.log(`   In Stock: ${coolantData.in_stock ? 'Yes' : 'No'}`)
    console.log(`   Status: ${coolantData.status}`)
    console.log(
      `   Is Part of Another Product: ${coolantData.is_part_of_something ? 'Yes (Water Cooling Kit)' : 'No'}`
    )

    // Check where coolant is used
    const coolantUsage = await db.execute(sql`
      SELECT
        parent.name as parent_name,
        parent.product_type as parent_type,
        pc.display_name
      FROM product_components pc
      INNER JOIN products parent ON pc.parent_product_id = parent.id
      WHERE pc.component_product_id = ${coolantData.id}
    `)

    console.log(`\n   Used in:`)
    for (const usage of coolantUsage.rows as any[]) {
      console.log(`   • ${usage.parent_name} (${usage.parent_type}) as "${usage.display_name}"`)
    }

    console.log('\n\n═══════════════════════════════════════════════════════════')
    console.log('💡 ISSUE IDENTIFIED:\n')
    console.log('   The coolant IS available for purchase (✅)')
    console.log("   BUT it's a Level 2 component (inside Water Cooling Kit)")
    console.log('   ')
    console.log('   The products page likely shows:')
    console.log('   - Standalone builds (product_type = "standalone")')
    console.log('   - Direct components (product_type = "component")')
    console.log('   ')
    console.log('   Since coolant is nested inside the kit, it might not show')
    console.log('   unless the UI supports showing nested/sub-components.')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkVisibility()
