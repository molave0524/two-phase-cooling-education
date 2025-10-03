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

async function updateSKUs() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to production database');

    // Update ALL products with their SKU values
    console.log('Updating all product SKUs...');

    await client.query(`UPDATE products SET sku = 'TPC-CASE-PRO-001' WHERE id = 'two-phase-cooling-case-v1'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-COMPACT-002' WHERE id = 'two-phase-cooling-case-compact'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-ELITE-003' WHERE id = 'two-phase-cooling-case-elite'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-GAMING-004' WHERE id = 'two-phase-cooling-case-gaming'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-WS-005' WHERE id = 'two-phase-cooling-case-workstation'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-SILENT-006' WHERE id = 'two-phase-cooling-case-silent'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-OC-007' WHERE id = 'two-phase-cooling-case-overclock'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-ECO-008' WHERE id = 'two-phase-cooling-case-eco'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-MINI-009' WHERE id = 'two-phase-cooling-case-mini'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-CREATOR-010' WHERE id = 'two-phase-cooling-case-creator'`);
    await client.query(`UPDATE products SET sku = 'TPC-CASE-SERVER-011' WHERE id = 'two-phase-cooling-case-server'`);

    console.log('Product SKUs updated successfully');

    // Verify the changes
    const result = await client.query('SELECT id, name, sku FROM products ORDER BY id');
    console.log('\nAll Products with SKUs:');
    result.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.sku}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nSKU update completed!');
  }
}

updateSKUs();
