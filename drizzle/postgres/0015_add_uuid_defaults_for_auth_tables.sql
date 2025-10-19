-- ============================================================================
-- Migration: Add UUID Defaults for Auth Tables
-- Version: 0015
-- Date: 2025-10-19
-- Description: Add gen_random_uuid() defaults to auth tables for Drizzle adapter
-- ============================================================================
-- The Drizzle adapter needs database-level defaults for TEXT id columns
-- Using PostgreSQL's gen_random_uuid() to generate UUIDs

BEGIN;

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ADD UUID DEFAULTS TO AUTH TABLES
-- ============================================================================

-- auth.users.id - Default to UUID for non-OAuth users
ALTER TABLE auth.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- auth.accounts.id - Default to UUID
ALTER TABLE auth.accounts
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- auth.sessions.id - Default to UUID
ALTER TABLE auth.sessions
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

COMMIT;

-- Verify defaults were set
SELECT
  column_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'auth'
AND table_name IN ('users', 'accounts', 'sessions')
AND column_name = 'id'
ORDER BY table_name;
