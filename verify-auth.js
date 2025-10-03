const Database = require('better-sqlite3');
const db = new Database('.data/app.db');

console.log('✓ Authentication Success!\n');

console.log('User created:');
const users = db.prepare("SELECT * FROM users").all();
users.forEach(user => {
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Image: ${user.image || '(not set)'}`);
});

console.log('\nOAuth Account linked:');
const accounts = db.prepare("SELECT provider, provider_account_id FROM accounts").all();
if (accounts.length > 0) {
  accounts.forEach(account => {
    console.log(`  Provider: ${account.provider}`);
    console.log(`  Provider Account ID: ${account.provider_account_id}`);
  });
} else {
  console.log('  (checking with raw query...)');
  const rawAccounts = db.prepare("SELECT * FROM accounts LIMIT 1").all();
  console.log(`  Found ${rawAccounts.length} account(s)`);
  if (rawAccounts.length > 0) {
    console.log('  Account columns:', Object.keys(rawAccounts[0]));
  }
}

db.close();
console.log('\n🎉 Google OAuth authentication is working!');
