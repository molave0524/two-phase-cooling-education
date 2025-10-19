/**
 * Compare all table schemas across databases
 */

import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

interface ColumnInfo {
  column_name: string
  data_type: string
  character_maximum_length: number | null
  datetime_precision: number | null
  is_nullable: string
  column_default: string | null
}

async function getTableColumns(sql: any, schema: string, table: string): Promise<ColumnInfo[]> {
  try {
    const columns = await sql`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        datetime_precision,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = ${schema}
        AND table_name = ${table}
      ORDER BY ordinal_position
    `
    return columns
  } catch (error) {
    return []
  }
}

function formatType(col: ColumnInfo): string {
  let type = col.data_type

  if (type === 'timestamp with time zone' && col.datetime_precision) {
    type = `timestamptz(${col.datetime_precision})`
  } else if (type === 'timestamp with time zone') {
    type = 'timestamptz'
  } else if (type === 'timestamp without time zone' && col.datetime_precision) {
    type = `timestamp(${col.datetime_precision})`
  } else if (type === 'timestamp without time zone') {
    type = 'timestamp'
  } else if (type === 'character varying' && col.character_maximum_length) {
    type = `varchar(${col.character_maximum_length})`
  } else if (type === 'character varying') {
    type = 'varchar'
  }

  return type
}

async function compareTableSchemas(
  localSql: any,
  devSql: any,
  uatSql: any,
  schema: string,
  table: string
) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`${schema}.${table}`)
  console.log('='.repeat(80))

  const localCols = await getTableColumns(localSql, schema, table)
  const devCols = await getTableColumns(devSql, schema, table)
  const uatCols = await getTableColumns(uatSql, schema, table)

  if (localCols.length === 0 && devCols.length === 0 && uatCols.length === 0) {
    console.log('Table not found in any database')
    return
  }

  console.log(`\nColumns: LOCAL=${localCols.length}, DEV=${devCols.length}, UAT=${uatCols.length}`)

  // Get all unique column names
  const allColumns = new Set([
    ...localCols.map(c => c.column_name),
    ...devCols.map(c => c.column_name),
    ...uatCols.map(c => c.column_name),
  ])

  const issues: string[] = []

  allColumns.forEach(colName => {
    const localCol = localCols.find(c => c.column_name === colName)
    const devCol = devCols.find(c => c.column_name === colName)
    const uatCol = uatCols.find(c => c.column_name === colName)

    const localType = localCol ? formatType(localCol) : '✗'
    const devType = devCol ? formatType(devCol) : '✗'
    const uatType = uatCol ? formatType(uatCol) : '✗'

    // Check if types match
    const typesMatch = localType === devType && devType === uatType

    if (!typesMatch) {
      issues.push(`  ⚠️  ${colName}: LOCAL=${localType}, DEV=${devType}, UAT=${uatType}`)
    }
  })

  if (issues.length > 0) {
    console.log('\n❌ MISMATCHES FOUND:')
    issues.forEach(issue => console.log(issue))
  } else {
    console.log('\n✅ All columns match across databases')
  }
}

async function main() {
  const local =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'
  const dev = process.env.DEV_POSTGRES_URL
  const uat = process.env.UAT_POSTGRES_URL

  if (!dev || !uat) {
    console.error('DEV_POSTGRES_URL and UAT_POSTGRES_URL must be set')
    process.exit(1)
  }

  const localSql = postgres(local, { max: 1, onnotice: () => {} })
  const devSql = postgres(dev, { max: 1, onnotice: () => {} })
  const uatSql = postgres(uat, { max: 1, onnotice: () => {} })

  console.log('\n=== Database Schema Comparison ===')

  // Get all tables
  const tables = await localSql`
    SELECT DISTINCT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema IN ('auth', 'catalog', 'store')
    ORDER BY table_schema, table_name
  `

  for (const table of tables) {
    await compareTableSchemas(localSql, devSql, uatSql, table.table_schema, table.table_name)
  }

  await localSql.end()
  await devSql.end()
  await uatSql.end()

  console.log('\n')
  process.exit(0)
}

main()
