const Database = require('better-sqlite3');
const db = new Database('.data/app.db');

console.log('Cart Information:\n');

// Get all carts
const carts = db.prepare(`
  SELECT id, user_id, created_at, updated_at
  FROM carts
`).all();

console.log(`Total Carts: ${carts.length}\n`);

carts.forEach((cart, index) => {
  console.log(`Cart #${index + 1}:`);
  console.log(`  Cart ID: ${cart.id}`);
  console.log(`  User ID: ${cart.user_id || '(guest)'}`);
  console.log(`  Created: ${new Date(cart.created_at * 1000).toLocaleString()}`);

  // Get cart items for this cart
  const items = db.prepare(`
    SELECT ci.*, p.name as product_name, p.price
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = ?
  `).all(cart.id);

  console.log(`  Items in cart: ${items.length}`);

  if (items.length > 0) {
    items.forEach((item, i) => {
      console.log(`    ${i + 1}. ${item.product_name}`);
      console.log(`       - Product ID: ${item.product_id}`);
      console.log(`       - Quantity: ${item.quantity}`);
      console.log(`       - Price: $${item.price}`);
    });
  }
  console.log('');
});

db.close();
