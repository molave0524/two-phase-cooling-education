import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function analyzeHierarchyDepth() {
  try {
    console.log('🔍 Analyzing Product Hierarchy Depth...\n')

    // Level 0: Root products (products that are parents but never children)
    const level0 = await db.execute(sql`
      SELECT p.id, p.name, p.product_type, p.sku
      FROM products p
      WHERE EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.parent_product_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.component_product_id = p.id
      )
      ORDER BY p.name
    `)

    console.log('📦 LEVEL 0 (Root Products - Standalone Builds):')
    console.log(`   Found: ${level0.rows.length} products\n`)
    for (const row of level0.rows as any[]) {
      console.log(`   • ${row.name}`)
      console.log(`     SKU: ${row.sku} | Type: ${row.product_type}`)
    }
    console.log()

    // Level 1: Products that are components of Level 0 but not parents themselves
    const level1 = await db.execute(sql`
      SELECT DISTINCT p.id, p.name, p.product_type, p.sku
      FROM products p
      WHERE EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.component_product_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.parent_product_id = p.id
      )
      ORDER BY p.name
    `)

    console.log('📦 LEVEL 1 (Leaf Components - not further decomposed):')
    console.log(`   Found: ${level1.rows.length} products\n`)
    console.log(`   Sample components:`)
    for (const row of (level1.rows as any[]).slice(0, 5)) {
      console.log(`   • ${row.name} (${row.sku})`)
    }
    if (level1.rows.length > 5) {
      console.log(`   ... and ${level1.rows.length - 5} more`)
    }
    console.log()

    // Check for Level 2: Products that are both components AND parents (nested)
    const level2 = await db.execute(sql`
      SELECT p.id, p.name, p.product_type, p.sku
      FROM products p
      WHERE EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.component_product_id = p.id
      )
      AND EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.parent_product_id = p.id
      )
      ORDER BY p.name
    `)

    console.log('📦 LEVEL 1.5 (Intermediate Components - both parent and component):')
    console.log(`   Found: ${level2.rows.length} products\n`)
    if (level2.rows.length > 0) {
      for (const row of level2.rows as any[]) {
        console.log(`   • ${row.name}`)
        console.log(`     SKU: ${row.sku} | Type: ${row.product_type}`)
      }
      console.log()
    } else {
      console.log('   None found - hierarchy is 2 levels deep (standalone → components)\n')
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📊 HIERARCHY SUMMARY:')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(
      `   Total Products: ${level0.rows.length + level1.rows.length + level2.rows.length}`
    )
    console.log(`   Standalone Builds (Level 0): ${level0.rows.length}`)
    console.log(`   Leaf Components (Level 1): ${level1.rows.length}`)
    console.log(`   Nested Components (Level 1.5): ${level2.rows.length}`)
    console.log()

    if (level2.rows.length === 0) {
      console.log('   ✅ Hierarchy Structure: 2-Level (Parent → Components)')
      console.log('   ')
      console.log('      Standalone Build')
      console.log('      └── Component 1')
      console.log('      └── Component 2')
      console.log('      └── Component 3...')
    } else {
      console.log('   ✅ Hierarchy Structure: Multi-Level (Nested)')
    }
    console.log()

    // Show products not in any relationship
    const orphans = await db.execute(sql`
      SELECT p.id, p.name, p.product_type, p.sku
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.component_product_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM product_components pc
        WHERE pc.parent_product_id = p.id
      )
      ORDER BY p.name
    `)

    if (orphans.rows.length > 0) {
      console.log(`⚠️  ORPHANED PRODUCTS (not in any relationship): ${orphans.rows.length}`)
      for (const row of orphans.rows as any[]) {
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

analyzeHierarchyDepth()
