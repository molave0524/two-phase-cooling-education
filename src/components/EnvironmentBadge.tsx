/**
 * Environment Badge Component
 * Displays current environment (DEV/UAT/PROD) for testing multi-env setup
 */

'use client'

import { useState, useEffect } from 'react'
import { DevOpsDrawer } from './devops/DevOpsDrawer'

export function EnvironmentBadge() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [envLabel, setEnvLabel] = useState('LOCAL')
  const [bgColor, setBgColor] = useState('#6b7280')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Fetch environment detection from API
    fetch('/api/devops/environment/detect')
      .then(res => res.json())
      .then(data => {
        const env = data.environment.toUpperCase()
        setEnvLabel(env)

        // Hide in PROD environment
        if (env === 'PROD') {
          setIsVisible(false)
        }

        // Set colors based on environment
        const colors: Record<string, string> = {
          LOCAL: '#6b7280', // gray
          DEV: '#3b82f6', // blue
          UAT: '#f59e0b', // orange
          PROD: '#10b981', // green
          PREVIEW: '#8b5cf6', // purple
        }
        setBgColor(colors[env] || '#6b7280')
      })
      .catch(() => {
        // Fallback to LOCAL on error
        setEnvLabel('LOCAL')
        setBgColor('#6b7280')
      })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsDrawerOpen(true)
    }
  }

  // Don't render anything in PROD
  if (!isVisible) {
    return null
  }

  return (
    <>
      <div
        onClick={() => setIsDrawerOpen(true)}
        onKeyDown={handleKeyDown}
        role='button'
        tabIndex={0}
        aria-label='Open DevOps Console'
        style={{
          position: 'fixed',
          top: '10px',
          left: '80px',
          padding: '8px 16px',
          backgroundColor: bgColor,
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <span>💻</span>
        <span>{envLabel}</span>
      </div>

      <DevOpsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  )
}
