/**
 * Signup Page
 * Email/password registration with OAuth options
 */

import { Suspense } from 'react'
import SignupForm from './SignupForm'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <Suspense
      fallback={<div className='min-h-screen flex items-center justify-center'>Loading...</div>}
    >
      <SignupForm />
    </Suspense>
  )
}
