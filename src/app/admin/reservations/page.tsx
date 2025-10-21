/**
 * Admin Reservation Management Page
 * View and manage inventory reservations
 */

import { db } from '@/db'
import { inventoryReservations } from '@/db/schema-pg'
import { eq, count, lt, desc } from 'drizzle-orm'
import ReservationTable from '@/components/admin/reservations/ReservationTable'
import CleanupButton from '@/components/admin/reservations/CleanupButton'
import styles from './reservations.module.css'

export const dynamic = 'force-dynamic'

interface SearchParams {
  filter?: 'all' | 'active' | 'expired' | 'completed' | 'cancelled'
  search?: string
}

async function getReservationsData(params: SearchParams) {
  try {
    // Build where conditions
    const conditions = []
    const now = new Date()

    // Filter by status
    if (params.filter && params.filter !== 'all') {
      if (params.filter === 'expired') {
        // Expired = active status but past expiration time
        conditions.push(eq(inventoryReservations.status, 'active'))
        conditions.push(lt(inventoryReservations.expiresAt, now))
      } else {
        conditions.push(eq(inventoryReservations.status, params.filter))
      }
    }

    // Get all reservations
    let reservationResults = await db
      .select()
      .from(inventoryReservations)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(inventoryReservations.createdAt))

    // For non-expired filters, exclude truly expired ones
    if (params.filter !== 'expired' && params.filter !== 'all') {
      reservationResults = reservationResults.filter((r: any) => {
        if (r.status === 'active') {
          return new Date(r.expiresAt) > now
        }
        return true
      })
    }

    return reservationResults
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching reservations data:', error)
    return []
  }
}

async function getReservationStats() {
  try {
    const now = new Date()

    const [totalResult] = await db.select({ count: count() }).from(inventoryReservations)

    const [activeResult] = await db
      .select({ count: count() })
      .from(inventoryReservations)
      .where(eq(inventoryReservations.status, 'active'))

    const allActive = await db
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.status, 'active'))

    const expiredCount = allActive.filter((r: any) => new Date(r.expiresAt) < now).length
    const trueActiveCount = allActive.filter((r: any) => new Date(r.expiresAt) >= now).length

    const [completedResult] = await db
      .select({ count: count() })
      .from(inventoryReservations)
      .where(eq(inventoryReservations.status, 'completed'))

    return {
      total: totalResult.count,
      active: trueActiveCount,
      expired: expiredCount,
      completed: completedResult.count,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching reservation stats:', error)
    return {
      total: 0,
      active: 0,
      expired: 0,
      completed: 0,
    }
  }
}

export default async function ReservationManagementPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filter = searchParams.filter || 'all'
  const search = searchParams.search || ''

  const reservationsData = await getReservationsData({ filter, search })
  const stats = await getReservationStats()

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Reservation Management</h1>
        <p>Manage inventory reservations and holds</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Reservations</p>
          <p className={`${styles.statValue} ${styles.statValueDefault}`}>{stats.total}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Active</p>
          <p className={`${styles.statValue} ${styles.statValueActive}`}>{stats.active}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Expired</p>
          <p className={`${styles.statValue} ${styles.statValueExpired}`}>{stats.expired}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Completed</p>
          <p className={`${styles.statValue} ${styles.statValueCompleted}`}>{stats.completed}</p>
        </div>
      </div>

      {/* Actions Bar */}
      {stats.expired > 0 && (
        <div className={styles.actionsBar}>
          <p>
            <strong>{stats.expired}</strong> expired reservations can be cleaned up to free
            inventory
          </p>
          <CleanupButton />
        </div>
      )}

      {/* Reservations Table */}
      <ReservationTable
        initialData={reservationsData}
        initialFilter={filter}
        initialSearch={search}
      />
    </div>
  )
}
