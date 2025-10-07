-- ============================================================================
-- Migration: Remove cart_id from orders table
-- Version: 0006
-- Date: 2025-10-06
-- Description: Remove cart_id column from orders table (not in schema definition)
-- ============================================================================

BEGIN;

-- Remove cart_id column from orders table if it exists
ALTER TABLE orders
DROP COLUMN IF EXISTS cart_id;

COMMIT;
