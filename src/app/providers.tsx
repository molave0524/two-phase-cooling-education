'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ProgressStore, createProgressStore } from '@/lib/stores/progress-store'
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor'
import { AIServiceAdapter, createAIServiceAdapter } from '@/lib/ai/ai-service-adapter'

// ============================================================================
// CONTEXT DEFINITIONS
// ============================================================================

// Progress tracking context for user learning progress
interface ProgressContextType {
  store: ProgressStore | null
}

const ProgressContext = createContext<ProgressContextType>({ store: null })

// Performance monitoring context for real-time system health
interface PerformanceContextType {
  monitor: PerformanceMonitor | null
  healthStatus: {
    status: string
    score: number
    alerts: number
  } | null
}

const PerformanceContext = createContext<PerformanceContextType>({
  monitor: null,
  healthStatus: null
})

// AI service context for assistant functionality
interface AIContextType {
  aiService: AIServiceAdapter | null
  isAvailable: boolean
  fallbackMode: boolean
}

const AIContext = createContext<AIContextType>({
  aiService: null,
  isAvailable: false,
  fallbackMode: false
})

// Theme context for dark mode and user preferences
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light'
})

// ============================================================================
// PROGRESS PROVIDER
// ============================================================================

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<ProgressStore | null>(null)

  useEffect(() => {
    // Initialize progress store on client side
    const progressStore = createProgressStore()
    setStore(progressStore)

    // Cleanup on unmount
    return () => {
      // Clean up any subscriptions or resources
    }
  }, [])

  return (
    <ProgressContext.Provider value={{ store }}>
      {children}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => {
  const context = useContext(ProgressContext)
  if (!context.store) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context.store
}

// ============================================================================
// PERFORMANCE PROVIDER
// ============================================================================

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [monitor, setMonitor] = useState<PerformanceMonitor | null>(null)
  const [healthStatus, setHealthStatus] = useState<{
    status: string
    score: number
    alerts: number
  } | null>(null)

  useEffect(() => {
    // Initialize performance monitor only in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true') {
      const performanceMonitor = new PerformanceMonitor()
      setMonitor(performanceMonitor)

      // Start monitoring with 30-second intervals
      performanceMonitor.startMonitoring(30000)

      // Update health status every minute
      const healthInterval = setInterval(() => {
        const health = performanceMonitor.getHealthSummary()
        setHealthStatus(health)
      }, 60000)

      // Initial health check
      setTimeout(() => {
        const health = performanceMonitor.getHealthSummary()
        setHealthStatus(health)
      }, 1000)

      // Cleanup on unmount
      return () => {
        performanceMonitor.stopMonitoring()
        clearInterval(healthInterval)
      }
    }
  }, [])

  return (
    <PerformanceContext.Provider value={{ monitor, healthStatus }}>
      {children}
    </PerformanceContext.Provider>
  )
}

export const usePerformance = () => {
  const context = useContext(PerformanceContext)
  return context
}

// ============================================================================
// AI SERVICE PROVIDER
// ============================================================================

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [aiService, setAIService] = useState<AIServiceAdapter | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [fallbackMode, setFallbackMode] = useState(false)

  useEffect(() => {
    // Initialize AI service adapter
    try {
      const service = createAIServiceAdapter()
      setAIService(service)

      // Test AI service availability
      const testAvailability = async () => {
        try {
          // Simple health check - attempt to get a basic response
          await service.getCoolingAdvice('test availability')
          setIsAvailable(true)
          setFallbackMode(false)
        } catch (error) {
          console.warn('AI service unavailable, switching to fallback mode:', error)
          setIsAvailable(false)
          setFallbackMode(true)
        }
      }

      testAvailability()

      // Monitor circuit breaker state changes
      const circuitBreakerInterval = setInterval(() => {
        const state = service.getState()
        setFallbackMode(state === 'OPEN')
        setIsAvailable(state === 'CLOSED')
      }, 30000) // Check every 30 seconds

      // Cleanup on unmount
      return () => {
        clearInterval(circuitBreakerInterval)
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error)
      setIsAvailable(false)
      setFallbackMode(true)
    }
  }, [])

  return (
    <AIContext.Provider value={{ aiService, isAvailable, fallbackMode }}>
      {children}
    </AIContext.Provider>
  )
}

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context.aiService) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}

// ============================================================================
// THEME PROVIDER
// ============================================================================

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Set theme and persist to localStorage
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // Apply theme to document
  const applyTheme = (themeValue: 'light' | 'dark' | 'system') => {
    const root = document.documentElement

    if (themeValue === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
      setResolvedTheme(systemTheme)
    } else {
      root.classList.toggle('dark', themeValue === 'dark')
      setResolvedTheme(themeValue)
    }
  }

  // Initialize theme on mount
  useEffect(() => {
    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const initialTheme = savedTheme || 'system'

    setThemeState(initialTheme)
    applyTheme(initialTheme)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  return context
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (e.g., Sentry, LogRocket)
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-secondary-50">
            <div className="max-w-md mx-auto text-center p-6">
              <div className="text-danger-500 text-4xl mb-4">⚠️</div>
              <h1 className="text-xl font-semibold text-secondary-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-secondary-600 mb-4">
                We apologize for the inconvenience. The page has encountered an error.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Reload Page
              </button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-secondary-500">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-danger-600 bg-danger-50 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// ============================================================================
// MAIN PROVIDERS COMPONENT
// ============================================================================

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PerformanceProvider>
          <AIProvider>
            <ProgressProvider>
              {children}
            </ProgressProvider>
          </AIProvider>
        </PerformanceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

// ============================================================================
// HOOK FOR COMBINED CONTEXT ACCESS
// ============================================================================

// Convenience hook for accessing multiple contexts
export const useAppContext = () => {
  const progress = useProgress()
  const performance = usePerformance()
  const ai = useAI()
  const theme = useTheme()

  return {
    progress,
    performance,
    ai,
    theme,
  }
}