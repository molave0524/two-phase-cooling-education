-- ============================================================================
-- Migration: Fix store.order_items Structure
-- Version: 0012
-- Date: 2025-10-19
-- Description: Align order_items table with production structure
-- ============================================================================
-- Removes obsolete variant fields and adds product snapshot fields

BEGIN;

-- Drop obsolete columns
ALTER TABLE store.order_items DROP COLUMN IF EXISTS variant_id;
ALTER TABLE store.order_items DROP COLUMN IF EXISTS variant_name;

-- Add missing product snapshot fields
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS product_slug text NOT NULL DEFAULT '';
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS product_version integer NOT NULL DEFAULT 1;
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'standalone';

-- Add component tree snapshot (JSONB)
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS component_tree jsonb NOT NULL DEFAULT '[]';

-- Add pricing breakdown fields
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS base_price real NOT NULL DEFAULT 0;
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS included_components_price real NOT NULL DEFAULT 0;
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS optional_components_price real NOT NULL DEFAULT 0;
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS line_total real NOT NULL DEFAULT 0;

-- Add optional FK for reporting (not enforced)
ALTER TABLE store.order_items ADD COLUMN IF NOT EXISTS current_product_id text;

-- Create index for component_tree JSONB queries
CREATE INDEX IF NOT EXISTS idx_order_items_component_tree ON store.order_items USING GIN (component_tree);

-- Create index for current_product_id
CREATE INDEX IF NOT EXISTS idx_order_items_current_product ON store.order_items(current_product_id);

COMMIT;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'store' AND table_name = 'order_items'
ORDER BY ordinal_position;
