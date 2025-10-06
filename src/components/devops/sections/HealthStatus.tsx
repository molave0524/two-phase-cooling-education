'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import styles from './HealthStatus.module.css'

interface ServiceStatus {
  status: 'healthy' | 'unhealthy'
  latency?: number
  mode?: string
  provider?: string
  quotaRemaining?: number
}

interface HealthData {
  timestamp: string
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: ServiceStatus
    ai: ServiceStatus
    stripe: ServiceStatus
    email: ServiceStatus
  }
}

async function fetchHealth(): Promise<HealthData> {
  const response = await fetch('/api/devops/health')
  if (!response.ok) {
    throw new Error('Failed to fetch health data')
  }
  return response.json()
}

export function HealthStatus() {
  const [isExpanded, setIsExpanded] = useState(true)

  const { data, isLoading, error } = useQuery({
    queryKey: ['devops', 'health'],
    queryFn: fetchHealth,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  })

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
          <span className={styles.sectionIcon}>💚</span>
          <span>System Health</span>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className={styles.sectionContent}>
            <div className={styles.errorMessage}>Failed to load health data</div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
          <span className={styles.sectionIcon}>💚</span>
          <span>System Health</span>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className={styles.sectionContent}>
            <div className={styles.loadingMessage}>Loading...</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.sectionIcon}>💚</span>
        <span>System Health</span>
        <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className={styles.sectionContent}>
        <StatusItem
          label='Database'
          status={data.services.database.status}
          {...(data.services.database.latency && {
            detail: `${data.services.database.latency}ms`,
          })}
        />
        <StatusItem
          label={`AI (${data.services.ai.provider || 'Unknown'})`}
          status={data.services.ai.status}
          detail={data.services.ai.status === 'healthy' ? 'OK' : 'Not configured'}
        />
        <StatusItem
          label='Stripe'
          status={data.services.stripe.status}
          detail={data.services.stripe.mode || 'Unknown'}
        />
        <StatusItem
          label='Email'
          status={data.services.email.status}
          detail={data.services.email.provider || 'Unknown'}
        />
        </div>
      )}
    </div>
  )
}

interface StatusItemProps {
  label: string
  status: 'healthy' | 'unhealthy'
  detail?: string
}

function StatusItem({ label, status, detail }: StatusItemProps) {
  return (
    <div className={styles.statusItem}>
      <div className={`${styles.statusIndicator} ${styles[status]}`} />
      <div className={styles.statusLabel}>{label}</div>
      {detail && <div className={styles.statusValue}>{detail}</div>}
    </div>
  )
}
