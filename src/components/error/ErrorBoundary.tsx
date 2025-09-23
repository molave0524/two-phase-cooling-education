'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className='min-h-[400px] flex items-center justify-center p-8'>
          <div className='text-center max-w-md mx-auto'>
            <div className='w-16 h-16 mx-auto mb-4 text-danger-500'>
              <ExclamationTriangleIcon />
            </div>

            <h2 className='text-xl font-semibold text-secondary-900 mb-2'>Something went wrong</h2>

            <p className='text-secondary-600 mb-6'>
              We encountered an unexpected error. Please try refreshing the page or contact support
              if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='text-left mb-6 p-4 bg-secondary-50 rounded-technical text-sm'>
                <summary className='cursor-pointer font-medium text-secondary-700 mb-2'>
                  Error Details (Development Only)
                </summary>
                <pre className='whitespace-pre-wrap text-danger-600 text-xs'>
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleRetry}
              className='btn-primary inline-flex items-center gap-2'
            >
              <ArrowPathIcon className='w-4 h-4' />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for function components that need error boundaries
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback} {...(onError && { onError })}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
