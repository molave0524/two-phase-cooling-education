/**
 * Migration Dry-Run Script
 * Tests migrations in a transaction and rolls them back
 * Shows what would happen without actually changing the database
 *
 * Usage:
 *   npm run db:migrate:dryrun [environment]
 *   npm run db:migrate:dryrun local
 *   npm run db:migrate:dryrun dev
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

type Environment = 'local' | 'dev' | 'uat' | 'prod'

/**
 * Get database connection URL for environment
 */
function getConnectionUrl(env: Environment): string {
  if (env === 'local') {
    const host = process.env.POSTGRES_HOST || 'localhost'
    const port = process.env.POSTGRES_PORT || '5432'
    const database = process.env.POSTGRES_DB || 'postgres'
    const user = process.env.POSTGRES_USER || 'postgres'
    const password = process.env.POSTGRES_PASSWORD || 'postgres'
    return `postgresql://${user}:${password}@${host}:${port}/${database}`
  }

  const envVar = `${env.toUpperCase()}_POSTGRES_URL`
  const connectionUrl = process.env[envVar]

  if (!connectionUrl) {
    throw new Error(`Missing environment variable: ${envVar}`)
  }

  return connectionUrl
}

/**
 * Get pending migration files
 */
async function getPendingMigrations(): Promise<string[]> {
  const migrationsDir = path.join(process.cwd(), 'drizzle/postgres')
  const files = await readdir(migrationsDir)
  return files.filter(f => f.endsWith('.sql')).sort()
}

/**
 * Analyze migration SQL for potentially dangerous operations
 */
async function analyzeMigration(filePath: string): Promise<{
  file: string
  dangerous: boolean
  operations: string[]
  warnings: string[]
}> {
  const content = await readFile(filePath, 'utf-8')
  const operations: string[] = []
  const warnings: string[] = []
  let dangerous = false

  // Detect dangerous operations
  const dangerousPatterns = [
    { pattern: /DROP\s+TABLE/i, msg: 'DROP TABLE - Will permanently delete table and all data' },
    { pattern: /DROP\s+COLUMN/i, msg: 'DROP COLUMN - Will permanently delete column data' },
    { pattern: /ALTER\s+COLUMN.*DROP/i, msg: 'ALTER COLUMN DROP - May lose data' },
    { pattern: /TRUNCATE/i, msg: 'TRUNCATE - Will delete all rows from table' },
    { pattern: /DELETE\s+FROM/i, msg: 'DELETE FROM - Will remove data' },
  ]

  // Detect risky operations
  const riskyPatterns = [
    { pattern: /ALTER\s+COLUMN.*TYPE/i, msg: 'ALTER COLUMN TYPE - May fail if data incompatible' },
    { pattern: /ADD\s+CONSTRAINT.*NOT\s+NULL/i, msg: 'ADD NOT NULL - Will fail if existing nulls' },
    { pattern: /ADD\s+CONSTRAINT.*UNIQUE/i, msg: 'ADD UNIQUE - Will fail if duplicates exist' },
    {
      pattern: /ADD\s+CONSTRAINT.*FOREIGN\s+KEY/i,
      msg: 'ADD FOREIGN KEY - May fail on orphaned records',
    },
  ]

  // Detect all operations
  const allPatterns = [
    { pattern: /CREATE\s+TABLE/i, name: 'CREATE TABLE' },
    { pattern: /ALTER\s+TABLE/i, name: 'ALTER TABLE' },
    { pattern: /CREATE\s+INDEX/i, name: 'CREATE INDEX' },
    { pattern: /DROP\s+INDEX/i, name: 'DROP INDEX' },
  ]

  // Check for dangerous operations
  for (const { pattern, msg } of dangerousPatterns) {
    if (pattern.test(content)) {
      dangerous = true
      warnings.push(`⚠️  DANGEROUS: ${msg}`)
    }
  }

  // Check for risky operations
  for (const { pattern, msg } of riskyPatterns) {
    if (pattern.test(content)) {
      warnings.push(`⚡ RISKY: ${msg}`)
    }
  }

  // Extract all operations
  for (const { pattern, name } of allPatterns) {
    const matches = content.match(new RegExp(pattern, 'gi'))
    if (matches) {
      operations.push(`${name} (${matches.length}x)`)
    }
  }

  return {
    file: path.basename(filePath),
    dangerous,
    operations,
    warnings,
  }
}

/**
 * Run migrations in a transaction and rollback
 */
async function dryRunMigrations(env: Environment): Promise<void> {
  console.log(`\n🧪 DRY RUN: Testing migrations for ${env.toUpperCase()} database\n`)

  const connectionUrl = getConnectionUrl(env)
  console.log('📊 Analyzing pending migrations...\n')

  // Analyze migration files
  const migrationsDir = path.join(process.cwd(), 'drizzle/postgres')
  const migrationFiles = await getPendingMigrations()

  if (migrationFiles.length === 0) {
    console.log('✅ No pending migrations found.\n')
    return
  }

  console.log(`📝 Found ${migrationFiles.length} migration file(s):\n`)

  let hasDangerousOps = false
  for (const file of migrationFiles) {
    const analysis = await analyzeMigration(path.join(migrationsDir, file))

    console.log(`📄 ${analysis.file}`)
    if (analysis.operations.length > 0) {
      console.log(`   Operations: ${analysis.operations.join(', ')}`)
    }
    if (analysis.warnings.length > 0) {
      analysis.warnings.forEach(w => console.log(`   ${w}`))
      if (analysis.dangerous) {
        hasDangerousOps = true
      }
    }
    console.log('')
  }

  if (hasDangerousOps) {
    console.log('⚠️  WARNING: Dangerous operations detected!')
    console.log('⚠️  These operations may cause data loss if applied.\n')
  }

  // Test migration in transaction
  console.log('🔄 Testing migration in transaction...\n')

  const sql = postgres(connectionUrl, { max: 1 })
  const db = drizzle(sql)

  try {
    // Begin transaction
    await sql.begin(async tx => {
      console.log('✓ Transaction started')

      // Run migrations
      const txDb = drizzle(tx)
      await migrate(txDb, { migrationsFolder: 'drizzle/postgres' })

      console.log('✓ Migrations applied successfully')

      // Get schema info after migration
      const tables = await tx`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `

      console.log(`✓ Database has ${tables.length} tables after migration`)

      // Rollback transaction
      console.log('✓ Rolling back transaction...\n')
      throw new Error('ROLLBACK') // Force rollback
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'ROLLBACK') {
      console.log('✅ DRY RUN COMPLETE: Migrations would succeed!')
      console.log('✅ No changes were made to the database.\n')

      console.log('💡 Next Steps:')
      console.log('   1. Review the migration operations above')
      console.log('   2. Create a backup: npm run db:backup ' + env)
      console.log('   3. Apply migrations: npm run db:migrate ' + env)
      console.log('   4. Verify database: npm run db:compare local ' + env)
      console.log('')
    } else {
      console.error('\n❌ DRY RUN FAILED: Migrations would fail!\n')
      if (error instanceof Error) {
        console.error('Error:', error.message)
      }
      console.error('\n💡 Fix the migration errors before applying.\n')
      process.exit(1)
    }
  } finally {
    await sql.end()
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const environment = (args[0] || 'local') as Environment

  if (!['local', 'dev', 'uat', 'prod'].includes(environment)) {
    console.error('❌ Invalid environment. Use: local, dev, uat, or prod')
    process.exit(1)
  }

  // Extra warning for production
  if (environment === 'prod') {
    console.log('\n⚠️  NOTE: This is a dry-run test on PRODUCTION database')
    console.log('⚠️  No changes will be made, but ensure no one else is migrating!\n')
  }

  try {
    await dryRunMigrations(environment)
  } catch (error) {
    console.error('\n💥 Dry run failed. Please check the error above.\n')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { dryRunMigrations, analyzeMigration, getPendingMigrations }
