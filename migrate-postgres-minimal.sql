-- ============================================================================
-- Minimal PostgreSQL Schema Migration Script
-- Only adds essential columns needed for checkout functionality
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD ESSENTIAL COLUMNS TO ORDERS TABLE
-- ============================================================================

-- Add core order fields (skip if they already exist)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- ============================================================================
-- 2. MIGRATE DATA FROM OLD TO NEW COLUMNS
-- ============================================================================

-- Only update rows where new columns are NULL
UPDATE orders
SET
  subtotal = COALESCE(total_amount, 0),
  total = COALESCE(total_amount, 0),
  tax = 0,
  tax_rate = 0,
  shipping = 0,
  shipping_method = 'standard',
  discount = 0,
  payment_method = 'stripe',
  payment_status = COALESCE(payment_status, 'pending')
WHERE subtotal IS NULL;

-- ============================================================================
-- 3. ADD ESSENTIAL COLUMNS TO ORDER_ITEMS TABLE
-- ============================================================================

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price REAL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price REAL;

-- Migrate existing order_items data
UPDATE order_items
SET
  product_name = COALESCE(
    (SELECT name FROM products WHERE products.id = order_items.product_id),
    'Unknown Product'
  ),
  product_sku = COALESCE(
    (SELECT sku FROM products WHERE products.id = order_items.product_id),
    'UNKNOWN'
  ),
  unit_price = COALESCE(price, 0),
  total_price = COALESCE(price * quantity, 0)
WHERE product_name IS NULL;

-- ============================================================================
-- 4. ENSURE PRODUCTS HAVE SKU COLUMN
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Update any NULL SKUs with generated values
UPDATE products
SET sku = 'SKU-' || id
WHERE sku IS NULL OR sku = '';

COMMIT;

-- Show summary
SELECT
  'Migration completed!' as status,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM order_items) as total_order_items,
  (SELECT COUNT(*) FROM products) as total_products;
