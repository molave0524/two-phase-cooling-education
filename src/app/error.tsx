'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

/**
 * Custom Error Page
 * Displayed when a runtime error occurs in the application
 * This is a client component that can use hooks and event handlers
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error('Application error', error, {
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className='min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gradient-to-br from-red-50 to-orange-50'>
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
        <h1 className='text-3xl md:text-4xl font-bold text-secondary-900 mb-4'>
          Oops! Something went wrong
        </h1>
        <p className='text-lg text-secondary-600 mb-8 max-w-md mx-auto'>
          We encountered an unexpected error. Don&apos;t worry, our team has been notified and
          we&apos;re working on it.
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

          <Link
            href='/'
            className='inline-flex items-center gap-2 px-6 py-3 bg-white text-sky-600 border-2 border-sky-600 rounded-lg hover:bg-sky-50 transition-colors font-medium'
          >
            <HomeIcon className='w-5 h-5' />
            Go Home
          </Link>
        </div>

        {/* Help Section */}
        <div className='bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto'>
          <h3 className='text-lg font-semibold text-secondary-900 mb-3'>Still having issues?</h3>
          <p className='text-secondary-600 mb-4'>
            If the problem persists, please contact our support team with the error details.
          </p>
          <Link
            href='/contact'
            className='inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium'
          >
            Contact Support
          </Link>
        </div>

        {/* Tips */}
        <div className='mt-12 text-sm text-secondary-600 max-w-md mx-auto'>
          <p className='font-semibold mb-2'>Quick tips:</p>
          <ul className='space-y-1 text-left'>
            <li>• Try refreshing the page</li>
            <li>• Clear your browser cache</li>
            <li>• Check your internet connection</li>
            <li>• Try again in a few minutes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
