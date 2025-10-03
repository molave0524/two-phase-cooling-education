-- Fix order_items table - rename unit_price/total_price to price
-- This migration aligns PostgreSQL schema with SQLite and application code

BEGIN;

-- Add price column if it doesn't exist
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price REAL;

-- Copy unit_price data to price column
UPDATE order_items
SET price = unit_price
WHERE price IS NULL AND unit_price IS NOT NULL;

-- Make price NOT NULL
ALTER TABLE order_items ALTER COLUMN price SET NOT NULL;

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
  RAISE NOTICE 'Order Items Price Column Migration Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Order items with price: %', items_count;
  RAISE NOTICE '==============================================';
END $$;

COMMIT;
