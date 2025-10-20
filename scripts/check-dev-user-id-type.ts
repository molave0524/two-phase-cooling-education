/**
 * Check user_id column type in DEV database
 */
import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

async function checkUserIdType() {
  const connectionUrl = process.env.DEV_POSTGRES_URL!
  const sql = postgres(connectionUrl, { max: 1 })

  try {
    console.log('🔍 Checking user_id column types in DEV database...\n')

    const columns = await sql`
      SELECT
        table_schema,
        table_name,
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE column_name IN ('id', 'user_id')
        AND table_schema IN ('auth', 'store')
      ORDER BY table_schema, table_name, column_name
    `

    console.log('Column Types:')
    console.log('─'.repeat(80))
    columns.forEach((col: any) => {
      console.log(`${col.table_schema}.${col.table_name}.${col.column_name}`)
      console.log(`  Type: ${col.data_type} (${col.udt_name})`)
      console.log('')
    })

    // Specific check for auth.users.id
    const usersId = columns.find(
      (c: any) => c.table_schema === 'auth' && c.table_name === 'users' && c.column_name === 'id'
    )

    if (usersId) {
      console.log('\n📊 Summary:')
      console.log(`auth.users.id is ${usersId.data_type.toUpperCase()}`)
      if (usersId.data_type === 'text') {
        console.log('✅ Already converted to TEXT - Migration 0014 already applied!')
      } else {
        console.log('❌ Still INTEGER - Migration 0014 needs to be applied')
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await sql.end()
  }
}

checkUserIdType()
