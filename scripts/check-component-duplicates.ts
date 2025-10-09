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

async function checkComponentDuplicates() {
  try {
    console.log('🔍 Checking for duplicate component relationships...\n')

    // Find cases where the same component appears multiple times in the same parent
    const result = await db.execute(sql`
      SELECT
        parent_product_id,
        component_product_id,
        COUNT(*) as count
      FROM product_components
      GROUP BY parent_product_id, component_product_id
      HAVING COUNT(*) > 1
    `)

    if (result.rows.length === 0) {
      console.log('✅ No duplicate component relationships found')
    } else {
      console.log('⚠️  Found duplicate component relationships:')
      console.log(JSON.stringify(result.rows, null, 2))

      // Get details for these duplicates
      for (const row of result.rows) {
        const details = await db.execute(sql`
          SELECT
            pc.*,
            p_parent.name as parent_name,
            p_comp.name as component_name
          FROM product_components pc
          JOIN products p_parent ON pc.parent_product_id = p_parent.id
          JOIN products p_comp ON pc.component_product_id = p_comp.id
          WHERE pc.parent_product_id = ${(row as any).parent_product_id}
          AND pc.component_product_id = ${(row as any).component_product_id}
        `)

        console.log('\n📋 Details for duplicate:')
        console.log(JSON.stringify(details.rows, null, 2))
      }
    }

    // Check specifically for prod_cable_cablemod
    const cableResult = await db.execute(sql`
      SELECT
        pc.*,
        p_parent.name as parent_name,
        p_comp.name as component_name
      FROM product_components pc
      JOIN products p_parent ON pc.parent_product_id = p_parent.id
      JOIN products p_comp ON pc.component_product_id = p_comp.id
      WHERE pc.component_product_id = 'prod_cable_cablemod'
    `)

    console.log('\n🔍 Usages of prod_cable_cablemod:')
    console.log(JSON.stringify(cableResult.rows, null, 2))
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkComponentDuplicates()
