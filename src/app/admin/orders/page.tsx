/**
 * Admin Order Management Page
 * View and manage all orders
 */

import { db } from '@/db'
import { orders, orderItems } from '@/db/schema-pg'
import { sql, eq, and, desc, or, ilike } from 'drizzle-orm'
import OrderTable from '@/components/admin/orders/OrderTable'
import styles from './orders.module.css'

export const dynamic = 'force-dynamic'

interface SearchParams {
  filter?: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  search?: string
}

async function getOrdersData(params: SearchParams) {
  try {
    // Build where conditions
    const conditions = []

    // Filter by order status
    if (params.filter && params.filter !== 'all') {
      conditions.push(eq(orders.status, params.filter))
    }

    // Get all orders with item counts
    let allOrders = await db
      .select({
        order: orders,
        itemCount: sql<number>`cast(count(${orderItems.id}) as integer)`,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt))

    // Search filter (applied in memory for simplicity)
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      allOrders = allOrders.filter(item => {
        const customer = item.order.customer as any
        return (
          item.order.orderNumber.toLowerCase().includes(searchLower) ||
          customer.name?.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Transform data to include item count
    const ordersWithDetails = allOrders.map(item => ({
      ...item.order,
      itemCount: item.itemCount || 0,
    }))

    return ordersWithDetails
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching orders data:', error)
    return []
  }
}

export default async function OrderManagementPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filter = searchParams.filter || 'all'
  const search = searchParams.search || ''

  const ordersData = await getOrdersData({ filter, search })

  // Calculate stats
  const totalOrders = ordersData.length
  const pendingCount = ordersData.filter(o => o.status === 'pending').length
  const processingCount = ordersData.filter(o => o.status === 'processing').length
  const shippedCount = ordersData.filter(o => o.status === 'shipped').length
  const deliveredCount = ordersData.filter(o => o.status === 'delivered').length
  const cancelledCount = ordersData.filter(o => o.status === 'cancelled').length

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Order Management</h1>
        <p>View and manage customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Orders</p>
          <p className={`${styles.statValue} ${styles.statValueDefault}`}>{totalOrders}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pending</p>
          <p className={`${styles.statValue} ${styles.statValuePending}`}>{pendingCount}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Processing</p>
          <p className={`${styles.statValue} ${styles.statValueProcessing}`}>{processingCount}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Shipped</p>
          <p className={`${styles.statValue} ${styles.statValueShipped}`}>{shippedCount}</p>
        </div>
      </div>

      {/* Orders Table */}
      <OrderTable initialData={ordersData} initialFilter={filter} initialSearch={search} />
    </div>
  )
}
