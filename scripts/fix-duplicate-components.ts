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

async function fixDuplicates() {
  try {
    console.log('🔧 Fixing duplicate component relationships...\n')

    // Delete the newer duplicates (higher IDs)
    const duplicateIds = [128, 132, 133, 134, 135]

    console.log('Deleting duplicate entries with IDs:', duplicateIds)

    for (const id of duplicateIds) {
      const result = await db.execute(sql`
        DELETE FROM product_components
        WHERE id = ${id}
      `)
      console.log(`✅ Deleted entry with ID ${id}`)
    }

    console.log('\n✅ All duplicates removed!')

    // Verify no more duplicates exist
    const check = await db.execute(sql`
      SELECT
        parent_product_id,
        component_product_id,
        COUNT(*) as count
      FROM product_components
      GROUP BY parent_product_id, component_product_id
      HAVING COUNT(*) > 1
    `)

    if (check.rows.length === 0) {
      console.log('✅ Verified: No duplicate component relationships remain')
    } else {
      console.log('⚠️  Warning: Still found duplicates:')
      console.log(JSON.stringify(check.rows, null, 2))
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

fixDuplicates()
