/**
 * Products API Routes
 * GET - Fetch all products from database
 */

import { db, products } from '@/db'
import type { Product } from '@/db/schemas/catalog'
import { logger } from '@/lib/logger'
import { apiSuccess, apiInternalError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const allProducts = await db.select().from(products)

    // Filter out sunsetted and discontinued products (only show active products)
    const activeProducts = allProducts.filter(
      (product: Product) => product.status === 'active' && product.isAvailableForPurchase === true
    )

    return apiSuccess(activeProducts, {
      meta: {
        count: activeProducts.length,
        total: allProducts.length,
        filtered: allProducts.length - activeProducts.length,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch products', error)
    return apiInternalError('Failed to fetch products', { error })
  }
}
