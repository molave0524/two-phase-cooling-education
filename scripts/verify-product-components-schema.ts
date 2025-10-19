/**
 * Verify product_components schema matches between code and DEV database
 */

import postgres from 'postgres'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function verifySchema() {
  const devUrl = process.env.DEV_POSTGRES_URL

  if (!devUrl) {
    console.error('❌ DEV_POSTGRES_URL not found')
    process.exit(1)
  }

  const client = postgres(devUrl)

  try {
    console.log('🔍 Checking DEV product_components schema...\n')

    const columns = await client`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'catalog'
      AND table_name = 'product_components'
      ORDER BY ordinal_position
    `

    console.log('📊 DEV Database Columns:')
    console.log('='.repeat(80))
    columns.forEach((col: any, idx: number) => {
      let type = col.data_type
      if (col.character_maximum_length) {
        type += `(${col.character_maximum_length})`
      }
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : ''
      console.log(`${idx + 1}. ${col.column_name.padEnd(25)} ${type.padEnd(30)} ${nullable}${def}`)
    })

    // Get constraints
    const constraints = await client`
      SELECT
        con.conname as constraint_name,
        con.contype as constraint_type,
        pg_get_constraintdef(con.oid) as definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'catalog'
      AND rel.relname = 'product_components'
      ORDER BY con.conname
    `

    console.log('\n🔒 Constraints:')
    console.log('='.repeat(80))
    constraints.forEach((c: any) => {
      const typeMap: any = {
        p: 'PRIMARY KEY',
        f: 'FOREIGN KEY',
        u: 'UNIQUE',
        c: 'CHECK',
      }
      console.log(`${c.constraint_name}: ${typeMap[c.constraint_type] || c.constraint_type}`)
      console.log(`  ${c.definition}`)
    })

    // Get indexes
    const indexes = await client`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'catalog'
      AND tablename = 'product_components'
      ORDER BY indexname
    `

    console.log('\n📇 Indexes:')
    console.log('='.repeat(80))
    indexes.forEach((idx: any) => {
      console.log(`${idx.indexname}:`)
      console.log(`  ${idx.indexdef}`)
    })
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

verifySchema()
