/**
 * Copy catalog schema tables from LOCAL to DEV
 */

import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function copyCatalogToRDev() {
  const localConnectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

  const devConnectionString = process.env.DEV_POSTGRES_URL

  if (!devConnectionString) {
    console.error('DEV_POSTGRES_URL not set')
    process.exit(1)
  }

  console.log('Connecting to LOCAL database...')
  const localSql = postgres(localConnectionString, {
    max: 1,
    onnotice: () => {},
  })

  console.log('Connecting to DEV database...')
  const devSql = postgres(devConnectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\n=== Copying catalog schema from LOCAL to DEV ===\n')

    // ========================================================================
    // Check LOCAL data
    // ========================================================================
    console.log('Checking LOCAL data:')

    const localProducts = await localSql`
      SELECT COUNT(*) as count FROM catalog.products
    `
    console.log(`  catalog.products: ${localProducts[0].count} rows`)

    const localProductComponents = await localSql`
      SELECT COUNT(*) as count FROM catalog.product_components
    `
    console.log(`  catalog.product_components: ${localProductComponents[0].count} rows\n`)

    if (localProducts[0].count === '0' && localProductComponents[0].count === '0') {
      console.log('⚠️  No data in LOCAL catalog schema to copy')
      await localSql.end()
      await devSql.end()
      process.exit(0)
    }

    // ========================================================================
    // Truncate DEV tables
    // ========================================================================
    console.log('Truncating DEV catalog tables...')
    await devSql.unsafe(`TRUNCATE TABLE catalog.product_components CASCADE`)
    console.log('  ✓ catalog.product_components truncated')

    await devSql.unsafe(`TRUNCATE TABLE catalog.products CASCADE`)
    console.log('  ✓ catalog.products truncated\n')

    // ========================================================================
    // Copy products
    // ========================================================================
    if (parseInt(localProducts[0].count) > 0) {
      console.log('Copying catalog.products...')

      const products = await localSql`
        SELECT * FROM catalog.products ORDER BY created_at
      `

      for (const product of products) {
        await devSql`
          INSERT INTO catalog.products ${devSql(product)}
        `
      }

      console.log(`  ✓ Copied ${products.length} products\n`)
    }

    // ========================================================================
    // Copy product_components
    // ========================================================================
    if (parseInt(localProductComponents[0].count) > 0) {
      console.log('Copying catalog.product_components...')

      const components = await localSql`
        SELECT * FROM catalog.product_components ORDER BY created_at
      `

      for (const component of components) {
        await devSql`
          INSERT INTO catalog.product_components ${devSql(component)}
        `
      }

      console.log(`  ✓ Copied ${components.length} product components\n`)
    }

    // ========================================================================
    // Verify DEV data
    // ========================================================================
    console.log('Verifying DEV data:')

    const devProducts = await devSql`
      SELECT COUNT(*) as count FROM catalog.products
    `
    console.log(`  catalog.products: ${devProducts[0].count} rows`)

    const devProductComponents = await devSql`
      SELECT COUNT(*) as count FROM catalog.product_components
    `
    console.log(`  catalog.product_components: ${devProductComponents[0].count} rows\n`)

    console.log('✓ Catalog schema copied successfully from LOCAL to DEV!')

    await localSql.end()
    await devSql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Copy failed:', error)
    await localSql.end()
    await devSql.end()
    process.exit(1)
  }
}

copyCatalogToRDev()
