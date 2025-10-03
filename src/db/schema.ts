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
  image: text('image'), // Profile picture URL
  hashedPassword: text('hashed_password'),
  emailVerified: integer('email_verified', { mode: 'timestamp' }), // NextAuth compatibility

  // Email verification for email changes
  newEmail: text('new_email'),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: integer('email_verification_expires', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ============================================================================
// ACCOUNTS TABLE (for OAuth providers - NextAuth)
// ============================================================================

export const accounts = sqliteTable('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
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

export const sessions = sqliteTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('session_token').notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
})

// ============================================================================
// VERIFICATION TOKENS TABLE (for email verification - NextAuth)
// ============================================================================

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
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

  // Customer information
  customer: text('customer', { mode: 'json' }).notNull(), // OrderCustomer JSON object

  // Order totals
  subtotal: real('subtotal').notNull(),
  tax: real('tax').notNull(),
  taxRate: real('tax_rate').notNull(),
  shipping: real('shipping').notNull(),
  shippingMethod: text('shipping_method').notNull(),
  discount: real('discount').notNull().default(0),
  discountCode: text('discount_code'),
  total: real('total').notNull(),

  // Addresses
  shippingAddress: text('shipping_address', { mode: 'json' }).notNull(), // JSON object
  billingAddress: text('billing_address', { mode: 'json' }), // JSON object

  // Payment information
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'), // pending, succeeded, failed, refunded
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCustomerId: text('stripe_customer_id'),

  // Shipping and tracking
  trackingNumber: text('tracking_number'),
  shippingCarrier: text('shipping_carrier'),
  trackingUrl: text('tracking_url'),
  estimatedDelivery: integer('estimated_delivery', { mode: 'timestamp' }),

  // Notes and metadata
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  metadata: text('metadata', { mode: 'json' }), // JSON object for additional data

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
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
  productSku: text('product_sku').notNull(), // SKU at time of order
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
// ADDRESSES TABLE
// ============================================================================

export const addresses = sqliteTable('addresses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Address type
  type: text('type').notNull(), // 'shipping' | 'billing' | 'both'
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),

  // Address fields
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

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ============================================================================
// PASSWORD RESET TOKENS TABLE
// ============================================================================

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
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

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert
