import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function rollback() {
  try {
    console.log('🔄 Rolling back previous nesting changes...\n')

    // Delete the water cooling kit (need to delete relationships first due to foreign key)
    console.log('1️⃣ Deleting Water Cooling Kit...')
    await db.execute(
      sql`DELETE FROM product_components WHERE parent_product_id = 'prod_wc_kit_extreme' OR component_product_id = 'prod_wc_kit_extreme'`
    )
    await db.execute(sql`DELETE FROM products WHERE id = 'prod_wc_kit_extreme'`)
    console.log('   ✅ Deleted\n')

    // Re-add individual water cooling components to Extreme PC
    console.log('2️⃣ Re-adding individual water cooling components to Extreme PC...')

    const wcComponents = await db.execute(sql`
      SELECT id, name, sku FROM products
      WHERE sku IN (
        'TPC-WCL-CPB-V01', 'TPC-WCL-GPB-V01', 'TPC-WCL-R36-V01',
        'TPC-WCL-R3P-V01', 'TPC-WCL-R12-V01', 'TPC-WCL-PMP-V01',
        'TPC-FAN-QL3-V01', 'TPC-WCL-TUB-V01', 'TPC-WCL-FIT-V01',
        'TPC-WCL-FLD-V01', 'TPC-RGB-CMD-V01', 'TPC-FAN-OCT-V01',
        'TPC-WCL-TMP-V01', 'TPC-CAB-CMB-V01'
      )
    `)

    const mappings = [
      { sku: 'TPC-WCL-CPB-V01', name: 'CPU Water Block', order: 100 },
      { sku: 'TPC-WCL-GPB-V01', name: 'GPU Water Block', order: 110 },
      { sku: 'TPC-WCL-R36-V01', name: 'Front Radiator (360mm)', order: 120 },
      { sku: 'TPC-WCL-R3P-V01', name: 'Top Radiator (360mm)', order: 130 },
      { sku: 'TPC-WCL-R12-V01', name: 'Rear Radiator (120mm)', order: 140 },
      { sku: 'TPC-WCL-PMP-V01', name: 'Pump/Reservoir', order: 150 },
      { sku: 'TPC-FAN-QL3-V01', name: 'RGB Fans (9 total)', order: 160, qty: 3 },
      { sku: 'TPC-WCL-TUB-V01', name: 'Hard Tubing', order: 170 },
      { sku: 'TPC-WCL-FIT-V01', name: 'Fittings Kit', order: 180 },
      { sku: 'TPC-WCL-FLD-V01', name: 'Coolant', order: 190 },
      { sku: 'TPC-RGB-CMD-V01', name: 'RGB Controller', order: 200 },
      { sku: 'TPC-FAN-OCT-V01', name: 'Fan Controller', order: 210 },
      { sku: 'TPC-WCL-TMP-V01', name: 'Temperature Sensors', order: 220 },
      { sku: 'TPC-CAB-CMB-V01', name: 'Custom Cables', order: 230 },
    ]

    for (const mapping of mappings) {
      const component = (wcComponents.rows as any[]).find((r: any) => r.sku === mapping.sku)
      if (component) {
        await db.execute(sql`
          INSERT INTO product_components (
            parent_product_id, component_product_id, quantity,
            is_required, is_included, display_name, display_order, sort_order
          ) VALUES (
            'prod_extreme_wc_pc_001', ${component.id}, ${mapping.qty || 1},
            true, true, ${mapping.name}, ${mapping.order}, ${mapping.order}
          )
          ON CONFLICT DO NOTHING
        `)
      }
    }
    console.log('   ✅ Re-added components\n')

    // Reset is_available_for_purchase for tubing and fittings
    console.log('3️⃣ Resetting purchase availability...')
    await db.execute(sql`
      UPDATE products
      SET is_available_for_purchase = true
      WHERE sku IN ('TPC-WCL-TUB-V01', 'TPC-WCL-FIT-V01')
    `)
    console.log('   ✅ Reset\n')

    // Drop the can_purchase_individually column if it exists
    console.log('4️⃣ Dropping can_purchase_individually column...')
    await db.execute(sql`
      ALTER TABLE products
      DROP COLUMN IF EXISTS can_purchase_individually
    `)
    console.log('   ✅ Dropped\n')

    console.log('✅ Rollback complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

rollback()
