import { db, products } from '../src/db'
import { eq } from 'drizzle-orm'

async function updateToPicsum() {
  console.log('Updating product images to use picsum.photos...')

  try {
    const allProducts = await db.select().from(products)

    console.log(`Found ${allProducts.length} products`)

    const imageCategories = [
      { id: 237, name: 'technology' },
      { id: 1, name: 'abstract' },
      { id: 10, name: 'nature' },
      { id: 20, name: 'people' },
      { id: 30, name: 'architecture' },
    ]

    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i]
      const categoryId = imageCategories[i % imageCategories.length].id

      const newImages = [
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

      await db
        .update(products)
        .set({ images: newImages as any })
        .where(eq(products.id, product.id))

      console.log(`✓ Updated ${product.name}`)
    }

    console.log('\n✅ All products updated with picsum.photos images!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  process.exit(0)
}

updateToPicsum()
