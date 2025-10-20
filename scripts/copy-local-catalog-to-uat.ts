/**
 * Copy catalog schema tables from LOCAL to UAT
 */

import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function copyCatalogToUAT() {
  const localConnectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

  const uatConnectionString = process.env.UAT_POSTGRES_URL

  if (!uatConnectionString) {
    console.error('UAT_POSTGRES_URL not set')
    process.exit(1)
  }

  console.log('Connecting to LOCAL database...')
  const localSql = postgres(localConnectionString, {
    max: 1,
    onnotice: () => {},
  })

  console.log('Connecting to UAT database...')
  const uatSql = postgres(uatConnectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\n=== Copying catalog schema from LOCAL to UAT ===\n')

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
      await uatSql.end()
      process.exit(0)
    }

    // ========================================================================
    // Truncate UAT tables
    // ========================================================================
    console.log('Truncating UAT catalog tables...')
    await uatSql.unsafe(`TRUNCATE TABLE catalog.product_components CASCADE`)
    console.log('  ✓ catalog.product_components truncated')

    await uatSql.unsafe(`TRUNCATE TABLE catalog.products CASCADE`)
    console.log('  ✓ catalog.products truncated\n')

    // ========================================================================
    // Copy products
    // ========================================================================
    const productCount = parseInt(localProducts[0].count, 10)
    if (!isNaN(productCount) && productCount > 0) {
      console.log('Copying catalog.products...')

      const products = await localSql`
        SELECT * FROM catalog.products ORDER BY created_at
      `

      for (const product of products) {
        await uatSql`
          INSERT INTO catalog.products ${uatSql(product)}
        `
      }

      console.log(`  ✓ Copied ${products.length} products\n`)
    }

    // ========================================================================
    // Copy product_components
    // ========================================================================
    const componentCount = parseInt(localProductComponents[0].count, 10)
    if (!isNaN(componentCount) && componentCount > 0) {
      console.log('Copying catalog.product_components...')

      const components = await localSql`
        SELECT * FROM catalog.product_components ORDER BY created_at
      `

      for (const component of components) {
        await uatSql`
          INSERT INTO catalog.product_components ${uatSql(component)}
        `
      }

      console.log(`  ✓ Copied ${components.length} product components\n`)
    }

    // ========================================================================
    // Verify UAT data
    // ========================================================================
    console.log('Verifying UAT data:')

    const uatProducts = await uatSql`
      SELECT COUNT(*) as count FROM catalog.products
    `
    console.log(`  catalog.products: ${uatProducts[0].count} rows`)

    const uatProductComponents = await uatSql`
      SELECT COUNT(*) as count FROM catalog.product_components
    `
    console.log(`  catalog.product_components: ${uatProductComponents[0].count} rows\n`)

    console.log('✓ Catalog schema copied successfully from LOCAL to UAT!')

    await localSql.end()
    await uatSql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Copy failed:', error)
    await localSql.end()
    await uatSql.end()
    process.exit(1)
  }
}

copyCatalogToUAT()
