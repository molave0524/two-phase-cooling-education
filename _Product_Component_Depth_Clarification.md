# Product-Component Depth Clarification

**Corrected Understanding of "Depth 1" Constraint**

---

## Depth Definition

### **"Depth 1" means: Direct relationships only**

Each product has **DIRECT** component relationships (depth 1 from that product's perspective).

### **Hierarchy Example:**

```
Cooling System Pro (ROOT PRODUCT)
├── Pump A1 (depth 1 from Cooling System Pro) ← DIRECT relationship
├── Radiator R2 (depth 1 from Cooling System Pro) ← DIRECT relationship
└── RGB Controller (depth 1 from Cooling System Pro) ← DIRECT relationship

Pump A1 (can also be ROOT when sold standalone)
├── Motor M1 (depth 1 from Pump A1) ← DIRECT relationship
└── Impeller I2 (depth 1 from Pump A1) ← DIRECT relationship

Motor M1 (can also be ROOT when sold standalone)
└── [No components - is a base part]
```

---

## Junction Table Entries

### **Only DIRECT relationships are stored:**

```sql
-- Cooling System Pro's DIRECT components
INSERT INTO product_components (parent_product_id, component_product_id)
VALUES
  ('cooling_system_pro', 'pump_a1'),         -- Direct: depth 1
  ('cooling_system_pro', 'radiator_r2'),     -- Direct: depth 1
  ('cooling_system_pro', 'rgb_controller');  -- Direct: depth 1

-- Pump A1's DIRECT components (separate product context)
INSERT INTO product_components (parent_product_id, component_product_id)
VALUES
  ('pump_a1', 'motor_m1'),      -- Direct: depth 1 from Pump A1
  ('pump_a1', 'impeller_i2');   -- Direct: depth 1 from Pump A1

-- Motor M1 and Impeller I2 are NOT directly linked to Cooling System Pro
-- They are only linked through Pump A1
```

### **What's NOT in the junction table:**

```sql
-- ❌ WRONG - Motor M1 is NOT a direct component of Cooling System Pro
-- It's indirect (through Pump A1)
-- This entry does NOT exist:
('cooling_system_pro', 'motor_m1')  -- ❌ Not stored

-- The relationship is:
-- Cooling System Pro → Pump A1 → Motor M1
--     (direct)            (direct from Pump A1)
```

---

## Total Hierarchy Depth

### **Maximum 2 levels from root:**

```
Level 0: Cooling System Pro (root product)
   ↓ (direct relationship)
Level 1: Pump A1, Radiator R2, RGB Controller
   ↓ (direct relationship from Pump A1)
Level 2: Motor M1, Impeller I2
   ↓ (STOP - cannot go deeper)
Level 3: ❌ BLOCKED - No components allowed at this level
```

### **Depth Constraint:**

- **Each product** stores only its **DIRECT components** (depth 1 relationship)
- **Total hierarchy** from root product: **2 levels maximum**
- **Junction table** only contains **direct parent → child** relationships

---

## Query Implications

### **To get full product tree (2 levels):**

You need **2 queries** or **1 recursive query up to depth 2**:

```typescript
// Query 1: Get direct components of Cooling System Pro
const directComponents = await db
  .select()
  .from(productComponents)
  .where(eq(productComponents.parentProductId, 'cooling_system_pro'))
// Returns: [Pump A1, Radiator R2, RGB Controller]

// Query 2: For each direct component, get ITS components
const pumpA1SubComponents = await db
  .select()
  .from(productComponents)
  .where(eq(productComponents.parentProductId, 'pump_a1'))
// Returns: [Motor M1, Impeller I2]

// Full tree structure:
{
  product: 'Cooling System Pro',
  components: [
    {
      product: 'Pump A1',
      components: [
        { product: 'Motor M1', components: [] },
        { product: 'Impeller I2', components: [] }
      ]
    },
    {
      product: 'Radiator R2',
      components: [] // No sub-components
    },
    {
      product: 'RGB Controller',
      components: [] // No sub-components
    }
  ]
}
```

---

## Validation Rules (Corrected)

### **Rule 1: No Self-Reference**

```sql
-- ❌ Product cannot contain itself
CHECK (parent_product_id != component_product_id)
```

### **Rule 2: No Circular Reference**

```sql
-- ❌ If A contains B, then B cannot contain A
IF EXISTS (
  SELECT 1 FROM product_components
  WHERE parent_product_id = NEW.component_product_id
    AND component_product_id = NEW.parent_product_id
)
THEN RAISE EXCEPTION 'Circular reference detected'
```

### **Rule 3: No Depth > 2 Total (Simplified)**

**The depth constraint is implicitly enforced by only storing direct relationships.**

A component that has its own components CAN be added to any product, because:
- The junction table only stores the direct relationship
- Sub-components are queried separately
- No single entry spans more than 1 depth

**Example:**
```sql
-- Pump A1 has components (Motor M1, Impeller I2)
-- Cooling System Pro can still add Pump A1 as direct component ✅
INSERT INTO product_components (parent_product_id, component_product_id)
VALUES ('cooling_system_pro', 'pump_a1');

-- This creates hierarchy:
-- Cooling System Pro → Pump A1 → Motor M1 (total depth: 2) ✅
```

**Only block if it would create depth > 2:**

```typescript
// When adding component C to product P:
async function validateDepth(parentId: string, componentId: string) {
  // Check if component already has components
  const componentHasChildren = await db
    .select()
    .from(productComponents)
    .where(eq(productComponents.parentProductId, componentId))
    .limit(1)

  if (componentHasChildren.length > 0) {
    // Component has children
    // Check if any of component's children ALSO have children
    const childIds = await db
      .select({ id: productComponents.componentProductId })
      .from(productComponents)
      .where(eq(productComponents.parentProductId, componentId))

    for (const child of childIds) {
      const grandchildExists = await db
        .select()
        .from(productComponents)
        .where(eq(productComponents.parentProductId, child.id))
        .limit(1)

      if (grandchildExists.length > 0) {
        throw new Error('Cannot add component: would create depth > 2')
      }
    }
  }

  return true
}
```

**Simplified Rule:** Components at level 2 cannot have their own components.

---

## Snapshot to Order (Corrected)

### **At checkout, snapshot the full tree (2 levels):**

```typescript
async function snapshotProductTree(productId: string) {
  // Level 1: Direct components
  const level1Components = await db
    .select({
      relationship: productComponents,
      component: products,
    })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.componentProductId, products.id))
    .where(eq(productComponents.parentProductId, productId))

  // Level 2: For each level 1 component, get its components
  const componentTree = await Promise.all(
    level1Components.map(async (l1) => {
      const level2Components = await db
        .select({
          relationship: productComponents,
          component: products,
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.componentProductId, products.id))
        .where(eq(productComponents.parentProductId, l1.component.id))

      return {
        // Level 1 data
        componentId: l1.component.id,
        componentSku: l1.component.sku,
        componentName: l1.component.name,
        quantity: l1.relationship.quantity,
        price: l1.relationship.priceOverride ?? l1.component.price,
        isIncluded: l1.relationship.isIncluded,

        // Level 2 data (sub-components)
        components: level2Components.map(l2 => ({
          componentId: l2.component.id,
          componentSku: l2.component.sku,
          componentName: l2.component.name,
          quantity: l2.relationship.quantity,
          price: l2.relationship.priceOverride ?? l2.component.price,
          isIncluded: l2.relationship.isIncluded,
        }))
      }
    })
  )

  return componentTree
}

// Result saved to order_items.component_tree:
[
  {
    componentId: 'pump_a1',
    componentSku: 'TPC-PUMP-A1',
    componentName: 'Pump A1',
    quantity: 1,
    price: 89.99,
    isIncluded: true,
    components: [  // ← Level 2 (sub-components of Pump A1)
      {
        componentId: 'motor_m1',
        componentSku: 'TPC-MOTOR-M1',
        componentName: 'Motor M1',
        quantity: 1,
        price: 45.00,
        isIncluded: true
      },
      {
        componentId: 'impeller_i2',
        componentSku: 'TPC-IMP-I2',
        componentName: 'Impeller I2',
        quantity: 1,
        price: 15.00,
        isIncluded: true
      }
    ]
  },
  {
    componentId: 'radiator_r2',
    componentSku: 'TPC-RAD-R2',
    componentName: 'Radiator R2',
    quantity: 1,
    price: 129.99,
    isIncluded: true,
    components: []  // ← No sub-components
  }
]
```

---

## Summary

### **Corrected Understanding:**

| Concept | Explanation |
|---------|-------------|
| **Depth 1** | Each product has **DIRECT** components only (1 level relationship) |
| **Junction Table** | Stores **only direct** parent → component pairs |
| **Total Hierarchy** | Maximum **2 levels** from root (Product → Component → Sub-component) |
| **Validation** | Prevent depth > 2 by checking if component's children have children |
| **Snapshot** | Query 2 levels and denormalize to order JSONB |

### **Junction Table Contains:**

```
✅ Cooling System Pro → Pump A1 (direct)
✅ Cooling System Pro → Radiator R2 (direct)
✅ Pump A1 → Motor M1 (direct)
✅ Pump A1 → Impeller I2 (direct)

❌ Cooling System Pro → Motor M1 (indirect - NOT stored)
```

### **Database Correctly Stores:**

- **Direct relationships only** (depth 1 from each parent)
- **Total hierarchy: 2 levels max** when traversed
- **Queries fetch 2 levels** for full tree
- **Snapshots capture 2 levels** in order JSONB

---

**Does this match your intended design?**
