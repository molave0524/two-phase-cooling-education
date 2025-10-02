/**
 * Database Seed Script
 * Seeds the database with product catalog data
 * Works with both PostgreSQL and SQLite
 */

import { db, products } from './index'
import { PRODUCTS } from '@/data/products'
import { logger } from '@/lib/logger'

const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

async function seed() {
  logger.info('Seeding database...')
  logger.info(`Using database: ${usePostgres ? 'PostgreSQL' : 'SQLite'}`)

  try {
    // Clear existing products
    // Type assertion needed due to dual-database union type incompatibility
    await (db.delete as any)(products)
    logger.info('Cleared existing products')

    // Insert products from catalog
    for (const product of PRODUCTS) {
      const productData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        originalPrice: product.originalPrice || null,
        currency: product.currency,
        description: product.description,
        shortDescription: product.shortDescription,
        features: usePostgres ? product.features : JSON.stringify(product.features),
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        estimatedShipping: product.estimatedShipping || null,
        specifications: usePostgres
          ? product.specifications
          : JSON.stringify(product.specifications),
        images: usePostgres ? product.images : JSON.stringify(product.images),
        categories: usePostgres ? product.categories : JSON.stringify(product.categories),
        tags: usePostgres ? product.tags : JSON.stringify(product.tags),
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }

      // Type assertion needed due to dual-database union type incompatibility
      await (db.insert as any)(products).values(productData)
      logger.info('Inserted product', { name: product.name })
    }

    logger.info(`Successfully seeded ${PRODUCTS.length} products!`)
    process.exit(0)
  } catch (error) {
    logger.error('Seed failed', error)
    process.exit(1)
  }
}

seed()
