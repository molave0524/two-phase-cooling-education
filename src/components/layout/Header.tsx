'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/stores/cartStore'

// Simple navigation data
const MAIN_NAVIGATION = [
  { label: 'Videos', href: '/#videos' },
  { label: 'Technology', href: '/#technology' },
  { label: 'AI Assistant', href: '/#ai-assistant' },
  { label: 'Products', href: '/#product' },
  { label: 'FAQ', href: '/faq' },
]

// Mobile Menu Component
const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '300px',
          height: '100%',
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 100000,
        }}
      >
        {/* Close Button Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '24px',
              fontWeight: 'normal',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              width: '40px',
              height: '40px',
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.color = '#374151'
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <div style={{ padding: '20px' }}>
          <h3
            style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#111827',
            }}
          >
            Navigation
          </h3>
          {MAIN_NAVIGATION.map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'block',
                padding: '15px',
                color: '#111827',
                textDecoration: 'none',
                borderRadius: '6px',
                marginBottom: '10px',
                fontSize: '16px',
                fontWeight: '500',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.color = '#0ea5e9'
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#111827'
              }}
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
      setIsMobile(window.innerWidth < 768)
    }

    // Check on mount
    checkScreenSize()

    // Add resize listener
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
        }}
      >
        {/* Logo */}
        <Link
          href='/'
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#374151',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#0ea5e9',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            2PC
          </div>
          <span>Two-Phase Cooling</span>
        </Link>

        {/* Desktop Navigation - Centered */}
        {!isMobile && (
          <nav
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '2rem',
            }}
          >
            {MAIN_NAVIGATION.map(item => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Section - Cart and Mobile Menu */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Cart Icon */}
          <Link
            href='/cart'
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#374151',
              textDecoration: 'none',
              fontSize: '16px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
              e.currentTarget.style.color = 'white'
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.color = '#374151'
            }}
            title={`Shopping Cart (${itemCount} items)`}
          >
            🛒
            {isHydrated && itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Bars3Icon style={{ width: '20px', height: '20px', color: '#374151' }} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  )
}
