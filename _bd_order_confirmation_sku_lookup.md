# Order Confirmation & SKU-Based Product Lookup

**Version:** 1.0
**Last Updated:** 2025-10-04
**Related Documentation:** `_bd_catalog_order_design_v1.md`

---

## Overview

This document describes the implementation of SKU-based product lookups for order confirmation pages, ensuring customers can always view the exact product version they purchased, even if that version has been sunsetted or replaced.

---

## 1. Core Principle

**Order confirmation pages must link to the exact product version purchased using SKU, not slug.**

### Why SKU-Based Links?

✅ **Historical Accuracy** - Customers see the exact version they ordered
✅ **Product Evolution** - Products can be updated without breaking old links
✅ **Graceful Degradation** - Sunsetted products remain viewable but not purchasable
✅ **Data Integrity** - SKU-based lookup works even if slugs change
✅ **Order Immutability** - Order links always resolve to correct product version

---

## 2. Database Schema

### Order Items Table Update

```sql
ALTER TABLE order_items
  ADD COLUMN product_slug TEXT NOT NULL DEFAULT '';
```

**Purpose:** Store product slug alongside SKU for complete product snapshot

**Migration Script:** `scripts/add-product-slug-to-order-items.ts`

```sql
-- Update existing records
UPDATE order_items
SET product_slug = LOWER(REPLACE(product_id, '_', '-'))
WHERE product_slug = '';
```

### Order Item Snapshot Interface

```typescript
export interface OrderItemSnapshot {
  productId: string
  productSku: string
  productSlug: string        // NEW: Slug captured at checkout
  productName: string
  productVersion: number
  productType: string
  productImage: string
  componentTree: ComponentSnapshot[]

  quantity: number
  basePrice: number
  includedComponentsPrice: number
  optionalComponentsPrice: number
  price: number
  lineTotal: number

  currentProductId: string
}
```

---

## 3. Implementation

### 3.1 Order Confirmation Page

**File:** `src/app/order-confirmation/page.tsx`

**Link Structure:**
```typescript
// Product image link
<Link href={`/products/sku/${item.sku}`}>
  <Image
    src={item.image || '/images/placeholder-product.jpg'}
    alt={item.name}
    width={64}
    height={64}
    className='hover:opacity-80 transition-opacity cursor-pointer'
  />
</Link>

// Product title link
<Link href={`/products/sku/${item.sku}`}>
  <h4 className='hover:text-primary-600 transition-colors cursor-pointer'>
    {item.name}
  </h4>
</Link>
```

**Example:**
- Order contains: `TPC-COOL-BDG-V01` (Budget Cooling System, Version 1)
- Link goes to: `/products/sku/TPC-COOL-BDG-V01`
- Product may now be at V02, but customer sees V01 details

### 3.2 SKU Product Page

**File:** `src/app/products/sku/[sku]/page.tsx`

**Purpose:** Display product details for a specific SKU version

**Key Features:**

1. **Product Always Exists**
   Products referenced in orders cannot be deleted, only sunsetted

2. **Sunset Warning Banner**
   Shows if product is no longer available for purchase

3. **Conditional Add to Cart**
   Disabled if product is sunsetted or out of stock

4. **Full Product Details**
   Shows specifications, images, features from the ordered version

**Implementation:**

```typescript
'use client'

export default function ProductBySKUPage() {
  const params = useParams()
  const sku = params.sku as string

  const [product, setProduct] = useState<TwoPhaseCoolingProduct | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      const response = await fetch(`/api/products/by-sku/${sku}`)
      const result = await response.json()

      if (result.success && result.data) {
        setProduct(result.data)
      }
    }
    fetchProduct()
  }, [sku])

  // Check if product is available for purchase
  const isAvailableForPurchase =
    product.isAvailableForPurchase &&
    product.inStock &&
    product.status === 'active'

  return (
    <div>
      {/* Sunset Warning Banner */}
      {!isAvailableForPurchase && (
        <div className='mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg'>
          <div className='flex items-center gap-2'>
            <WarningIcon className='w-5 h-5 text-warning-600' />
            <p className='text-warning-800 font-medium'>
              This product version is no longer available for purchase.
              You previously ordered this item.
            </p>
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className='bg-white rounded-lg shadow-sm p-8'>
        <h1>{product.name}</h1>
        <p>SKU: {product.sku}</p>
        <div className='text-4xl font-bold'>${product.price.toFixed(2)}</div>

        {/* Add to Cart - Disabled if sunsetted */}
        <button
          onClick={handleAddToCart}
          disabled={!isAvailableForPurchase}
          className={
            isAvailableForPurchase
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
          }
        >
          {isAvailableForPurchase ? 'Add to Cart' : 'No Longer Available'}
        </button>
      </div>
    </div>
  )
}
```

### 3.3 API Endpoint

**File:** `src/app/api/products/by-sku/[sku]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema-pg'
import { eq } from 'drizzle-orm'
import { apiSuccess, apiNotFound } from '@/lib/api-response'
import { convertDbProductToType } from '@/lib/product-converter'

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  const { sku } = params

  // Look up product by SKU
  const product = await db.query.products.findFirst({
    where: eq(products.sku, sku),
  })

  if (!product) {
    return apiNotFound('Product')
  }

  // Convert to TwoPhaseCoolingProduct format
  const convertedProduct = convertDbProductToType(product)

  return apiSuccess(convertedProduct)
}
```

### 3.4 Snapshot Service Updates

**File:** `src/services/order-snapshot.ts`

```typescript
export interface OrderItemSnapshot {
  productId: string
  productSku: string
  productSlug: string        // Added
  productName: string
  productVersion: number
  productType: string
  productImage: string
  // ...
}

export async function createOrderItemSnapshot(
  productId: string,
  quantity: number
): Promise<OrderItemSnapshot> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId)
  })

  return {
    productId: product.id,
    productSku: product.sku,
    productSlug: product.slug,   // Capture slug
    productName: product.name,
    productVersion: product.version,
    productType: product.productType,
    productImage: images?.[0] || '',
    componentTree,
    // ... pricing fields
  }
}
```

**File:** `src/lib/orders.ts`

```typescript
function dbOrderToOrder(
  dbOrder: typeof ordersTable.$inferSelect,
  dbOrderItems: Array<typeof orderItemsTable.$inferSelect>
): Order {
  const orderItems: OrderItem[] = dbOrderItems.map(item => ({
    id: item.id.toString(),
    productId: item.productId,
    product: {
      id: item.productId,
      name: item.productName,
      slug: item.productSlug || item.productId.toLowerCase().replace(/\s+/g, '-'),
      sku: item.productSku,
      // ...
    },
    // ...
  }))

  // ...
}
```

---

## 4. User Experience Flows

### Scenario 1: Product Still Active

**Flow:**
1. Customer views order confirmation
2. Clicks product image or title
3. Navigates to: `/products/sku/TPC-COOL-BDG-V01`
4. Sees full product page
5. "Add to Cart" button is enabled
6. Can purchase the same version again

**Result:** ✅ Customer can reorder exact version

---

### Scenario 2: Product Sunsetted

**Flow:**
1. Customer views order confirmation for old order
2. Clicks product link
3. Navigates to: `/products/sku/TPC-COOL-BDG-V01`
4. Sees warning banner: "This product version is no longer available for purchase"
5. "Add to Cart" button is disabled and shows "No Longer Available"
6. Can still view all specifications, images, and features

**Result:** ✅ Customer can review what they ordered but cannot repurchase

---

### Scenario 3: Product Updated to New Version

**Flow:**
1. Customer ordered V01 six months ago
2. Product now at V02 (price changed, specs updated)
3. Clicks product link from order confirmation
4. Navigates to: `/products/sku/TPC-COOL-BDG-V01`
5. Sees V01 details (exactly what they ordered)
6. V01 shows as sunsetted with warning banner
7. Main product listing page shows V02 as current version

**Result:** ✅ Customer sees historical version, can discover new version via catalog

---

## 5. Key Files

### Created Files

1. **src/app/products/sku/[sku]/page.tsx**
   SKU-based product page with sunset warning

2. **src/app/api/products/by-sku/[sku]/route.ts**
   API endpoint for SKU lookup

3. **scripts/add-product-slug-to-order-items.ts**
   Migration script to add product_slug column

### Modified Files

1. **src/db/schema-pg.ts**
   Added `productSlug` column to `order_items` table

2. **src/services/order-snapshot.ts**
   Added `productSlug` to snapshot interface and creation

3. **src/lib/orders.ts**
   Updated `dbOrderToOrder` to use `productSlug` from database

4. **src/app/order-confirmation/page.tsx**
   Updated product links to use `/products/sku/{sku}` format

---

## 6. Testing Scenarios

### Test 1: View Active Product from Order

```typescript
test('should show active product with enabled Add to Cart', async () => {
  // 1. Create order with product V01
  const order = await createOrder({ /* product V01 */ })

  // 2. Navigate to SKU page
  const response = await fetch(`/api/products/by-sku/TPC-COOL-BDG-V01`)
  const product = await response.json()

  // 3. Verify
  expect(product.data.sku).toBe('TPC-COOL-BDG-V01')
  expect(product.data.isAvailableForPurchase).toBe(true)
  expect(product.data.status).toBe('active')
})
```

### Test 2: View Sunsetted Product from Order

```typescript
test('should show sunsetted product with disabled Add to Cart', async () => {
  // 1. Create order with product V01
  const order = await createOrder({ /* product V01 */ })

  // 2. Sunset product (create V02)
  await updateProduct(productId, { price: 999 }) // Creates V02, sunsets V01

  // 3. Navigate to V01 SKU page
  const response = await fetch(`/api/products/by-sku/TPC-COOL-BDG-V01`)
  const product = await response.json()

  // 4. Verify
  expect(product.data.sku).toBe('TPC-COOL-BDG-V01')
  expect(product.data.status).toBe('sunset')
  expect(product.data.isAvailableForPurchase).toBe(false)
})
```

### Test 3: Order Confirmation Links

```typescript
test('should link to correct SKU from order confirmation', async () => {
  const order = await createOrder({ /* product V01 */ })
  const orderDetails = await getOrderDetails(order.orderNumber)

  // Order item should have SKU for linking
  expect(orderDetails.items[0].product.sku).toBe('TPC-COOL-BDG-V01')

  // Link structure
  const expectedLink = `/products/sku/TPC-COOL-BDG-V01`
  expect(expectedLink).toMatch(/^\/products\/sku\/[A-Z]{3}-[A-Z]{4}-[A-Z0-9]{3}-V\d{2}$/)
})
```

---

## 7. Troubleshooting

### Issue: 404 on SKU Product Page

**Symptom:** `/products/sku/TPC-COOL-BDG-V01` returns 404

**Diagnosis:**
```typescript
// Check if product exists in database
const product = await db.query.products.findFirst({
  where: eq(products.sku, 'TPC-COOL-BDG-V01')
})

console.log('Product found:', product)
// If null, product was deleted (shouldn't happen if in orders)
```

**Solution:**
- Products in orders should never be deleted
- Check product status: should be 'sunset' or 'discontinued', not deleted
- Restore product from order snapshot if necessary

---

### Issue: Wrong Product Version Displayed

**Symptom:** Order confirmation shows V02 when customer ordered V01

**Diagnosis:**
```typescript
// Check order item snapshot
const orderItem = await db
  .select()
  .from(orderItems)
  .where(eq(orderItems.id, itemId))

console.log('Captured SKU:', orderItem.productSku)
console.log('Captured slug:', orderItem.productSlug)
```

**Solution:**
- Verify snapshot was created correctly at checkout
- Check `productSku` field in order_items table
- Ensure links use `item.sku` not `item.product.slug`

---

### Issue: Add to Cart Enabled for Sunsetted Product

**Symptom:** Can add sunsetted product to cart from SKU page

**Diagnosis:**
```typescript
const isAvailableForPurchase =
  product.isAvailableForPurchase &&
  product.inStock &&
  product.status === 'active'

console.log('Available:', product.isAvailableForPurchase)
console.log('In Stock:', product.inStock)
console.log('Status:', product.status)
```

**Solution:**
- Verify all three conditions are checked
- Ensure product status was updated to 'sunset' when versioned
- Check `isAvailableForPurchase` flag was set to false

---

## 8. Migration Guide

### Step 1: Add Column to Database

```sql
-- Run migration
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_slug TEXT NOT NULL DEFAULT '';
```

### Step 2: Backfill Existing Records

```typescript
// Run migration script
npx tsx scripts/add-product-slug-to-order-items.ts
```

**Script:** Updates existing order items with slugs derived from product_id

```typescript
await sql`
  UPDATE order_items
  SET product_slug = LOWER(REPLACE(product_id, '_', '-'))
  WHERE product_slug = ''
`
```

### Step 3: Update Code

1. Update snapshot service to capture slug
2. Update order conversion to use slug from database
3. Update order confirmation page to use SKU links
4. Create SKU product page
5. Create API endpoint for SKU lookup

### Step 4: Test

1. Create new order → verify slug captured
2. View order confirmation → verify links use `/products/sku/{sku}`
3. Click product link → verify correct product loads
4. Sunset product → verify warning shows and Add to Cart disabled

---

## 9. Summary

### What Was Implemented

✅ Product slug storage in order items
✅ SKU-based product lookup page
✅ API endpoint for SKU queries
✅ Sunset warning banner
✅ Conditional Add to Cart button
✅ Order confirmation SKU links
✅ Database migration script

### Benefits Delivered

✅ Customers always see exact version ordered
✅ Products can evolve without breaking history
✅ Sunsetted products remain viewable
✅ Clear communication about product availability
✅ Maintains order immutability principle

---

**End of Documentation**

**For integration with main design doc, see:** `_bd_catalog_order_design_v1.md` Section 18

**Last Updated:** 2025-10-04
**Version:** 1.0
