/**
 * Copy Catalog Records from DEV to Local
 * Copies all products from DEV Neon database to local PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { products } from '../src/db/schemas/catalog'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function copyCatalogFromDev() {
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
    // Fetch all products from DEV
    console.log('📥 Fetching products from DEV...')
    const devProducts = await devDb.select().from(products)
    console.log(`✓ Found ${devProducts.length} products in DEV`)

    if (devProducts.length === 0) {
      console.log('⚠ No products found in DEV database')
      process.exit(0)
    }

    // Clear local products
    console.log('🗑️  Clearing local products...')
    await localDb.delete(products)
    console.log('✓ Local products cleared')

    // Insert products into local database
    console.log('📤 Inserting products into local database...')
    let inserted = 0
    for (const product of devProducts) {
      try {
        await localDb.insert(products).values(product)
        inserted++
        console.log(`✓ Inserted: ${product.name} (${inserted}/${devProducts.length})`)
      } catch (error: any) {
        console.error(`❌ Failed to insert ${product.name}:`, error.message)
      }
    }

    console.log(`\n✅ Successfully copied ${inserted} products from DEV to local!`)
  } catch (error: any) {
    console.error('❌ Error copying catalog:', error.message)
    process.exit(1)
  } finally {
    await devClient.end()
    await localClient.end()
  }
}

copyCatalogFromDev()
