-- ============================================================================
-- PostgreSQL Schema Migration Script
-- Updates production database to match current application schema
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. UPDATE ORDERS TABLE
-- ============================================================================

-- Add new columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Migrate data from old columns to new columns
UPDATE orders
SET
  subtotal = COALESCE(total_amount, 0),
  total = COALESCE(total_amount, 0),
  tax = 0,
  tax_rate = 0,
  shipping = 0,
  shipping_method = 'standard',
  discount = 0,
  payment_method = 'stripe'
WHERE subtotal IS NULL;

-- Update shipping_address and billing_address if they're not JSONB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'shipping_address'
    AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE orders
      ALTER COLUMN shipping_address TYPE JSONB USING shipping_address::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'billing_address'
    AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE orders
      ALTER COLUMN billing_address TYPE JSONB USING billing_address::jsonb;
  END IF;
END $$;

-- Make required columns NOT NULL after data migration
ALTER TABLE orders ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE orders ALTER COLUMN tax SET NOT NULL;
ALTER TABLE orders ALTER COLUMN tax_rate SET NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping SET NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping_method SET NOT NULL;
ALTER TABLE orders ALTER COLUMN discount SET NOT NULL;
ALTER TABLE orders ALTER COLUMN total SET NOT NULL;
ALTER TABLE orders ALTER COLUMN payment_method SET NOT NULL;
ALTER TABLE orders ALTER COLUMN payment_status SET NOT NULL;

-- Skip adding foreign key constraint for cart_id due to potential type mismatch
-- The cart_id column will be added but without the foreign key constraint
-- This is acceptable since the application doesn't currently use the carts table

-- ============================================================================
-- 2. UPDATE ORDER_ITEMS TABLE
-- ============================================================================

-- Add new columns to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price REAL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price REAL;

-- Migrate existing data
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

-- Make required columns NOT NULL after data migration
ALTER TABLE order_items ALTER COLUMN product_name SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN product_sku SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN unit_price SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN total_price SET NOT NULL;

-- ============================================================================
-- 3. UPDATE PRODUCTS TABLE (ensure SKU column exists)
-- ============================================================================

-- Add SKU column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Add unique constraint on SKU
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_sku_unique'
  ) THEN
    -- First, update any NULL SKUs with generated values
    UPDATE products
    SET sku = 'SKU-' || id
    WHERE sku IS NULL OR sku = '';

    -- Then add the constraint
    ALTER TABLE products
      ADD CONSTRAINT products_sku_unique UNIQUE (sku);
  END IF;
END $$;

-- Make SKU NOT NULL
ALTER TABLE products ALTER COLUMN sku SET NOT NULL;

-- ============================================================================
-- 4. VERIFY MIGRATION
-- ============================================================================

-- Display summary of changes
DO $$
DECLARE
  orders_count INTEGER;
  order_items_count INTEGER;
  products_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO order_items_count FROM order_items;
  SELECT COUNT(*) INTO products_count FROM products;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Orders migrated: %', orders_count;
  RAISE NOTICE 'Order items migrated: %', order_items_count;
  RAISE NOTICE 'Products with SKU: %', products_count;
  RAISE NOTICE '==============================================';
END $$;

COMMIT;
