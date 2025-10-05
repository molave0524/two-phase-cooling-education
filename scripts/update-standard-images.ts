import { db } from '../src/db/index'
import { products } from '../src/db/schema-pg'
import { eq } from 'drizzle-orm'

async function updateStandardImages() {
  try {
    console.log('Updating Cooling System Standard images...')

    await db
      .update(products)
      .set({
        images: [
          'https://placehold.co/800x800/0ea5e9/ffffff?text=Standard+Cooling',
          'https://placehold.co/800x800/0284c7/ffffff?text=Image+2',
          'https://placehold.co/800x800/075985/ffffff?text=Image+3',
          'https://placehold.co/800x800/0c4a6e/ffffff?text=Image+4',
          'https://placehold.co/800x800/082f49/ffffff?text=Image+5',
        ],
        updatedAt: new Date(),
      })
      .where(eq(products.id, 'cool_std_v1'))

    console.log('✅ Successfully updated images')
    process.exit(0)
  } catch (error) {
    console.error('Error updating images:', error)
    process.exit(1)
  }
}

updateStandardImages()
