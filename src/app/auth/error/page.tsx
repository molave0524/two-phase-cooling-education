'use client'

/**
 * Authentication Error Page
 * Displays user-friendly error messages for authentication failures
 */

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Server Configuration Error',
      description: 'There is a problem with the server configuration.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to sign in.',
    },
    Verification: {
      title: 'Verification Error',
      description: 'The verification token has expired or has already been used.',
    },
    OAuthSignin: {
      title: 'OAuth Sign In Error',
      description: 'Error in constructing an authorization URL.',
    },
    OAuthCallback: {
      title: 'OAuth Callback Error',
      description: 'Error in handling the response from an OAuth provider.',
    },
    OAuthCreateAccount: {
      title: 'OAuth Account Creation Error',
      description: 'Could not create OAuth provider user in the database.',
    },
    EmailCreateAccount: {
      title: 'Email Account Creation Error',
      description: 'Could not create email provider user in the database.',
    },
    Callback: {
      title: 'Callback Error',
      description: 'Error in the OAuth callback handler route.',
    },
    OAuthAccountNotLinked: {
      title: 'Account Already Linked',
      description:
        'This email is already associated with another account. Please sign in with the original provider.',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An error occurred during authentication. Please try again.',
    },
  }

  const currentError = (error && errorMessages[error]) || errorMessages.Default

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <div className='mx-auto h-12 w-12 text-red-600'>
            <svg
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='w-12 h-12'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
              />
            </svg>
          </div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            {currentError.title}
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>{currentError.description}</p>
        </div>
        <div className='mt-8'>
          <Link
            href='/auth/signin'
            className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Try Again
          </Link>
        </div>
        <div className='text-center'>
          <Link href='/' className='text-sm text-blue-600 hover:text-blue-500'>
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
