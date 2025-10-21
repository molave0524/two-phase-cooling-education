/**
 * Admin Layout
 * Layout for all admin dashboard pages
 */

import { Metadata } from 'next'
import RequireAdmin from '@/components/admin/RequireAdmin'
import AdminNav from '@/components/admin/AdminNav'
import styles from './admin.module.css'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Two Phase Cooling',
  description: 'Admin dashboard for managing products, orders, and customers',
  robots: 'noindex, nofollow', // Don't index admin pages
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className={styles.layout}>
        {/* Admin Navigation */}
        <AdminNav />

        {/* Main Content */}
        <main className={styles.main}>{children}</main>
      </div>
    </RequireAdmin>
  )
}
