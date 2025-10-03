const Database = require('better-sqlite3');
const db = new Database('.data/app.db');

console.log('Users table structure:');
const columns = db.prepare("PRAGMA table_info(users)").all();
columns.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

console.log('\nExpected columns for NextAuth:');
const expected = ['id', 'email', 'name', 'image', 'emailVerified'];
expected.forEach(colName => {
  const exists = columns.find(c => c.name === colName);
  console.log(`  ${colName}: ${exists ? '✓' : '✗ MISSING'}`);
});

db.close();
