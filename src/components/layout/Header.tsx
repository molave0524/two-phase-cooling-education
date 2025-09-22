'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bars3Icon,
  XMarkIcon,
  BeakerIcon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  BookOpenIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useCartStore } from '@/lib/stores/cart-store'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface NavigationItem {
  label: string
  href?: string
  icon?: React.ReactNode
  children?: NavigationItem[]
  description?: string
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigation: NavigationItem[]
}

// ============================================================================
// NAVIGATION DATA
// ============================================================================

const MAIN_NAVIGATION: NavigationItem[] = [
  {
    label: 'Technology',
    href: '#technology'
  },
  {
    label: 'Demonstrations',
    href: '#demonstrations'
  },
  {
    label: 'Performance',
    href: '#performance'
  },
  {
    label: 'AI Assistant',
    href: '#ai-assistant'
  },
  {
    label: 'Products',
    href: '#product'
  }
]

// ============================================================================
// MOBILE MENU COMPONENT
// ============================================================================

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navigation }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <div className="flex items-center gap-2">
            <BeakerIcon className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-secondary-900">Thermal Ed Center</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-technical"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto h-full pb-20">
          {navigation.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className="w-full flex items-center justify-between p-3 text-left text-secondary-900 hover:bg-secondary-50 rounded-technical"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${
                        expandedItems.includes(item.label) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedItems.includes(item.label) && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href || '#'}
                          onClick={onClose}
                          className="block p-2 text-sm text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-technical"
                        >
                          <div className="font-medium">{child.label}</div>
                          {child.description && (
                            <div className="text-xs text-secondary-500 mt-0.5">
                              {child.description}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href || '#'}
                  onClick={onClose}
                  className="flex items-center gap-2 p-3 text-secondary-900 hover:bg-secondary-50 rounded-technical"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              )}
            </div>
          ))}

          {/* Mobile CTA */}
          <div className="pt-6 mt-6 border-t border-secondary-200 space-y-3">
            <Link
              href="#demonstrations"
              onClick={onClose}
              className="btn-primary w-full justify-center"
            >
              <PlayCircleIcon className="w-4 h-4 mr-2" />
              Watch Demos
            </Link>
            <Link
              href="#ai-assistant"
              onClick={onClose}
              className="btn-secondary w-full justify-center"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Ask AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DROPDOWN MENU COMPONENT
// ============================================================================

const DropdownMenu: React.FC<{ item: NavigationItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 px-4 py-2 text-secondary-700 hover:text-primary-600 font-medium transition-colors"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {item.icon}
        <span>{item.label}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && item.children && (
        <div
          className="absolute top-full left-0 mt-1 w-80 bg-white shadow-xl border border-secondary-200 rounded-equipment overflow-hidden z-50"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-4 space-y-2">
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href || '#'}
                className="block p-3 hover:bg-primary-50 rounded-technical group"
              >
                <div className="font-medium text-secondary-900 group-hover:text-primary-600">
                  {child.label}
                </div>
                {child.description && (
                  <div className="text-sm text-secondary-600 mt-1">
                    {child.description}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const cartItemCount = useCartStore(state => state.itemCount)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-black/10'
            : 'bg-transparent'
        }`}
      >
        <div className="container-max">
          <div className="flex items-center justify-between py-4">
            {/* Apple-style Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-60 transition-opacity duration-200">
              {/* Simple, clean logo like Apple */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-secondary-900 rounded-full flex items-center justify-center">
                  <BeakerIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg text-secondary-900">ThermalPro</span>
              </div>
            </Link>

            {/* Apple-style Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {MAIN_NAVIGATION.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <DropdownMenu item={item} />
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className="text-sm font-normal text-black hover:text-black/80 transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Apple-style Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Cart - Apple style */}
              <Link
                href="#cart"
                className="relative text-black hover:text-black/80 transition-colors duration-200"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 lg:hidden">
              {/* Mobile Cart */}
              <Link
                href="#cart"
                className="relative p-2 text-secondary-600 hover:text-primary-600 transition-colors"
              >
                <ShoppingBagIcon className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-technical"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigation={MAIN_NAVIGATION}
      />
    </>
  )
}