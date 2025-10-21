/**
 * Order Table Component
 * Displays orders with filtering and search capabilities
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { Order } from '@/db/schemas/store'
import OrderDetailsModal from './OrderDetailsModal'
import styles from './OrderTable.module.css'

interface OrderWithDetails extends Order {
  itemCount: number
}

interface OrderTableProps {
  initialData: OrderWithDetails[]
  initialFilter: string
  initialSearch: string
}

export default function OrderTable({ initialData, initialFilter, initialSearch }: OrderTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState(initialFilter)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filter !== 'all') params.set('filter', filter)
    router.push(`/admin/orders?${params.toString()}`)
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (newFilter !== 'all') params.set('filter', newFilter)
    router.push(`/admin/orders?${params.toString()}`)
  }

  const handleOrderClick = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
    router.refresh()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: styles.statusPending },
      processing: { label: 'Processing', className: styles.statusProcessing },
      shipped: { label: 'Shipped', className: styles.statusShipped },
      delivered: { label: 'Delivered', className: styles.statusDelivered },
      cancelled: { label: 'Cancelled', className: styles.statusCancelled },
    }

    const config = statusConfig[status] || statusConfig.pending
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: styles.paymentPending },
      paid: { label: 'Paid', className: styles.paymentPaid },
      failed: { label: 'Failed', className: styles.paymentFailed },
      refunded: { label: 'Refunded', className: styles.paymentRefunded },
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`${styles.paymentStatusBadge} ${config.className}`}>{config.label}</span>
    )
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className={styles.tableContainer}>
      {/* Filters and Search */}
      <div className={styles.filterSection}>
        <div className={styles.filterContent}>
          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`${styles.filterButton} ${filter === f ? styles.active : ''}`}
              >
                {f === 'all' && 'All Orders'}
                {f === 'pending' && 'Pending'}
                {f === 'processing' && 'Processing'}
                {f === 'shipped' && 'Shipped'}
                {f === 'delivered' && 'Delivered'}
                {f === 'cancelled' && 'Cancelled'}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <input
                type='text'
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search by order number, customer name, or email...'
                className={styles.searchInput}
              />
              <MagnifyingGlassIcon className={styles.searchIcon} />
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th className={styles.centerAlign}>Status</th>
              <th className={styles.centerAlign}>Payment</th>
              <th className={styles.centerAlign}>Items</th>
              <th className={styles.rightAlign}>Total</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {initialData.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No orders found
                </td>
              </tr>
            ) : (
              initialData.map(order => {
                const customer = order.customer as any

                return (
                  <tr key={order.id} onClick={() => handleOrderClick(order)}>
                    <td>
                      <div className={styles.orderNumber}>{order.orderNumber}</div>
                    </td>
                    <td>
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>{customer.name}</span>
                        <span className={styles.customerEmail}>{customer.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.date}>{formatDate(order.createdAt)}</span>
                    </td>
                    <td className={styles.centerAlign}>{getStatusBadge(order.status)}</td>
                    <td className={styles.centerAlign}>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className={styles.centerAlign}>
                      <span>{order.itemCount}</span>
                    </td>
                    <td className={styles.rightAlign}>
                      <span className={styles.totalValue}>{formatCurrency(order.total)}</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} isOpen={isModalOpen} onClose={handleModalClose} />
      )}
    </div>
  )
}
