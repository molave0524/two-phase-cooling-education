/**
 * Store Schema - Transactional/Store Domain
 * PostgreSQL schema definitions for carts, orders, and transactions
 */

import { pgSchema, serial, text, timestamp, integer, real, jsonb } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { products } from './catalog'

// Create store schema
export const storeSchema = pgSchema('store')

// ============================================================================
// CARTS TABLE
// ============================================================================

export const carts = storeSchema.table('carts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// CART ITEMS TABLE
// ============================================================================

export const cartItems = storeSchema.table('cart_items', {
  id: serial('id').primaryKey(),
  cartId: text('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // FIX: Prevent deletion of products in carts
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// ORDERS TABLE
// ============================================================================

export const orders = storeSchema.table('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // FIX: Preserve orders when user deleted
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
  estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true }),

  // Additional information
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  metadata: jsonb('metadata'),

  // Timestamps
  paidAt: timestamp('paid_at', { withTimezone: true }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// ORDER ITEMS TABLE
// ============================================================================

export const orderItems = storeSchema.table('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),

  // Product snapshot (immutable)
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // FK with restrict to prevent orphans
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

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// INVENTORY RESERVATIONS TABLE
// ============================================================================

export const inventoryReservations = storeSchema.table('inventory_reservations', {
  id: serial('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),

  // Reservation metadata
  reservedBy: text('reserved_by'), // User ID or session ID
  reservationType: text('reservation_type').notNull().default('checkout'), // checkout, order, manual

  // Payment intent tracking for checkout reservations
  stripePaymentIntentId: text('stripe_payment_intent_id'),

  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  // Status
  status: text('status').notNull().default('active'), // active, expired, completed, cancelled

  // Audit trail
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Cart = typeof carts.$inferSelect
export type NewCart = typeof carts.$inferInsert

export type CartItem = typeof cartItems.$inferSelect
export type NewCartItem = typeof cartItems.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export type InventoryReservation = typeof inventoryReservations.$inferSelect
export type NewInventoryReservation = typeof inventoryReservations.$inferInsert
