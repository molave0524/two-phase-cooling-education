'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useSession, signOut } from 'next-auth/react'
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
const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void; session: any }> = ({
  isOpen,
  onClose,
  session,
}) => {
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

          {/* Account Link for Mobile */}
          {session ? (
            <>
              <Link href='/account' onClick={onClose} className={styles.mobileNavLink}>
                My Account
              </Link>
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/' })
                  onClose()
                }}
                className={styles.mobileNavLink}
                style={{ textAlign: 'left', width: '100%' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href='/auth/signin' onClick={onClose} className={styles.mobileNavLink}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true) // Default to mobile
  const [isHydrated, setIsHydrated] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const { data: session } = useSession()
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
          {/* Desktop Account Menu */}
          {!isMobile && isHydrated && (
            <div style={{ position: 'relative' }}>
              {session ? (
                <>
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className={styles.navLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <UserCircleIcon style={{ width: '24px', height: '24px' }} />
                    <span>{session.user?.name || 'Account'}</span>
                  </button>
                  {showAccountMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        minWidth: '200px',
                        zIndex: 50,
                      }}
                    >
                      <Link
                        href='/account'
                        onClick={() => setShowAccountMenu(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: '#374151',
                          textDecoration: 'none',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/' })
                          setShowAccountMenu(false)
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          color: '#dc2626',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link href='/auth/signin' className={styles.navLink}>
                  Sign In
                </Link>
              )}
            </div>
          )}

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
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        session={session}
      />
    </>
  )
}
