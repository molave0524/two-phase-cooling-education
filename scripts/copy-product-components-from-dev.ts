/**
 * Copy Product Components from DEV to Local
 * Copies all product component relationships from DEV to local database
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { productComponents } from '../src/db/schemas/catalog'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function copyProductComponents() {
  const devUrl = process.env.DEV_POSTGRES_URL
  const localUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!devUrl) {
    console.error('❌ DEV_POSTGRES_URL not found in .env.local')
    process.exit(1)
  }

  if (!localUrl) {
    console.error('❌ DATABASE_URL not found in .env.local')
    process.exit(1)
  }

  console.log('📡 Connecting to DEV database...')
  const devClient = postgres(devUrl)
  const devDb = drizzle(devClient)

  console.log('💾 Connecting to local database...')
  const localClient = postgres(localUrl)
  const localDb = drizzle(localClient)

  try {
    // Fetch all product components from DEV
    console.log('📥 Fetching product components from DEV...')
    const devComponents = await devDb.select().from(productComponents)
    console.log(`✓ Found ${devComponents.length} component relationships in DEV`)

    if (devComponents.length === 0) {
      console.log('⚠ No product components found in DEV database')
      process.exit(0)
    }

    // Clear local product components
    console.log('🗑️  Clearing local product components...')
    await localDb.delete(productComponents)
    console.log('✓ Local product components cleared')

    // Insert components into local database
    console.log('📤 Inserting product components into local database...')
    let inserted = 0
    for (const component of devComponents) {
      try {
        await localDb.insert(productComponents).values(component)
        inserted++
        console.log(
          `✓ Inserted component: ${component.parentProductId} → ${component.componentProductId} (${inserted}/${devComponents.length})`
        )
      } catch (error: any) {
        console.error(`❌ Failed to insert component ${component.id}:`, error.message)
      }
    }

    console.log(`\n✅ Successfully copied ${inserted} product components from DEV to local!`)
  } catch (error: any) {
    console.error('❌ Error copying product components:', error.message)
    process.exit(1)
  } finally {
    await devClient.end()
    await localClient.end()
  }
}

copyProductComponents()
