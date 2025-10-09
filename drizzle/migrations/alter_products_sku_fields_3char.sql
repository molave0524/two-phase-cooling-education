-- ============================================================================
-- Migration: Truncate products and ALTER SKU fields to VARCHAR(3)
-- Date: 2025-10-08
-- Description: Enforce 3-character limit on all SKU component fields
-- ============================================================================

-- ============================================================================
-- STEP 1: Truncate products table (WARNING: Deletes all data!)
-- ============================================================================

-- This will cascade delete all product_components rows referencing products
TRUNCATE TABLE products CASCADE;

-- ============================================================================
-- STEP 2: ALTER columns to VARCHAR(3) with NOT NULL
-- ============================================================================

-- Change sku_prefix to VARCHAR(3) NOT NULL
ALTER TABLE products
ALTER COLUMN sku_prefix TYPE VARCHAR(3),
ALTER COLUMN sku_prefix SET NOT NULL;

-- Change sku_category to VARCHAR(3) NOT NULL
ALTER TABLE products
ALTER COLUMN sku_category TYPE VARCHAR(3),
ALTER COLUMN sku_category SET NOT NULL;

-- Change sku_product_code to VARCHAR(3) NOT NULL
ALTER TABLE products
ALTER COLUMN sku_product_code TYPE VARCHAR(3),
ALTER COLUMN sku_product_code SET NOT NULL;

-- Change sku_version to VARCHAR(3) NOT NULL
ALTER TABLE products
ALTER COLUMN sku_version TYPE VARCHAR(3),
ALTER COLUMN sku_version SET NOT NULL;

-- ============================================================================
-- STEP 3: Add CHECK constraints (exactly 3 chars, no spaces)
-- ============================================================================

-- Ensure sku_prefix is exactly 3 characters, no spaces
ALTER TABLE products
ADD CONSTRAINT sku_prefix_format CHECK (
  LENGTH(sku_prefix) = 3 AND
  sku_prefix NOT LIKE '% %'
);

-- Ensure sku_category is exactly 3 characters, no spaces
ALTER TABLE products
ADD CONSTRAINT sku_category_format CHECK (
  LENGTH(sku_category) = 3 AND
  sku_category NOT LIKE '% %'
);

-- Ensure sku_product_code is exactly 3 characters, no spaces
ALTER TABLE products
ADD CONSTRAINT sku_product_code_format CHECK (
  LENGTH(sku_product_code) = 3 AND
  sku_product_code NOT LIKE '% %'
);

-- Ensure sku_version is exactly 3 characters, no spaces
ALTER TABLE products
ADD CONSTRAINT sku_version_format CHECK (
  LENGTH(sku_version) = 3 AND
  sku_version NOT LIKE '% %'
);

-- ============================================================================
-- VERIFICATION QUERIES (Run manually if needed)
-- ============================================================================

/*
-- View all constraints on products table
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
ORDER BY conname;

-- Check column types
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('sku_prefix', 'sku_category', 'sku_product_code', 'sku_version');
*/
