'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang='en'>
      <body className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100'>
        <div className='text-center space-y-6 p-8'>
          <div className='space-y-4'>
            <h1 className='text-6xl font-bold text-red-600'>Oops!</h1>
            <h2 className='text-2xl font-semibold text-secondary-900'>Something went wrong</h2>
            <p className='text-secondary-600 max-w-md mx-auto'>
              An unexpected error occurred. Our team has been notified.
            </p>
          </div>

          <div className='space-y-4'>
            <button onClick={() => reset()} className='btn btn-primary'>
              Try again
            </button>

            <div className='text-sm text-secondary-500'>
              <a href='/' className='text-primary-600 hover:text-primary-700 underline'>
                Go to Homepage
              </a>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className='mt-8 text-left bg-red-100 p-4 rounded border'>
              <summary className='cursor-pointer font-medium text-red-800'>
                Error Details (Development Only)
              </summary>
              <pre className='mt-2 text-sm text-red-700 whitespace-pre-wrap'>
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  )
}
