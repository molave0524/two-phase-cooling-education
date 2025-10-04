/**
 * Database Seed Script
 * Seeds the database with product catalog data
 * PostgreSQL only
 */

import { db, products } from './index'
import { PRODUCTS } from '@/data/products'
import { logger } from '@/lib/logger'

async function seed() {
  logger.info('Seeding database...')
  logger.info('Using database: PostgreSQL')

  try {
    // Clear existing products
    await db.delete(products)
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
        features: product.features,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        estimatedShipping: product.estimatedShipping || null,
        specifications: product.specifications,
        images: product.images,
        categories: product.categories,
        tags: product.tags,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }

      await db.insert(products).values(productData)
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
