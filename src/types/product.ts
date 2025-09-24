/**
 * Product-related TypeScript type definitions for Two-Phase Cooling Products
 */

// Core product interface for two-phase cooling systems
export interface TwoPhaseCoolingProduct {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  originalPrice?: number
  currency: string
  description: string
  shortDescription: string
  features: string[]
  inStock: boolean
  stockQuantity: number
  estimatedShipping: string

  specifications: ProductSpecifications
  images: ProductImage[]
  variants?: ProductVariant[]
  categories: string[]
  tags: string[]

  // SEO and metadata
  metaTitle?: string
  metaDescription?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Detailed technical specifications
export interface ProductSpecifications {
  cooling: {
    capacity: string // "150W TDP"
    efficiency: string // "95% heat transfer efficiency"
    operatingRange: TemperatureRange
    fluidType: string // "Novec 7000"
    fluidVolume: string // "500ml"
  }

  compatibility: {
    cpuSockets: string[] // ["Intel LGA1700", "AMD AM4", "AMD AM5"]
    gpuSupport: string[] // ["RTX 4090", "RTX 4080", "RX 7900 XTX"]
    caseCompatibility: string // "Mid-tower and full-tower cases"
    motherboardClearance: string // "170mm CPU cooler clearance required"
  }

  dimensions: {
    length: number
    width: number
    height: number
    weight: number
    unit: 'mm' | 'cm' | 'in'
    weightUnit: 'g' | 'kg' | 'lbs'
  }

  environmental: {
    gwp: number // Global Warming Potential
    odp: number // Ozone Depletion Potential
    recyclable: boolean
    energyEfficiency: string // "A+ Rating"
  }

  performance: {
    noiseLevel: string // "<20 dBA at full load"
    pumpSpeed: string // "1200-3000 RPM variable"
    fanSpeed?: string // "800-2000 RPM PWM controlled"
    thermalResistance: string // "0.15 °C/W"
  }

  materials: {
    caseConstruction: string // "Tempered glass with aluminum frame"
    tubingMaterial: string // "PTFE-lined stainless steel"
    pumpMaterial: string // "Ceramic impeller with magnetic drive"
  }

  warranty: {
    duration: string // "5 years"
    coverage: string // "Full replacement warranty"
    support: string // "24/7 technical support"
  }
}

// Temperature range specification
export interface TemperatureRange {
  min: number
  max: number
  optimal: number
  unit: '°C' | '°F'
}

// Product image with metadata
export interface ProductImage {
  id: string
  url: string
  altText: string
  caption?: string
  type: 'main' | 'gallery' | 'technical' | 'lifestyle'
  order: number
}

// Product variants (different configurations)
export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  specifications: Partial<ProductSpecifications>
  images: ProductImage[]
  inStock: boolean
  stockQuantity: number
}

// Comparison data structure
export interface ProductComparison {
  feature: string
  twoPhaseCooling: string
  traditionalAir: string
  traditionalLiquid: string
  advantage: 'two-phase' | 'air' | 'liquid' | 'neutral'
}

// Product category types
export type ProductCategory = 'cooling-systems' | 'complete-cases' | 'components' | 'accessories'

// Product availability status
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order' | 'discontinued'

// Shipping information
export interface ShippingInfo {
  freeShippingThreshold: number
  standardShipping: {
    cost: number
    estimatedDays: string
  }
  expeditedShipping: {
    cost: number
    estimatedDays: string
  }
  restrictions: string[]
}
