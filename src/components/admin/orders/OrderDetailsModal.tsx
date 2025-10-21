/**
 * Order Details Modal
 * Modal for viewing and managing order details
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Order } from '@/db/schemas/store'
import styles from './OrderDetailsModal.module.css'

interface OrderDetailsModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [shippingCarrier, setShippingCarrier] = useState(order.shippingCarrier || '')
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchOrderItems()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order.id])

  const fetchOrderItems = async () => {
    setIsLoadingItems(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/items`)
      if (!response.ok) throw new Error('Failed to fetch order items')
      const data = await response.json()
      setOrderItems(data.items || [])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching order items:', error)
      toast.error('Failed to load order items')
    } finally {
      setIsLoadingItems(false)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingNumber: trackingNumber || null,
          shippingCarrier: shippingCarrier || null,
          internalNotes: internalNotes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update order')
      }

      toast.success('Order updated successfully')
      onClose()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update order')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen) return null

  const customer = order.customer as any
  const shippingAddress = order.shippingAddress as any

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

  return (
    <div className={styles.overlay}>
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div className={styles.container}>
        <div className={styles.modal}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h2>Order Details</h2>
              <p className={styles.orderNumber}>{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <XMarkIcon />
            </button>
          </div>

          <div className={styles.content}>
            {/* Status Update Section */}
            <div className={styles.statusSection}>
              <h3>Order Management</h3>
              <div className={styles.statusGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor='status'>Order Status</label>
                  <select
                    id='status'
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value='pending'>Pending</option>
                    <option value='processing'>Processing</option>
                    <option value='shipped'>Shipped</option>
                    <option value='delivered'>Delivered</option>
                    <option value='cancelled'>Cancelled</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor='paymentStatus'>Payment Status</label>
                  <select
                    id='paymentStatus'
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    className={styles.select}
                  >
                    <option value='pending'>Pending</option>
                    <option value='paid'>Paid</option>
                    <option value='failed'>Failed</option>
                    <option value='refunded'>Refunded</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor='trackingNumber'>Tracking Number</label>
                  <input
                    type='text'
                    id='trackingNumber'
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className={styles.input}
                    placeholder='Enter tracking number'
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor='shippingCarrier'>Shipping Carrier</label>
                  <select
                    id='shippingCarrier'
                    value={shippingCarrier}
                    onChange={e => setShippingCarrier(e.target.value)}
                    className={styles.select}
                  >
                    <option value=''>Select carrier</option>
                    <option value='USPS'>USPS</option>
                    <option value='UPS'>UPS</option>
                    <option value='FedEx'>FedEx</option>
                    <option value='DHL'>DHL</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label htmlFor='internalNotes'>Internal Notes</label>
                <textarea
                  id='internalNotes'
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  rows={3}
                  className={styles.textarea}
                  placeholder='Add internal notes (not visible to customer)'
                />
              </div>

              <button onClick={handleUpdate} disabled={isUpdating} className={styles.updateButton}>
                {isUpdating ? 'Updating...' : 'Update Order'}
              </button>
            </div>

            {/* Order Info Grid */}
            <div className={styles.infoGrid}>
              {/* Customer Info */}
              <div className={styles.infoCard}>
                <h3>Customer Information</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Name</span>
                  <span className={styles.infoValue}>{customer.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{customer.phone}</span>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className={styles.infoCard}>
                <h3>Shipping Address</h3>
                <p className={styles.address}>
                  {shippingAddress.line1}
                  {shippingAddress.line2 && (
                    <>
                      <br />
                      {shippingAddress.line2}
                    </>
                  )}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                  <br />
                  {shippingAddress.country}
                </p>
              </div>

              {/* Order Dates */}
              <div className={styles.infoCard}>
                <h3>Important Dates</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Created</span>
                  <span className={styles.infoValue}>{formatDate(order.createdAt)}</span>
                </div>
                {order.paidAt && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Paid</span>
                    <span className={styles.infoValue}>{formatDate(order.paidAt)}</span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Shipped</span>
                    <span className={styles.infoValue}>{formatDate(order.shippedAt)}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Delivered</span>
                    <span className={styles.infoValue}>{formatDate(order.deliveredAt)}</span>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div className={styles.infoCard}>
                <h3>Payment Information</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Method</span>
                  <span className={styles.infoValue}>{order.paymentMethod}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue}>{order.paymentStatus}</span>
                </div>
                {order.stripePaymentIntentId && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Payment ID</span>
                    <span className={styles.infoValue} style={{ fontSize: '11px' }}>
                      {order.stripePaymentIntentId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className={styles.itemsSection}>
              <h3>Order Items</h3>
              {isLoadingItems ? (
                <p className={styles.infoLabel}>Loading items...</p>
              ) : (
                <div className={styles.itemsList}>
                  {orderItems.map(item => {
                    // Check if productImage is a valid URL (not "[object Object]" or empty)
                    const isValidImageUrl =
                      item.productImage &&
                      typeof item.productImage === 'string' &&
                      item.productImage.length > 0 &&
                      item.productImage !== '[object Object]' &&
                      (item.productImage.startsWith('http://') ||
                        item.productImage.startsWith('https://') ||
                        item.productImage.startsWith('/'))

                    // Use slug if available, otherwise fall back to SKU
                    const productLink =
                      item.productSlug && item.productSlug.trim() !== ''
                        ? `/products/${item.productSlug}`
                        : `/products/sku/${item.productSku}`

                    return (
                      <Link
                        key={item.id}
                        href={productLink}
                        className={styles.item}
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                      >
                        <div className={styles.itemImageWrapper}>
                          {isValidImageUrl ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              width={60}
                              height={60}
                              className={styles.itemImage}
                              style={{ objectFit: 'cover' }}
                              onError={e => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className={styles.itemImagePlaceholder}>
                              <span>{item.productName.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.itemDetails}>
                          <p className={styles.itemName}>{item.productName}</p>
                          <p className={styles.itemSku}>SKU: {item.productSku}</p>
                        </div>
                        <div className={styles.itemPrice}>
                          <span className={styles.itemPriceValue}>
                            {formatCurrency(item.lineTotal)}
                          </span>
                          <span className={styles.itemQuantity}>Qty: {item.quantity}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className={styles.summary}>
              <h3>Order Summary</h3>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal</span>
                <span className={styles.summaryValue}>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>
                  Tax ({(order.taxRate * 100).toFixed(2)}%)
                </span>
                <span className={styles.summaryValue}>{formatCurrency(order.tax)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Shipping ({order.shippingMethod})</span>
                <span className={styles.summaryValue}>{formatCurrency(order.shipping)}</span>
              </div>
              {order.discount > 0 && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Discount</span>
                  <span className={styles.summaryValue}>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span className={styles.summaryLabel}>Total</span>
                <span className={styles.summaryValue}>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
