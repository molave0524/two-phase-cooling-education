/**
 * Admin Inventory Management Page
 * View and manage product inventory levels
 */

import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { getInventoryStatus } from '@/lib/inventory'
import { sql, eq, and } from 'drizzle-orm'
import InventoryTable from '@/components/admin/inventory/InventoryTable'
import styles from './inventory.module.css'

export const dynamic = 'force-dynamic'

interface SearchParams {
  filter?: 'all' | 'low_stock' | 'out_of_stock'
  search?: string
}

async function getInventoryData(params: SearchParams) {
  try {
    // Build where conditions
    const conditions = [eq(products.status, 'active')]

    // Filter by stock level
    if (params.filter === 'low_stock') {
      conditions.push(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`)
    } else if (params.filter === 'out_of_stock') {
      conditions.push(sql`${products.stockQuantity} = 0`)
    }

    // Get products
    let allProducts = await db
      .select()
      .from(products)
      .where(and(...conditions))

    // Search filter (applied in memory for simplicity)
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      allProducts = allProducts.filter(
        product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.slug.toLowerCase().includes(searchLower)
      )
    }

    // Get inventory status for each product
    const productsWithInventory = await Promise.all(
      allProducts.map(async product => {
        try {
          const inventoryStatus = await getInventoryStatus(product.id)
          return {
            ...product,
            inventory: inventoryStatus,
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error getting inventory for product ${product.id}:`, error)
          return {
            ...product,
            inventory: {
              status: 'in_stock' as const,
              availableQuantity: product.stockQuantity,
              stockQuantity: product.stockQuantity,
              reservedQuantity: 0,
              lowStockThreshold: product.lowStockThreshold,
            },
          }
        }
      })
    )

    return productsWithInventory
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching inventory data:', error)
    return []
  }
}

export default async function InventoryManagementPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filter = searchParams.filter || 'all'
  const search = searchParams.search || ''

  const inventoryData = await getInventoryData({ filter, search })

  // Calculate stats
  const totalProducts = inventoryData.length
  const lowStockCount = inventoryData.filter(
    p => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0
  ).length
  const outOfStockCount = inventoryData.filter(p => p.stockQuantity === 0).length
  const totalReserved = inventoryData.reduce((sum, p) => sum + p.inventory.reservedQuantity, 0)

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Inventory Management</h1>
        <p>Manage product stock levels and reservations</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Products</p>
          <p className={`${styles.statValue} ${styles.statValueDefault}`}>{totalProducts}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Low Stock</p>
          <p className={`${styles.statValue} ${styles.statValueWarning}`}>{lowStockCount}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Out of Stock</p>
          <p className={`${styles.statValue} ${styles.statValueDanger}`}>{outOfStockCount}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Reserved</p>
          <p className={`${styles.statValue} ${styles.statValueInfo}`}>{totalReserved}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <InventoryTable initialData={inventoryData} initialFilter={filter} initialSearch={search} />
    </div>
  )
}
