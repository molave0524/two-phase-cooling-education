/**
 * CSRF-Protected API Client
 * Automatically includes CSRF tokens in API requests
 * With optional retry logic for transient failures
 */

import { logger } from '@/lib/logger'
import { retry, type RetryOptions } from '@/lib/retry'

// Cache for CSRF token
let csrfToken: string | null = null

/**
 * Fetch CSRF token from server
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken

  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }

    const result = await response.json()

    // Handle standardized API response format
    if (!result.success || !result.data) {
      throw new Error('CSRF token not found in response')
    }

    const token = result.data.token as string
    if (!token) {
      throw new Error('CSRF token not found in response')
    }
    csrfToken = token
    return token
  } catch (error) {
    logger.error('Failed to get CSRF token', error)
    throw error
  }
}

/**
 * Fetch wrapper with automatic CSRF protection
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET'

  // For state-changing methods, include CSRF token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const token = await getCsrfToken()

      options.headers = {
        ...options.headers,
        'x-csrf-token': token,
      }
    } catch (error) {
      logger.error('Failed to add CSRF token to request', error, { method, url })
    }
  }

  // Always include credentials for cookie handling
  options.credentials = 'include'

  return fetch(url, options)
}

/**
 * Clear cached CSRF token (useful after logout or token expiry)
 */
export function clearCsrfToken() {
  csrfToken = null
}

/**
 * Fetch wrapper with automatic CSRF protection and retry logic
 *
 * @example
 * ```ts
 * const response = await apiFetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ foo: 'bar' })
 * }, {
 *   maxRetries: 3,
 *   initialDelay: 1000
 * })
 * ```
 */
export async function apiFetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions?: RetryOptions
): Promise<Response> {
  return retry(async () => {
    const response = await apiFetch(url, options)

    // Check if response indicates a retryable error
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as any).status = response.status
      ;(error as any).statusText = response.statusText
      throw error
    }

    return response
  }, retryOptions)
}
