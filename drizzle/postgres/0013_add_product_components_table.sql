-- ============================================================================
-- Migration: Add Product Components Table
-- Version: 0013
-- Date: 2025-10-19
-- Description: Creates catalog.product_components table for product relationships
-- ============================================================================
-- This table was defined in orphaned migration 0003 but never applied to local
-- Creating it now to match DEV/Production structure

BEGIN;

-- ============================================================================
-- PRODUCT COMPONENTS TABLE (Many-to-Many Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS catalog.product_components (
  id SERIAL PRIMARY KEY,

  -- Relationships
  parent_product_id TEXT NOT NULL
    REFERENCES catalog.products(id) ON DELETE CASCADE,
  component_product_id TEXT NOT NULL
    REFERENCES catalog.products(id) ON DELETE RESTRICT,

  -- Component configuration
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_included BOOLEAN NOT NULL DEFAULT true,

  -- Pricing override
  price_override REAL,

  -- Display configuration
  display_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  notes TEXT,

  -- Timestamps (with timezone to match production)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_parent_component UNIQUE(parent_product_id, component_product_id),
  CONSTRAINT no_self_reference CHECK (parent_product_id != component_product_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_components_parent
  ON catalog.product_components(parent_product_id);

CREATE INDEX IF NOT EXISTS idx_product_components_component
  ON catalog.product_components(component_product_id);

CREATE INDEX IF NOT EXISTS idx_product_components_sort
  ON catalog.product_components(parent_product_id, sort_order);

-- ============================================================================
-- TRIGGERS FOR COMPONENT VALIDATION
-- ============================================================================

-- Trigger to prevent circular references
CREATE OR REPLACE FUNCTION catalog.prevent_circular_component_reference()
RETURNS TRIGGER AS $$
DECLARE
  depth_count INTEGER;
BEGIN
  -- Check if adding this relationship would create a cycle
  WITH RECURSIVE component_tree AS (
    SELECT component_product_id, 1 as depth
    FROM catalog.product_components
    WHERE parent_product_id = NEW.component_product_id

    UNION ALL

    SELECT pc.component_product_id, ct.depth + 1
    FROM catalog.product_components pc
    INNER JOIN component_tree ct ON pc.parent_product_id = ct.component_product_id
    WHERE ct.depth < 10
  )
  SELECT COUNT(*) INTO depth_count
  FROM component_tree
  WHERE component_product_id = NEW.parent_product_id;

  IF depth_count > 0 THEN
    RAISE EXCEPTION 'Circular reference detected: % → %', NEW.parent_product_id, NEW.component_product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_circular_component_reference ON catalog.product_components;
CREATE TRIGGER check_circular_component_reference
  BEFORE INSERT OR UPDATE ON catalog.product_components
  FOR EACH ROW
  EXECUTE FUNCTION catalog.prevent_circular_component_reference();

-- Trigger to prevent depth > 2
CREATE OR REPLACE FUNCTION catalog.prevent_deep_component_nesting()
RETURNS TRIGGER AS $$
DECLARE
  component_has_children BOOLEAN;
  grandchild_count INTEGER;
BEGIN
  -- Check if the component being added has its own components
  SELECT EXISTS (
    SELECT 1 FROM catalog.product_components
    WHERE parent_product_id = NEW.component_product_id
  ) INTO component_has_children;

  IF component_has_children THEN
    -- Check if any of the component's children also have children
    SELECT COUNT(*) INTO grandchild_count
    FROM catalog.product_components pc1
    INNER JOIN catalog.product_components pc2 ON pc1.component_product_id = pc2.parent_product_id
    WHERE pc1.parent_product_id = NEW.component_product_id;

    IF grandchild_count > 0 THEN
      RAISE EXCEPTION 'Cannot add component: would create depth > 2';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_component_depth ON catalog.product_components;
CREATE TRIGGER check_component_depth
  BEFORE INSERT OR UPDATE ON catalog.product_components
  FOR EACH ROW
  EXECUTE FUNCTION catalog.prevent_deep_component_nesting();

COMMIT;

-- Verify the table was created
SELECT
  'Table created with ' || COUNT(*) || ' columns' as status
FROM information_schema.columns
WHERE table_schema = 'catalog'
AND table_name = 'product_components';
