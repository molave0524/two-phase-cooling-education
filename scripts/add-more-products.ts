/**
 * Add 8 More Products
 *
 * Creates additional standalone cooling system products
 */

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function addProducts() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    throw new Error('No database connection string found')
  }

  console.log('Connecting to database...')
  const sql = postgres(connectionString, { max: 1 })

  try {
    console.log('\nCreating 8 new standalone products...')

    await sql`
      INSERT INTO products (
        id, sku, sku_prefix, sku_category, sku_product_code, sku_version,
        name, slug, price, currency,
        description, short_description, features, specifications, images,
        categories, tags, product_type, version, status, is_available_for_purchase,
        in_stock, stock_quantity
      ) VALUES
        (
          'cool_elite_v1', 'TPC-COOL-ELT-V01', 'TPC', 'COOL', 'ELT', 'V01',
          'Cooling System Elite', 'cooling-system-elite',
          1299.99, 'USD',
          'Elite-tier two-phase cooling with advanced features and premium build quality',
          'Top-tier cooling solution with premium components',
          '["Dual pump system", "480mm radiator", "Advanced RGB", "Premium materials", "5-year warranty"]'::jsonb,
          '{"cooling": {"capacity": "450W TDP"}, "warranty": {"duration": "5 years"}}'::jsonb,
          '["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "premium"]'::jsonb,
          '["elite", "premium", "dual-pump"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 15
        ),
        (
          'cool_compact_v1', 'TPC-COOL-CMP-V01', 'TPC', 'COOL', 'CMP', 'V01',
          'Cooling System Compact', 'cooling-system-compact',
          499.99, 'USD',
          'Space-saving two-phase cooling perfect for small form factor builds',
          'Compact cooling for SFF cases',
          '["Small footprint", "120mm radiator", "Quiet operation", "Easy installation"]'::jsonb,
          '{"cooling": {"capacity": "200W TDP"}, "warranty": {"duration": "2 years"}}'::jsonb,
          '["https://images.unsplash.com/photo-1591799265444-d66432b91588?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "compact"]'::jsonb,
          '["compact", "sff", "small"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 30
        ),
        (
          'cool_silent_v1', 'TPC-COOL-SLT-V01', 'TPC', 'COOL', 'SLT', 'V01',
          'Cooling System Silent', 'cooling-system-silent',
          799.99, 'USD',
          'Ultra-quiet two-phase cooling optimized for silent operation',
          'Whisper-quiet premium cooling',
          '["Under 20dBA", "280mm radiator", "Silent pump", "Acoustic dampening"]'::jsonb,
          '{"cooling": {"capacity": "300W TDP"}, "warranty": {"duration": "3 years"}}'::jsonb,
          '["https://images.unsplash.com/photo-1555680202-c65f8e73afb8?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "silent"]'::jsonb,
          '["silent", "quiet", "acoustic"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 20
        ),
        (
          'cool_rgb_v1', 'TPC-COOL-RGB-V01', 'TPC', 'COOL', 'RGB', 'V01',
          'Cooling System RGB Max', 'cooling-system-rgb-max',
          899.99, 'USD',
          'Feature-rich two-phase cooling with extensive RGB lighting and customization',
          'Maximum RGB customization and cooling',
          '["Addressable RGB", "360mm radiator", "RGB controller", "Software control"]'::jsonb,
          '{"cooling": {"capacity": "350W TDP"}, "warranty": {"duration": "3 years"}}'::jsonb,
          '["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "rgb"]'::jsonb,
          '["rgb", "lighting", "addressable"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 25
        ),
        (
          'cool_industrial_v1', 'TPC-COOL-IND-V01', 'TPC', 'COOL', 'IND', 'V01',
          'Cooling System Industrial', 'cooling-system-industrial',
          1599.99, 'USD',
          'Industrial-grade two-phase cooling for workstations and servers',
          'Professional workstation cooling',
          '["24/7 operation", "Dual 360mm radiators", "Server-grade components", "Extended warranty"]'::jsonb,
          '{"cooling": {"capacity": "500W TDP"}, "warranty": {"duration": "7 years"}}'::jsonb,
          '["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "professional"]'::jsonb,
          '["industrial", "server", "workstation"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 10
        ),
        (
          'cool_budget_v1', 'TPC-COOL-BDG-V01', 'TPC', 'COOL', 'BDG', 'V01',
          'Cooling System Budget', 'cooling-system-budget',
          399.99, 'USD',
          'Affordable two-phase cooling for entry-level builds',
          'Budget-friendly cooling solution',
          '["Cost-effective", "240mm radiator", "Basic RGB", "1-year warranty"]'::jsonb,
          '{"cooling": {"capacity": "180W TDP"}, "warranty": {"duration": "1 year"}}'::jsonb,
          '["https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "budget"]'::jsonb,
          '["budget", "affordable", "entry"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 40
        ),
        (
          'cool_overclock_v1', 'TPC-COOL-OVR-V01', 'TPC', 'COOL', 'OVR', 'V01',
          'Cooling System Overclock', 'cooling-system-overclock',
          1099.99, 'USD',
          'High-performance two-phase cooling designed for extreme overclocking',
          'Extreme cooling for overclocking',
          '["Extreme performance", "420mm radiator", "High-flow pump", "Overclocking optimized"]'::jsonb,
          '{"cooling": {"capacity": "400W TDP"}, "warranty": {"duration": "4 years"}}'::jsonb,
          '["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "performance"]'::jsonb,
          '["overclock", "extreme", "performance"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 18
        ),
        (
          'cool_modular_v1', 'TPC-COOL-MOD-V01', 'TPC', 'COOL', 'MOD', 'V01',
          'Cooling System Modular', 'cooling-system-modular',
          949.99, 'USD',
          'Customizable modular two-phase cooling with expandable components',
          'Modular and expandable cooling',
          '["Modular design", "Expandable", "Multiple radiator options", "Custom tubing"]'::jsonb,
          '{"cooling": {"capacity": "375W TDP"}, "warranty": {"duration": "3 years"}}'::jsonb,
          '["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"]'::jsonb,
          '["cooling", "modular"]'::jsonb,
          '["modular", "custom", "expandable"]'::jsonb,
          'standalone', 1, 'active', true,
          true, 22
        )
    `

    console.log('✅ Created 8 new products successfully!')

  } catch (error) {
    console.error('Error creating products:', error)
    throw error
  } finally {
    await sql.end()
  }
}

addProducts()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
