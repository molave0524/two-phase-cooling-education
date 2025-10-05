import { NextRequest } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { apiSuccess, apiNotFound } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  const { sku } = params

  // Look up product by SKU
  const product = await db.query.products.findFirst({
    where: eq(products.sku, sku),
  })

  if (!product) {
    return apiNotFound('Product')
  }

  return apiSuccess(product)
}
