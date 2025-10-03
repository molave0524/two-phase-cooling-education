const Database = require('better-sqlite3');
const db = new Database('.data/app.db');

console.log('Deleting all users and accounts...');
db.prepare('DELETE FROM accounts').run();
db.prepare('DELETE FROM sessions').run();
db.prepare('DELETE FROM users').run();
console.log('✓ Database cleaned');

console.log('\nVerifying:');
const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
const accounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
const sessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();

console.log(`  Users: ${users.count}`);
console.log(`  Accounts: ${accounts.count}`);
console.log(`  Sessions: ${sessions.count}`);

db.close();
console.log('\nReady for fresh sign-in!');
