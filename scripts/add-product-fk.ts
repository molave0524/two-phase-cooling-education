/**
 * Migration script to add FK constraint from order_items.product_id to products.id
 * Run with: npx tsx scripts/add-product-fk.ts
 */

import { db } from '@/db'
import { sql } from 'drizzle-orm'

async function addProductFK() {
  try {
    console.log('Adding FK constraint to order_items.product_id...')

    await db.execute(sql`
      ALTER TABLE order_items
      ADD CONSTRAINT order_items_product_id_products_id_fk
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE
    `)

    console.log('✓ FK constraint added successfully')
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('✓ FK constraint already exists')
    } else {
      console.error('Error adding FK constraint:', err.message)
      throw err
    }
  }
}

addProductFK()
  .then(() => {
    console.log('Migration completed')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
