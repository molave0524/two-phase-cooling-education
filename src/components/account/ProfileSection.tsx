/**
 * Profile Section Component
 * Manages user profile information (name, image, email)
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import styles from './ProfileSection.module.css'

export default function ProfileSection() {
  const { data: session, update } = useSession()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  const [name, setName] = useState(session?.user?.name || '')
  const [image, setImage] = useState(session?.user?.image || '')
  const [newEmail, setNewEmail] = useState('')

  const onUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      })

      if (!res.ok) throw new Error('Failed to update profile')

      await update({ name, image })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const onUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingEmail(true)

    try {
      const res = await fetch('/api/account/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update email')
      }

      toast.success('Verification email sent. Please check your inbox.')
      setNewEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Profile Info */}
      <div className={styles.card}>
        <h2 className={styles.heading}>
          <span className={styles.icon}>👤</span> Profile Information
        </h2>
        <form onSubmit={onUpdateProfile} className={styles.form}>
          {session?.user?.image && (
            <div className={styles.profileImagePreview}>
              <img src={session.user.image} alt='Profile' className={styles.profileImage} />
              <div className={styles.imageInfo}>
                <p>Current Profile Picture</p>
                <p>Update the URL below to change</p>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor='name' className={styles.label}>
              Full Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              placeholder='Enter your name'
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='image' className={styles.label}>
              Profile Image URL
            </label>
            <input
              id='image'
              type='url'
              value={image}
              onChange={e => setImage(e.target.value)}
              className={styles.input}
              placeholder='https://example.com/avatar.jpg'
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
              'Update Profile'
            )}
          </button>
        </form>
      </div>

      {/* Email */}
      <div className={`${styles.card} ${styles.emailCard}`}>
        <h2 className={styles.heading}>
          <span className={styles.icon}>✉️</span> Email Address
        </h2>
        <div className={styles.currentEmailBox}>
          <p>
            Current email: <strong>{session?.user?.email}</strong>
          </p>
        </div>

        <form onSubmit={onUpdateEmail} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor='newEmail' className={styles.label}>
              New Email Address
            </label>
            <input
              id='newEmail'
              type='email'
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className={styles.input}
              placeholder='your.new.email@example.com'
              required
            />
            <p className={styles.infoText}>
              <span className={styles.infoIcon}>ℹ️</span>
              <span>
                A verification email will be sent to the new address before the change takes effect
              </span>
            </p>
          </div>

          <button type='submit' disabled={isUpdatingEmail} className={styles.button}>
            {isUpdatingEmail ? (
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
                Sending...
              </span>
            ) : (
              'Update Email'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
