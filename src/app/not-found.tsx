import Link from 'next/link'
import { Metadata } from 'next'
import { HomeIcon, MagnifyingGlassIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for could not be found.',
}

/**
 * Custom 404 Not Found Page
 * Displayed when a user navigates to a non-existent route
 */
export default function NotFound() {
  return (
    <div className='min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gradient-to-br from-sky-50 to-blue-50'>
      <div className='max-w-2xl w-full text-center'>
        {/* Error Code */}
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-sky-600 mb-2'>404</h1>
          <div className='h-1 w-32 bg-sky-600 mx-auto rounded-full' />
        </div>

        {/* Error Message */}
        <h2 className='text-3xl md:text-4xl font-bold text-secondary-900 mb-4'>Page Not Found</h2>
        <p className='text-lg text-secondary-600 mb-8 max-w-md mx-auto'>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium shadow-md hover:shadow-lg'
          >
            <HomeIcon className='w-5 h-5' />
            Go Home
          </Link>

          <Link
            href='/products'
            className='inline-flex items-center gap-2 px-6 py-3 bg-white text-sky-600 border-2 border-sky-600 rounded-lg hover:bg-sky-50 transition-colors font-medium'
          >
            <MagnifyingGlassIcon className='w-5 h-5' />
            Browse Products
          </Link>
        </div>

        {/* Help Section */}
        <div className='bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto'>
          <h3 className='text-lg font-semibold text-secondary-900 mb-3'>Need Help?</h3>
          <p className='text-secondary-600 mb-4'>
            If you believe this is an error, please contact our support team.
          </p>
          <Link
            href='/contact'
            className='inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium'
          >
            <EnvelopeIcon className='w-5 h-5' />
            Contact Support
          </Link>
        </div>

        {/* Popular Links */}
        <div className='mt-12 text-sm text-secondary-600'>
          <p className='mb-3'>Popular pages:</p>
          <div className='flex flex-wrap gap-4 justify-center'>
            <Link href='/products' className='hover:text-sky-600 transition-colors'>
              Products
            </Link>
            <Link href='/technology' className='hover:text-sky-600 transition-colors'>
              Technology
            </Link>
            <Link href='/faq' className='hover:text-sky-600 transition-colors'>
              FAQ
            </Link>
            <Link href='/contact' className='hover:text-sky-600 transition-colors'>
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
