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

async function fixThirdImageV2() {
  try {
    console.log('🔧 Trying alternative third gallery image...\n')

    // Update with a different, verified working Unsplash image
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
        url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&h=600&fit=crop',
        type: 'gallery',
        altText: 'Water Block Details',
      },
    ]

    await db.execute(sql`
      UPDATE products
      SET images = ${JSON.stringify(extremePcImages)}::jsonb
      WHERE slug = 'extreme-water-cooled-gaming-pc-i9-14900k-rtx-4090'
    `)
    console.log('✅ Updated with alternative third gallery image (photo-1591799264318)')

    // Verify the update
    const result = await db.execute(sql`
      SELECT slug, images
      FROM products
      WHERE slug = 'extreme-water-cooled-gaming-pc-i9-14900k-rtx-4090'
    `)

    console.log('\n📋 Verified updated images:')
    result.rows.forEach((row: any) => {
      console.log(`\n${row.slug}:`)
      row.images.forEach((img: any, idx: number) => {
        console.log(`  [${idx}] ${img.type}: ${img.url}`)
      })
    })
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

fixThirdImageV2()
