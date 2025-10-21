/**
 * Inventory Table Component
 * Displays products with inventory management actions
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MagnifyingGlassIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline'
import type { Product } from '@/db/schemas/catalog'
import StockAdjustmentModal from './StockAdjustmentModal'
import styles from './InventoryTable.module.css'

type InventoryProduct = Product & {
  inventory: {
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder'
    availableQuantity: number
    stockQuantity: number
    reservedQuantity: number
    lowStockThreshold: number
  }
}

interface InventoryTableProps {
  initialData: InventoryProduct[]
  initialFilter: string
  initialSearch: string
}

export default function InventoryTable({
  initialData,
  initialFilter,
  initialSearch,
}: InventoryTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState(initialFilter)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filter !== 'all') params.set('filter', filter)
    router.push(`/admin/inventory?${params.toString()}`)
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (newFilter !== 'all') params.set('filter', newFilter)
    router.push(`/admin/inventory?${params.toString()}`)
  }

  const handleAdjustStock = (product: InventoryProduct) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
    router.refresh()
  }

  const getStatusBadge = (status: InventoryProduct['inventory']['status']) => {
    const statusConfig = {
      in_stock: { label: 'In Stock', className: styles.statusInStock },
      low_stock: { label: 'Low Stock', className: styles.statusLowStock },
      out_of_stock: { label: 'Out of Stock', className: styles.statusOutOfStock },
      backorder: { label: 'Backorder', className: styles.statusBackorder },
    }

    const config = statusConfig[status]
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>
  }

  return (
    <div className={styles.tableContainer}>
      {/* Filters and Search */}
      <div className={styles.filterSection}>
        <div className={styles.filterContent}>
          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            {['all', 'low_stock', 'out_of_stock'].map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`${styles.filterButton} ${filter === f ? styles.active : ''}`}
              >
                {f === 'all' && 'All Products'}
                {f === 'low_stock' && 'Low Stock'}
                {f === 'out_of_stock' && 'Out of Stock'}
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
                placeholder='Search by name, SKU, or slug...'
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
              <th>Product</th>
              <th>SKU</th>
              <th className={styles.centerAlign}>Status</th>
              <th className={styles.centerAlign}>Stock</th>
              <th className={styles.centerAlign}>Reserved</th>
              <th className={styles.centerAlign}>Available</th>
              <th className={styles.centerAlign}>Threshold</th>
              <th className={styles.rightAlign}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {initialData.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  No products found
                </td>
              </tr>
            ) : (
              initialData.map(product => {
                const availableClass =
                  product.inventory.availableQuantity <= 0
                    ? styles.availableDanger
                    : product.inventory.availableQuantity <= product.lowStockThreshold
                      ? styles.availableWarning
                      : styles.availableSuccess

                return (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productInfo}>
                        <Link href={`/products/${product.slug}`} className={styles.productLink}>
                          {product.name}
                        </Link>
                        <p className={styles.productSlug}>{product.slug}</p>
                      </div>
                    </td>
                    <td>
                      <span className={styles.productSku}>{product.sku}</span>
                    </td>
                    <td className={styles.centerAlign}>
                      {getStatusBadge(product.inventory.status)}
                    </td>
                    <td className={styles.centerAlign}>
                      <span className={styles.stockValue}>{product.inventory.stockQuantity}</span>
                    </td>
                    <td className={styles.centerAlign}>
                      <span className={styles.reservedValue}>
                        {product.inventory.reservedQuantity}
                      </span>
                    </td>
                    <td className={styles.centerAlign}>
                      <span className={`${styles.availableValue} ${availableClass}`}>
                        {product.inventory.availableQuantity}
                      </span>
                    </td>
                    <td className={styles.centerAlign}>
                      <span className={styles.thresholdValue}>{product.lowStockThreshold}</span>
                    </td>
                    <td className={styles.rightAlign}>
                      <div className={styles.actions}>
                        <Link
                          href={`/products/${product.slug}`}
                          className={styles.actionButton}
                          title='View product'
                        >
                          <EyeIcon />
                        </Link>
                        <button
                          onClick={() => handleAdjustStock(product)}
                          className={styles.actionButton}
                          title='Adjust stock'
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <StockAdjustmentModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
