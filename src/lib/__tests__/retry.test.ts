/**
 * Unit tests for Retry Logic Utility
 * Tests retry behavior, exponential backoff, timeout handling, and error scenarios
 */

import { retry, retryFetch, retryable } from '../retry'

// Mock logger to suppress console output during tests
jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('retry()', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')

      const result = await retry(mockFn, { maxRetries: 3 })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success')

      const result = await retry(mockFn, {
        maxRetries: 3,
        initialDelay: 10,
        useJitter: false,
      })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(
        retry(mockFn, {
          maxRetries: 2,
          initialDelay: 10,
          useJitter: false,
        })
      ).rejects.toThrow('Persistent failure')

      expect(mockFn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })

    it('should respect custom shouldRetry function', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Do not retry'))

      await expect(
        retry(mockFn, {
          maxRetries: 3,
          initialDelay: 10,
          shouldRetry: error => {
            return !error.message.includes('Do not retry')
          },
        })
      ).rejects.toThrow('Do not retry')

      expect(mockFn).toHaveBeenCalledTimes(1) // No retries
    })

    it('should call onRetry callback', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn()

      await retry(mockFn, {
        maxRetries: 2,
        initialDelay: 10,
        useJitter: false,
        onRetry,
      })

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        0, // attempt number
        expect.any(Number) // delay
      )
    })

    it('should apply exponential backoff', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockResolvedValueOnce('success')

      const delays: number[] = []
      const onRetry = jest.fn((_error, _attempt, delay) => {
        delays.push(delay)
      })

      await retry(mockFn, {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        useJitter: false,
        onRetry,
      })

      // First delay: 100ms
      // Second delay: 100 * 2^1 = 200ms
      expect(delays[0]).toBe(100)
      expect(delays[1]).toBe(200)
    })

    it('should cap delay at maxDelay', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockResolvedValueOnce('success')

      const delays: number[] = []
      const onRetry = jest.fn((_error, _attempt, delay) => {
        delays.push(delay)
      })

      await retry(mockFn, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 1500,
        backoffMultiplier: 3,
        useJitter: false,
        onRetry,
      })

      // First delay: 1000ms
      // Second delay would be 3000ms, but capped at 1500ms
      expect(delays[0]).toBe(1000)
      expect(delays[1]).toBe(1500) // Capped
    })

    it('should handle timeout', async () => {
      const mockFn = jest.fn(() => new Promise(resolve => setTimeout(resolve, 5000)))

      await expect(
        retry(mockFn, {
          maxRetries: 0,
          timeout: 100,
        })
      ).rejects.toThrow('Operation timed out')

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should handle AbortSignal', async () => {
      const controller = new AbortController()
      const mockFn = jest.fn().mockResolvedValue('success')

      // Abort immediately
      controller.abort()

      await expect(
        retry(mockFn, {
          maxRetries: 3,
          signal: controller.signal,
        })
      ).rejects.toThrow('Aborted')

      expect(mockFn).not.toHaveBeenCalled()
    })

    it('should handle AbortSignal during retry delay', async () => {
      const controller = new AbortController()
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success')

      // Abort after first failure
      setTimeout(() => controller.abort(), 50)

      await expect(
        retry(mockFn, {
          maxRetries: 3,
          initialDelay: 200,
          signal: controller.signal,
        })
      ).rejects.toThrow('Aborted')

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('retryFetch()', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('should retry fetch on network error', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        })

      const response = await retryFetch('/api/test', {}, { maxRetries: 2, initialDelay: 10 })

      expect(response.ok).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should throw on non-retryable HTTP error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(
        retryFetch('/api/test', {}, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toThrow('HTTP 400')

      expect(global.fetch).toHaveBeenCalledTimes(1) // No retry for 4xx
    })

    it('should retry on 5xx server error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      await retryFetch('/api/test', {}, { maxRetries: 2, initialDelay: 10 })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on 429 rate limit', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: true,
        })

      await retryFetch('/api/test', {}, { maxRetries: 2, initialDelay: 10 })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('retryable()', () => {
    it('should create a retryable version of a function', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success')

      const retryableFn = retryable(mockFn, { maxRetries: 2, initialDelay: 10 })

      const result = await retryableFn()

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should pass arguments correctly', async () => {
      const mockFn = jest.fn((a: number, b: string) => Promise.resolve(`${a}-${b}`))

      const retryableFn = retryable(mockFn, { maxRetries: 2 })

      const result = await retryableFn(42, 'test')

      expect(result).toBe('42-test')
      expect(mockFn).toHaveBeenCalledWith(42, 'test')
    })
  })

  describe('Edge cases', () => {
    it('should handle maxRetries = 0', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Fail'))

      await expect(retry(mockFn, { maxRetries: 0, initialDelay: 10 })).rejects.toThrow('Fail')

      expect(mockFn).toHaveBeenCalledTimes(1) // No retries
    })

    it('should handle non-Error objects', async () => {
      const mockFn = jest.fn().mockRejectedValue('String error')

      await expect(retry(mockFn, { maxRetries: 1, initialDelay: 10 })).rejects.toThrow(
        'String error'
      )
    })

    it('should add jitter when enabled', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockResolvedValueOnce('success')

      const delays: number[] = []
      const onRetry = jest.fn((_error, _attempt, delay) => {
        delays.push(delay)
      })

      await retry(mockFn, {
        maxRetries: 3,
        initialDelay: 1000,
        useJitter: true, // Jitter enabled
        onRetry,
      })

      // With jitter, delays should vary slightly from base values
      // First delay should be around 1000ms ± 25%
      // Second delay should be around 2000ms ± 25%
      expect(delays[0]).toBeGreaterThan(750)
      expect(delays[0]).toBeLessThan(1250)
      expect(delays[1]).toBeGreaterThan(1500)
      expect(delays[1]).toBeLessThan(2500)
    })
  })
})
