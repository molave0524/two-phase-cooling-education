-- Fix order_items table - align with application code expectations
-- This migration aligns PostgreSQL schema with SQLite and application code

BEGIN;

-- Add missing columns
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price REAL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Copy unit_price data to price column
UPDATE order_items
SET price = unit_price
WHERE price IS NULL AND unit_price IS NOT NULL;

-- Set default values for new columns where needed
UPDATE order_items
SET product_image = ''
WHERE product_image IS NULL;

-- Make required columns NOT NULL
ALTER TABLE order_items ALTER COLUMN price SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN product_image SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN created_at SET NOT NULL;

-- Drop old columns (only if price column is successfully populated)
ALTER TABLE order_items DROP COLUMN IF EXISTS unit_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS total_price;

-- Verify migration
DO $$
DECLARE
  items_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO items_count FROM order_items WHERE price IS NOT NULL;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Order Items Schema Migration Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Order items migrated: %', items_count;
  RAISE NOTICE 'Columns added: product_image, variant_id, variant_name, price, created_at';
  RAISE NOTICE 'Columns removed: unit_price, total_price';
  RAISE NOTICE '==============================================';
END $$;

COMMIT;
