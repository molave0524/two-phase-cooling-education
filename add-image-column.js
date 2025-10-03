const Database = require('better-sqlite3');
const db = new Database('.data/app.db');

console.log('Adding image column to users table...');
try {
  db.prepare('ALTER TABLE users ADD COLUMN image TEXT').run();
  console.log('✓ Successfully added image column');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('✓ Column already exists');
  } else {
    console.error('✗ Error:', error.message);
  }
}

console.log('\nVerifying users table structure:');
const columns = db.prepare("PRAGMA table_info(users)").all();
columns.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

db.close();
console.log('\nDone!');
