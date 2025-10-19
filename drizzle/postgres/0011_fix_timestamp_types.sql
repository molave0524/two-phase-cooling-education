-- ============================================================================
-- Migration: Fix Timestamp Types to Match Production
-- Version: 0011
-- Date: 2025-10-19
-- Description: Convert all timestamp columns to timestamptz (with timezone)
-- ============================================================================
-- Local was using 'timestamp without time zone', DEV uses 'timestamp with time zone'
-- This migration aligns all timestamp columns to use timestamptz

BEGIN;

-- ============================================================================
-- AUTH SCHEMA - Fix timestamp columns
-- ============================================================================

-- auth.users
ALTER TABLE auth.users
  ALTER COLUMN email_verified TYPE timestamptz USING email_verified AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
  ALTER COLUMN email_verification_expires TYPE timestamptz USING email_verification_expires AT TIME ZONE 'UTC',
  ALTER COLUMN reset_password_expires TYPE timestamptz USING reset_password_expires AT TIME ZONE 'UTC';

-- auth.sessions
ALTER TABLE auth.sessions
  ALTER COLUMN expires TYPE timestamptz USING expires AT TIME ZONE 'UTC';

-- auth.verification_tokens
ALTER TABLE auth.verification_tokens
  ALTER COLUMN expires TYPE timestamptz USING expires AT TIME ZONE 'UTC';

-- auth.addresses
ALTER TABLE auth.addresses
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- ============================================================================
-- CATALOG SCHEMA - Fix timestamp columns
-- ============================================================================

-- catalog.products
ALTER TABLE catalog.products
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
  ALTER COLUMN sunset_date TYPE timestamptz USING sunset_date AT TIME ZONE 'UTC',
  ALTER COLUMN discontinued_date TYPE timestamptz USING discontinued_date AT TIME ZONE 'UTC';

-- catalog.product_components (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'catalog' AND table_name = 'product_components') THEN
    ALTER TABLE catalog.product_components
      ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
  END IF;
END $$;

-- ============================================================================
-- STORE SCHEMA - Fix timestamp columns
-- ============================================================================

-- store.carts
ALTER TABLE store.carts
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- store.cart_items
ALTER TABLE store.cart_items
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- store.orders
ALTER TABLE store.orders
  ALTER COLUMN estimated_delivery TYPE timestamptz USING estimated_delivery AT TIME ZONE 'UTC',
  ALTER COLUMN paid_at TYPE timestamptz USING paid_at AT TIME ZONE 'UTC',
  ALTER COLUMN shipped_at TYPE timestamptz USING shipped_at AT TIME ZONE 'UTC',
  ALTER COLUMN delivered_at TYPE timestamptz USING delivered_at AT TIME ZONE 'UTC',
  ALTER COLUMN cancelled_at TYPE timestamptz USING cancelled_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- store.order_items
ALTER TABLE store.order_items
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

COMMIT;

-- Verify the changes
SELECT
  table_schema,
  table_name,
  column_name,
  data_type,
  datetime_precision
FROM information_schema.columns
WHERE table_schema IN ('auth', 'catalog', 'store')
  AND data_type LIKE '%timestamp%'
ORDER BY table_schema, table_name, ordinal_position;
