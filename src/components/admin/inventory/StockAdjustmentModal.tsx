/**
 * Stock Adjustment Modal
 * Modal for adjusting product stock levels
 */

'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Product } from '@/db/schemas/catalog'
import styles from './StockAdjustmentModal.module.css'

type InventoryProduct = Product & {
  inventory: {
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder'
    availableQuantity: number
    stockQuantity: number
    reservedQuantity: number
    lowStockThreshold: number
  }
}

interface StockAdjustmentModalProps {
  product: InventoryProduct
  isOpen: boolean
  onClose: () => void
}

export default function StockAdjustmentModal({
  product,
  isOpen,
  onClose,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'subtract'>('set')
  const [quantity, setQuantity] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold.toString())
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const calculateNewStock = () => {
    const qty = parseInt(quantity) || 0
    switch (adjustmentType) {
      case 'set':
        return qty
      case 'add':
        return product.inventory.stockQuantity + qty
      case 'subtract':
        return Math.max(0, product.inventory.stockQuantity - qty)
      default:
        return product.inventory.stockQuantity
    }
  }

  const newStock = calculateNewStock()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quantity && adjustmentType !== 'set') {
      toast.error('Please enter a quantity')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          newStockQuantity: newStock,
          lowStockThreshold: parseInt(lowStockThreshold),
          adjustmentType,
          quantity: parseInt(quantity) || 0,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to adjust stock')
      }

      toast.success('Stock adjusted successfully')
      onClose()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adjusting stock:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock')
    } finally {
      setIsSubmitting(false)
    }
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
              <h2>Adjust Stock Level</h2>
              <p>{product.name}</p>
              <p className={styles.sku}>SKU: {product.sku}</p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <XMarkIcon />
            </button>
          </div>

          {/* Current Inventory Info */}
          <div className={styles.inventoryInfo}>
            <div className={styles.inventoryGrid}>
              <div className={styles.inventoryItem}>
                <p>Current Stock</p>
                <p className={styles.currentStock}>{product.inventory.stockQuantity}</p>
              </div>
              <div className={styles.inventoryItem}>
                <p>Reserved</p>
                <p className={styles.reserved}>{product.inventory.reservedQuantity}</p>
              </div>
              <div className={styles.inventoryItem}>
                <p>Available</p>
                <p className={styles.available}>{product.inventory.availableQuantity}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Adjustment Type */}
            <div className={styles.formGroup}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>Adjustment Type</label>
              <div className={styles.adjustmentTypeGrid}>
                {(['set', 'add', 'subtract'] as const).map(type => (
                  <button
                    key={type}
                    type='button'
                    onClick={() => setAdjustmentType(type)}
                    className={`${styles.typeButton} ${adjustmentType === type ? styles.active : ''}`}
                  >
                    {type === 'set' && 'Set To'}
                    {type === 'add' && 'Add'}
                    {type === 'subtract' && 'Subtract'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className={styles.formGroup}>
              <label htmlFor='quantity'>
                {adjustmentType === 'set' ? 'New Stock Quantity' : 'Quantity to Adjust'}
              </label>
              <input
                type='number'
                id='quantity'
                min='0'
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className={styles.input}
                placeholder={
                  adjustmentType === 'set' ? 'Enter new stock quantity' : 'Enter quantity'
                }
                required
              />
            </div>

            {/* Low Stock Threshold */}
            <div className={styles.formGroup}>
              <label htmlFor='threshold'>Low Stock Threshold</label>
              <input
                type='number'
                id='threshold'
                min='0'
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Reason */}
            <div className={styles.formGroup}>
              <label htmlFor='reason'>Reason for Adjustment (Optional)</label>
              <textarea
                id='reason'
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className={styles.textarea}
                placeholder='e.g., Inventory count correction, damaged goods, etc.'
              />
            </div>

            {/* Preview */}
            {quantity && (
              <div className={styles.preview}>
                <p>Preview:</p>
                <div className={styles.previewCalculation}>
                  <span className={styles.oldValue}>
                    {product.inventory.stockQuantity} {adjustmentType === 'add' && `+ ${quantity}`}
                    {adjustmentType === 'subtract' && `- ${quantity}`}
                    {adjustmentType === 'set' && '→'}
                  </span>
                  <span className={styles.newValue}>{newStock}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type='button'
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type='submit' className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Adjusting...' : 'Adjust Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
