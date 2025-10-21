/**
 * Check if the role column exists in the auth.users table
 */

import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function checkRoleColumn() {
  try {
    // Check if role column exists
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND column_name = 'role';
    `)

    const rows = Array.isArray(result) ? result : result.rows || []

    if (rows.length > 0) {
      console.log('✓ Role column already exists in auth.users table')
      console.log('Column details:', rows[0])
    } else {
      console.log('✗ Role column does NOT exist in auth.users table')
      console.log('Adding role column...')

      await db.execute(sql`
        ALTER TABLE "auth"."users"
        ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'customer' NOT NULL;
      `)

      console.log('✓ Role column added successfully')
    }

    // Show all columns in users table
    const allColumns = await db.execute(sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'auth'
        AND table_name = 'users'
      ORDER BY ordinal_position;
    `)

    const allRows = Array.isArray(allColumns) ? allColumns : allColumns.rows || []

    console.log('\nAll columns in auth.users table:')
    allRows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`)
    })
  } catch (error) {
    console.error('Error checking role column:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

checkRoleColumn()
