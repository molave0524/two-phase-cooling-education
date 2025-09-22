'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

// ============================================================================
// DEMO MODE PROVIDERS - Simplified for deployment
// ============================================================================

// Mock progress context for demo mode
const ProgressContext = createContext({
  updateProgress: () => {},
  getProgress: () => ({ percentage: 0, completed: false })
})

// Mock AI context for demo mode
const AIContext = createContext({
  sendMessage: async (message: string) => "This is a demo response. In production, this would connect to our AI assistant with full thermal dynamics knowledge.",
  isLoading: false
})

export const useProgress = () => useContext(ProgressContext)
export const useAI = () => useContext(AIContext)

// ============================================================================
// PROVIDERS COMPONENT
// ============================================================================

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-secondary-800)',
            color: 'var(--color-secondary-100)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-secondary-700)',
            fontSize: 'var(--text-sm)',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-green-500)',
              secondary: 'var(--color-secondary-100)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-red-500)',
              secondary: 'var(--color-secondary-100)',
            },
          },
        }}
      />
    </>
  )
}