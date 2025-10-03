const Database = require('better-sqlite3');
const db = new Database('.data/app.db');

console.log('Users in database:');
const users = db.prepare("SELECT id, email, name, image FROM users").all();
if (users.length === 0) {
  console.log('  (no users found)');
} else {
  users.forEach(user => {
    console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
  });
}

console.log('\nAccounts in database:');
const accounts = db.prepare("SELECT id, userId, provider, providerAccountId FROM accounts").all();
if (accounts.length === 0) {
  console.log('  (no accounts found)');
} else {
  accounts.forEach(account => {
    console.log(`  - ID: ${account.id}, Provider: ${account.provider}, User ID: ${account.userId}`);
  });
}

db.close();
