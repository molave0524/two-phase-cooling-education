/**
 * Single Product API Routes
 * GET - Fetch product by slug
 */

import { NextRequest } from 'next/server'
import { db, products } from '@/db'
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

    // Parse JSON fields if using SQLite (Postgres stores them natively)
    const parsedProduct = usePostgres
      ? product
      : {
          ...product,
          features: JSON.parse(product.features as string),
          specifications: JSON.parse(product.specifications as string),
          images: JSON.parse(product.images as string),
          categories: JSON.parse(product.categories as string),
          tags: JSON.parse(product.tags as string),
        }

    return apiSuccess(parsedProduct)
  } catch (error) {
    logger.error('Failed to fetch product', error)
    return apiInternalError('Failed to fetch product', { error })
  }
}
