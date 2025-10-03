/**
 * Profile Section Component
 * Manages user profile information (name, image, email)
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

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
    <div className="space-y-8">
      {/* Profile Info */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
        <form onSubmit={onUpdateProfile} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Profile Image URL
            </label>
            <input
              id="image"
              type="url"
              value={image}
              onChange={e => setImage(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Email */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Email Address</h2>
        <p className="text-sm text-gray-600 mb-4">
          Current email: <strong>{session?.user?.email}</strong>
        </p>

        <form onSubmit={onUpdateEmail} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
              New Email Address
            </label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter new email"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              A verification email will be sent to the new address
            </p>
          </div>

          <button
            type="submit"
            disabled={isUpdatingEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingEmail ? 'Sending...' : 'Update Email'}
          </button>
        </form>
      </div>
    </div>
  )
}
