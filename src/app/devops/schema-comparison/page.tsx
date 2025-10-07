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
    }>
    breakingChanges: string[]
    isCompatible: boolean
  }
}

export default function SchemaComparisonPage() {
  const [source, setSource] = useState<Environment>('local')
  const [target, setTarget] = useState<Environment>('dev')
  const [isComparing, setIsComparing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    setIsComparing(true)
    setError(null)

    try {
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

  const handleRefreshMetadata = async () => {
    // Only refresh metadata for remote environments (dev, uat, prod)
    if (target === 'local') {
      toast.error('Cannot refresh metadata for local environment')
      return
    }

    setIsRefreshing(true)

    try {
      const response = await fetch('/api/devops/database/refresh-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: target }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.details || errorData.error || `Failed to refresh: ${response.statusText}`
        )
      }

      await response.json()
      toast.success(`Metadata refreshed for ${target.toUpperCase()} environment`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      toast.error(`Failed to refresh metadata: ${errorMsg}`)
    } finally {
      setIsRefreshing(false)
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

        // Table row
        const sourceTableText = inSource ? tableName : ''
        const targetTableText = inTarget ? tableName : ''
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
                sourceColText += ` : ${col.sourceType}`
              }
            }

            if (inTargetCol) {
              const statusIcon = isMatching ? '' : isModified ? '⚠ ' : '+ '
              targetColText = `  ${statusIcon}${col.column}`
              if (col.targetType) {
                targetColText += ` : ${col.targetType}`
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

        <button
          onClick={handleRefreshMetadata}
          disabled={isRefreshing || target === 'local'}
          className={styles.refreshBtn}
          title={
            target === 'local'
              ? 'Cannot refresh local metadata'
              : `Refresh ${target.toUpperCase()} metadata`
          }
        >
          {isRefreshing ? 'Refreshing...' : '🔄 Refresh Metadata'}
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
                          {inSource ? tableName : ''}
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
                          {inTarget ? tableName : ''}
                        </div>
                      </div>

                      {/* Column Rows (show ALL columns if table exists in both) */}
                      {inBoth &&
                        tableColumnDiffs.length > 0 &&
                        Array.from(allColumns)
                          .sort()
                          .map(columnName => {
                            const diff = tableColumnDiffs.find(d => d.column === columnName)
                            if (!diff) return null

                            const inSourceCol = diff.status !== 'added'
                            const inTargetCol = diff.status !== 'removed'
                            const isMatching = diff.status === 'matching'
                            const isModified = diff.status === 'modified'
                            const isAdded = diff.status === 'added'
                            const isRemoved = diff.status === 'removed'

                            return (
                              <div key={`${tableName}-${columnName}`} className={styles.compareRow}>
                                <div
                                  className={`${styles.sourceCell} ${styles.columnCell} ${
                                    isMatching
                                      ? styles.cellMatching
                                      : isModified || isRemoved
                                        ? styles.cellNonMatching
                                        : inSourceCol
                                          ? styles.cellCommon
                                          : styles.cellMissing
                                  }`}
                                >
                                  {inSourceCol && (
                                    <>
                                      {`  ${columnName}`}
                                      {diff.sourceType && (
                                        <span className={styles.columnType}>
                                          {' '}
                                          : {diff.sourceType}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div
                                  className={`${styles.targetCell} ${styles.columnCell} ${
                                    isMatching
                                      ? styles.cellMatching
                                      : isModified || isAdded
                                        ? styles.cellNonMatching
                                        : inTargetCol
                                          ? styles.cellCommon
                                          : styles.cellMissing
                                  }`}
                                >
                                  {inTargetCol && (
                                    <>
                                      {`  ${columnName}`}
                                      {diff.targetType && (
                                        <span className={styles.columnType}>
                                          {' '}
                                          : {diff.targetType}
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
