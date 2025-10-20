/**
 * Migration Script
 * Applies pending migrations to specified environment
 *
 * Usage:
 *   npm run db:migrate:run [environment]
 *   npm run db:migrate:run local
 *   npm run db:migrate:run dev
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

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
 * Apply migrations to database
 */
async function applyMigrations(env: Environment): Promise<void> {
  console.log(`\n🚀 Applying migrations to ${env.toUpperCase()} database\n`)

  const connectionUrl = getConnectionUrl(env)
  const sql = postgres(connectionUrl, { max: 1 })
  const db = drizzle(sql)

  try {
    console.log('📦 Running migrations...')
    await migrate(db, { migrationsFolder: 'drizzle/postgres' })
    console.log('✅ Migrations applied successfully!\n')
  } catch (error) {
    console.error('\n❌ Migration failed!\n')
    if (error instanceof Error) {
      console.error('Error Message:', error.message)
      console.error('\nError Name:', error.name)
      console.error('\nFull Error:', JSON.stringify(error, null, 2))
      console.error('\nStack trace:')
      console.error(error.stack)
    } else {
      console.error('Error (unknown type):', JSON.stringify(error, null, 2))
    }
    throw error
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
    console.log('\n⚠️  WARNING: You are about to migrate PRODUCTION database!')
    console.log('⚠️  Ensure you have:')
    console.log('   1. Created a backup')
    console.log('   2. Tested with dry-run')
    console.log('   3. Reviewed the migration SQL\n')
  }

  try {
    await applyMigrations(environment)
    console.log('💡 Next Steps:')
    console.log(`   1. Verify schema: npm run db:compare local ${environment}`)
    console.log(`   2. Test the application thoroughly\n`)
  } catch (error) {
    console.error('\n💥 Migration failed. Please check the error above.\n')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { applyMigrations }
