const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const connectionString = envVars.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL not found in environment variables');
  process.exit(1);
}

async function migrate() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add SKU column if it doesn't exist
    console.log('Adding SKU column...');
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'products' AND column_name = 'sku'
          ) THEN
              ALTER TABLE products ADD COLUMN sku TEXT NOT NULL DEFAULT '';
          END IF;
      END $$;
    `);
    console.log('SKU column added successfully');

    // Update existing products with SKU values
    console.log('Updating product SKUs...');
    await client.query(`UPDATE products SET sku = 'TPC-CASE-PRO-001' WHERE slug = 'thermosphere-pro-pc-case'`);
    await client.query(`UPDATE products SET sku = 'TPC-GPU-ELITE-001' WHERE slug = 'cryoflow-elite-gpu-cooler'`);
    await client.query(`UPDATE products SET sku = 'TPC-CPU-BASIC-001' WHERE slug = 'quantum-freeze-cpu-cooler'`);
    console.log('Product SKUs updated successfully');

    // Verify the changes
    const result = await client.query('SELECT id, name, sku FROM products');
    console.log('\nProducts with SKUs:');
    result.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.sku}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nMigration completed successfully!');
  }
}

migrate();
