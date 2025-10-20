/**
 * Product Management API
 * GET  /api/admin/products - List all products
 * POST /api/admin/products - Create new product
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { generateSKU, parseSKU } from '@/lib/sku'
import { eq } from 'drizzle-orm'
import {
  apiSuccess,
  apiError,
  apiInternalError,
  ERROR_CODES,
  HTTP_STATUS,
} from '@/lib/api-response'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/products
 * List products with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const available = searchParams.get('available')

    let query = db.select().from(products)

    // Apply filters
    if (status) {
      query = query.where(eq(products.status, status)) as any
    }
    if (available === 'true') {
      query = query.where(eq(products.isAvailableForPurchase, true)) as any
    }

    const productList = await query

    return apiSuccess(productList)
  } catch (error) {
    logger.error('Failed to fetch products', { error })
    return apiInternalError('Failed to fetch products')
  }
}

/**
 * POST /api/admin/products
 * Create new product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      category,
      productCode,
      price,
      componentPrice,
      description,
      shortDescription,
      features = [],
      specifications = {},
      images = [],
      categories = [],
      tags = [],
      productType = 'standalone',
      inStock = true,
      stockQuantity = 0,
      estimatedShipping,
      metaTitle,
      metaDescription,
    } = body

    // Validate required fields
    if (
      !name ||
      !category ||
      !productCode ||
      price === undefined ||
      !description ||
      !shortDescription
    ) {
      return apiError(
        ERROR_CODES.INVALID_INPUT,
        'Missing required fields: name, category, productCode, price, description, shortDescription',
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Generate SKU
    const sku = generateSKU({
      category,
      productCode,
      version: 1,
    })

    const skuComponents = parseSKU(sku)
    const productId = `${category.toLowerCase()}_${productCode.toLowerCase()}_v1`

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const [product] = await db
      .insert(products)
      .values({
        id: productId,
        sku,
        skuPrefix: skuComponents.prefix,
        skuCategory: skuComponents.category,
        skuProductCode: skuComponents.productCode,
        skuVersion: `V${skuComponents.version.toString().padStart(2, '0')}`,
        name,
        slug,
        price,
        componentPrice,
        currency: 'USD',
        description,
        shortDescription,
        features,
        specifications,
        images,
        categories,
        tags,
        productType,
        inStock,
        stockQuantity,
        estimatedShipping,
        metaTitle: metaTitle || name,
        metaDescription: metaDescription || shortDescription,
        version: 1,
        status: 'active',
        isAvailableForPurchase: true,
      })
      .returning()

    return apiSuccess(product, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    logger.error('Failed to create product', { error })
    return apiInternalError('Failed to create product')
  }
}
