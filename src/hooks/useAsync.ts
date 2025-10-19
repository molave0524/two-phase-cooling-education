/**
 * useAsync Hook
 * Manages async operations with loading, error, and data states
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * State interface for async operations
 */
export interface AsyncState<T> {
  /** Loading state */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Data returned from async operation */
  data: T | null
}

/**
 * Options for useAsync hook
 */
export interface UseAsyncOptions {
  /** Execute immediately on mount (default: true) */
  immediate?: boolean
  /** Dependencies to trigger re-execution */
  deps?: React.DependencyList
}

/**
 * Hook for managing async operations with automatic loading, error, and data states
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, loading, error, execute } = useAsync(
 *     async () => {
 *       const response = await fetch(`/api/users/${userId}`)
 *       return response.json()
 *     },
 *     { deps: [userId] }
 *   )
 *
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!data) return null
 *
 *   return <div>{data.name}</div>
 * }
 * ```
 */
export function useAsync<T>(asyncFunction: () => Promise<T>, options: UseAsyncOptions = {}) {
  const { immediate = true, deps = [] } = options

  const [state, setState] = useState<AsyncState<T>>({
    loading: immediate,
    error: null,
    data: null,
  })

  // Track mounted state to prevent state updates on unmounted component
  const isMountedRef = useRef(true)

  // Track the latest async function to prevent stale executions
  const asyncFunctionRef = useRef(asyncFunction)
  asyncFunctionRef.current = asyncFunction

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await asyncFunctionRef.current()

      if (isMountedRef.current) {
        setState({ loading: false, error: null, data })
      }

      return data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      if (isMountedRef.current) {
        setState({ loading: false, error: err, data: null })
      }

      throw err
    }
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    ...state,
    execute,
  }
}

/**
 * Hook for async functions that need to be triggered manually
 * Similar to useAsync but doesn't execute immediately
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { execute: login, loading, error } = useAsyncFn(async (credentials) => {
 *     const response = await fetch('/api/login', {
 *       method: 'POST',
 *       body: JSON.stringify(credentials)
 *     })
 *     return response.json()
 *   })
 *
 *   return (
 *     <form onSubmit={async (e) => {
 *       e.preventDefault()
 *       await login({ username, password })
 *     }}>
 *       <button disabled={loading}>
 *         {loading ? 'Logging in...' : 'Login'}
 *       </button>
 *       {error && <div>{error.message}</div>}
 *     </form>
 *   )
 * }
 * ```
 */
export function useAsyncFn<TArgs extends any[], TResult>(
  asyncFunction: (...args: TArgs) => Promise<TResult>
) {
  const [state, setState] = useState<AsyncState<TResult>>({
    loading: false,
    error: null,
    data: null,
  })

  // Track mounted state
  const isMountedRef = useRef(true)

  const execute = useCallback(
    async (...args: TArgs) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const data = await asyncFunction(...args)

        if (isMountedRef.current) {
          setState({ loading: false, error: null, data })
        }

        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        if (isMountedRef.current) {
          setState({ loading: false, error: err, data: null })
        }

        throw err
      }
    },
    [asyncFunction]
  )

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    ...state,
    execute,
  }
}

/**
 * Hook for managing async retry operations with the retry utility
 *
 * @example
 * ```tsx
 * function DataFetcher() {
 *   const { data, loading, error, execute } = useAsyncRetry(
 *     async () => {
 *       const response = await fetch('/api/data')
 *       return response.json()
 *     },
 *     {
 *       maxRetries: 3,
 *       initialDelay: 1000
 *     }
 *   )
 *
 *   return (
 *     <div>
 *       {loading && <div>Loading...</div>}
 *       {error && (
 *         <div>
 *           Error: {error.message}
 *           <button onClick={execute}>Retry</button>
 *         </div>
 *       )}
 *       {data && <div>{JSON.stringify(data)}</div>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAsyncRetry<T>(
  asyncFunction: () => Promise<T>,
  retryOptions?: {
    maxRetries?: number
    initialDelay?: number
    immediate?: boolean
    deps?: React.DependencyList
  }
) {
  const { immediate = true, deps = [], ...retryConfig } = retryOptions || {}

  const [retryCount, setRetryCount] = useState(0)

  const wrappedFunction = useCallback(async () => {
    // Import retry dynamically to avoid circular dependency
    const { retry } = await import('@/lib/retry')

    return retry(asyncFunction, {
      ...retryConfig,
      onRetry: (_error, attempt, _delay) => {
        setRetryCount(attempt + 1)
      },
    })
  }, [asyncFunction, retryConfig])

  const result = useAsync(wrappedFunction, { immediate, deps })

  return {
    ...result,
    retryCount,
  }
}
