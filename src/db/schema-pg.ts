/**
 * Database Schema - Drizzle ORM
 * PostgreSQL schema definitions for the e-commerce platform
 */

import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'), // Profile picture URL
  hashedPassword: text('hashed_password'),
  emailVerified: timestamp('email_verified'), // NextAuth compatibility
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: timestamp('email_verification_expires'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// ACCOUNTS TABLE (for OAuth providers - NextAuth)
// ============================================================================

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // oauth, email, credentials
  provider: text('provider').notNull(), // google, github, credentials, etc
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
})

// ============================================================================
// SESSIONS TABLE (for authentication - NextAuth)
// ============================================================================

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

// ============================================================================
// VERIFICATION TOKENS TABLE (for email verification - NextAuth)
// ============================================================================

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
})

// ============================================================================
// PRODUCTS TABLE
// ============================================================================

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),

  // SKU versioning fields
  skuPrefix: text('sku_prefix').notNull(), // e.g., "TPC"
  skuCategory: text('sku_category').notNull(), // e.g., "PUMP"
  skuProductCode: text('sku_product_code').notNull(), // e.g., "A01"
  skuVersion: text('sku_version').notNull(), // e.g., "V01"

  price: real('price').notNull(),
  originalPrice: real('original_price'),
  componentPrice: real('component_price'), // Price when used as component
  currency: text('currency').notNull().default('USD'),
  description: text('description').notNull(),
  shortDescription: text('short_description').notNull(),
  features: jsonb('features').notNull(),
  inStock: boolean('in_stock').notNull().default(true),
  stockQuantity: integer('stock_quantity').notNull().default(0),
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
  sunsetDate: timestamp('sunset_date'),
  discontinuedDate: timestamp('discontinued_date'),
  sunsetReason: text('sunset_reason'),

  // Product type
  productType: text('product_type').notNull().default('standalone'), // standalone, bundle, component

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// PRODUCT COMPONENTS TABLE (Many-to-Many Junction)
// ============================================================================

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

// ============================================================================
// CARTS TABLE
// ============================================================================

export const carts = pgTable('carts', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// CART ITEMS TABLE
// ============================================================================

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: text('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // FIX: Prevent deletion of products in carts
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// ORDERS TABLE
// ============================================================================

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // FIX: Preserve orders when user deleted
  status: text('status').notNull().default('pending'),

  // Customer information
  customer: jsonb('customer').notNull(),

  // Shipping and billing
  shippingAddress: jsonb('shipping_address').notNull(),
  billingAddress: jsonb('billing_address'),

  // Order totals
  subtotal: real('subtotal').notNull(),
  tax: real('tax').notNull(),
  taxRate: real('tax_rate').notNull(),
  shipping: real('shipping').notNull(),
  shippingMethod: text('shipping_method').notNull(),
  discount: real('discount').notNull().default(0),
  discountCode: text('discount_code'),
  total: real('total').notNull(),

  // Payment information
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCustomerId: text('stripe_customer_id'),

  // Shipping tracking
  trackingNumber: text('tracking_number'),
  shippingCarrier: text('shipping_carrier'),
  trackingUrl: text('tracking_url'),
  estimatedDelivery: timestamp('estimated_delivery'),

  // Additional information
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  metadata: jsonb('metadata'),

  // Timestamps
  paidAt: timestamp('paid_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// ORDER ITEMS TABLE
// ============================================================================

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),

  // Product snapshot (immutable)
  productId: text('product_id').notNull(), // NO FK - allows product deletion
  productSku: text('product_sku').notNull(),
  productSlug: text('product_slug').notNull().default(''),
  productName: text('product_name').notNull(),
  productVersion: integer('product_version').notNull().default(1),
  productType: text('product_type').notNull().default('standalone'),
  productImage: text('product_image').notNull(),

  // Component tree snapshot (JSONB)
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

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ============================================================================
// ADDRESSES TABLE
// ============================================================================

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'shipping', 'billing', 'both'
  isDefault: boolean('is_default').notNull().default(false),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  company: text('company'),
  address1: text('address1').notNull(),
  address2: text('address2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('US'),
  phone: text('phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert

export type Cart = typeof carts.$inferSelect
export type NewCart = typeof carts.$inferInsert

export type CartItem = typeof cartItems.$inferSelect
export type NewCartItem = typeof cartItems.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type Address = typeof addresses.$inferSelect
export type NewAddress = typeof addresses.$inferInsert

export type ProductComponent = typeof productComponents.$inferSelect
export type NewProductComponent = typeof productComponents.$inferInsert
