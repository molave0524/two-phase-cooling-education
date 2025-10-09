// Seed Neon DEV database directly (bypasses .env.local)
import postgres from 'postgres'
import * as fs from 'fs'
import * as path from 'path'

const NEON_DEV_URL =
  'postgresql://neondb_owner:npg_2LT0RAEwKjeN@ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

async function seedNeonDev() {
  const sql = postgres(NEON_DEV_URL)

  try {
    console.log('🌱 Seeding Neon DEV database...\n')

    // Read and execute seed SQL
    const sqlFile = path.join(process.cwd(), 'seed-products.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8')

    await sql.unsafe(sqlContent)
    console.log('✅ Seed SQL executed')

    // Update images to picsum
    console.log('\n📸 Updating images to picsum.photos...')

    const products = await sql`SELECT id, slug, name FROM products`

    for (const product of products) {
      const images = [
        {
          url: `https://picsum.photos/seed/${product.slug}-1/600/400`,
          altText: `${product.name} - Image 1`,
          isPrimary: true,
        },
        {
          url: `https://picsum.photos/seed/${product.slug}-2/600/400`,
          altText: `${product.name} - Image 2`,
          isPrimary: false,
        },
        {
          url: `https://picsum.photos/seed/${product.slug}-3/600/400`,
          altText: `${product.name} - Image 3`,
          isPrimary: false,
        },
      ]

      await sql`
        UPDATE products
        SET images = ${JSON.stringify(images)}::jsonb
        WHERE id = ${product.id}
      `
      console.log(`✓ ${product.name}`)
    }

    const count = await sql`SELECT COUNT(*) as count FROM products`
    console.log(`\n✅ Neon DEV now has ${count[0].count} products!`)

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    await sql.end()
    process.exit(1)
  }
}

seedNeonDev()
