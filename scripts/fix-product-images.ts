import { db, products } from '../src/db'
import { eq, like, sql } from 'drizzle-orm'

async function fixProductImages() {
  console.log('Fetching products with via.placeholder.com images...')

  try {
    // Get all products
    const allProducts = await db.select().from(products)

    console.log(`Found ${allProducts.length} total products`)

    // Update each product that has via.placeholder.com in images
    for (const product of allProducts) {
      const images = product.images as string[]
      const hasPlaceholder = images.some(img => img.includes('via.placeholder.com'))

      if (hasPlaceholder) {
        console.log(`Updating product: ${product.name}`)

        // Replace via.placeholder.com with placehold.co
        const updatedImages = images.map(img => img.replace('via.placeholder.com', 'placehold.co'))

        await db
          .update(products)
          .set({ images: updatedImages as any })
          .where(eq(products.id, product.id))

        console.log(`✓ Updated ${product.name}`)
      }
    }

    console.log('Done!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  process.exit(0)
}

fixProductImages()
