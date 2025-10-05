# Product-Component Many-to-Many Relationship

**Requirement:** Products can contain other products as components (many-to-many, depth=1, no cycles)

---

## Schema Design

### **Approach: Junction Table with Constraints**

```typescript
// ============================================================================
// PRODUCTS TABLE (Both Parents and Components)
// ============================================================================
export const products = pgTable('products', {
  id: text('id').primaryKey(), // e.g., 'prod_pump_a1'
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),

  // Product type classification
  productType: text('product_type').notNull(), // 'system', 'component', 'part', 'bundle'
  canBeComponent: boolean('can_be_component').notNull().default(true),
  canHaveComponents: boolean('can_have_components').notNull().default(true),

  // Pricing
  price: real('price').notNull(),
  componentPrice: real('component_price'), // Price when sold as component (may differ)

  // Product details
  description: text('description').notNull(),
  specifications: jsonb('specifications').notNull(),
  images: jsonb('images').notNull(),

  // Lifecycle
  version: integer('version').notNull().default(1),
  status: text('status').notNull().default('active'),
  isAvailableForPurchase: boolean('is_available_for_purchase').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// PRODUCT_COMPONENTS TABLE (Many-to-Many Junction)
// ============================================================================
export const productComponents = pgTable('product_components', {
  id: serial('id').primaryKey(),

  // Parent product (the product that HAS components)
  parentProductId: text('parent_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  // Child product (the component product)
  componentProductId: text('component_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }), // Don't delete if used as component

  // Relationship details
  quantity: integer('quantity').notNull().default(1), // How many of this component
  isRequired: boolean('is_required').notNull().default(true), // Required or optional?
  isIncluded: boolean('is_included').notNull().default(true), // Included in base price?

  // Pricing override (if component price differs in this context)
  priceOverride: real('price_override'), // If null, use product.componentPrice or product.price

  // Display & ordering
  displayName: text('display_name'), // Optional override (e.g., "Primary Pump" instead of "Pump A1")
  sortOrder: integer('sort_order').notNull().default(0),
  category: text('category'), // Group components (e.g., "cooling", "power", "accessories")

  // Metadata
  notes: text('notes'), // Internal notes about this relationship

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: Same component can't be added twice to same product
  uniqueParentComponent: unique().on(table.parentProductId, table.componentProductId),

  // Check constraint: Prevent self-reference (product can't contain itself)
  noSelfReference: check('no_self_reference',
    sql`${table.parentProductId} != ${table.componentProductId}`
  ),
}))

// ============================================================================
// INDEXES for Performance
// ============================================================================
// CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);
// CREATE INDEX idx_product_components_child ON product_components(component_product_id);
// CREATE INDEX idx_products_type ON products(product_type);
// CREATE INDEX idx_products_available ON products(is_available_for_purchase);

// ============================================================================
// ORDER ITEMS (Snapshot with Denormalized Components)
// ============================================================================
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),

  // SNAPSHOT: Parent product
  productId: text('product_id').notNull(), // NO FK (allows deletion)
  productSku: text('product_sku').notNull(),
  productName: text('product_name').notNull(),
  productVersion: integer('product_version').notNull(),
  productImage: text('product_image').notNull(),
  productType: text('product_type').notNull(),

  // SNAPSHOT: Component tree (denormalized JSONB)
  componentTree: jsonb('component_tree').notNull().default('[]'),
  /*
    Example structure (with nested components):
    [
      {
        componentProductId: 'prod_pump_a1',
        componentSku: 'TPC-PUMP-A1',
        componentName: 'Coolant Pump A1',
        componentType: 'component',
        quantity: 1,
        price: 89.99,
        isRequired: true,
        isIncluded: true,

        // Nested components (depth=1 only)
        components: [
          {
            componentProductId: 'prod_motor_m1',
            componentSku: 'TPC-MOTOR-M1',
            componentName: 'Brushless Motor M1',
            quantity: 1,
            price: 45.00,
            isRequired: true,
            isIncluded: true
          }
        ]
      },
      {
        componentProductId: 'prod_radiator_r2',
        componentSku: 'TPC-RAD-R2',
        componentName: 'Aluminum Radiator R2',
        quantity: 1,
        price: 129.99,
        isRequired: true,
        isIncluded: true,
        components: [] // No sub-components
      }
    ]
  */

  // Pricing breakdown
  quantity: integer('quantity').notNull(),
  basePrice: real('base_price').notNull(), // Product price without optional components
  includedComponentsPrice: real('included_components_price').notNull(),
  optionalComponentsPrice: real('optional_components_price').notNull(),
  lineTotal: real('line_total').notNull(),

  // Optional: Reporting FK
  currentProductId: text('current_product_id')
    .references(() => products.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

---

## Circular Reference Prevention

### **Database-Level Constraint (Trigger)**

```sql
-- Prevent circular references at depth=1
CREATE OR REPLACE FUNCTION prevent_circular_component()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if component is already a parent of the parent
  -- (A contains B, prevent B from containing A)
  IF EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = NEW.component_product_id
      AND component_product_id = NEW.parent_product_id
  ) THEN
    RAISE EXCEPTION 'Circular reference detected: % already contains %',
      NEW.component_product_id, NEW.parent_product_id;
  END IF;

  -- Check if adding this would create depth > 1
  -- (If component already has components, prevent adding it to products with components)
  IF EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = NEW.component_product_id
  ) THEN
    -- Component has its own components
    -- Check if parent also has OTHER components (would create depth=2)
    IF EXISTS (
      SELECT 1 FROM product_components
      WHERE parent_product_id = NEW.parent_product_id
        AND component_product_id != NEW.component_product_id
        AND component_product_id IN (
          SELECT parent_product_id FROM product_components
        )
    ) THEN
      RAISE EXCEPTION 'Maximum component depth (1) exceeded';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_components
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_component();
```

### **Application-Level Validation (TypeScript)**

```typescript
// Validate before inserting component relationship
async function addComponentToProduct(
  parentProductId: string,
  componentProductId: string,
  options: ComponentOptions
) {
  // 1. Check self-reference
  if (parentProductId === componentProductId) {
    throw new Error('Product cannot contain itself')
  }

  // 2. Check circular reference
  const circularCheck = await db
    .select()
    .from(productComponents)
    .where(
      and(
        eq(productComponents.parentProductId, componentProductId),
        eq(productComponents.componentProductId, parentProductId)
      )
    )

  if (circularCheck.length > 0) {
    throw new Error(
      `Circular reference: ${componentProductId} already contains ${parentProductId}`
    )
  }

  // 3. Check depth limit (component has components?)
  const componentHasComponents = await db
    .select()
    .from(productComponents)
    .where(eq(productComponents.parentProductId, componentProductId))
    .limit(1)

  if (componentHasComponents.length > 0) {
    // This component has sub-components
    // Check if parent already has components with sub-components
    const parentComplexComponents = await db
      .select({ componentId: productComponents.componentProductId })
      .from(productComponents)
      .where(eq(productComponents.parentProductId, parentProductId))

    const complexComponentIds = parentComplexComponents.map(c => c.componentId)

    const hasNestedComponents = await db
      .select()
      .from(productComponents)
      .where(
        inArray(productComponents.parentProductId, complexComponentIds)
      )
      .limit(1)

    if (hasNestedComponents.length > 0) {
      throw new Error('Maximum component depth (1) exceeded')
    }
  }

  // 4. Check product flags
  const [parent, component] = await Promise.all([
    db.select().from(products).where(eq(products.id, parentProductId)),
    db.select().from(products).where(eq(products.id, componentProductId))
  ])

  if (!parent[0].canHaveComponents) {
    throw new Error(`${parent[0].name} cannot have components`)
  }

  if (!component[0].canBeComponent) {
    throw new Error(`${component[0].name} cannot be used as a component`)
  }

  // 5. Insert component relationship
  await db.insert(productComponents).values({
    parentProductId,
    componentProductId,
    quantity: options.quantity ?? 1,
    isRequired: options.isRequired ?? true,
    isIncluded: options.isIncluded ?? true,
    priceOverride: options.priceOverride,
    displayName: options.displayName,
    sortOrder: options.sortOrder ?? 0,
    category: options.category,
    notes: options.notes,
  })

  return { success: true }
}
```

---

## Query Patterns

### **Get Product with Components (1 Level Deep)**

```typescript
async function getProductWithComponents(productId: string) {
  // Get parent product
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product[0]) throw new Error('Product not found')

  // Get direct components
  const components = await db
    .select({
      relationship: productComponents,
      component: products,
    })
    .from(productComponents)
    .innerJoin(
      products,
      eq(productComponents.componentProductId, products.id)
    )
    .where(eq(productComponents.parentProductId, productId))
    .orderBy(productComponents.sortOrder)

  // Get sub-components for each component (depth=1)
  const componentsWithSubComponents = await Promise.all(
    components.map(async (comp) => {
      const subComponents = await db
        .select({
          relationship: productComponents,
          component: products,
        })
        .from(productComponents)
        .innerJoin(
          products,
          eq(productComponents.componentProductId, products.id)
        )
        .where(eq(productComponents.parentProductId, comp.component.id))
        .orderBy(productComponents.sortOrder)

      return {
        ...comp,
        subComponents: subComponents.map(sc => ({
          ...sc.relationship,
          product: sc.component,
        })),
      }
    })
  )

  return {
    product: product[0],
    components: componentsWithSubComponents,
  }
}
```

### **Get Product Tree (Optimized with SQL)**

```sql
-- Get product with components in single query
SELECT
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.price as product_price,

  -- Direct components
  jsonb_agg(
    DISTINCT jsonb_build_object(
      'componentId', c1.id,
      'componentSku', c1.sku,
      'componentName', c1.name,
      'quantity', pc1.quantity,
      'price', COALESCE(pc1.price_override, c1.component_price, c1.price),
      'isRequired', pc1.is_required,
      'isIncluded', pc1.is_included,
      'category', pc1.category,

      -- Sub-components (depth=1)
      'subComponents', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'componentId', c2.id,
            'componentSku', c2.sku,
            'componentName', c2.name,
            'quantity', pc2.quantity,
            'price', COALESCE(pc2.price_override, c2.component_price, c2.price),
            'isRequired', pc2.is_required,
            'isIncluded', pc2.is_included
          )
        )
        FROM product_components pc2
        JOIN products c2 ON pc2.component_product_id = c2.id
        WHERE pc2.parent_product_id = c1.id
      )
    )
  ) FILTER (WHERE c1.id IS NOT NULL) as components

FROM products p
LEFT JOIN product_components pc1 ON p.id = pc1.parent_product_id
LEFT JOIN products c1 ON pc1.component_product_id = c1.id
WHERE p.id = 'prod_cooling_system_pro'
GROUP BY p.id;
```

### **Find Where Product is Used (Reverse Lookup)**

```typescript
// Find all products that use this product as a component
async function findProductUsage(componentProductId: string) {
  const usage = await db
    .select({
      parent: products,
      relationship: productComponents,
    })
    .from(productComponents)
    .innerJoin(
      products,
      eq(productComponents.parentProductId, products.id)
    )
    .where(eq(productComponents.componentProductId, componentProductId))

  return usage.map(u => ({
    parentProduct: u.parent,
    quantity: u.relationship.quantity,
    isRequired: u.relationship.isRequired,
  }))
}
```

---

## Order Checkout: Snapshot Component Tree

```typescript
async function createOrderItemSnapshot(
  cartItem: CartItem,
  product: Product
): Promise<OrderItemSnapshot> {
  // 1. Get direct components
  const directComponents = await db
    .select({
      relationship: productComponents,
      component: products,
    })
    .from(productComponents)
    .innerJoin(
      products,
      eq(productComponents.componentProductId, products.id)
    )
    .where(eq(productComponents.parentProductId, product.id))
    .orderBy(productComponents.sortOrder)

  // 2. Build component tree with sub-components (depth=1)
  const componentTree = await Promise.all(
    directComponents.map(async (comp) => {
      // Get sub-components
      const subComponents = await db
        .select({
          relationship: productComponents,
          component: products,
        })
        .from(productComponents)
        .innerJoin(
          products,
          eq(productComponents.componentProductId, products.id)
        )
        .where(eq(productComponents.parentProductId, comp.component.id))
        .orderBy(productComponents.sortOrder)

      const price = comp.relationship.priceOverride
        ?? comp.component.componentPrice
        ?? comp.component.price

      return {
        componentProductId: comp.component.id,
        componentSku: comp.component.sku,
        componentName: comp.relationship.displayName ?? comp.component.name,
        componentType: comp.component.productType,
        quantity: comp.relationship.quantity,
        price: price,
        isRequired: comp.relationship.isRequired,
        isIncluded: comp.relationship.isIncluded,
        category: comp.relationship.category,

        // Sub-components snapshot
        components: subComponents.map(sub => ({
          componentProductId: sub.component.id,
          componentSku: sub.component.sku,
          componentName: sub.relationship.displayName ?? sub.component.name,
          quantity: sub.relationship.quantity,
          price: sub.relationship.priceOverride
            ?? sub.component.componentPrice
            ?? sub.component.price,
          isRequired: sub.relationship.isRequired,
          isIncluded: sub.relationship.isIncluded,
        })),
      }
    })
  )

  // 3. Calculate pricing
  const calculateTotal = (components: any[]): number => {
    return components.reduce((sum, comp) => {
      const componentTotal = comp.isIncluded ? comp.price * comp.quantity : 0
      const subTotal = comp.components
        ? calculateTotal(comp.components)
        : 0
      return sum + componentTotal + subTotal
    }, 0)
  }

  const includedComponentsPrice = calculateTotal(
    componentTree.filter(c => c.isIncluded)
  )

  const optionalComponentsPrice = calculateTotal(
    componentTree.filter(c => !c.isIncluded)
  )

  const lineTotal = cartItem.quantity * (
    product.price + includedComponentsPrice + optionalComponentsPrice
  )

  // 4. Return snapshot
  return {
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    productVersion: product.version,
    productImage: product.images[0],
    productType: product.productType,

    componentTree: componentTree,

    quantity: cartItem.quantity,
    basePrice: product.price,
    includedComponentsPrice,
    optionalComponentsPrice,
    lineTotal,

    currentProductId: product.id, // For reporting
  }
}
```

---

## Example Use Cases

### **Case 1: Cooling System with Components**

```typescript
// Product: Two-Phase Cooling System Pro
// └─ Component: Coolant Pump A1
//    └─ Component: Brushless Motor M1
//    └─ Component: Impeller I2
// └─ Component: Aluminum Radiator R2
//    └─ Component: Mounting Bracket B1
// └─ Component: RGB Controller (optional)

await addComponentToProduct('prod_cooling_pro', 'prod_pump_a1', {
  quantity: 1,
  isRequired: true,
  isIncluded: true,
  category: 'cooling',
  sortOrder: 1,
})

await addComponentToProduct('prod_pump_a1', 'prod_motor_m1', {
  quantity: 1,
  isRequired: true,
  isIncluded: true,
  sortOrder: 1,
})

await addComponentToProduct('prod_pump_a1', 'prod_impeller_i2', {
  quantity: 1,
  isRequired: true,
  isIncluded: true,
  sortOrder: 2,
})

await addComponentToProduct('prod_cooling_pro', 'prod_radiator_r2', {
  quantity: 1,
  isRequired: true,
  isIncluded: true,
  category: 'cooling',
  sortOrder: 2,
})

await addComponentToProduct('prod_cooling_pro', 'prod_rgb_controller', {
  quantity: 1,
  isRequired: false,
  isIncluded: false, // Optional upgrade
  priceOverride: 49.99,
  category: 'accessories',
  sortOrder: 10,
})
```

### **Case 2: Shared Component Across Products**

```typescript
// Motor M1 used in multiple products
const motorUsage = await findProductUsage('prod_motor_m1')

// Returns:
// [
//   { parentProduct: 'Pump A1', quantity: 1, isRequired: true },
//   { parentProduct: 'Pump A2', quantity: 1, isRequired: true },
//   { parentProduct: 'Compressor C1', quantity: 2, isRequired: true }
// ]

// Prevent deletion if used as component
await db.delete(products).where(eq(products.id, 'prod_motor_m1'))
// ❌ ERROR: Cannot delete - used as component (FK RESTRICT)
```

### **Case 3: Replacement Parts / Upgrades**

```typescript
// Customer wants to buy just the pump (sold standalone)
const pumpProduct = await db
  .select()
  .from(products)
  .where(eq(products.id, 'prod_pump_a1'))

// Can be purchased standalone
if (pumpProduct[0].isAvailableForPurchase) {
  // Add to cart as standalone product
  await addToCart(userId, 'prod_pump_a1', 1)
}

// Also show compatible products (where it's used)
const compatibleWith = await findProductUsage('prod_pump_a1')
// Shows: "Compatible with: Cooling System Pro, Cooling System Compact"
```

---

## Migration Script

```sql
-- Step 1: Modify products table
ALTER TABLE products
  ADD COLUMN product_type TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN can_be_component BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN can_have_components BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN component_price REAL;

-- Step 2: Drop old product_components (if exists)
DROP TABLE IF EXISTS product_components CASCADE;

-- Step 3: Create new product_components (many-to-many)
CREATE TABLE product_components (
  id SERIAL PRIMARY KEY,
  parent_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_included BOOLEAN NOT NULL DEFAULT true,
  price_override REAL,
  display_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_parent_component UNIQUE (parent_product_id, component_product_id),
  CONSTRAINT no_self_reference CHECK (parent_product_id != component_product_id)
);

-- Step 4: Create indexes
CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);
CREATE INDEX idx_product_components_child ON product_components(component_product_id);
CREATE INDEX idx_products_type ON products(product_type);

-- Step 5: Add circular reference prevention trigger
CREATE OR REPLACE FUNCTION prevent_circular_component()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = NEW.component_product_id
      AND component_product_id = NEW.parent_product_id
  ) THEN
    RAISE EXCEPTION 'Circular reference detected';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_components
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_component();

-- Step 6: Update order_items for component tree
ALTER TABLE order_items
  ADD COLUMN product_type TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN component_tree JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN base_price REAL NOT NULL DEFAULT 0,
  ADD COLUMN included_components_price REAL NOT NULL DEFAULT 0,
  ADD COLUMN optional_components_price REAL NOT NULL DEFAULT 0;

-- Rename for clarity
ALTER TABLE order_items RENAME COLUMN components TO component_tree_old;
ALTER TABLE order_items RENAME COLUMN components_price TO optional_components_price;
```

---

## Advantages of Many-to-Many Approach

✅ **Reusability** - Same component in multiple products (Motor M1 in Pump A1, A2, etc.)
✅ **Flexibility** - Products can be both standalone AND components
✅ **No Duplication** - Single source of truth for each product
✅ **Easy Updates** - Update Motor M1 once, affects all products using it
✅ **Queryable** - Find where component is used, find product hierarchy
✅ **Depth Control** - Enforced 1-level depth (no infinite nesting)
✅ **Circular Prevention** - Database + application-level checks
✅ **Order Immutability** - Snapshot full tree at checkout

---

## Summary

**Use this many-to-many self-referential design:**

1. ✅ Products table (both parents AND components)
2. ✅ product_components junction table (many-to-many)
3. ✅ Unique constraint (no duplicate components in same product)
4. ✅ Check constraint (no self-reference)
5. ✅ Trigger + app validation (no circular references)
6. ✅ Depth limit enforcement (max 1 level)
7. ✅ ON DELETE RESTRICT (prevent component deletion if used)
8. ✅ Snapshot to order_items (denormalized tree in JSONB)

**Ready to implement this many-to-many component system?**
