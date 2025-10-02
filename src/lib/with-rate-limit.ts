/**
 * Rate Limiting Middleware Wrapper
 * Apply rate limiting to API routes
 */

import { NextResponse, NextRequest } from 'next/server'
import { checkRateLimit, getIPAddress } from './rate-limit'
import { logger } from './logger'

export interface RateLimitConfig {
  /**
   * Unique identifier for this rate limit
   * Used as part of the cache key
   */
  id: string

  /**
   * Custom identifier function (defaults to IP address)
   */
  getIdentifier?: (request: Request | NextRequest) => string
}

/**
 * Wrap an API route handler with rate limiting
 *
 * @example
 * ```ts
 * export const POST = withRateLimit(
 *   { id: 'checkout' },
 *   async (request) => {
 *     // Your handler code
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function withRateLimit<
  T extends (request: Request | NextRequest, ...args: unknown[]) => Promise<Response>,
>(config: RateLimitConfig, handler: T): T {
  return (async (request: Request | NextRequest, ...args: unknown[]) => {
    try {
      // Get identifier (IP address by default)
      const identifier = config.getIdentifier
        ? config.getIdentifier(request)
        : getIPAddress(request)

      // Create unique key combining route ID and identifier
      const rateLimitKey = `${config.id}:${identifier}`

      // Check rate limit
      const { success, limit, remaining, reset } = await checkRateLimit(rateLimitKey)

      if (!success) {
        // Rate limit exceeded
        logger.warn('Rate limit exceeded', {
          routeId: config.id,
          identifier,
          resetTime: reset.toISOString(),
        })

        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again after ${reset.toISOString()}`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toISOString(),
              'Retry-After': Math.ceil((reset.getTime() - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      // Add rate limit headers to successful response
      const response = await handler(request, ...args)

      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toISOString())

      return response
    } catch (error) {
      logger.error('Rate limit middleware error, allowing request through', {
        routeId: config.id,
        error,
      })
      // On error, allow the request through (fail open)
      return handler(request, ...args)
    }
  }) as T
}
