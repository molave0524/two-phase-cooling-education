'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './DevOpsDrawer.module.css'
import { HealthStatus } from './sections/HealthStatus'
import { EnvironmentInfo } from './sections/EnvironmentInfo'
import { DatabaseInspector } from './sections/DatabaseInspector'
import { ConfigStatus } from './sections/ConfigStatus'

interface DevOpsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function DevOpsDrawer({ isOpen, onClose }: DevOpsDrawerProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [environment, setEnvironment] = useState<string>('local')

  // Fetch environment on mount
  useEffect(() => {
    fetch('/api/devops/environment/detect')
      .then(res => res.json())
      .then(data => setEnvironment(data.environment))
      .catch(() => setEnvironment('unknown'))
  }, [])

  // Update timestamp periodically
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className={styles.drawer}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <span>⚙️</span>
                <span>DevOps Console</span>
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label='Close drawer'>
                ×
              </button>
            </div>

            {/* Content */}
            <div className={styles.drawerContent}>
              <HealthStatus />
              <EnvironmentInfo />
              <DatabaseInspector />
              <ConfigStatus />
            </div>

            {/* Footer */}
            <div className={styles.drawerFooter}>
              <div className={styles.lastUpdated}>Updated {getTimeSinceUpdate()}</div>
              <div className={styles.footerActions}>
                {environment === 'local' && (
                  <a
                    href='/devops/schema-comparison'
                    className={styles.dbBtn}
                    aria-label='Open Schema Comparison'
                  >
                    🗄️ DB
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
