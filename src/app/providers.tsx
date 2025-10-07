'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ============================================================================
// DEMO MODE PROVIDERS - Simplified for deployment
// ============================================================================

// Mock progress context for demo mode
const ProgressContext = createContext({
  updateProgress: () => {},
  getProgress: () => ({ percentage: 0, completed: false }),
})

// Mock AI context for demo mode
const AIContext = createContext({
  sendMessage: async (_message: string) =>
    'This is a demo response. In production, this would connect to our AI assistant with full thermal dynamics knowledge.',
  isLoading: false,
})

export const useProgress = () => useContext(ProgressContext)
export const useAI = () => useContext(AIContext)

// ============================================================================
// PROVIDERS COMPONENT
// ============================================================================

// Create a client outside the component to ensure it's stable across renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // Consider data fresh for 5 seconds
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Retry failed requests once
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster
          position='bottom-right'
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-secondary-800)',
              color: 'var(--color-secondary-100)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-secondary-700)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
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
      </SessionProvider>
    </QueryClientProvider>
  )
}
