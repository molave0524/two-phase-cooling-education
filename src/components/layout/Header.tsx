'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/stores/cartStore'
import { UI, CART_BADGE } from '@/constants'
import styles from './Header.module.css'

// Simple navigation data
const MAIN_NAVIGATION = [
  { label: 'Videos', href: '/#videos' },
  { label: 'Technology', href: '/#technology' },
  { label: 'Products', href: '/#product' },
  { label: 'FAQ', href: '/faq' },
]

// Mobile Menu Component
const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className={styles.mobileMenuOverlay}>
      {/* Menu Panel */}
      <div className={styles.mobileMenuPanel}>
        {/* Close Button Header */}
        <div className={styles.mobileMenuHeader}>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <div className={styles.mobileMenuContent}>
          <h3 className={styles.mobileMenuTitle}>Navigation</h3>
          {MAIN_NAVIGATION.map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={styles.mobileNavLink}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true) // Default to mobile
  const [isHydrated, setIsHydrated] = useState(false)
  const itemCount = useCartStore(state => state.itemCount)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < UI.MOBILE_BREAKPOINT)
    }

    // Check on mount
    checkScreenSize()

    // Add resize listener
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <>
      <header className={styles.header}>
        {/* Logo */}
        <Link href='/' className={styles.logoLink}>
          <div className={styles.logoIcon}>2PC</div>
        </Link>

        {/* Desktop Navigation - Centered */}
        {!isMobile && (
          <nav className={styles.desktopNav}>
            {MAIN_NAVIGATION.map(item => (
              <Link key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Section - Cart and Mobile Menu */}
        <div className={styles.actionsSection}>
          {/* Cart Icon */}
          <Link
            href='/cart'
            className={styles.cartLink}
            title={`Shopping Cart (${itemCount} items)`}
          >
            🛒
            {isHydrated && itemCount > 0 && (
              <span className={styles.cartBadge}>
                {itemCount > CART_BADGE.MAX_DISPLAY_COUNT
                  ? `${CART_BADGE.MAX_DISPLAY_COUNT}+`
                  : itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          {isMobile && (
            <button onClick={() => setIsMobileMenuOpen(true)} className={styles.mobileMenuButton}>
              <Bars3Icon className={styles.hamburgerIcon} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}
