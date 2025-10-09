'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import styles from './page.module.css'

type Environment = 'local' | 'dev' | 'uat' | 'prod'

interface ComparisonResult {
  timestamp: string
  source: string
  target: string
  comparison: {
    tablesOnlyInSource: string[]
    tablesOnlyInTarget: string[]
    tablesInBoth: string[]
    columnDifferences: Array<{
      table: string
      column: string
      status: 'added' | 'removed' | 'modified' | 'matching'
      sourceType?: string
      targetType?: string
      ordinalPosition?: number
      isPrimaryKey?: boolean
      isUnique?: boolean
      isNullable?: boolean
    }>
    breakingChanges: string[]
    isCompatible: boolean
  }
}

/**
 * Format datatype display
 * Converts PostgreSQL types to more readable formats
 */
function formatDataType(dataType: string | undefined): string {
  if (!dataType) return ''

  // Convert "character varying(n)" to "varchar(n)"
  if (dataType.includes('character varying')) {
    dataType = dataType.replace('character varying', 'varchar')
  }

  // Handle timestamp with time zone → timestampz
  if (dataType.includes('timestamp') && dataType.includes('with time zone')) {
    // "timestamp(6) with time zone" → "timestampz(6)"
    const match = dataType.match(/timestamp\((\d+)\) with time zone/)
    if (match) {
      return `timestampz(${match[1]})`
    }
    // "timestamp with time zone" → "timestampz"
    return 'timestampz'
  }

  // Handle timestamp without time zone → timestamp
  if (dataType.includes('timestamp')) {
    // "timestamp(6)" → "timestamp(6)"
    const match = dataType.match(/^timestamp\((\d+)\)$/)
    if (match) {
      return `timestamp(${match[1]})`
    }
    // "timestamp without time zone" → "timestamp"
    if (dataType === 'timestamp without time zone' || dataType === 'timestamp') {
      return 'timestamp'
    }
  }

  // Handle time with time zone → timez
  if (dataType.includes('time') && dataType.includes('with time zone')) {
    // "time(3) with time zone" → "timez(3)"
    const match = dataType.match(/time\((\d+)\) with time zone/)
    if (match) {
      return `timez(${match[1]})`
    }
    // "time with time zone" → "timez"
    return 'timez'
  }

  // Handle time without time zone → time
  if (dataType.includes('time')) {
    // "time(3)" → "time(3)"
    const match = dataType.match(/^time\((\d+)\)$/)
    if (match) {
      return `time(${match[1]})`
    }
    // "time without time zone" → "time"
    if (dataType === 'time without time zone' || dataType === 'time') {
      return 'time'
    }
  }

  return dataType
}

export default function SchemaComparisonPage() {
  const [source, setSource] = useState<Environment>('local')
  const [target, setTarget] = useState<Environment>('dev')
  const [isComparing, setIsComparing] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    setIsComparing(true)
    setError(null)

    try {
      // Step 1: Refresh metadata for target environment first (if not local)
      if (target !== 'local') {
        try {
          const refreshResponse = await fetch('/api/devops/database/refresh-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ environment: target }),
          })

          if (!refreshResponse.ok) {
            const errorData = await refreshResponse.json()
            throw new Error(
              errorData.details ||
                errorData.error ||
                `Failed to refresh metadata: ${refreshResponse.statusText}`
            )
          }
        } catch (refreshErr) {
          // Log but continue with comparison
          // Metadata refresh failed, continuing with comparison
        }
      }

      // Step 2: Compare schemas
      const response = await fetch('/api/devops/database/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, target }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.details || errorData.error || `Failed to compare: ${response.statusText}`
        )
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsComparing(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return

    try {
      // Format the comparison results as a side-by-side table
      const allTables = Array.from(
        new Set([
          ...result.comparison.tablesInBoth,
          ...result.comparison.tablesOnlyInSource,
          ...result.comparison.tablesOnlyInTarget,
        ])
      ).sort()

      let copyText = `Database Schema Comparison\n`
      copyText += `Source: ${source.toUpperCase()} → Target: ${target.toUpperCase()}\n`
      copyText += `Generated: ${new Date(result.timestamp).toLocaleString()}\n`
      copyText += `Compatible: ${result.comparison.isCompatible ? 'Yes' : 'No'}\n`
      copyText += `\n${'='.repeat(100)}\n\n`

      // Table header
      const colWidth = 48
      const sourceHeader = source.toUpperCase().padEnd(colWidth)
      const targetHeader = target.toUpperCase().padEnd(colWidth)
      copyText += `${sourceHeader} | ${targetHeader}\n`
      copyText += `${'-'.repeat(colWidth)} | ${'-'.repeat(colWidth)}\n`

      // Tables and columns in side-by-side format
      for (const tableName of allTables) {
        const inSource =
          result.comparison.tablesInBoth.includes(tableName) ||
          result.comparison.tablesOnlyInSource.includes(tableName)
        const inTarget =
          result.comparison.tablesInBoth.includes(tableName) ||
          result.comparison.tablesOnlyInTarget.includes(tableName)
        const inBoth = result.comparison.tablesInBoth.includes(tableName)

        // Table row with schema names
        const schema = 'public'
        const sourceTableText = inSource ? `${schema}.${tableName}` : ''
        const targetTableText = inTarget ? `${schema}.${tableName}` : ''
        copyText += `${sourceTableText.padEnd(colWidth)} | ${targetTableText.padEnd(colWidth)}\n`

        // Get columns for this table
        const tableColumns = result.comparison.columnDifferences.filter(
          diff => diff.table === tableName
        )

        if (inBoth && tableColumns.length > 0) {
          const sortedColumns = tableColumns.sort((a, b) => a.column.localeCompare(b.column))

          for (const col of sortedColumns) {
            const inSourceCol = col.status !== 'added'
            const inTargetCol = col.status !== 'removed'
            const isMatching = col.status === 'matching'
            const isModified = col.status === 'modified'

            // Format column text with status indicator
            let sourceColText = ''
            let targetColText = ''

            if (inSourceCol) {
              const statusIcon = isMatching ? '' : isModified ? '⚠ ' : '- '
              sourceColText = `  ${statusIcon}${col.column}`
              if (col.sourceType) {
                const formattedType = formatDataType(col.sourceType)
                const nullableSuffix = col.isNullable ? ' null' : ''
                sourceColText += `  ${formattedType}${nullableSuffix}`
              }
            }

            if (inTargetCol) {
              const statusIcon = isMatching ? '' : isModified ? '⚠ ' : '+ '
              targetColText = `  ${statusIcon}${col.column}`
              if (col.targetType) {
                const formattedType = formatDataType(col.targetType)
                const nullableSuffix = col.isNullable ? ' null' : ''
                targetColText += `  ${formattedType}${nullableSuffix}`
              }
            }

            // Truncate if too long
            if (sourceColText.length > colWidth) {
              sourceColText = sourceColText.substring(0, colWidth - 3) + '...'
            }
            if (targetColText.length > colWidth) {
              targetColText = targetColText.substring(0, colWidth - 3) + '...'
            }

            copyText += `${sourceColText.padEnd(colWidth)} | ${targetColText.padEnd(colWidth)}\n`
          }
        }

        // Add separator between tables
        copyText += `${' '.repeat(colWidth)} | ${' '.repeat(colWidth)}\n`
      }

      // Breaking changes
      if (result.comparison.breakingChanges.length > 0) {
        copyText += `\n${'='.repeat(100)}\n`
        copyText += `BREAKING CHANGES:\n`
        result.comparison.breakingChanges.forEach(change => {
          copyText += `  ⚠ ${change}\n`
        })
      }

      await navigator.clipboard.writeText(copyText)
      toast.success('Schema comparison copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Database Schema Comparison</h1>
        <p className={styles.subtitle}>
          Compare database schemas across environments to detect differences and breaking changes
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.selectorGroup}>
          <label htmlFor='source' className={styles.label}>
            Source Environment
          </label>
          <select
            id='source'
            value={source}
            onChange={e => setSource(e.target.value as Environment)}
            className={styles.select}
          >
            <option value='local'>LOCAL</option>
            <option value='dev'>DEV</option>
            <option value='uat'>UAT</option>
            <option value='prod'>PROD</option>
          </select>
        </div>

        <div className={styles.arrow}>→</div>

        <div className={styles.selectorGroup}>
          <label htmlFor='target' className={styles.label}>
            Target Environment
          </label>
          <select
            id='target'
            value={target}
            onChange={e => setTarget(e.target.value as Environment)}
            className={styles.select}
          >
            <option value='dev'>DEV</option>
            <option value='uat'>UAT</option>
            <option value='prod'>PROD</option>
          </select>
        </div>

        <button
          onClick={handleCompare}
          disabled={isComparing || source === target}
          className={styles.compareBtn}
        >
          {isComparing ? 'Comparing...' : 'Compare Schemas'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <div className={styles.errorHeader}>
            <strong>⚠️ Comparison Failed</strong>
          </div>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorActions}>
            {error.includes('Missing environment variable') && (
              <p className={styles.errorHint}>
                💡 Add the missing environment variable to your .env.local file
              </p>
            )}
            {error.includes('same database') && (
              <p className={styles.errorHint}>
                💡 Choose different environments to compare different databases
              </p>
            )}
            <button onClick={handleCompare} className={styles.retryBtn}>
              ↻ Retry
            </button>
          </div>
        </div>
      )}

      {isComparing && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonBadge}></div>
          </div>
          <div className={styles.skeletonSection}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonTable}>
              <div className={styles.skeletonRow}></div>
              <div className={styles.skeletonRow}></div>
              <div className={styles.skeletonRow}></div>
              <div className={styles.skeletonRow}></div>
              <div className={styles.skeletonRow}></div>
              <div className={styles.skeletonRow}></div>
            </div>
          </div>
        </div>
      )}

      {result && !isComparing && (
        <motion.div
          className={styles.results}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Side-by-Side Table Comparison */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📊 Table & Column Comparison</h2>
              <button onClick={handleCopy} className={styles.copyButton} title='Copy to clipboard'>
                📋 Copy
              </button>
            </div>
            <div className={styles.sideBySide}>
              <div className={styles.compareHeader}>
                <div className={styles.sourceHeader}>{source.toUpperCase()}</div>
                <div className={styles.targetHeader}>{target.toUpperCase()}</div>
              </div>

              {Array.from(
                new Set([
                  ...result.comparison.tablesInBoth,
                  ...result.comparison.tablesOnlyInSource,
                  ...result.comparison.tablesOnlyInTarget,
                ])
              )
                .sort()
                .map(tableName => {
                  const inSource =
                    result.comparison.tablesInBoth.includes(tableName) ||
                    result.comparison.tablesOnlyInSource.includes(tableName)
                  const inTarget =
                    result.comparison.tablesInBoth.includes(tableName) ||
                    result.comparison.tablesOnlyInTarget.includes(tableName)
                  const inBoth = result.comparison.tablesInBoth.includes(tableName)

                  // Get column differences for this table
                  const tableColumnDiffs = result.comparison.columnDifferences.filter(
                    diff => diff.table === tableName
                  )

                  // Get all unique columns for this table
                  const allColumns = new Set<string>()
                  tableColumnDiffs.forEach(diff => allColumns.add(diff.column))

                  // Format table names with schema
                  const schema = 'public'
                  const sourceTableName = inSource ? `${schema}.${tableName}` : ''
                  const targetTableName = inTarget ? `${schema}.${tableName}` : ''

                  return (
                    <div key={tableName}>
                      {/* Table Row */}
                      <div className={styles.compareRow}>
                        <div
                          className={`${styles.sourceCell} ${styles.tableCell} ${
                            inBoth
                              ? styles.cellCommon
                              : inSource
                                ? styles.cellUnique
                                : styles.cellMissing
                          }`}
                        >
                          {sourceTableName}
                        </div>
                        <div
                          className={`${styles.targetCell} ${styles.tableCell} ${
                            inBoth
                              ? styles.cellCommon
                              : inTarget
                                ? styles.cellUnique
                                : styles.cellMissing
                          }`}
                        >
                          {targetTableName}
                        </div>
                      </div>

                      {/* Column Rows (show ALL columns if table exists in both) */}
                      {inBoth &&
                        tableColumnDiffs.length > 0 &&
                        tableColumnDiffs
                          .sort((a, b) => (a.ordinalPosition || 0) - (b.ordinalPosition || 0))
                          .map(columnDiff => {
                            const columnName = columnDiff.column
                            const inSourceCol = columnDiff.status !== 'added'
                            const inTargetCol = columnDiff.status !== 'removed'
                            const isMatching = columnDiff.status === 'matching'
                            const isModified = columnDiff.status === 'modified'
                            const isAdded = columnDiff.status === 'added'
                            const isRemoved = columnDiff.status === 'removed'

                            // Dynamic class names based on constraints (priority: PK > Unique > Nullable)
                            const columnClasses = [styles.columnCell]
                            let columnStyle: React.CSSProperties = {}

                            if (columnDiff.isPrimaryKey) {
                              columnClasses.push(styles.primaryKey)
                              columnStyle = { color: '#000000', fontWeight: 700 }
                            } else if (columnDiff.isUnique) {
                              columnClasses.push(styles.uniqueColumn)
                              columnStyle = { color: '#1e3a8a', fontWeight: 500 }
                            } else if (columnDiff.isNullable) {
                              columnClasses.push(styles.nullableColumn)
                              columnStyle = { color: '#4b5563', fontWeight: 400 }
                            } else {
                              columnStyle = { color: '#111827', fontWeight: 400 }
                            }

                            return (
                              <div key={`${tableName}-${columnName}`} className={styles.compareRow}>
                                <div
                                  className={`${styles.sourceCell} ${columnClasses.join(' ')} ${
                                    isMatching
                                      ? styles.cellMatching
                                      : isModified || isRemoved
                                        ? styles.cellNonMatching
                                        : inSourceCol
                                          ? styles.cellCommon
                                          : styles.cellMissing
                                  }`}
                                  style={columnStyle}
                                  title={`PK:${columnDiff.isPrimaryKey} U:${columnDiff.isUnique} N:${columnDiff.isNullable}`}
                                >
                                  {inSourceCol && (
                                    <>
                                      {`  ${columnName}`}
                                      {columnDiff.sourceType && (
                                        <span className={styles.columnType}>
                                          {formatDataType(columnDiff.sourceType)}
                                          {columnDiff.isNullable && ' null'}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div
                                  className={`${styles.targetCell} ${columnClasses.join(' ')} ${
                                    isMatching
                                      ? styles.cellMatching
                                      : isModified || isAdded
                                        ? styles.cellNonMatching
                                        : inTargetCol
                                          ? styles.cellCommon
                                          : styles.cellMissing
                                  }`}
                                  style={columnStyle}
                                >
                                  {inTargetCol && (
                                    <>
                                      {`  ${columnName}`}
                                      {columnDiff.targetType && (
                                        <span className={styles.columnType}>
                                          {formatDataType(columnDiff.targetType)}
                                          {columnDiff.isNullable && ' null'}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                    </div>
                  )
                })}
            </div>
          </div>

          <div className={styles.metadata}>
            <small>Comparison generated at {new Date(result.timestamp).toLocaleString()}</small>
          </div>
        </motion.div>
      )}
    </div>
  )
}
