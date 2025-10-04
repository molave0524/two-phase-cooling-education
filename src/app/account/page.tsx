/**
 * Account Dashboard Page
 * Main account management page with tabbed interface
 */

'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Tab } from '@headlessui/react'
import { UserIcon, ShieldCheckIcon, MapPinIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import ProfileSection from '@/components/account/ProfileSection'
import SecuritySection from '@/components/account/SecuritySection'
import AddressesSection from '@/components/account/AddressesSection'
import OrdersSection from '@/components/account/OrdersSection'
import styles from './page.module.css'

const tabs = [
  { name: 'Profile', icon: UserIcon, component: ProfileSection },
  { name: 'Security', icon: ShieldCheckIcon, component: SecuritySection },
  { name: 'Addresses', icon: MapPinIcon, component: AddressesSection },
  { name: 'Orders', icon: ShoppingBagIcon, component: OrdersSection },
]

export default function AccountPage() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin?callbackUrl=/account')
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <UserIcon className={styles.titleIcon} />
            <h1 className={styles.title}>My Account</h1>
          </div>
        </div>

        <Tab.Group>
          {/* Enhanced Tab Navigation */}
          <Tab.List className={styles.tabList}>
            {tabs.map(tab => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `${styles.tab} ${selected ? styles.tabActive : styles.tabInactive}`
                }
              >
                <tab.icon className={styles.tabIcon} />
                <span className={styles.tabLabel}>{tab.name}</span>
              </Tab>
            ))}
          </Tab.List>

          {/* Enhanced Tab Panels */}
          <Tab.Panels>
            {tabs.map(tab => (
              <Tab.Panel key={tab.name}>
                <tab.component />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}
