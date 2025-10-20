/**
 * Default Configuration Values
 * Centralized fallback values for environment variables and configuration
 * Prevents hardcoded strings scattered throughout the codebase
 */

/**
 * Default URLs and Endpoints
 * Provide fallback values when environment variables are not set
 */
export const DEFAULTS = {
  // Application URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  VIDEO_API_URL: process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:3001',

  // Database - No fallback for security
  // Environment variable DATABASE_URL or POSTGRES_URL must be set
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',

  // Image Services
  IMAGE_PLACEHOLDER_SERVICE:
    process.env.NEXT_PUBLIC_IMAGE_PLACEHOLDER_SERVICE || 'https://images.unsplash.com',
} as const

/**
 * Company Contact Information (Internal Defaults)
 * Used for email configurations and internal services
 */
export const COMPANY_CONTACTS = {
  CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@twophasecooling.com',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@twophasecooling.com',
} as const

/**
 * SEO & Schema.org
 * Used for structured data and meta tags
 */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://twophasecooling.com'

export const SEO = {
  SCHEMA_CONTEXT: 'https://schema.org',
  SITE_URL: BASE_URL,
  LOGO_URL: `${BASE_URL}/images/logo.png`,
  OG_IMAGE_URL: `${BASE_URL}/images/hero-og.jpg`,
  PRODUCT_IMAGE_MAIN: `${BASE_URL}/images/product-main.jpg`,
  PRODUCT_IMAGE_SIDE: `${BASE_URL}/images/product-side.jpg`,
  PRODUCT_IMAGE_INTERNAL: `${BASE_URL}/images/product-internal.jpg`,
  PRODUCTS_URL: `${BASE_URL}/products`,
} as const

/**
 * Social Media Links
 * Company social media profiles
 */
export const SOCIAL_LINKS = {
  YOUTUBE: 'https://youtube.com/@twophasecooling',
  TWITTER: 'https://twitter.com/twophasecooling',
  LINKEDIN: 'https://linkedin.com/company/twophasecooling',
} as const

/**
 * Environment Checks
 */
export const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  IS_SERVER: typeof window === 'undefined',
  IS_CLIENT: typeof window !== 'undefined',
} as const

/**
 * Cache Configuration (in seconds)
 */
export const CACHE_TTL = {
  STATIC_ASSETS: 86400, // 24 hours
  API_RESPONSES: 300, // 5 minutes
  PRODUCT_CATALOG: 3600, // 1 hour
  USER_SESSION: 900, // 15 minutes
} as const

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMIT = {
  WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
} as const

/**
 * Shipping Configuration
 * Centralized shipping rates, fees, and thresholds
 */
export const SHIPPING = {
  // Free shipping threshold
  FREE_SHIPPING_THRESHOLD: 500, // USD - Free shipping on orders over this amount

  // Standard shipping rates by state (USD)
  STANDARD_RATES: {
    CA: 49.99,
    NY: 59.99,
    TX: 54.99,
    FL: 52.99,
    WA: 51.99,
    DEFAULT: 59.99, // Default for states not listed above
  },

  // Expedited shipping methods (USD)
  EXPEDITED_2_3_DAY: 149.99,
  OVERNIGHT: 299.99,

  // Base rate calculation (for src/lib/shipping.ts)
  BASE_FEE: 25, // Base shipping fee in USD
  WEIGHT_MULTIPLIER: 1.2, // Cost per pound of weight
  MAX_COST: 500, // Maximum shipping cost in USD

  // Service multipliers (for calculating rates from base rate)
  SERVICE_MULTIPLIERS: {
    UPS_GROUND: 0.8,
    UPS_2ND_DAY: 2.5,
    UPS_NEXT_DAY: 4.0,
    FEDEX_GROUND: 0.85,
    FEDEX_EXPRESS: 2.2,
    FEDEX_PRIORITY: 3.8,
  },
} as const
