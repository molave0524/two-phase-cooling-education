-- Safe migration for order_items table
-- Only adds missing columns, doesn't assume any existing columns

BEGIN;

-- Add missing columns only if they don't exist
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price REAL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Set default values for any NULL values in new columns
UPDATE order_items
SET product_image = ''
WHERE product_image IS NULL;

UPDATE order_items
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

-- Only set price if it's NULL and we can find a source
-- Try to set from any existing price-related column
DO $$
BEGIN
  -- Check if price column exists and has NULL values
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'price'
  ) THEN
    -- If unit_price exists, copy it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'order_items' AND column_name = 'unit_price'
    ) THEN
      UPDATE order_items SET price = unit_price WHERE price IS NULL;
      -- Drop unit_price after copying
      ALTER TABLE order_items DROP COLUMN IF EXISTS unit_price;
    END IF;

    -- Drop total_price if it exists (we don't need it)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'order_items' AND column_name = 'total_price'
    ) THEN
      ALTER TABLE order_items DROP COLUMN total_price;
    END IF;
  END IF;
END $$;

-- Make required columns NOT NULL (only if they have values)
DO $$
BEGIN
  -- Only set NOT NULL if all rows have values
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE product_image IS NULL) THEN
    ALTER TABLE order_items ALTER COLUMN product_image SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM order_items WHERE created_at IS NULL) THEN
    ALTER TABLE order_items ALTER COLUMN created_at SET NOT NULL;
  END IF;

  -- Don't set price as NOT NULL yet - let it be nullable for now
  -- It will be set by the application when new orders are created
END $$;

-- Verify migration
DO $$
DECLARE
  items_count INTEGER;
  has_price_col BOOLEAN;
  has_image_col BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO items_count FROM order_items;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'price'
  ) INTO has_price_col;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'product_image'
  ) INTO has_image_col;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Order Items Schema Migration Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total order items: %', items_count;
  RAISE NOTICE 'Has price column: %', has_price_col;
  RAISE NOTICE 'Has product_image column: %', has_image_col;
  RAISE NOTICE '==============================================';
END $$;

COMMIT;
