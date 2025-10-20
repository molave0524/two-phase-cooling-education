/**
 * Inventory Status Component
 * Displays inventory availability status for products
 */

'use client'

import React from 'react'
import styles from './InventoryStatus.module.css'

export type InventoryStatusType = 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder'

interface InventoryStatusProps {
  status: InventoryStatusType
  availableQuantity?: number
  showQuantity?: boolean
  className?: string
}

const statusConfig = {
  in_stock: {
    label: 'In Stock',
    icon: '✓',
    className: 'inStock',
  },
  low_stock: {
    label: 'Low Stock',
    icon: '⚠',
    className: 'lowStock',
  },
  out_of_stock: {
    label: 'Out of Stock',
    icon: '✕',
    className: 'outOfStock',
  },
  backorder: {
    label: 'Available on Backorder',
    icon: '↻',
    className: 'backorder',
  },
}

export default function InventoryStatus({
  status,
  availableQuantity,
  showQuantity = false,
  className = '',
}: InventoryStatusProps) {
  const config = statusConfig[status]

  return (
    <div className={`${styles.inventoryStatus} ${styles[config.className]} ${className}`}>
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.label}>
        {config.label}
        {showQuantity && availableQuantity !== undefined && availableQuantity > 0 && (
          <span className={styles.quantity}> ({availableQuantity} available)</span>
        )}
      </span>
    </div>
  )
}
