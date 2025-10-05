/**
 * Component Management Service
 *
 * Handles product-component relationships including:
 * - Adding/removing components
 * - Circular reference prevention
 * - Depth limit validation
 * - Component tree querying
 */

import { db } from '@/db'
import { products, productComponents } from '@/db/schema-pg'
import { eq, and, sql } from 'drizzle-orm'
import type { Product, ProductComponent } from '@/db/schema-pg'

export interface AddComponentOptions {
  parentProductId: string
  componentProductId: string
  quantity?: number
  isRequired?: boolean
  isIncluded?: boolean
  priceOverride?: number
  displayName?: string
  sortOrder?: number
}

export interface ComponentTreeNode {
  component: Product
  relationship: ProductComponent
  subComponents: {
    component: Product
    relationship: ProductComponent
  }[]
}

/**
 * Check for circular reference (app-level validation)
 */
export async function wouldCreateCycle(
  parentProductId: string,
  componentProductId: string
): Promise<boolean> {
  // Check if adding component → parent would create cycle
  // Use recursive query to find all descendants of component
  const result = await db.execute(sql`
    WITH RECURSIVE component_tree AS (
      SELECT component_product_id, 1 as depth
      FROM product_components
      WHERE parent_product_id = ${componentProductId}

      UNION ALL

      SELECT pc.component_product_id, ct.depth + 1
      FROM product_components pc
      INNER JOIN component_tree ct ON pc.parent_product_id = ct.component_product_id
      WHERE ct.depth < 10
    )
    SELECT component_product_id
    FROM component_tree
    WHERE component_product_id = ${parentProductId}
  `)

  return result.rows.length > 0
}

/**
 * Check if adding component would exceed depth limit (max 2 levels)
 */
export async function wouldExceedDepth(
  parentProductId: string,
  componentProductId: string
): Promise<boolean> {
  // Check if component has sub-components with their own sub-components
  // This would create depth 3, which is not allowed
  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM product_components pc1
    INNER JOIN product_components pc2 ON pc1.component_product_id = pc2.parent_product_id
    WHERE pc1.parent_product_id = ${componentProductId}
  `)

  return parseInt(result.rows[0].count as string) > 0
}

/**
 * Add component to product
 */
export async function addComponent(
  options: AddComponentOptions
): Promise<ProductComponent> {
  const {
    parentProductId,
    componentProductId,
    quantity = 1,
    isRequired = true,
    isIncluded = true,
    priceOverride,
    displayName,
    sortOrder = 0
  } = options

  // Validation 0: Check products exist
  const [parent, component] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, parentProductId) }),
    db.query.products.findFirst({ where: eq(products.id, componentProductId) })
  ])

  if (!parent) {
    throw new Error(`Parent product not found: ${parentProductId}`)
  }
  if (!component) {
    throw new Error(`Component product not found: ${componentProductId}`)
  }

  // Validation 1: Check for circular reference
  const cycleDetected = await wouldCreateCycle(parentProductId, componentProductId)
  if (cycleDetected) {
    throw new Error(
      `Cannot add component: would create circular reference (${componentProductId} → ${parentProductId})`
    )
  }

  // Validation 2: Check depth limit
  const exceedsDepth = await wouldExceedDepth(parentProductId, componentProductId)
  if (exceedsDepth) {
    throw new Error(
      `Cannot add component: would exceed maximum depth of 2 levels`
    )
  }

  // Insert component relationship
  const [componentRel] = await db.insert(productComponents).values({
    parentProductId,
    componentProductId,
    quantity,
    isRequired,
    isIncluded,
    priceOverride,
    displayName,
    sortOrder
  }).returning()

  return componentRel
}

/**
 * Remove component from product
 */
export async function removeComponent(
  parentProductId: string,
  componentProductId: string
): Promise<void> {
  await db.delete(productComponents)
    .where(
      and(
        eq(productComponents.parentProductId, parentProductId),
        eq(productComponents.componentProductId, componentProductId)
      )
    )
}

/**
 * Update component relationship
 */
export async function updateComponent(
  parentProductId: string,
  componentProductId: string,
  updates: Partial<Omit<ProductComponent, 'id' | 'parentProductId' | 'componentProductId'>>
): Promise<ProductComponent> {
  const [updated] = await db
    .update(productComponents)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(productComponents.parentProductId, parentProductId),
        eq(productComponents.componentProductId, componentProductId)
      )
    )
    .returning()

  if (!updated) {
    throw new Error(`Component relationship not found`)
  }

  return updated
}

/**
 * Get full component tree (2 levels)
 */
export async function getComponentTree(productId: string): Promise<ComponentTreeNode[]> {
  // Level 1: Direct components
  const level1 = await db
    .select({
      rel: productComponents,
      comp: products,
    })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.componentProductId, products.id))
    .where(eq(productComponents.parentProductId, productId))
    .orderBy(productComponents.sortOrder)

  // Level 2: For each level 1, get sub-components
  const tree = await Promise.all(
    level1.map(async (l1) => {
      const level2 = await db
        .select({
          rel: productComponents,
          comp: products,
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.componentProductId, products.id))
        .where(eq(productComponents.parentProductId, l1.comp.id))
        .orderBy(productComponents.sortOrder)

      return {
        component: l1.comp,
        relationship: l1.rel,
        subComponents: level2.map(l2 => ({
          component: l2.comp,
          relationship: l2.rel
        }))
      }
    })
  )

  return tree
}

/**
 * Get direct components only (depth 1)
 */
export async function getDirectComponents(productId: string): Promise<ComponentTreeNode[]> {
  const components = await db
    .select({
      rel: productComponents,
      comp: products,
    })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.componentProductId, products.id))
    .where(eq(productComponents.parentProductId, productId))
    .orderBy(productComponents.sortOrder)

  return components.map(c => ({
    component: c.comp,
    relationship: c.rel,
    subComponents: []
  }))
}

/**
 * Get products that use this product as a component
 */
export async function getParentProducts(componentId: string): Promise<Product[]> {
  const parents = await db
    .select({ product: products })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.parentProductId, products.id))
    .where(eq(productComponents.componentProductId, componentId))

  return parents.map(p => p.product)
}

/**
 * Calculate total price of all included components
 */
export async function calculateComponentsPrice(productId: string): Promise<{
  includedPrice: number
  optionalPrice: number
  totalPrice: number
}> {
  const tree = await getComponentTree(productId)

  const calculateTreePrice = (nodes: ComponentTreeNode[], included: boolean): number => {
    return nodes.reduce((sum, node) => {
      if (node.relationship.isIncluded !== included) return sum

      const price = node.relationship.priceOverride ??
                   node.component.componentPrice ??
                   node.component.price
      const nodePrice = price * node.relationship.quantity

      const subPrice = node.subComponents.reduce((subSum, sub) => {
        if (sub.relationship.isIncluded !== included) return subSum
        const subPrice = sub.relationship.priceOverride ??
                        sub.component.componentPrice ??
                        sub.component.price
        return subSum + (subPrice * sub.relationship.quantity)
      }, 0)

      return sum + nodePrice + subPrice
    }, 0)
  }

  const includedPrice = calculateTreePrice(tree, true)
  const optionalPrice = calculateTreePrice(tree, false)

  return {
    includedPrice,
    optionalPrice,
    totalPrice: includedPrice + optionalPrice
  }
}
