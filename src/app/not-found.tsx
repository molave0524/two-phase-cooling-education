'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50'>
      <div className='text-center space-y-6 p-8'>
        <div className='space-y-4'>
          <h1 className='text-6xl font-bold text-primary-600'>404</h1>
          <h2 className='text-2xl font-semibold text-secondary-900'>Page Not Found</h2>
          <p className='text-secondary-600 max-w-md mx-auto'>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className='space-y-4'>
          <Link href='/' className='inline-block btn btn-primary'>
            Return Home
          </Link>

          <div className='text-sm text-secondary-500'>
            <Link href='/products' className='text-primary-600 hover:text-primary-700 underline'>
              Browse Products
            </Link>
            {' | '}
            <Link href='/faq' className='text-primary-600 hover:text-primary-700 underline'>
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
