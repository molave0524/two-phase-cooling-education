import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabaseClient } from '@/lib/database/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ProductQuerySchema = z.object({
  category: z.string().optional(),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'price_asc', 'price_desc', 'created_at', 'featured']).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0)
})

// ============================================================================
// PRODUCT SERVICE FUNCTIONS
// ============================================================================

async function getProducts(filters: z.infer<typeof ProductQuerySchema>) {
  const db = getDatabaseClient()

  // Build where clause
  const whereClause: any = {
    is_active: true
  }

  if (filters.category) {
    whereClause.category = {
      contains: filters.category,
      mode: 'insensitive'
    }
  }

  if (filters.featured !== undefined) {
    whereClause.is_featured = filters.featured
  }

  if (filters.inStock) {
    whereClause.stock_quantity = {
      gt: 0
    }
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    whereClause.price_cents = {}
    if (filters.priceMin !== undefined) {
      whereClause.price_cents.gte = filters.priceMin * 100
    }
    if (filters.priceMax !== undefined) {
      whereClause.price_cents.lte = filters.priceMax * 100
    }
  }

  if (filters.search) {
    whereClause.OR = [
      {
        name: {
          contains: filters.search,
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: filters.search,
          mode: 'insensitive'
        }
      }
    ]
  }

  // Build order by clause
  let orderBy: any = { sort_order: 'asc' }

  switch (filters.sortBy) {
    case 'name':
      orderBy = { name: 'asc' }
      break
    case 'price_asc':
      orderBy = { price_cents: 'asc' }
      break
    case 'price_desc':
      orderBy = { price_cents: 'desc' }
      break
    case 'created_at':
      orderBy = { created_at: 'desc' }
      break
    case 'featured':
      orderBy = [{ is_featured: 'desc' }, { sort_order: 'asc' }]
      break
  }

  // Execute query
  const [products, totalCount] = await Promise.all([
    db.products.findMany({
      where: whereClause,
      orderBy,
      take: filters.limit,
      skip: filters.offset,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price_cents: true,
        compare_at_price: true,
        currency: true,
        category: true,
        specifications: true,
        features: true,
        images: true,
        stock_quantity: true,
        sku: true,
        is_featured: true,
        sort_order: true,
        meta_title: true,
        meta_description: true,
        created_at: true,
        updated_at: true
      }
    }),
    db.products.count({ where: whereClause })
  ])

  return {
    products: products.map(product => ({
      ...product,
      specifications: product.specifications || {},
      features: product.features || [],
      images: product.images || []
    })),
    pagination: {
      total: totalCount,
      limit: filters.limit,
      offset: filters.offset,
      hasMore: filters.offset + filters.limit < totalCount
    }
  }
}

async function getProductBySlug(slug: string) {
  const db = getDatabaseClient()

  const product = await db.products.findFirst({
    where: {
      slug,
      is_active: true
    }
  })

  if (!product) {
    return null
  }

  return {
    ...product,
    specifications: product.specifications || {},
    features: product.features || [],
    images: product.images || []
  }
}

async function getFeaturedProducts(limit: number = 6) {
  const db = getDatabaseClient()

  const products = await db.products.findMany({
    where: {
      is_featured: true,
      is_active: true
    },
    orderBy: { sort_order: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price_cents: true,
      compare_at_price: true,
      currency: true,
      category: true,
      features: true,
      images: true,
      stock_quantity: true,
      is_featured: true
    }
  })

  return products.map(product => ({
    ...product,
    features: product.features || [],
    images: product.images || []
  }))
}

async function getProductCategories() {
  const db = getDatabaseClient()

  const categories = await db.products.groupBy({
    by: ['category'],
    where: {
      is_active: true
    },
    _count: {
      category: true
    },
    orderBy: {
      _count: {
        category: 'desc'
      }
    }
  })

  return categories.map(cat => ({
    name: cat.category,
    count: cat._count.category
  }))
}

// ============================================================================
// GET - Retrieve products
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Handle special endpoints
    const action = searchParams.get('action')
    const slug = searchParams.get('slug')

    if (action === 'featured') {
      const limit = parseInt(searchParams.get('limit') || '6')
      const products = await getFeaturedProducts(limit)
      return NextResponse.json({ products })
    }

    if (action === 'categories') {
      const categories = await getProductCategories()
      return NextResponse.json({ categories })
    }

    if (slug) {
      const product = await getProductBySlug(slug)
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ product })
    }

    // Parse query parameters
    const queryParams = {
      category: searchParams.get('category') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as any || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    // Validate query parameters
    const validation = ProductQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const result = await getProducts(validation.data)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error retrieving products:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve products' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Search products (for complex search with body)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extended search schema for POST requests
    const SearchSchema = ProductQuerySchema.extend({
      specifications: z.record(z.any()).optional(),
      features: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional()
    })

    const validation = SearchSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const filters = validation.data
    const db = getDatabaseClient()

    // Build complex where clause for advanced search
    const whereClause: any = {
      is_active: true
    }

    // Basic filters (same as GET)
    if (filters.category) {
      whereClause.category = {
        contains: filters.category,
        mode: 'insensitive'
      }
    }

    if (filters.featured !== undefined) {
      whereClause.is_featured = filters.featured
    }

    if (filters.inStock) {
      whereClause.stock_quantity = {
        gt: 0
      }
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      whereClause.price_cents = {}
      if (filters.priceMin !== undefined) {
        whereClause.price_cents.gte = filters.priceMin * 100
      }
      if (filters.priceMax !== undefined) {
        whereClause.price_cents.lte = filters.priceMax * 100
      }
    }

    // Advanced filters
    if (filters.specifications) {
      // Search in JSON specifications field
      whereClause.specifications = {
        path: [],
        string_contains: JSON.stringify(filters.specifications)
      }
    }

    if (filters.features && filters.features.length > 0) {
      // Search for products that have all specified features
      whereClause.features = {
        hasEvery: filters.features
      }
    }

    // Text search
    if (filters.search) {
      whereClause.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Build order by
    let orderBy: any = { sort_order: 'asc' }
    switch (filters.sortBy) {
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'price_asc':
        orderBy = { price_cents: 'asc' }
        break
      case 'price_desc':
        orderBy = { price_cents: 'desc' }
        break
      case 'created_at':
        orderBy = { created_at: 'desc' }
        break
      case 'featured':
        orderBy = [{ is_featured: 'desc' }, { sort_order: 'asc' }]
        break
    }

    // Execute search
    const [products, totalCount] = await Promise.all([
      db.products.findMany({
        where: whereClause,
        orderBy,
        take: filters.limit,
        skip: filters.offset
      }),
      db.products.count({ where: whereClause })
    ])

    return NextResponse.json({
      products: products.map(product => ({
        ...product,
        specifications: product.specifications || {},
        features: product.features || [],
        images: product.images || []
      })),
      pagination: {
        total: totalCount,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < totalCount
      },
      searchCriteria: filters
    })

  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}