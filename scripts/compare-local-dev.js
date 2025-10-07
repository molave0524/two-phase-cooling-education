/**
 * Compare local and dev database schemas
 */

async function compareSchemas() {
  const response = await fetch('http://localhost:3000/api/devops/database/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'local', target: 'dev' }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Error:', error)
    process.exit(1)
  }

  const data = await response.json()
  const { comparison } = data

  console.log('\n=== SCHEMA COMPARISON: LOCAL vs DEV ===\n')

  console.log(
    'Tables only in LOCAL:',
    comparison.tablesOnlyInSource.length > 0 ? comparison.tablesOnlyInSource : 'None'
  )
  console.log(
    'Tables only in DEV:',
    comparison.tablesOnlyInTarget.length > 0 ? comparison.tablesOnlyInTarget : 'None'
  )
  console.log('Tables in both:', comparison.tablesInBoth.length)

  console.log('\n=== COLUMN DIFFERENCES ===\n')

  const differences = comparison.columnDifferences.filter(d => d.status !== 'matching')

  if (differences.length === 0) {
    console.log('✅ All columns match!')
  } else {
    differences.forEach(d => {
      const statusIcon =
        {
          added: '➕',
          removed: '➖',
          modified: '⚠️',
        }[d.status] || '?'

      console.log(`${statusIcon} ${d.table}.${d.column}`)
      console.log(`   Status: ${d.status}`)
      if (d.sourceType) console.log(`   Local: ${d.sourceType}`)
      if (d.targetType) console.log(`   Dev: ${d.targetType}`)
      console.log()
    })
  }

  console.log('\n=== BREAKING CHANGES ===\n')

  if (comparison.breakingChanges.length === 0) {
    console.log('✅ No breaking changes detected')
  } else {
    comparison.breakingChanges.forEach(change => {
      console.log('❌', change)
    })
  }

  console.log('\n=== COMPATIBILITY ===\n')
  console.log(
    comparison.isCompatible ? '✅ Schemas are compatible' : '❌ Schemas are NOT compatible'
  )
  console.log()
}

compareSchemas().catch(console.error)
