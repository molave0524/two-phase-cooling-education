'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './SchemaComparison.module.css'

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
      status: 'added' | 'removed' | 'modified'
      sourceType?: string
      targetType?: string
    }>
    breakingChanges: string[]
    isCompatible: boolean
  }
}

export function SchemaComparison() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [source, setSource] = useState<Environment>('local')
  const [target, setTarget] = useState<Environment>('dev')
  const [isComparing, setIsComparing] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    setIsComparing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/devops/database/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, target }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || `Failed to compare: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsComparing(false)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.sectionIcon}>🔄</span>
        <span>Schema Comparison</span>
        <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className={styles.sectionContent}>
          {/* Selectors */}
          <div className={styles.controls}>
            <div className={styles.selectorGroup}>
              <label className={styles.label}>Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as Environment)}
                className={styles.select}
                disabled={isComparing}
              >
                <option value="local">LOCAL</option>
                <option value="dev">DEV</option>
                <option value="uat">UAT</option>
                <option value="prod">PROD</option>
              </select>
            </div>

            <div className={styles.arrow}>→</div>

            <div className={styles.selectorGroup}>
              <label className={styles.label}>Target</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as Environment)}
                className={styles.select}
                disabled={isComparing}
              >
                <option value="dev">DEV</option>
                <option value="uat">UAT</option>
                <option value="prod">PROD</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={isComparing || source === target}
            className={styles.compareBtn}
          >
            {isComparing ? 'Comparing...' : 'Compare'}
          </button>

          {/* Error Display */}
          {error && (
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <motion.div
              className={styles.results}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {/* DEBUG: Version marker */}
              <div style={{ fontSize: '10px', color: 'red', marginBottom: '8px' }}>
                🔴 NEW SIDE-BY-SIDE VIEW v2
              </div>

              {/* Compatibility Badge */}
              <div
                className={`${styles.badge} ${result.comparison.isCompatible ? styles.compatible : styles.incompatible}`}
              >
                {result.comparison.isCompatible ? '✓ Compatible' : '⚠ Incompatible'}
              </div>

              {/* Side-by-Side Table Comparison */}
              <div className={styles.sideBySide}>
                <div className={styles.compareHeader}>
                  <div className={styles.sourceHeader}>{source.toUpperCase()}</div>
                  <div className={styles.targetHeader}>{target.toUpperCase()}</div>
                </div>

                {/* Get all unique table names */}
                {Array.from(
                  new Set([
                    ...result.comparison.tablesInBoth,
                    ...result.comparison.tablesOnlyInSource,
                    ...result.comparison.tablesOnlyInTarget,
                  ])
                )
                  .sort()
                  .map((tableName) => {
                    const inSource = result.comparison.tablesInBoth.includes(tableName) ||
                                   result.comparison.tablesOnlyInSource.includes(tableName)
                    const inTarget = result.comparison.tablesInBoth.includes(tableName) ||
                                   result.comparison.tablesOnlyInTarget.includes(tableName)
                    const inBoth = result.comparison.tablesInBoth.includes(tableName)

                    return (
                      <div key={tableName} className={styles.compareRow}>
                        <div
                          className={`${styles.sourceCell} ${
                            inBoth ? styles.cellCommon : inSource ? styles.cellUnique : styles.cellMissing
                          }`}
                        >
                          {inSource ? tableName : ''}
                        </div>
                        <div
                          className={`${styles.targetCell} ${
                            inBoth ? styles.cellCommon : inTarget ? styles.cellUnique : styles.cellMissing
                          }`}
                        >
                          {inTarget ? tableName : ''}
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Link to Full View */}
              <a href="/devops/schema-comparison" className={styles.fullViewLink} target="_blank">
                View Full Comparison →
              </a>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
