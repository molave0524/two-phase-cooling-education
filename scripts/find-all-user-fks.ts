import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

async function findConstraints() {
  const sql = postgres(process.env.DEV_POSTGRES_URL!, { max: 1 })
  try {
    const constraints = await sql`
      SELECT
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema IN ('auth', 'store', 'public')
        AND kcu.column_name LIKE '%user%'
      ORDER BY tc.table_schema, tc.table_name
    `

    console.log('All Foreign Keys with user in column name:\n')
    constraints.forEach((c: any) => {
      console.log(`${c.table_schema}.${c.table_name}.${c.column_name}`)
      console.log(
        `  DROP: ALTER TABLE ${c.table_schema}.${c.table_name} DROP CONSTRAINT IF EXISTS ${c.constraint_name};`
      )
      console.log('')
    })
  } finally {
    await sql.end()
  }
}

findConstraints()
