import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it('should return initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  it('should return stored value when it exists', () => {
    mockLocalStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(result.current[0]).toBe('stored-value')
  })

  it('should update localStorage when value is set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(result.current[0]).toBe('new-value')
    expect(mockLocalStorage.getItem('test-key')).toBe('"new-value"')
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 5))

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(6)
    expect(mockLocalStorage.getItem('test-key')).toBe('6')
  })

  it('should handle complex objects', () => {
    const initialObject = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('test-object', initialObject))

    act(() => {
      result.current[1]({ name: 'updated', count: 5 })
    })

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 })
  })

  it('should handle invalid JSON gracefully', () => {
    mockLocalStorage.setItem('test-key', 'invalid-json')

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))

    expect(result.current[0]).toBe('fallback')
  })
})
