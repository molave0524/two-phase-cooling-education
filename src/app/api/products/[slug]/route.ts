/**
 * Single Product API Routes
 * GET - Fetch product by slug
 */

import { NextRequest } from 'next/server'
import { db, products, productComponents } from '@/db'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { apiSuccess, apiNotFound, apiInternalError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const dynamicParams = true

const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

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

    // Fetch component products if this is a standalone product
    let components: any[] = []
    if (product.productType === 'standalone') {
      // Get component relationships
      const componentRelations = await db
        .select({
          component: products,
          relation: productComponents,
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.componentProductId, products.id))
        .where(eq(productComponents.parentProductId, product.id))

      // Sort by price (desc) then SKU (asc) and parse JSON fields
      components = componentRelations
        .map(({ component, relation }: any) => ({
          ...component,
          // Parse JSON fields if using SQLite
          features: usePostgres ? component.features : JSON.parse(component.features as string),
          specifications: usePostgres
            ? component.specifications
            : JSON.parse(component.specifications as string),
          images: usePostgres ? component.images : JSON.parse(component.images as string),
          categories: usePostgres
            ? component.categories
            : JSON.parse(component.categories as string),
          tags: usePostgres ? component.tags : JSON.parse(component.tags as string),
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

    // Parse JSON fields if using SQLite (Postgres stores them natively)
    const parsedProduct = usePostgres
      ? { ...product, components }
      : {
          ...product,
          features: JSON.parse(product.features as string),
          specifications: JSON.parse(product.specifications as string),
          images: JSON.parse(product.images as string),
          categories: JSON.parse(product.categories as string),
          tags: JSON.parse(product.tags as string),
          components,
        }

    return apiSuccess(parsedProduct)
  } catch (error) {
    logger.error('Failed to fetch product', error)
    return apiInternalError('Failed to fetch product', { error })
  }
}
