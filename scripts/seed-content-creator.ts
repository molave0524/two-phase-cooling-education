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

async function seedContentCreatorBuild() {
  try {
    console.log('🚀 Starting Content Creator Build seeding...\n')

    // First, get the IDs of shared components from Extreme Build
    console.log('📦 Finding shared components (PSU, Case, RAM)...')
    const sharedComponents = await db.execute(sql`
      SELECT id, name, sku FROM products
      WHERE sku IN ('TPC-PSU-12C-V01', 'TPC-CAS-O11-V01', 'TPC-RAM-64D-V01')
      ORDER BY sku
    `)

    if (sharedComponents.rows.length !== 3) {
      console.error(
        '❌ Could not find all shared components. Expected 3, found:',
        sharedComponents.rows.length
      )
      process.exit(1)
    }

    const psuId = sharedComponents.rows.find((r: any) => r.sku === 'TPC-PSU-12C-V01')?.id
    const caseId = sharedComponents.rows.find((r: any) => r.sku === 'TPC-CAS-O11-V01')?.id
    const ramId = sharedComponents.rows.find((r: any) => r.sku === 'TPC-RAM-64D-V01')?.id

    console.log('✅ Found shared components:')
    console.log(`  PSU: ${psuId}`)
    console.log(`  Case: ${caseId}`)
    console.log(`  RAM: ${ramId}\n`)

    // Create new unique components for Content Creator build
    console.log('🆕 Creating new components for Content Creator build...\n')

    // 1. CPU - AMD Ryzen 9 7950X
    const cpuResult = await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase,
        version, created_at, updated_at
      ) VALUES (
        'prod_cpu_7950x', 'AMD Ryzen 9 7950X', 'amd-ryzen-9-7950x',
        'TPC-CPU-795-V01', 'TPC', 'CPU', '795', 'V01',
        549.99, 649.99, 549.99, 'USD',
        'The AMD Ryzen 9 7950X delivers exceptional multi-threaded performance with 16 cores and 32 threads, perfect for video editing, 3D rendering, and streaming.',
        '16-Core, 32-Thread Desktop Processor',
        '["16 cores / 32 threads", "5.7 GHz max boost", "Excellent multi-threading", "AM5 platform"]'::jsonb,
        '{"cores": 16, "threads": 32, "baseClock": "4.5 GHz", "boostClock": "5.7 GHz", "cache": "64MB L3", "tdp": "170W", "socket": "AM5"}'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&h=600&fit=crop", "altText": "AMD Ryzen 9 7950X", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=600&fit=crop", "altText": "7950X Packaging", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?w=600&h=600&fit=crop", "altText": "CPU Top View", "type": "gallery"}
        ]'::jsonb,
        '["Components", "Processors"]'::jsonb,
        '["cpu", "amd", "ryzen"]'::jsonb,
        true, 15, '1-2 business days',
        'component', 'active', true, 1, NOW(), NOW()
      ) RETURNING id
    `)
    const cpuId = cpuResult.rows[0].id
    console.log('✅ Created CPU:', cpuId)

    // 2. Motherboard - ASUS ROG Strix X670E-E
    const moboResult = await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase,
        version, created_at, updated_at
      ) VALUES (
        'prod_mobo_x670e', 'ASUS ROG Strix X670E-E Gaming WiFi', 'asus-rog-strix-x670e-e',
        'TPC-MBO-X67-V01', 'TPC', 'MBO', 'X67', 'V01',
        449.99, NULL, 449.99, 'USD',
        'Premium AMD X670E motherboard with PCIe 5.0, DDR5 memory, WiFi 6E, and comprehensive cooling solutions.',
        'Premium AMD X670E ATX Motherboard',
        '["PCIe 5.0 ready", "WiFi 6E included", "Robust VRM cooling", "Premium audio"]'::jsonb,
        '{"chipset": "AMD X670E", "socket": "AM5", "formFactor": "ATX", "memoryType": "DDR5", "memorySlots": 4, "maxMemory": "128GB"}'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop", "altText": "X670E Motherboard", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&h=600&fit=crop", "altText": "Motherboard Details", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop", "altText": "I/O Panel", "type": "gallery"}
        ]'::jsonb,
        '["Components", "Motherboards"]'::jsonb,
        '["motherboard", "asus", "amd"]'::jsonb,
        true, 8, '1-2 business days',
        'component', 'active', true, 1, NOW(), NOW()
      ) RETURNING id
    `)
    const moboId = moboResult.rows[0].id
    console.log('✅ Created Motherboard:', moboId)

    // 3. GPU - NVIDIA RTX 4070 Ti
    const gpuResult = await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase,
        version, created_at, updated_at
      ) VALUES (
        'prod_gpu_4070ti', 'NVIDIA GeForce RTX 4070 Ti 12GB', 'nvidia-rtx-4070-ti',
        'TPC-GPU-47T-V01', 'TPC', 'GPU', '47T', 'V01',
        799.99, 899.99, 799.99, 'USD',
        'High-performance GPU for 4K content creation and gaming with 12GB GDDR6X memory and NVIDIA Studio Drivers.',
        'RTX 4070 Ti 12GB - Content Creation GPU',
        '["12GB GDDR6X memory", "DLSS 3 support", "AV1 encoding", "Studio drivers"]'::jsonb,
        '{"cuda_cores": 7680, "memory": "12GB GDDR6X", "memoryBandwidth": "504 GB/s", "boostClock": "2.61 GHz", "tdp": "285W"}'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=600&fit=crop", "altText": "RTX 4070 Ti", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1587202372583-49330a15584d?w=800&h=600&fit=crop", "altText": "GPU Side View", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&h=600&fit=crop", "altText": "Backplate", "type": "gallery"}
        ]'::jsonb,
        '["Components", "Graphics Cards"]'::jsonb,
        '["gpu", "nvidia", "rtx"]'::jsonb,
        true, 12, '1-2 business days',
        'component', 'active', true, 1, NOW(), NOW()
      ) RETURNING id
    `)
    const gpuId = gpuResult.rows[0].id
    console.log('✅ Created GPU:', gpuId)

    // 4. Cooling - NZXT Kraken X73 360mm AIO
    const coolerResult = await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase,
        version, created_at, updated_at
      ) VALUES (
        'prod_cooler_x73', 'NZXT Kraken X73 360mm AIO Cooler', 'nzxt-kraken-x73',
        'TPC-COL-X73-V01', 'TPC', 'COL', 'X73', 'V01',
        179.99, NULL, 179.99, 'USD',
        '360mm all-in-one liquid CPU cooler with RGB lighting and CAM software integration.',
        '360mm AIO with RGB',
        '["360mm radiator", "RGB pump cap", "CAM software", "Quiet operation"]'::jsonb,
        '{"radiatorSize": "360mm", "fanSize": "3x 120mm", "pumpSpeed": "800-2800 RPM", "noiseLevel": "21-36 dBA"}'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=600&fit=crop", "altText": "NZXT Kraken X73", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop", "altText": "RGB Pump", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&h=600&fit=crop", "altText": "Radiator", "type": "gallery"}
        ]'::jsonb,
        '["Components", "Cooling"]'::jsonb,
        '["cooling", "aio", "nzxt"]'::jsonb,
        true, 20, '1-2 business days',
        'component', 'active', true, 1, NOW(), NOW()
      ) RETURNING id
    `)
    const coolerId = coolerResult.rows[0].id
    console.log('✅ Created Cooler:', coolerId)

    // 5. Storage - Samsung 990 Pro 2TB
    const storageResult = await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase,
        version, created_at, updated_at
      ) VALUES (
        'prod_ssd_990pro_2tb_cc', 'Samsung 990 Pro 2TB NVMe SSD', 'samsung-990-pro-2tb-cc',
        'TPC-SSD-99P-V01', 'TPC', 'SSD', '99P', 'V01',
        189.99, NULL, 189.99, 'USD',
        'Ultra-fast PCIe 4.0 NVMe SSD with 7,450 MB/s sequential reads, perfect for content creation workflows.',
        '2TB PCIe 4.0 NVMe - 7,450 MB/s',
        '["7,450 MB/s read speed", "PCIe 4.0 performance", "5-year warranty", "2TB capacity"]'::jsonb,
        '{"capacity": "2TB", "interface": "PCIe 4.0 x4", "sequentialRead": "7,450 MB/s", "sequentialWrite": "6,900 MB/s", "warranty": "5 years"}'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=600&fit=crop", "altText": "990 Pro SSD", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&h=600&fit=crop", "altText": "M.2 Drive", "type": "gallery"}
        ]'::jsonb,
        '["Components", "Storage"]'::jsonb,
        '["ssd", "nvme", "samsung"]'::jsonb,
        true, 25, '1-2 business days',
        'component', 'active', true, 1, NOW(), NOW()
      ) RETURNING id
    `)
    const storageId = storageResult.rows[0].id
    console.log('✅ Created Storage:', storageId, '\n')

    // Create the Content Creator Build standalone product
    console.log('🏗️ Creating Content Creator Build standalone product...')
    const buildResult = await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase,
        version, created_at, updated_at
      ) VALUES (
        'prod_content_creator_build',
        'Content Creator Workstation Build',
        'content-creator-workstation-build',
        'TPC-SYS-CCW-V01', 'TPC', 'SYS', 'CCW', 'V01',
        3499.99, 3799.99, NULL, 'USD',
        'Built for video editors, 3D artists, and content creators who demand professional-grade performance. Combines AMD Ryzen 9 7950X with RTX 4070 Ti for exceptional content creation workflows.',
        'Professional AMD-based Content Creation Powerhouse',
        '[
          "16-core AMD Ryzen 9 7950X processor",
          "RTX 4070 Ti with 12GB VRAM",
          "64GB DDR5 high-speed memory",
          "360mm AIO liquid cooling",
          "2TB ultra-fast NVMe storage",
          "Premium X670E motherboard",
          "1200W Platinum PSU",
          "Professional cable management"
        ]'::jsonb,
        '{
          "cpu": "AMD Ryzen 9 7950X (16C/32T)",
          "gpu": "NVIDIA RTX 4070 Ti 12GB",
          "memory": "64GB DDR5-6000",
          "storage": "2TB NVMe PCIe 4.0",
          "cooling": "360mm AIO Liquid Cooling",
          "psu": "1200W 80+ Platinum",
          "formFactor": "ATX Mid Tower",
          "warranty": "3 years parts & labor"
        }'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop", "altText": "Content Creator Build", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1591238372338-6eac71c402c7?w=800&h=600&fit=crop", "altText": "Interior View", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&h=600&fit=crop", "altText": "Cable Management", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=600&fit=crop", "altText": "RGB Effects", "type": "gallery"}
        ]'::jsonb,
        '["Desktop PCs", "Workstations", "Content Creation"]'::jsonb,
        '["workstation", "content-creation", "amd", "ryzen", "rtx-4070-ti"]'::jsonb,
        true, 5, '2-3 weeks (custom build)',
        'standalone', 'active', true, 1, NOW(), NOW()
      ) RETURNING id
    `)
    const buildId = buildResult.rows[0].id
    console.log('✅ Created Build:', buildId, '\n')

    // Create product_components relationships
    console.log('🔗 Creating component relationships...')

    await db.execute(sql`
      INSERT INTO product_components (parent_product_id, component_product_id, quantity, is_required, is_included, display_name, display_order, sort_order) VALUES
      -- Core PC Components
      (${buildId}, ${cpuId}, 1, true, true, 'Processor', 10, 10),
      (${buildId}, ${moboId}, 1, true, true, 'Motherboard', 20, 20),
      (${buildId}, ${ramId}, 1, true, true, 'Memory', 30, 30),
      (${buildId}, ${gpuId}, 1, true, true, 'Graphics Card', 40, 40),
      (${buildId}, ${storageId}, 1, true, true, 'Primary Storage', 50, 50),
      (${buildId}, ${psuId}, 1, true, true, 'Power Supply', 60, 60),
      (${buildId}, ${caseId}, 1, true, true, 'Case', 70, 70),
      (${buildId}, ${coolerId}, 1, true, true, 'CPU Cooler', 80, 80)
    `)
    console.log('  ✅ Linked 8 components (5 new + 3 shared)')

    console.log('\n✨ Content Creator Build seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`  New Components Created: 5 (CPU, Motherboard, GPU, Cooler, Storage)`)
    console.log(`  Shared Components Reused: 3 (PSU, Case, RAM)`)
    console.log(`  Standalone Build Created: 1`)
    console.log(`  Total Price: $3,499.99`)
  } catch (error) {
    console.error('❌ Error seeding Content Creator Build:', error)
  } finally {
    await pool.end()
  }
}

seedContentCreatorBuild()
