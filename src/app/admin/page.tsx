/**
 * Admin Dashboard Home Page
 * Overview of key metrics and quick actions
 */

import Link from 'next/link'
import {
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { db } from '@/db'
import { products, orders, inventoryReservations } from '@/db/schema-pg'
import { users } from '@/db/schemas/auth'
import { sql, count, eq, and, lt } from 'drizzle-orm'
import styles from './admin.module.css'

async function getDashboardStats() {
  try {
    const [productsCount] = await db.select({ count: count() }).from(products)
    const lowStockProducts = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
        )
      )
    const [ordersCount] = await db.select({ count: count() }).from(orders)
    const [pendingOrders] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'))
    const [customersCount] = await db.select({ count: count() }).from(users)
    const [activeReservations] = await db
      .select({ count: count() })
      .from(inventoryReservations)
      .where(eq(inventoryReservations.status, 'active'))
    const [expiredReservations] = await db
      .select({ count: count() })
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.status, 'active'),
          lt(inventoryReservations.expiresAt, new Date())
        )
      )

    return {
      totalProducts: productsCount.count,
      lowStockProducts: lowStockProducts[0].count,
      totalOrders: ordersCount.count,
      pendingOrders: pendingOrders.count,
      totalCustomers: customersCount.count,
      activeReservations: activeReservations.count,
      expiredReservations: expiredReservations.count,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching dashboard stats:', error)
    return {
      totalProducts: 0,
      lowStockProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalCustomers: 0,
      activeReservations: 0,
      expiredReservations: 0,
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      href: '/admin/inventory',
      description: `${stats.lowStockProducts} low stock`,
      color: 'primary',
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      href: '/admin/orders',
      description: `${stats.pendingOrders} pending`,
      color: 'success',
    },
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      href: '/admin/customers',
      description: 'Registered users',
      color: 'info',
    },
    {
      name: 'Active Reservations',
      value: stats.activeReservations,
      icon: ClockIcon,
      href: '/admin/reservations',
      description: `${stats.expiredReservations} expired`,
      color: 'warning',
    },
  ]

  const alerts = [
    ...(stats.lowStockProducts > 0
      ? [
          {
            type: 'warning' as const,
            message: `${stats.lowStockProducts} products are low on stock`,
            href: '/admin/inventory?filter=low_stock',
          },
        ]
      : []),
    ...(stats.expiredReservations > 0
      ? [
          {
            type: 'info' as const,
            message: `${stats.expiredReservations} expired reservations need cleanup`,
            href: '/admin/reservations?filter=expired',
          },
        ]
      : []),
    ...(stats.pendingOrders > 0
      ? [
          {
            type: 'info' as const,
            message: `${stats.pendingOrders} orders are pending`,
            href: '/admin/orders?status=pending',
          },
        ]
      : []),
  ]

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Welcome to your admin dashboard</p>
      </div>

      {alerts.length > 0 && (
        <div className={styles.alerts}>
          {alerts.map((alert, index) => (
            <Link
              key={index}
              href={alert.href}
              className={`${styles.alert} ${alert.type === 'warning' ? styles.alertWarning : styles.alertInfo}`}
            >
              <ExclamationTriangleIcon className={styles.alertIcon} />
              <span className={styles.alertMessage}>{alert.message}</span>
              <ArrowTrendingUpIcon className={styles.alertArrow} />
            </Link>
          ))}
        </div>
      )}

      <div className={styles.statsGrid}>
        {statCards.map(stat => {
          const Icon = stat.icon
          const iconColorClass =
            styles[`icon${stat.color.charAt(0).toUpperCase() + stat.color.slice(1)}`]

          return (
            <Link key={stat.name} href={stat.href} className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div className={`${styles.statIcon} ${iconColorClass}`}>
                  <Icon />
                </div>
              </div>

              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{stat.value}</h3>
                <p className={styles.statName}>{stat.name}</p>
                <p className={styles.statDescription}>{stat.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link href='/admin/inventory' className={styles.actionCard}>
            <CubeIcon className={`${styles.actionIcon} ${styles.actionIconPrimary}`} />
            <div className={styles.actionContent}>
              <p>Manage Inventory</p>
              <p>Update stock levels</p>
            </div>
          </Link>

          <Link href='/admin/orders' className={styles.actionCard}>
            <ShoppingBagIcon className={`${styles.actionIcon} ${styles.actionIconSuccess}`} />
            <div className={styles.actionContent}>
              <p>View Orders</p>
              <p>Process pending orders</p>
            </div>
          </Link>

          <Link href='/admin/reservations' className={styles.actionCard}>
            <ClockIcon className={`${styles.actionIcon} ${styles.actionIconWarning}`} />
            <div className={styles.actionContent}>
              <p>Reservations</p>
              <p>Manage inventory holds</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
