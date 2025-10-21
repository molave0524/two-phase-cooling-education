/**
 * Cleanup Button Component
 * Button to cleanup expired reservations
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function CleanupButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCleanup = async () => {
    if (
      !confirm(
        'Are you sure you want to cleanup all expired reservations? This will free up the reserved inventory.'
      )
    ) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/inventory/cleanup', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to cleanup reservations')
      }

      toast.success(`Successfully cleaned up ${data.cleanedUp || 0} expired reservations`)
      router.refresh()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error cleaning up reservations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cleanup reservations')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleCleanup}
      disabled={isLoading}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--color-error-600)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-weight-medium)',
        cursor: 'pointer',
        transition: 'var(--transition-colors)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: isLoading ? 0.5 : 1,
      }}
    >
      <TrashIcon style={{ width: '16px', height: '16px' }} />
      {isLoading ? 'Cleaning up...' : 'Cleanup Expired'}
    </button>
  )
}
