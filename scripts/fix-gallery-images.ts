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

async function fixGalleryImages() {
  try {
    console.log('🔧 Fixing gallery images...\n')

    // Update Content Creator Workstation Build
    const contentCreatorImages = [
      {
        url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop',
        type: 'main',
        altText: 'Content Creator Build',
      },
      {
        url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=600&fit=crop',
        type: 'gallery',
        altText: 'Interior View',
      },
      {
        url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&h=600&fit=crop',
        type: 'gallery',
        altText: 'Cable Management',
      },
      {
        url: 'https://images.unsplash.com/photo-1618472609581-0674e9bc5b97?w=800&h=600&fit=crop',
        type: 'gallery',
        altText: 'RGB Effects',
      },
    ]

    await db.execute(sql`
      UPDATE products
      SET images = ${JSON.stringify(contentCreatorImages)}::jsonb
      WHERE slug = 'content-creator-workstation-build'
    `)
    console.log('✅ Updated Content Creator Workstation Build images')

    // Update Extreme Water-Cooled Gaming PC
    const extremePcImages = [
      {
        url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop',
        type: 'main',
        altText: 'Extreme Water-Cooled PC Front View',
      },
      {
        url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=600&fit=crop',
        type: 'gallery',
        altText: 'Custom Loop Side View',
      },
      {
        url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&h=600&fit=crop',
        type: 'gallery',
        altText: 'Top Radiator View',
      },
      {
        url: 'https://images.unsplash.com/photo-1618472609581-0674e9bc5b97?w=800&h=600&fit=crop',
        type: 'gallery',
        altText: 'Water Block Details',
      },
    ]

    await db.execute(sql`
      UPDATE products
      SET images = ${JSON.stringify(extremePcImages)}::jsonb
      WHERE slug = 'extreme-water-cooled-gaming-pc-i9-14900k-rtx-4090'
    `)
    console.log('✅ Updated Extreme Water-Cooled Gaming PC images')

    console.log('\n✅ All gallery images updated!')

    // Verify the updates
    const result = await db.execute(sql`
      SELECT slug, images
      FROM products
      WHERE product_type = 'standalone'
    `)

    console.log('\n📋 Verified updated images:')
    result.rows.forEach((row: any) => {
      console.log(`\n${row.slug}:`)
      console.log(JSON.stringify(row.images, null, 2))
    })
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

fixGalleryImages()
