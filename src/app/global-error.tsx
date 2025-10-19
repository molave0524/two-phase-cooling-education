'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

/**
 * Global Error Handler
 * This is the root error boundary that catches errors in the root layout
 * Must be a client component and must include its own <html> and <body> tags
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error - can't use our logger here as it may be broken
    // eslint-disable-next-line no-console
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang='en'>
      <body>
        <div className='min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-red-50 to-orange-50'>
          <div className='max-w-2xl w-full text-center'>
            {/* Error Icon */}
            <div className='mb-8 flex justify-center'>
              <div className='relative'>
                <ExclamationTriangleIcon className='w-24 h-24 text-red-600' />
                <div className='absolute inset-0 animate-ping'>
                  <ExclamationTriangleIcon className='w-24 h-24 text-red-600 opacity-20' />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Critical Application Error
            </h1>
            <p className='text-lg text-gray-600 mb-8 max-w-md mx-auto'>
              We encountered a critical error. Please try refreshing the page. If the problem
              persists, contact support.
            </p>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && (
              <div className='mb-8 p-4 bg-red-100 border border-red-300 rounded-lg text-left max-w-2xl mx-auto'>
                <p className='font-mono text-sm text-red-900 mb-2'>
                  <strong>Error:</strong> {error.message}
                </p>
                {error.digest && (
                  <p className='font-mono text-xs text-red-700'>
                    <strong>Digest:</strong> {error.digest}
                  </p>
                )}
                {error.stack && (
                  <details className='mt-3'>
                    <summary className='cursor-pointer text-sm font-semibold text-red-900 hover:text-red-700'>
                      Stack Trace
                    </summary>
                    <pre className='mt-2 text-xs text-red-800 overflow-x-auto whitespace-pre-wrap break-words'>
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
              <button
                onClick={reset}
                className='inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium shadow-md hover:shadow-lg'
              >
                <ArrowPathIcon className='w-5 h-5' />
                Try Again
              </button>

              <a
                href='/'
                className='inline-flex items-center gap-2 px-6 py-3 bg-white text-sky-600 border-2 border-sky-600 rounded-lg hover:bg-sky-50 transition-colors font-medium'
              >
                Go Home
              </a>
            </div>

            {/* Help Section */}
            <div className='bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                Need immediate assistance?
              </h3>
              <p className='text-gray-600 mb-4'>
                If this error persists, please contact our support team.
              </p>
              <p className='text-sm text-gray-500'>Error ID: {error.digest || 'N/A'}</p>
            </div>

            {/* Recovery Steps */}
            <div className='mt-12 text-sm text-gray-600 max-w-md mx-auto'>
              <p className='font-semibold mb-2'>Recovery steps:</p>
              <ul className='space-y-1 text-left'>
                <li>1. Click &quot;Try Again&quot; to retry</li>
                <li>2. Refresh your browser (Ctrl+R or Cmd+R)</li>
                <li>3. Clear browser cache and cookies</li>
                <li>4. Try a different browser</li>
                <li>5. Contact support if issue persists</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Inline styles to ensure error page always looks correct */}
        <style jsx>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family:
              -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          @keyframes ping {
            75%,
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .animate-ping {
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>
      </body>
    </html>
  )
}
