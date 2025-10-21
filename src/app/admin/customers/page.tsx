/**
 * Admin Customer Management Page
 * View and manage all customers
 */

import { db } from '@/db'
import { users } from '@/db/schemas/auth'
import { orders } from '@/db/schema-pg'
import { sql, eq, desc } from 'drizzle-orm'
import CustomerTable from '@/components/admin/customers/CustomerTable'
import styles from './customers.module.css'

export const dynamic = 'force-dynamic'

interface SearchParams {
  filter?: 'all' | 'customer' | 'admin'
  search?: string
}

async function getCustomersData(params: SearchParams) {
  try {
    // Build where conditions
    const conditions = []

    // Filter by role
    if (params.filter && params.filter !== 'all') {
      conditions.push(eq(users.role, params.filter))
    }

    // Get all users with order counts
    let allCustomers = await db
      .select({
        user: users,
        orderCount: sql<number>`cast(count(${orders.id}) as integer)`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))

    // Search filter (applied in memory for simplicity)
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      allCustomers = allCustomers.filter((item: any) => {
        return (
          item.user.name?.toLowerCase().includes(searchLower) ||
          item.user.email?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Transform data to include order count
    const customersWithDetails = allCustomers.map((item: any) => ({
      ...item.user,
      orderCount: item.orderCount || 0,
    }))

    return customersWithDetails
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching customers data:', error)
    return []
  }
}

export default async function CustomerManagementPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filter = searchParams.filter || 'all'
  const search = searchParams.search || ''

  const customersData = await getCustomersData({ filter, search })

  // Calculate stats
  const totalCustomers = customersData.length
  const customerCount = customersData.filter((c: any) => c.role === 'customer').length
  const adminCount = customersData.filter((c: any) => c.role === 'admin').length
  const totalOrders = customersData.reduce((sum: number, c: any) => sum + c.orderCount, 0)

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Customer Management</h1>
        <p>View and manage customer accounts</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Users</p>
          <p className={`${styles.statValue} ${styles.statValueDefault}`}>{totalCustomers}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Customers</p>
          <p className={`${styles.statValue} ${styles.statValueSuccess}`}>{customerCount}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Admins</p>
          <p className={`${styles.statValue} ${styles.statValueInfo}`}>{adminCount}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Orders</p>
          <p className={`${styles.statValue} ${styles.statValueWarning}`}>{totalOrders}</p>
        </div>
      </div>

      {/* Customers Table */}
      <CustomerTable initialData={customersData} initialFilter={filter} initialSearch={search} />
    </div>
  )
}
