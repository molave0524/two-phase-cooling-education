-- Migration: Schema Separation
-- Organize tables into auth, catalog, and store schemas

-- ============================================================================
-- STEP 1: Create new schemas
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS store;

-- ============================================================================
-- STEP 2: Move Auth Domain tables to auth schema
-- ============================================================================

-- Move users table
ALTER TABLE IF EXISTS public.users SET SCHEMA auth;

-- Move accounts table
ALTER TABLE IF EXISTS public.accounts SET SCHEMA auth;

-- Move sessions table
ALTER TABLE IF EXISTS public.sessions SET SCHEMA auth;

-- Move verification_tokens table
ALTER TABLE IF EXISTS public.verification_tokens SET SCHEMA auth;

-- Move addresses table (if exists)
ALTER TABLE IF EXISTS public.addresses SET SCHEMA auth;

-- ============================================================================
-- STEP 3: Move Catalog Domain tables to catalog schema
-- ============================================================================

-- Move products table
ALTER TABLE IF EXISTS public.products SET SCHEMA catalog;

-- Move product_components table (if exists)
ALTER TABLE IF EXISTS public.product_components SET SCHEMA catalog;

-- ============================================================================
-- STEP 4: Move Store Domain tables to store schema
-- ============================================================================

-- Move carts table
ALTER TABLE IF EXISTS public.carts SET SCHEMA store;

-- Move cart_items table
ALTER TABLE IF EXISTS public.cart_items SET SCHEMA store;

-- Move orders table
ALTER TABLE IF EXISTS public.orders SET SCHEMA store;

-- Move order_items table
ALTER TABLE IF EXISTS public.order_items SET SCHEMA store;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- Foreign key constraints are automatically updated when tables move schemas
-- All existing data is preserved
-- Queries using qualified names (public.table_name) will need to be updated
-- Unqualified queries will work if search_path includes the new schemas
