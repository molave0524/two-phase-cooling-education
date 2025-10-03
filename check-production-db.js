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

async function checkDatabase() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to production database');

    // Check if SKU column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    console.log('\nSKU Column Info:');
    console.log(columnCheck.rows);

    // Get all products with their SKU values
    const products = await client.query('SELECT id, name, slug, sku FROM products ORDER BY id');

    console.log('\nAll Products:');
    products.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Slug: ${row.slug}, SKU: "${row.sku}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDatabase();
