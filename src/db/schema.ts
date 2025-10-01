/**
 * Database Schema - Drizzle ORM
 * SQLite schema definitions for the e-commerce platform
 */

import { sql } from 'drizzle-orm'
import { integer, text, real, sqliteTable } from 'drizzle-orm/sqlite-core'

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  hashedPassword: text('hashed_password'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ============================================================================
// SESSIONS TABLE (for authentication)
// ============================================================================

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ============================================================================
// PRODUCTS TABLE
// ============================================================================

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  currency: text('currency').notNull().default('USD'),
  description: text('description').notNull(),
  shortDescription: text('short_description').notNull(),
  features: text('features', { mode: 'json' }).notNull(), // JSON array
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  estimatedShipping: text('estimated_shipping'),
  specifications: text('specifications', { mode: 'json' }).notNull(), // JSON object
  images: text('images', { mode: 'json' }).notNull(), // JSON array
  categories: text('categories', { mode: 'json' }).notNull(), // JSON array
  tags: text('tags', { mode: 'json' }).notNull(), // JSON array
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ============================================================================
// CARTS TABLE
// ============================================================================

export const carts = sqliteTable('carts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'), // For guest carts
  status: text('status').notNull().default('active'), // active, abandoned, converted
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ============================================================================
// CART ITEMS TABLE
// ============================================================================

export const cartItems = sqliteTable('cart_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cartId: integer('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(), // References product.id from constants
  productName: text('product_name').notNull(),
  productImage: text('product_image').notNull(),
  variantId: text('variant_id'),
  variantName: text('variant_name'),
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull(), // Price at time of adding to cart
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ============================================================================
// ORDERS TABLE
// ============================================================================

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  cartId: integer('cart_id').references(() => carts.id),
  status: text('status').notNull().default('pending'), // pending, processing, shipped, delivered, cancelled
  subtotal: real('subtotal').notNull(),
  tax: real('tax').notNull(),
  shipping: real('shipping').notNull(),
  discount: real('discount').notNull().default(0),
  total: real('total').notNull(),
  couponCode: text('coupon_code'),
  shippingAddress: text('shipping_address', { mode: 'json' }).notNull(), // JSON object
  billingAddress: text('billing_address', { mode: 'json' }).notNull(), // JSON object
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'), // pending, paid, failed, refunded
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  trackingNumber: text('tracking_number'),
  shippingCarrier: text('shipping_carrier'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ============================================================================
// ORDER ITEMS TABLE
// ============================================================================

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productImage: text('product_image').notNull(),
  variantId: text('variant_id'),
  variantName: text('variant_name'),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(), // Price at time of order
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

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
