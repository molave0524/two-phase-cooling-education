/**
 * Addresses Section Component
 * Manages user shipping and billing addresses (full CRUD)
 */

'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import styles from './AddressesSection.module.css'

interface Address {
  id: number
  type: 'shipping' | 'billing' | 'both'
  isDefault: boolean
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export default function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Address>>({
    type: 'shipping',
    isDefault: false,
    country: 'US',
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/account/addresses')
      if (!res.ok) throw new Error('Failed to fetch addresses')
      const data = await res.json()
      setAddresses(data)
    } catch (error) {
      toast.error('Failed to load addresses')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingId ? `/api/account/addresses/${editingId}` : '/api/account/addresses'

      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to save address')

      toast.success(editingId ? 'Address updated' : 'Address added')
      resetForm()
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to save address')
    }
  }

  const deleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete address')

      toast.success('Address deleted')
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to delete address')
    }
  }

  const editAddress = (address: Address) => {
    setEditingId(address.id)
    setFormData(address)
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ type: 'shipping', isDefault: false, country: 'US' })
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          <span className={styles.icon}>📍</span> Saved Addresses
        </h2>
        <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
          <PlusIcon className={styles.addButtonIcon} />
          Add Address
        </button>
      </div>

      {/* Address Form */}
      {showForm && (
        <form onSubmit={onSubmit} className={styles.formCard}>
          <h3 className={styles.formHeading}>
            <span className={styles.icon}>{editingId ? '✏️' : '➕'}</span>
            {editingId ? 'Edit' : 'Add'} Address
          </h3>

          <div className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor='firstName' className={styles.label}>
                  First Name
                </label>
                <input
                  id='firstName'
                  type='text'
                  value={formData.firstName || ''}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className={styles.input}
                  placeholder='John'
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor='lastName' className={styles.label}>
                  Last Name
                </label>
                <input
                  id='lastName'
                  type='text'
                  value={formData.lastName || ''}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className={styles.input}
                  placeholder='Doe'
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor='company' className={styles.label}>
                Company (Optional)
              </label>
              <input
                id='company'
                type='text'
                value={formData.company || ''}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                className={styles.input}
                placeholder='Company Name'
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor='address1' className={styles.label}>
                Address Line 1
              </label>
              <input
                id='address1'
                type='text'
                value={formData.address1 || ''}
                onChange={e => setFormData({ ...formData, address1: e.target.value })}
                className={styles.input}
                placeholder='123 Main Street'
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor='address2' className={styles.label}>
                Address Line 2 (Optional)
              </label>
              <input
                id='address2'
                type='text'
                value={formData.address2 || ''}
                onChange={e => setFormData({ ...formData, address2: e.target.value })}
                className={styles.input}
                placeholder='Apt, Suite, Unit, etc.'
              />
            </div>

            <div className={styles.formRow3}>
              <div className={styles.formGroup}>
                <label htmlFor='city' className={styles.label}>
                  City
                </label>
                <input
                  id='city'
                  type='text'
                  value={formData.city || ''}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className={styles.input}
                  placeholder='New York'
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor='state' className={styles.label}>
                  State
                </label>
                <input
                  id='state'
                  type='text'
                  value={formData.state || ''}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className={styles.input}
                  placeholder='NY'
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor='postalCode' className={styles.label}>
                  Postal Code
                </label>
                <input
                  id='postalCode'
                  type='text'
                  value={formData.postalCode || ''}
                  onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                  className={styles.input}
                  placeholder='10001'
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor='phone' className={styles.label}>
                  Phone (Optional)
                </label>
                <input
                  id='phone'
                  type='tel'
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={styles.input}
                  placeholder='(555) 123-4567'
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor='type' className={styles.label}>
                  Address Type
                </label>
                <select
                  id='type'
                  value={formData.type || 'shipping'}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className={styles.select}
                  required
                >
                  <option value='shipping'>Shipping</option>
                  <option value='billing'>Billing</option>
                  <option value='both'>Both</option>
                </select>
              </div>
            </div>

            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  checked={formData.isDefault || false}
                  onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>Set as default address</span>
              </label>
            </div>

            <div className={styles.formActions}>
              <button type='submit' className={styles.submitButton}>
                {editingId ? 'Update' : 'Save'} Address
              </button>
              <button type='button' onClick={resetForm} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateIcon}>📭</span>
          <p className={styles.emptyStateText}>No addresses saved yet</p>
          <p className={styles.emptyStateSubtext}>Click &quot;Add Address&quot; to get started</p>
        </div>
      ) : (
        <div className={styles.addressList}>
          {addresses.map(address => (
            <div key={address.id} className={styles.addressCard}>
              <div className={styles.addressContent}>
                <div className={styles.addressHeader}>
                  <span className={styles.addressName}>
                    {address.firstName} {address.lastName}
                  </span>
                  {address.isDefault && <span className={styles.defaultBadge}>Default</span>}
                  <span className={styles.typeBadge}>{address.type}</span>
                </div>
                {address.company && <p className={styles.addressCompany}>{address.company}</p>}
                <p className={styles.addressLine}>{address.address1}</p>
                {address.address2 && <p className={styles.addressLine}>{address.address2}</p>}
                <p className={styles.addressLine}>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                {address.phone && <p className={styles.addressPhone}>{address.phone}</p>}
              </div>
              <div className={styles.addressActions}>
                <button
                  onClick={() => editAddress(address)}
                  className={styles.iconButton}
                  title='Edit'
                >
                  <PencilIcon className={styles.actionIcon} />
                </button>
                <button
                  onClick={() => deleteAddress(address.id)}
                  className={`${styles.iconButton} ${styles.delete}`}
                  title='Delete'
                >
                  <TrashIcon className={styles.actionIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
