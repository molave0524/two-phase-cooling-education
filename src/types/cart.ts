/**
 * Shopping Cart and Checkout TypeScript Types
 */

import { TwoPhaseCoolingProduct } from './product'

// Cart item interface
export interface CartItem {
  id: string
  productId: string
  product: TwoPhaseCoolingProduct
  quantity: number
  selectedVariantId?: string
  addedAt: Date
  updatedAt: Date
}

// Cart state interface
export interface CartState {
  items: CartItem[]
  isOpen: boolean
  itemCount: number
  subtotal: number
  tax: number
  shipping: number
  total: number
  appliedCoupon?: CouponCode
  estimatedDelivery: string
}

// Coupon/discount codes
export interface CouponCode {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  minimumAmount?: number
  expiresAt?: Date
}

// Shipping address interface
export interface ShippingAddress {
  id?: string
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
  isDefault?: boolean
}

// Billing address interface (can be same as shipping)
export interface BillingAddress extends ShippingAddress {
  sameAsShipping: boolean
}

// Shipping method options
export interface ShippingMethod {
  id: string
  name: string
  description: string
  cost: number
  estimatedDays: string
  carrier: string
  trackingAvailable: boolean
}

// Payment method interface
export interface PaymentMethod {
  type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'buy_now_pay_later'
  cardNumber?: string
  expiryMonth?: string
  expiryYear?: string
  cvv?: string
  cardholderName?: string
  paypalEmail?: string
  bnplProvider?: 'klarna' | 'afterpay' | 'affirm'
}

// Checkout state interface
export interface CheckoutState {
  step: CheckoutStep
  isGuestCheckout: boolean
  customerInfo: CustomerInfo
  shippingAddress: ShippingAddress | null
  billingAddress: BillingAddress | null
  shippingMethod: ShippingMethod | null
  paymentMethod: PaymentMethod | null
  orderNotes?: string
  agreedToTerms: boolean
  subscribedToMarketing: boolean
  isProcessing: boolean
  errors: CheckoutError[]
}

// Checkout steps
export type CheckoutStep =
  | 'cart'
  | 'information'
  | 'shipping'
  | 'payment'
  | 'review'
  | 'processing'
  | 'confirmation'

// Customer information for checkout
export interface CustomerInfo {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  createAccount?: boolean
  password?: string
}

// Checkout errors
export interface CheckoutError {
  field: string
  message: string
  code?: string
}

// Order interface
export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  items: CartItem[]
  customerInfo: CustomerInfo
  shippingAddress: ShippingAddress
  billingAddress: BillingAddress
  shippingMethod: ShippingMethod
  paymentMethod: Omit<PaymentMethod, 'cardNumber' | 'cvv'> // Security: exclude sensitive data
  pricing: OrderPricing
  orderNotes?: string
  createdAt: Date
  updatedAt: Date
  estimatedDelivery: Date
  trackingNumber?: string
}

// Order pricing breakdown
export interface OrderPricing {
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
}

// Order status types
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

// USA states for shipping validation
export const USA_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
] as const

// Tax rates by state (placeholder - in production would come from tax service)
export const USA_TAX_RATES: Record<string, number> = {
  CA: 0.0875, // 8.75%
  NY: 0.08, // 8%
  TX: 0.0625, // 6.25%
  FL: 0.06, // 6%
  WA: 0.065, // 6.5%
  // Add other states as needed
}
