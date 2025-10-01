/**
 * Order Processing and Management System
 * Handles order creation, status updates, and fulfillment workflow
 */

import { TwoPhaseCoolingProduct } from '@/types/product'
import { CartItem } from '@/types/cart'
import { db, orders as ordersTable, orderItems as orderItemsTable } from '@/db'
import { eq, and, gte, lte, like, or, desc, count, sum } from 'drizzle-orm'

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

// Helper function to convert database order to Order interface
function dbOrderToOrder(dbOrder: any, dbOrderItems: any[]): Order {
  const orderItems: OrderItem[] = dbOrderItems.map(item => ({
    id: item.id.toString(),
    productId: item.productId,
    product: {
      // Product details are stored in orderItem for historical record
      id: item.productId,
      name: item.productName,
      slug: item.productId.toLowerCase().replace(/\s+/g, '-'),
      sku: item.productId,
      price: item.price,
      currency: 'USD',
      description: '',
      shortDescription: '',
      features: [],
      inStock: true,
      stockQuantity: 0,
      estimatedShipping: '',
      specifications: {
        cooling: {
          capacity: '',
          efficiency: '',
          operatingRange: { min: 0, max: 0 },
          fluidType: '',
          fluidVolume: '',
        },
        compatibility: {
          cpuSockets: [],
          gpuSupport: [],
          caseCompatibility: '',
          motherboardClearance: '',
        },
        dimensions: { length: '', width: '', height: '', weight: '' },
        environmental: { noiseLevel: '', powerConsumption: '', mtbf: '' },
        performance: { heatPipes: 0, fanSpeed: '', airflow: '', staticPressure: '' },
        materials: { radiator: '', block: '', tubing: '' },
        warranty: { duration: '', coverage: '' },
      },
      images: [item.productImage],
      categories: [],
      tags: [],
      variants: [],
      relatedProducts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as TwoPhaseCoolingProduct,
    quantity: item.quantity,
    unitPrice: item.price,
    totalPrice: item.price * item.quantity,
    selectedVariantId: item.variantId || undefined,
  }))

  const customer =
    typeof dbOrder.customer === 'string' ? JSON.parse(dbOrder.customer) : dbOrder.customer

  const shippingAddress =
    typeof dbOrder.shippingAddress === 'string'
      ? JSON.parse(dbOrder.shippingAddress)
      : dbOrder.shippingAddress

  const billingAddress = dbOrder.billingAddress
    ? typeof dbOrder.billingAddress === 'string'
      ? JSON.parse(dbOrder.billingAddress)
      : dbOrder.billingAddress
    : shippingAddress

  const metadata = dbOrder.metadata
    ? typeof dbOrder.metadata === 'string'
      ? JSON.parse(dbOrder.metadata)
      : dbOrder.metadata
    : {}

  const totals: OrderTotals = {
    subtotal: dbOrder.subtotal,
    tax: dbOrder.tax,
    taxRate: dbOrder.taxRate,
    shipping: dbOrder.shipping,
    shippingMethod: dbOrder.shippingMethod,
    discount: dbOrder.discount,
    discountCode: dbOrder.discountCode || undefined,
    total: dbOrder.total,
  }

  const order: Order = {
    id: dbOrder.id.toString(),
    orderNumber: dbOrder.orderNumber,
    status: dbOrder.status as OrderStatus,
    paymentStatus: dbOrder.paymentStatus as PaymentStatus,
    customer,
    shippingAddress,
    billingAddress,
    items: orderItems,
    totals,
    metadata,
    createdAt: new Date(dbOrder.createdAt * 1000),
    updatedAt: new Date(dbOrder.updatedAt * 1000),
  }

  // Add optional fields only if they exist
  if (dbOrder.stripePaymentIntentId) {
    order.paymentIntentId = dbOrder.stripePaymentIntentId
  }
  if (dbOrder.stripeCustomerId) {
    order.stripeCustomerId = dbOrder.stripeCustomerId
  }
  if (dbOrder.notes) {
    order.notes = dbOrder.notes
  }
  if (dbOrder.internalNotes) {
    order.internalNotes = dbOrder.internalNotes
  }
  if (dbOrder.paidAt) {
    order.paidAt = new Date(dbOrder.paidAt * 1000)
  }
  if (dbOrder.shippedAt) {
    order.shippedAt = new Date(dbOrder.shippedAt * 1000)
  }
  if (dbOrder.deliveredAt) {
    order.deliveredAt = new Date(dbOrder.deliveredAt * 1000)
  }

  // Add tracking if available
  if (dbOrder.trackingNumber) {
    order.tracking = {
      carrier: dbOrder.shippingCarrier || '',
      trackingNumber: dbOrder.trackingNumber,
      trackingUrl: dbOrder.trackingUrl || '',
      shippedAt: dbOrder.shippedAt ? new Date(dbOrder.shippedAt * 1000) : new Date(),
    }

    if (dbOrder.estimatedDelivery) {
      order.tracking.estimatedDelivery = new Date(dbOrder.estimatedDelivery * 1000)
    }

    if (dbOrder.deliveredAt) {
      order.tracking.actualDelivery = new Date(dbOrder.deliveredAt * 1000)
    }
  }

  return order
}

// Order number generation
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TPC-${timestamp}-${random}`
}

// Order creation
export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const orderNumber = generateOrderNumber()
  const now = Math.floor(Date.now() / 1000)

  // Insert order into database
  const [dbOrder] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      status: 'pending',
      paymentStatus: 'pending',
      customer: JSON.stringify(params.customer),
      shippingAddress: JSON.stringify(params.shippingAddress),
      billingAddress: params.billingAddress ? JSON.stringify(params.billingAddress) : null,
      subtotal: params.totals.subtotal,
      tax: params.totals.tax,
      taxRate: params.totals.taxRate,
      shipping: params.totals.shipping,
      shippingMethod: params.totals.shippingMethod,
      discount: params.totals.discount,
      discountCode: params.totals.discountCode || null,
      total: params.totals.total,
      paymentMethod: 'card',
      stripePaymentIntentId: params.paymentIntentId || null,
      stripeCustomerId: params.stripeCustomerId || null,
      notes: params.notes || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  // Insert order items into database
  const dbOrderItems = await Promise.all(
    params.items.map(async cartItem => {
      const unitPrice = cartItem.selectedVariantId
        ? cartItem.product.variants?.find(v => v.id === cartItem.selectedVariantId)?.price ||
          cartItem.product.price
        : cartItem.product.price

      const [item] = await db
        .insert(orderItemsTable)
        .values({
          orderId: dbOrder.id,
          productId: cartItem.productId,
          productName: cartItem.product.name,
          productImage: cartItem.product.images[0] || '',
          variantId: cartItem.selectedVariantId || null,
          variantName: cartItem.selectedVariantId
            ? cartItem.product.variants?.find(v => v.id === cartItem.selectedVariantId)?.name ||
              null
            : null,
          quantity: cartItem.quantity,
          price: unitPrice,
          createdAt: now,
        })
        .returning()

      return item
    })
  )

  const order = dbOrderToOrder(dbOrder, dbOrderItems)

  console.log(`Order created: ${orderNumber} (ID: ${order.id})`)
  return order
}

// Order retrieval
export async function getOrder(orderId: string): Promise<Order | null> {
  const orderIdNum = parseInt(orderId, 10)
  if (isNaN(orderIdNum)) return null

  const [dbOrder] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderIdNum))
    .limit(1)

  if (!dbOrder) return null

  const dbOrderItems = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderIdNum))

  return dbOrderToOrder(dbOrder, dbOrderItems)
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const [dbOrder] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber))
    .limit(1)

  if (!dbOrder) return null

  const dbOrderItems = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, dbOrder.id))

  return dbOrderToOrder(dbOrder, dbOrderItems)
}

export async function getOrdersByCustomer(customerEmail: string): Promise<Order[]> {
  // Query orders where customer JSON contains the email
  const dbOrders = await db
    .select()
    .from(ordersTable)
    .where(like(ordersTable.customer, `%"email":"${customerEmail}"%`))
    .orderBy(desc(ordersTable.createdAt))

  // Fetch order items for all orders
  const customerOrders: Order[] = []
  for (const dbOrder of dbOrders) {
    const dbOrderItems = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, dbOrder.id))

    customerOrders.push(dbOrderToOrder(dbOrder, dbOrderItems))
  }

  return customerOrders
}

// Order status updates
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<Order | null> {
  const orderIdNum = parseInt(orderId, 10)
  if (isNaN(orderIdNum)) return null

  // First, get the current order to access its internalNotes
  const [currentOrder] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderIdNum))
    .limit(1)

  if (!currentOrder) return null

  const now = Math.floor(Date.now() / 1000)
  const updateData: any = {
    status,
    updatedAt: now,
  }

  // Update internal notes if provided
  if (notes) {
    const existingNotes = currentOrder.internalNotes || ''
    updateData.internalNotes = existingNotes
      ? `${existingNotes}\n${new Date().toISOString()}: ${notes}`
      : notes
  }

  // Set timestamps for specific status changes
  if (status === 'shipped' && !currentOrder.shippedAt) {
    updateData.shippedAt = now
  } else if (status === 'delivered' && !currentOrder.deliveredAt) {
    updateData.deliveredAt = now
  }

  const [updatedDbOrder] = await db
    .update(ordersTable)
    .set(updateData)
    .where(eq(ordersTable.id, orderIdNum))
    .returning()

  const dbOrderItems = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderIdNum))

  const order = dbOrderToOrder(updatedDbOrder, dbOrderItems)
  console.log(`Order ${order.orderNumber} status updated to: ${status}`)
  return order
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<Order | null> {
  const orderIdNum = parseInt(orderId, 10)
  if (isNaN(orderIdNum)) return null

  const now = Math.floor(Date.now() / 1000)
  const updateData: any = {
    paymentStatus,
    updatedAt: now,
  }

  if (paymentStatus === 'succeeded') {
    // Get current order to check if paidAt is already set
    const [currentOrder] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderIdNum))
      .limit(1)

    if (!currentOrder) return null

    if (!currentOrder.paidAt) {
      updateData.paidAt = now
    }
    // Automatically update order status to processing when payment succeeds
    updateData.status = 'processing'
  }

  const [updatedDbOrder] = await db
    .update(ordersTable)
    .set(updateData)
    .where(eq(ordersTable.id, orderIdNum))
    .returning()

  if (!updatedDbOrder) return null

  const dbOrderItems = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderIdNum))

  const order = dbOrderToOrder(updatedDbOrder, dbOrderItems)
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
  const orderIdNum = parseInt(orderId, 10)
  if (isNaN(orderIdNum)) return null

  const now = Math.floor(Date.now() / 1000)
  const updateData: any = {
    updatedAt: now,
  }

  // Update payment intent if provided
  if (update.paymentIntentId) {
    updateData.stripePaymentIntentId = update.paymentIntentId
  }

  // Update payment status based on webhook status
  if (update.status === 'paid') {
    updateData.paymentStatus = 'succeeded'
    updateData.status = 'processing'
    updateData.paidAt = update.paidAt ? Math.floor(update.paidAt.getTime() / 1000) : now
  } else if (update.status === 'payment_failed') {
    updateData.paymentStatus = 'failed'
    updateData.status = 'failed'
  } else if (update.status === 'cancelled') {
    updateData.paymentStatus = 'failed'
    updateData.status = 'cancelled'
  }

  const [updatedDbOrder] = await db
    .update(ordersTable)
    .set(updateData)
    .where(eq(ordersTable.id, orderIdNum))
    .returning()

  if (!updatedDbOrder) return null

  const dbOrderItems = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderIdNum))

  const order = dbOrderToOrder(updatedDbOrder, dbOrderItems)
  console.log(`Order ${order.orderNumber} updated from webhook: ${update.status}`)
  return order
}

// Order tracking
export async function addOrderTracking(
  orderId: string,
  tracking: Omit<OrderTracking, 'shippedAt'>
): Promise<Order | null> {
  const orderIdNum = parseInt(orderId, 10)
  if (isNaN(orderIdNum)) return null

  const now = Math.floor(Date.now() / 1000)
  const updateData: any = {
    trackingNumber: tracking.trackingNumber,
    shippingCarrier: tracking.carrier,
    trackingUrl: tracking.trackingUrl,
    shippedAt: now,
    estimatedDelivery: tracking.estimatedDelivery
      ? Math.floor(tracking.estimatedDelivery.getTime() / 1000)
      : null,
    status: 'shipped',
    updatedAt: now,
  }

  const [updatedDbOrder] = await db
    .update(ordersTable)
    .set(updateData)
    .where(eq(ordersTable.id, orderIdNum))
    .returning()

  if (!updatedDbOrder) return null

  const dbOrderItems = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderIdNum))

  const order = dbOrderToOrder(updatedDbOrder, dbOrderItems)
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
  // Build the where condition for date range
  let whereCondition
  if (dateRange) {
    const startTimestamp = Math.floor(dateRange.start.getTime() / 1000)
    const endTimestamp = Math.floor(dateRange.end.getTime() / 1000)
    whereCondition = and(
      gte(ordersTable.createdAt, startTimestamp),
      lte(ordersTable.createdAt, endTimestamp)
    )
  }

  // Get total orders count
  const [totalOrdersResult] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(whereCondition)

  const totalOrders = totalOrdersResult?.count || 0

  // Get total revenue (only succeeded payments)
  const [revenueResult] = await db
    .select({ total: sum(ordersTable.total) })
    .from(ordersTable)
    .where(
      whereCondition
        ? and(whereCondition, eq(ordersTable.paymentStatus, 'succeeded'))
        : eq(ordersTable.paymentStatus, 'succeeded')
    )

  const totalRevenue = Number(revenueResult?.total || 0)

  // Get orders by status
  const statusResults = await db
    .select({
      status: ordersTable.status,
      count: count(),
    })
    .from(ordersTable)
    .where(whereCondition)
    .groupBy(ordersTable.status)

  const ordersByStatus = statusResults.reduce(
    (acc: Record<OrderStatus, number>, row: { status: string; count: number }) => {
      acc[row.status as OrderStatus] = row.count
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
  // Build where conditions
  const conditions: any[] = []

  if (filters.status && filters.status.length > 0) {
    conditions.push(or(...filters.status.map(status => eq(ordersTable.status, status))))
  }

  if (filters.paymentStatus && filters.paymentStatus.length > 0) {
    conditions.push(
      or(...filters.paymentStatus.map(status => eq(ordersTable.paymentStatus, status)))
    )
  }

  if (filters.customerEmail) {
    conditions.push(like(ordersTable.customer, `%"email":"${filters.customerEmail}"%`))
  }

  if (filters.orderNumber) {
    conditions.push(like(ordersTable.orderNumber, `%${filters.orderNumber}%`))
  }

  if (filters.dateRange) {
    const startTimestamp = Math.floor(filters.dateRange.start.getTime() / 1000)
    const endTimestamp = Math.floor(filters.dateRange.end.getTime() / 1000)
    conditions.push(
      and(gte(ordersTable.createdAt, startTimestamp), lte(ordersTable.createdAt, endTimestamp))
    )
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const [totalResult] = await db.select({ count: count() }).from(ordersTable).where(whereCondition)

  const total = totalResult?.count || 0

  // Get filtered orders with pagination
  let query = db
    .select()
    .from(ordersTable)
    .where(whereCondition)
    .orderBy(desc(ordersTable.createdAt))

  if (filters.limit !== undefined) {
    query = query.limit(filters.limit) as any
  }

  if (filters.offset !== undefined) {
    query = query.offset(filters.offset) as any
  }

  const dbOrders = await query

  // Fetch order items for each order
  const ordersWithItems: Order[] = []
  for (const dbOrder of dbOrders) {
    const dbOrderItems = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, dbOrder.id))

    ordersWithItems.push(dbOrderToOrder(dbOrder, dbOrderItems))
  }

  return { orders: ordersWithItems, total }
}

// Order cancellation and refunds
export async function cancelOrder(orderId: string, reason: string): Promise<Order | null> {
  const orderIdNum = parseInt(orderId, 10)
  if (isNaN(orderIdNum)) return null

  // Get current order to check status
  const [currentOrder] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderIdNum))
    .limit(1)

  if (!currentOrder) return null

  if (currentOrder.status === 'shipped' || currentOrder.status === 'delivered') {
    throw new Error('Cannot cancel order that has already been shipped')
  }

  const now = Math.floor(Date.now() / 1000)
  const existingNotes = currentOrder.internalNotes || ''
  const cancelNote = `Cancelled - ${reason}`
  const updatedNotes = existingNotes
    ? `${existingNotes}\n${new Date().toISOString()}: ${cancelNote}`
    : cancelNote

  const [updatedDbOrder] = await db
    .update(ordersTable)
    .set({
      status: 'cancelled',
      updatedAt: now,
      internalNotes: updatedNotes,
    })
    .where(eq(ordersTable.id, orderIdNum))
    .returning()

  if (!updatedDbOrder) return null

  const dbOrderItems = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderIdNum))

  const order = dbOrderToOrder(updatedDbOrder, dbOrderItems)

  // Release reserved inventory
  await releaseInventory(order.items)

  console.log(`Order ${order.orderNumber} cancelled: ${reason}`)
  return order
}
