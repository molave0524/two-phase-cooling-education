# Product Versioning & Component Strategy

**Challenge:** Maintain order immutability while allowing products/components to evolve

**Solution:** Hybrid snapshot + soft versioning approach

---

## Architecture Overview

### **Schema Design**

```typescript
// ============================================================================
// PRODUCTS TABLE (Current Catalog)
// ============================================================================
export const products = pgTable('products', {
  id: text('id').primaryKey(), // e.g., 'prod_2phase_pro'
  sku: text('sku').notNull().unique(), // e.g., 'TPC-PRO-001-V2'
  name: text('name').notNull(),
  version: integer('version').notNull().default(1), // Product version

  // Product details
  price: real('price').notNull(),
  description: text('description').notNull(),
  specifications: jsonb('specifications').notNull(),
  images: jsonb('images').notNull(),

  // Lifecycle management
  status: text('status').notNull().default('active'), // active, sunset, discontinued
  isAvailableForPurchase: boolean('is_available_for_purchase').notNull().default(true),
  sunsetDate: timestamp('sunset_date'), // When product was retired
  replacedBy: text('replaced_by').references(() => products.id), // Points to newer version

  // Versioning metadata
  versionNotes: text('version_notes'), // What changed in this version
  previousVersionId: text('previous_version_id').references(() => products.id),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// PRODUCT COMPONENTS TABLE (Current Structure)
// ============================================================================
export const productComponents = pgTable('product_components', {
  id: serial('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  // Component details
  componentType: text('component_type').notNull(), // 'part', 'upgrade', 'replacement'
  componentSku: text('component_sku').notNull(),
  componentName: text('component_name').notNull(),
  componentDescription: text('component_description'),

  // Pricing
  componentPrice: real('component_price').notNull(),
  isIncluded: boolean('is_included').notNull().default(true), // Included in base product?
  isOptional: boolean('is_optional').notNull().default(false), // Optional upgrade?

  // Ordering
  quantity: integer('quantity').notNull().default(1), // How many in product
  sortOrder: integer('sort_order').notNull().default(0),

  // Metadata
  specifications: jsonb('specifications'),
  image: text('image'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// ORDERS TABLE (Unchanged)
// ============================================================================
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  // ... existing fields
})

// ============================================================================
// ORDER ITEMS TABLE (Snapshot with Optional FK)
// ============================================================================
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),

  // SNAPSHOT: Product data at purchase time (denormalized)
  productId: text('product_id').notNull(), // NO FK (allows product deletion)
  productSku: text('product_sku').notNull(),
  productName: text('product_name').notNull(),
  productVersion: integer('product_version').notNull(), // Version at purchase
  productImage: text('product_image').notNull(),

  // SNAPSHOT: Components at purchase time (denormalized JSONB)
  components: jsonb('components').notNull(), // Array of component snapshots
  /*
    Example structure:
    [
      {
        componentSku: 'TPC-PUMP-A1',
        componentName: 'Coolant Pump',
        componentType: 'part',
        quantity: 1,
        price: 89.99,
        isIncluded: true,
        specifications: {...}
      },
      {
        componentSku: 'TPC-UPGRADE-RGB',
        componentName: 'RGB Lighting Kit',
        componentType: 'upgrade',
        quantity: 1,
        price: 49.99,
        isIncluded: false, // Optional add-on
        specifications: {...}
      }
    ]
  */

  // Pricing
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(), // Base product price
  componentsPrice: real('components_price').notNull(), // Total optional components price
  lineTotal: real('line_total').notNull(), // quantity * (unitPrice + componentsPrice)

  // Optional: Reporting FK (nullable, can be null if product deleted)
  currentProductId: text('current_product_id')
    .references(() => products.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ============================================================================
// PRODUCT VERSION HISTORY TABLE (Optional - for detailed tracking)
// ============================================================================
export const productVersionHistory = pgTable('product_version_history', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull(),
  version: integer('version').notNull(),

  // What changed
  changeType: text('change_type').notNull(), // 'price', 'component', 'spec', 'major'
  changeDescription: text('change_description').notNull(),
  changedBy: integer('changed_by').references(() => users.id, { onDelete: 'set null' }),

  // Before/After snapshot (for audit)
  beforeSnapshot: jsonb('before_snapshot'),
  afterSnapshot: jsonb('after_snapshot'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

---

## Workflow: Product Evolution

### Scenario 1: Minor Change (Price Update)

**When:** Price changes but product fundamentally same

```typescript
// ❌ DON'T: Direct update (breaks order history)
await db
  .update(products)
  .set({ price: 1399.99 })
  .where(eq(products.id, 'prod_2phase_pro'))

// ✅ DO: Check for orders first, then decide
const hasOrders = await db
  .select({ count: sql`COUNT(*)` })
  .from(orderItems)
  .where(eq(orderItems.productId, 'prod_2phase_pro'))

if (hasOrders[0].count > 0) {
  // Has orders - create new version
  await createProductVersion('prod_2phase_pro', {
    price: 1399.99,
    versionNotes: 'Price update: $1299.99 → $1399.99',
    changeType: 'minor' // Keeps same SKU base, increments version
  })
} else {
  // No orders - safe to update directly
  await db
    .update(products)
    .set({ price: 1399.99, updatedAt: new Date() })
    .where(eq(products.id, 'prod_2phase_pro'))
}
```

### Scenario 2: Component Change

**When:** Component added/removed/updated

```typescript
// Adding new optional upgrade component
async function addOptionalComponent(productId: string, component: NewComponent) {
  // Check if product has orders
  const hasOrders = await checkProductHasOrders(productId)

  if (hasOrders) {
    // Create new version with component
    await createProductVersion(productId, {
      components: [...existingComponents, component],
      versionNotes: `Added optional component: ${component.name}`,
      changeType: 'component'
    })
  } else {
    // No orders - safe to add component directly
    await db.insert(productComponents).values({
      productId,
      ...component
    })
  }
}
```

### Scenario 3: Major Product Revision

**When:** Significant changes (new model, major redesign)

```typescript
async function createMajorRevision(oldProductId: string, newProductData: any) {
  // 1. Create new product with incremented version
  const oldProduct = await db.select().from(products).where(eq(products.id, oldProductId))
  const newSku = incrementSKU(oldProduct.sku) // TPC-PRO-001-V2 → TPC-PRO-001-V3

  const newProduct = await db.insert(products).values({
    id: `${oldProductId}_v${oldProduct.version + 1}`,
    sku: newSku,
    name: newProductData.name,
    version: oldProduct.version + 1,
    previousVersionId: oldProductId,
    versionNotes: newProductData.versionNotes,
    ...newProductData
  }).returning()

  // 2. Sunset old product
  await db.update(products)
    .set({
      status: 'sunset',
      isAvailableForPurchase: false,
      sunsetDate: new Date(),
      replacedBy: newProduct[0].id
    })
    .where(eq(products.id, oldProductId))

  // 3. Copy/update components for new version
  const oldComponents = await db.select().from(productComponents)
    .where(eq(productComponents.productId, oldProductId))

  for (const component of oldComponents) {
    await db.insert(productComponents).values({
      ...component,
      id: undefined, // New ID
      productId: newProduct[0].id,
      // Update component data as needed
    })
  }

  // 4. Log version history
  await db.insert(productVersionHistory).values({
    productId: oldProductId,
    version: newProduct[0].version,
    changeType: 'major',
    changeDescription: newProductData.versionNotes,
    changedBy: getCurrentUserId(),
    beforeSnapshot: oldProduct,
    afterSnapshot: newProduct[0]
  })

  return newProduct[0]
}
```

---

## Workflow: Order Creation (Snapshot)

### At Checkout: Snapshot Product + Components

```typescript
async function createOrderFromCart(cartId: string, orderData: any) {
  // 1. Get cart items with current product data
  const cartItems = await db
    .select({
      cartItem: cartItems,
      product: products,
      components: sql`
        COALESCE(
          json_agg(
            json_build_object(
              'componentSku', ${productComponents.componentSku},
              'componentName', ${productComponents.componentName},
              'componentType', ${productComponents.componentType},
              'quantity', ${productComponents.quantity},
              'price', ${productComponents.componentPrice},
              'isIncluded', ${productComponents.isIncluded},
              'isOptional', ${productComponents.isOptional},
              'specifications', ${productComponents.specifications}
            )
          ) FILTER (WHERE ${productComponents.id} IS NOT NULL),
          '[]'::json
        )
      `
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productComponents, eq(products.id, productComponents.productId))
    .where(eq(cartItems.cartId, cartId))
    .groupBy(cartItems.id, products.id)

  // 2. Create order
  const order = await db.insert(orders).values(orderData).returning()

  // 3. Create order items with SNAPSHOT of product + components
  for (const item of cartItems) {
    const componentsArray = item.components as any[]

    // Calculate pricing
    const includedComponents = componentsArray.filter(c => c.isIncluded)
    const optionalComponents = componentsArray.filter(c => !c.isIncluded)
    const componentsPrice = optionalComponents.reduce((sum, c) => sum + (c.price * c.quantity), 0)
    const lineTotal = item.cartItem.quantity * (item.product.price + componentsPrice)

    await db.insert(orderItems).values({
      orderId: order[0].id,

      // SNAPSHOT: Product data (denormalized)
      productId: item.product.id,
      productSku: item.product.sku,
      productName: item.product.name,
      productVersion: item.product.version,
      productImage: item.product.images[0], // Primary image

      // SNAPSHOT: Components (denormalized JSONB)
      components: componentsArray,

      // Pricing
      quantity: item.cartItem.quantity,
      unitPrice: item.product.price,
      componentsPrice: componentsPrice,
      lineTotal: lineTotal,

      // Optional: FK for reporting (can be null if product deleted)
      currentProductId: item.product.id,
    })
  }

  return order[0]
}
```

---

## Business Rules

### Product Modification Rules

```typescript
// Rule: Can only modify product if no orders OR creating new version
async function canModifyProduct(productId: string): Promise<boolean> {
  const orderCount = await db
    .select({ count: sql`COUNT(*)` })
    .from(orderItems)
    .where(eq(orderItems.productId, productId))

  return orderCount[0].count === 0
}

// Rule: Sunset product when replaced
async function sunsetProduct(productId: string, replacementId: string) {
  await db.update(products)
    .set({
      status: 'sunset',
      isAvailableForPurchase: false,
      sunsetDate: new Date(),
      replacedBy: replacementId
    })
    .where(eq(products.id, productId))
}

// Rule: Products in carts must be active
async function validateCartProduct(productId: string) {
  const product = await db.select().from(products).where(eq(products.id, productId))

  if (!product[0].isAvailableForPurchase) {
    throw new Error('Product no longer available for purchase')
  }

  if (product[0].status === 'sunset' || product[0].status === 'discontinued') {
    // Show upgrade path
    if (product[0].replacedBy) {
      throw new Error(`Product replaced by: ${product[0].replacedBy}`)
    }
    throw new Error('Product discontinued')
  }
}
```

### SKU Versioning Strategy

```typescript
// SKU Format: {PREFIX}-{PRODUCT}-{NUMBER}-V{VERSION}
// Example: TPC-PRO-001-V2

function incrementSKU(currentSku: string): string {
  // Parse: TPC-PRO-001-V2
  const match = currentSku.match(/^(.+)-V(\d+)$/)

  if (match) {
    const [, base, version] = match
    return `${base}-V${parseInt(version) + 1}`
  }

  // No version suffix, add V2
  return `${currentSku}-V2`
}

// Version 1: TPC-PRO-001-V1 (or TPC-PRO-001)
// Version 2: TPC-PRO-001-V2 (price change)
// Version 3: TPC-PRO-001-V3 (component update)
```

---

## Query Patterns

### Get Current Product (Active Catalog)

```typescript
// Show only active products
const activeProducts = await db
  .select()
  .from(products)
  .where(eq(products.isAvailableForPurchase, true))
  .orderBy(products.name)
```

### Get Product with Components

```typescript
const productWithComponents = await db
  .select({
    product: products,
    components: sql`
      json_agg(
        json_build_object(
          'id', ${productComponents.id},
          'sku', ${productComponents.componentSku},
          'name', ${productComponents.componentName},
          'type', ${productComponents.componentType},
          'price', ${productComponents.componentPrice},
          'isIncluded', ${productComponents.isIncluded},
          'isOptional', ${productComponents.isOptional}
        )
      )
    `
  })
  .from(products)
  .leftJoin(productComponents, eq(products.id, productComponents.productId))
  .where(eq(products.id, productId))
  .groupBy(products.id)
```

### Get Order with Snapshot Data

```typescript
// Order items are self-contained (no joins needed!)
const orderDetails = await db
  .select()
  .from(orders)
  .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
  .where(eq(orders.id, orderId))

// Components are in JSONB, no FK lookups
orderDetails.forEach(item => {
  const components = item.orderItems.components // Already denormalized
  console.log('Product:', item.orderItems.productName)
  console.log('Components:', components)
})
```

### Product Version History Report

```typescript
// Find all versions of a product
const productVersions = await db
  .select()
  .from(products)
  .where(
    or(
      eq(products.id, baseProductId),
      eq(products.previousVersionId, baseProductId)
    )
  )
  .orderBy(products.version)

// Get order count per version
const versionMetrics = await db
  .select({
    productId: orderItems.productId,
    productSku: orderItems.productSku,
    productVersion: orderItems.productVersion,
    orderCount: sql`COUNT(DISTINCT ${orderItems.orderId})`,
    totalRevenue: sql`SUM(${orderItems.lineTotal})`
  })
  .from(orderItems)
  .where(eq(orderItems.productId, productId))
  .groupBy(orderItems.productId, orderItems.productSku, orderItems.productVersion)
```

---

## Migration Path

### Step 1: Add Product Versioning Fields

```sql
-- Add versioning columns to products
ALTER TABLE products
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN is_available_for_purchase BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN sunset_date TIMESTAMP,
  ADD COLUMN replaced_by TEXT REFERENCES products(id),
  ADD COLUMN version_notes TEXT,
  ADD COLUMN previous_version_id TEXT REFERENCES products(id);

-- Update existing products to version 1
UPDATE products SET version = 1 WHERE version IS NULL;
```

### Step 2: Create Product Components Table

```sql
CREATE TABLE product_components (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL,
  component_sku TEXT NOT NULL,
  component_name TEXT NOT NULL,
  component_description TEXT,
  component_price REAL NOT NULL,
  is_included BOOLEAN NOT NULL DEFAULT true,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  specifications JSONB,
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_components_product_id ON product_components(product_id);
CREATE INDEX idx_product_components_type ON product_components(component_type);
```

### Step 3: Update Order Items for Snapshots

```sql
-- Add snapshot fields to order_items
ALTER TABLE order_items
  ADD COLUMN product_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN components JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN components_price REAL NOT NULL DEFAULT 0,
  ADD COLUMN line_total REAL NOT NULL DEFAULT 0,
  ADD COLUMN current_product_id TEXT REFERENCES products(id) ON DELETE SET NULL;

-- Rename price to unit_price for clarity
ALTER TABLE order_items RENAME COLUMN price TO unit_price;

-- Calculate line_total for existing orders
UPDATE order_items
SET line_total = quantity * unit_price
WHERE line_total = 0;
```

### Step 4: Create Version History Table

```sql
CREATE TABLE product_version_history (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  change_description TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  before_snapshot JSONB,
  after_snapshot JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_version_history_product ON product_version_history(product_id);
CREATE INDEX idx_version_history_version ON product_version_history(product_id, version);
```

---

## Advantages of This Hybrid Approach

### ✅ Benefits

1. **Order Immutability** - Orders are complete snapshots, immune to product changes
2. **Product Evolution** - Products can be updated freely or versioned as needed
3. **Flexible Deletion** - Products can be deleted without breaking orders (denormalized data)
4. **Component Tracking** - Components captured in order history
5. **Reporting Flexibility** - Can report on current OR historical product versions
6. **Audit Trail** - Version history tracks all changes
7. **SKU Management** - Clear versioning strategy (V1, V2, V3)
8. **No Orphans** - Denormalized data prevents referential integrity issues
9. **Query Performance** - Order queries don't need complex joins
10. **Business Logic** - Rules prevent accidental modification of ordered products

### ⚠️ Trade-offs

1. **Storage** - Denormalized data uses more space (acceptable for order history)
2. **Component Queries** - Components in JSONB harder to query than FK relationships (use currentProductId for current data)
3. **Data Fixes** - Can't retroactively fix historical orders (feature, not bug - orders are legal records)

---

## Recommendation Summary

**Use this hybrid approach:**

1. **For Active Products:** Normalize with FK relationships (products ↔ components)
2. **For Orders:** Denormalize snapshots (product + components → JSONB in order_items)
3. **For Evolution:** Soft versioning (sunset old, create new version when orders exist)
4. **For Reporting:** Optional FK (currentProductId) links to current product for analytics

**Result:**
- Orders are immutable ✅
- Products can evolve ✅
- Components are tracked ✅
- No orphaned records ✅
- Queryable history ✅

---

**Ready to implement this strategy?**
