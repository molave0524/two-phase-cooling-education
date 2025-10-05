/**
 * Product Management API
 * GET  /api/admin/products - List all products
 * POST /api/admin/products - Create new product
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { generateSKU, parseSKU } from '@/lib/sku'
import { eq } from 'drizzle-orm'

/**
 * GET /api/admin/products
 * List products with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
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

    return NextResponse.json(productList)
  } catch (error) {
    // console.error('Product list error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
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
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, category, productCode, price, description, shortDescription',
        },
        { status: 400 }
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    // console.error('Product creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    )
  }
}
