/* eslint-disable no-console */
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'local.db')
const db = new Database(dbPath)

try {
  console.log('Updating local SQLite database...')

  // Check if product_sku column exists
  const columns = db
    .prepare(
      "SELECT name FROM pragma_table_info('order_items') WHERE name='product_sku'"
    )
    .all()

  if (columns.length === 0) {
    console.log('Adding product_sku column to order_items table...')
    db.prepare(
      "ALTER TABLE order_items ADD COLUMN product_sku TEXT NOT NULL DEFAULT ''"
    ).run()
    console.log('✓ product_sku column added successfully')
  } else {
    console.log('✓ product_sku column already exists')
  }

  // Verify the column was added
  const allColumns = db.prepare("SELECT * FROM pragma_table_info('order_items')").all()
  console.log('\norder_items table schema:')
  allColumns.forEach(col => {
    console.log(`  ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`)
  })

  console.log('\n✓ Migration completed successfully!')
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
} finally {
  db.close()
}
