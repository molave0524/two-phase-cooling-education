# Referential Integrity Fixes

**Current Issues:** Missing or incomplete foreign key constraints leading to potential orphaned records.

---

## Issues Found

### 1. Cart Items → Products (CRITICAL)
**Current:** `cartItems.productId` references `products.id` with NO onDelete behavior
**Risk:** Deleting a product leaves orphaned cart items
**Impact:** Cart breaks when loading deleted product

### 2. Orders → Users
**Current:** `orders.userId` references `users.id` with NO onDelete behavior
**Risk:** Deleting a user orphans their orders
**Impact:** Lost order history, reporting breaks

### 3. Order Items → Products (INTENTIONAL?)
**Current:** `orderItems.productId` has NO FK constraint
**Status:** Appears intentional (denormalized design - stores productName, productSku, productImage)
**Risk:** Low (historical data preserved)

---

## Proposed Fixes

### Fix 1: Cart Items → Products

**Strategy:** RESTRICT deletion if products are in active carts

```typescript
// src/db/schema-pg.ts
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: text('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // ← ADD THIS
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

**Alternative:** CASCADE (remove from carts when product deleted)
```typescript
.references(() => products.id, { onDelete: 'cascade' })
```

**Migration:**
```sql
-- drizzle/postgres/000X_fix_cart_items_fk.sql
ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_id_products_id_fk;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_product_id_products_id_fk
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
```

### Fix 2: Orders → Users

**Strategy:** SET NULL (preserve order history even if user deleted)

```typescript
// src/db/schema-pg.ts
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'set null' }), // ← ADD THIS
  status: text('status').notNull().default('pending'),
  // ... rest of fields
})
```

**Reasoning:**
- Orders are business records (legal, accounting)
- Must preserve even if user account deleted (GDPR compliance)
- Customer info stored in JSONB `customer` field (denormalized)

**Migration:**
```sql
-- drizzle/postgres/000X_fix_orders_user_fk.sql
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_user_id_users_id_fk;

ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

### Fix 3: Order Items → Products (NO CHANGE NEEDED)

**Current Design:** Denormalized (intentional)
- `productId` stored but NO FK constraint
- `productName`, `productSku`, `productImage` stored directly
- **Reason:** Historical record preservation

**This is CORRECT for order history:**
✅ Products can be deleted without affecting past orders
✅ Order items show product info as it was at purchase time
✅ No orphaning because data is denormalized

**No migration needed.**

---

## Complete Fixed Schema

```typescript
// src/db/schema-pg.ts

// Cart Items - RESTRICT product deletion if in carts
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: text('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // ← FIXED
  quantity: integer('quantity').notNull().default(1),
  price: real('price').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Orders - Preserve orders even if user deleted
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'set null' }), // ← FIXED
  status: text('status').notNull().default('pending'),
  // ... rest unchanged
})

// Order Items - NO FK (denormalized, intentional)
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(), // ← NO FK (intentional)
  productName: text('product_name').notNull(),
  productSku: text('product_sku').notNull(),
  productImage: text('product_image').notNull(),
  // ... rest unchanged
})
```

---

## Implementation Steps

### Step 1: Update Schema

```bash
# 1. Edit schema
# Update: src/db/schema-pg.ts (see above)

# 2. Generate migration
npm run db:generate

# 3. Review generated SQL
cat drizzle/postgres/000X_fix_referential_integrity.sql
```

### Step 2: Test in DEV

```bash
# 1. Apply to DEV
npm run db:push

# 2. Test product deletion scenarios
# Try to delete product that's in a cart (should fail with RESTRICT)
# Delete user with orders (orders.userId should become NULL)

# 3. Verify constraints
psql $DATABASE_URL -c "\d+ cart_items"
psql $DATABASE_URL -c "\d+ orders"
```

### Step 3: Test in UAT (with PRD clone)

```bash
# 1. Clone PRD to UAT
./clone-prd-to-uat.sh

# 2. Apply migration to UAT
npm run db:migrate

# 3. Test with real data
# - Try deleting products that are in carts
# - Verify orders preserved when user deleted
# - Check application behavior
```

### Step 4: Apply to PRD

```bash
# 1. Backup PRD
pg_dump $POSTGRES_URL_PRD > prd-backup-$(date +%Y%m%d).sql

# 2. Apply migration
npm run db:migrate

# 3. Verify constraints
psql $POSTGRES_URL_PRD -c "\d+ cart_items"
psql $POSTGRES_URL_PRD -c "\d+ orders"
```

---

## Business Logic Updates

### Product Deletion Logic

**Before (unsafe):**
```typescript
// Directly delete product (orphans cart items)
await db.delete(products).where(eq(products.id, productId))
```

**After (safe with RESTRICT):**
```typescript
// Check for cart references first
const cartReferences = await db
  .select()
  .from(cartItems)
  .where(eq(cartItems.productId, productId))
  .limit(1)

if (cartReferences.length > 0) {
  throw new Error('Cannot delete product: exists in active carts')
}

// Or: Remove from carts first, then delete
await db.delete(cartItems).where(eq(cartItems.productId, productId))
await db.delete(products).where(eq(products.id, productId))
```

### User Deletion Logic

**Before (unsafe):**
```typescript
// Deletes user, orphans orders
await db.delete(users).where(eq(users.id, userId))
```

**After (safe with SET NULL):**
```typescript
// User deletion cascades auth tables, sets orders.userId to NULL
await db.delete(users).where(eq(users.id, userId))
// Orders preserved with userId = NULL
// Customer info still in orders.customer JSONB field
```

---

## Referential Integrity Matrix

| Child Table | Parent Table | FK Field | onDelete | Prevents Orphans? | Business Rule |
|------------|--------------|----------|----------|-------------------|---------------|
| accounts | users | userId | CASCADE | ✅ Yes | Delete auth when user deleted |
| sessions | users | userId | CASCADE | ✅ Yes | Delete sessions when user deleted |
| carts | users | userId | CASCADE | ✅ Yes | Delete carts when user deleted |
| cartItems | carts | cartId | CASCADE | ✅ Yes | Delete items when cart deleted |
| **cartItems** | **products** | **productId** | **RESTRICT** | **✅ Yes** | **Prevent product deletion if in carts** |
| **orders** | **users** | **userId** | **SET NULL** | **✅ Yes** | **Preserve orders when user deleted** |
| orderItems | orders | orderId | CASCADE | ✅ Yes | Delete items when order deleted |
| orderItems | products | productId | NO FK | N/A | Denormalized (intentional) |
| addresses | users | userId | CASCADE | ✅ Yes | Delete addresses when user deleted |

---

## Testing Checklist

### DEV Testing
- [ ] Update schema with fixes
- [ ] Generate migration files
- [ ] Apply to DEV database
- [ ] Test: Delete product in cart (should fail with RESTRICT)
- [ ] Test: Delete product not in cart (should succeed)
- [ ] Test: Delete user with orders (orders.userId becomes NULL)
- [ ] Test: Delete user without orders (cascades normally)
- [ ] Verify: Cart items have RESTRICT constraint
- [ ] Verify: Orders have SET NULL constraint

### UAT Testing (PRD Clone)
- [ ] Clone PRD database to UAT
- [ ] Apply migrations to UAT
- [ ] Test with real production data patterns
- [ ] Verify no data loss
- [ ] Check application behavior with constraints
- [ ] Performance test constraint checks

### PRD Deployment
- [ ] Backup PRD database
- [ ] Apply migrations
- [ ] Verify constraints active
- [ ] Monitor for errors
- [ ] Test critical flows (checkout, user deletion)

---

## Alternative Strategies

### Option A: Soft Deletes (Recommended for Products)

Instead of RESTRICT, use soft deletes for products:

```typescript
export const products = pgTable('products', {
  // ... existing fields
  deletedAt: timestamp('deleted_at'), // ← Add this
  isActive: boolean('is_active').notNull().default(true),
})

// Soft delete instead of hard delete
await db
  .update(products)
  .set({ deletedAt: new Date(), isActive: false })
  .where(eq(products.id, productId))

// Filter out deleted products in queries
const activeProducts = await db
  .select()
  .from(products)
  .where(and(
    eq(products.isActive, true),
    isNull(products.deletedAt)
  ))
```

**Benefits:**
- No orphaned cart items
- Can restore deleted products
- Preserves product history
- No RESTRICT errors

### Option B: CASCADE with Notification

Allow CASCADE but notify users:

```typescript
.references(() => products.id, { onDelete: 'cascade' })

// Before deleting product, notify users with items in cart
const affectedCarts = await db
  .select({ userId: carts.userId })
  .from(cartItems)
  .innerJoin(carts, eq(cartItems.cartId, carts.id))
  .where(eq(cartItems.productId, productId))

// Send notifications to affected users
for (const cart of affectedCarts) {
  await sendEmail(cart.userId, 'Product removed from cart')
}

// Then delete (cascades to cart items)
await db.delete(products).where(eq(products.id, productId))
```

---

## Recommended Approach

**Implement:**
1. ✅ **cartItems → products**: Use **soft deletes** (best UX)
2. ✅ **orders → users**: Use **SET NULL** (preserve order history)
3. ✅ **orderItems → products**: Keep NO FK (denormalized, intentional)

**Migration Priority:**
1. High: Fix orders → users (legal/compliance)
2. High: Fix cartItems → products (data integrity)
3. Low: Consider soft deletes for products (UX improvement)

---

**Ready to apply these fixes?**
