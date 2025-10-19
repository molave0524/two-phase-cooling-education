-- ============================================================================
-- Migration: Fix store.orders.user_id Type for OAuth Compatibility
-- Version: 0016
-- Date: 2025-10-19
-- Description: Change store.orders.user_id from INTEGER to TEXT to support OAuth provider IDs
-- ============================================================================
-- OAuth providers use large string IDs that exceed INTEGER range
-- This migration aligns the foreign key with auth.users.id (TEXT)

BEGIN;

-- ============================================================================
-- UPDATE store.orders.user_id TO TEXT
-- ============================================================================

-- Step 1: Drop existing foreign key constraint
ALTER TABLE store.orders
  DROP CONSTRAINT IF EXISTS orders_user_id_users_id_fk;

-- Step 2: Change column type from INTEGER to TEXT
-- Use USING clause to convert existing INTEGER values to TEXT
ALTER TABLE store.orders
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 3: Re-add foreign key constraint
ALTER TABLE store.orders
  ADD CONSTRAINT orders_user_id_users_id_fk
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

COMMIT;

-- Verify the change
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'store'
AND table_name = 'orders'
AND column_name = 'user_id';
