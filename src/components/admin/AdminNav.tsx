/**
 * Admin Navigation Component
 * Navigation bar for admin dashboard
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import styles from './AdminNav.module.css'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Inventory', href: '/admin/inventory', icon: CubeIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Reservations', href: '/admin/reservations', icon: ClockIcon },
]

export default function AdminNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          {/* Logo and Title */}
          <div className={styles.logoSection}>
            <Link href='/admin' className={styles.logoLink}>
              Admin Dashboard
            </Link>
            <div className={styles.adminBadge}>Admin</div>
          </div>

          {/* Navigation Links */}
          <div className={styles.navLinks}>
            {navItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${active ? styles.active : ''}`}
                >
                  <Icon />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className={styles.userMenu}>
            <div className={styles.userName}>
              <span>{session?.user?.name || session?.user?.email}</span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className={styles.signOutButton}
              title='Sign out'
            >
              <ArrowRightOnRectangleIcon />
              <span className={styles.signOutText}>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={styles.mobileNav}>
          <div className={styles.mobileNavLinks}>
            {navItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.mobileNavLink} ${active ? styles.active : ''}`}
                >
                  <Icon />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
