/**
 * API Retry Logic Utility
 * Provides automatic retry with exponential backoff for transient failures
 */

import { logger } from '@/lib/logger'

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 1000ms) */
  initialDelay?: number
  /** Maximum delay in milliseconds (default: 10000ms) */
  maxDelay?: number
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number
  /** Whether to add jitter to reduce thundering herd (default: true) */
  useJitter?: boolean
  /** Timeout for each attempt in milliseconds (default: 30000ms) */
  timeout?: number
  /** Custom function to determine if error is retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean
  /** Callback fired before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void
  /** AbortSignal to cancel the operation */
  signal?: AbortSignal
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'signal' | 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  useJitter: true,
  timeout: 30000,
}

/**
 * Default function to determine if an error should trigger a retry
 */
function defaultShouldRetry(error: Error, attempt: number): boolean {
  // Don't retry if we've exceeded max attempts
  if (attempt >= DEFAULT_RETRY_OPTIONS.maxRetries) {
    return false
  }

  // Retry on network errors
  if (
    error.name === 'TypeError' &&
    (error.message.includes('fetch') || error.message.includes('network'))
  ) {
    return true
  }

  // Retry on timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return true
  }

  // If it's a Response object error, check status code
  if ('status' in error && typeof (error as any).status === 'number') {
    const status = (error as any).status

    // Retry on 5xx server errors and 429 (rate limit)
    if (status >= 500 || status === 429) {
      return true
    }

    // Don't retry on 4xx client errors (except 429)
    if (status >= 400 && status < 500) {
      return false
    }
  }

  // Don't retry by default for unknown errors
  return false
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  useJitter: boolean
): number {
  // Calculate exponential backoff
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt)

  // Cap at max delay
  delay = Math.min(delay, maxDelay)

  // Add jitter to prevent thundering herd
  if (useJitter) {
    // Add random jitter of ±25%
    const jitterRange = delay * 0.25
    const jitter = Math.random() * jitterRange * 2 - jitterRange
    delay = delay + jitter
  }

  return Math.floor(delay)
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timeout = setTimeout(resolve, ms)

    // Listen for abort signal
    const onAbort = () => {
      clearTimeout(timeout)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    // Clean up listener when sleep completes
    setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
    }, ms)
  })
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```ts
 * const data = await retry(
 *   async () => {
 *     const response = await fetch('/api/data')
 *     if (!response.ok) throw new Error('Request failed')
 *     return response.json()
 *   },
 *   { maxRetries: 3, initialDelay: 1000 }
 * )
 * ```
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const config = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  }

  let lastError: Error

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Check if operation was aborted
      if (options.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      // Execute the function with timeout
      if (config.timeout > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Operation timed out after ${config.timeout}ms`))
          }, config.timeout)
        })

        return await Promise.race([fn(), timeoutPromise])
      }

      // Execute without timeout
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(lastError, attempt)
        : defaultShouldRetry(lastError, attempt)

      // If this is the last attempt or we shouldn't retry, throw the error
      if (attempt >= config.maxRetries || !shouldRetry) {
        logger.error('Retry failed after all attempts', lastError, {
          attempts: attempt + 1,
          maxRetries: config.maxRetries,
        })
        throw lastError
      }

      // Calculate delay before next attempt
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier,
        config.useJitter
      )

      // Log retry attempt
      logger.warn('Retrying after failure', {
        error: lastError.message,
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        delay,
      })

      // Call onRetry callback if provided
      options.onRetry?.(lastError, attempt, delay)

      // Wait before retrying
      await sleep(delay, options.signal)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!
}

/**
 * Retry a fetch request with exponential backoff
 *
 * @example
 * ```ts
 * const response = await retryFetch('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ foo: 'bar' })
 * }, {
 *   maxRetries: 3
 * })
 * ```
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(url, init)

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

/**
 * Create a retryable version of a function
 *
 * @example
 * ```ts
 * const fetchUserData = retryable(
 *   async (userId: string) => {
 *     const response = await fetch(`/api/users/${userId}`)
 *     return response.json()
 *   },
 *   { maxRetries: 3 }
 * )
 *
 * const user = await fetchUserData('123')
 * ```
 */
export function retryable<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: RetryOptions
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retry(() => fn(...args), options)
}
