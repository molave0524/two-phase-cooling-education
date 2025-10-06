#!/usr/bin/env tsx
/**
 * Schema Comparison CLI Tool
 * Compares database schemas between environments
 *
 * Usage:
 *   npm run db:compare              # Compare local → dev
 *   npm run db:compare local uat    # Compare local → uat
 *   npm run db:compare dev prod     # Compare dev → prod
 */

import 'dotenv/config'

const SOURCE_ENV = process.argv[2] || 'local'
const TARGET_ENV = process.argv[3] || 'dev'

const VALID_ENVS = ['local', 'dev', 'uat', 'prod']

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

async function compareSchemas(source: string, target: string): Promise<void> {
  // Validate environments
  if (!VALID_ENVS.includes(source) || !VALID_ENVS.includes(target)) {
    console.error(`❌ Invalid environment. Valid options: ${VALID_ENVS.join(', ')}`)
    process.exit(1)
  }

  if (source === target) {
    console.error('❌ Source and target must be different')
    process.exit(1)
  }

  console.log(`\n🔍 Comparing database schemas: ${source.toUpperCase()} → ${target.toUpperCase()}\n`)

  try {
    // Call the API endpoint
    const response = await fetch('http://localhost:3000/api/devops/database/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`❌ Comparison failed: ${error.error}`)
      if (error.details) {
        console.error(`   ${error.details}`)
      }
      process.exit(1)
    }

    const result: ComparisonResult = await response.json()

    // Display results
    displayResults(result)

    // Exit with error code if incompatible
    if (!result.comparison.isCompatible) {
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Failed to connect to dev server')
    console.error('   Make sure the dev server is running on http://localhost:3000')
    console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }
}

function displayResults(result: ComparisonResult): void {
  const { comparison } = result

  console.log('═'.repeat(80))
  console.log(`📊 Schema Comparison Report`)
  console.log(`   Generated: ${new Date(result.timestamp).toLocaleString()}`)
  console.log(`   Source: ${result.source.toUpperCase()}`)
  console.log(`   Target: ${result.target.toUpperCase()}`)
  console.log('═'.repeat(80))
  console.log()

  // Compatibility status
  if (comparison.isCompatible) {
    console.log('✅ Schemas are COMPATIBLE')
  } else {
    console.log('❌ Schemas are INCOMPATIBLE - Breaking changes detected!')
  }
  console.log()

  // Breaking changes
  if (comparison.breakingChanges.length > 0) {
    console.log('⚠️  BREAKING CHANGES:')
    comparison.breakingChanges.forEach(change => {
      console.log(`   • ${change}`)
    })
    console.log()
  }

  // Table differences
  console.log('📁 TABLE SUMMARY:')
  console.log(`   Tables in both:         ${comparison.tablesInBoth.length}`)
  console.log(`   Only in source:         ${comparison.tablesOnlyInSource.length}`)
  console.log(`   Only in target:         ${comparison.tablesOnlyInTarget.length}`)
  console.log()

  if (comparison.tablesOnlyInSource.length > 0) {
    console.log(`   Tables only in ${result.source.toUpperCase()}:`)
    comparison.tablesOnlyInSource.forEach(table => {
      console.log(`   - ${table}`)
    })
    console.log()
  }

  if (comparison.tablesOnlyInTarget.length > 0) {
    console.log(`   Tables only in ${result.target.toUpperCase()}:`)
    comparison.tablesOnlyInTarget.forEach(table => {
      console.log(`   + ${table}`)
    })
    console.log()
  }

  // Column differences
  const added = comparison.columnDifferences.filter(d => d.status === 'added')
  const removed = comparison.columnDifferences.filter(d => d.status === 'removed')
  const modified = comparison.columnDifferences.filter(d => d.status === 'modified')
  const matching = comparison.columnDifferences.filter(d => d.status === 'matching')

  console.log('📝 COLUMN SUMMARY:')
  console.log(`   Matching:               ${matching.length}`)
  console.log(`   Added in target:        ${added.length}`)
  console.log(`   Removed from target:    ${removed.length}`)
  console.log(`   Modified:               ${modified.length}`)
  console.log()

  if (added.length > 0) {
    console.log(`   Columns added in ${result.target.toUpperCase()}:`)
    added.forEach(col => {
      console.log(`   + ${col.table}.${col.column} (${col.targetType})`)
    })
    console.log()
  }

  if (removed.length > 0) {
    console.log(`   Columns removed from ${result.target.toUpperCase()}:`)
    removed.forEach(col => {
      console.log(`   - ${col.table}.${col.column} (${col.sourceType})`)
    })
    console.log()
  }

  if (modified.length > 0) {
    console.log(`   Columns modified:`)
    modified.forEach(col => {
      console.log(`   ⚠ ${col.table}.${col.column}`)
      console.log(`     Source: ${col.sourceType}`)
      console.log(`     Target: ${col.targetType}`)
    })
    console.log()
  }

  console.log('═'.repeat(80))

  if (!comparison.isCompatible) {
    console.log()
    console.log('💡 Next Steps:')
    console.log('   1. Review breaking changes above')
    console.log('   2. Create/update migration files if needed')
    console.log('   3. Apply migrations to target environment')
    console.log('   4. Re-run comparison to verify')
    console.log()
  }
}

// Run comparison
compareSchemas(SOURCE_ENV, TARGET_ENV)
