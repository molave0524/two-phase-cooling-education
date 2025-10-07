-- ============================================================================
-- Migration: Remove created_at from sessions table
-- Version: 0007
-- Date: 2025-10-06
-- Description: Remove created_at column from sessions table (not in schema definition)
-- ============================================================================

BEGIN;

-- Remove created_at column from sessions table if it exists
ALTER TABLE sessions
DROP COLUMN IF EXISTS created_at;

COMMIT;
