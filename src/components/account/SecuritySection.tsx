/**
 * Security Section Component
 * Manages password changes and security settings
 */

'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import styles from './SecuritySection.module.css'

export default function SecuritySection() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsUpdating(true)

    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update password')
      }

      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        <span className={styles.icon}>🔒</span> Change Password
      </h2>

      <p className={styles.infoText}>
        <span className={styles.infoIcon}>ℹ️</span>
        <span>Update your password to keep your account secure</span>
      </p>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor='currentPassword' className={styles.label}>
            Current Password
          </label>
          <input
            id='currentPassword'
            type='password'
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className={styles.input}
            placeholder='Enter your current password'
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor='newPassword' className={styles.label}>
            New Password
          </label>
          <input
            id='newPassword'
            type='password'
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className={styles.input}
            placeholder='Enter new password'
            minLength={8}
            required
          />
          <p className={styles.passwordHint}>
            <span className={styles.hintIcon}>🔑</span>
            <span>At least 8 characters with uppercase, lowercase, and number</span>
          </p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor='confirmPassword' className={styles.label}>
            Confirm New Password
          </label>
          <input
            id='confirmPassword'
            type='password'
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={styles.input}
            placeholder='Confirm your new password'
            minLength={8}
            required
          />
        </div>

        <button type='submit' disabled={isUpdating} className={styles.button}>
          {isUpdating ? (
            <span className={styles.buttonContent}>
              <svg className={styles.spinner} viewBox='0 0 24 24'>
                <circle
                  style={{ opacity: 0.25 }}
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                  fill='none'
                />
                <path
                  style={{ opacity: 0.75 }}
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              Updating...
            </span>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  )
}
