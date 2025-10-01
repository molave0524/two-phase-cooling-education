/**
 * Single Product API Routes
 * GET - Fetch product by slug
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, products } from '@/db'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
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

    return NextResponse.json(parsedProduct)
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}
