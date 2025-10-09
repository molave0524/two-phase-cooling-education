import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function verifySharedComponents() {
  try {
    // Check which components are used by multiple builds
    const sharedComponents = await db.execute(sql`
      SELECT
        p.id,
        p.name,
        p.sku,
        COUNT(DISTINCT pc.parent_product_id) as used_in_builds,
        STRING_AGG(DISTINCT parent.name, ' | ') as build_names
      FROM products p
      INNER JOIN product_components pc ON p.id = pc.component_product_id
      INNER JOIN products parent ON pc.parent_product_id = parent.id
      WHERE p.product_type = 'component'
      GROUP BY p.id, p.name, p.sku
      HAVING COUNT(DISTINCT pc.parent_product_id) > 1
      ORDER BY used_in_builds DESC, p.name
    `)

    console.log('🔗 Shared Components (used in multiple builds):\n')
    for (const row of sharedComponents.rows as any[]) {
      console.log(`${row.name}`)
      console.log(`  SKU: ${row.sku}`)
      console.log(`  Used in ${row.used_in_builds} builds: ${row.build_names}`)
      console.log()
    }

    // Show all components for Content Creator Build
    const ccComponents = await db.execute(sql`
      SELECT
        p.name as component_name,
        p.sku,
        pc.quantity,
        pc.display_name,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM product_components pc2
            WHERE pc2.component_product_id = p.id
            AND pc2.parent_product_id != pc.parent_product_id
          ) THEN 'SHARED'
          ELSE 'UNIQUE'
        END as component_status
      FROM product_components pc
      INNER JOIN products p ON pc.component_product_id = p.id
      WHERE pc.parent_product_id = 'prod_content_creator_build'
      ORDER BY pc.display_order
    `)

    console.log('📦 Content Creator Build Components:\n')
    for (const row of ccComponents.rows as any[]) {
      const badge = row.component_status === 'SHARED' ? ' [SHARED]' : ''
      console.log(`${row.display_name}: ${row.component_name}${badge}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

verifySharedComponents()
