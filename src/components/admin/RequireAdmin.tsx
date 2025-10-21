/**
 * RequireAdmin Component
 * Client-side component to protect admin routes
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import styles from './RequireAdmin.module.css'

interface RequireAdminProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RequireAdmin({ children, fallback }: RequireAdminProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      // Redirect to sign in with callback to current page
      router.push('/auth/signin?callbackUrl=' + window.location.pathname)
      return
    }

    if (session?.user?.role !== 'admin') {
      // Redirect to home if not admin
      router.push('/')
      return
    }
  }, [status, session, router])

  // Show loading state while checking
  if (status === 'loading') {
    return (
      fallback || (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Verifying admin access...</p>
          </div>
        </div>
      )
    )
  }

  // Show nothing while redirecting
  if (!session || session.user.role !== 'admin') {
    return null
  }

  // Render children if admin
  return <>{children}</>
}
