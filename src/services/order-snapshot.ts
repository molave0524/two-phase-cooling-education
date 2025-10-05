/**
 * Order Snapshot Service
 *
 * Creates immutable snapshots of products and their component trees
 * for order items. Ensures order history remains accurate even when
 * products change.
 */

import { db } from '@/db'
import { products, productComponents } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import type { Product } from '@/db/schema-pg'

export interface ComponentSnapshot {
  componentId: string
  componentSku: string
  componentName: string
  componentVersion: number
  quantity: number
  price: number
  isIncluded: boolean
  isRequired: boolean
  components?: ComponentSnapshot[] // Sub-components (depth 2)
}

export interface OrderItemSnapshot {
  // Product snapshot
  productId: string
  productSku: string
  productSlug: string
  productName: string
  productVersion: number
  productType: string
  productImage: string

  // Component tree
  componentTree: ComponentSnapshot[]

  // Pricing
  quantity: number
  basePrice: number
  includedComponentsPrice: number
  optionalComponentsPrice: number
  price: number // Total per unit (base + included + optional)
  lineTotal: number // price * quantity

  // Optional reference
  currentProductId: string
}

/**
 * Create immutable snapshot of product and all components
 */
export async function createOrderItemSnapshot(
  productId: string,
  quantity: number
): Promise<OrderItemSnapshot> {
  // Get product
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId)
  })

  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  // Get depth 1 components
  const depth1Components = await db
    .select({
      rel: productComponents,
      comp: products,
    })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.componentProductId, products.id))
    .where(eq(productComponents.parentProductId, productId))
    .orderBy(productComponents.sortOrder)

  // For each depth 1, get depth 2
  const componentTree: ComponentSnapshot[] = await Promise.all(
    depth1Components.map(async (d1) => {
      const depth2Components = await db
        .select({
          rel: productComponents,
          comp: products,
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.componentProductId, products.id))
        .where(eq(productComponents.parentProductId, d1.comp.id))
        .orderBy(productComponents.sortOrder)

      return {
        componentId: d1.comp.id,
        componentSku: d1.comp.sku,
        componentName: d1.rel.displayName ?? d1.comp.name,
        componentVersion: d1.comp.version,
        quantity: d1.rel.quantity,
        price: d1.rel.priceOverride ?? d1.comp.componentPrice ?? d1.comp.price,
        isIncluded: d1.rel.isIncluded,
        isRequired: d1.rel.isRequired,

        // Depth 2 sub-components
        components: depth2Components.map(d2 => ({
          componentId: d2.comp.id,
          componentSku: d2.comp.sku,
          componentName: d2.rel.displayName ?? d2.comp.name,
          componentVersion: d2.comp.version,
          quantity: d2.rel.quantity,
          price: d2.rel.priceOverride ?? d2.comp.componentPrice ?? d2.comp.price,
          isIncluded: d2.rel.isIncluded,
          isRequired: d2.rel.isRequired,
        }))
      }
    })
  )

  // Calculate pricing
  const calculateTreePrice = (components: ComponentSnapshot[]): number => {
    return components.reduce((sum, comp) => {
      const compPrice = comp.isIncluded ? comp.price * comp.quantity : 0
      const subPrice = comp.components ? calculateTreePrice(comp.components) : 0
      return sum + compPrice + subPrice
    }, 0)
  }

  const includedComponents = componentTree.filter(c => c.isIncluded)
  const optionalComponents = componentTree.filter(c => !c.isIncluded)

  const includedPrice = calculateTreePrice(includedComponents)
  const optionalPrice = calculateTreePrice(optionalComponents)
  const pricePerUnit = product.price + includedPrice + optionalPrice

  // Get first image or empty string
  const images = product.images as string[] | null
  const productImage = images && images.length > 0 ? images[0] : ''

  return {
    productId: product.id,
    productSku: product.sku,
    productSlug: product.slug,
    productName: product.name,
    productVersion: product.version,
    productType: product.productType,
    productImage,

    componentTree,

    quantity,
    basePrice: product.price,
    includedComponentsPrice: includedPrice,
    optionalComponentsPrice: optionalPrice,
    price: pricePerUnit,
    lineTotal: quantity * pricePerUnit,

    currentProductId: product.id,
  }
}

/**
 * Create snapshots for multiple products (batch operation)
 */
export async function createOrderItemSnapshots(
  items: Array<{ productId: string; quantity: number }>
): Promise<OrderItemSnapshot[]> {
  return Promise.all(
    items.map(item => createOrderItemSnapshot(item.productId, item.quantity))
  )
}

/**
 * Validate that all products in cart are available
 */
export async function validateProductsAvailable(
  productIds: string[]
): Promise<{ valid: boolean; unavailable: string[] }> {
  const products = await db.query.products.findMany({
    where: (products, { inArray }) => inArray(products.id, productIds)
  })

  const unavailable = productIds.filter(id => {
    const product = products.find(p => p.id === id)
    return !product || !product.isAvailableForPurchase || product.status !== 'active'
  })

  return {
    valid: unavailable.length === 0,
    unavailable
  }
}

/**
 * Calculate order totals from snapshots
 */
export function calculateOrderTotals(snapshots: OrderItemSnapshot[]): {
  subtotal: number
  itemCount: number
} {
  const subtotal = snapshots.reduce((sum, snapshot) => sum + snapshot.lineTotal, 0)
  const itemCount = snapshots.reduce((sum, snapshot) => sum + snapshot.quantity, 0)

  return { subtotal, itemCount }
}
