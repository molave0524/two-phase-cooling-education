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

const tabs = [
  { name: 'Profile', icon: UserIcon, component: ProfileSection },
  { name: 'Security', icon: ShieldCheckIcon, component: SecuritySection },
  { name: 'Addresses', icon: MapPinIcon, component: AddressesSection },
  { name: 'Orders', icon: ShoppingBagIcon, component: OrdersSection },
]

export default function AccountPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin?callbackUrl=/account')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="mt-2 text-sm text-gray-600">Manage your profile, addresses, and orders</p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-8">
          {tabs.map(tab => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
                ${
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
                }`
              }
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {tabs.map(tab => (
            <Tab.Panel key={tab.name} className="rounded-xl bg-white p-6 shadow">
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
