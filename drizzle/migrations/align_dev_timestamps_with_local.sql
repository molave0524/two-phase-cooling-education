-- Migration: Align DEV timestamp columns with LOCAL schema
-- Changes all timestamp columns to timestamp(6) for microsecond precision
-- Generated: 2025-10-09

-- addresses table
ALTER TABLE addresses
  ALTER COLUMN created_at TYPE timestamp(6),
  ALTER COLUMN updated_at TYPE timestamp(6);

-- cart_items table
ALTER TABLE cart_items
  ALTER COLUMN created_at TYPE timestamp(6),
  ALTER COLUMN updated_at TYPE timestamp(6);

-- carts table
ALTER TABLE carts
  ALTER COLUMN created_at TYPE timestamp(6),
  ALTER COLUMN updated_at TYPE timestamp(6);

-- order_items table
ALTER TABLE order_items
  ALTER COLUMN created_at TYPE timestamp(6);

-- orders table
ALTER TABLE orders
  ALTER COLUMN estimated_delivery TYPE timestamp(6),
  ALTER COLUMN paid_at TYPE timestamp(6),
  ALTER COLUMN shipped_at TYPE timestamp(6),
  ALTER COLUMN delivered_at TYPE timestamp(6),
  ALTER COLUMN cancelled_at TYPE timestamp(6),
  ALTER COLUMN created_at TYPE timestamp(6),
  ALTER COLUMN updated_at TYPE timestamp(6);

-- product_components table
ALTER TABLE product_components
  ALTER COLUMN created_at TYPE timestamp(6),
  ALTER COLUMN updated_at TYPE timestamp(6);

-- products table
ALTER TABLE products
  ALTER COLUMN sunset_date TYPE timestamp(6),
  ALTER COLUMN discontinued_date TYPE timestamp(6),
  ALTER COLUMN created_at TYPE timestamp(6),
  ALTER COLUMN updated_at TYPE timestamp(6);

-- sessions table
ALTER TABLE sessions
  ALTER COLUMN expires TYPE timestamp(6);

-- users table
ALTER TABLE users
  ALTER COLUMN email_verified TYPE timestamp(6),
  ALTER COLUMN created_at TYPE timestamp(6),
  ALTER COLUMN updated_at TYPE timestamp(6),
  ALTER COLUMN email_verification_expires TYPE timestamp(6),
  ALTER COLUMN reset_password_expires TYPE timestamp(6);

-- verification_tokens table
ALTER TABLE verification_tokens
  ALTER COLUMN expires TYPE timestamp(6);

-- Verification queries
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('created_at', 'updated_at', 'expires', 'email_verified',
                      'estimated_delivery', 'paid_at', 'shipped_at', 'delivered_at',
                      'cancelled_at', 'sunset_date', 'discontinued_date',
                      'email_verification_expires', 'reset_password_expires')
ORDER BY table_name, ordinal_position;
