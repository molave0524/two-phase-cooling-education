-- ============================================================================
-- Migration: Add Product Versioning & Component Relationships
-- Version: 0003
-- Date: 2025-10-04
-- ============================================================================

BEGIN;

-- Drop and recreate products table with all new fields
-- Since this is DEV and you said we can drop tables, this is the cleanest approach

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS product_components CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ============================================================================
-- PRODUCTS TABLE (Recreated with versioning fields)
-- ============================================================================

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,

  -- SKU versioning fields
  sku_prefix TEXT NOT NULL,
  sku_category TEXT NOT NULL,
  sku_product_code TEXT NOT NULL,
  sku_version TEXT NOT NULL,

  price REAL NOT NULL,
  original_price REAL,
  component_price REAL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  features JSONB NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  estimated_shipping TEXT,
  specifications JSONB NOT NULL,
  images JSONB NOT NULL,
  categories JSONB NOT NULL,
  tags JSONB NOT NULL,
  meta_title TEXT,
  meta_description TEXT,

  -- Versioning fields
  version INTEGER NOT NULL DEFAULT 1,
  base_product_id TEXT,
  previous_version_id TEXT REFERENCES products(id),
  replaced_by TEXT REFERENCES products(id),

  -- Lifecycle management
  status TEXT NOT NULL DEFAULT 'active',
  is_available_for_purchase BOOLEAN NOT NULL DEFAULT true,
  sunset_date TIMESTAMP,
  discontinued_date TIMESTAMP,
  sunset_reason TEXT,

  -- Product type
  product_type TEXT NOT NULL DEFAULT 'standalone',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX idx_products_sku_components ON products(sku_prefix, sku_category, sku_product_code);
CREATE INDEX idx_products_base_product ON products(base_product_id);
CREATE INDEX idx_products_status ON products(status) WHERE status != 'discontinued';
CREATE INDEX idx_products_available ON products(is_available_for_purchase) WHERE is_available_for_purchase = true;
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================================================
-- PRODUCT COMPONENTS TABLE (Junction)
-- ============================================================================

CREATE TABLE product_components (
  id SERIAL PRIMARY KEY,
  parent_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_included BOOLEAN NOT NULL DEFAULT true,
  price_override REAL,
  display_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_parent_component UNIQUE(parent_product_id, component_product_id),
  CONSTRAINT no_self_reference CHECK (parent_product_id != component_product_id)
);

-- Create indexes for product_components
CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);
CREATE INDEX idx_product_components_component ON product_components(component_product_id);
CREATE INDEX idx_product_components_sort ON product_components(parent_product_id, sort_order);

-- ============================================================================
-- CART ITEMS TABLE (Recreated with fixed FK)
-- ============================================================================

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- ============================================================================
-- ORDER ITEMS TABLE (Recreated with JSONB snapshot fields)
-- ============================================================================

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- Product snapshot (immutable)
  product_id TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_version INTEGER NOT NULL DEFAULT 1,
  product_type TEXT NOT NULL DEFAULT 'standalone',
  product_image TEXT NOT NULL,

  -- Component tree snapshot (JSONB)
  component_tree JSONB NOT NULL DEFAULT '[]',

  -- Pricing breakdown
  quantity INTEGER NOT NULL,
  base_price REAL NOT NULL,
  included_components_price REAL NOT NULL DEFAULT 0,
  optional_components_price REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL,
  line_total REAL NOT NULL,

  -- Optional: FK for reporting (not enforced)
  current_product_id TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_component_tree ON order_items USING GIN (component_tree);

-- ============================================================================
-- TRIGGERS FOR COMPONENT VALIDATION
-- ============================================================================

-- Trigger to prevent circular references
CREATE OR REPLACE FUNCTION prevent_circular_component_reference()
RETURNS TRIGGER AS $$
DECLARE
  depth_count INTEGER;
BEGIN
  -- Check if adding this relationship would create a cycle
  WITH RECURSIVE component_tree AS (
    SELECT component_product_id, 1 as depth
    FROM product_components
    WHERE parent_product_id = NEW.component_product_id

    UNION ALL

    SELECT pc.component_product_id, ct.depth + 1
    FROM product_components pc
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

CREATE TRIGGER check_circular_component_reference
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_component_reference();

-- Trigger to prevent depth > 2
CREATE OR REPLACE FUNCTION prevent_deep_component_nesting()
RETURNS TRIGGER AS $$
DECLARE
  component_has_children BOOLEAN;
  grandchild_count INTEGER;
BEGIN
  -- Check if the component being added has its own components
  SELECT EXISTS (
    SELECT 1 FROM product_components
    WHERE parent_product_id = NEW.component_product_id
  ) INTO component_has_children;

  IF component_has_children THEN
    -- Check if any of the component's children also have children
    SELECT COUNT(*) INTO grandchild_count
    FROM product_components pc1
    INNER JOIN product_components pc2 ON pc1.component_product_id = pc2.parent_product_id
    WHERE pc1.parent_product_id = NEW.component_product_id;

    IF grandchild_count > 0 THEN
      RAISE EXCEPTION 'Cannot add component: would create depth > 2';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_component_depth
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION prevent_deep_component_nesting();

COMMIT;
