/**
 * useTimeout Hook
 * Manages setTimeout with automatic cleanup
 */

import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook for managing setTimeout with automatic cleanup
 *
 * @example
 * ```tsx
 * function AutoSaveForm() {
 *   const [isDirty, setIsDirty] = useState(false)
 *
 *   const { start, clear } = useTimeout(() => {
 *     saveDraft()
 *     setIsDirty(false)
 *   }, 3000)
 *
 *   const handleChange = (e) => {
 *     setValue(e.target.value)
 *     setIsDirty(true)
 *     start() // Auto-save after 3 seconds of no changes
 *   }
 *
 *   return <input onChange={handleChange} />
 * }
 * ```
 */
export function useTimeout(callback: () => void, delay: number) {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const start = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current()
    }, delay)
  }, [delay])

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { start, clear }
}

/**
 * Hook for executing a callback after a delay (with automatic cleanup)
 *
 * @example
 * ```tsx
 * function NotificationToast() {
 *   const [visible, setVisible] = useState(true)
 *
 *   useTimeoutEffect(() => {
 *     setVisible(false)
 *   }, 5000)
 *
 *   if (!visible) return null
 *   return <div>Notification</div>
 * }
 * ```
 */
export function useTimeoutEffect(callback: () => void, delay: number | null) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    // Don't set timeout if delay is null
    if (delay === null) {
      return
    }

    const timeout = setTimeout(() => {
      callbackRef.current()
    }, delay)

    return () => {
      clearTimeout(timeout)
    }
  }, [delay])
}

/**
 * Hook for managing AbortController with automatic cleanup
 * Useful for canceling fetch requests when component unmounts
 *
 * @example
 * ```tsx
 * function DataFetcher() {
 *   const [data, setData] = useState(null)
 *   const { signal, abort } = useAbortController()
 *
 *   useEffect(() => {
 *     fetch('/api/data', { signal })
 *       .then(res => res.json())
 *       .then(setData)
 *       .catch(err => {
 *         if (err.name !== 'AbortError') {
 *           console.error(err)
 *         }
 *       })
 *   }, [signal])
 *
 *   return (
 *     <div>
 *       {data && <div>{JSON.stringify(data)}</div>}
 *       <button onClick={abort}>Cancel</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController>()

  if (!controllerRef.current) {
    controllerRef.current = new AbortController()
  }

  const abort = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = new AbortController()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    const controller = controllerRef.current
    return () => {
      controller?.abort()
    }
  }, [])

  return {
    signal: controllerRef.current.signal,
    abort,
  }
}
