const Database = require('better-sqlite3');
const db = new Database('.data/app.db');

console.log('Tables in database:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => {
  console.log(`- ${table.name}`);
});

console.log('\nChecking for auth tables:');
const authTables = ['accounts', 'sessions', 'users', 'verification_tokens'];
authTables.forEach(tableName => {
  const exists = tables.find(t => t.name === tableName);
  console.log(`${tableName}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
});

db.close();
