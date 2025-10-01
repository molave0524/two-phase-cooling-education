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
  varchar,
} from 'drizzle-orm/pg-core'

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  hashedPassword: text('hashed_password'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// SESSIONS TABLE (for authentication)
// ============================================================================

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
  userId: integer('user_id').references(() => users.id),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').notNull().default('pending'),
  totalAmount: real('total_amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
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
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
