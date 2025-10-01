/**
 * Products API Routes
 * GET - Fetch all products from database
 */

import { NextResponse } from 'next/server'
import { db, products } from '@/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

export async function GET() {
  try {
    const allProducts = await db.select().from(products)

    // Parse JSON fields if using SQLite (Postgres stores them natively)
    const parsedProducts = usePostgres
      ? allProducts
      : allProducts.map((product: any) => ({
          ...product,
          features: JSON.parse(product.features as string),
          specifications: JSON.parse(product.specifications as string),
          images: JSON.parse(product.images as string),
          categories: JSON.parse(product.categories as string),
          tags: JSON.parse(product.tags as string),
        }))

    return NextResponse.json(parsedProducts)
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
