/**
 * Admin Analytics Dashboard Page
 * Analytics and reporting dashboard
 */

import { db } from '@/db'
import { products, orders, orderItems } from '@/db/schema-pg'
import { users } from '@/db/schemas/auth'
import { sql, count, eq, and, gte, desc, sum } from 'drizzle-orm'
import {
  ShoppingBagIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import styles from './analytics.module.css'

export const dynamic = 'force-dynamic'

async function getAnalyticsData() {
  try {
    // Get total revenue
    const [revenueResult] = await db
      .select({
        total: sql<number>`cast(coalesce(sum(${orders.total}), 0) as decimal(10,2))`,
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'))

    // Get total orders
    const [ordersResult] = await db.select({ count: count() }).from(orders)

    // Get total customers
    const [customersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'customer'))

    // Get average order value
    const [avgOrderResult] = await db
      .select({
        avg: sql<number>`cast(coalesce(avg(${orders.total}), 0) as decimal(10,2))`,
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'))

    // Get top selling products
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        productSku: orderItems.productSku,
        totalQuantity: sql<number>`cast(sum(${orderItems.quantity}) as integer)`,
        totalRevenue: sql<number>`cast(sum(${orderItems.lineTotal}) as decimal(10,2))`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.paymentStatus, 'paid'))
      .groupBy(orderItems.productId, orderItems.productName, orderItems.productSku)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5)

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        customer: orders.customer,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5)

    return {
      totalRevenue: Number(revenueResult.total) || 0,
      totalOrders: ordersResult.count || 0,
      totalCustomers: customersResult.count || 0,
      averageOrderValue: Number(avgOrderResult.avg) || 0,
      topProducts: topProducts || [],
      recentOrders: recentOrders || [],
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching analytics data:', error)
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      topProducts: [],
      recentOrders: [],
    }
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Analytics & Reports</h1>
        <p>Track your business performance and insights</p>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Total Revenue</p>
          <p className={styles.metricValue}>{formatCurrency(data.totalRevenue)}</p>
          <div className={`${styles.metricChange} ${styles.metricChangePositive}`}>
            <span>All time</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Total Orders</p>
          <p className={styles.metricValue}>{data.totalOrders}</p>
          <div className={`${styles.metricChange} ${styles.metricChangeNeutral}`}>
            <span>All time</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Total Customers</p>
          <p className={styles.metricValue}>{data.totalCustomers}</p>
          <div className={`${styles.metricChange} ${styles.metricChangeNeutral}`}>
            <span>Registered</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Avg. Order Value</p>
          <p className={styles.metricValue}>{formatCurrency(data.averageOrderValue)}</p>
          <div className={`${styles.metricChange} ${styles.metricChangeNeutral}`}>
            <span>Per order</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* Revenue Chart */}
        <div className={styles.chartCard}>
          <h3>Revenue Overview</h3>
          <div className={styles.chartPlaceholder}>Chart visualization coming soon</div>
        </div>

        {/* Top Products */}
        <div className={styles.chartCard}>
          <h3>Top Products</h3>
          {data.topProducts.length === 0 ? (
            <div className={styles.chartPlaceholder}>No sales data yet</div>
          ) : (
            <table className={styles.topProductsTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={product.productId || index}>
                    <td>
                      <div className={styles.productName}>{product.productName}</div>
                      <div className={styles.productSales}>SKU: {product.productSku}</div>
                    </td>
                    <td>{product.totalQuantity}</td>
                    <td className={styles.productRevenue}>
                      {formatCurrency(Number(product.totalRevenue))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <h3>Recent Orders</h3>
        {data.recentOrders.length === 0 ? (
          <div className={styles.chartPlaceholder}>No recent orders</div>
        ) : (
          <div className={styles.activityList}>
            {data.recentOrders.map(order => {
              const customer = order.customer as any
              return (
                <div key={order.id} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles.activityIconOrder}`}>
                    <ShoppingBagIcon />
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>Order {order.orderNumber}</p>
                    <p className={styles.activityDescription}>
                      {customer.name || customer.email} • {formatCurrency(order.total)} •{' '}
                      {order.status}
                    </p>
                  </div>
                  <div className={styles.activityTime}>{formatDate(order.createdAt)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
