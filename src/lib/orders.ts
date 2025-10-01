/**
 * Order Processing and Management System
 * Handles order creation, status updates, and fulfillment workflow
 */

import { TwoPhaseCoolingProduct } from '@/types/product'
import { CartItem } from '@/types/cart'

// Order types and interfaces
export type OrderStatus =
  | 'pending' // Order created, payment pending
  | 'processing' // Payment confirmed, preparing for shipment
  | 'shipped' // Order shipped, tracking available
  | 'delivered' // Order delivered
  | 'cancelled' // Order cancelled
  | 'refunded' // Order refunded
  | 'failed' // Payment or processing failed

export type PaymentStatus =
  | 'pending' // Payment not yet processed
  | 'succeeded' // Payment successful
  | 'failed' // Payment failed
  | 'refunded' // Payment refunded
  | 'partially_refunded' // Partial refund

export interface OrderCustomer {
  id?: string
  email: string
  firstName: string
  lastName: string
  phone?: string
}

export interface OrderShippingAddress {
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
}

export interface OrderItem {
  id: string
  productId: string
  product: TwoPhaseCoolingProduct
  quantity: number
  unitPrice: number
  totalPrice: number
  selectedVariantId?: string
}

export interface OrderTotals {
  subtotal: number
  tax: number
  taxRate: number
  shipping: number
  shippingMethod: string
  discount: number
  discountCode?: string
  total: number
}

export interface OrderTracking {
  carrier: string
  trackingNumber: string
  trackingUrl: string
  shippedAt: Date
  estimatedDelivery?: Date
  actualDelivery?: Date
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus

  // Customer information
  customer: OrderCustomer
  shippingAddress: OrderShippingAddress
  billingAddress?: OrderShippingAddress

  // Order items and pricing
  items: OrderItem[]
  totals: OrderTotals

  // Payment information
  paymentIntentId?: string
  stripeCustomerId?: string

  // Shipping and tracking
  tracking?: OrderTracking

  // Metadata
  notes?: string
  internalNotes?: string
  metadata: Record<string, any>

  // Timestamps
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  shippedAt?: Date
  deliveredAt?: Date
}

// Order creation parameters
export interface CreateOrderParams {
  customer: OrderCustomer
  shippingAddress: OrderShippingAddress
  billingAddress?: OrderShippingAddress
  items: CartItem[]
  totals: OrderTotals
  paymentIntentId?: string
  stripeCustomerId?: string
  notes?: string
  metadata?: Record<string, any>
}

// In-memory order store (replace with database in production)
const orders: Map<string, Order> = new Map()

// Order number generation
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TPC-${timestamp}-${random}`
}

// Order creation
export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const orderId = crypto.randomUUID()
  const orderNumber = generateOrderNumber()

  // Convert cart items to order items
  const orderItems: OrderItem[] = params.items.map(cartItem => ({
    id: crypto.randomUUID(),
    productId: cartItem.productId,
    product: cartItem.product,
    quantity: cartItem.quantity,
    unitPrice: cartItem.selectedVariantId
      ? cartItem.product.variants?.find(v => v.id === cartItem.selectedVariantId)?.price ||
        cartItem.product.price
      : cartItem.product.price,
    totalPrice:
      (cartItem.selectedVariantId
        ? cartItem.product.variants?.find(v => v.id === cartItem.selectedVariantId)?.price ||
          cartItem.product.price
        : cartItem.product.price) * cartItem.quantity,
    selectedVariantId: cartItem.selectedVariantId || '',
  }))

  const order: Order = {
    id: orderId,
    orderNumber,
    status: 'pending',
    paymentStatus: 'pending',
    customer: params.customer,
    shippingAddress: params.shippingAddress,
    billingAddress: params.billingAddress || params.shippingAddress,
    items: orderItems,
    totals: params.totals,
    paymentIntentId: params.paymentIntentId || '',
    stripeCustomerId: params.stripeCustomerId || '',
    notes: params.notes || '',
    metadata: params.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  orders.set(orderId, order)

  console.log(`Order created: ${orderNumber} (ID: ${orderId})`)
  return order
}

// Order retrieval
export async function getOrder(orderId: string): Promise<Order | null> {
  return orders.get(orderId) || null
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const orderArray = Array.from(orders.values())
  for (const order of orderArray) {
    if (order.orderNumber === orderNumber) {
      return order
    }
  }
  return null
}

export async function getOrdersByCustomer(customerEmail: string): Promise<Order[]> {
  const customerOrders: Order[] = []
  const orderArray = Array.from(orders.values())
  for (const order of orderArray) {
    if (order.customer.email === customerEmail) {
      customerOrders.push(order)
    }
  }
  return customerOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Order status updates
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<Order | null> {
  const order = orders.get(orderId)
  if (!order) return null

  order.status = status
  order.updatedAt = new Date()

  if (notes) {
    order.internalNotes = order.internalNotes
      ? `${order.internalNotes}\n${new Date().toISOString()}: ${notes}`
      : notes
  }

  // Set timestamps for specific status changes
  switch (status) {
    case 'shipped':
      if (!order.shippedAt) order.shippedAt = new Date()
      break
    case 'delivered':
      if (!order.deliveredAt) order.deliveredAt = new Date()
      break
  }

  orders.set(orderId, order)
  console.log(`Order ${order.orderNumber} status updated to: ${status}`)
  return order
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<Order | null> {
  const order = orders.get(orderId)
  if (!order) return null

  order.paymentStatus = paymentStatus
  order.updatedAt = new Date()

  if (paymentStatus === 'succeeded' && !order.paidAt) {
    order.paidAt = new Date()
    // Automatically update order status to processing when payment succeeds
    order.status = 'processing'
  }

  orders.set(orderId, order)
  console.log(`Order ${order.orderNumber} payment status updated to: ${paymentStatus}`)
  return order
}

/**
 * Update order payment status from webhook
 * Used by Stripe webhooks to update order state
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  update: {
    status: 'paid' | 'payment_failed' | 'cancelled'
    paymentIntentId?: string
    paidAt?: Date
  }
): Promise<Order | null> {
  const order = orders.get(orderId)
  if (!order) return null

  // Update payment intent if provided
  if (update.paymentIntentId) {
    order.paymentIntentId = update.paymentIntentId
  }

  // Update payment status based on webhook status
  if (update.status === 'paid') {
    order.paymentStatus = 'succeeded'
    order.status = 'processing'
    order.paidAt = update.paidAt || new Date()
  } else if (update.status === 'payment_failed') {
    order.paymentStatus = 'failed'
    order.status = 'failed'
  } else if (update.status === 'cancelled') {
    order.paymentStatus = 'failed'
    order.status = 'cancelled'
  }

  order.updatedAt = new Date()
  orders.set(orderId, order)

  console.log(`Order ${order.orderNumber} updated from webhook: ${update.status}`)
  return order
}

// Order tracking
export async function addOrderTracking(
  orderId: string,
  tracking: Omit<OrderTracking, 'shippedAt'>
): Promise<Order | null> {
  const order = orders.get(orderId)
  if (!order) return null

  order.tracking = {
    ...tracking,
    shippedAt: new Date(),
  }
  order.status = 'shipped'
  order.shippedAt = new Date()
  order.updatedAt = new Date()

  orders.set(orderId, order)
  console.log(`Tracking added to order ${order.orderNumber}: ${tracking.trackingNumber}`)
  return order
}

// Inventory management helpers
export async function validateOrderInventory(
  items: CartItem[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  for (const item of items) {
    if (item.quantity > item.product.stockQuantity) {
      errors.push(
        `Insufficient stock for ${item.product.name}: ${item.quantity} requested, ${item.product.stockQuantity} available`
      )
    }

    if (!item.product.inStock) {
      errors.push(`${item.product.name} is currently out of stock`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function reserveInventory(items: OrderItem[]): Promise<void> {
  // In production, this would update database inventory
  // For now, we'll just log the reservation
  console.log(
    'Inventory reserved for order items:',
    items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  )
}

export async function releaseInventory(items: OrderItem[]): Promise<void> {
  // In production, this would restore database inventory
  // For now, we'll just log the release
  console.log(
    'Inventory released for order items:',
    items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  )
}

// Order analytics and reporting
export async function getOrderStats(dateRange?: { start: Date; end: Date }) {
  const allOrders = Array.from(orders.values())
  const filteredOrders = dateRange
    ? allOrders.filter(
        order => order.createdAt >= dateRange.start && order.createdAt <= dateRange.end
      )
    : allOrders

  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders
    .filter(order => order.paymentStatus === 'succeeded')
    .reduce((sum, order) => sum + order.totals.total, 0)

  const ordersByStatus = filteredOrders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    },
    {} as Record<OrderStatus, number>
  )

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    ordersByStatus,
    conversionRate: totalOrders > 0 ? (ordersByStatus.delivered || 0) / totalOrders : 0,
  }
}

// Order search and filtering
export interface OrderFilters {
  status?: OrderStatus[]
  paymentStatus?: PaymentStatus[]
  customerEmail?: string
  orderNumber?: string
  dateRange?: { start: Date; end: Date }
  limit?: number
  offset?: number
}

export async function searchOrders(
  filters: OrderFilters = {}
): Promise<{ orders: Order[]; total: number }> {
  let filteredOrders = Array.from(orders.values())

  // Apply filters
  if (filters.status) {
    filteredOrders = filteredOrders.filter(order => filters.status!.includes(order.status))
  }

  if (filters.paymentStatus) {
    filteredOrders = filteredOrders.filter(order =>
      filters.paymentStatus!.includes(order.paymentStatus)
    )
  }

  if (filters.customerEmail) {
    filteredOrders = filteredOrders.filter(order =>
      order.customer.email.toLowerCase().includes(filters.customerEmail!.toLowerCase())
    )
  }

  if (filters.orderNumber) {
    filteredOrders = filteredOrders.filter(order =>
      order.orderNumber.toLowerCase().includes(filters.orderNumber!.toLowerCase())
    )
  }

  if (filters.dateRange) {
    filteredOrders = filteredOrders.filter(
      order =>
        order.createdAt >= filters.dateRange!.start && order.createdAt <= filters.dateRange!.end
    )
  }

  // Sort by creation date (newest first)
  filteredOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const total = filteredOrders.length

  // Apply pagination
  if (filters.offset !== undefined && filters.limit !== undefined) {
    filteredOrders = filteredOrders.slice(filters.offset, filters.offset + filters.limit)
  } else if (filters.limit !== undefined) {
    filteredOrders = filteredOrders.slice(0, filters.limit)
  }

  return { orders: filteredOrders, total }
}

// Order cancellation and refunds
export async function cancelOrder(orderId: string, reason: string): Promise<Order | null> {
  const order = orders.get(orderId)
  if (!order) return null

  if (order.status === 'shipped' || order.status === 'delivered') {
    throw new Error('Cannot cancel order that has already been shipped')
  }

  order.status = 'cancelled'
  order.updatedAt = new Date()
  order.internalNotes = order.internalNotes
    ? `${order.internalNotes}\n${new Date().toISOString()}: Cancelled - ${reason}`
    : `Cancelled - ${reason}`

  // Release reserved inventory
  await releaseInventory(order.items)

  orders.set(orderId, order)
  console.log(`Order ${order.orderNumber} cancelled: ${reason}`)
  return order
}
