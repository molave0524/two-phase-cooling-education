-- Add SKU column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'sku'
    ) THEN
        ALTER TABLE products ADD COLUMN sku TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update existing products with SKU values
UPDATE products SET sku = 'TPC-CASE-PRO-001' WHERE slug = 'thermosphere-pro-pc-case';
UPDATE products SET sku = 'TPC-GPU-ELITE-001' WHERE slug = 'cryoflow-elite-gpu-cooler';
UPDATE products SET sku = 'TPC-CPU-BASIC-001' WHERE slug = 'quantum-freeze-cpu-cooler';
