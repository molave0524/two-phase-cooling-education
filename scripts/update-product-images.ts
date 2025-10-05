/**
 * Update Product Images
 *
 * Updates placeholder images with real images from Unsplash
 */

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function updateImages() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    throw new Error('No database connection string found')
  }

  console.log('Connecting to database...')
  const sql = postgres(connectionString, { max: 1 })

  try {
    console.log('\nUpdating product images...')

    // Cooling System Pro - PC cooling/water cooling images
    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&h=800&fit=crop'
      ])}::jsonb
      WHERE id = 'cool_pro_v1'
    `
    console.log('✓ Updated Cooling System Pro')

    // Cooling System Standard
    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1591799265444-d66432b91588?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1555680202-c65f8e73afb8?w=800&h=800&fit=crop'
      ])}::jsonb
      WHERE id = 'cool_std_v1'
    `
    console.log('✓ Updated Cooling System Standard')

    // Motors - tech/circuit board images
    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop'
      ])}::jsonb
      WHERE id = 'motr_m01_v1'
    `
    console.log('✓ Updated Motor M1')

    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&h=400&fit=crop'
      ])}::jsonb
      WHERE id = 'motr_m02_v1'
    `
    console.log('✓ Updated Motor M2')

    // Impellers - hardware/component images
    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop'
      ])}::jsonb
      WHERE id = 'impl_i01_v1'
    `
    console.log('✓ Updated Impeller I1')

    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=400&fit=crop'
      ])}::jsonb
      WHERE id = 'impl_i02_v1'
    `
    console.log('✓ Updated Impeller I2')

    // Pumps - PC hardware images
    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop'
      ])}::jsonb
      WHERE id = 'pump_a01_v1'
    `
    console.log('✓ Updated Pump A1')

    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=600&fit=crop'
      ])}::jsonb
      WHERE id = 'pump_a02_v1'
    `
    console.log('✓ Updated Pump A2')

    // Radiators - cooling system images
    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&h=600&fit=crop'
      ])}::jsonb
      WHERE id = 'radi_r01_v1'
    `
    console.log('✓ Updated Radiator R1')

    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop'
      ])}::jsonb
      WHERE id = 'radi_r02_v1'
    `
    console.log('✓ Updated Radiator R2')

    // RGB Controller - LED/RGB images
    await sql`
      UPDATE products
      SET images = ${JSON.stringify([
        'https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=400&h=400&fit=crop'
      ])}::jsonb
      WHERE id = 'rgbc_c01_v1'
    `
    console.log('✓ Updated RGB Controller')

    console.log('\n✅ All product images updated successfully!')

  } catch (error) {
    console.error('Error updating images:', error)
    throw error
  } finally {
    await sql.end()
  }
}

updateImages()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
