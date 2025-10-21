/**
 * Customer Table Component
 * Table for displaying and filtering customers
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { User } from '@/db/schemas/auth'
import styles from './CustomerTable.module.css'

interface CustomerWithOrders extends User {
  orderCount: number
}

interface CustomerTableProps {
  initialData: CustomerWithOrders[]
  initialFilter: string
  initialSearch: string
}

export default function CustomerTable({
  initialData,
  initialFilter,
  initialSearch,
}: CustomerTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState(initialFilter)

  const updateFilters = (newFilter?: string, newSearch?: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    if (newFilter !== undefined) {
      if (newFilter === 'all') {
        params.delete('filter')
      } else {
        params.set('filter', newFilter)
      }
      setFilter(newFilter)
    }

    if (newSearch !== undefined) {
      if (newSearch === '') {
        params.delete('search')
      } else {
        params.set('search', newSearch)
      }
      setSearch(newSearch)
    }

    router.push(`/admin/customers?${params.toString()}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    updateFilters(undefined, value)
  }

  const handleFilterClick = (newFilter: string) => {
    updateFilters(newFilter, undefined)
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>Admin</span>
    }
    return <span className={`${styles.roleBadge} ${styles.roleCustomer}`}>Customer</span>
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className={styles.tableSection}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <h2>All Customers</h2>

        <div className={styles.filterControls}>
          {/* Search */}
          <div className={styles.searchBox}>
            <input
              type='text'
              placeholder='Search by name or email...'
              value={search}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>

          {/* Filter Buttons */}
          <div className={styles.filterButtons}>
            <button
              onClick={() => handleFilterClick('all')}
              className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterClick('customer')}
              className={`${styles.filterButton} ${filter === 'customer' ? styles.active : ''}`}
            >
              Customers
            </button>
            <button
              onClick={() => handleFilterClick('admin')}
              className={`${styles.filterButton} ${filter === 'admin' ? styles.active : ''}`}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className={styles.tableContent}>
        {initialData.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No customers found</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Joined</th>
                <th>Email Verified</th>
              </tr>
            </thead>
            <tbody>
              {initialData.map(customer => (
                <tr key={customer.id}>
                  <td>
                    <div className={styles.customerInfo}>
                      <span className={styles.customerName}>{customer.name || 'No name'}</span>
                      <span className={styles.customerEmail}>{customer.email}</span>
                    </div>
                  </td>
                  <td>{getRoleBadge(customer.role)}</td>
                  <td>{customer.orderCount}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td>{customer.emailVerified ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
