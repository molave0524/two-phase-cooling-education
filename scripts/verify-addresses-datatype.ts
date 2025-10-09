import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function verifyDataTypes() {
  console.log('🔍 Verifying addresses.created_at datatype between LOCAL and DEV...\n')

  // LOCAL
  const localUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!localUrl) {
    console.error('❌ LOCAL DATABASE_URL not found')
    process.exit(1)
  }

  const localPool = new Pool({ connectionString: localUrl })
  const localDb = drizzle(localPool)

  console.log('📊 LOCAL Database:')
  const localResult = await localDb.execute(sql`
    SELECT
      column_name,
      data_type,
      datetime_precision,
      CASE
        WHEN data_type = 'timestamp without time zone' AND datetime_precision IS NOT NULL THEN
          'timestamp(' || datetime_precision || ') without time zone'
        WHEN data_type = 'timestamp with time zone' AND datetime_precision IS NOT NULL THEN
          'timestamp(' || datetime_precision || ') with time zone'
        ELSE data_type
      END as full_type_name,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'addresses'
      AND column_name IN ('created_at', 'updated_at')
    ORDER BY ordinal_position
  `)
  console.table(localResult.rows)

  await localPool.end()

  // DEV
  const devUrl = process.env.DEV_POSTGRES_URL
  if (!devUrl) {
    console.error('❌ DEV_POSTGRES_URL not found')
    process.exit(1)
  }

  const devPool = new Pool({ connectionString: devUrl })
  const devDb = drizzle(devPool)

  console.log('📊 DEV Database:')
  const devResult = await devDb.execute(sql`
    SELECT
      column_name,
      data_type,
      datetime_precision,
      CASE
        WHEN data_type = 'timestamp without time zone' AND datetime_precision IS NOT NULL THEN
          'timestamp(' || datetime_precision || ') without time zone'
        WHEN data_type = 'timestamp with time zone' AND datetime_precision IS NOT NULL THEN
          'timestamp(' || datetime_precision || ') with time zone'
        ELSE data_type
      END as full_type_name,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'addresses'
      AND column_name IN ('created_at', 'updated_at')
    ORDER BY ordinal_position
  `)
  console.table(devResult.rows)

  await devPool.end()

  // Compare
  console.log('\n═'.repeat(80))
  console.log('COMPARISON:')
  console.log('═'.repeat(80))

  const localCreatedAt = localResult.rows[0] as any
  const devCreatedAt = devResult.rows[0] as any

  console.log('\naddresses.created_at:')
  console.log(`  LOCAL data_type:           ${localCreatedAt.data_type}`)
  console.log(`  LOCAL datetime_precision:  ${localCreatedAt.datetime_precision}`)
  console.log(`  LOCAL full_type_name:      ${localCreatedAt.full_type_name}`)
  console.log(`  LOCAL is_nullable:         ${localCreatedAt.is_nullable}`)
  console.log()
  console.log(`  DEV data_type:             ${devCreatedAt.data_type}`)
  console.log(`  DEV datetime_precision:    ${devCreatedAt.datetime_precision}`)
  console.log(`  DEV full_type_name:        ${devCreatedAt.full_type_name}`)
  console.log(`  DEV is_nullable:           ${devCreatedAt.is_nullable}`)
  console.log()

  if (
    localCreatedAt.data_type === devCreatedAt.data_type &&
    localCreatedAt.datetime_precision === devCreatedAt.datetime_precision &&
    localCreatedAt.is_nullable === devCreatedAt.is_nullable
  ) {
    console.log('✅ IDENTICAL - Same datatype, precision, and nullability')
    console.log('   timestamp(6) = timestamp(6) without time zone (just different notation)')
  } else {
    console.log('❌ DIFFERENT')
    console.log('   Differences found in type, precision, or nullability')
  }
  console.log('═'.repeat(80))
}

verifyDataTypes()
