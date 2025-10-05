/**
 * Products API Routes
 * GET - Fetch all products from database
 */

import { db, products } from '@/db'
import type { Product } from '@/db/schema-pg'
import { logger } from '@/lib/logger'
import { apiSuccess, apiInternalError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

export async function GET() {
  try {
    // Type assertion needed due to dual-database union type incompatibility
    const allProducts = await (db.select() as any).from(products)

    // Filter out sunsetted and discontinued products (only show active products)
    const activeProducts = allProducts.filter(
      (product: Product) =>
        product.status === 'active' &&
        product.isAvailableForPurchase === true
    )

    // Parse JSON fields if using SQLite (Postgres stores them natively)
    const parsedProducts = usePostgres
      ? activeProducts
      : activeProducts.map((product: Product) => ({
          ...product,
          features: JSON.parse(product.features as string),
          specifications: JSON.parse(product.specifications as string),
          images: JSON.parse(product.images as string),
          categories: JSON.parse(product.categories as string),
          tags: JSON.parse(product.tags as string),
        }))

    return apiSuccess(parsedProducts, {
      meta: {
        count: parsedProducts.length,
        total: allProducts.length,
        filtered: allProducts.length - parsedProducts.length
      },
    })
  } catch (error) {
    logger.error('Failed to fetch products', error)
    return apiInternalError('Failed to fetch products', { error })
  }
}
