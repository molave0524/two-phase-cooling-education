'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import styles from './EnvironmentInfo.module.css'

interface EnvironmentData {
  environment: string
  git: {
    branch: string
    commit: string
    commitShort: string
    commitDate: string
    commitMessage: string
  }
  versions: {
    app: string
    node: string
    nextjs: string
    database: string
  }
  deployment: {
    deployedAt: string
    deployedBy?: string
    buildNumber?: string
  }
}

async function fetchEnvironment(): Promise<EnvironmentData> {
  const response = await fetch('/api/devops/environment')
  if (!response.ok) {
    throw new Error('Failed to fetch environment data')
  }
  const data = await response.json()
  return data
}

export function EnvironmentInfo() {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['devops', 'environment'],
    queryFn: fetchEnvironment,
    staleTime: 5000, // Reduced for debugging
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
          <span className={styles.sectionIcon}>📊</span>
          <span>Environment</span>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className={styles.sectionContent}>
            <div className={styles.errorMessage}>Failed to load environment data</div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
          <span className={styles.sectionIcon}>📊</span>
          <span>Environment</span>
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

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const formatCommitDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.sectionIcon}>📊</span>
        <span>Environment</span>
        <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className={styles.sectionContent}>
          <InfoItem label='Environment' value={data.environment.toUpperCase()} />
          <InfoItem
            label='Branch'
            value={data.git.branch}
            onCopy={() => handleCopy(data.git.branch)}
          />
          <InfoItem
            label='Commit'
            value={data.git.commitShort}
            title={data.git.commit}
            onCopy={() => handleCopy(data.git.commit)}
          />
          <InfoItem
            label='Commit Date'
            value={formatCommitDate(data.git.commitDate)}
            title={data.git.commitDate}
          />
          <InfoItem label='Version' value={data.versions.app} />
          <InfoItem label='Node.js' value={data.versions.node} />
          <InfoItem label='Next.js' value={data.versions.nextjs} />
        </div>
      )}
    </div>
  )
}

interface InfoItemProps {
  label: string
  value: string
  title?: string
  onCopy?: () => void
}

function InfoItem({ label, value, title, onCopy }: InfoItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onCopy) {
      e.preventDefault()
      onCopy()
    }
  }

  return (
    <div
      className={styles.infoItem}
      onClick={onCopy}
      onKeyDown={handleKeyDown}
      title={title || value}
      role={onCopy ? 'button' : undefined}
      tabIndex={onCopy ? 0 : undefined}
    >
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}
