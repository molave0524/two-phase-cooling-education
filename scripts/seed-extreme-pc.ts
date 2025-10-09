/**
 * Seed Extreme Water-Cooled PC Build
 * Deletes all products and inserts the extreme build with all components
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment')
  process.exit(1)
}

console.log('📦 Connecting to database...')
const pool = new Pool({ connectionString: DATABASE_URL })
const db = drizzle(pool)

async function seedExtremePC() {
  try {
    console.log('🗑️  Deleting all existing products...')
    await db.execute(sql`TRUNCATE TABLE products CASCADE`)
    console.log('✅ All products deleted')

    console.log('📝 Inserting parent product...')
    await db.execute(sql`
      INSERT INTO products (
        id, name, slug, sku,
        sku_prefix, sku_category, sku_product_code, sku_version,
        price, original_price, component_price, currency,
        description, short_description,
        features, specifications, images, categories, tags,
        in_stock, stock_quantity, estimated_shipping,
        product_type, status, is_available_for_purchase,
        version, created_at, updated_at
      ) VALUES (
        'prod_extreme_wc_pc_001',
        'Extreme Water-Cooled Gaming PC - i9-14900K + RTX 4090',
        'extreme-water-cooled-gaming-pc-i9-14900k-rtx-4090',
        'TPC-SYS-EX1-V01',
        'TPC', 'SYS', 'EX1', 'V01',
        8499.00, 8999.00, NULL, 'USD',
        'Ultimate water-cooled gaming powerhouse featuring Intel i9-14900K, RTX 4090, and triple-radiator custom cooling loop.',
        'Triple-radiator custom loop, i9-14900K + RTX 4090, 64GB DDR5',
        '["Triple 360mm/360mm/120mm radiator setup", "Intel i9-14900K (24-core, 6.0 GHz)", "NVIDIA RTX 4090 24GB", "64GB DDR5-6000 RGB RAM", "6TB total NVMe Gen4 storage"]'::jsonb,
        '{"system": {"cpu": "Intel Core i9-14900K", "gpu": "NVIDIA GeForce RTX 4090 24GB", "motherboard": "ASUS ROG Maximus Z790 Hero", "ram": "64GB DDR5-6000", "storage": "6TB NVMe"}, "cooling": {"type": "Custom Hard-Tube Water Cooling", "radiators": "3x (360mm + 360mm + 120mm)"}}'::jsonb,
        '[
          {"url": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop", "altText": "Extreme Water-Cooled PC Front View", "type": "main"},
          {"url": "https://images.unsplash.com/photo-1591238372338-6eac71c402c7?w=800&h=600&fit=crop", "altText": "Custom Loop Side View", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&h=600&fit=crop", "altText": "Top Radiator View", "type": "gallery"},
          {"url": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=600&fit=crop", "altText": "Water Block Details", "type": "gallery"}
        ]'::jsonb,
        '["Desktop PCs", "Gaming", "Water Cooled"]'::jsonb,
        '["gaming", "water-cooling", "extreme", "i9-14900k", "rtx-4090"]'::jsonb,
        true, 5, '2-3 weeks (custom build)',
        'standalone', 'active', true, 1, NOW(), NOW()
      )
    `)
    console.log('✅ Parent product inserted')

    console.log('📝 Inserting component products (22 items)...')

    // Core PC Components
    await db.execute(sql`
      INSERT INTO products (id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version, price, component_price, currency, description, short_description, features, specifications, images, categories, tags, in_stock, stock_quantity, product_type, status, is_available_for_purchase, version, created_at, updated_at) VALUES
      ('prod_cpu_i9_14900k', 'Intel Core i9-14900K Processor', 'intel-core-i9-14900k', 'TPC-CPU-I91-V01', 'TPC', 'CPU', 'I91', 'V01', 599.99, 599.99, 'USD', '24-core processor with 6.0 GHz max turbo', '24-core, 6.0 GHz Turbo', '["24 cores", "6.0 GHz turbo", "125W TDP"]'::jsonb, '{"cores": 24, "threads": 32, "turbo": "6.0 GHz"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&h=600&fit=crop", "altText": "i9-14900K Processor", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=600&fit=crop", "altText": "i9-14900K Packaging", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?w=600&h=600&fit=crop", "altText": "CPU Top View", "type": "gallery"}]'::jsonb, '["Components", "Processors"]'::jsonb, '["cpu", "intel"]'::jsonb, true, 50, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_mobo_z790_hero', 'ASUS ROG Maximus Z790 Hero', 'asus-rog-z790-hero', 'TPC-MBO-Z79-V01', 'TPC', 'MBO', 'Z79', 'V01', 499.99, 499.99, 'USD', 'Premium Z790 motherboard with DDR5', 'ATX, DDR5, PCIe 5.0', '["DDR5-7800+", "PCIe 5.0", "WiFi 6E"]'::jsonb, '{"form_factor": "ATX", "chipset": "Z790"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Z790 Hero Motherboard", "type": "main"}, {"url": "https://images.unsplash.com/photo-1562976282-43b291802c9a?w=600&h=600&fit=crop", "altText": "Motherboard Angle View", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1596496181871-9681eacf9764?w=600&h=600&fit=crop", "altText": "I/O Shield Detail", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1592659762303-90081d34b277?w=600&h=600&fit=crop", "altText": "VRM Heatsink", "type": "gallery"}]'::jsonb, '["Components", "Motherboards"]'::jsonb, '["mobo", "asus"]'::jsonb, true, 30, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_ram_64gb_ddr5', 'G.Skill Trident Z5 RGB 64GB DDR5-6000', 'gskill-trident-z5-64gb', 'TPC-RAM-64D-V01', 'TPC', 'RAM', '64D', 'V01', 299.99, 299.99, 'USD', '64GB DDR5 memory with RGB', '64GB, DDR5-6000, CL30', '["64GB total", "DDR5-6000", "CL30"]'::jsonb, '{"capacity": "64GB", "speed": "6000 MHz"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=600&h=600&fit=crop", "altText": "Trident Z5 RGB RAM", "type": "main"}, {"url": "https://images.unsplash.com/photo-1562976282-43b291802c9a?w=600&h=600&fit=crop", "altText": "RGB Lighting Effect", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591799265444-d66432b91588?w=600&h=600&fit=crop", "altText": "RAM Installed", "type": "gallery"}]'::jsonb, '["Components", "Memory"]'::jsonb, '["ram", "ddr5"]'::jsonb, true, 100, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_gpu_rtx_4090', 'NVIDIA GeForce RTX 4090 24GB', 'nvidia-rtx-4090', 'TPC-GPU-490-V01', 'TPC', 'GPU', '490', 'V01', 1799.99, 1799.99, 'USD', 'Ultimate gaming GPU with 24GB GDDR6X', 'RTX 4090, 24GB GDDR6X', '["24GB GDDR6X", "16384 CUDA cores"]'::jsonb, '{"vram": "24GB", "tdp": "450W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "RTX 4090", "type": "main"}, {"url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=600&fit=crop", "altText": "GPU Side Profile", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=600&h=600&fit=crop", "altText": "Backplate Detail", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1616410011236-7a42121dd981?w=600&h=600&fit=crop", "altText": "PCB Close-up", "type": "gallery"}]'::jsonb, '["Components", "Graphics Cards"]'::jsonb, '["gpu", "nvidia"]'::jsonb, true, 15, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_ssd_2tb_990pro', 'Samsung 990 PRO 2TB NVMe Gen4', 'samsung-990-pro-2tb', 'TPC-SSD-2T9-V01', 'TPC', 'SSD', '2T9', 'V01', 199.99, 199.99, 'USD', 'Flagship NVMe Gen4 SSD', '2TB Gen4, 7450 MB/s', '["2TB", "7450 MB/s read"]'::jsonb, '{"capacity": "2TB", "read_speed": "7450 MB/s"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "990 PRO SSD", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Product Label", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "With Heatsink", "type": "gallery"}]'::jsonb, '["Components", "Storage"]'::jsonb, '["ssd", "nvme"]'::jsonb, true, 200, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_ssd_4tb_sn850x', 'WD Black SN850X 4TB NVMe Gen4', 'wd-black-sn850x-4tb', 'TPC-SSD-4WD-V01', 'TPC', 'SSD', '4WD', 'V01', 299.99, 299.99, 'USD', 'High-capacity gaming SSD', '4TB Gen4, 7300 MB/s', '["4TB", "7300 MB/s read"]'::jsonb, '{"capacity": "4TB", "read_speed": "7300 MB/s"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "SN850X 4TB", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Top View", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Retail Package", "type": "gallery"}]'::jsonb, '["Components", "Storage"]'::jsonb, '["ssd", "wd"]'::jsonb, true, 150, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_psu_1200w', 'Corsair HX1200 1200W 80+ Platinum', 'corsair-hx1200', 'TPC-PSU-12C-V01', 'TPC', 'PSU', '12C', 'V01', 349.99, 349.99, 'USD', 'Fully modular 1200W PSU', '1200W, 80+ Platinum', '["1200W", "80+ Platinum", "Modular"]'::jsonb, '{"wattage": "1200W", "efficiency": "80+ Platinum"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "HX1200 PSU", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Modular Cables", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Fan Grille", "type": "gallery"}]'::jsonb, '["Components", "Power Supplies"]'::jsonb, '["psu", "corsair"]'::jsonb, true, 40, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_case_o11d_xl', 'Lian Li O11 Dynamic XL (Black)', 'lian-li-o11-dynamic-xl', 'TPC-CAS-O11-V01', 'TPC', 'CAS', 'O11', 'V01', 199.99, 199.99, 'USD', 'Premium showcase case', 'E-ATX, triple-chamber', '["E-ATX", "Tempered glass"]'::jsonb, '{"form_factor": "E-ATX"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "O11 XL Case", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Front Panel", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Interior Layout", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Side Glass Panel", "type": "gallery"}]'::jsonb, '["Components", "Cases"]'::jsonb, '["case", "lian-li"]'::jsonb, true, 60, 'component', 'active', true, 1, NOW(), NOW())
    `)

    // Water Cooling Components
    await db.execute(sql`
      INSERT INTO products (id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version, price, component_price, currency, description, short_description, features, specifications, images, categories, tags, in_stock, stock_quantity, product_type, status, is_available_for_purchase, version, created_at, updated_at) VALUES
      ('prod_wb_cpu_ek', 'EK Quantum Velocity² CPU Block', 'ek-quantum-velocity2', 'TPC-WCL-CPB-V01', 'TPC', 'WCL', 'CPB', 'V01', 149.99, 149.99, 'USD', 'Premium CPU water block', 'LGA 1700, D-RGB', '["LGA 1700", "D-RGB", "Nickel"]'::jsonb, '{"socket": "LGA 1700"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "CPU Water Block", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Installed on CPU", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "RGB Lighting", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["water-cooling", "ek"]'::jsonb, true, 75, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_wb_gpu_4090', 'EK Quantum Vector² RTX 4090 Block', 'ek-vector2-rtx-4090', 'TPC-WCL-GPB-V01', 'TPC', 'WCL', 'GPB', 'V01', 249.99, 249.99, 'USD', 'Full-coverage GPU water block', 'RTX 4090, D-RGB', '["RTX 4090", "Full coverage"]'::jsonb, '{"compatible": "RTX 4090"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "GPU Water Block", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Top View", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Installed on GPU", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Active Backplate", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["water-cooling", "gpu"]'::jsonb, true, 40, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_rad_360_xe', 'EK CoolStream XE 360mm (60mm thick)', 'ek-xe-360mm', 'TPC-WCL-R36-V01', 'TPC', 'WCL', 'R36', 'V01', 149.99, 149.99, 'USD', 'Ultra-thick 360mm radiator', '360mm, 60mm thick', '["360mm", "60mm thick"]'::jsonb, '{"size": "360mm", "thickness": "60mm"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "360mm XE Radiator", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Side Profile", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Fin Detail", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["radiator", "ek"]'::jsonb, true, 60, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_rad_360_pe', 'EK CoolStream PE 360mm (45mm thick)', 'ek-pe-360mm', 'TPC-WCL-R3P-V01', 'TPC', 'WCL', 'R3P', 'V01', 119.99, 119.99, 'USD', 'Performance 360mm radiator', '360mm, 45mm thick', '["360mm", "45mm thick"]'::jsonb, '{"size": "360mm", "thickness": "45mm"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "360mm PE Radiator", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Port Configuration", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Mounted View", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["radiator"]'::jsonb, true, 80, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_rad_120_se', 'EK CoolStream SE 120mm (30mm thick)', 'ek-se-120mm', 'TPC-WCL-R12-V01', 'TPC', 'WCL', 'R12', 'V01', 59.99, 59.99, 'USD', 'Slim 120mm radiator', '120mm, 30mm thick', '["120mm", "30mm thick"]'::jsonb, '{"size": "120mm", "thickness": "30mm"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "120mm SE Radiator", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Slim Profile", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Port Detail", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["radiator"]'::jsonb, true, 100, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_pump_d5', 'EK Quantum Kinetic D5 Pump/Res Combo', 'ek-kinetic-d5', 'TPC-WCL-PMP-V01', 'TPC', 'WCL', 'PMP', 'V01', 199.99, 199.99, 'USD', 'D5 pump with 300ml reservoir', 'D5 PWM, 300ml', '["D5 PWM", "300ml", "RGB"]'::jsonb, '{"pump": "D5", "reservoir": "300ml"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "D5 Pump Combo", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Front View", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "RGB Effects", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Mounted in Case", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["pump", "reservoir"]'::jsonb, true, 50, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_fan_ql120_3pk', 'Corsair iCUE QL120 RGB (3-Pack)', 'corsair-ql120-3pack', 'TPC-FAN-QL3-V01', 'TPC', 'FAN', 'QL3', 'V01', 89.99, 89.99, 'USD', 'Premium RGB fans with dual lighting', '3x 120mm RGB, PWM', '["3x 120mm", "Dual RGB", "PWM"]'::jsonb, '{"size": "120mm", "quantity": 3}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "QL120 RGB Fans", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Lit RGB Effect", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Mounted on Radiator", "type": "gallery"}]'::jsonb, '["Components", "Cooling"]'::jsonb, '["fans", "rgb"]'::jsonb, true, 120, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_tube_petg_16mm', 'EK-HD PETG Tubing 16mm OD (3m)', 'ek-petg-16mm', 'TPC-WCL-TUB-V01', 'TPC', 'WCL', 'TUB', 'V01', 79.99, 79.99, 'USD', 'Premium PETG hard tubing', '16mm OD, clear, 3m', '["16mm OD", "PETG", "3 meters"]'::jsonb, '{"diameter": "16mm", "material": "PETG"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "PETG Tubing", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Tubing Roll", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Bent Tubing Examples", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["tubing"]'::jsonb, true, 200, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_fittings_30pc', 'EK Quantum Torque Fittings Kit (30pc)', 'ek-torque-fittings-30pc', 'TPC-WCL-FIT-V01', 'TPC', 'WCL', 'FIT', 'V01', 399.99, 399.99, 'USD', 'Complete fittings kit', '30pc, 16mm, nickel', '["30 fittings", "16mm", "Nickel"]'::jsonb, '{"count": 30, "size": "16mm"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Torque Fittings Kit", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Fitting Close-up", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Various Fittings", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Installed Fittings", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["fittings"]'::jsonb, true, 80, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_coolant_clear_2l', 'EK-CryoFuel Clear Premium (2L)', 'ek-cryofuel-clear-2l', 'TPC-WCL-FLD-V01', 'TPC', 'WCL', 'FLD', 'V01', 39.99, 39.99, 'USD', 'Premium pre-mixed coolant', '2L, clear, ready-to-use', '["2L bottle", "Pre-mixed", "Non-conductive"]'::jsonb, '{"volume": "2L", "type": "Pre-mixed"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "CryoFuel Coolant", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Bottle Detail", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Pouring Coolant", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["coolant"]'::jsonb, true, 300, 'component', 'active', true, 1, NOW(), NOW())
    `)

    // RGB & Controllers
    await db.execute(sql`
      INSERT INTO products (id, name, slug, sku, sku_prefix, sku_category, sku_product_code, sku_version, price, component_price, currency, description, short_description, features, specifications, images, categories, tags, in_stock, stock_quantity, product_type, status, is_available_for_purchase, version, created_at, updated_at) VALUES
      ('prod_rgb_commander', 'Corsair Commander CORE XT', 'corsair-commander-core-xt', 'TPC-RGB-CMD-V01', 'TPC', 'RGB', 'CMD', 'V01', 79.99, 79.99, 'USD', 'RGB and fan controller', '6 RGB, 6 PWM channels', '["6 RGB channels", "6 PWM fans", "iCUE"]'::jsonb, '{"rgb_channels": 6, "fan_channels": 6}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Commander CORE XT", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Port Layout", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Installed in Case", "type": "gallery"}]'::jsonb, '["Components", "RGB"]'::jsonb, '["rgb", "controller"]'::jsonb, true, 100, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_fan_octo', 'Aquacomputer OCTO Fan Controller', 'aquacomputer-octo', 'TPC-FAN-OCT-V01', 'TPC', 'FAN', 'OCT', 'V01', 99.99, 99.99, 'USD', 'Professional fan controller', '8 PWM, 4 temp sensors', '["8 PWM channels", "4 temp sensors"]'::jsonb, '{"fan_channels": 8, "temp_sensors": 4}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "OCTO Controller", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Display Screen", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Connection Ports", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Software Interface", "type": "gallery"}]'::jsonb, '["Components", "Controllers"]'::jsonb, '["fan-controller"]'::jsonb, true, 70, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_temp_sensor_4pk', 'Aquacomputer Temp Sensors (4-Pack)', 'aquacomputer-temp-4pack', 'TPC-WCL-TMP-V01', 'TPC', 'WCL', 'TMP', 'V01', 79.99, 79.99, 'USD', 'Precision inline temp sensors', '4x inline, G1/4 thread', '["4 sensors", "G1/4 thread", "±0.1°C"]'::jsonb, '{"quantity": 4, "accuracy": "±0.1°C"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Temp Sensors 4-Pack", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Sensor Detail", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Installed in Loop", "type": "gallery"}]'::jsonb, '["Components", "Water Cooling"]'::jsonb, '["sensors"]'::jsonb, true, 150, 'component', 'active', true, 1, NOW(), NOW()),
      ('prod_cable_cablemod', 'CableMod PRO ModMesh (Carbon Black)', 'cablemod-pro-black', 'TPC-CAB-CMB-V01', 'TPC', 'CAB', 'CMB', 'V01', 119.99, 119.99, 'USD', 'Premium sleeved cable kit', 'Carbon black, full kit', '["24-pin ATX", "2x 8-pin EPS", "3x PCIe"]'::jsonb, '{"color": "Carbon Black"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "CableMod Cables", "type": "main"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "24-pin ATX Cable", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "PCIe Cables", "type": "gallery"}, {"url": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop", "altText": "Installed View", "type": "gallery"}]'::jsonb, '["Components", "Accessories"]'::jsonb, '["cables"]'::jsonb, true, 90, 'component', 'active', true, 1, NOW(), NOW())
    `)
    console.log('✅ All 22 component products inserted')

    console.log('📝 Linking components to parent product...')
    await db.execute(sql`
      INSERT INTO product_components (parent_product_id, component_product_id, quantity, is_required, is_included, display_name, display_order, sort_order) VALUES
      -- Core PC Components
      ('prod_extreme_wc_pc_001', 'prod_cpu_i9_14900k', 1, true, true, 'Processor', 10, 10),
      ('prod_extreme_wc_pc_001', 'prod_mobo_z790_hero', 1, true, true, 'Motherboard', 20, 20),
      ('prod_extreme_wc_pc_001', 'prod_ram_64gb_ddr5', 1, true, true, 'Memory', 30, 30),
      ('prod_extreme_wc_pc_001', 'prod_gpu_rtx_4090', 1, true, true, 'Graphics Card', 40, 40),
      ('prod_extreme_wc_pc_001', 'prod_ssd_2tb_990pro', 1, true, true, 'Primary Storage', 50, 50),
      ('prod_extreme_wc_pc_001', 'prod_ssd_4tb_sn850x', 1, true, true, 'Secondary Storage', 60, 60),
      ('prod_extreme_wc_pc_001', 'prod_psu_1200w', 1, true, true, 'Power Supply', 70, 70),
      ('prod_extreme_wc_pc_001', 'prod_case_o11d_xl', 1, true, true, 'Case', 80, 80),
      -- Water Cooling
      ('prod_extreme_wc_pc_001', 'prod_wb_cpu_ek', 1, true, true, 'CPU Water Block', 100, 100),
      ('prod_extreme_wc_pc_001', 'prod_wb_gpu_4090', 1, true, true, 'GPU Water Block', 110, 110),
      ('prod_extreme_wc_pc_001', 'prod_rad_360_xe', 1, true, true, 'Front Radiator (360mm)', 120, 120),
      ('prod_extreme_wc_pc_001', 'prod_rad_360_pe', 1, true, true, 'Top Radiator (360mm)', 130, 130),
      ('prod_extreme_wc_pc_001', 'prod_rad_120_se', 1, true, true, 'Rear Radiator (120mm)', 140, 140),
      ('prod_extreme_wc_pc_001', 'prod_pump_d5', 1, true, true, 'Pump/Reservoir', 150, 150),
      ('prod_extreme_wc_pc_001', 'prod_fan_ql120_3pk', 3, true, true, 'RGB Fans (9 total)', 160, 160),
      ('prod_extreme_wc_pc_001', 'prod_tube_petg_16mm', 1, true, true, 'Hard Tubing', 170, 170),
      ('prod_extreme_wc_pc_001', 'prod_fittings_30pc', 1, true, true, 'Fittings Kit', 180, 180),
      ('prod_extreme_wc_pc_001', 'prod_coolant_clear_2l', 1, true, true, 'Coolant', 190, 190),
      -- RGB & Controllers
      ('prod_extreme_wc_pc_001', 'prod_rgb_commander', 1, true, true, 'RGB Controller', 200, 200),
      ('prod_extreme_wc_pc_001', 'prod_fan_octo', 1, true, true, 'Fan Controller', 210, 210),
      ('prod_extreme_wc_pc_001', 'prod_temp_sensor_4pk', 1, true, true, 'Temperature Sensors', 220, 220),
      ('prod_extreme_wc_pc_001', 'prod_cable_cablemod', 1, true, true, 'Custom Cables', 230, 230)
    `)
    console.log('✅ All 22 components linked to parent')

    console.log('')
    console.log('✨ Database seeding complete!')
    console.log('📊 Summary:')
    console.log('   - 1 parent product (Extreme Water-Cooled PC)')
    console.log('   - 22 component products')
    console.log('   - 22 product_components relationships')
    console.log('   - Total: 23 products')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
    console.log('👋 Database connection closed')
  }
}

seedExtremePC()
