/**
 * Shipping Integration System
 * Handles shipping rate calculation, label generation, and tracking integration
 */

import { OrderShippingAddress, Order, OrderTracking } from './orders'

// Shipping provider types
export type ShippingProvider = 'ups' | 'fedex' | 'usps' | 'dhl'

export interface ShippingRate {
  provider: ShippingProvider
  service: string
  serviceCode: string
  cost: number
  currency: string
  estimatedDays: string
  guaranteedDelivery?: Date
  features: string[]
}

export interface ShippingLabel {
  labelId: string
  trackingNumber: string
  labelUrl: string
  provider: ShippingProvider
  service: string
  cost: number
  createdAt: Date
  expiresAt?: Date
}

export interface TrackingEvent {
  timestamp: Date
  status: string
  description: string
  location?: {
    city: string
    state?: string
    country: string
  }
}

export interface TrackingInfo {
  trackingNumber: string
  provider: ShippingProvider
  status:
    | 'unknown'
    | 'pre_transit'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'exception'
    | 'returned'
  estimatedDelivery?: Date
  actualDelivery?: Date
  events: TrackingEvent[]
  lastUpdated: Date
}

// Package dimensions and weight for two-phase cooling systems
export const PRODUCT_SHIPPING_INFO = {
  'two-phase-cooling-case-v1': {
    weight: 18.5, // kg converted to lbs: ~40.8 lbs
    dimensions: {
      length: 24, // inches (converted from 610mm)
      width: 16, // inches (converted from 406mm)
      height: 20, // inches (converted from 508mm)
    },
    packagingWeight: 2.5, // additional packaging weight in lbs
    requiresSignature: true,
    fragile: true,
    insuranceValue: 1500, // USD
  },
  'two-phase-cooling-case-compact': {
    weight: 20, // lbs (~9.1 kg)
    dimensions: {
      length: 18, // inches
      width: 12, // inches
      height: 16, // inches
    },
    packagingWeight: 2.0,
    requiresSignature: true,
    fragile: true,
    insuranceValue: 1000,
  },
} as const

// Shipping configuration
const SHIPPING_CONFIG = {
  ups: {
    accountNumber: process.env.UPS_ACCOUNT_NUMBER || '',
    accessKey: process.env.UPS_ACCESS_KEY || '',
    username: process.env.UPS_USERNAME || '',
    password: process.env.UPS_PASSWORD || '',
    baseUrl: process.env.UPS_API_BASE_URL || 'https://wwwcie.ups.com/rest',
  },
  fedex: {
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '',
    meterNumber: process.env.FEDEX_METER_NUMBER || '',
    key: process.env.FEDEX_KEY || '',
    password: process.env.FEDEX_PASSWORD || '',
    baseUrl: process.env.FEDEX_API_BASE_URL || 'https://wsbeta.fedex.com:443/web-services',
  },
  origin: {
    company: 'Two-Phase Cooling Systems',
    name: 'Fulfillment Center',
    phone: '1-800-TPC-COOL',
    addressLine1: '1234 Innovation Drive',
    city: 'San Jose',
    state: 'CA',
    zipCode: '95110',
    country: 'US',
  },
}

// Mock shipping rates (replace with real API calls in production)
export async function getShippingRates(
  destination: OrderShippingAddress,
  packageInfo: { weight: number; dimensions: { length: number; width: number; height: number } }
): Promise<ShippingRate[]> {
  console.log(`Getting shipping rates for ${destination.city}, ${destination.state}`)

  // In production, this would make API calls to UPS, FedEx, etc.
  // For now, return mock rates based on package info and destination

  const baseRate = calculateBaseShippingRate(destination.state, packageInfo.weight)

  const rates: ShippingRate[] = [
    {
      provider: 'ups',
      service: 'UPS Ground',
      serviceCode: 'GND',
      cost: baseRate * 0.8,
      currency: 'USD',
      estimatedDays: '5-7 business days',
      features: ['Tracking included', 'Insurance up to $100'],
    },
    {
      provider: 'ups',
      service: 'UPS 2nd Day Air',
      serviceCode: '2DA',
      cost: baseRate * 2.5,
      currency: 'USD',
      estimatedDays: '2 business days',
      features: ['Tracking included', 'Insurance up to $100', 'Signature required'],
    },
    {
      provider: 'ups',
      service: 'UPS Next Day Air',
      serviceCode: '1DA',
      cost: baseRate * 4.0,
      currency: 'USD',
      estimatedDays: '1 business day',
      guaranteedDelivery: getBusinessDaysFromNow(1),
      features: [
        'Tracking included',
        'Insurance up to $100',
        'Signature required',
        'Guaranteed delivery',
      ],
    },
    {
      provider: 'fedex',
      service: 'FedEx Ground',
      serviceCode: 'FDXG',
      cost: baseRate * 0.85,
      currency: 'USD',
      estimatedDays: '5-7 business days',
      features: ['Tracking included', 'Basic insurance'],
    },
    {
      provider: 'fedex',
      service: 'FedEx Express Saver',
      serviceCode: 'FDXES',
      cost: baseRate * 2.2,
      currency: 'USD',
      estimatedDays: '3 business days',
      features: ['Tracking included', 'Insurance included', 'Signature required'],
    },
    {
      provider: 'fedex',
      service: 'FedEx Priority Overnight',
      serviceCode: 'PRIORITY_OVERNIGHT',
      cost: baseRate * 3.8,
      currency: 'USD',
      estimatedDays: '1 business day',
      guaranteedDelivery: getBusinessDaysFromNow(1),
      features: [
        'Tracking included',
        'Full insurance',
        'Signature required',
        'Guaranteed delivery',
      ],
    },
  ]

  // Filter out rates that are too expensive or not available for the destination
  return rates.filter(rate => rate.cost < 500) // Max $500 shipping
}

// Calculate base shipping rate based on destination and weight
function calculateBaseShippingRate(state: string, weight: number): number {
  const zones: Record<string, number> = {
    // Zone 1 (West Coast) - Origin is CA
    CA: 1.0,
    NV: 1.0,
    OR: 1.0,
    WA: 1.0,
    AZ: 1.1,

    // Zone 2 (Mountain/Southwest)
    CO: 1.2,
    UT: 1.2,
    ID: 1.2,
    MT: 1.3,
    WY: 1.3,
    NM: 1.2,
    TX: 1.3,
    OK: 1.3,

    // Zone 3 (Central)
    ND: 1.4,
    SD: 1.4,
    NE: 1.4,
    KS: 1.4,
    MN: 1.4,
    IA: 1.4,
    MO: 1.4,
    AR: 1.4,
    LA: 1.4,
    WI: 1.4,
    IL: 1.4,
    MS: 1.4,
    AL: 1.4,
    TN: 1.4,
    KY: 1.4,
    IN: 1.4,
    OH: 1.5,
    MI: 1.5,

    // Zone 4 (East Coast)
    WV: 1.6,
    VA: 1.6,
    NC: 1.6,
    SC: 1.6,
    GA: 1.6,
    FL: 1.7,
    PA: 1.6,
    NY: 1.6,
    NJ: 1.6,
    CT: 1.6,
    RI: 1.6,
    MA: 1.6,
    VT: 1.6,
    NH: 1.6,
    ME: 1.7,
    MD: 1.6,
    DE: 1.6,
    DC: 1.6,

    // Special zones
    AK: 2.5,
    HI: 2.5,
  }

  const zoneMultiplier = zones[state] || 1.5 // Default for unknown states
  const weightMultiplier = Math.max(1, weight / 20) // $1 per 20 lbs base rate

  return Math.round((25 + weight * 1.2) * zoneMultiplier * 100) / 100
}

// Utility function to get business days from now
function getBusinessDaysFromNow(businessDays: number): Date {
  const result = new Date()
  let addedDays = 0

  while (addedDays < businessDays) {
    result.setDate(result.getDate() + 1)
    // Skip weekends
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++
    }
  }

  return result
}

// Create shipping label (mock implementation)
export async function createShippingLabel(
  order: Order,
  shippingRate: ShippingRate
): Promise<ShippingLabel> {
  console.log(`Creating ${shippingRate.provider} shipping label for order ${order.orderNumber}`)

  // In production, this would call the shipping provider's API
  const trackingNumber = generateTrackingNumber(shippingRate.provider)

  const label: ShippingLabel = {
    labelId: `label_${Date.now()}`,
    trackingNumber,
    labelUrl: `https://api.${shippingRate.provider}.com/labels/${trackingNumber}.pdf`,
    provider: shippingRate.provider,
    service: shippingRate.service,
    cost: shippingRate.cost,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  }

  console.log(`Shipping label created: ${trackingNumber}`)
  return label
}

// Generate mock tracking number
function generateTrackingNumber(provider: ShippingProvider): string {
  const timestamp = Date.now().toString()

  switch (provider) {
    case 'ups':
      return `1Z999AA1${timestamp.slice(-8)}`
    case 'fedex':
      return `${timestamp.slice(-12)}`
    case 'usps':
      return `9400111${timestamp.slice(-12)}US`
    case 'dhl':
      return `${timestamp.slice(-10)}`
    default:
      return `TPC${timestamp.slice(-8)}`
  }
}

// Track package (mock implementation)
export async function trackPackage(
  trackingNumber: string,
  provider?: ShippingProvider
): Promise<TrackingInfo | null> {
  console.log(`Tracking package: ${trackingNumber}`)

  // Determine provider from tracking number if not provided
  if (!provider) {
    provider = detectProvider(trackingNumber)
  }

  if (!provider) {
    console.error(`Unable to determine provider for tracking number: ${trackingNumber}`)
    return null
  }

  // In production, this would call the provider's tracking API
  // Return mock tracking info for demonstration
  const mockEvents: TrackingEvent[] = [
    {
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'order_processed',
      description: 'Order processed and ready for shipment',
      location: { city: 'San Jose', state: 'CA', country: 'US' },
    },
    {
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'picked_up',
      description: 'Package picked up by carrier',
      location: { city: 'San Jose', state: 'CA', country: 'US' },
    },
    {
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'in_transit',
      description: 'Package in transit',
      location: { city: 'Phoenix', state: 'AZ', country: 'US' },
    },
  ]

  return {
    trackingNumber,
    provider,
    status: 'in_transit',
    estimatedDelivery: getBusinessDaysFromNow(2),
    events: mockEvents,
    lastUpdated: new Date(),
  }
}

// Detect shipping provider from tracking number
function detectProvider(trackingNumber: string): ShippingProvider | null {
  if (trackingNumber.startsWith('1Z')) return 'ups'
  if (/^\d{12,14}$/.test(trackingNumber)) return 'fedex'
  if (trackingNumber.includes('US')) return 'usps'
  if (/^\d{10}$/.test(trackingNumber)) return 'dhl'
  return null
}

// Get shipping info for product
export function getProductShippingInfo(productId: string) {
  return (
    PRODUCT_SHIPPING_INFO[productId as keyof typeof PRODUCT_SHIPPING_INFO] || {
      weight: 25,
      dimensions: { length: 20, width: 16, height: 18 },
      packagingWeight: 2.5,
      requiresSignature: true,
      fragile: true,
      insuranceValue: 1000,
    }
  )
}

// Calculate total shipping weight for order
export function calculateOrderShippingWeight(order: Order): number {
  let totalWeight = 0

  for (const item of order.items) {
    const productInfo = getProductShippingInfo(item.productId)
    totalWeight += (productInfo.weight + productInfo.packagingWeight) * item.quantity
  }

  return Math.round(totalWeight * 10) / 10 // Round to 1 decimal place
}

// Calculate order package dimensions (for multiple items, use largest dimensions)
export function calculateOrderDimensions(order: Order) {
  let maxLength = 0
  let maxWidth = 0
  let totalHeight = 0

  for (const item of order.items) {
    const productInfo = getProductShippingInfo(item.productId)
    maxLength = Math.max(maxLength, productInfo.dimensions.length)
    maxWidth = Math.max(maxWidth, productInfo.dimensions.width)
    totalHeight += productInfo.dimensions.height * item.quantity
  }

  return {
    length: maxLength,
    width: maxWidth,
    height: Math.min(totalHeight, 48), // Max 48" height for shipping
  }
}

// Validate shipping configuration
export function validateShippingConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!SHIPPING_CONFIG.origin.company) {
    errors.push('Missing shipping origin configuration')
  }

  // Check if at least one provider is configured
  const upsConfigured = !!(SHIPPING_CONFIG.ups.accountNumber && SHIPPING_CONFIG.ups.accessKey)
  const fedexConfigured = !!(SHIPPING_CONFIG.fedex.accountNumber && SHIPPING_CONFIG.fedex.key)

  if (!upsConfigured && !fedexConfigured) {
    errors.push('No shipping providers configured (UPS or FedEx required)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
