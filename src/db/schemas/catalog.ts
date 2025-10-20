/**
 * Catalog Schema - Product Catalog Domain
 * PostgreSQL schema definitions for products and components
 */

import {
  pgSchema,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Create catalog schema
export const catalogSchema = pgSchema('catalog')

// ============================================================================
// PRODUCTS TABLE
// ============================================================================

export const products = catalogSchema.table(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    sku: text('sku').notNull().unique(),

    // SKU versioning fields - MUST be exactly 3 characters, no spaces
    skuPrefix: varchar('sku_prefix', { length: 3 }).notNull(), // e.g., "TPC"
    skuCategory: varchar('sku_category', { length: 3 }).notNull(), // e.g., "PMP"
    skuProductCode: varchar('sku_product_code', { length: 3 }).notNull(), // e.g., "A01"
    skuVersion: varchar('sku_version', { length: 3 }).notNull(), // e.g., "V01"

    price: real('price').notNull(),
    originalPrice: real('original_price'),
    componentPrice: real('component_price'), // Price when used as component
    currency: text('currency').notNull().default('USD'),
    description: text('description').notNull(),
    shortDescription: text('short_description').notNull(),
    features: jsonb('features').notNull(),
    inStock: boolean('in_stock').notNull().default(true),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
    estimatedShipping: text('estimated_shipping'),
    specifications: jsonb('specifications').notNull(),
    images: jsonb('images').notNull(),
    categories: jsonb('categories').notNull(),
    tags: jsonb('tags').notNull(),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),

    // Versioning fields
    version: integer('version').notNull().default(1),
    baseProductId: text('base_product_id'), // Links to original product
    previousVersionId: text('previous_version_id').references((): any => products.id),
    replacedBy: text('replaced_by').references((): any => products.id),

    // Lifecycle management
    status: text('status').notNull().default('active'), // active, sunset, discontinued
    isAvailableForPurchase: boolean('is_available_for_purchase').notNull().default(true),
    sunsetDate: timestamp('sunset_date', { withTimezone: true }),
    discontinuedDate: timestamp('discontinued_date', { withTimezone: true }),
    sunsetReason: text('sunset_reason'),

    // Product type
    productType: text('product_type').notNull().default('standalone'), // standalone, bundle, component

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    // SKU field constraints: exactly 3 characters, no spaces
    skuPrefixFormat: check(
      'sku_prefix_format',
      sql`LENGTH(${table.skuPrefix}) = 3 AND ${table.skuPrefix} NOT LIKE '% %'`
    ),
    skuCategoryFormat: check(
      'sku_category_format',
      sql`LENGTH(${table.skuCategory}) = 3 AND ${table.skuCategory} NOT LIKE '% %'`
    ),
    skuProductCodeFormat: check(
      'sku_product_code_format',
      sql`LENGTH(${table.skuProductCode}) = 3 AND ${table.skuProductCode} NOT LIKE '% %'`
    ),
    skuVersionFormat: check(
      'sku_version_format',
      sql`LENGTH(${table.skuVersion}) = 3 AND ${table.skuVersion} NOT LIKE '% %'`
    ),
  })
)

// ============================================================================
// PRODUCT COMPONENTS TABLE (Many-to-Many Junction)
// ============================================================================

export const productComponents = catalogSchema.table(
  'product_components',
  {
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
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    // Constraints
    uniqueParentComponent: unique().on(table.parentProductId, table.componentProductId),
    noSelfReference: check(
      'no_self_reference',
      sql`${table.parentProductId} != ${table.componentProductId}`
    ),
  })
)

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type ProductComponent = typeof productComponents.$inferSelect
export type NewProductComponent = typeof productComponents.$inferInsert
