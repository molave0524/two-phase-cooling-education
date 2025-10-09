import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function compareSchemas() {
  try {
    console.log('🔍 Comparing schema between LOCAL and DEV...\n')

    // Check if DEV_POSTGRES_URL is configured
    if (!process.env.DEV_POSTGRES_URL) {
      console.log('❌ DEV_POSTGRES_URL is not configured in .env.local')
      console.log('   Please add DEV_POSTGRES_URL to compare schemas\n')
      process.exit(1)
    }

    const response = await fetch('http://localhost:3000/api/devops/database/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'local',
        target: 'dev',
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', result.error)
      if (result.details) {
        console.error('   Details:', result.details)
      }
      process.exit(1)
    }

    console.log('📊 Schema Comparison Results:')
    console.log('═'.repeat(80))
    console.log(`Source: ${result.source.toUpperCase()}`)
    console.log(`Target: ${result.target.toUpperCase()}`)
    console.log(`Timestamp: ${result.timestamp}`)
    console.log('═'.repeat(80))

    const { comparison } = result

    // Both environments use 'public' schema
    const schema = 'public'

    // Tables only in LOCAL
    if (comparison.tablesOnlyInSource.length > 0) {
      console.log('\n🔴 Tables ONLY in LOCAL (missing in DEV):')
      comparison.tablesOnlyInSource.forEach((table: string) => {
        console.log(`   - ${schema}.${table}`)
      })
    }

    // Tables only in DEV
    if (comparison.tablesOnlyInTarget.length > 0) {
      console.log('\n🔵 Tables ONLY in DEV (missing in LOCAL):')
      comparison.tablesOnlyInTarget.forEach((table: string) => {
        console.log(`   - ${schema}.${table}`)
      })
    }

    // Tables in both
    console.log(`\n✅ Tables in BOTH: ${comparison.tablesInBoth.length}`)
    comparison.tablesInBoth.forEach((table: string) => {
      console.log(`   - ${schema}.${table}`)
    })

    // Column differences
    if (comparison.columnDifferences.length > 0) {
      console.log('\n📝 Column Differences:')
      console.log('─'.repeat(80))

      const addedCols = comparison.columnDifferences.filter((d: any) => d.status === 'added')
      const removedCols = comparison.columnDifferences.filter((d: any) => d.status === 'removed')
      const modifiedCols = comparison.columnDifferences.filter((d: any) => d.status === 'modified')

      if (addedCols.length > 0) {
        console.log('\n  ➕ Added in DEV (not in LOCAL):')
        addedCols.forEach((col: any) => {
          console.log(`     ${schema}.${col.table}.${col.column} - ${col.targetType}`)
        })
      }

      if (removedCols.length > 0) {
        console.log('\n  ➖ Removed from DEV (only in LOCAL):')
        removedCols.forEach((col: any) => {
          console.log(`     ${schema}.${col.table}.${col.column} - ${col.sourceType}`)
        })
      }

      if (modifiedCols.length > 0) {
        console.log('\n  ⚠️  Modified (type or constraint changes):')
        modifiedCols.forEach((col: any) => {
          console.log(`     ${schema}.${col.table}.${col.column}`)
          console.log(`       LOCAL:  ${col.sourceType}`)
          console.log(`       DEV:    ${col.targetType}`)
        })
      }
    }

    // Breaking changes
    console.log('\n' + '═'.repeat(80))
    if (comparison.breakingChanges.length > 0) {
      console.log('❌ BREAKING CHANGES DETECTED:')
      comparison.breakingChanges.forEach((change: string) => {
        console.log(`   ⚠️  ${change}`)
      })
      console.log(`\n   Status: INCOMPATIBLE - Migration required`)
    } else {
      console.log('✅ No breaking changes detected')
      console.log('   Status: COMPATIBLE')
    }
    console.log('═'.repeat(80))
  } catch (error) {
    console.error('❌ Failed to compare schemas:', error)
    process.exit(1)
  }
}

compareSchemas()
