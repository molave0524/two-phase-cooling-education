/**
 * Compare catalog.products columns across databases
 */

import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function checkDatabase(name: string, connectionString: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`${name.toUpperCase()} - catalog.products columns`)
  console.log('='.repeat(80))

  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    const columns = await sql`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'catalog'
        AND table_name = 'products'
      ORDER BY ordinal_position
    `

    if (columns.length === 0) {
      console.log('Table not found')
    } else {
      console.log(`\nTotal columns: ${columns.length}\n`)
      columns.forEach((col: any) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : ''
        console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${def}`)
      })
    }

    await sql.end()
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error)
    await sql.end()
  }
}

async function main() {
  const local =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'
  const dev = process.env.DEV_POSTGRES_URL
  const uat = process.env.UAT_POSTGRES_URL

  await checkDatabase('LOCAL', local)

  if (dev) {
    await checkDatabase('DEV', dev)
  }

  if (uat) {
    await checkDatabase('UAT', uat)
  }

  process.exit(0)
}

main()
