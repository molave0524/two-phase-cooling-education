/**
 * Reservation Table Component
 * Table for displaying and filtering inventory reservations
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { InventoryReservation } from '@/db/schemas/store'
import styles from './ReservationTable.module.css'

interface ReservationTableProps {
  initialData: InventoryReservation[]
  initialFilter: string
  initialSearch: string
}

export default function ReservationTable({
  initialData,
  initialFilter,
  initialSearch,
}: ReservationTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState(initialFilter)

  const updateFilters = (newFilter?: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    if (newFilter !== undefined) {
      if (newFilter === 'all') {
        params.delete('filter')
      } else {
        params.set('filter', newFilter)
      }
      setFilter(newFilter)
    }

    router.push(`/admin/reservations?${params.toString()}`)
  }

  const handleFilterClick = (newFilter: string) => {
    updateFilters(newFilter)
  }

  const getStatusBadge = (reservation: InventoryReservation) => {
    const now = new Date()
    const expiresAt = new Date(reservation.expiresAt)
    const isExpired = expiresAt < now && reservation.status === 'active'

    if (isExpired) {
      return <span className={`${styles.statusBadge} ${styles.statusExpired}`}>Expired</span>
    }

    switch (reservation.status) {
      case 'active':
        return <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
      case 'completed':
        return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Completed</span>
      case 'cancelled':
        return <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>Cancelled</span>
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.statusActive}`}>
            {reservation.status}
          </span>
        )
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatExpiration = (expiresAt: Date, status: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const minutesUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / 1000 / 60)

    if (status !== 'active') {
      return formatDate(expiresAt)
    }

    if (expiry < now) {
      return <span className={styles.expired}>Expired</span>
    }

    if (minutesUntilExpiry < 10) {
      return (
        <span className={styles.expiresSoon}>
          {formatDate(expiresAt)} (in {minutesUntilExpiry}m)
        </span>
      )
    }

    return formatDate(expiresAt)
  }

  return (
    <div className={styles.tableSection}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <h2>All Reservations</h2>

        <div className={styles.filterControls}>
          {/* Filter Buttons */}
          <div className={styles.filterButtons}>
            <button
              onClick={() => handleFilterClick('all')}
              className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterClick('active')}
              className={`${styles.filterButton} ${filter === 'active' ? styles.active : ''}`}
            >
              Active
            </button>
            <button
              onClick={() => handleFilterClick('expired')}
              className={`${styles.filterButton} ${filter === 'expired' ? styles.active : ''}`}
            >
              Expired
            </button>
            <button
              onClick={() => handleFilterClick('completed')}
              className={`${styles.filterButton} ${filter === 'completed' ? styles.active : ''}`}
            >
              Completed
            </button>
            <button
              onClick={() => handleFilterClick('cancelled')}
              className={`${styles.filterButton} ${filter === 'cancelled' ? styles.active : ''}`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className={styles.tableContent}>
        {initialData.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No reservations found</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Quantity</th>
                <th>Type</th>
                <th>Status</th>
                <th>Reserved By</th>
                <th>Created</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {initialData.map(reservation => (
                <tr key={reservation.id}>
                  <td>
                    <span className={styles.productId}>{reservation.productId}</span>
                  </td>
                  <td>{reservation.quantity}</td>
                  <td>
                    <span className={styles.typeBadge}>{reservation.reservationType}</span>
                  </td>
                  <td>{getStatusBadge(reservation)}</td>
                  <td>
                    <span className={styles.productId}>{reservation.reservedBy || 'Guest'}</span>
                  </td>
                  <td>{formatDate(reservation.createdAt)}</td>
                  <td>{formatExpiration(reservation.expiresAt, reservation.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
