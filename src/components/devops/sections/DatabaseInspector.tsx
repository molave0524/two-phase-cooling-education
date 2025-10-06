'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import styles from './DatabaseInspector.module.css'

interface TableInfo {
  name: string
  rowCount: number
  size: string
  lastModified: string | null
  columns: number
  indexes: number
}

interface FieldInfo {
  name: string
  dataType: string
  nonNullCount: number
  distinctCount: number
  isNullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
}

interface DatabaseData {
  database: {
    name: string
    type: string
    version: string
    size: string
  }
  tables: TableInfo[]
  statistics: {
    totalTables: number
    totalRows: number
    totalSize: string
  }
}

async function fetchDatabaseInfo(): Promise<DatabaseData> {
  const response = await fetch('/api/devops/database/info')
  if (!response.ok) {
    throw new Error('Failed to fetch database info')
  }
  return response.json()
}

async function fetchTableDetails(tableName: string) {
  const response = await fetch(`/api/devops/database/table/${tableName}`)
  if (!response.ok) {
    throw new Error('Failed to fetch table details')
  }
  return response.json()
}

export function DatabaseInspector() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedTable, setExpandedTable] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['devops', 'database'],
    queryFn: fetchDatabaseInfo,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  })

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
          <span className={styles.sectionIcon}>🗄️</span>
          <span>Database</span>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className={styles.sectionContent}>
            <div className={styles.errorMessage}>
              Unable to connect to database. Check connection settings.
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
          <span className={styles.sectionIcon}>🗄️</span>
          <span>Database</span>
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

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.sectionIcon}>🗄️</span>
        <span>Database ({data.statistics.totalTables} tables)</span>
        <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className={styles.sectionContent}>
        {data.tables.length === 0 ? (
          <div className={styles.emptyMessage}>
            <div>No tables found in public schema</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              Database is connected but empty. Run migrations to create tables.
            </div>
          </div>
        ) : (
          <>
            {data.tables
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((table) => (
                <div key={table.name}>
                  <div
                    className={styles.tableItem}
                    onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setExpandedTable(expandedTable === table.name ? null : table.name)
                      }
                    }}
                  >
                    <div className={styles.tableHeader}>
                      <span className={styles.tableName}>
                        <span className={styles.expandIcon}>
                          {expandedTable === table.name ? '▼' : '▶'}
                        </span>
                        public.{table.name}
                      </span>
                    <span className={styles.tableCount}>{table.rowCount.toLocaleString()} rows</span>
                  </div>
                  <div className={styles.tableMeta}>
                    <span>{table.size}</span>
                    <span>•</span>
                    <span>{table.columns} columns</span>
                    <span>•</span>
                    <span>{table.indexes} indexes</span>
                    {table.lastModified && (
                      <>
                        <span>•</span>
                        <span>{formatTime(table.lastModified)}</span>
                      </>
                    )}
                  </div>
                </div>
                {expandedTable === table.name && <TableDetails tableName={table.name} />}
              </div>
            ))}

            <a href="/devops/schema-comparison" className={styles.compareBtn}>
              🔄 Compare Schemas →
            </a>
          </>
        )}
        </div>
      )}
    </div>
  )
}

function TableDetails({ tableName }: { tableName: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['devops', 'table', tableName],
    queryFn: () => fetchTableDetails(tableName),
    staleTime: 60000,
  })

  if (isLoading) {
    return (
      <div className={styles.tableDetails}>
        <div className={styles.loadingMessage}>Loading field details...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.tableDetails}>
        <div className={styles.errorMessage}>Failed to load field details</div>
      </div>
    )
  }

  return (
    <div className={styles.tableDetails}>
      <div className={styles.fieldsHeader}>
        <span className={styles.fieldHeaderItem} style={{ flex: '3' }}>
          Field Name
        </span>
        <span className={styles.fieldHeaderItem} style={{ flex: '1', textAlign: 'right' }}>
          NN/Dist
        </span>
      </div>
      {data.fields.map((field: FieldInfo) => (
        <div key={field.name} className={styles.fieldRow}>
          <div className={styles.fieldNameContainer} style={{ flex: '3' }}>
            <div
              className={`${styles.fieldName} ${field.isPrimaryKey ? styles.fieldNamePrimaryKey : ''} ${field.isForeignKey ? styles.fieldNameForeignKey : ''}`}
            >
              {field.isUnique && <span className={styles.uniqueBadge}>[</span>}
              {field.name}
              {field.isUnique && <span className={styles.uniqueBadge}>]</span>}
              {field.isNullable && <span className={styles.requiredBadge}>*</span>}
            </div>
            <div className={styles.fieldType}>{field.dataType}</div>
          </div>
          <span className={styles.fieldStat} style={{ flex: '1', textAlign: 'right' }}>
            {field.nonNullCount.toLocaleString()}/{field.distinctCount.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
