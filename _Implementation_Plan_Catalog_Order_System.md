# Implementation Plan: Catalog & Order System

**Document Version:** 1.0
**Created:** 2025-10-04
**Status:** Ready for Review
**Reference:** `_bd_catalog_order_design_v1.md`

---

## Executive Summary

This implementation plan outlines the phased approach to implementing the product catalog and order management system with versioning, component relationships, and order immutability. The plan follows the SDLC strategy (DEV → UAT → PRD) and ensures zero-downtime deployment.

**Estimated Timeline:** 4-6 weeks
**Risk Level:** Medium (database schema changes, data migration)
**Rollback Capability:** Full rollback for each phase

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Implementation Phases](#implementation-phases)
3. [Phase 1: Foundation - Database Schema](#phase-1-foundation---database-schema)
4. [Phase 2: Product Management Core](#phase-2-product-management-core)
5. [Phase 3: Component Relationships](#phase-3-component-relationships)
6. [Phase 4: Order Immutability](#phase-4-order-immutability)
7. [Phase 5: Admin UI & Testing](#phase-5-admin-ui--testing)
8. [Phase 6: Migration & Deployment](#phase-6-migration--deployment)
9. [Testing Strategy](#testing-strategy)
10. [Rollback Plans](#rollback-plans)
11. [Success Criteria](#success-criteria)
12. [Team Responsibilities](#team-responsibilities)

---

## Prerequisites

### Required Before Starting

- [x] Comprehensive design documentation (`_bd_catalog_order_design_v1.md`)
- [x] SDLC strategy defined (`_SDLC_Strategy_DEV_UAT_PRD.md`)
- [x] Database migration strategy (`_Database_Migration_Strategy.md`)
- [ ] DEV environment configured in Vercel
- [ ] UAT environment configured in Vercel
- [ ] Neon database instances (DEV, UAT, PRD) created
- [ ] GitHub branch strategy implemented (main, uat, develop)
- [ ] Team members assigned to each phase
- [ ] Backup of current PRD database

### Technical Requirements

- Node.js >= 22.x
- PostgreSQL 14+ (Neon serverless)
- Drizzle ORM v0.30+
- Next.js 14+
- TypeScript 5+

---

## Implementation Phases

```
Phase 1: Foundation (Week 1)
  └─> Database schema changes
  └─> Migration scripts
  └─> Schema validation

Phase 2: Product Management (Week 2)
  └─> Product versioning logic
  └─> SKU generation
  └─> Product lifecycle management

Phase 3: Component Relationships (Week 2-3)
  └─> Many-to-many junction table
  └─> Circular reference prevention
  └─> Depth validation

Phase 4: Order Immutability (Week 3-4)
  └─> JSONB snapshot creation
  └─> Order item schema updates
  └─> Checkout workflow integration

Phase 5: Admin UI & Testing (Week 4-5)
  └─> Product management UI
  └─> Component builder UI
  └─> Integration tests

Phase 6: Migration & Deployment (Week 5-6)
  └─> Data migration from existing products
  └─> UAT deployment & validation
  └─> PRD deployment
```

---

## Phase 1: Foundation - Database Schema

**Duration:** 1 week
**Environment:** DEV
**Risk:** Low

### Objectives

1. Update `products` table with versioning fields
2. Create `product_components` junction table
3. Update `order_items` table with JSONB snapshot fields
4. Add database triggers for circular reference prevention
5. Fix referential integrity issues

### Tasks

#### 1.1 Update Products Table Schema

**File:** `src/db/schema-pg.ts`

```typescript
export const products = pgTable('products', {
  // Existing fields
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  price: real('price').notNull(),
  // ... existing fields ...

  // NEW: SKU versioning fields
  sku: text('sku').notNull().unique(), // Format: XXX-XXXX-XXX-VXX
  skuPrefix: text('sku_prefix').notNull(), // e.g., "TPC"
  skuCategory: text('sku_category').notNull(), // e.g., "PUMP"
  skuProductCode: text('sku_product_code').notNull(), // e.g., "A01"
  skuVersion: text('sku_version').notNull(), // e.g., "V01"

  // NEW: Versioning fields
  version: integer('version').notNull().default(1),
  baseProductId: text('base_product_id'), // Links to original product
  previousVersionId: text('previous_version_id').references(() => products.id),
  replacedBy: text('replaced_by').references(() => products.id),

  // NEW: Component pricing
  componentPrice: real('component_price'), // Price when used as component

  // NEW: Lifecycle management
  status: text('status').notNull().default('active'), // active, sunset, discontinued
  isAvailableForPurchase: boolean('is_available_for_purchase').notNull().default(true),
  sunsetDate: timestamp('sunset_date'),
  discontinuedDate: timestamp('discontinued_date'),
  sunsetReason: text('sunset_reason'),

  // NEW: Product type
  productType: text('product_type').notNull().default('standalone'), // standalone, bundle, component

  // Existing timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

#### 1.2 Create Product Components Table

```typescript
export const productComponents = pgTable('product_components', {
  id: serial('id').primaryKey(),

  // Relationships
  parentProductId: text('parent_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  componentProductId: text('component_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // Prevent deletion if used

  // Component configuration
  quantity: integer('quantity').notNull().default(1),
  isRequired: boolean('is_required').notNull().default(true),
  isIncluded: boolean('is_included').notNull().default(true), // Included in price or optional add-on

  // Pricing override
  priceOverride: real('price_override'), // Override component's default price

  // Display configuration
  displayName: text('display_name'), // Override component name in parent context
  displayOrder: integer('display_order').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),

  // Metadata
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Constraints
  uniqueParentComponent: unique().on(table.parentProductId, table.componentProductId),
  noSelfReference: check('no_self_reference',
    sql`${table.parentProductId} != ${table.componentProductId}`
  ),
}))
```

#### 1.3 Update Order Items Table

```typescript
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),

  // Product snapshot (immutable)
  productId: text('product_id').notNull(), // NO FK - allows product deletion
  productSku: text('product_sku').notNull(),
  productName: text('product_name').notNull(),
  productVersion: integer('product_version').notNull(),
  productType: text('product_type').notNull(),
  productImage: text('product_image').notNull(),

  // NEW: Component tree snapshot (JSONB)
  componentTree: jsonb('component_tree').notNull().default('[]'),

  // Pricing breakdown
  quantity: integer('quantity').notNull(),
  basePrice: real('base_price').notNull(), // Product base price
  includedComponentsPrice: real('included_components_price').notNull().default(0),
  optionalComponentsPrice: real('optional_components_price').notNull().default(0),
  price: real('price').notNull(), // Total per unit (base + included + optional)
  lineTotal: real('line_total').notNull(), // price * quantity

  // Optional: FK for reporting (not enforced)
  currentProductId: text('current_product_id'), // Tracks current product version

  // Removed fields
  // variantId, variantName (replaced by componentTree)

  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

#### 1.4 Fix Referential Integrity Issues

**From:** `_Referential_Integrity_Fixes.md`

```typescript
// Fix 1: cartItems → products (add RESTRICT)
export const cartItems = pgTable('cart_items', {
  // ... existing fields ...
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // CHANGED: add onDelete
})

// Fix 2: orders → users (add SET NULL)
export const orders = pgTable('orders', {
  // ... existing fields ...
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'set null' }), // CHANGED: add onDelete
})
```

#### 1.5 Create Migration Script

**File:** `drizzle/postgres/0003_catalog_versioning.sql`

```sql
-- ============================================================================
-- Migration: Add Product Versioning & Component Relationships
-- Version: 0003
-- Date: 2025-10-04
-- ============================================================================

BEGIN;

-- Add versioning columns to products table
ALTER TABLE products ADD COLUMN sku_prefix TEXT;
ALTER TABLE products ADD COLUMN sku_category TEXT;
ALTER TABLE products ADD COLUMN sku_product_code TEXT;
ALTER TABLE products ADD COLUMN sku_version TEXT;
ALTER TABLE products ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN base_product_id TEXT;
ALTER TABLE products ADD COLUMN previous_version_id TEXT REFERENCES products(id);
ALTER TABLE products ADD COLUMN replaced_by TEXT REFERENCES products(id);
ALTER TABLE products ADD COLUMN component_price REAL;
ALTER TABLE products ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE products ADD COLUMN is_available_for_purchase BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN sunset_date TIMESTAMP;
ALTER TABLE products ADD COLUMN discontinued_date TIMESTAMP;
ALTER TABLE products ADD COLUMN sunset_reason TEXT;
ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'standalone';

-- Backfill SKU components from existing SKU (if format matches)
UPDATE products
SET
  sku_prefix = SPLIT_PART(sku, '-', 1),
  sku_category = SPLIT_PART(sku, '-', 2),
  sku_product_code = SPLIT_PART(sku, '-', 3),
  sku_version = COALESCE(SPLIT_PART(sku, '-', 4), 'V01')
WHERE sku LIKE '%-%-%';

-- For products with non-standard SKUs, generate from ID
UPDATE products
SET
  sku_prefix = 'TPC',
  sku_category = 'PROD',
  sku_product_code = LPAD(SUBSTRING(id FROM '[0-9]+'), 3, '0'),
  sku_version = 'V01'
WHERE sku_prefix IS NULL;

-- Make SKU components NOT NULL after backfill
ALTER TABLE products ALTER COLUMN sku_prefix SET NOT NULL;
ALTER TABLE products ALTER COLUMN sku_category SET NOT NULL;
ALTER TABLE products ALTER COLUMN sku_product_code SET NOT NULL;
ALTER TABLE products ALTER COLUMN sku_version SET NOT NULL;

-- Create product_components junction table
CREATE TABLE product_components (
  id SERIAL PRIMARY KEY,
  parent_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_included BOOLEAN NOT NULL DEFAULT true,
  price_override REAL,
  display_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_parent_component UNIQUE(parent_product_id, component_product_id),
  CONSTRAINT no_self_reference CHECK (parent_product_id != component_product_id)
);

-- Create indexes for product_components
CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);
CREATE INDEX idx_product_components_component ON product_components(component_product_id);
CREATE INDEX idx_product_components_sort ON product_components(parent_product_id, sort_order);

-- Update order_items table
ALTER TABLE order_items ADD COLUMN product_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE order_items ADD COLUMN product_type TEXT NOT NULL DEFAULT 'standalone';
ALTER TABLE order_items ADD COLUMN component_tree JSONB NOT NULL DEFAULT '[]';
ALTER TABLE order_items ADD COLUMN base_price REAL;
ALTER TABLE order_items ADD COLUMN included_components_price REAL NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN optional_components_price REAL NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN line_total REAL;
ALTER TABLE order_items ADD COLUMN current_product_id TEXT;

-- Backfill order_items pricing fields
UPDATE order_items
SET
  base_price = price,
  line_total = price * quantity
WHERE base_price IS NULL;

-- Make pricing fields NOT NULL after backfill
ALTER TABLE order_items ALTER COLUMN base_price SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN line_total SET NOT NULL;

-- Drop deprecated variant columns (if they exist and are unused)
-- ALTER TABLE order_items DROP COLUMN IF EXISTS variant_id;
-- ALTER TABLE order_items DROP COLUMN IF EXISTS variant_name;

-- Fix referential integrity: cartItems → products
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_products_id_fk;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_product_id_products_id_fk
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- Fix referential integrity: orders → users
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_users_id_fk;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create trigger to prevent circular references
CREATE OR REPLACE FUNCTION prevent_circular_component_reference()
RETURNS TRIGGER AS $$
DECLARE
  depth_count INTEGER;
BEGIN
  -- Check if adding this relationship would create a cycle
  -- Use recursive CTE to check for path from component back to parent
  WITH RECURSIVE component_tree AS (
    SELECT component_product_id, 1 as depth
    FROM product_components
    WHERE parent_product_id = NEW.component_product_id

    UNION ALL

    SELECT pc.component_product_id, ct.depth + 1
    FROM product_components pc
    INNER JOIN component_tree ct ON pc.parent_product_id = ct.component_product_id
    WHERE ct.depth < 10 -- Safety limit
  )
  SELECT COUNT(*) INTO depth_count
  FROM component_tree
  WHERE component_product_id = NEW.parent_product_id;

  IF depth_count > 0 THEN
    RAISE EXCEPTION 'Circular reference detected: % → %', NEW.parent_product_id, NEW.component_product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_component_reference
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_component_reference();

-- Create trigger to prevent depth > 2
CREATE OR REPLACE FUNCTION prevent_deep_component_nesting()
RETURNS TRIGGER AS $$
DECLARE
  component_has_children BOOLEAN;
  grandchild_count INTEGER;
BEGIN
  -- Check if the component being added has its own components
  SELECT EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = NEW.component_product_id
  ) INTO component_has_children;

  IF component_has_children THEN
    -- Check if any of the component's children also have children
    SELECT COUNT(*) INTO grandchild_count
    FROM product_components pc1
    INNER JOIN product_components pc2 ON pc1.component_product_id = pc2.parent_product_id
    WHERE pc1.parent_product_id = NEW.component_product_id;

    IF grandchild_count > 0 THEN
      RAISE EXCEPTION 'Cannot add component: would create depth > 2 (component has sub-components with their own components)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_component_depth
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_deep_component_nesting();

-- Create indexes for performance
CREATE INDEX idx_products_sku_components ON products(sku_prefix, sku_category, sku_product_code);
CREATE INDEX idx_products_base_product ON products(base_product_id);
CREATE INDEX idx_products_status ON products(status) WHERE status != 'discontinued';
CREATE INDEX idx_products_available ON products(is_available_for_purchase) WHERE is_available_for_purchase = true;
CREATE INDEX idx_order_items_component_tree ON order_items USING GIN (component_tree);

COMMIT;
```

#### 1.6 Create Rollback Script

**File:** `drizzle/postgres/0003_catalog_versioning_rollback.sql`

```sql
-- ============================================================================
-- Rollback: Remove Product Versioning & Component Relationships
-- Version: 0003_rollback
-- Date: 2025-10-04
-- ============================================================================

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS check_component_depth ON product_components;
DROP TRIGGER IF EXISTS check_circular_component_reference ON product_components;
DROP FUNCTION IF EXISTS prevent_deep_component_nesting();
DROP FUNCTION IF EXISTS prevent_circular_component_reference();

-- Drop indexes
DROP INDEX IF EXISTS idx_order_items_component_tree;
DROP INDEX IF EXISTS idx_products_available;
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_products_base_product;
DROP INDEX IF EXISTS idx_products_sku_components;
DROP INDEX IF EXISTS idx_product_components_sort;
DROP INDEX IF EXISTS idx_product_components_component;
DROP INDEX IF EXISTS idx_product_components_parent;

-- Drop product_components table
DROP TABLE IF EXISTS product_components;

-- Revert orders → users FK
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_users_id_fk;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id);

-- Revert cartItems → products FK
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_products_id_fk;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_product_id_products_id_fk
  FOREIGN KEY (product_id) REFERENCES products(id);

-- Remove order_items columns
ALTER TABLE order_items DROP COLUMN IF EXISTS current_product_id;
ALTER TABLE order_items DROP COLUMN IF EXISTS optional_components_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS included_components_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS base_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS line_total;
ALTER TABLE order_items DROP COLUMN IF EXISTS component_tree;
ALTER TABLE order_items DROP COLUMN IF EXISTS product_type;
ALTER TABLE order_items DROP COLUMN IF EXISTS product_version;

-- Remove products columns
ALTER TABLE products DROP COLUMN IF EXISTS product_type;
ALTER TABLE products DROP COLUMN IF EXISTS sunset_reason;
ALTER TABLE products DROP COLUMN IF EXISTS discontinued_date;
ALTER TABLE products DROP COLUMN IF EXISTS sunset_date;
ALTER TABLE products DROP COLUMN IF EXISTS is_available_for_purchase;
ALTER TABLE products DROP COLUMN IF EXISTS status;
ALTER TABLE products DROP COLUMN IF EXISTS component_price;
ALTER TABLE products DROP COLUMN IF EXISTS replaced_by;
ALTER TABLE products DROP COLUMN IF EXISTS previous_version_id;
ALTER TABLE products DROP COLUMN IF EXISTS base_product_id;
ALTER TABLE products DROP COLUMN IF EXISTS version;
ALTER TABLE products DROP COLUMN IF EXISTS sku_version;
ALTER TABLE products DROP COLUMN IF EXISTS sku_product_code;
ALTER TABLE products DROP COLUMN IF EXISTS sku_category;
ALTER TABLE products DROP COLUMN IF EXISTS sku_prefix;

COMMIT;
```

### Deliverables

- [ ] Updated `src/db/schema-pg.ts` with all schema changes
- [ ] Migration script `0003_catalog_versioning.sql`
- [ ] Rollback script `0003_catalog_versioning_rollback.sql`
- [ ] Schema validation tests
- [ ] Type exports updated

### Testing Checklist

- [ ] Migration runs without errors on fresh DB
- [ ] Migration runs without errors on existing DB with data
- [ ] Rollback script successfully reverts changes
- [ ] All TypeScript types compile
- [ ] Drizzle introspection matches schema
- [ ] Triggers prevent circular references
- [ ] Triggers prevent depth > 2

---

## Phase 2: Product Management Core

**Duration:** 1 week
**Environment:** DEV
**Risk:** Medium

### Objectives

1. Implement SKU generation utilities
2. Create product versioning logic
3. Implement product lifecycle management (sunset/discontinue)
4. Build API endpoints for product management

### Tasks

#### 2.1 Create SKU Utilities

**File:** `src/lib/sku.ts`

```typescript
/**
 * SKU Format: XXX-XXXX-XXX-VXX (16 characters)
 * Example: TPC-PUMP-A01-V01
 */

export interface SKUComponents {
  prefix: string      // 3 chars: TPC
  category: string    // 4 chars: PUMP, MOTR, RADI, CLNT
  productCode: string // 3 chars: A01, M01, R02
  version: number     // 2 digits: 01, 02, etc.
}

export interface SKUGenerationOptions {
  prefix?: string
  category: string
  productCode: string
  version?: number
}

/**
 * Generate SKU from components
 */
export function generateSKU(options: SKUGenerationOptions): string {
  const {
    prefix = 'TPC',
    category,
    productCode,
    version = 1
  } = options

  // Validate lengths
  if (prefix.length !== 3) {
    throw new Error(`SKU prefix must be 3 characters, got: ${prefix}`)
  }
  if (category.length !== 4) {
    throw new Error(`SKU category must be 4 characters, got: ${category}`)
  }
  if (productCode.length !== 3) {
    throw new Error(`SKU product code must be 3 characters, got: ${productCode}`)
  }

  const versionStr = `V${version.toString().padStart(2, '0')}`
  return `${prefix}-${category}-${productCode}-${versionStr}`
}

/**
 * Parse SKU into components
 */
export function parseSKU(sku: string): SKUComponents {
  const pattern = /^([A-Z]{3})-([A-Z]{4})-([A-Z0-9]{3})-V(\d{2})$/
  const match = sku.match(pattern)

  if (!match) {
    throw new Error(`Invalid SKU format: ${sku}`)
  }

  return {
    prefix: match[1],
    category: match[2],
    productCode: match[3],
    version: parseInt(match[4], 10)
  }
}

/**
 * Increment SKU version
 */
export function incrementVersion(currentSKU: string): string {
  const components = parseSKU(currentSKU)
  return generateSKU({
    prefix: components.prefix,
    category: components.category,
    productCode: components.productCode,
    version: components.version + 1
  })
}

/**
 * Get base SKU (without version)
 */
export function getBaseSKU(sku: string): string {
  const components = parseSKU(sku)
  return `${components.prefix}-${components.category}-${components.productCode}`
}

/**
 * Check if two SKUs are versions of the same product
 */
export function isSameProduct(sku1: string, sku2: string): boolean {
  return getBaseSKU(sku1) === getBaseSKU(sku2)
}
```

#### 2.2 Create Product Versioning Service

**File:** `src/services/product-versioning.ts`

```typescript
import { db } from '@/db'
import { products, orderItems } from '@/db/schema-pg'
import { eq, sql, or } from 'drizzle-orm'
import { generateSKU, incrementVersion, parseSKU } from '@/lib/sku'

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
): Promise<typeof products.$inferSelect> {
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
  const newProductId = `${currentProduct.baseProductId || productId}_v${skuComponents.version}`

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
    description: currentProduct.description,
    shortDescription: currentProduct.shortDescription,
    features: currentProduct.features,
    specifications: currentProduct.specifications,
    images: currentProduct.images,
    categories: currentProduct.categories,
    tags: currentProduct.tags,
    productType: currentProduct.productType,

    // Versioning fields
    version: skuComponents.version,
    baseProductId: currentProduct.baseProductId || productId,
    previousVersionId: productId,

    // Lifecycle
    status: 'active',
    isAvailableForPurchase: true,

    // Apply updates
    ...options.updateFields,
  }).returning()

  // Update old product
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
```

#### 2.3 Create Product API Endpoints

**File:** `src/app/api/admin/products/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { generateSKU } from '@/lib/sku'
import { eq } from 'drizzle-orm'

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
      description,
      // ... other fields
    } = body

    // Generate SKU
    const sku = generateSKU({
      category,
      productCode,
      version: 1
    })

    const skuComponents = parseSKU(sku)
    const productId = `${category.toLowerCase()}_${productCode.toLowerCase()}_v1`

    const [product] = await db.insert(products).values({
      id: productId,
      sku,
      skuPrefix: skuComponents.prefix,
      skuCategory: skuComponents.category,
      skuProductCode: skuComponents.productCode,
      skuVersion: skuComponents.version,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      price,
      description,
      // ... other fields
      version: 1,
      status: 'active',
      isAvailableForPurchase: true,
    }).returning()

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/products
 * List products with filters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  // TODO: Add filtering logic
  const productList = await db.select().from(products)

  return NextResponse.json(productList)
}
```

**File:** `src/app/api/admin/products/[id]/version/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createProductVersion, isProductInOrders } from '@/services/product-versioning'

/**
 * POST /api/admin/products/:id/version
 * Create new version of product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const productId = params.id

    const inOrders = await isProductInOrders(productId)

    if (!inOrders) {
      return NextResponse.json(
        { error: 'Product has no orders. Modify directly instead of versioning.' },
        { status: 400 }
      )
    }

    const newProduct = await createProductVersion(productId, body)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('Version creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product version' },
      { status: 500 }
    )
  }
}
```

### Deliverables

- [ ] `src/lib/sku.ts` with SKU utilities
- [ ] `src/services/product-versioning.ts` with versioning logic
- [ ] `src/app/api/admin/products/route.ts` (CRUD endpoints)
- [ ] `src/app/api/admin/products/[id]/version/route.ts`
- [ ] Unit tests for SKU generation
- [ ] Unit tests for versioning logic

### Testing Checklist

- [ ] SKU generation follows XXX-XXXX-XXX-VXX format
- [ ] SKU parsing correctly extracts components
- [ ] Version increment works correctly
- [ ] Product creation generates valid SKU
- [ ] Product versioning creates new record
- [ ] Product versioning links to previous version
- [ ] Sunset functionality works
- [ ] Discontinue checks for orders first

---

## Phase 3: Component Relationships

**Duration:** 1-2 weeks
**Environment:** DEV
**Risk:** Medium-High

### Objectives

1. Implement component management service
2. Create circular reference validation (application-level)
3. Create depth validation (application-level)
4. Build component tree querying utilities
5. Create admin API for component management

### Tasks

#### 3.1 Create Component Management Service

**File:** `src/services/component-management.ts`

```typescript
import { db } from '@/db'
import { products, productComponents } from '@/db/schema-pg'
import { eq, and, sql } from 'drizzle-orm'

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

/**
 * Check for circular reference (app-level validation)
 */
export async function wouldCreateCycle(
  parentProductId: string,
  componentProductId: string
): Promise<boolean> {
  // Check if adding component → parent would create cycle
  // Use recursive query to find all descendants of component
  const descendants = await db.execute(sql`
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

  return descendants.rows.length > 0
}

/**
 * Check if adding component would exceed depth limit
 */
export async function wouldExceedDepth(
  parentProductId: string,
  componentProductId: string
): Promise<boolean> {
  // Check if component has sub-components with their own sub-components
  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM product_components pc1
    INNER JOIN product_components pc2 ON pc1.component_product_id = pc2.parent_product_id
    WHERE pc1.parent_product_id = ${componentProductId}
  `)

  return parseInt(result.rows[0].count) > 0
}

/**
 * Add component to product
 */
export async function addComponent(
  options: AddComponentOptions
): Promise<typeof productComponents.$inferSelect> {
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
  const [component] = await db.insert(productComponents).values({
    parentProductId,
    componentProductId,
    quantity,
    isRequired,
    isIncluded,
    priceOverride,
    displayName,
    sortOrder
  }).returning()

  return component
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
 * Get full component tree (2 levels)
 */
export async function getComponentTree(productId: string) {
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
```

#### 3.2 Create Component API Endpoints

**File:** `src/app/api/admin/products/[id]/components/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { addComponent, removeComponent, getComponentTree } from '@/services/component-management'

/**
 * GET /api/admin/products/:id/components
 * Get product component tree
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tree = await getComponentTree(params.id)
    return NextResponse.json(tree)
  } catch (error) {
    console.error('Component tree fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch component tree' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products/:id/components
 * Add component to product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const component = await addComponent({
      parentProductId: params.id,
      ...body
    })
    return NextResponse.json(component, { status: 201 })
  } catch (error) {
    console.error('Component add error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add component' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/admin/products/:id/components/:componentId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; componentId: string } }
) {
  try {
    await removeComponent(params.id, params.componentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Component remove error:', error)
    return NextResponse.json(
      { error: 'Failed to remove component' },
      { status: 500 }
    )
  }
}
```

### Deliverables

- [ ] `src/services/component-management.ts`
- [ ] Component API endpoints
- [ ] Circular reference validation tests
- [ ] Depth validation tests
- [ ] Component tree query tests

### Testing Checklist

- [ ] Circular reference detection works
- [ ] Depth limit enforcement works
- [ ] Component tree query returns 2 levels
- [ ] Component addition succeeds for valid cases
- [ ] Component removal works
- [ ] Database triggers also prevent invalid relationships

---

## Phase 4: Order Immutability

**Duration:** 1-2 weeks
**Environment:** DEV → UAT
**Risk:** High (critical business logic)

### Objectives

1. Implement JSONB snapshot creation
2. Update checkout workflow to create snapshots
3. Create order display utilities
4. Test order immutability thoroughly

### Tasks

#### 4.1 Create Order Snapshot Service

**File:** `src/services/order-snapshot.ts`

```typescript
import { db } from '@/db'
import { products, productComponents } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'

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
  lineTotal: number

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

  const includedPrice = calculateTreePrice(componentTree.filter(c => c.isIncluded))
  const optionalPrice = calculateTreePrice(componentTree.filter(c => !c.isIncluded))

  return {
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    productVersion: product.version,
    productType: product.productType,
    productImage: (product.images as string[])?.[0] ?? '',

    componentTree,

    quantity,
    basePrice: product.price,
    includedComponentsPrice: includedPrice,
    optionalComponentsPrice: optionalPrice,
    lineTotal: quantity * (product.price + includedPrice + optionalPrice),

    currentProductId: product.id,
  }
}
```

#### 4.2 Update Checkout Service

**File:** `src/services/checkout.ts` (modify existing)

```typescript
import { createOrderItemSnapshot } from './order-snapshot'
import { db } from '@/db'
import { orders, orderItems } from '@/db/schema-pg'

export async function createOrder(/* ... params ... */) {
  // ... existing order creation logic ...

  // For each cart item, create snapshot
  const snapshots = await Promise.all(
    cartItems.map(item =>
      createOrderItemSnapshot(item.productId, item.quantity)
    )
  )

  // Insert order
  const [order] = await db.insert(orders).values({
    // ... order fields ...
  }).returning()

  // Insert order items with snapshots
  await db.insert(orderItems).values(
    snapshots.map(snapshot => ({
      orderId: order.id,
      productId: snapshot.productId,
      productSku: snapshot.productSku,
      productName: snapshot.productName,
      productVersion: snapshot.productVersion,
      productType: snapshot.productType,
      productImage: snapshot.productImage,
      componentTree: snapshot.componentTree,
      quantity: snapshot.quantity,
      basePrice: snapshot.basePrice,
      includedComponentsPrice: snapshot.includedComponentsPrice,
      optionalComponentsPrice: snapshot.optionalComponentsPrice,
      price: snapshot.basePrice + snapshot.includedComponentsPrice + snapshot.optionalComponentsPrice,
      lineTotal: snapshot.lineTotal,
      currentProductId: snapshot.currentProductId,
    }))
  )

  return order
}
```

### Deliverables

- [ ] `src/services/order-snapshot.ts`
- [ ] Updated checkout service
- [ ] Order display utilities
- [ ] Snapshot creation tests
- [ ] End-to-end checkout tests

### Testing Checklist

- [ ] Snapshot captures full 2-level tree
- [ ] Snapshot pricing calculation correct
- [ ] Order creation includes snapshots
- [ ] Orders remain unchanged when product changes
- [ ] Orders remain unchanged when components change

---

## Phase 5: Admin UI & Testing

**Duration:** 1-2 weeks
**Environment:** DEV → UAT
**Risk:** Low

### Objectives

1. Build product management UI
2. Build component builder UI
3. Create comprehensive integration tests
4. User acceptance testing

### Tasks

#### 5.1 Product Management UI

**Pages:**
- [ ] Product list view (`/admin/products`)
- [ ] Product create form (`/admin/products/new`)
- [ ] Product edit form (`/admin/products/[id]/edit`)
- [ ] Product version history (`/admin/products/[id]/versions`)
- [ ] Component builder (`/admin/products/[id]/components`)

#### 5.2 Component Builder UI

**Features:**
- [ ] Drag-and-drop component tree builder
- [ ] Component search and selection
- [ ] Validation error display (circular ref, depth)
- [ ] Price calculation preview
- [ ] Save and publish workflow

#### 5.3 Integration Tests

**File:** `src/__tests__/integration/catalog-order.test.ts`

```typescript
describe('Catalog & Order System Integration', () => {
  test('Create product with components', async () => {
    // Create base components
    // Create parent product
    // Add components
    // Verify tree structure
  })

  test('Create order with product snapshot', async () => {
    // Create product with components
    // Add to cart
    // Checkout
    // Verify snapshot in order
  })

  test('Product change does not affect existing orders', async () => {
    // Create product
    // Create order
    // Modify product
    // Verify order unchanged
  })

  test('Component change triggers new version', async () => {
    // Create product with components
    // Create order
    // Modify component
    // Verify new version created
    // Verify old version still in order
  })

  test('Circular reference prevention', async () => {
    // Create product A
    // Create product B with component A
    // Attempt to add component B to product A
    // Expect error
  })

  test('Depth limit enforcement', async () => {
    // Create 3-level hierarchy
    // Expect error
  })
})
```

### Deliverables

- [ ] Admin UI pages
- [ ] Component builder UI
- [ ] Integration test suite
- [ ] UAT test plan
- [ ] User documentation

### Testing Checklist

- [ ] All CRUD operations work in UI
- [ ] Component builder prevents invalid relationships
- [ ] Price calculations display correctly
- [ ] Version history displays correctly
- [ ] Integration tests pass
- [ ] UAT sign-off received

---

## Phase 6: Migration & Deployment

**Duration:** 1-2 weeks
**Environment:** DEV → UAT → PRD
**Risk:** High (production deployment)

### Objectives

1. Migrate existing products to new schema
2. Deploy to UAT environment
3. Validate UAT
4. Deploy to PRD environment
5. Monitor and verify

### Tasks

#### 6.1 Data Migration Script

**File:** `scripts/migrate-existing-products.ts`

```typescript
/**
 * Migrate existing products to new versioning schema
 *
 * Strategy:
 * 1. Backfill SKU components from existing SKUs
 * 2. Set all existing products to version 1
 * 3. Mark all as active and available
 * 4. No component relationships initially (manual setup)
 */

import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { parseSKU, generateSKU } from '@/lib/sku'

async function migrateProducts() {
  console.log('Starting product migration...')

  const allProducts = await db.select().from(products)

  for (const product of allProducts) {
    try {
      // Try to parse existing SKU
      const components = parseSKU(product.sku)

      await db.update(products)
        .set({
          skuPrefix: components.prefix,
          skuCategory: components.category,
          skuProductCode: components.productCode,
          skuVersion: `V${components.version.toString().padStart(2, '0')}`,
          version: components.version,
          status: 'active',
          isAvailableForPurchase: true,
          productType: 'standalone'
        })
        .where(eq(products.id, product.id))

      console.log(`✓ Migrated: ${product.sku}`)
    } catch (error) {
      // SKU doesn't match format, generate new one
      console.warn(`⚠ Invalid SKU format: ${product.sku}, generating new SKU`)

      const newSKU = generateSKU({
        category: 'PROD',
        productCode: product.id.substring(0, 3).toUpperCase(),
        version: 1
      })

      const components = parseSKU(newSKU)

      await db.update(products)
        .set({
          sku: newSKU,
          skuPrefix: components.prefix,
          skuCategory: components.category,
          skuProductCode: components.productCode,
          skuVersion: 'V01',
          version: 1,
          status: 'active',
          isAvailableForPurchase: true,
          productType: 'standalone'
        })
        .where(eq(products.id, product.id))

      console.log(`✓ Regenerated SKU: ${product.id} → ${newSKU}`)
    }
  }

  console.log('Product migration complete!')
}

migrateProducts().catch(console.error)
```

#### 6.2 Deployment Checklist

**UAT Deployment:**
- [ ] Clone PRD database to UAT using Neon branching
- [ ] Run migration `0003_catalog_versioning.sql` on UAT
- [ ] Run data migration script on UAT
- [ ] Deploy code to Vercel UAT environment
- [ ] Smoke test: Create product, add components, create order
- [ ] Validate order snapshots
- [ ] Performance test: Load test with 1000 products
- [ ] UAT sign-off

**PRD Deployment:**
- [ ] Create database backup
- [ ] Schedule maintenance window (if needed)
- [ ] Run migration `0003_catalog_versioning.sql` on PRD
- [ ] Run data migration script on PRD
- [ ] Deploy code to Vercel PRD environment
- [ ] Verify existing orders still display correctly
- [ ] Smoke test: Create test order
- [ ] Monitor error logs for 24 hours
- [ ] Monitor performance metrics
- [ ] Final sign-off

#### 6.3 Rollback Plan

**If issues detected in UAT:**
- [ ] Run rollback script `0003_catalog_versioning_rollback.sql`
- [ ] Redeploy previous code version
- [ ] Analyze issues and fix
- [ ] Retry deployment

**If issues detected in PRD:**
- [ ] Assess severity (critical vs minor)
- [ ] If critical: Execute rollback
  - [ ] Run rollback script on PRD
  - [ ] Redeploy previous code version
  - [ ] Verify system stability
- [ ] If minor: Create hotfix branch and fast-track fix

### Deliverables

- [ ] Data migration script
- [ ] UAT deployment report
- [ ] PRD deployment report
- [ ] Post-deployment monitoring report
- [ ] Rollback documentation

### Testing Checklist

- [ ] Migration script runs successfully on UAT
- [ ] All existing products migrated correctly
- [ ] Existing orders display correctly after migration
- [ ] New orders create proper snapshots
- [ ] Performance acceptable (< 2s page load)
- [ ] No errors in logs
- [ ] PRD migration successful
- [ ] 24-hour monitoring complete

---

## Testing Strategy

### Unit Tests

**Coverage Target:** 80%+

- [ ] SKU utilities (`src/lib/sku.ts`)
- [ ] Product versioning (`src/services/product-versioning.ts`)
- [ ] Component management (`src/services/component-management.ts`)
- [ ] Order snapshots (`src/services/order-snapshot.ts`)

### Integration Tests

**Coverage Target:** Key workflows

- [ ] Product creation → version → sunset workflow
- [ ] Component tree creation → validation
- [ ] Order creation → snapshot → immutability
- [ ] Migration script on test database

### End-to-End Tests

**Coverage Target:** Critical user flows

- [ ] Admin creates product with components
- [ ] Customer adds product to cart
- [ ] Customer completes checkout
- [ ] Order displays correct snapshot
- [ ] Product modification doesn't affect order

### Performance Tests

**Targets:**
- Product page load: < 1s
- Component tree query: < 500ms
- Order creation: < 2s
- Migration script: < 5 minutes for 10,000 products

---

## Rollback Plans

### Phase 1 Rollback (Schema Changes)

**Trigger:** Migration fails or causes data corruption

**Steps:**
1. Run `0003_catalog_versioning_rollback.sql`
2. Verify database state
3. Analyze root cause

**Estimated Time:** 5 minutes

### Phase 2-5 Rollback (Code Changes)

**Trigger:** Bugs in application logic

**Steps:**
1. Revert Git commit to previous stable version
2. Redeploy previous code
3. Verify functionality

**Estimated Time:** 10 minutes

### Phase 6 Rollback (Production Deployment)

**Trigger:** Critical issues in PRD

**Steps:**
1. Notify stakeholders
2. Run database rollback script
3. Redeploy previous code version
4. Verify system stability
5. Restore from backup if necessary

**Estimated Time:** 15-30 minutes

---

## Success Criteria

### Phase 1 Success Criteria
- [ ] Migration runs without errors
- [ ] All tables created successfully
- [ ] Triggers function correctly
- [ ] Type exports compile

### Phase 2 Success Criteria
- [ ] SKU generation works for all cases
- [ ] Product versioning creates linked records
- [ ] Sunset/discontinue workflows function

### Phase 3 Success Criteria
- [ ] Circular references prevented
- [ ] Depth limit enforced
- [ ] Component tree queries return correct data

### Phase 4 Success Criteria
- [ ] Order snapshots capture full tree
- [ ] Orders immutable after product changes
- [ ] Pricing calculations correct

### Phase 5 Success Criteria
- [ ] Admin UI fully functional
- [ ] Integration tests pass
- [ ] UAT sign-off received

### Phase 6 Success Criteria
- [ ] PRD deployment successful
- [ ] Zero data loss
- [ ] Existing orders intact
- [ ] New orders working correctly

---

## Team Responsibilities

### Backend Developer
- [ ] Database schema implementation
- [ ] API endpoints
- [ ] Business logic services
- [ ] Migration scripts

### Frontend Developer
- [ ] Admin UI pages
- [ ] Component builder
- [ ] User documentation

### QA Engineer
- [ ] Test plan creation
- [ ] Integration tests
- [ ] UAT coordination
- [ ] Regression testing

### DevOps Engineer
- [ ] Environment setup
- [ ] Deployment automation
- [ ] Monitoring setup
- [ ] Backup verification

### Product Owner
- [ ] Requirement validation
- [ ] UAT sign-off
- [ ] PRD deployment approval
- [ ] Success criteria validation

---

## Risk Mitigation

### Risk: Data Loss During Migration
**Mitigation:**
- Full database backup before migration
- Test migration on UAT first
- Rollback script ready
- Dry-run migration multiple times

### Risk: Performance Degradation
**Mitigation:**
- Load testing before PRD
- Database indexes on critical columns
- JSONB GIN indexes for component tree
- Query optimization

### Risk: Circular Reference Bugs
**Mitigation:**
- Database triggers (safety net)
- Application-level validation (UX)
- Integration tests
- Manual testing

### Risk: Pricing Calculation Errors
**Mitigation:**
- Unit tests for all pricing logic
- End-to-end tests
- UAT validation with real data
- Comparison with existing orders

---

## Timeline Summary

| Phase | Duration | Environment | Start Week |
|-------|----------|-------------|------------|
| Phase 1: Database Schema | 1 week | DEV | Week 1 |
| Phase 2: Product Management | 1 week | DEV | Week 2 |
| Phase 3: Component Relationships | 1-2 weeks | DEV | Week 2-3 |
| Phase 4: Order Immutability | 1-2 weeks | DEV → UAT | Week 3-4 |
| Phase 5: Admin UI & Testing | 1-2 weeks | DEV → UAT | Week 4-5 |
| Phase 6: Migration & Deployment | 1-2 weeks | UAT → PRD | Week 5-6 |

**Total Estimated Time:** 4-6 weeks

---

## Next Steps

1. **Review this implementation plan** with the team
2. **Assign team members** to each phase
3. **Create Jira/GitHub issues** for each task
4. **Set up environments** (DEV, UAT, PRD)
5. **Begin Phase 1** - Database schema changes

---

## References

- `_bd_catalog_order_design_v1.md` - Complete design documentation
- `_SDLC_Strategy_DEV_UAT_PRD.md` - Development workflow
- `_Database_Migration_Strategy.md` - Database migration approach
- `_SKU_Standard.md` - SKU naming convention
- `_Immutability_Full_Tree.md` - Order immutability strategy

---

**Questions? Contact:** [Technical Lead Email]

**Last Updated:** 2025-10-04
