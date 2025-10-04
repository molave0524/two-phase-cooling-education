/**
 * Reset Password Page
 * Reset password with token from email
 */

import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className='min-h-screen flex items-center justify-center'>Loading...</div>}
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
