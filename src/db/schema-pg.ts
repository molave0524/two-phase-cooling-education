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
} from 'drizzle-orm/pg-core'

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
  price: real('price').notNull(),
  originalPrice: real('original_price'),
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

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
    .references(() => products.id),
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
  userId: integer('user_id').references(() => users.id),
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
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productSku: text('product_sku').notNull(),
  productImage: text('product_image').notNull(),
  variantId: text('variant_id'),
  variantName: text('variant_name'),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(), // Price per unit
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
