/**
 * Environment Variable Validation
 * Validates all environment variables at application startup using Zod
 * This ensures type safety and prevents runtime errors from missing or invalid env vars
 *
 * IMPORTANT: After changing .env.local, restart the Next.js dev server for changes to take effect
 */

import { z } from 'zod'

// Server-side environment variables schema
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  DATABASE_POOL_MIN: z.string().optional(),
  DATABASE_POOL_MAX: z.string().optional(),

  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORGANIZATION_ID: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4'),
  AI_MAX_TOKENS: z.string().default('1500'),
  AI_TEMPERATURE: z.string().default('0.7'),

  // AWS Services
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  CDN_BASE_URL: z.string().url().optional(),
  CDN_DISTRIBUTION_ID: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_BUCKET_REGION: z.string().optional(),

  // Stripe (server-side keys)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),

  // Email Configuration
  EMAIL_PROVIDER: z.enum(['console', 'ses', 'sendgrid']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USERNAME: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().optional(),

  // Shipping Providers
  UPS_ACCOUNT_NUMBER: z.string().optional(),
  UPS_ACCESS_KEY: z.string().optional(),
  UPS_USERNAME: z.string().optional(),
  UPS_PASSWORD: z.string().optional(),
  UPS_API_BASE_URL: z.string().url().optional(),

  FEDEX_ACCOUNT_NUMBER: z.string().optional(),
  FEDEX_METER_NUMBER: z.string().optional(),
  FEDEX_KEY: z.string().optional(),
  FEDEX_PASSWORD: z.string().optional(),
  FEDEX_API_BASE_URL: z.string().url().optional(),

  // Monitoring
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Security
  JWT_SECRET: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),

  // Product Configuration (server-side)
  PRODUCT_PRO_PRICE: z.string().default('1299.99'),
  PRODUCT_COMPACT_PRICE: z.string().default('899.99'),
  PRODUCT_GWP_RATING: z.string().default('20'),
  PRODUCT_ODP_RATING: z.string().default('0'),
  PRODUCT_COOLING_EFFICIENCY: z.string().default('97'),
  PRODUCT_NOISE_LEVEL: z.string().default('18'),

  // Maintenance
  MAINTENANCE_MODE: z.string().default('false'),
  MAINTENANCE_MESSAGE: z.string().optional(),
})

// Client-side environment variables schema (NEXT_PUBLIC_* variables)
// NOTE: Next.js inlines these at BUILD TIME. Restart dev server after .env changes!
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),

  // Stripe public key
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Company Information
  NEXT_PUBLIC_COMPANY_NAME: z.string().optional().default('Two-Phase Cooling Technologies'),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().email().optional().default('info@thermaledcenter.com'),
  NEXT_PUBLIC_CONTACT_PHONE: z.string().optional().default('+1 (555) 123-4567'),
  NEXT_PUBLIC_DOMAIN: z.string().optional().default('thermaledcenter.com'),

  // Social Media
  NEXT_PUBLIC_TWITTER_HANDLE: z.string().optional().default('@TwoPhaseCooling'),
  NEXT_PUBLIC_YOUTUBE_HANDLE: z.string().optional().default('thermaledcenter'),

  // Product Configuration
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().optional().default('USD'),
  NEXT_PUBLIC_IMAGE_PLACEHOLDER_SERVICE: z
    .string()
    .url()
    .optional()
    .default('https://picsum.photos'),
  NEXT_PUBLIC_PRODUCT_IMAGE_CDN: z.string().url().optional(),

  // Cart Configuration
  NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD: z.string().optional().default('500'),
  NEXT_PUBLIC_TAX_RATE: z.string().optional().default('0.08'),
  NEXT_PUBLIC_MAX_QUANTITY_PER_ITEM: z.string().optional().default('10'),
  NEXT_PUBLIC_LOW_STOCK_THRESHOLD: z.string().optional().default('5'),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_AI_ASSISTANT: z.string().optional().default('true'),
  NEXT_PUBLIC_ENABLE_ECOMMERCE: z.string().optional().default('true'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().optional().default('true'),
  NEXT_PUBLIC_ENABLE_VIDEO_STREAMING: z.string().optional().default('true'),
  NEXT_PUBLIC_ENABLE_ADVANCED_METRICS: z.string().optional().default('false'),
  NEXT_PUBLIC_ENABLE_SOCIAL_FEATURES: z.string().optional().default('false'),

  // Monitoring
  NEXT_PUBLIC_ENABLE_MONITORING: z.string().optional().default('true'),

  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_PIXEL_ID: z.string().optional(),

  // Performance
  NEXT_PUBLIC_IMAGE_QUALITY: z.string().optional().default('85'),
  NEXT_PUBLIC_IMAGE_FORMATS: z.string().optional().default('avif,webp'),
})

/**
 * Validates and parses server-side environment variables
 * Only use this on the server side (API routes, server components, etc.)
 */
export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid server environment variables')
  }

  return parsed.data
}

/**
 * Validates and parses client-side environment variables
 * Safe to use on both client and server
 */
export function getClientEnv() {
  const parsed = clientEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors)

    // In development, provide more helpful error messages
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  HINT: After changing .env.local, restart your Next.js dev server!')
      console.warn('⚠️  Run: Stop the server (Ctrl+C) and run "npm run dev" again')
    }

    throw new Error('Invalid client environment variables')
  }

  return parsed.data
}

/**
 * Type-safe environment variables for server-side usage
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Type-safe environment variables for client-side usage
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>

// Pre-validate client env on module load (runs on both server and client)
// Use lenient error handling to avoid hydration issues
let clientEnv: ClientEnv

try {
  clientEnv = getClientEnv()
} catch (error) {
  console.error('Failed to validate client environment variables:', error)

  // In production, we must throw
  if (process.env.NODE_ENV === 'production') {
    throw error
  }

  // In development, provide defaults to prevent hydration errors
  // This allows the app to run while you fix env issues
  console.warn('⚠️  Using fallback defaults for client env variables')
  clientEnv = clientEnvSchema.parse({})
}

// Export validated client env for direct access
export { clientEnv }

// Helper function to check if we're on the server
export const isServer = typeof window === 'undefined'

// Server env is only validated on demand (to avoid client-side errors)
let serverEnvCache: ServerEnv | null = null

export function getValidatedServerEnv(): ServerEnv {
  if (!isServer) {
    throw new Error('getValidatedServerEnv() can only be called on the server')
  }

  if (!serverEnvCache) {
    serverEnvCache = getServerEnv()
  }

  return serverEnvCache
}
