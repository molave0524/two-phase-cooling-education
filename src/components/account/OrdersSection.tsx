/**
 * Orders Section Component
 * Displays user order history with tracking information
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import styles from './OrdersSection.module.css'

interface OrderItem {
  id: number
  productName: string
  productImage: string
  quantity: number
  price: number
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  createdAt: string
  trackingNumber?: string
  trackingUrl?: string
  items: OrderItem[]
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/account/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string | undefined> = {
      pending: styles.statusPending,
      processing: styles.statusProcessing,
      shipped: styles.statusShipped,
      delivered: styles.statusDelivered,
      cancelled: styles.statusCancelled,
    }
    return `${styles.statusBadge} ${statusMap[status] || styles.statusPending}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyStateIcon}>🛍️</span>
        <p className={styles.emptyStateText}>No orders yet</p>
        <Link href='/products' className={styles.shopButton}>
          Start shopping →
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        <span className={styles.icon}>📦</span> Order History
      </h2>

      <div className={styles.orderList}>
        {orders.map(order => (
          <div key={order.id} className={styles.orderCard}>
            {/* Order Header */}
            <div className={styles.orderHeader}>
              <div className={styles.orderInfo}>
                <Link
                  href={`/order-confirmation?id=${order.id}`}
                  className={styles.orderNumberLink}
                >
                  Order #{order.orderNumber}
                </Link>
                <p className={styles.orderDate}>📅 {formatDate(order.createdAt)}</p>
              </div>

              <div className={styles.orderMeta}>
                <span className={getStatusClass(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <p className={styles.orderTotal}>${order.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
              <span className={styles.itemCount}>{order.items.length}</span>
              {order.items.length === 1 ? 'item' : 'items'}
            </div>

            {/* Product Thumbnails Preview */}
            {order.items.length > 0 && (
              <div className={styles.itemsPreview}>
                {order.items.slice(0, 3).map(item => (
                  <img
                    key={item.id}
                    src={item.productImage}
                    alt={item.productName}
                    className={styles.itemThumbnail}
                  />
                ))}
                {order.items.length > 3 && (
                  <div className={styles.moreItems}>+{order.items.length - 3}</div>
                )}
              </div>
            )}

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className={styles.trackingInfo}>
                <div className={styles.trackingCard}>
                  <p className={styles.trackingTitle}>
                    <span>🚚</span> Tracking Information
                  </p>
                  <p className={styles.trackingNumber}>
                    Tracking Number: <strong>{order.trackingNumber}</strong>
                  </p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={styles.trackingLink}
                    >
                      Track shipment →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
