/**
 * Environment Badge Component
 * Displays current environment (DEV/UAT/PROD) for testing multi-env setup
 */

'use client'

import { useState } from 'react'
import { DevOpsDrawer } from './devops/DevOpsDrawer'

export function EnvironmentBadge() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const isVercel = process.env.VERCEL === '1'
  const vercelEnv = process.env.VERCEL_ENV || 'unknown'
  const gitBranch = process.env.VERCEL_GIT_COMMIT_REF || ''

  // Determine environment label
  let envLabel = 'LOCAL'
  let bgColor = '#6b7280' // gray

  if (isVercel) {
    if (vercelEnv === 'production') {
      envLabel = 'PROD'
      bgColor = '#10b981' // green
    } else if (vercelEnv === 'preview') {
      // Use git branch to determine environment
      if (gitBranch === 'develop') {
        envLabel = 'DEV'
        bgColor = '#3b82f6' // blue
      } else if (gitBranch === 'uat') {
        envLabel = 'UAT'
        bgColor = '#f59e0b' // orange
      } else {
        envLabel = 'PREVIEW'
        bgColor = '#8b5cf6' // purple
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsDrawerOpen(true)
    }
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
