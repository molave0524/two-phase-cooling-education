-- Migration: Add stored procedure for schema comparison metadata staging
-- This SP is called by the DevOps Drawer schema comparison feature
-- It stages PostgreSQL metadata tables for cross-environment comparison via FDW

CREATE OR REPLACE PROCEDURE public.usp_stage_pg_metadata_tables_for_schema_comparison()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Drop and recreate snapshot tables
  DROP TABLE IF EXISTS pg_tables_snapshot CASCADE;
  DROP TABLE IF EXISTS pg_columns_snapshot CASCADE;
  DROP TABLE IF EXISTS pg_constraints_snapshot CASCADE;
  DROP TABLE IF EXISTS pg_indexes_snapshot CASCADE;

  -- 1. Stage ALL tables (no schema filter)
  CREATE TABLE pg_tables_snapshot AS
  SELECT * FROM pg_tables;

  -- 2. Stage ALL columns (no schema filter)
  CREATE TABLE pg_columns_snapshot AS
  SELECT
    table_schema,
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale
  FROM information_schema.columns;

  -- 3. Stage ALL constraints (no schema filter)
  CREATE TABLE pg_constraints_snapshot AS
  SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name;

  -- 4. Stage ALL indexes (no schema filter)
  CREATE TABLE pg_indexes_snapshot AS
  SELECT * FROM pg_indexes;

  RAISE NOTICE 'Metadata staging complete - captured all schemas';
END;
$$;

-- Grant execute permission to the database owner
GRANT EXECUTE ON PROCEDURE public.usp_stage_pg_metadata_tables_for_schema_comparison() TO PUBLIC;

COMMENT ON PROCEDURE public.usp_stage_pg_metadata_tables_for_schema_comparison() IS
'Stages PostgreSQL metadata tables (tables, columns, constraints, indexes) for schema comparison. Called via dblink from LOCAL during DevOps Drawer schema comparison.';
