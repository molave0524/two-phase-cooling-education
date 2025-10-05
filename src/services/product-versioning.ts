/**
 * Product Versioning Service
 *
 * Handles product version management, lifecycle operations (sunset/discontinue),
 * and checks for product usage in orders.
 */

import { db } from '@/db'
import { products, orderItems } from '@/db/schema-pg'
import { eq, sql } from 'drizzle-orm'
import { generateSKU, incrementVersion, parseSKU } from '@/lib/sku'
import type { Product } from '@/db/schema-pg'

export interface ProductVersionOptions {
  versionNotes?: string
  priceChange?: number
  componentPriceChange?: number
  updateFields?: Partial<typeof products.$inferInsert>
}

/**
 * Check if product is used in any orders (at any depth)
 */
export async function isProductInOrders(productId: string): Promise<boolean> {
  // Check as root product
  const asRoot = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(orderItems)
    .where(eq(orderItems.productId, productId))

  if (asRoot[0].count > 0) return true

  // Check as component in JSONB tree (depth 1 or depth 2)
  const asComponent = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(orderItems)
    .where(
      sql`EXISTS (
        SELECT 1
        FROM jsonb_array_elements(${orderItems.componentTree}) AS comp
        WHERE comp->>'componentId' = ${productId}
        UNION
        SELECT 1
        FROM jsonb_array_elements(${orderItems.componentTree}) AS comp,
             jsonb_array_elements(comp->'components') AS subcomp
        WHERE subcomp->>'componentId' = ${productId}
      )`
    )

  return asComponent[0].count > 0
}

/**
 * Create new version of product
 */
export async function createProductVersion(
  productId: string,
  options: ProductVersionOptions = {}
): Promise<Product> {
  const currentProduct = await db.query.products.findFirst({
    where: eq(products.id, productId)
  })

  if (!currentProduct) {
    throw new Error(`Product not found: ${productId}`)
  }

  // Generate new SKU with incremented version
  const newSKU = incrementVersion(currentProduct.sku)
  const skuComponents = parseSKU(newSKU)

  // Create new product record
  const baseId = currentProduct.baseProductId || productId
  const newProductId = `${baseId}_v${skuComponents.version}`

  const [newProduct] = await db.insert(products).values({
    id: newProductId,
    sku: newSKU,
    skuPrefix: skuComponents.prefix,
    skuCategory: skuComponents.category,
    skuProductCode: skuComponents.productCode,
    skuVersion: `V${skuComponents.version.toString().padStart(2, '0')}`,

    // Copy existing fields
    name: currentProduct.name,
    slug: `${currentProduct.slug}-v${skuComponents.version}`,
    price: options.priceChange ?? currentProduct.price,
    componentPrice: options.componentPriceChange ?? currentProduct.componentPrice,
    originalPrice: currentProduct.originalPrice,
    currency: currentProduct.currency,
    description: currentProduct.description,
    shortDescription: currentProduct.shortDescription,
    features: currentProduct.features,
    specifications: currentProduct.specifications,
    images: currentProduct.images,
    categories: currentProduct.categories,
    tags: currentProduct.tags,
    metaTitle: currentProduct.metaTitle,
    metaDescription: currentProduct.metaDescription,
    productType: currentProduct.productType,
    inStock: currentProduct.inStock,
    stockQuantity: currentProduct.stockQuantity,
    estimatedShipping: currentProduct.estimatedShipping,

    // Versioning fields
    version: skuComponents.version,
    baseProductId: baseId,
    previousVersionId: productId,

    // Lifecycle
    status: 'active',
    isAvailableForPurchase: true,

    // Apply custom updates
    ...options.updateFields,
  }).returning()

  // Update old product to point to new version
  await db.update(products)
    .set({ replacedBy: newProductId })
    .where(eq(products.id, productId))

  return newProduct
}

/**
 * Sunset product (make unavailable for new purchases)
 */
export async function sunsetProduct(
  productId: string,
  reason: string,
  replacementProductId?: string
): Promise<void> {
  await db.update(products)
    .set({
      status: 'sunset',
      isAvailableForPurchase: false,
      sunsetDate: new Date(),
      sunsetReason: reason,
      replacedBy: replacementProductId,
    })
    .where(eq(products.id, productId))
}

/**
 * Discontinue product (completely remove from system)
 */
export async function discontinueProduct(
  productId: string,
  reason: string
): Promise<void> {
  const inOrders = await isProductInOrders(productId)

  if (inOrders) {
    throw new Error('Cannot discontinue product that exists in orders. Use sunset instead.')
  }

  await db.update(products)
    .set({
      status: 'discontinued',
      isAvailableForPurchase: false,
      discontinuedDate: new Date(),
      sunsetReason: reason,
    })
    .where(eq(products.id, productId))
}

/**
 * Get all versions of a product
 */
export async function getProductVersions(baseProductId: string): Promise<Product[]> {
  const versions = await db
    .select()
    .from(products)
    .where(
      sql`${products.baseProductId} = ${baseProductId} OR ${products.id} = ${baseProductId}`
    )
    .orderBy(products.version)

  return versions
}

/**
 * Get latest version of a product
 */
export async function getLatestVersion(baseProductId: string): Promise<Product | undefined> {
  const versions = await getProductVersions(baseProductId)
  return versions[versions.length - 1]
}

/**
 * Check if product should be versioned (has orders)
 */
export async function shouldCreateVersion(productId: string): Promise<boolean> {
  return await isProductInOrders(productId)
}
