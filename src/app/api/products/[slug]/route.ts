/**
 * Single Product API Routes
 * GET - Fetch product by slug with inventory status
 */

import { NextRequest } from 'next/server'
import { db, products, productComponents } from '@/db'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { apiSuccess, apiNotFound, apiInternalError } from '@/lib/api-response'
import { getInventoryStatus } from '@/lib/inventory'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const dynamicParams = true

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await db.query.products?.findFirst({
      where: eq(products.slug, slug),
    })

    if (!product) {
      return apiNotFound('Product', { details: { slug } })
    }

    // Fetch component products if this product has components
    // (applies to both standalone builds AND component kits)
    let components: any[] = []
    if (product.productType === 'standalone' || product.productType === 'component') {
      // Get component relationships
      const componentRelations = await db
        .select({
          component: products,
          relation: productComponents,
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.componentProductId, products.id))
        .where(eq(productComponents.parentProductId, product.id))

      // Sort by price (desc) then SKU (asc)
      components = componentRelations
        .map(({ component, relation }: any) => ({
          ...component,
          // Add relation metadata
          quantity: relation.quantity,
          isRequired: relation.isRequired,
          isIncluded: relation.isIncluded,
          displayOrder: relation.displayOrder,
        }))
        .sort((a: any, b: any) => {
          // Sort by price descending
          if (b.price !== a.price) {
            return b.price - a.price
          }
          // Tiebreaker: sort by SKU ascending
          return a.sku.localeCompare(b.sku)
        })
    }

    // Fetch parent products (standalone builds) that include this component
    let usedInProducts: any[] = []
    if (product.productType === 'component') {
      const parentRelations = await db
        .select({
          parent: products,
          relation: productComponents,
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.parentProductId, products.id))
        .where(eq(productComponents.componentProductId, product.id))

      // Filter to only show standalone products
      usedInProducts = parentRelations
        .filter(({ parent }: any) => parent.productType === 'standalone')
        .map(({ parent, relation }: any) => ({
          ...parent,
          // Add relation metadata
          quantity: relation.quantity,
          displayName: relation.displayName,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
    }

    // Get inventory status for the product
    let inventoryStatus
    try {
      inventoryStatus = await getInventoryStatus(product.id)
    } catch (error) {
      logger.warn('Failed to get inventory status', { productId: product.id, error })
      // Default inventory status on error
      inventoryStatus = {
        status: 'in_stock',
        availableQuantity: product.stockQuantity,
        stockQuantity: product.stockQuantity,
        reservedQuantity: 0,
        lowStockThreshold: product.lowStockThreshold,
      }
    }

    return apiSuccess({
      ...product,
      inventory: inventoryStatus,
      components,
      usedInProducts,
    })
  } catch (error) {
    logger.error('Failed to fetch product', error)
    return apiInternalError('Failed to fetch product', { error })
  }
}
