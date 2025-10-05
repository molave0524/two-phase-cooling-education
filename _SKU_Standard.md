# SKU Naming Convention Standard

**Format:** `{PREFIX}-{CATEGORY}-{PRODUCT_CODE}-{VERSION}`

**Total Length:** 16 characters (3-4-3-3 with hyphens)

---

## Format Specification

| Component | Length | Format | Example | Description |
|-----------|--------|--------|---------|-------------|
| **PREFIX** | 3 chars | `XXX` | `TPC` | Company/Brand identifier |
| **CATEGORY** | 4 chars | `XXXX` | `PUMP` | Product category (padded if needed) |
| **PRODUCT_CODE** | 3 chars | `XXX` | `A01` | Alphanumeric product identifier |
| **VERSION** | 3 chars | `VXX` | `V01` | Version number (01-99) |

### Complete Examples:
```
TPC-PUMP-A01-V01    (Pump A01, Version 01)
TPC-PUMP-A01-V02    (Pump A01, Version 02)
TPC-MOTR-M01-V01    (Motor M01, Version 01)
TPC-RADI-R02-V01    (Radiator R02, Version 01)
TPC-CLNT-PRO-V01    (Coolant System Pro, Version 01)
TPC-UPKG-RGB-V01    (RGB Upgrade Kit, Version 01)
```

---

## Category Codes (4 Characters)

### Systems
```
CLNT - Coolant/Cooling System
COMP - Complete System Package
```

### Major Components
```
PUMP - Pump
RADI - Radiator
RESV - Reservoir
FANS - Fan System
EXCH - Heat Exchanger
```

### Parts & Sub-Components
```
MOTR - Motor
IMPL - Impeller
TUBE - Tubing
FTNG - Fitting
BRKT - Bracket
SEAL - Seal/Gasket
VLVE - Valve
```

### Electronics & Accessories
```
RGBC - RGB Controller
SNSR - Sensor
MNTR - Monitor/Display
CBLE - Cable
CONN - Connector
```

### Kits & Bundles
```
UPKG - Upgrade Kit
RPLC - Replacement Kit
MNTN - Maintenance Kit
ACCS - Accessory Kit
```

### Fluids & Consumables
```
FLUD - Coolant Fluid
CLNR - Cleaner
ADTV - Additive
```

---

## Product Code Format (3 Characters)

### Alphanumeric: Letter + 2 Digits

**Format:** `[A-Z][0-9][0-9]`

**Examples:**
```
A01, A02, A03, ... A99  (Series A)
B01, B02, B03, ... B99  (Series B)
M01, M02, M03, ... M99  (Motor series)
R01, R02, R03, ... R99  (Radiator series)
```

**Special Codes:**
```
PRO - Pro/Premium model
CMP - Compact model
LTE - Lite/Budget model
STD - Standard model
ADV - Advanced model
MAX - Maximum/Top model
```

### Series Designation:
```
A-Series: Entry-level products (A01-A99)
B-Series: Mid-range products (B01-B99)
C-Series: Professional products (C01-C99)
M-Series: Motors (M01-M99)
R-Series: Radiators (R01-R99)
P-Series: Pumps (P01-P99)
```

---

## Version Format (3 Characters)

**Format:** `V[0-9][0-9]`

**Range:** V01 to V99

**Examples:**
```
V01 - Initial version
V02 - Second version (minor update)
V03 - Third version
...
V99 - 99th version (theoretical max)
```

**Versioning Rules:**
- Start at V01 (not V00)
- Increment sequentially: V01 → V02 → V03
- Zero-padded: V01, V09, V10
- Max version: V99 (if reached, create new product code)

---

## Database Schema

```typescript
export const products = pgTable('products', {
  id: text('id').primaryKey(),

  // Full SKU (16 chars)
  sku: text('sku').notNull().unique(), // 'TPC-PUMP-A01-V01'

  // SKU Components (for easy querying)
  skuPrefix: text('sku_prefix').notNull(),      // 'TPC' (3 chars)
  skuCategory: text('sku_category').notNull(),  // 'PUMP' (4 chars)
  skuProductCode: text('sku_product_code').notNull(), // 'A01' (3 chars)
  skuVersion: text('sku_version').notNull(),    // 'V01' (3 chars)

  // Human-readable
  name: text('name').notNull(),
  version: integer('version').notNull().default(1), // Numeric: 1, 2, 3

  // ...rest of fields
})
```

---

## Helper Functions

### Generate SKU

```typescript
function generateSKU(
  prefix: string,
  category: string,
  productCode: string,
  version: number
): string {
  // Validate lengths
  if (prefix.length !== 3) throw new Error('PREFIX must be 3 chars')
  if (category.length !== 4) throw new Error('CATEGORY must be 4 chars')
  if (productCode.length !== 3) throw new Error('PRODUCT_CODE must be 3 chars')
  if (version < 1 || version > 99) throw new Error('VERSION must be 01-99')

  // Format version with leading zero
  const versionStr = `V${version.toString().padStart(2, '0')}`

  return `${prefix}-${category}-${productCode}-${versionStr}`
}

// Examples:
generateSKU('TPC', 'PUMP', 'A01', 1)  // 'TPC-PUMP-A01-V01'
generateSKU('TPC', 'MOTR', 'M01', 2)  // 'TPC-MOTR-M01-V02'
generateSKU('TPC', 'RADI', 'R02', 15) // 'TPC-RADI-R02-V15'
```

### Parse SKU

```typescript
interface SKUComponents {
  prefix: string       // 'TPC'
  category: string     // 'PUMP'
  productCode: string  // 'A01'
  version: string      // 'V01'
  versionNumber: number // 1
}

function parseSKU(sku: string): SKUComponents {
  // Validate format: XXX-XXXX-XXX-VXX
  const regex = /^([A-Z]{3})-([A-Z]{4})-([A-Z0-9]{3})-V(\d{2})$/
  const match = sku.match(regex)

  if (!match) {
    throw new Error(`Invalid SKU format: ${sku}. Expected: XXX-XXXX-XXX-VXX`)
  }

  return {
    prefix: match[1],           // 'TPC'
    category: match[2],          // 'PUMP'
    productCode: match[3],       // 'A01'
    version: `V${match[4]}`,     // 'V01'
    versionNumber: parseInt(match[4], 10) // 1
  }
}

// Examples:
parseSKU('TPC-PUMP-A01-V01')
// {
//   prefix: 'TPC',
//   category: 'PUMP',
//   productCode: 'A01',
//   version: 'V01',
//   versionNumber: 1
// }
```

### Increment Version

```typescript
function incrementVersion(currentSKU: string): string {
  const parsed = parseSKU(currentSKU)
  const newVersion = parsed.versionNumber + 1

  if (newVersion > 99) {
    throw new Error('Version limit reached (V99). Create new product code.')
  }

  return generateSKU(
    parsed.prefix,
    parsed.category,
    parsed.productCode,
    newVersion
  )
}

// Examples:
incrementVersion('TPC-PUMP-A01-V01') // 'TPC-PUMP-A01-V02'
incrementVersion('TPC-PUMP-A01-V09') // 'TPC-PUMP-A01-V10'
incrementVersion('TPC-PUMP-A01-V99') // Error: Version limit reached
```

### Validate SKU

```typescript
function validateSKU(sku: string): boolean {
  const regex = /^[A-Z]{3}-[A-Z]{4}-[A-Z0-9]{3}-V\d{2}$/
  return regex.test(sku)
}

// Examples:
validateSKU('TPC-PUMP-A01-V01') // true
validateSKU('TPC-PMP-A01-V01')  // false (category not 4 chars)
validateSKU('TPC-PUMP-A1-V01')  // false (product code not 3 chars)
validateSKU('TPC-PUMP-A01-V1')  // false (version not 2 digits)
```

### Format Category Code

```typescript
function formatCategory(category: string): string {
  // Pad or truncate to 4 characters
  if (category.length > 4) {
    return category.substring(0, 4).toUpperCase()
  }
  return category.toUpperCase().padEnd(4, ' ').trim()
}

// Examples:
formatCategory('PUMP')      // 'PUMP'
formatCategory('RGB')       // 'RGB ' → 'RGB' (trimmed)
formatCategory('MOTOR')     // 'MOTR' (truncated)
formatCategory('PUMPS')     // 'PUMP' (truncated)
```

### Format Product Code

```typescript
function formatProductCode(code: string): string {
  // Ensure 3 characters, uppercase
  const formatted = code.toUpperCase().padStart(3, '0')

  if (formatted.length > 3) {
    throw new Error('Product code too long (max 3 chars)')
  }

  return formatted
}

// Examples:
formatProductCode('A1')   // 'A01' (padded)
formatProductCode('A01')  // 'A01'
formatProductCode('PRO')  // 'PRO'
formatProductCode('M5')   // 'M05' (padded)
```

---

## Example Product Catalog

### Cooling Systems
```
TPC-CLNT-PRO-V01    Two-Phase Cooling System Pro (Version 1)
TPC-CLNT-PRO-V02    Two-Phase Cooling System Pro (Version 2, price update)
TPC-CLNT-CMP-V01    Two-Phase Cooling System Compact (Version 1)
TPC-CLNT-MAX-V01    Two-Phase Cooling System Max (Version 1)
```

### Pumps
```
TPC-PUMP-A01-V01    Coolant Pump A01 (Entry-level, Version 1)
TPC-PUMP-A01-V02    Coolant Pump A01 (Version 2, improved motor)
TPC-PUMP-B01-V01    Coolant Pump B01 (Mid-range, Version 1)
TPC-PUMP-C01-V01    Coolant Pump C01 (Professional, Version 1)
```

### Motors
```
TPC-MOTR-M01-V01    Brushless Motor M01 (Version 1)
TPC-MOTR-M01-V02    Brushless Motor M01 (Version 2, efficiency upgrade)
TPC-MOTR-M02-V01    Brushless Motor M02 (Higher power, Version 1)
```

### Radiators
```
TPC-RADI-R01-V01    Aluminum Radiator R01 (240mm, Version 1)
TPC-RADI-R02-V01    Aluminum Radiator R02 (360mm, Version 1)
TPC-RADI-R03-V01    Copper Radiator R03 (240mm, Version 1)
```

### Parts
```
TPC-IMPL-I01-V01    Impeller I01 (Version 1)
TPC-IMPL-I02-V01    Impeller I02 (High-flow, Version 1)
TPC-FTNG-F01-V01    Quick-Release Fitting F01 (Version 1)
TPC-BRKT-B01-V01    Mounting Bracket B01 (Version 1)
TPC-SEAL-S01-V01    O-Ring Seal Set S01 (Version 1)
```

### Electronics
```
TPC-RGBC-RGB-V01    RGB Controller (Version 1)
TPC-SNSR-T01-V01    Temperature Sensor T01 (Version 1)
TPC-SNSR-F01-V01    Flow Sensor F01 (Version 1)
TPC-MNTR-LCD-V01    LCD Monitor Display (Version 1)
```

### Kits
```
TPC-UPKG-RGB-V01    RGB Upgrade Kit (Version 1)
TPC-RPLC-PMP-V01    Pump Replacement Kit (Version 1)
TPC-MNTN-QTR-V01    Quarterly Maintenance Kit (Version 1)
TPC-ACCS-STR-V01    Starter Accessory Kit (Version 1)
```

### Fluids
```
TPC-FLUD-STD-V01    Standard Coolant Fluid (1L, Version 1)
TPC-FLUD-PRO-V01    Professional Coolant Fluid (1L, Version 1)
TPC-CLNR-SYS-V01    System Cleaner (500ml, Version 1)
TPC-ADTV-COR-V01    Anti-Corrosion Additive (100ml, Version 1)
```

---

## Database Queries

### Find Product by SKU
```typescript
const product = await db
  .select()
  .from(products)
  .where(eq(products.sku, 'TPC-PUMP-A01-V01'))
  .limit(1)
```

### Find All Versions of Product
```typescript
const versions = await db
  .select()
  .from(products)
  .where(
    and(
      eq(products.skuPrefix, 'TPC'),
      eq(products.skuCategory, 'PUMP'),
      eq(products.skuProductCode, 'A01')
    )
  )
  .orderBy(products.version)

// Returns:
// [
//   { sku: 'TPC-PUMP-A01-V01', version: 1, status: 'sunset' },
//   { sku: 'TPC-PUMP-A01-V02', version: 2, status: 'active' }
// ]
```

### Find Latest Version
```typescript
const latest = await db
  .select()
  .from(products)
  .where(
    and(
      eq(products.skuPrefix, 'TPC'),
      eq(products.skuCategory, 'PUMP'),
      eq(products.skuProductCode, 'A01'),
      eq(products.status, 'active')
    )
  )
  .orderBy(desc(products.version))
  .limit(1)

// Returns: TPC-PUMP-A01-V02 (latest active)
```

### Search by Category
```typescript
const pumps = await db
  .select()
  .from(products)
  .where(
    and(
      eq(products.skuCategory, 'PUMP'),
      eq(products.status, 'active')
    )
  )
  .orderBy(products.skuProductCode)

// Returns all active pumps
```

---

## Migration to Standardized SKUs

### Update Existing Products
```sql
-- Add new columns
ALTER TABLE products
  ADD COLUMN sku_prefix VARCHAR(3) NOT NULL DEFAULT 'TPC',
  ADD COLUMN sku_category VARCHAR(4) NOT NULL,
  ADD COLUMN sku_product_code VARCHAR(3) NOT NULL,
  ADD COLUMN sku_version VARCHAR(3) NOT NULL;

-- Create indexes
CREATE INDEX idx_products_sku_components
  ON products(sku_prefix, sku_category, sku_product_code);

-- Update existing records
UPDATE products
SET
  sku_prefix = 'TPC',
  sku_category = CASE
    WHEN product_type = 'system' THEN 'CLNT'
    WHEN product_type = 'pump' THEN 'PUMP'
    WHEN product_type = 'motor' THEN 'MOTR'
    -- ... map other types
  END,
  sku_product_code = LPAD(SUBSTRING(id FROM '\d+'), 3, '0'),
  sku_version = CONCAT('V', LPAD(version::text, 2, '0'));

-- Regenerate full SKU
UPDATE products
SET sku = CONCAT(sku_prefix, '-', sku_category, '-', sku_product_code, '-', sku_version);
```

---

## Validation Rules

### SKU Format Validation
```typescript
const SKU_REGEX = /^[A-Z]{3}-[A-Z]{4}-[A-Z0-9]{3}-V\d{2}$/

function isValidSKU(sku: string): boolean {
  if (!SKU_REGEX.test(sku)) return false

  const parsed = parseSKU(sku)

  // Validate components
  if (parsed.prefix.length !== 3) return false
  if (parsed.category.length !== 4) return false
  if (parsed.productCode.length !== 3) return false
  if (parsed.versionNumber < 1 || parsed.versionNumber > 99) return false

  return true
}
```

### Uniqueness Check
```typescript
async function ensureUniqueSKU(sku: string): Promise<void> {
  const exists = await db
    .select()
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1)

  if (exists.length > 0) {
    throw new Error(`SKU already exists: ${sku}`)
  }
}
```

---

## Display Guidelines

### Product Labels
```typescript
// Full display
`${product.name} (${product.sku})`
// "Coolant Pump A01 (TPC-PUMP-A01-V01)"

// Short display
`${product.name} v${product.version}`
// "Coolant Pump A01 v1"

// SKU only
product.sku
// "TPC-PUMP-A01-V01"
```

### Order History
```typescript
// Show exact SKU from order
`Product: ${orderItem.productName}`
`SKU: ${orderItem.productSku}`  // TPC-PUMP-A01-V01 (frozen)
`Ordered: ${orderItem.createdAt}`

// With component tree
orderItem.componentTree.forEach(comp => {
  console.log(`  - ${comp.componentName} (${comp.componentSku})`)
  // "  - Brushless Motor M01 (TPC-MOTR-M01-V01)"
})
```

---

## Summary

**Standardized SKU Format:**
- **Length:** 16 characters (fixed)
- **Pattern:** `XXX-XXXX-XXX-VXX`
- **Example:** `TPC-PUMP-A01-V01`

**Components:**
- PREFIX: 3 chars (e.g., `TPC`)
- CATEGORY: 4 chars (e.g., `PUMP`)
- PRODUCT_CODE: 3 chars (e.g., `A01`)
- VERSION: 3 chars (e.g., `V01`)

**Benefits:**
✅ Fixed-length, predictable format
✅ Easy validation and parsing
✅ Queryable by components
✅ Version tracking (V01-V99)
✅ Clear product lineage
✅ Database-friendly

**Ready to implement?** 🎯
