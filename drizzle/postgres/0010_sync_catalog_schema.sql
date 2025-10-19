-- ============================================================================
-- Migration: Sync Catalog Schema with Production
-- Version: 0010
-- Date: 2025-10-19
-- Description: Adds all missing product versioning and lifecycle fields
-- ============================================================================
-- This migration adds fields that exist in production but were missing from local
-- Fixes schema drift issue where migrations 0003-0009 were not in journal

BEGIN;

-- Add SKU breakdown columns if they don't exist
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS sku_prefix varchar(3) NOT NULL DEFAULT 'TPC';
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS sku_category varchar(3) NOT NULL DEFAULT 'PRD';
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS sku_product_code varchar(3) NOT NULL DEFAULT 'A01';
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS sku_version varchar(3) NOT NULL DEFAULT 'V01';

-- Add component pricing
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS component_price real;

-- Add versioning columns
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS base_product_id text;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS previous_version_id text;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS replaced_by text;

-- Add lifecycle management columns
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS is_available_for_purchase boolean NOT NULL DEFAULT true;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS sunset_date timestamp;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS discontinued_date timestamp;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS sunset_reason text;

-- Add product type column
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'standalone';

-- Add foreign key constraints for versioning
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_previous_version_id_fkey') THEN
        ALTER TABLE catalog.products ADD CONSTRAINT products_previous_version_id_fkey
            FOREIGN KEY (previous_version_id) REFERENCES catalog.products(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_replaced_by_fkey') THEN
        ALTER TABLE catalog.products ADD CONSTRAINT products_replaced_by_fkey
            FOREIGN KEY (replaced_by) REFERENCES catalog.products(id);
    END IF;
END $$;

-- Add CHECK constraints for SKU fields (3 characters, no spaces)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sku_prefix_format') THEN
        ALTER TABLE catalog.products ADD CONSTRAINT sku_prefix_format
            CHECK (LENGTH(sku_prefix) = 3 AND sku_prefix NOT LIKE '% %');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sku_category_format') THEN
        ALTER TABLE catalog.products ADD CONSTRAINT sku_category_format
            CHECK (LENGTH(sku_category) = 3 AND sku_category NOT LIKE '% %');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sku_product_code_format') THEN
        ALTER TABLE catalog.products ADD CONSTRAINT sku_product_code_format
            CHECK (LENGTH(sku_product_code) = 3 AND sku_product_code NOT LIKE '% %');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sku_version_format') THEN
        ALTER TABLE catalog.products ADD CONSTRAINT sku_version_format
            CHECK (LENGTH(sku_version) = 3 AND sku_version NOT LIKE '% %');
    END IF;
END $$;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_sku_components ON catalog.products(sku_prefix, sku_category, sku_product_code);
CREATE INDEX IF NOT EXISTS idx_products_base_product ON catalog.products(base_product_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON catalog.products(status) WHERE status != 'discontinued';
CREATE INDEX IF NOT EXISTS idx_products_available ON catalog.products(is_available_for_purchase) WHERE is_available_for_purchase = true;

COMMIT;
