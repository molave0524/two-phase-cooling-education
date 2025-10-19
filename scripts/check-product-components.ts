/**
 * Check product_components table existence across environments
 */

import postgres from 'postgres'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function checkProductComponents() {
  const envs = {
    LOCAL: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    DEV: process.env.DEV_POSTGRES_URL,
  }

  for (const [name, url] of Object.entries(envs)) {
    if (!url) {
      console.log(`❌ ${name}: No URL configured`)
      continue
    }

    const client = postgres(url)

    try {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📊 ${name} Database`)
      console.log('='.repeat(60))

      // Check if table exists
      const tableExists = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'catalog'
          AND table_name = 'product_components'
        ) as exists
      `

      if (tableExists[0].exists) {
        console.log('✅ Table catalog.product_components EXISTS')

        // Get column count
        const columns = await client`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'catalog'
          AND table_name = 'product_components'
          ORDER BY ordinal_position
        `

        console.log(`   Columns: ${columns.length}`)
        columns.forEach((col: any) => {
          console.log(`   - ${col.column_name} (${col.data_type})`)
        })

        // Get row count
        const count = await client`
          SELECT COUNT(*) as count FROM catalog.product_components
        `
        console.log(`   Rows: ${count[0].count}`)
      } else {
        console.log('❌ Table catalog.product_components DOES NOT EXIST')
      }
    } catch (error: any) {
      console.error(`❌ Error checking ${name}:`, error.message)
    } finally {
      await client.end()
    }
  }
}

checkProductComponents()
