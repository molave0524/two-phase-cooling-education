/**
 * Rate Limiting Utility
 * Supports both in-memory (development) and Upstash Redis (production)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory store for development
const inMemoryStore = new Map<string, { count: number; reset: number }>()

// Initialize Upstash Redis client if credentials are available
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  // Create rate limiter with sliding window algorithm
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
    analytics: true,
    prefix: 'ratelimit',
  })

  console.log('✓ Rate limiting: Using Upstash Redis')
} else {
  console.warn('⚠ Rate limiting: Using in-memory store (development only)')
}

/**
 * In-memory rate limiter for development
 */
function checkRateLimitInMemory(
  identifier: string,
  limit: number = 10,
  windowMs: number = 10000
): { success: boolean; limit: number; remaining: number; reset: Date } {
  const now = Date.now()
  const key = identifier

  // Clean up expired entries
  const entries = Array.from(inMemoryStore.entries())
  for (const [k, v] of entries) {
    if (v.reset < now) {
      inMemoryStore.delete(k)
    }
  }

  const entry = inMemoryStore.get(key)

  if (!entry || entry.reset < now) {
    // First request or window expired
    inMemoryStore.set(key, {
      count: 1,
      reset: now + windowMs,
    })

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(now + windowMs),
    }
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(entry.reset),
    }
  }

  // Increment count
  entry.count++
  inMemoryStore.set(key, entry)

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: new Date(entry.reset),
  }
}

/**
 * Check rate limit for an identifier (IP address, user ID, etc.)
 */
export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  if (ratelimit) {
    // Use Upstash Redis in production
    try {
      const result = await ratelimit.limit(identifier)

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
      }
    } catch (error) {
      console.error('[Rate Limit] Upstash error, falling back to in-memory:', error)
      return checkRateLimitInMemory(identifier)
    }
  }

  // Use in-memory store for development
  return checkRateLimitInMemory(identifier)
}

/**
 * Create a custom rate limiter with specific limits
 */
export function createRateLimiter(options: {
  requests: number
  window: '10 s' | '1 m' | '1 h' // Restrict to valid duration strings
}) {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(options.requests, options.window),
      analytics: true,
      prefix: 'ratelimit',
    })
  }

  // Return in-memory rate limiter
  const windowMs =
    options.window === '10 s'
      ? 10000
      : options.window === '1 m'
        ? 60000
        : options.window === '1 h'
          ? 3600000
          : 10000

  return {
    limit: async (identifier: string) => {
      const result = checkRateLimitInMemory(identifier, options.requests, windowMs)
      return result
    },
  }
}

/**
 * Get IP address from request
 */
export function getIPAddress(request: Request): string {
  // Try various headers for IP address (in order of reliability)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]
    return ip ? ip.trim() : 'unknown'
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  // Fallback to a default identifier
  return 'unknown'
}
