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
        tc.constraint_type,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (kcu.column_name = 'user_id' OR ccu.column_name = 'id')
        AND tc.table_schema IN ('auth', 'store')
      ORDER BY tc.table_schema, tc.table_name
    `

    console.log('Foreign Key Constraints related to user_id:\n')
    constraints.forEach((c: any) => {
      console.log(`${c.table_schema}.${c.table_name}`)
      console.log(`  Constraint: ${c.constraint_name}`)
      console.log(
        `  Column: ${c.column_name} -> ${c.foreign_table_schema}.${c.foreign_table_name}.${c.foreign_column_name}`
      )
      console.log('')
    })
  } finally {
    await sql.end()
  }
}

findConstraints()
