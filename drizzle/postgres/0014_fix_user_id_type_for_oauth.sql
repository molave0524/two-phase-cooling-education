-- ============================================================================
-- Migration: Fix User ID Type for OAuth Compatibility
-- Version: 0014
-- Date: 2025-10-19
-- Description: Convert user_id from INTEGER to TEXT to support OAuth provider IDs
-- ============================================================================
-- OAuth providers (Google, GitHub, etc.) use large numeric IDs that exceed
-- PostgreSQL INTEGER max value (2,147,483,647). Example:
-- Google user ID: 104280421602389782112
-- This causes: "value '104280421602389782112' is out of range for type integer"
--
-- Solution: Change user_id from INTEGER to TEXT across all tables

BEGIN;

-- ============================================================================
-- STEP 1: Drop all foreign key constraints that reference users.id
-- ============================================================================

ALTER TABLE auth.accounts DROP CONSTRAINT IF EXISTS accounts_user_id_users_id_fk;
ALTER TABLE auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_users_id_fk;
ALTER TABLE auth.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_users_id_fk;
ALTER TABLE store.carts DROP CONSTRAINT IF EXISTS carts_user_id_users_id_fk;
ALTER TABLE store.orders DROP CONSTRAINT IF EXISTS orders_user_id_users_id_fk;

-- ============================================================================
-- STEP 2: Convert auth.users.id from INTEGER to TEXT
-- ============================================================================

-- Convert existing IDs to text (for any test data)
ALTER TABLE auth.users
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT USING id::text;

-- Drop the sequence since we're not using auto-increment anymore
DROP SEQUENCE IF EXISTS auth.users_id_seq;

-- ============================================================================
-- STEP 3: Convert all user_id foreign key columns to TEXT
-- ============================================================================

-- auth.accounts.user_id
ALTER TABLE auth.accounts
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- auth.sessions.user_id
ALTER TABLE auth.sessions
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- auth.addresses.user_id
ALTER TABLE auth.addresses
  ALTER COLUMN user_id DROP DEFAULT,
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- store.carts.user_id
ALTER TABLE store.carts
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- store.orders.user_id
ALTER TABLE store.orders
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- ============================================================================
-- STEP 4: Recreate foreign key constraints
-- ============================================================================

ALTER TABLE auth.accounts
  ADD CONSTRAINT accounts_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE auth.sessions
  ADD CONSTRAINT sessions_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE auth.addresses
  ADD CONSTRAINT addresses_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE store.carts
  ADD CONSTRAINT carts_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE store.orders
  ADD CONSTRAINT orders_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;

-- Verify the changes
SELECT
  'auth.users.id type: ' || data_type as check1
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id';

SELECT
  'Foreign keys recreated: ' || COUNT(*) as check2
FROM information_schema.table_constraints
WHERE constraint_schema IN ('auth', 'store')
AND constraint_type = 'FOREIGN KEY'
AND constraint_name LIKE '%user_id%';
