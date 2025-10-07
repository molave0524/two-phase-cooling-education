/**
 * Order Type Definitions
 * Separated from implementation to avoid build-time database imports
 */

import { TwoPhaseCoolingProduct } from '@/types/product'

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
  selectedVariantId?: string | undefined
}

export interface OrderTotals {
  subtotal: number
  tax: number
  taxRate: number
  shipping: number
  shippingMethod: string
  discount: number
  discountCode?: string | undefined
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
  userId?: number | null

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

  // Tracking information
  tracking?: OrderTracking

  // Metadata
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  cancelledAt?: Date

  // Internal notes for order management
  notes?: string
}
