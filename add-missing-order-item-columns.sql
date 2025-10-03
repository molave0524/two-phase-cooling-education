-- Add missing columns to order_items table
-- The table already has: id, order_id, product_id, product_name, product_sku, quantity, price
-- Adding: product_image, variant_id, variant_name, created_at

BEGIN;

-- Add missing columns
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Verify migration
DO $$
DECLARE
  total_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM order_items;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Order Items Columns Added Successfully';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total order items: %', total_rows;
  RAISE NOTICE 'Added columns: product_image, variant_id, variant_name, created_at';
  RAISE NOTICE '==============================================';
END $$;

COMMIT;
