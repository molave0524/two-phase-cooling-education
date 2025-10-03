/* eslint-disable no-console */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Use a temporary database path
const dbPath = path.join(__dirname, '.data', 'app-new.db')
const oldDbPath = path.join(__dirname, '.data', 'app.db')

// Make sure .data directory exists
const dataDir = path.join(__dirname, '.data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

console.log('Creating fresh SQLite database at:', dbPath)

const db = new Database(dbPath)

try {
  // Create products table
  console.log('Creating products table...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      description TEXT,
      price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      category TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `)

  // Create orders table
  console.log('Creating orders table...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      payment_intent_id TEXT,
      customer TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      tax_rate REAL NOT NULL,
      shipping REAL NOT NULL,
      shipping_method TEXT NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      discount_code TEXT,
      total REAL NOT NULL,
      notes TEXT,
      metadata TEXT,
      tracking_number TEXT,
      shipped_at INTEGER,
      delivered_at INTEGER,
      cancelled_at INTEGER,
      cancellation_reason TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `)

  // Create order_items table
  console.log('Creating order_items table...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `)

  // Insert products data
  console.log('Inserting products...')
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, sku, description, price, stock_quantity, image_url, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const products = [
    {
      id: 'pro-series',
      name: 'ThermalEdge Pro Series',
      sku: 'TEPRO-2024-BLK',
      description: 'Professional-grade two-phase cooling system',
      price: 1299.99,
      stock: 50,
      image: 'https://picsum.photos/seed/pro/400/400',
      category: 'cooling-systems',
    },
    {
      id: 'compact-series',
      name: 'ThermalEdge Compact',
      sku: 'TECOM-2024-GRY',
      description: 'Compact two-phase cooling solution',
      price: 899.99,
      stock: 75,
      image: 'https://picsum.photos/seed/compact/400/400',
      category: 'cooling-systems',
    },
  ]

  for (const product of products) {
    insertProduct.run(
      product.id,
      product.name,
      product.sku,
      product.description,
      product.price,
      product.stock,
      product.image,
      product.category
    )
  }

  console.log(`✓ Inserted ${products.length} products`)

  // Verify tables were created
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
  console.log('\nCreated tables:', tables.map(t => t.name).join(', '))

  // Show product count
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`Products in database: ${productCount.count}`)

  console.log('\n✓ Database created successfully!')
  console.log('\nNext steps:')
  console.log('1. Stop any running dev servers')
  console.log('2. Rename .data/app.db to .data/app-old.db (if it exists)')
  console.log('3. Rename .data/app-new.db to .data/app.db')
  console.log('4. Start the dev server with: npm run dev')
} catch (error) {
  console.error('Failed to create database:', error)
  process.exit(1)
} finally {
  db.close()
}
