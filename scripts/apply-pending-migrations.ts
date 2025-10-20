/**
 * Apply Pending Migrations Manually
 * Applies migrations 0010-0016 one by one
 */
import postgres from 'postgres'
import { config as dotenvConfig } from 'dotenv'
import { readFile, readdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

dotenvConfig({ path: '.env.local' })

async function applyPendingMigrations() {
  const connectionUrl = process.env.DEV_POSTGRES_URL!
  const sql = postgres(connectionUrl, { max: 1 })

  try {
    console.log('🚀 Applying pending migrations to DEV database...\n')

    // Get already applied migrations
    const applied = await sql`SELECT hash FROM __drizzle_migrations`
    const appliedHashes = new Set(applied.map((r: any) => r.hash))
    console.log(`Applied migrations: ${appliedHashes.size}\n`)

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'drizzle/postgres')
    const files = await readdir(migrationsDir)
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort()

    console.log(`Total migration files: ${migrationFiles.length}\n`)

    let appliedCount = 0

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file)
      const content = await readFile(filePath, 'utf-8')
      const hash = crypto.createHash('sha256').update(content).digest('hex')

      if (appliedHashes.has(hash)) {
        console.log(`⏭️  Skipping ${file} (already applied)`)
        continue
      }

      console.log(`\n📝 Applying ${file}...`)

      try {
        // Split by statement breakpoint if exists
        const statements = content
          .split('--> statement-breakpoint')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--'))

        for (const statement of statements) {
          if (statement.trim()) {
            await sql.unsafe(statement)
          }
        }

        // Mark as applied
        const timestamp = Date.now()
        await sql`
          INSERT INTO __drizzle_migrations (hash, created_at)
          VALUES (${hash}, ${timestamp})
        `

        console.log(`✅ Applied ${file}`)
        appliedCount++
      } catch (error) {
        console.error(`\n❌ Failed to apply ${file}`)
        if (error instanceof Error) {
          console.error('Error:', error.message)
          if ('code' in error) {
            console.error('Error Code:', (error as any).code)
          }
          if ('position' in error) {
            console.error('Position:', (error as any).position)
          }
          if ('detail' in error) {
            console.error('Detail:', (error as any).detail)
          }
        }
        throw error
      }
    }

    console.log(`\n✅ Successfully applied ${appliedCount} new migrations!\n`)
  } catch (error) {
    console.error('\n💥 Migration failed!')
    throw error
  } finally {
    await sql.end()
  }
}

applyPendingMigrations()
