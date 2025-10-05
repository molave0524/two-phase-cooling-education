/**
 * Seed Placeholder Products
 *
 * Creates sample products with component relationships to test the
 * catalog and order system.
 */

import postgres from 'postgres'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function seedProducts() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    throw new Error('No database connection string found')
  }

  console.log('Connecting to database...')
  const sql = postgres(connectionString, { max: 1 })

  try {
    // ========================================================================
    // BASE COMPONENTS (Depth 2 - no sub-components)
    // ========================================================================

    console.log('\nCreating base components...')

    // Motors
    await sql`
      INSERT INTO products (
        id, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        name, slug, price, component_price, currency,
        description, short_description, features, specifications, images,
        categories, tags, product_type, version, status, is_available_for_purchase,
        in_stock, stock_quantity
      ) VALUES
        (
          'motr_m01_v1', 'TPC-MOTR-M01-V01', 'TPC', 'MOTR', 'M01', 'V01',
          'High-Efficiency Motor M1', 'high-efficiency-motor-m1',
          45.00, 45.00, 'USD',
          'High-efficiency brushless DC motor for pump applications',
          '12V brushless motor with excellent power efficiency',
          '["12V DC", "Brushless design", "Low noise", "High torque"]'::jsonb,
          '{"power": "12V", "rpm": "3000", "noise": "18dBA"}'::jsonb,
          '["https://placehold.co/400x400/e3f2fd/0d47a1?text=Motor+M1"]'::jsonb,
          '["components", "motors"]'::jsonb,
          '["motor", "brushless", "12v"]'::jsonb,
          'component', 1, 'active', true, true, 100
        ),
        (
          'motr_m02_v1', 'TPC-MOTR-M02-V01', 'TPC', 'MOTR', 'M02', 'V01',
          'Premium Motor M2', 'premium-motor-m2',
          65.00, 65.00, 'USD',
          'Premium brushless motor with enhanced efficiency and lower noise',
          'Enhanced 12V brushless motor with ultra-quiet operation',
          '["12V DC", "Ultra-quiet", "Enhanced efficiency", "Extended lifespan"]'::jsonb,
          '{"power": "12V", "rpm": "3500", "noise": "15dBA"}'::jsonb,
          '["https://placehold.co/400x400/e8f5e9/2e7d32?text=Motor+M2"]'::jsonb,
          '["components", "motors"]'::jsonb,
          '["motor", "brushless", "premium"]'::jsonb,
          'component', 1, 'active', true, true, 50
        )
      ON CONFLICT (id) DO NOTHING
    `

    // Impellers
    await sql`
      INSERT INTO products (
        id, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        name, slug, price, component_price, currency,
        description, short_description, features, specifications, images,
        categories, tags, product_type, version, status, is_available_for_purchase,
        in_stock, stock_quantity
      ) VALUES
        (
          'impl_i01_v1', 'TPC-IMPL-I01-V01', 'TPC', 'IMPL', 'I01', 'V01',
          'Standard Impeller I1', 'standard-impeller-i1',
          15.00, 15.00, 'USD',
          'Standard impeller for general-purpose cooling applications',
          'Durable impeller with balanced flow characteristics',
          '["Copper construction", "Balanced design", "Standard flow"]'::jsonb,
          '{"material": "copper", "diameter": "40mm"}'::jsonb,
          '["https://placehold.co/400x400/fff3e0/e65100?text=Impeller+I1"]'::jsonb,
          '["components", "impellers"]'::jsonb,
          '["impeller", "standard"]'::jsonb,
          'component', 1, 'active', true, true, 200
        ),
        (
          'impl_i02_v1', 'TPC-IMPL-I02-V01', 'TPC', 'IMPL', 'I02', 'V01',
          'High-Flow Impeller I2', 'high-flow-impeller-i2',
          22.00, 22.00, 'USD',
          'High-flow impeller optimized for maximum coolant circulation',
          'Performance impeller with enhanced flow rate',
          '["Brass construction", "High-flow design", "Optimized blade angle"]'::jsonb,
          '{"material": "brass", "diameter": "45mm"}'::jsonb,
          '["https://placehold.co/400x400/fce4ec/c2185b?text=Impeller+I2"]'::jsonb,
          '["components", "impellers"]'::jsonb,
          '["impeller", "high-flow"]'::jsonb,
          'component', 1, 'active', true, true, 150
        )
      ON CONFLICT (id) DO NOTHING
    `

    console.log('✓ Base components created (Motors, Impellers)')

    // ========================================================================
    // ASSEMBLIES (Depth 1 - has sub-components)
    // ========================================================================

    console.log('\nCreating assemblies...')

    // Pumps
    await sql`
      INSERT INTO products (
        id, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        name, slug, price, component_price, currency,
        description, short_description, features, specifications, images,
        categories, tags, product_type, version, status, is_available_for_purchase,
        in_stock, stock_quantity
      ) VALUES
        (
          'pump_a01_v1', 'TPC-PUMP-A01-V01', 'TPC', 'PUMP', 'A01', 'V01',
          'Pump Assembly A1', 'pump-assembly-a1',
          89.99, 89.99, 'USD',
          'Complete pump assembly with standard motor and impeller for reliable cooling performance',
          'Reliable pump assembly for standard cooling needs',
          '["Assembled unit", "Standard performance", "Easy installation", "Maintenance-free"]'::jsonb,
          '{"flowRate": "120 L/h", "pressure": "1.2 bar", "voltage": "12V"}'::jsonb,
          '["https://placehold.co/600x600/e1f5fe/01579b?text=Pump+A1"]'::jsonb,
          '["assemblies", "pumps"]'::jsonb,
          '["pump", "assembly", "cooling"]'::jsonb,
          'component', 1, 'active', true, true, 75
        ),
        (
          'pump_a02_v1', 'TPC-PUMP-A02-V01', 'TPC', 'PUMP', 'A02', 'V01',
          'Premium Pump Assembly A2', 'premium-pump-assembly-a2',
          129.99, 129.99, 'USD',
          'Premium pump assembly featuring enhanced motor and high-flow impeller for maximum performance',
          'High-performance pump with premium components',
          '["Premium components", "High flow rate", "Ultra-quiet", "Extended warranty"]'::jsonb,
          '{"flowRate": "180 L/h", "pressure": "1.5 bar", "voltage": "12V"}'::jsonb,
          '["https://placehold.co/600x600/f3e5f5/6a1b9a?text=Pump+A2"]'::jsonb,
          '["assemblies", "pumps"]'::jsonb,
          '["pump", "assembly", "premium"]'::jsonb,
          'component', 1, 'active', true, true, 40
        )
      ON CONFLICT (id) DO NOTHING
    `

    // Radiators
    await sql`
      INSERT INTO products (
        id, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        name, slug, price, component_price, currency,
        description, short_description, features, specifications, images,
        categories, tags, product_type, version, status, is_available_for_purchase,
        in_stock, stock_quantity
      ) VALUES
        (
          'radi_r01_v1', 'TPC-RADI-R01-V01', 'TPC', 'RADI', 'R01', 'V01',
          'Compact Radiator R1', 'compact-radiator-r1',
          79.99, 79.99, 'USD',
          '240mm aluminum radiator with dual fan mounts for compact builds',
          'Space-efficient 240mm radiator',
          '["240mm size", "Aluminum construction", "Dual 120mm fan mounts"]'::jsonb,
          '{"size": "240mm", "thickness": "27mm", "material": "aluminum"}'::jsonb,
          '["https://placehold.co/600x600/e0f2f1/00695c?text=Radiator+R1"]'::jsonb,
          '["components", "radiators"]'::jsonb,
          '["radiator", "240mm", "compact"]'::jsonb,
          'component', 1, 'active', true, true, 60
        ),
        (
          'radi_r02_v1', 'TPC-RADI-R02-V01', 'TPC', 'RADI', 'R02', 'V01',
          'Performance Radiator R2', 'performance-radiator-r2',
          129.99, 129.99, 'USD',
          '360mm copper radiator with triple fan mounts for maximum cooling capacity',
          'High-capacity 360mm radiator for maximum cooling',
          '["360mm size", "Copper construction", "Triple 120mm fan mounts", "High fin density"]'::jsonb,
          '{"size": "360mm", "thickness": "30mm", "material": "copper"}'::jsonb,
          '["https://placehold.co/600x600/fff8e1/f57f17?text=Radiator+R2"]'::jsonb,
          '["components", "radiators"]'::jsonb,
          '["radiator", "360mm", "performance"]'::jsonb,
          'component', 1, 'active', true, true, 35
        )
      ON CONFLICT (id) DO NOTHING
    `

    // RGB Controllers
    await sql`
      INSERT INTO products (
        id, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        name, slug, price, component_price, currency,
        description, short_description, features, specifications, images,
        categories, tags, product_type, version, status, is_available_for_purchase,
        in_stock, stock_quantity
      ) VALUES
        (
          'rgbc_c01_v1', 'TPC-RGBC-C01-V01', 'TPC', 'RGBC', 'C01', 'V01',
          'RGB Controller C1', 'rgb-controller-c1',
          39.99, 39.99, 'USD',
          'Advanced RGB lighting controller with software control and multiple effects',
          'Customizable RGB lighting controller',
          '["Software control", "Multiple effects", "Addressable RGB", "Easy installation"]'::jsonb,
          '{"channels": "4", "leds": "120", "voltage": "12V"}'::jsonb,
          '["https://placehold.co/400x400/f1f8e9/558b2f?text=RGB+Ctrl"]'::jsonb,
          '["components", "rgb"]'::jsonb,
          '["rgb", "lighting", "controller"]'::jsonb,
          'component', 1, 'active', true, true, 100
        )
      ON CONFLICT (id) DO NOTHING
    `

    console.log('✓ Assemblies created (Pumps, Radiators, RGB Controllers)')

    // ========================================================================
    // COMPLETE SYSTEMS (Depth 0 - root products with components)
    // ========================================================================

    console.log('\nCreating complete systems...')

    await sql`
      INSERT INTO products (
        id, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        name, slug, price, component_price, currency,
        description, short_description, features, specifications, images,
        categories, tags, product_type, version, status, is_available_for_purchase,
        in_stock, stock_quantity,
        meta_title, meta_description, estimated_shipping
      ) VALUES
        (
          'cool_pro_v1', 'TPC-COOL-PRO-V01', 'TPC', 'COOL', 'PRO', 'V01',
          'Cooling System Pro', 'cooling-system-pro',
          999.99, NULL, 'USD',
          'Professional-grade two-phase cooling system featuring premium pump assembly, performance radiator, and RGB lighting. Perfect for high-performance gaming rigs and workstations.',
          'Complete pro cooling solution with premium components',
          '["Premium pump assembly", "360mm performance radiator", "RGB lighting included", "Professional installation kit", "3-year warranty"]'::jsonb,
          '{
            "cooling": {
              "capacity": "350W TDP",
              "efficiency": "95%",
              "operatingRange": {"min": 10, "max": 80},
              "fluidType": "Dielectric coolant",
              "fluidVolume": "500ml"
            },
            "compatibility": {
              "cpuSockets": ["LGA1700", "AM5", "AM4"],
              "gpuSupport": ["Reference PCB"],
              "caseCompatibility": "Mid-tower and larger",
              "motherboardClearance": "165mm"
            },
            "dimensions": {"length": "394mm", "width": "120mm", "height": "30mm", "weight": "2.1kg"},
            "environmental": {"noiseLevel": "22dBA", "powerConsumption": "12W", "mtbf": "100000h"},
            "warranty": {"duration": "3 years", "coverage": "Full replacement"}
          }'::jsonb,
          '["https://placehold.co/800x800/e8eaf6/3f51b5?text=Cooling+System+Pro", "https://placehold.co/800x800/ede7f6/5e35b1?text=Pro+Detail"]'::jsonb,
          '["cooling-systems", "complete-kits", "pro"]'::jsonb,
          '["cooling", "two-phase", "pro", "rgb", "gaming"]'::jsonb,
          'standalone', 1, 'active', true, true, 25,
          'Cooling System Pro - Professional Two-Phase Cooling',
          'Premium two-phase cooling system with 360mm radiator, high-performance pump, and RGB lighting for ultimate cooling performance.',
          '3-5 business days'
        ),
        (
          'cool_std_v1', 'TPC-COOL-STD-V01', 'TPC', 'COOL', 'STD', 'V01',
          'Cooling System Standard', 'cooling-system-standard',
          599.99, NULL, 'USD',
          'Reliable two-phase cooling system with standard components for everyday performance needs. Great balance of cooling efficiency and value.',
          'Reliable cooling solution for standard builds',
          '["Standard pump assembly", "240mm compact radiator", "RGB lighting included", "Easy installation", "2-year warranty"]'::jsonb,
          '{
            "cooling": {
              "capacity": "200W TDP",
              "efficiency": "90%",
              "operatingRange": {"min": 15, "max": 75},
              "fluidType": "Dielectric coolant",
              "fluidVolume": "350ml"
            },
            "compatibility": {
              "cpuSockets": ["LGA1700", "AM5", "AM4"],
              "gpuSupport": [],
              "caseCompatibility": "All ATX cases",
              "motherboardClearance": "155mm"
            },
            "dimensions": {"length": "277mm", "width": "120mm", "height": "27mm", "weight": "1.4kg"},
            "environmental": {"noiseLevel": "25dBA", "powerConsumption": "10W", "mtbf": "80000h"},
            "warranty": {"duration": "2 years", "coverage": "Full replacement"}
          }'::jsonb,
          '["https://placehold.co/800x800/e3f2fd/1976d2?text=Cooling+System+Std", "https://placehold.co/800x800/e1f5fe/0288d1?text=Std+Detail"]'::jsonb,
          '["cooling-systems", "complete-kits", "standard"]'::jsonb,
          '["cooling", "two-phase", "standard", "rgb", "value"]'::jsonb,
          'standalone', 1, 'active', true, true, 40,
          'Cooling System Standard - Reliable Two-Phase Cooling',
          'Dependable two-phase cooling system with 240mm radiator and standard pump for excellent cooling performance.',
          '2-4 business days'
        )
      ON CONFLICT (id) DO NOTHING
    `

    console.log('✓ Complete systems created')

    // ========================================================================
    // PRODUCT COMPONENTS (Relationships)
    // ========================================================================

    console.log('\nCreating product component relationships...')

    // Pump A1 components (Standard)
    await sql`
      INSERT INTO product_components (
        parent_product_id, component_product_id, quantity, is_required, is_included, sort_order
      ) VALUES
        ('pump_a01_v1', 'motr_m01_v1', 1, true, true, 1),
        ('pump_a01_v1', 'impl_i01_v1', 1, true, true, 2)
      ON CONFLICT (parent_product_id, component_product_id) DO NOTHING
    `

    // Pump A2 components (Premium)
    await sql`
      INSERT INTO product_components (
        parent_product_id, component_product_id, quantity, is_required, is_included, sort_order
      ) VALUES
        ('pump_a02_v1', 'motr_m02_v1', 1, true, true, 1),
        ('pump_a02_v1', 'impl_i02_v1', 1, true, true, 2)
      ON CONFLICT (parent_product_id, component_product_id) DO NOTHING
    `

    // Cooling System Pro components
    await sql`
      INSERT INTO product_components (
        parent_product_id, component_product_id, quantity, is_required, is_included, price_override, sort_order
      ) VALUES
        ('cool_pro_v1', 'pump_a02_v1', 1, true, true, NULL, 1),
        ('cool_pro_v1', 'radi_r02_v1', 1, true, true, NULL, 2),
        ('cool_pro_v1', 'rgbc_c01_v1', 1, true, true, NULL, 3)
      ON CONFLICT (parent_product_id, component_product_id) DO NOTHING
    `

    // Cooling System Standard components
    await sql`
      INSERT INTO product_components (
        parent_product_id, component_product_id, quantity, is_required, is_included, price_override, sort_order
      ) VALUES
        ('cool_std_v1', 'pump_a01_v1', 1, true, true, NULL, 1),
        ('cool_std_v1', 'radi_r01_v1', 1, true, true, NULL, 2),
        ('cool_std_v1', 'rgbc_c01_v1', 1, true, true, NULL, 3)
      ON CONFLICT (parent_product_id, component_product_id) DO NOTHING
    `

    console.log('✓ Component relationships created')

    // ========================================================================
    // SUMMARY
    // ========================================================================

    console.log('\n========================================')
    console.log('✓ Placeholder products seeded successfully!')
    console.log('========================================')

    // Query summary
    const summary = await sql`
      SELECT
        COUNT(*) FILTER (WHERE product_type = 'standalone') as systems,
        COUNT(*) FILTER (WHERE product_type = 'component') as components,
        COUNT(*) as total
      FROM products
    `

    const components = await sql`
      SELECT COUNT(*) as count FROM product_components
    `

    console.log(`\nProducts created:`)
    console.log(`  - Complete Systems: ${summary[0].systems}`)
    console.log(`  - Components: ${summary[0].components}`)
    console.log(`  - Total Products: ${summary[0].total}`)
    console.log(`  - Component Relationships: ${components[0].count}`)

    console.log(`\nProduct hierarchy:`)
    console.log(`  - Cooling System Pro (TPC-COOL-PRO-V01)`)
    console.log(`    ├─ Premium Pump A2 (TPC-PUMP-A02-V01)`)
    console.log(`    │  ├─ Premium Motor M2 (TPC-MOTR-M02-V01)`)
    console.log(`    │  └─ High-Flow Impeller I2 (TPC-IMPL-I02-V01)`)
    console.log(`    ├─ Performance Radiator R2 (TPC-RADI-R02-V01)`)
    console.log(`    └─ RGB Controller C1 (TPC-RGBC-C01-V01)`)

    console.log(`\n  - Cooling System Standard (TPC-COOL-STD-V01)`)
    console.log(`    ├─ Pump Assembly A1 (TPC-PUMP-A01-V01)`)
    console.log(`    │  ├─ Standard Motor M1 (TPC-MOTR-M01-V01)`)
    console.log(`    │  └─ Standard Impeller I1 (TPC-IMPL-I01-V01)`)
    console.log(`    ├─ Compact Radiator R1 (TPC-RADI-R01-V01)`)
    console.log(`    └─ RGB Controller C1 (TPC-RGBC-C01-V01)`)

    console.log(`\nTest the system:`)
    console.log(`  1. GET /api/admin/products - List all products`)
    console.log(`  2. GET /api/admin/products/cool_pro_v1/components?pricing=true - View component tree`)
    console.log(`  3. Create an order with 'cool_pro_v1' to test snapshot creation`)

  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  } finally {
    await sql.end()
  }
}

seedProducts().catch((error) => {
  console.error(error)
  process.exit(1)
})
