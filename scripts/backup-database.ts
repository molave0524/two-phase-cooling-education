/**
 * Database Backup Script
 * Creates a full backup of a PostgreSQL database before migrations
 *
 * Usage:
 *   npm run db:backup [environment]
 *   npm run db:backup local
 *   npm run db:backup dev
 *   npm run db:backup uat
 *   npm run db:backup prod
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

type Environment = 'local' | 'dev' | 'uat' | 'prod'

interface BackupOptions {
  environment: Environment
  outputDir?: string
  includeData?: boolean
  compress?: boolean
}

/**
 * Get database connection details from environment
 */
function getDatabaseConfig(env: Environment) {
  if (env === 'local') {
    return {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || '5432',
      database: process.env.POSTGRES_DB || 'postgres',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    }
  }

  // For remote environments, parse the connection URL
  const envVar = `${env.toUpperCase()}_POSTGRES_URL`
  const connectionUrl = process.env[envVar]

  if (!connectionUrl) {
    throw new Error(`Missing environment variable: ${envVar}`)
  }

  const url = new URL(connectionUrl)
  return {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
  }
}

/**
 * Create backup directory if it doesn't exist
 */
async function ensureBackupDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
    console.log(`✓ Created backup directory: ${dir}`)
  }
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename(env: Environment, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `backup-${env}-${timestamp}.${extension}`
}

/**
 * Create a full database backup using pg_dump
 */
async function backupDatabase(options: BackupOptions): Promise<string> {
  const { environment, outputDir = './backups', includeData = true, compress = true } = options

  console.log(`\n🔄 Starting backup for ${environment.toUpperCase()} database...\n`)

  // Get database config
  const config = getDatabaseConfig(environment)
  console.log(`📊 Database: ${config.database}`)
  console.log(`🖥️  Host: ${config.host}:${config.port}`)
  console.log(`👤 User: ${config.user}\n`)

  // Ensure backup directory exists
  await ensureBackupDir(outputDir)

  // Generate backup filename
  const extension = compress ? 'sql.gz' : 'sql'
  const filename = generateBackupFilename(environment, extension)
  const backupPath = path.join(outputDir, filename)

  // Build pg_dump command
  const pgDumpArgs = [
    `--host=${config.host}`,
    `--port=${config.port}`,
    `--username=${config.user}`,
    `--dbname=${config.database}`,
    '--format=plain',
    '--verbose',
    '--no-owner',
    '--no-acl',
  ]

  if (!includeData) {
    pgDumpArgs.push('--schema-only')
    console.log('📋 Mode: Schema only (no data)')
  } else {
    console.log('📋 Mode: Full backup (schema + data)')
  }

  if (compress) {
    console.log('🗜️  Compression: Enabled')
  }

  const pgDumpCommand = `pg_dump ${pgDumpArgs.join(' ')}`
  const fullCommand = compress
    ? `${pgDumpCommand} | gzip > "${backupPath}"`
    : `${pgDumpCommand} > "${backupPath}"`

  // Set password via environment variable
  const env = {
    ...process.env,
    PGPASSWORD: config.password,
  }

  try {
    console.log('\n⏳ Creating backup...\n')

    const { stderr } = await execAsync(fullCommand, { env, maxBuffer: 1024 * 1024 * 100 })

    if (stderr && !stderr.includes('WARNING')) {
      console.warn('⚠️  Warnings during backup:')
      console.warn(stderr)
    }

    console.log(`\n✅ Backup completed successfully!`)
    console.log(`📁 Backup file: ${backupPath}`)

    // Get file size
    const { stdout: sizeOutput } = await execAsync(
      process.platform === 'win32'
        ? `powershell -command "(Get-Item '${backupPath}').length"`
        : `stat -f%z "${backupPath}" 2>/dev/null || stat -c%s "${backupPath}"`
    )

    const sizeBytes = parseInt(sizeOutput.trim())
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2)
    console.log(`📊 Size: ${sizeMB} MB`)

    return backupPath
  } catch (error) {
    console.error('\n❌ Backup failed!')
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
    }
    throw error
  }
}

/**
 * Create a schema-only backup (fast, for comparison)
 */
async function backupSchemaOnly(env: Environment): Promise<string> {
  return backupDatabase({
    environment: env,
    includeData: false,
    compress: false,
  })
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

  // Warn for production
  if (environment === 'prod') {
    console.log('\n⚠️  WARNING: You are backing up PRODUCTION database!')
    console.log('⚠️  This may take a while and impact performance.\n')
  }

  try {
    const backupPath = await backupDatabase({
      environment,
      includeData: true,
      compress: true,
    })

    console.log('\n💡 Backup Tips:')
    console.log('   - Store backups securely and encrypt if they contain sensitive data')
    console.log('   - Test restore process regularly')
    console.log('   - Keep backups for compliance/retention requirements')
    console.log('   - Consider uploading to S3/Azure Blob for long-term storage')

    console.log('\n💡 To restore this backup:')
    if (backupPath.endsWith('.gz')) {
      console.log(`   gunzip -c "${backupPath}" | psql -h HOST -U USER -d DATABASE`)
    } else {
      console.log(`   psql -h HOST -U USER -d DATABASE < "${backupPath}"`)
    }

    console.log('\n✨ Done!\n')
  } catch (error) {
    console.error('\n💥 Backup failed. Please check the error above.\n')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { backupDatabase, backupSchemaOnly, getDatabaseConfig }
