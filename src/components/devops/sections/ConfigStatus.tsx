'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import styles from './ConfigStatus.module.css'

interface ConfigData {
  environment: {
    NODE_ENV: string
    VERCEL: string | null
    VERCEL_ENV: string | null
  }
  database: {
    POSTGRES_URL: string
    DATABASE_URL: string
  }
  services: {
    GEMINI_API_KEY: string
    STRIPE_SECRET_KEY: string
    STRIPE_PUBLISHABLE_KEY: string
    NEXTAUTH_SECRET: string
    NEXTAUTH_URL: string
  }
  email: {
    EMAIL_FROM: string
  }
  oauth: {
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    GITHUB_CLIENT_ID: string
    GITHUB_CLIENT_SECRET: string
  }
}

async function fetchConfig(): Promise<ConfigData> {
  const response = await fetch('/api/devops/config')
  if (!response.ok) {
    throw new Error('Failed to fetch config data')
  }
  return response.json()
}

export function ConfigStatus() {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['devops', 'config'],
    queryFn: fetchConfig,
    staleTime: 60000, // Config doesn't change often
  })

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
          <span className={styles.sectionIcon}>⚙️</span>
          <span>Configuration</span>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className={styles.sectionContent}>
            <div className={styles.errorMessage}>
              <strong>⚠️ Failed to load configuration</strong>
              <p className={styles.errorDetails}>
                Unable to fetch environment configuration. This may be due to a network issue or server error.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
          <span className={styles.sectionIcon}>⚙️</span>
          <span>Configuration</span>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className={styles.sectionContent}>
            <div className={styles.skeleton}>
              <div className={styles.skeletonGroup}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonItem}></div>
                <div className={styles.skeletonItem}></div>
                <div className={styles.skeletonItem}></div>
              </div>
              <div className={styles.skeletonGroup}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonItem}></div>
                <div className={styles.skeletonItem}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.sectionIcon}>⚙️</span>
        <span>Configuration</span>
        <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className={styles.sectionContent}>
          <div className={styles.configGroup}>
            <div className={styles.groupTitle}>Environment</div>
            <ConfigItem label='NODE_ENV' value={data.environment.NODE_ENV} />
            <ConfigItem label='VERCEL' value={data.environment.VERCEL || '❌ Not set'} />
            <ConfigItem label='VERCEL_ENV' value={data.environment.VERCEL_ENV || '❌ Not set'} />
          </div>

          <div className={styles.configGroup}>
            <div className={styles.groupTitle}>Database</div>
            <ConfigItem label='POSTGRES_URL' value={data.database.POSTGRES_URL} />
            <ConfigItem label='DATABASE_URL' value={data.database.DATABASE_URL} />
          </div>

          <div className={styles.configGroup}>
            <div className={styles.groupTitle}>Services</div>
            <ConfigItem label='GEMINI_API_KEY' value={data.services.GEMINI_API_KEY} />
            <ConfigItem label='STRIPE_SECRET_KEY' value={data.services.STRIPE_SECRET_KEY} />
            <ConfigItem
              label='STRIPE_PUBLISHABLE_KEY'
              value={data.services.STRIPE_PUBLISHABLE_KEY}
            />
            <ConfigItem label='NEXTAUTH_SECRET' value={data.services.NEXTAUTH_SECRET} />
            <ConfigItem label='NEXTAUTH_URL' value={data.services.NEXTAUTH_URL} />
          </div>

          <div className={styles.configGroup}>
            <div className={styles.groupTitle}>Email</div>
            <ConfigItem label='EMAIL_FROM' value={data.email.EMAIL_FROM} />
          </div>

          <div className={styles.configGroup}>
            <div className={styles.groupTitle}>OAuth</div>
            <ConfigItem label='GOOGLE_CLIENT_ID' value={data.oauth.GOOGLE_CLIENT_ID} />
            <ConfigItem label='GOOGLE_CLIENT_SECRET' value={data.oauth.GOOGLE_CLIENT_SECRET} />
            <ConfigItem label='GITHUB_CLIENT_ID' value={data.oauth.GITHUB_CLIENT_ID} />
            <ConfigItem label='GITHUB_CLIENT_SECRET' value={data.oauth.GITHUB_CLIENT_SECRET} />
          </div>
        </div>
      )}
    </div>
  )
}

interface ConfigItemProps {
  label: string
  value: string
}

function ConfigItem({ label, value }: ConfigItemProps) {
  const isNotSet = value.startsWith('❌')

  // Obfuscate secrets (keys, tokens, passwords, URLs with credentials)
  const shouldObfuscate =
    label.includes('SECRET') ||
    label.includes('KEY') ||
    label.includes('TOKEN') ||
    label.includes('PASSWORD') ||
    label.includes('URL')

  const displayValue = shouldObfuscate && !isNotSet ? obfuscateSecret(value) : value

  return (
    <div className={styles.configItem}>
      <div className={styles.configLabel}>{label}</div>
      <div className={`${styles.configValue} ${isNotSet ? styles.notSet : ''}`}>{displayValue}</div>
    </div>
  )
}

function obfuscateSecret(value: string): string {
  if (!value || value.startsWith('❌') || value.startsWith('✅')) {
    return value
  }

  // For URLs, obfuscate credentials
  if (value.startsWith('postgresql://') || value.startsWith('postgres://')) {
    try {
      const url = new URL(value)
      if (url.password) {
        url.password = '••••••••'
      }
      if (url.username && url.username !== 'postgres') {
        url.username = url.username.substring(0, 3) + '••••'
      }
      return url.toString()
    } catch {
      // If URL parsing fails, use default obfuscation
    }
  }

  // For other secrets, show first 4 chars + last 4 chars
  if (value.length <= 12) {
    return '••••••••'
  }
  return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4)
}
