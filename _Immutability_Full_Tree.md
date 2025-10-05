# Product Tree Immutability (Full Depth)

**Requirement:** Order immutability must extend to ALL components in the tree (depth 1 and depth 2)

---

## Immutability Principle

### **When order is placed, snapshot EVERYTHING:**

```
Order Item Snapshot (Immutable):
├── Product (root) - FROZEN
├── Component A (depth 1) - FROZEN
│   ├── Sub-component A1 (depth 2) - FROZEN
│   └── Sub-component A2 (depth 2) - FROZEN
├── Component B (depth 1) - FROZEN
│   └── Sub-component B1 (depth 2) - FROZEN
└── Component C (depth 1) - FROZEN
    └── (no sub-components)
```

### **After order placed:**

✅ **Root product can change** (new version created)
✅ **Depth 1 components can change** (new version created)
✅ **Depth 2 sub-components can change** (new version created)
✅ **Order remains unchanged** (snapshot is immutable)

---

## Version Management Strategy

### **Product with Orders = Create New Version**

**Rule:** If product OR any of its components has orders, create new version instead of modifying.

```typescript
async function canModifyProduct(productId: string): Promise<boolean> {
  // Check if product itself is in any orders
  const inOrders = await db
    .select({ count: sql`COUNT(*)` })
    .from(orderItems)
    .where(
      or(
        eq(orderItems.productId, productId), // Root product
        sql`${orderItems.componentTree}::jsonb @> ${JSON.stringify([{componentId: productId}])}` // As component
      )
    )

  return inOrders[0].count === 0
}
```

### **Component Modification Rules**

#### **Scenario 1: Modify Pump A1 (used in Cooling System Pro orders)**

```typescript
// Current structure:
// Cooling System Pro → Pump A1 → Motor M1

// Orders exist with Pump A1, need to modify Motor M1
const pumpA1HasOrders = await isComponentInOrders('pump_a1')

if (pumpA1HasOrders) {
  // Create NEW version of Pump A1 with updated Motor
  const newPumpA1 = await createProductVersion('pump_a1', {
    sku: 'TPC-PUMP-A1-V2',
    versionNotes: 'Upgraded to Motor M2',
    // ... other changes
  })

  // Update junction: Remove old Motor M1, add Motor M2
  await db.delete(productComponents)
    .where(
      and(
        eq(productComponents.parentProductId, newPumpA1.id),
        eq(productComponents.componentProductId, 'motor_m1')
      )
    )

  await db.insert(productComponents).values({
    parentProductId: newPumpA1.id,
    componentProductId: 'motor_m2', // New motor
    quantity: 1,
    isIncluded: true
  })

  // Sunset old Pump A1
  await sunsetProduct('pump_a1', newPumpA1.id)

  // OLD orders still show: Cooling System Pro → Pump A1 (V1) → Motor M1 ✅
  // NEW orders will show: Cooling System Pro → Pump A1 (V2) → Motor M2 ✅
}
```

#### **Scenario 2: Modify Motor M1 (used in Pump A1 which is in orders)**

```typescript
// Motor M1 is depth 2 component
// It's in: Cooling System Pro → Pump A1 → Motor M1

const motorInOrders = await isComponentInOrders('motor_m1')

if (motorInOrders) {
  // Option A: Create new Motor version
  const motorM2 = await createProductVersion('motor_m1', {
    sku: 'TPC-MOTOR-M1-V2',
    versionNotes: 'Efficiency improvement',
    price: 49.99 // Price increase
  })

  // Update Pump A1 to use Motor M2
  // BUT Pump A1 also has orders, so create NEW Pump A1 version
  const pumpA1V2 = await createProductVersion('pump_a1', {
    versionNotes: 'Uses improved Motor M2'
  })

  // Link new pump to new motor
  await db.insert(productComponents).values({
    parentProductId: pumpA1V2.id,
    componentProductId: motorM2.id,
    quantity: 1,
    isIncluded: true
  })

  // Sunset old versions
  await sunsetProduct('motor_m1', motorM2.id)
  await sunsetProduct('pump_a1', pumpA1V2.id)

  // Result:
  // OLD orders: Cooling System Pro → Pump A1 (V1) → Motor M1 (V1) ✅
  // NEW orders: Cooling System Pro → Pump A1 (V2) → Motor M2 (V2) ✅
}
```

---

## Checking if Component is in Orders

### **Query: Is product/component in any order?**

```typescript
async function isComponentInOrders(productId: string): Promise<boolean> {
  // Check as root product
  const asRoot = await db
    .select({ count: sql`COUNT(*)` })
    .from(orderItems)
    .where(eq(orderItems.productId, productId))

  if (asRoot[0].count > 0) return true

  // Check as depth 1 component
  const asDepth1 = await db
    .select({ count: sql`COUNT(*)` })
    .from(orderItems)
    .where(
      sql`EXISTS (
        SELECT 1
        FROM jsonb_array_elements(${orderItems.componentTree}) AS comp
        WHERE comp->>'componentId' = ${productId}
      )`
    )

  if (asDepth1[0].count > 0) return true

  // Check as depth 2 sub-component
  const asDepth2 = await db
    .select({ count: sql`COUNT(*)` })
    .from(orderItems)
    .where(
      sql`EXISTS (
        SELECT 1
        FROM jsonb_array_elements(${orderItems.componentTree}) AS comp,
             jsonb_array_elements(comp->'components') AS subcomp
        WHERE subcomp->>'componentId' = ${productId}
      )`
    )

  return asDepth2[0].count > 0
}
```

---

## Snapshot Verification

### **Ensure full tree is captured:**

```typescript
async function createOrderItemSnapshot(
  product: Product,
  quantity: number
): Promise<OrderItemData> {
  // 1. Get depth 1 components
  const depth1Components = await db
    .select({
      rel: productComponents,
      comp: products,
    })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.componentProductId, products.id))
    .where(eq(productComponents.parentProductId, product.id))
    .orderBy(productComponents.sortOrder)

  // 2. For each depth 1, get depth 2
  const fullTree = await Promise.all(
    depth1Components.map(async (d1) => {
      const depth2Components = await db
        .select({
          rel: productComponents,
          comp: products,
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.componentProductId, products.id))
        .where(eq(productComponents.parentProductId, d1.comp.id))
        .orderBy(productComponents.sortOrder)

      return {
        // SNAPSHOT depth 1 component
        componentId: d1.comp.id,
        componentSku: d1.comp.sku,
        componentName: d1.rel.displayName ?? d1.comp.name,
        componentVersion: d1.comp.version, // ✅ Capture version
        quantity: d1.rel.quantity,
        price: d1.rel.priceOverride ?? d1.comp.componentPrice ?? d1.comp.price,
        isIncluded: d1.rel.isIncluded,
        isRequired: d1.rel.isRequired,

        // SNAPSHOT depth 2 sub-components
        components: depth2Components.map(d2 => ({
          componentId: d2.comp.id,
          componentSku: d2.comp.sku,
          componentName: d2.rel.displayName ?? d2.comp.name,
          componentVersion: d2.comp.version, // ✅ Capture version
          quantity: d2.rel.quantity,
          price: d2.rel.priceOverride ?? d2.comp.componentPrice ?? d2.comp.price,
          isIncluded: d2.rel.isIncluded,
          isRequired: d2.rel.isRequired,
        }))
      }
    })
  )

  // 3. Calculate total pricing
  const calculateTreePrice = (components: any[]): number => {
    return components.reduce((sum, comp) => {
      const compPrice = comp.isIncluded ? comp.price * comp.quantity : 0
      const subPrice = comp.components ? calculateTreePrice(comp.components) : 0
      return sum + compPrice + subPrice
    }, 0)
  }

  const includedPrice = calculateTreePrice(fullTree.filter(c => c.isIncluded))
  const optionalPrice = calculateTreePrice(fullTree.filter(c => !c.isIncluded))

  // 4. Return immutable snapshot
  return {
    // Root product snapshot
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    productVersion: product.version, // ✅ Capture version
    productType: product.productType,
    productImage: product.images?.[0],

    // Full component tree snapshot (depth 1 + depth 2)
    componentTree: fullTree,

    // Pricing
    quantity: quantity,
    basePrice: product.price,
    includedComponentsPrice: includedPrice,
    optionalComponentsPrice: optionalPrice,
    lineTotal: quantity * (product.price + includedPrice + optionalPrice),

    // Optional FK for reporting
    currentProductId: product.id,

    createdAt: new Date(),
  }
}
```

---

## Order Display (Historical Accuracy)

### **Show order exactly as purchased:**

```typescript
function displayOrderItem(orderItem: OrderItem) {
  console.log(`Product: ${orderItem.productName} (v${orderItem.productVersion})`)
  console.log(`SKU: ${orderItem.productSku}`)
  console.log(`Base Price: $${orderItem.basePrice}`)

  // Display depth 1 components
  orderItem.componentTree.forEach(comp => {
    console.log(`  ├─ ${comp.componentName} (v${comp.componentVersion})`)
    console.log(`     SKU: ${comp.componentSku}`)
    console.log(`     Price: $${comp.price} x ${comp.quantity}`)

    // Display depth 2 sub-components
    if (comp.components && comp.components.length > 0) {
      comp.components.forEach(subComp => {
        console.log(`     └─ ${subComp.componentName} (v${subComp.componentVersion})`)
        console.log(`        SKU: ${subComp.componentSku}`)
        console.log(`        Price: $${subComp.price} x ${subComp.quantity}`)
      })
    }
  })

  console.log(`Total: $${orderItem.lineTotal}`)
}

// Output example:
// Product: Cooling System Pro (v1)
// SKU: TPC-COOL-PRO-V1
// Base Price: $999.99
//   ├─ Pump A1 (v1)
//      SKU: TPC-PUMP-A1-V1
//      Price: $89.99 x 1
//      └─ Motor M1 (v1)
//         SKU: TPC-MOTOR-M1-V1
//         Price: $45.00 x 1
//      └─ Impeller I2 (v1)
//         SKU: TPC-IMP-I2-V1
//         Price: $15.00 x 1
//   ├─ Radiator R2 (v1)
//      SKU: TPC-RAD-R2-V1
//      Price: $129.99 x 1
// Total: $1279.97
```

---

## Versioning Cascade Strategy

### **When to create versions:**

```typescript
async function shouldCreateVersion(productId: string): Promise<boolean> {
  // If product or any depth component is in orders, version everything
  return await isComponentInOrders(productId)
}

async function updateProductTree(
  productId: string,
  changes: ProductChanges
): Promise<Product> {
  const needsVersion = await shouldCreateVersion(productId)

  if (needsVersion) {
    // Create new version of entire tree if needed
    return await createProductVersionCascade(productId, changes)
  } else {
    // No orders, safe to modify directly
    return await updateProductDirect(productId, changes)
  }
}
```

---

## Benefits of Full-Tree Immutability

✅ **Historical Accuracy** - Orders show exact product as purchased
✅ **Component Traceability** - Know which motor version was in which pump
✅ **Pricing Integrity** - Component prices frozen at purchase time
✅ **Legal Compliance** - Accurate records for warranties, recalls, audits
✅ **Customer Support** - Support knows exact configuration shipped
✅ **Replacement Parts** - Can identify exact part versions needed

---

## Migration Considerations

### **Add version tracking to snapshots:**

```sql
-- Add version fields to component tree
-- Update order_items.component_tree structure to include:
{
  "componentId": "pump_a1",
  "componentSku": "TPC-PUMP-A1-V1",
  "componentName": "Pump A1",
  "componentVersion": 1,  -- ✅ ADD THIS
  "quantity": 1,
  "price": 89.99,
  "components": [
    {
      "componentId": "motor_m1",
      "componentSku": "TPC-MOTOR-M1-V1",
      "componentName": "Motor M1",
      "componentVersion": 1,  -- ✅ ADD THIS
      "quantity": 1,
      "price": 45.00
    }
  ]
}
```

---

## Summary

**Immutability extends to ALL depths:**

1. ✅ **Root product** (depth 0) - Snapshotted with version
2. ✅ **Direct components** (depth 1) - Snapshotted with version
3. ✅ **Sub-components** (depth 2) - Snapshotted with version

**Version management:**
- Check if product/component at ANY depth is in orders
- If yes → create new version instead of modifying
- Snapshot captures entire tree with all versions
- Orders remain frozen, showing exact configuration

**Result:** Complete historical accuracy for every order, every component, every level.

---

**This ensures true immutability across the full product tree. Correct?**
