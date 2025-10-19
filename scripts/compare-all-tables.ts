/**
 * Compare all tables across databases
 */

import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function checkDatabase(name: string, connectionString: string) {
  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    const tables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema IN ('auth', 'catalog', 'store')
      ORDER BY table_schema, table_name
    `

    const bySchema: Record<string, string[]> = {}
    tables.forEach((t: any) => {
      if (!bySchema[t.table_schema]) bySchema[t.table_schema] = []
      bySchema[t.table_schema].push(t.table_name)
    })

    await sql.end()
    return bySchema
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error)
    await sql.end()
    return {}
  }
}

async function main() {
  const local =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'
  const dev = process.env.DEV_POSTGRES_URL
  const uat = process.env.UAT_POSTGRES_URL

  console.log('\n=== Database Tables Comparison ===\n')

  const localTables = await checkDatabase('LOCAL', local)
  const devTables = dev ? await checkDatabase('DEV', dev) : {}
  const uatTables = uat ? await checkDatabase('UAT', uat) : {}

  const allSchemas = new Set([
    ...Object.keys(localTables),
    ...Object.keys(devTables),
    ...Object.keys(uatTables),
  ])

  allSchemas.forEach(schema => {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`${schema.toUpperCase()} schema`)
    console.log('='.repeat(80))

    const localTbls = localTables[schema] || []
    const devTbls = devTables[schema] || []
    const uatTbls = uatTables[schema] || []

    const allTables = new Set([...localTbls, ...devTbls, ...uatTbls])

    console.log(
      `\n${'Table'.padEnd(30)} ${'LOCAL'.padEnd(10)} ${'DEV'.padEnd(10)} ${'UAT'.padEnd(10)}`
    )
    console.log('-'.repeat(60))

    allTables.forEach(table => {
      const inLocal = localTbls.includes(table) ? '✓' : '✗'
      const inDev = devTbls.includes(table) ? '✓' : '✗'
      const inUat = uatTbls.includes(table) ? '✓' : '✗'

      const status = inLocal === '✓' && inDev === '✓' && inUat === '✓' ? '' : ' ⚠️'
      console.log(
        `${table.padEnd(30)} ${inLocal.padEnd(10)} ${inDev.padEnd(10)} ${inUat.padEnd(10)}${status}`
      )
    })
  })

  console.log('\n')
  process.exit(0)
}

main()
