/**
 * Products API Routes
 * GET - Fetch all products from database with inventory status
 * Falls back to sample data if NEXT_PUBLIC_USE_SAMPLE_DATA is true
 */

import { db, products } from '@/db'
import type { Product } from '@/db/schemas/catalog'
import { logger } from '@/lib/logger'
import { apiSuccess, apiInternalError } from '@/lib/api-response'
import { getInventoryStatus } from '@/lib/inventory'
import { PRODUCTS } from '@/data/products'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Use sample data if configured
    const useSampleData = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === 'true'

    let allProducts: any[]

    if (useSampleData) {
      logger.info('Using sample product data')
      allProducts = PRODUCTS
    } else {
      logger.info('Fetching products from database')
      allProducts = await db.select().from(products)
    }

    // Filter out sunsetted and discontinued products (only show active products)
    const activeProducts = allProducts.filter(
      (product: Product) => product.status === 'active' && product.isAvailableForPurchase === true
    )

    // Add inventory status to each product
    const productsWithInventory = await Promise.all(
      activeProducts.map(async (product: any) => {
        try {
          const inventoryStatus = await getInventoryStatus(product.id)
          return {
            ...product,
            inventory: inventoryStatus,
          }
        } catch (error) {
          logger.warn('Failed to get inventory status for product', {
            productId: product.id,
            error,
          })
          // Return product with default inventory status on error
          return {
            ...product,
            inventory: {
              status: 'in_stock',
              availableQuantity: product.stockQuantity,
              stockQuantity: product.stockQuantity,
              reservedQuantity: 0,
              lowStockThreshold: product.lowStockThreshold,
            },
          }
        }
      })
    )

    return apiSuccess(productsWithInventory, {
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
