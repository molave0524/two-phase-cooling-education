-- ============================================================================
-- Migration: Fix sessions table structure
-- Version: 0008
-- Date: 2025-10-06
-- Description: Drop and recreate sessions table to match schema definition
-- ============================================================================

BEGIN;

-- Drop existing sessions table (will cascade to dependent objects)
DROP TABLE IF EXISTS sessions CASCADE;

-- Recreate sessions table with correct structure
CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Create index on session_token for faster lookups
CREATE INDEX idx_sessions_token ON sessions(session_token);

COMMIT;
