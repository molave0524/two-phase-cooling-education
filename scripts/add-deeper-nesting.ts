import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

async function addDeeperNesting() {
  try {
    console.log('🔧 Adding deeper product nesting...\n')

    // Step 1: Add can_purchase_individually column
    console.log('1️⃣ Adding can_purchase_individually column...')
    await db.execute(sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS can_purchase_individually BOOLEAN DEFAULT true
    `)
    console.log('   ✅ Column added\n')

    // Step 2: Set all current products to purchasable individually
    console.log('2️⃣ Setting existing products as individually purchasable...')
    await db.execute(sql`
      UPDATE products SET can_purchase_individually = true
    `)
    console.log('   ✅ Updated\n')

    // Step 3: Create "Custom Water Cooling Kit" bundle
    console.log('3️⃣ Creating Water Cooling Kit bundle...')
    const kitResult = await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase, can_purchase_individually,
        version, created_at, updated_at
      ) VALUES (
        'prod_wc_kit_extreme',
        'Extreme Water Cooling Kit - Complete Loop',
        'extreme-water-cooling-kit',
        'TPC-KIT-WCE-V01', 'TPC', 'KIT', 'WCE', 'V01',
        1299.99, 1499.99, 1299.99, 'USD',
        'Complete custom water cooling kit including CPU/GPU blocks, triple radiators, pump/reservoir combo, hard tubing, fittings, and premium coolant. Everything needed for a high-performance custom loop.',
        'Complete Custom Loop Kit - CPU + GPU Blocks, Triple Radiators',
        '[
          "CPU + GPU water blocks included",
          "Triple radiator setup (360+360+120mm)",
          "D5 pump with 300ml reservoir",
          "Premium PETG tubing and fittings",
          "RGB lighting throughout",
          "Professional-grade coolant"
        ]'::jsonb,
        '{
          "cooling_capacity": "1000W+",
          "radiator_total": "840mm",
          "includes": ["CPU Block", "GPU Block", "3x Radiators", "Pump/Res", "Tubing", "Fittings", "Coolant"],
          "compatibility": "Intel/AMD CPUs, RTX 4090 GPU"
        }'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop", "altText": "Water Cooling Kit", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&h=600&fit=crop", "altText": "Kit Contents", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=600&fit=crop", "altText": "Installed System", "type": "gallery"}
        ]'::jsonb,
        '["Components", "Water Cooling", "Kits"]'::jsonb,
        '["water-cooling", "custom-loop", "kit", "bundle"]'::jsonb,
        true, 10, '1-2 business days',
        'component', 'active', true, true,
        1, NOW(), NOW()
      ) RETURNING id
    `)
    const kitId = kitResult.rows[0].id
    console.log(`   ✅ Created kit: ${kitId}\n`)

    // Step 4: Get IDs of water cooling components from Extreme PC
    console.log('4️⃣ Finding water cooling components...')
    const wcComponents = await db.execute(sql`
      SELECT id, name, sku FROM products
      WHERE sku IN (
        'TPC-WCL-CPB-V01',  -- CPU Water Block
        'TPC-WCL-GPB-V01',  -- GPU Water Block
        'TPC-WCL-R36-V01',  -- 360mm XE Radiator
        'TPC-WCL-R3P-V01',  -- 360mm PE Radiator
        'TPC-WCL-R12-V01',  -- 120mm SE Radiator
        'TPC-WCL-PMP-V01',  -- Pump/Res Combo
        'TPC-WCL-TUB-V01',  -- PETG Tubing
        'TPC-WCL-FIT-V01',  -- Fittings Kit
        'TPC-WCL-FLD-V01'   -- Coolant
      )
    `)
    console.log(`   ✅ Found ${wcComponents.rows.length} components\n`)

    // Step 5: Link water cooling components to the kit
    console.log('5️⃣ Linking components to Water Cooling Kit...')
    const componentMappings = [
      { sku: 'TPC-WCL-CPB-V01', name: 'CPU Water Block', order: 10 },
      { sku: 'TPC-WCL-GPB-V01', name: 'GPU Water Block', order: 20 },
      { sku: 'TPC-WCL-R36-V01', name: 'Top Radiator (360mm XE)', order: 30 },
      { sku: 'TPC-WCL-R3P-V01', name: 'Front Radiator (360mm PE)', order: 40 },
      { sku: 'TPC-WCL-R12-V01', name: 'Rear Radiator (120mm SE)', order: 50 },
      { sku: 'TPC-WCL-PMP-V01', name: 'Pump/Reservoir Combo', order: 60 },
      { sku: 'TPC-WCL-TUB-V01', name: 'Hard Tubing (3m)', order: 70 },
      { sku: 'TPC-WCL-FIT-V01', name: 'Fittings Kit (30pc)', order: 80 },
      { sku: 'TPC-WCL-FLD-V01', name: 'Premium Coolant (2L)', order: 90 },
    ]

    for (const mapping of componentMappings) {
      const component = (wcComponents.rows as any[]).find((r: any) => r.sku === mapping.sku)
      if (component) {
        await db.execute(sql`
          INSERT INTO product_components (
            parent_product_id, component_product_id, quantity,
            is_required, is_included, display_name, display_order, sort_order
          ) VALUES (
            ${kitId}, ${component.id}, 1,
            true, true, ${mapping.name}, ${mapping.order}, ${mapping.order}
          )
        `)
        console.log(`   ✅ Linked: ${mapping.name}`)
      }
    }
    console.log()

    // Step 6: Update Extreme PC build to use the kit instead of individual components
    console.log('6️⃣ Updating Extreme PC build to use Water Cooling Kit...')

    // First, remove individual water cooling component links from Extreme PC
    await db.execute(sql`
      DELETE FROM product_components
      WHERE parent_product_id = 'prod_extreme_wc_pc_001'
      AND component_product_id IN (
        SELECT id FROM products WHERE sku IN (
          'TPC-WCL-CPB-V01', 'TPC-WCL-GPB-V01', 'TPC-WCL-R36-V01',
          'TPC-WCL-R3P-V01', 'TPC-WCL-R12-V01', 'TPC-WCL-PMP-V01',
          'TPC-WCL-TUB-V01', 'TPC-WCL-FIT-V01', 'TPC-WCL-FLD-V01'
        )
      )
    `)
    console.log('   ✅ Removed individual water cooling components from Extreme PC')

    // Add the kit to Extreme PC build
    await db.execute(sql`
      INSERT INTO product_components (
        parent_product_id, component_product_id, quantity,
        is_required, is_included, display_name, display_order, sort_order
      ) VALUES (
        'prod_extreme_wc_pc_001', ${kitId}, 1,
        true, true, 'Custom Water Cooling Kit', 100, 100
      )
    `)
    console.log('   ✅ Added Water Cooling Kit to Extreme PC\n')

    // Step 7: Mark some components as non-purchasable individually (only in kit)
    console.log('7️⃣ Setting purchase restrictions...')
    await db.execute(sql`
      UPDATE products
      SET can_purchase_individually = false
      WHERE sku IN ('TPC-WCL-TUB-V01', 'TPC-WCL-FIT-V01')
    `)
    console.log('   ✅ Tubing and fittings marked as kit-only (not sold separately)\n')

    console.log('✨ Deeper nesting added successfully!\n')
    console.log('📊 New hierarchy:')
    console.log('   Extreme PC Build (Level 0)')
    console.log('   ├── CPU, GPU, RAM, etc. (Level 1)')
    console.log('   └── Water Cooling Kit (Level 1)')
    console.log('       ├── CPU Block (Level 2)')
    console.log('       ├── GPU Block (Level 2)')
    console.log('       ├── Radiators (Level 2)')
    console.log('       ├── Pump/Res (Level 2)')
    console.log('       ├── Tubing (Level 2) [Kit Only]')
    console.log('       ├── Fittings (Level 2) [Kit Only]')
    console.log('       └── Coolant (Level 2)')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

addDeeperNesting()
