# Catalog & Order System Design Documentation

**Version:** 1.0
**Last Updated:** 2025-10-04
**Purpose:** Comprehensive design documentation for product catalog and order management system

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Design Principles](#2-core-design-principles)
3. [Database Schema](#3-database-schema)
4. [Product Component Relationships](#4-product-component-relationships)
5. [SKU Naming Convention](#5-sku-naming-convention)
6. [Product Versioning Strategy](#6-product-versioning-strategy)
7. [Order Immutability & Snapshots](#7-order-immutability--snapshots)
8. [Workflows](#8-workflows)
9. [Data Integrity & Constraints](#9-data-integrity--constraints)
10. [API Interfaces](#10-api-interfaces)
11. [Extension Points](#11-extension-points)
12. [Testing & Validation](#12-testing--validation)
13. [Performance Considerations](#13-performance-considerations)
14. [Troubleshooting Guide](#14-troubleshooting-guide)

---

## 1. System Overview

### 1.1 Purpose

The catalog and order system manages:
- **Product catalog** with hierarchical component relationships
- **Product versioning** to track evolution over time
- **Order history** with immutable snapshots
- **Component-level pricing** and configurations
- **Replacement parts, upgrades, and kits**

### 1.2 Key Features

✅ **Many-to-Many Component Relationships** - Products can be both parents and components
✅ **Product Versioning** - Track product evolution without breaking order history
✅ **Order Immutability** - Orders are frozen snapshots, never affected by product changes
✅ **Component Tree** - 2-level hierarchy (Product → Component → Sub-component)
✅ **SKU Versioning** - Standardized 16-character SKU format with version tracking
✅ **Soft Deletion** - Products can be sunset/discontinued without data loss

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCT CATALOG                          │
│                                                             │
│  ┌──────────┐                    ┌──────────────────────┐  │
│  │ products │◄───┐         ┌────►│ product_components  │  │
│  │          │    │         │     │ (junction table)    │  │
│  │ - id     │    │         │     │                     │  │
│  │ - sku    │    └─────────┼─────│ - parent_product_id│  │
│  │ - version│              │     │ - component_prod_id│  │
│  │ - status │              └─────│ - quantity         │  │
│  └──────────┘                    │ - price_override   │  │
│       ▲                          └──────────────────────┘  │
│       │                                                     │
│       │ (many-to-many self-referential)                    │
│       │                                                     │
└───────┼─────────────────────────────────────────────────────┘
        │
        │ (snapshot at checkout)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    ORDER SYSTEM                             │
│                                                             │
│  ┌──────────┐                    ┌──────────────────────┐  │
│  │  orders  │                    │   order_items        │  │
│  │          │                    │                      │  │
│  │ - id     │◄───────────────────│ - order_id           │  │
│  │ - number │                    │ - product_id         │  │
│  │ - status │                    │ - product_sku        │  │
│  │ - total  │                    │ - product_version    │  │
│  └──────────┘                    │ - component_tree  ◄──┼──┐
│                                  │   (JSONB)            │  │
│                                  │ - line_total         │  │
│                                  └──────────────────────┘  │
│                                                             │
│  component_tree JSONB contains full product hierarchy      │
│  frozen at checkout (immutable)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Design Principles

### 2.1 Immutability

**Principle:** Orders are immutable snapshots.

**Implementation:**
- Order items contain denormalized product + component data in JSONB
- Product/component changes NEVER affect existing orders
- Orders show exact product configuration at purchase time

**Why:** Legal compliance, historical accuracy, customer support

### 2.2 Versioning

**Principle:** Products with orders cannot be modified directly.

**Implementation:**
- Check if product exists in any order (root, depth 1, or depth 2)
- If yes → Create new version with incremented SKU
- If no → Safe to modify directly

**Why:** Preserve order accuracy while allowing product evolution

### 2.3 Component Hierarchy

**Principle:** Maximum 2-level hierarchy (Product → Component → Sub-component).

**Implementation:**
- Junction table stores ONLY direct relationships
- Products can be both parents AND components (many-to-many)
- Circular references prevented by database triggers + app validation

**Why:** Manageable complexity, queryable structure, predictable performance

### 2.4 SKU Standardization

**Principle:** Fixed-length, parseable SKU format.

**Implementation:**
- Format: `XXX-XXXX-XXX-VXX` (16 chars)
- Components: PREFIX-CATEGORY-PRODUCT_CODE-VERSION
- Example: `TPC-PUMP-A01-V01`

**Why:** Database indexing, validation, version tracking, user clarity

---

## 3. Database Schema

### 3.1 Products Table

**Purpose:** Master product catalog (both standalone products and components)

```sql
CREATE TABLE products (
  -- Primary Key
  id TEXT PRIMARY KEY,                    -- Internal: 'prod_pump_a01_v01'

  -- SKU Components (standardized 16-char format)
  sku VARCHAR(16) NOT NULL UNIQUE,        -- 'TPC-PUMP-A01-V01'
  sku_prefix VARCHAR(3) NOT NULL,         -- 'TPC'
  sku_category VARCHAR(4) NOT NULL,       -- 'PUMP'
  sku_product_code VARCHAR(3) NOT NULL,   -- 'A01'
  sku_version VARCHAR(3) NOT NULL,        -- 'V01'

  -- Product Identity
  name TEXT NOT NULL,                     -- 'Coolant Pump A01'
  product_type TEXT NOT NULL,             -- 'system', 'component', 'part', 'kit'

  -- Product Capabilities
  can_be_component BOOLEAN NOT NULL DEFAULT TRUE,
  can_have_components BOOLEAN NOT NULL DEFAULT TRUE,

  -- Pricing
  price REAL NOT NULL,
  component_price REAL,                   -- Price when sold as component (may differ)
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Product Details
  description TEXT NOT NULL,
  short_description TEXT,
  specifications JSONB NOT NULL,
  images JSONB NOT NULL,
  features JSONB,

  -- Inventory
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,     -- Numeric version: 1, 2, 3
  base_product_id TEXT,                   -- Links to V01 (first version)
  previous_version_id TEXT REFERENCES products(id),
  replaced_by TEXT REFERENCES products(id),
  version_notes TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'sunset', 'discontinued'
  is_available_for_purchase BOOLEAN NOT NULL DEFAULT TRUE,
  sunset_date TIMESTAMP,

  -- Metadata
  meta_title TEXT,
  meta_description TEXT,
  tags JSONB,
  categories JSONB,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_sku_components ON products(sku_prefix, sku_category, sku_product_code);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_available ON products(is_available_for_purchase);
CREATE INDEX idx_products_version ON products(version);
```

### 3.2 Product Components Junction Table

**Purpose:** Many-to-many relationships between products (self-referential)

```sql
CREATE TABLE product_components (
  -- Primary Key
  id SERIAL PRIMARY KEY,

  -- Relationship (many-to-many)
  parent_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Component Configuration
  quantity INTEGER NOT NULL DEFAULT 1,    -- How many of this component
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  is_included BOOLEAN NOT NULL DEFAULT TRUE,  -- Included in base price?

  -- Pricing Override
  price_override REAL,                    -- If null, use product.component_price or product.price

  -- Display
  display_name TEXT,                      -- Optional override (e.g., "Primary Pump")
  sort_order INTEGER NOT NULL DEFAULT 0,
  category TEXT,                          -- Group components: 'cooling', 'power', 'accessories'

  -- Metadata
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_parent_component UNIQUE (parent_product_id, component_product_id),
  CONSTRAINT no_self_reference CHECK (parent_product_id != component_product_id)
);

-- Indexes
CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);
CREATE INDEX idx_product_components_child ON product_components(component_product_id);
CREATE INDEX idx_product_components_category ON product_components(category);

-- Trigger: Prevent circular references
CREATE OR REPLACE FUNCTION prevent_circular_component()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if component is already a parent of the parent (A→B prevents B→A)
  IF EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = NEW.component_product_id
      AND component_product_id = NEW.parent_product_id
  ) THEN
    RAISE EXCEPTION 'Circular reference detected: % already contains %',
      NEW.component_product_id, NEW.parent_product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_components
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_component();
```

### 3.3 Orders Table

**Purpose:** Order header information

```sql
CREATE TABLE orders (
  -- Primary Key
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,      -- 'ORD-2025-00001'

  -- Customer
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Customer Information (denormalized for guest orders)
  customer JSONB NOT NULL,                -- { email, name, phone }

  -- Addresses
  shipping_address JSONB NOT NULL,
  billing_address JSONB,

  -- Order Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'

  -- Totals
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  tax_rate REAL NOT NULL,
  shipping REAL NOT NULL,
  shipping_method TEXT NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  discount_code TEXT,
  total REAL NOT NULL,

  -- Payment
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,

  -- Shipping Tracking
  tracking_number TEXT,
  shipping_carrier TEXT,
  tracking_url TEXT,
  estimated_delivery TIMESTAMP,

  -- Notes
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB,

  -- Timestamps
  paid_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

### 3.4 Order Items Table (with Product Snapshots)

**Purpose:** Line items with immutable product/component snapshots

```sql
CREATE TABLE order_items (
  -- Primary Key
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- SNAPSHOT: Product Data (denormalized, immutable)
  product_id TEXT NOT NULL,               -- NO FK (allows product deletion)
  product_sku VARCHAR(16) NOT NULL,       -- 'TPC-PUMP-A01-V01' (frozen)
  product_name TEXT NOT NULL,
  product_version INTEGER NOT NULL,       -- Numeric: 1, 2, 3
  product_type TEXT NOT NULL,
  product_image TEXT,

  -- SNAPSHOT: Full Component Tree (denormalized JSONB)
  component_tree JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*
    Structure:
    [
      {
        "componentId": "prod_motor_m01",
        "componentSku": "TPC-MOTR-M01-V01",
        "componentName": "Brushless Motor M01",
        "componentVersion": 1,
        "quantity": 1,
        "price": 45.00,
        "isRequired": true,
        "isIncluded": true,
        "category": "parts",
        "components": [
          {
            "componentId": "prod_bearing_b01",
            "componentSku": "TPC-BRNG-B01-V01",
            "componentName": "Ceramic Bearing B01",
            "componentVersion": 1,
            "quantity": 2,
            "price": 5.00,
            "isRequired": true,
            "isIncluded": true
          }
        ]
      }
    ]
  */

  -- Pricing Breakdown
  quantity INTEGER NOT NULL,
  base_price REAL NOT NULL,               -- Product price without components
  included_components_price REAL NOT NULL DEFAULT 0,
  optional_components_price REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL,               -- quantity * (base + included + optional)

  -- Optional: Reporting FK (nullable, for analytics)
  current_product_id TEXT REFERENCES products(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(product_sku);
CREATE INDEX idx_order_items_current_product ON order_items(current_product_id);

-- GIN index for JSONB component_tree (for querying components)
CREATE INDEX idx_order_items_component_tree ON order_items USING GIN (component_tree);
```

### 3.5 Product Version History Table (Optional)

**Purpose:** Audit trail of product changes

```sql
CREATE TABLE product_version_history (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  version INTEGER NOT NULL,

  -- Change Information
  change_type TEXT NOT NULL,              -- 'price', 'component', 'spec', 'major'
  change_description TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Before/After Snapshot (for audit)
  before_snapshot JSONB,
  after_snapshot JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_version_history_product ON product_version_history(product_id);
CREATE INDEX idx_version_history_version ON product_version_history(product_id, version);
```

---

## 4. Product Component Relationships

### 4.1 Relationship Types

**Many-to-Many Self-Referential:**
- A product can have many components
- A component can be in many products
- Components can also be sold standalone
- Maximum depth: 2 levels from root

### 4.2 Example Structure

```
TPC-CLNT-PRO-V01 (Cooling System Pro)
├── TPC-PUMP-A01-V01 (Pump A01) [depth 1]
│   ├── TPC-MOTR-M01-V01 (Motor M01) [depth 2]
│   └── TPC-IMPL-I02-V01 (Impeller I02) [depth 2]
├── TPC-RADI-R02-V01 (Radiator R02) [depth 1]
│   └── TPC-BRKT-B01-V01 (Mounting Bracket) [depth 2]
└── TPC-RGBC-RGB-V01 (RGB Controller) [depth 1, optional]
    └── (no sub-components)
```

### 4.3 Junction Table Entries

```sql
-- Direct relationships only (depth 1 from each parent)

-- Cooling System Pro → Direct Components
INSERT INTO product_components (parent_product_id, component_product_id, quantity, is_included)
VALUES
  ('prod_clnt_pro_v01', 'prod_pump_a01_v01', 1, true),
  ('prod_clnt_pro_v01', 'prod_radi_r02_v01', 1, true),
  ('prod_clnt_pro_v01', 'prod_rgbc_rgb_v01', 1, false); -- Optional

-- Pump A01 → Direct Components (separate context)
INSERT INTO product_components (parent_product_id, component_product_id, quantity, is_included)
VALUES
  ('prod_pump_a01_v01', 'prod_motr_m01_v01', 1, true),
  ('prod_pump_a01_v01', 'prod_impl_i02_v01', 1, true);

-- Radiator R02 → Direct Components
INSERT INTO product_components (parent_product_id, component_product_id, quantity, is_included)
VALUES
  ('prod_radi_r02_v01', 'prod_brkt_b01_v01', 1, true);
```

### 4.4 Constraints & Rules

**Database-Level:**
- ✅ `UNIQUE(parent_product_id, component_product_id)` - No duplicate relationships
- ✅ `CHECK(parent_product_id != component_product_id)` - No self-reference
- ✅ Trigger: Prevent circular references (A→B blocks B→A)
- ✅ `ON DELETE CASCADE` for parent (delete components when parent deleted)
- ✅ `ON DELETE RESTRICT` for child (prevent component deletion if used)

**Application-Level:**
- ✅ Depth limit enforcement (max 2 levels from root)
- ✅ Product capability checks (`can_be_component`, `can_have_components`)
- ✅ Version checking before modification

---

## 5. SKU Naming Convention

### 5.1 Format Specification

**Pattern:** `XXX-XXXX-XXX-VXX`

| Component | Length | Example | Description |
|-----------|--------|---------|-------------|
| PREFIX | 3 chars | `TPC` | Company/Brand |
| CATEGORY | 4 chars | `PUMP` | Product category |
| PRODUCT_CODE | 3 chars | `A01` | Product identifier |
| VERSION | 3 chars | `V01` | Version (01-99) |

**Total:** 16 characters (fixed length)

### 5.2 Examples

```
TPC-CLNT-PRO-V01    Cooling System Pro, Version 1
TPC-CLNT-PRO-V02    Cooling System Pro, Version 2
TPC-PUMP-A01-V01    Pump A01, Version 1
TPC-PUMP-A01-V02    Pump A01, Version 2
TPC-MOTR-M01-V01    Motor M01, Version 1
TPC-RADI-R02-V01    Radiator R02, Version 1
TPC-UPKG-RGB-V01    RGB Upgrade Kit, Version 1
```

### 5.3 Category Codes

```
Systems:        CLNT, COMP
Components:     PUMP, RADI, RESV, FANS
Parts:          MOTR, IMPL, TUBE, FTNG, BRKT, SEAL
Electronics:    RGBC, SNSR, MNTR, CBLE
Kits:           UPKG, RPLC, MNTN, ACCS
Fluids:         FLUD, CLNR, ADTV
```

### 5.4 Versioning Rules

**When to increment version:**
- V01 → V02: Price change, component update, minor spec change
- V02 → V03: Further updates
- V01 → V99: Maximum 99 versions per product code

**When to create new product code:**
- Major redesign
- New model line
- Different form factor
- Example: `TPC-PUMP-A01-V05` → `TPC-PUMP-A02-V01`

### 5.5 SKU Helper Functions

```typescript
// Generate SKU
function generateSKU(prefix: string, category: string, productCode: string, version: number): string {
  return `${prefix}-${category}-${productCode}-V${version.toString().padStart(2, '0')}`
}

// Parse SKU
function parseSKU(sku: string): { prefix: string, category: string, productCode: string, version: number } {
  const regex = /^([A-Z]{3})-([A-Z]{4})-([A-Z0-9]{3})-V(\d{2})$/
  const match = sku.match(regex)
  if (!match) throw new Error(`Invalid SKU: ${sku}`)

  return {
    prefix: match[1],
    category: match[2],
    productCode: match[3],
    version: parseInt(match[4], 10)
  }
}

// Increment version
function incrementVersion(currentSKU: string): string {
  const { prefix, category, productCode, version } = parseSKU(currentSKU)
  if (version >= 99) throw new Error('Version limit reached')
  return generateSKU(prefix, category, productCode, version + 1)
}

// Validate SKU
function validateSKU(sku: string): boolean {
  return /^[A-Z]{3}-[A-Z]{4}-[A-Z0-9]{3}-V\d{2}$/.test(sku)
}
```

---

## 6. Product Versioning Strategy

### 6.1 Versioning Logic

**Rule:** If product (at any depth) exists in orders, create new version instead of modifying.

```typescript
async function shouldCreateVersion(productId: string): Promise<boolean> {
  // Check if product is in orders (as root, depth 1, or depth 2)
  const inOrders = await db
    .select({ count: sql`COUNT(*)` })
    .from(orderItems)
    .where(
      or(
        eq(orderItems.productId, productId), // Root product
        sql`component_tree @> ${JSON.stringify([{ componentId: productId }])}` // As component
      )
    )

  return inOrders[0].count > 0
}
```

### 6.2 Version Creation Workflow

```typescript
async function updateProduct(productId: string, changes: ProductChanges) {
  const needsVersion = await shouldCreateVersion(productId)

  if (needsVersion) {
    // Product has orders → Create new version
    return await createProductVersion(productId, changes)
  } else {
    // No orders → Safe to modify directly
    return await updateProductDirect(productId, changes)
  }
}

async function createProductVersion(productId: string, changes: ProductChanges) {
  const current = await getProduct(productId)
  const newSKU = incrementVersion(current.sku)
  const newVersion = current.version + 1

  // 1. Create new product record
  const newProduct = await db.insert(products).values({
    id: `${current.id.replace(/_v\d+$/, '')}_v${newVersion}`,
    sku: newSKU,
    skuPrefix: current.skuPrefix,
    skuCategory: current.skuCategory,
    skuProductCode: current.skuProductCode,
    skuVersion: `V${newVersion.toString().padStart(2, '0')}`,
    version: newVersion,
    baseProductId: current.baseProductId || current.id,
    previousVersionId: current.id,
    ...changes,
    status: 'active',
    isAvailableForPurchase: true
  }).returning()

  // 2. Copy component relationships (if parent product)
  const components = await db
    .select()
    .from(productComponents)
    .where(eq(productComponents.parentProductId, productId))

  for (const comp of components) {
    await db.insert(productComponents).values({
      parentProductId: newProduct[0].id,
      componentProductId: comp.componentProductId,
      quantity: comp.quantity,
      isRequired: comp.isRequired,
      isIncluded: comp.isIncluded,
      priceOverride: comp.priceOverride,
      displayName: comp.displayName,
      sortOrder: comp.sortOrder,
      category: comp.category
    })
  }

  // 3. Sunset old version
  await db.update(products)
    .set({
      status: 'sunset',
      isAvailableForPurchase: false,
      sunsetDate: new Date(),
      replacedBy: newProduct[0].id
    })
    .where(eq(products.id, productId))

  // 4. Log version history
  await db.insert(productVersionHistory).values({
    productId: current.id,
    version: newVersion,
    changeType: changes.changeType || 'update',
    changeDescription: changes.versionNotes || 'Product updated',
    changedBy: changes.userId,
    beforeSnapshot: current,
    afterSnapshot: newProduct[0]
  })

  return newProduct[0]
}
```

### 6.3 Sunsetting Products

**Status Lifecycle:**
- `active` → Currently available for purchase
- `sunset` → Replaced by newer version, not purchasable
- `discontinued` → Permanently removed from catalog

```typescript
async function sunsetProduct(productId: string, replacementId?: string) {
  await db.update(products)
    .set({
      status: 'sunset',
      isAvailableForPurchase: false,
      sunsetDate: new Date(),
      replacedBy: replacementId
    })
    .where(eq(products.id, productId))
}

async function discontinueProduct(productId: string, reason: string) {
  // Check if in any orders
  const inOrders = await isComponentInOrders(productId)

  if (inOrders) {
    // Has orders → Can only sunset, not delete
    await db.update(products)
      .set({
        status: 'discontinued',
        isAvailableForPurchase: false,
        sunsetDate: new Date(),
        versionNotes: reason
      })
      .where(eq(products.id, productId))
  } else {
    // No orders → Can safely delete
    await db.delete(products).where(eq(products.id, productId))
  }
}
```

---

## 7. Order Immutability & Snapshots

### 7.1 Snapshot Principle

**At checkout, capture complete product tree:**
- Root product data (SKU, name, version, price)
- All depth 1 components with their data
- All depth 2 sub-components with their data
- All stored in `order_items.component_tree` JSONB

### 7.2 Snapshot Implementation

```typescript
async function createOrderItemSnapshot(product: Product, quantity: number) {
  // 1. Get depth 1 components
  const depth1 = await db
    .select({
      rel: productComponents,
      comp: products
    })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.componentProductId, products.id))
    .where(eq(productComponents.parentProductId, product.id))
    .orderBy(productComponents.sortOrder)

  // 2. For each depth 1, get depth 2 sub-components
  const componentTree = await Promise.all(
    depth1.map(async (d1) => {
      const depth2 = await db
        .select({
          rel: productComponents,
          comp: products
        })
        .from(productComponents)
        .innerJoin(products, eq(productComponents.componentProductId, products.id))
        .where(eq(productComponents.parentProductId, d1.comp.id))
        .orderBy(productComponents.sortOrder)

      return {
        componentId: d1.comp.id,
        componentSku: d1.comp.sku,
        componentName: d1.rel.displayName || d1.comp.name,
        componentVersion: d1.comp.version,
        componentType: d1.comp.productType,
        quantity: d1.rel.quantity,
        price: d1.rel.priceOverride || d1.comp.componentPrice || d1.comp.price,
        isRequired: d1.rel.isRequired,
        isIncluded: d1.rel.isIncluded,
        category: d1.rel.category,

        // Depth 2 sub-components
        components: depth2.map(d2 => ({
          componentId: d2.comp.id,
          componentSku: d2.comp.sku,
          componentName: d2.rel.displayName || d2.comp.name,
          componentVersion: d2.comp.version,
          quantity: d2.rel.quantity,
          price: d2.rel.priceOverride || d2.comp.componentPrice || d2.comp.price,
          isRequired: d2.rel.isRequired,
          isIncluded: d2.rel.isIncluded
        }))
      }
    })
  )

  // 3. Calculate pricing
  const calculateTreePrice = (components: any[]): number => {
    return components.reduce((sum, comp) => {
      const compTotal = comp.isIncluded ? comp.price * comp.quantity : 0
      const subTotal = comp.components ? calculateTreePrice(comp.components) : 0
      return sum + compTotal + subTotal
    }, 0)
  }

  const includedPrice = calculateTreePrice(componentTree.filter(c => c.isIncluded))
  const optionalPrice = calculateTreePrice(componentTree.filter(c => !c.isIncluded))
  const lineTotal = quantity * (product.price + includedPrice + optionalPrice)

  // 4. Return snapshot
  return {
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    productVersion: product.version,
    productType: product.productType,
    productImage: product.images?.[0],

    componentTree: componentTree, // Full tree frozen

    quantity: quantity,
    basePrice: product.price,
    includedComponentsPrice: includedPrice,
    optionalComponentsPrice: optionalPrice,
    lineTotal: lineTotal,

    currentProductId: product.id // Optional FK for reporting
  }
}
```

### 7.3 Component Tree Structure

```jsonc
// order_items.component_tree (JSONB)
[
  {
    "componentId": "prod_pump_a01_v01",
    "componentSku": "TPC-PUMP-A01-V01",
    "componentName": "Coolant Pump A01",
    "componentVersion": 1,
    "componentType": "component",
    "quantity": 1,
    "price": 89.99,
    "isRequired": true,
    "isIncluded": true,
    "category": "cooling",

    // Depth 2 sub-components
    "components": [
      {
        "componentId": "prod_motr_m01_v01",
        "componentSku": "TPC-MOTR-M01-V01",
        "componentName": "Brushless Motor M01",
        "componentVersion": 1,
        "quantity": 1,
        "price": 45.00,
        "isRequired": true,
        "isIncluded": true
      },
      {
        "componentId": "prod_impl_i02_v01",
        "componentSku": "TPC-IMPL-I02-V01",
        "componentName": "Impeller I02",
        "componentVersion": 1,
        "quantity": 1,
        "price": 15.00,
        "isRequired": true,
        "isIncluded": true
      }
    ]
  },
  {
    "componentId": "prod_radi_r02_v01",
    "componentSku": "TPC-RADI-R02-V01",
    "componentName": "Aluminum Radiator R02",
    "componentVersion": 1,
    "componentType": "component",
    "quantity": 1,
    "price": 129.99,
    "isRequired": true,
    "isIncluded": true,
    "category": "cooling",
    "components": [] // No sub-components
  }
]
```

### 7.4 Immutability Guarantees

✅ **Product changes don't affect orders** - Snapshot is denormalized
✅ **Component changes don't affect orders** - Full tree captured
✅ **Products can be deleted** - No FK from order_items.productId
✅ **Price changes don't affect orders** - Prices frozen in snapshot
✅ **Version tracking** - Each component has version captured

---

## 8. Workflows

### 8.1 Create New Product

```typescript
async function createProduct(data: NewProductData) {
  // 1. Generate SKU
  const sku = generateSKU(
    data.skuPrefix || 'TPC',
    data.skuCategory,
    data.skuProductCode,
    1 // Initial version
  )

  // 2. Validate SKU uniqueness
  await ensureUniqueSKU(sku)

  // 3. Create product
  const product = await db.insert(products).values({
    id: generateProductId(),
    sku: sku,
    skuPrefix: data.skuPrefix || 'TPC',
    skuCategory: data.skuCategory,
    skuProductCode: data.skuProductCode,
    skuVersion: 'V01',
    version: 1,
    name: data.name,
    productType: data.productType,
    canBeComponent: data.canBeComponent ?? true,
    canHaveComponents: data.canHaveComponents ?? true,
    price: data.price,
    componentPrice: data.componentPrice,
    description: data.description,
    specifications: data.specifications,
    images: data.images,
    status: 'active',
    isAvailableForPurchase: true
  }).returning()

  return product[0]
}
```

### 8.2 Add Component to Product

```typescript
async function addComponentToProduct(
  parentProductId: string,
  componentProductId: string,
  config: ComponentConfig
) {
  // 1. Validate products exist
  const [parent, component] = await Promise.all([
    getProduct(parentProductId),
    getProduct(componentProductId)
  ])

  // 2. Validate capabilities
  if (!parent.canHaveComponents) {
    throw new Error(`${parent.name} cannot have components`)
  }
  if (!component.canBeComponent) {
    throw new Error(`${component.name} cannot be used as component`)
  }

  // 3. Check self-reference
  if (parentProductId === componentProductId) {
    throw new Error('Product cannot contain itself')
  }

  // 4. Check circular reference
  const circular = await db
    .select()
    .from(productComponents)
    .where(
      and(
        eq(productComponents.parentProductId, componentProductId),
        eq(productComponents.componentProductId, parentProductId)
      )
    )

  if (circular.length > 0) {
    throw new Error('Circular reference detected')
  }

  // 5. Check depth limit (prevent depth > 2)
  const componentHasChildren = await db
    .select()
    .from(productComponents)
    .where(eq(productComponents.parentProductId, componentProductId))
    .limit(1)

  if (componentHasChildren.length > 0) {
    // Component has its own components
    // Check if any of parent's components also have components
    const parentComponents = await db
      .select({ compId: productComponents.componentProductId })
      .from(productComponents)
      .where(eq(productComponents.parentProductId, parentProductId))

    for (const pc of parentComponents) {
      const hasGrandchildren = await db
        .select()
        .from(productComponents)
        .where(eq(productComponents.parentProductId, pc.compId))
        .limit(1)

      if (hasGrandchildren.length > 0) {
        throw new Error('Maximum depth (2) exceeded')
      }
    }
  }

  // 6. Insert component relationship
  await db.insert(productComponents).values({
    parentProductId,
    componentProductId,
    quantity: config.quantity || 1,
    isRequired: config.isRequired ?? true,
    isIncluded: config.isIncluded ?? true,
    priceOverride: config.priceOverride,
    displayName: config.displayName,
    sortOrder: config.sortOrder || 0,
    category: config.category,
    notes: config.notes
  })

  return { success: true }
}
```

### 8.3 Update Product (with Versioning Check)

```typescript
async function updateProduct(productId: string, changes: ProductChanges) {
  // 1. Check if product exists in orders
  const needsVersion = await shouldCreateVersion(productId)

  if (needsVersion) {
    // Has orders → Create new version
    return await createProductVersion(productId, changes)
  } else {
    // No orders → Safe to update directly
    const updated = await db
      .update(products)
      .set({
        ...changes,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId))
      .returning()

    return updated[0]
  }
}
```

### 8.4 Place Order (Checkout)

```typescript
async function createOrder(cartId: string, orderData: OrderData) {
  // 1. Get cart items with current products
  const cartItems = await getCartItemsWithProducts(cartId)

  // 2. Validate products are available
  for (const item of cartItems) {
    if (!item.product.isAvailableForPurchase) {
      throw new Error(`${item.product.name} is no longer available`)
    }
    if (!item.product.inStock || item.product.stockQuantity < item.quantity) {
      throw new Error(`${item.product.name} is out of stock`)
    }
  }

  // 3. Create order header
  const order = await db.insert(orders).values({
    orderNumber: generateOrderNumber(),
    userId: orderData.userId,
    customer: orderData.customer,
    shippingAddress: orderData.shippingAddress,
    billingAddress: orderData.billingAddress,
    status: 'pending',
    subtotal: orderData.subtotal,
    tax: orderData.tax,
    taxRate: orderData.taxRate,
    shipping: orderData.shipping,
    shippingMethod: orderData.shippingMethod,
    discount: orderData.discount,
    discountCode: orderData.discountCode,
    total: orderData.total,
    paymentMethod: orderData.paymentMethod,
    paymentStatus: 'pending'
  }).returning()

  // 4. Create order items with snapshots
  for (const item of cartItems) {
    const snapshot = await createOrderItemSnapshot(item.product, item.quantity)

    await db.insert(orderItems).values({
      orderId: order[0].id,
      ...snapshot
    })
  }

  // 5. Update inventory
  for (const item of cartItems) {
    await db
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`
      })
      .where(eq(products.id, item.product.id))
  }

  // 6. Clear cart
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId))

  return order[0]
}
```

### 8.5 Query Order with Full Product Tree

```typescript
async function getOrderDetails(orderNumber: string) {
  const orderWithItems = await db
    .select({
      order: orders,
      items: orderItems
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(eq(orders.orderNumber, orderNumber))

  return {
    order: orderWithItems[0].order,
    items: orderWithItems.map(row => ({
      ...row.items,
      // componentTree is already JSONB - no joins needed!
      productTree: row.items.componentTree
    }))
  }
}
```

---

## 9. Data Integrity & Constraints

### 9.1 Foreign Key Constraints

```sql
-- Products table
ALTER TABLE products
  ADD CONSTRAINT fk_products_previous_version
    FOREIGN KEY (previous_version_id) REFERENCES products(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_products_replaced_by
    FOREIGN KEY (replaced_by) REFERENCES products(id) ON DELETE SET NULL;

-- Product Components table
ALTER TABLE product_components
  ADD CONSTRAINT fk_components_parent
    FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_components_child
    FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- Order Items table
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_order_items_current_product
    FOREIGN KEY (current_product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Orders table
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

### 9.2 Check Constraints

```sql
-- Products
ALTER TABLE products
  ADD CONSTRAINT check_products_price_positive
    CHECK (price >= 0),
  ADD CONSTRAINT check_products_stock_positive
    CHECK (stock_quantity >= 0),
  ADD CONSTRAINT check_products_version_positive
    CHECK (version > 0),
  ADD CONSTRAINT check_products_status
    CHECK (status IN ('active', 'sunset', 'discontinued'));

-- Product Components
ALTER TABLE product_components
  ADD CONSTRAINT check_components_quantity_positive
    CHECK (quantity > 0),
  ADD CONSTRAINT check_components_no_self_reference
    CHECK (parent_product_id != component_product_id);

-- Order Items
ALTER TABLE order_items
  ADD CONSTRAINT check_order_items_quantity_positive
    CHECK (quantity > 0),
  ADD CONSTRAINT check_order_items_prices_positive
    CHECK (base_price >= 0 AND line_total >= 0);
```

### 9.3 Unique Constraints

```sql
-- Products
ALTER TABLE products
  ADD CONSTRAINT unique_products_sku UNIQUE (sku);

-- Product Components
ALTER TABLE product_components
  ADD CONSTRAINT unique_parent_component UNIQUE (parent_product_id, component_product_id);

-- Orders
ALTER TABLE orders
  ADD CONSTRAINT unique_orders_number UNIQUE (order_number);
```

### 9.4 Triggers

**Prevent Circular References:**
```sql
CREATE OR REPLACE FUNCTION prevent_circular_component()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = NEW.component_product_id
      AND component_product_id = NEW.parent_product_id
  ) THEN
    RAISE EXCEPTION 'Circular reference: % already contains %',
      NEW.component_product_id, NEW.parent_product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_components
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_component();
```

**Auto-Update Timestamps:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER product_components_updated_at
  BEFORE UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## 10. API Interfaces

### 10.1 Product Management API

**Create Product:**
```typescript
POST /api/admin/products
{
  "skuCategory": "PUMP",
  "skuProductCode": "A01",
  "name": "Coolant Pump A01",
  "productType": "component",
  "price": 89.99,
  "description": "High-performance coolant pump",
  "specifications": { ... },
  "images": ["url1", "url2"],
  "canBeComponent": true,
  "canHaveComponents": true
}

Response:
{
  "id": "prod_pump_a01_v01",
  "sku": "TPC-PUMP-A01-V01",
  "name": "Coolant Pump A01",
  "version": 1,
  "status": "active"
}
```

**Update Product (with auto-versioning):**
```typescript
PATCH /api/admin/products/:id
{
  "price": 99.99,
  "versionNotes": "Price increase"
}

Response (if has orders):
{
  "versioned": true,
  "oldProduct": { "sku": "TPC-PUMP-A01-V01", "status": "sunset" },
  "newProduct": { "sku": "TPC-PUMP-A01-V02", "status": "active" }
}

Response (if no orders):
{
  "versioned": false,
  "product": { "sku": "TPC-PUMP-A01-V01", "price": 99.99 }
}
```

**Add Component:**
```typescript
POST /api/admin/products/:parentId/components
{
  "componentProductId": "prod_motr_m01_v01",
  "quantity": 1,
  "isRequired": true,
  "isIncluded": true,
  "priceOverride": null,
  "category": "parts"
}

Response:
{
  "success": true,
  "relationship": {
    "parent": "TPC-PUMP-A01-V01",
    "component": "TPC-MOTR-M01-V01",
    "quantity": 1
  }
}
```

**Get Product with Components:**
```typescript
GET /api/products/:id?includeComponents=true

Response:
{
  "product": {
    "id": "prod_pump_a01_v01",
    "sku": "TPC-PUMP-A01-V01",
    "name": "Coolant Pump A01",
    "price": 89.99,
    "version": 1
  },
  "components": [
    {
      "componentId": "prod_motr_m01_v01",
      "componentSku": "TPC-MOTR-M01-V01",
      "componentName": "Brushless Motor M01",
      "quantity": 1,
      "price": 45.00,
      "isIncluded": true,
      "subComponents": [
        {
          "componentId": "prod_bearing_b01_v01",
          "componentSku": "TPC-BRNG-B01-V01",
          "componentName": "Ceramic Bearing B01",
          "quantity": 2,
          "price": 5.00,
          "isIncluded": true
        }
      ]
    }
  ]
}
```

### 10.2 Order API

**Create Order (Checkout):**
```typescript
POST /api/orders
{
  "cartId": "cart_123",
  "customer": { "email": "user@example.com", "name": "John Doe" },
  "shippingAddress": { ... },
  "paymentMethod": "stripe",
  "stripePaymentIntentId": "pi_xyz"
}

Response:
{
  "order": {
    "id": 1,
    "orderNumber": "ORD-2025-00001",
    "total": 1279.97,
    "status": "pending"
  },
  "items": [
    {
      "productSku": "TPC-CLNT-PRO-V01",
      "productName": "Cooling System Pro",
      "quantity": 1,
      "lineTotal": 1279.97,
      "componentTree": [ ... ] // Full snapshot
    }
  ]
}
```

**Get Order Details:**
```typescript
GET /api/orders/:orderNumber

Response:
{
  "order": {
    "orderNumber": "ORD-2025-00001",
    "status": "shipped",
    "total": 1279.97,
    "createdAt": "2025-01-15T10:00:00Z",
    "trackingNumber": "1Z999AA1234567890"
  },
  "items": [
    {
      "productSku": "TPC-CLNT-PRO-V01",
      "productName": "Cooling System Pro (v1)",
      "quantity": 1,
      "componentTree": [
        {
          "componentSku": "TPC-PUMP-A01-V01",
          "componentName": "Coolant Pump A01",
          "components": [
            {
              "componentSku": "TPC-MOTR-M01-V01",
              "componentName": "Brushless Motor M01"
            }
          ]
        }
      ]
    }
  ]
}
```

### 10.3 Catalog Query API

**Search Products:**
```typescript
GET /api/products?category=PUMP&status=active&page=1&limit=20

Response:
{
  "products": [
    {
      "sku": "TPC-PUMP-A01-V02",
      "name": "Coolant Pump A01",
      "price": 99.99,
      "version": 2,
      "status": "active"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3
  }
}
```

**Get Product Version History:**
```typescript
GET /api/products/:productCode/versions

Response:
{
  "productCode": "A01",
  "category": "PUMP",
  "versions": [
    {
      "sku": "TPC-PUMP-A01-V01",
      "version": 1,
      "status": "sunset",
      "createdAt": "2024-01-01",
      "sunsetDate": "2025-01-01",
      "replacedBy": "TPC-PUMP-A01-V02"
    },
    {
      "sku": "TPC-PUMP-A01-V02",
      "version": 2,
      "status": "active",
      "createdAt": "2025-01-01"
    }
  ]
}
```

---

## 11. Extension Points

### 11.1 Adding New Product Types

```typescript
// 1. Add category code to standard
const NEW_CATEGORIES = {
  'CTRL': 'Controller',
  'DSPY': 'Display',
  'PWRS': 'Power Supply'
}

// 2. Create products with new category
const controller = await createProduct({
  skuCategory: 'CTRL',
  skuProductCode: 'C01',
  name: 'Flow Controller C01',
  productType: 'electronics',
  // ...
})

// 3. No schema changes needed!
```

### 11.2 Adding Component Metadata

```typescript
// Extend component relationship with custom fields
await db.insert(productComponents).values({
  parentProductId: 'prod_system',
  componentProductId: 'prod_component',
  quantity: 1,

  // Custom metadata (use notes or add JSONB column)
  notes: JSON.stringify({
    installationDifficulty: 'medium',
    requiredTools: ['wrench', 'screwdriver'],
    estimatedInstallTime: 30, // minutes
    compatibilityNotes: 'Requires mounting bracket B01'
  })
})
```

### 11.3 Custom Pricing Rules

```typescript
// Dynamic pricing based on quantity or customer tier
async function calculateComponentPrice(
  componentId: string,
  quantity: number,
  customerTier: string
): Promise<number> {
  const component = await getProduct(componentId)
  let price = component.componentPrice || component.price

  // Quantity discounts
  if (quantity >= 10) price *= 0.9  // 10% off
  if (quantity >= 50) price *= 0.85 // 15% off

  // Customer tier discounts
  if (customerTier === 'wholesale') price *= 0.8
  if (customerTier === 'distributor') price *= 0.7

  return price
}
```

### 11.4 Product Bundles

```typescript
// Create bundle product
const bundle = await createProduct({
  skuCategory: 'COMP',
  skuProductCode: 'BDL',
  name: 'Complete System Bundle',
  productType: 'bundle',
  price: 999.99, // Bundle price (discounted)
  // ...
})

// Add bundled components
await addComponentToProduct(bundle.id, 'prod_pump_a01', {
  quantity: 1,
  isIncluded: true,
  priceOverride: 0 // Included in bundle price
})

await addComponentToProduct(bundle.id, 'prod_radiator_r02', {
  quantity: 1,
  isIncluded: true,
  priceOverride: 0
})
```

### 11.5 Compatibility Checking

```typescript
// Check if component is compatible with parent
async function checkCompatibility(
  parentId: string,
  componentId: string
): Promise<{ compatible: boolean, reason?: string }> {
  const [parent, component] = await Promise.all([
    getProduct(parentId),
    getProduct(componentId)
  ])

  // Custom compatibility rules
  if (parent.specifications?.powerRequirement > component.specifications?.powerOutput) {
    return {
      compatible: false,
      reason: 'Insufficient power output'
    }
  }

  if (parent.specifications?.mountingType !== component.specifications?.mountingType) {
    return {
      compatible: false,
      reason: 'Incompatible mounting type'
    }
  }

  return { compatible: true }
}
```

---

## 12. Testing & Validation

### 12.1 Unit Tests

```typescript
describe('Product Versioning', () => {
  test('should create new version when product has orders', async () => {
    const product = await createProduct({ /* ... */ })
    const order = await createOrder({ /* includes product */ })

    const updated = await updateProduct(product.id, { price: 99.99 })

    expect(updated.sku).toBe('TPC-PUMP-A01-V02')
    expect(updated.version).toBe(2)

    const oldProduct = await getProduct(product.id)
    expect(oldProduct.status).toBe('sunset')
    expect(oldProduct.replacedBy).toBe(updated.id)
  })

  test('should update directly when product has no orders', async () => {
    const product = await createProduct({ /* ... */ })

    const updated = await updateProduct(product.id, { price: 99.99 })

    expect(updated.id).toBe(product.id)
    expect(updated.sku).toBe('TPC-PUMP-A01-V01') // Same SKU
    expect(updated.price).toBe(99.99)
  })
})

describe('Component Relationships', () => {
  test('should prevent circular references', async () => {
    const productA = await createProduct({ /* ... */ })
    const productB = await createProduct({ /* ... */ })

    await addComponentToProduct(productA.id, productB.id, {})

    await expect(
      addComponentToProduct(productB.id, productA.id, {})
    ).rejects.toThrow('Circular reference detected')
  })

  test('should prevent depth > 2', async () => {
    const level0 = await createProduct({ /* ... */ })
    const level1 = await createProduct({ /* ... */ })
    const level2 = await createProduct({ /* ... */ })

    await addComponentToProduct(level1.id, level2.id, {})
    await addComponentToProduct(level0.id, level1.id, {})

    // level2 now at depth 2 from level0
    // Try to add level3 to level2 (would be depth 3)
    const level3 = await createProduct({ /* ... */ })

    await expect(
      addComponentToProduct(level2.id, level3.id, {})
    ).rejects.toThrow('Maximum depth')
  })
})

describe('Order Immutability', () => {
  test('should snapshot product tree at checkout', async () => {
    const product = await createProduct({ price: 100 })
    const component = await createProduct({ price: 50 })
    await addComponentToProduct(product.id, component.id, {})

    const order = await createOrder({ /* includes product */ })

    // Update product price
    await updateProduct(product.id, { price: 200 })

    // Order should still show old price
    const orderDetails = await getOrderDetails(order.orderNumber)
    expect(orderDetails.items[0].basePrice).toBe(100)
    expect(orderDetails.items[0].componentTree[0].price).toBe(50)
  })
})
```

### 12.2 Integration Tests

```typescript
describe('Complete Order Flow', () => {
  test('should create order with versioned products', async () => {
    // 1. Setup products
    const pump = await createProduct({ sku: 'TPC-PUMP-A01-V01', price: 89.99 })
    const motor = await createProduct({ sku: 'TPC-MOTR-M01-V01', price: 45.00 })
    await addComponentToProduct(pump.id, motor.id, {})

    // 2. Add to cart and checkout
    const cart = await createCart(userId)
    await addToCart(cart.id, pump.id, 1)
    const order1 = await createOrder(cart.id, { /* ... */ })

    // 3. Update pump (creates V02)
    const pumpV2 = await updateProduct(pump.id, { price: 99.99 })

    // 4. New order should use V02
    const cart2 = await createCart(userId)
    await addToCart(cart2.id, pumpV2.id, 1)
    const order2 = await createOrder(cart2.id, { /* ... */ })

    // Verify orders
    const details1 = await getOrderDetails(order1.orderNumber)
    const details2 = await getOrderDetails(order2.orderNumber)

    expect(details1.items[0].productSku).toBe('TPC-PUMP-A01-V01')
    expect(details1.items[0].basePrice).toBe(89.99)

    expect(details2.items[0].productSku).toBe('TPC-PUMP-A01-V02')
    expect(details2.items[0].basePrice).toBe(99.99)
  })
})
```

### 12.3 Data Validation Tests

```typescript
describe('SKU Validation', () => {
  test('should validate SKU format', () => {
    expect(validateSKU('TPC-PUMP-A01-V01')).toBe(true)
    expect(validateSKU('TPC-PMP-A01-V01')).toBe(false) // Category not 4 chars
    expect(validateSKU('TPC-PUMP-A1-V01')).toBe(false) // Product code not 3 chars
    expect(validateSKU('TPC-PUMP-A01-V1')).toBe(false) // Version not 2 digits
  })

  test('should parse SKU correctly', () => {
    const parsed = parseSKU('TPC-PUMP-A01-V02')
    expect(parsed.prefix).toBe('TPC')
    expect(parsed.category).toBe('PUMP')
    expect(parsed.productCode).toBe('A01')
    expect(parsed.versionNumber).toBe(2)
  })
})
```

---

## 13. Performance Considerations

### 13.1 Database Indexes

**Essential Indexes:**
```sql
-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_available ON products(is_available_for_purchase);
CREATE INDEX idx_products_category ON products(sku_category);

-- Product Components
CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);
CREATE INDEX idx_product_components_child ON product_components(component_product_id);

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_sku ON order_items(product_sku);
CREATE INDEX idx_order_items_component_tree ON order_items USING GIN (component_tree);
```

### 13.2 Query Optimization

**Efficient Product Tree Query:**
```sql
-- Get product with components in single query
WITH RECURSIVE component_tree AS (
  -- Level 0: Root product
  SELECT
    id,
    sku,
    name,
    price,
    0 as depth,
    ARRAY[id] as path
  FROM products
  WHERE id = 'prod_clnt_pro_v01'

  UNION ALL

  -- Level 1 & 2: Components
  SELECT
    p.id,
    p.sku,
    p.name,
    COALESCE(pc.price_override, p.component_price, p.price) as price,
    ct.depth + 1,
    ct.path || p.id
  FROM component_tree ct
  JOIN product_components pc ON pc.parent_product_id = ct.id
  JOIN products p ON p.id = pc.component_product_id
  WHERE ct.depth < 2 -- Limit depth
)
SELECT * FROM component_tree ORDER BY depth, path;
```

**Efficient Order Query:**
```sql
-- Orders with items (no joins needed for components!)
SELECT
  o.*,
  oi.id as item_id,
  oi.product_sku,
  oi.product_name,
  oi.component_tree, -- Already denormalized
  oi.line_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'ORD-2025-00001';
```

### 13.3 Caching Strategy

```typescript
// Cache product with components
const CACHE_TTL = 3600 // 1 hour

async function getProductWithComponentsCached(productId: string) {
  const cacheKey = `product:${productId}:components`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Query database
  const product = await getProductWithComponents(productId)

  // Cache result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(product))

  return product
}

// Invalidate cache on update
async function updateProduct(productId: string, changes: any) {
  const updated = await db.update(products).set(changes)...

  // Invalidate cache
  await redis.del(`product:${productId}:components`)

  return updated
}
```

### 13.4 Pagination

```typescript
// Paginated product listing
async function getProducts(page: number = 1, limit: number = 20, filters: any = {}) {
  const offset = (page - 1) * limit

  const [products, totalCount] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(
        filters.category ? eq(products.skuCategory, filters.category) : undefined,
        filters.status ? eq(products.status, filters.status) : undefined
      ))
      .orderBy(products.createdAt)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql`COUNT(*)` })
      .from(products)
      .where(/* same filters */)
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      total: totalCount[0].count,
      pages: Math.ceil(totalCount[0].count / limit)
    }
  }
}
```

---

## 14. Troubleshooting Guide

### 14.1 Common Issues

**Issue: Circular reference error when adding component**

```typescript
// Error: "Circular reference detected: prod_b already contains prod_a"

// Solution: Check existing relationships
const existing = await db
  .select()
  .from(productComponents)
  .where(
    or(
      and(
        eq(productComponents.parentProductId, productA),
        eq(productComponents.componentProductId, productB)
      ),
      and(
        eq(productComponents.parentProductId, productB),
        eq(productComponents.componentProductId, productA)
      )
    )
  )

// Remove conflicting relationship first
await db.delete(productComponents).where(...)
```

**Issue: Maximum depth exceeded**

```typescript
// Error: "Maximum depth (2) exceeded"

// Solution: Check component hierarchy depth
async function getComponentDepth(productId: string, currentDepth: number = 0): Promise<number> {
  if (currentDepth >= 2) return currentDepth

  const components = await db
    .select({ id: productComponents.componentProductId })
    .from(productComponents)
    .where(eq(productComponents.parentProductId, productId))

  if (components.length === 0) return currentDepth

  const depths = await Promise.all(
    components.map(c => getComponentDepth(c.id, currentDepth + 1))
  )

  return Math.max(...depths)
}

// Restructure hierarchy if depth > 2
```

**Issue: Order shows wrong product data**

```typescript
// Order shows updated price instead of purchase price

// Diagnosis: Check if snapshot was created
const orderItem = await db
  .select()
  .from(orderItems)
  .where(eq(orderItems.id, itemId))

console.log('Snapshot:', orderItem.componentTree)
// If empty [] → snapshot failed

// Fix: Regenerate snapshot (only if order not finalized)
if (order.status === 'pending') {
  const product = await getProduct(orderItem.currentProductId)
  const snapshot = await createOrderItemSnapshot(product, orderItem.quantity)

  await db
    .update(orderItems)
    .set({
      componentTree: snapshot.componentTree,
      basePrice: snapshot.basePrice
    })
    .where(eq(orderItems.id, itemId))
}
```

**Issue: Product version not incrementing**

```typescript
// SKU stays V01 after update

// Diagnosis: Check if product has orders
const hasOrders = await isComponentInOrders(productId)
console.log('Has orders:', hasOrders)

// If true but version didn't increment:
// Check updateProduct logic
const needsVersion = await shouldCreateVersion(productId)
if (needsVersion) {
  // Should create version
  await createProductVersion(productId, changes)
} else {
  // Should update directly
  await updateProductDirect(productId, changes)
}
```

### 14.2 Data Recovery

**Recover deleted product from orders:**

```typescript
// Product was deleted but exists in orders
const deletedProductData = await db
  .select({
    sku: orderItems.productSku,
    name: orderItems.productName,
    version: orderItems.productVersion
  })
  .from(orderItems)
  .where(eq(orderItems.productId, deletedProductId))
  .limit(1)

// Recreate product from order snapshot
await db.insert(products).values({
  id: deletedProductId,
  sku: deletedProductData.sku,
  name: deletedProductData.name,
  version: deletedProductData.version,
  status: 'discontinued',
  isAvailableForPurchase: false
  // ... other required fields
})
```

**Fix broken component tree:**

```typescript
// Order has invalid component tree
const order = await getOrder(orderId)

for (const item of order.items) {
  if (!item.componentTree || item.componentTree.length === 0) {
    // Regenerate from current product (best effort)
    const product = await getProduct(item.currentProductId)

    if (product) {
      const snapshot = await createOrderItemSnapshot(product, item.quantity)

      await db
        .update(orderItems)
        .set({ componentTree: snapshot.componentTree })
        .where(eq(orderItems.id, item.id))
    }
  }
}
```

### 14.3 Performance Issues

**Slow product tree queries:**

```typescript
// Add indexes
CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);
CREATE INDEX idx_product_components_child ON product_components(component_product_id);

// Use recursive CTE (shown in section 13.2)

// Or denormalize component tree to products table
ALTER TABLE products ADD COLUMN component_tree_cache JSONB;

// Update cache on component changes
async function updateComponentTreeCache(productId: string) {
  const tree = await getProductWithComponents(productId)
  await db
    .update(products)
    .set({ componentTreeCache: tree.components })
    .where(eq(products.id, productId))
}
```

**Slow order queries:**

```typescript
// Ensure indexes exist
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

// Use pagination for order lists
async function getUserOrders(userId: number, page: number = 1) {
  const limit = 20
  const offset = (page - 1) * limit

  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
}
```

---

## 15. Migration & Deployment

### 15.1 Initial Setup

```sql
-- Run migrations in order:

-- 1. Create products table
\i migrations/001_create_products.sql

-- 2. Create product_components junction table
\i migrations/002_create_product_components.sql

-- 3. Create orders table
\i migrations/003_create_orders.sql

-- 4. Create order_items table
\i migrations/004_create_order_items.sql

-- 5. Create indexes
\i migrations/005_create_indexes.sql

-- 6. Create triggers
\i migrations/006_create_triggers.sql

-- 7. Seed initial data (optional)
\i seeds/001_seed_products.sql
```

### 15.2 Upgrading Existing System

```sql
-- Add versioning to existing products
ALTER TABLE products
  ADD COLUMN sku_prefix VARCHAR(3) NOT NULL DEFAULT 'TPC',
  ADD COLUMN sku_category VARCHAR(4) NOT NULL,
  ADD COLUMN sku_product_code VARCHAR(3) NOT NULL,
  ADD COLUMN sku_version VARCHAR(3) NOT NULL DEFAULT 'V01',
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN base_product_id TEXT,
  ADD COLUMN previous_version_id TEXT,
  ADD COLUMN replaced_by TEXT;

-- Migrate existing SKUs
UPDATE products
SET
  sku_category = CASE
    WHEN product_type = 'system' THEN 'CLNT'
    WHEN product_type = 'pump' THEN 'PUMP'
    -- ... map other types
  END,
  sku_product_code = LPAD(id::text, 3, '0'),
  sku = CONCAT('TPC-', sku_category, '-', sku_product_code, '-V01');

-- Add component tree to order_items
ALTER TABLE order_items
  ADD COLUMN component_tree JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN product_version INTEGER NOT NULL DEFAULT 1;

-- Backfill component trees (best effort)
-- Note: This only captures current state, not historical
UPDATE order_items oi
SET component_tree = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'componentId', pc.component_product_id,
      'componentSku', p.sku,
      'componentName', p.name,
      'quantity', pc.quantity,
      'price', COALESCE(pc.price_override, p.price)
    )
  )
  FROM product_components pc
  JOIN products p ON pc.component_product_id = p.id
  WHERE pc.parent_product_id = oi.product_id
);
```

---

## 16. Glossary

**Base Product** - The first version (V01) of a product, referenced by later versions

**Component** - A product that can be part of another product

**Component Tree** - Hierarchical structure of product → components → sub-components

**Depth** - Level in component hierarchy (root=0, direct component=1, sub-component=2)

**Immutability** - Property of orders that prevents changes to historical data

**Junction Table** - product_components table linking products in many-to-many relationship

**Parent Product** - Product that contains other products as components

**SKU** - Stock Keeping Unit, unique 16-character product identifier

**Snapshot** - Frozen copy of product + component data at order creation time

**Sunset** - Status indicating product replaced by newer version, no longer purchasable

**Version** - Sequential number (1, 2, 3...) indicating product iteration

---

## 17. Quick Reference

### Key Tables

- `products` - Master catalog (both products and components)
- `product_components` - Many-to-many junction (self-referential)
- `orders` - Order headers
- `order_items` - Line items with JSONB snapshots

### Key Constraints

- Max hierarchy depth: 2 levels
- SKU format: `XXX-XXXX-XXX-VXX` (16 chars)
- Version range: V01 to V99
- No circular references
- No self-references

### Key Workflows

1. **Create Product** → Generate SKU → Insert products
2. **Add Component** → Validate → Insert product_components
3. **Update Product** → Check orders → Version or update
4. **Place Order** → Snapshot tree → Insert order_items

### Key Queries

```sql
-- Get product with components
SELECT * FROM products p
LEFT JOIN product_components pc ON p.id = pc.parent_product_id
WHERE p.id = ?

-- Get order with snapshots
SELECT * FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = ?

-- Find product versions
SELECT * FROM products
WHERE sku_product_code = ?
ORDER BY version
```

---

**End of Documentation**

**For questions or contributions, contact the development team.**

**Last Updated:** 2025-10-04
**Version:** 1.0
