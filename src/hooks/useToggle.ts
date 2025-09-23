import { useState, useCallback } from 'react'

/**
 * Custom hook for boolean toggle state management
 * Useful for modals, dropdowns, visibility states, etc.
 */
export function useToggle(initialValue: boolean = false): [
  boolean,
  {
    toggle: () => void
    setTrue: () => void
    setFalse: () => void
    setValue: (value: boolean) => void
  },
] {
  const [value, setValue] = useState<boolean>(initialValue)

  const toggle = useCallback(() => setValue(prev => !prev), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [
    value,
    {
      toggle,
      setTrue,
      setFalse,
      setValue,
    },
  ]
}
