/**
 * Product-specific Constants
 * Centralized product, pricing, and e-commerce configuration
 */

import { clientEnv } from '@/lib/env'

// Audio/Noise Level Constants (in dBA)
export const NOISE_LEVELS = {
  ULTRA_SILENT: 12,
  ULTRA_QUIET: 15,
  VERY_QUIET: 16,
  WHISPER_QUIET: 18,
  QUIET: 20,
  MODERATE_QUIET: 22,
  MODERATE: 25,
  NORMAL: 35,
  LOUD: 45,
} as const

// Temperature Constants (in Celsius)
export const TEMPERATURE = {
  FREEZING: 0,
  COLD: -10,
  VERY_COLD: -20,
  COOL: 10,
  OPTIMAL_COOLING: 65,
  WARM: 80,
  HOT: 100,
} as const

// Video player constants
export const VIDEO_PLAYER = {
  DEFAULT_VOLUME: 0.8,
  SEEK_STEP: 10, // seconds
  VOLUME_STEP: 0.1,
  PROGRESS_UPDATE_INTERVAL: 1000, // milliseconds
  CONTROLS_HIDE_DELAY: 3000, // milliseconds
} as const

// Performance metrics
export const METRICS = {
  MAX_TEMPERATURE: 100, // Celsius
  MIN_TEMPERATURE: 0,
  MAX_EFFICIENCY: 100, // percentage
  MIN_EFFICIENCY: 0,
  EXCELLENT_SCORE: 90,
  GOOD_SCORE: 70,
  POOR_SCORE: 50,
} as const

// Company information from validated environment variables
export const COMPANY_INFO = {
  NAME: clientEnv.NEXT_PUBLIC_COMPANY_NAME,
  EMAIL: clientEnv.NEXT_PUBLIC_CONTACT_EMAIL,
  PHONE: clientEnv.NEXT_PUBLIC_CONTACT_PHONE,
  DOMAIN: clientEnv.NEXT_PUBLIC_DOMAIN,
} as const

// Social media configuration
export const SOCIAL_MEDIA = {
  TWITTER: clientEnv.NEXT_PUBLIC_TWITTER_HANDLE,
  YOUTUBE: clientEnv.NEXT_PUBLIC_YOUTUBE_HANDLE,
} as const

// Product configuration
export const PRODUCT_CONFIG = {
  DEFAULT_CURRENCY: clientEnv.NEXT_PUBLIC_DEFAULT_CURRENCY,
  IMAGE_SERVICE: clientEnv.NEXT_PUBLIC_IMAGE_PLACEHOLDER_SERVICE,
  CDN_URL: clientEnv.NEXT_PUBLIC_PRODUCT_IMAGE_CDN || '',
} as const

// Product pricing (server-side values for security)
export const PRICING = {
  PRO_CASE:
    typeof process.env.PRODUCT_PRO_PRICE !== 'undefined'
      ? parseFloat(process.env.PRODUCT_PRO_PRICE)
      : 1299.99,
  COMPACT_CASE:
    typeof process.env.PRODUCT_COMPACT_PRICE !== 'undefined'
      ? parseFloat(process.env.PRODUCT_COMPACT_PRICE)
      : 899.99,
} as const

// Technical specifications
export const TECHNICAL_SPECS = {
  GWP_RATING:
    typeof process.env.PRODUCT_GWP_RATING !== 'undefined'
      ? parseInt(process.env.PRODUCT_GWP_RATING)
      : 20,
  ODP_RATING:
    typeof process.env.PRODUCT_ODP_RATING !== 'undefined'
      ? parseInt(process.env.PRODUCT_ODP_RATING)
      : 0,
  COOLING_EFFICIENCY:
    typeof process.env.PRODUCT_COOLING_EFFICIENCY !== 'undefined'
      ? parseInt(process.env.PRODUCT_COOLING_EFFICIENCY)
      : 97,
  NOISE_LEVEL:
    typeof process.env.PRODUCT_NOISE_LEVEL !== 'undefined'
      ? parseInt(process.env.PRODUCT_NOISE_LEVEL)
      : 18,
} as const

// Cart and shipping configuration
export const CART_CONFIG = {
  FREE_SHIPPING_THRESHOLD: parseFloat(clientEnv.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD),
  TAX_RATE: parseFloat(clientEnv.NEXT_PUBLIC_TAX_RATE),
  MAX_QUANTITY_PER_ITEM: parseInt(clientEnv.NEXT_PUBLIC_MAX_QUANTITY_PER_ITEM),
  LOW_STOCK_THRESHOLD: parseInt(clientEnv.NEXT_PUBLIC_LOW_STOCK_THRESHOLD),
} as const
