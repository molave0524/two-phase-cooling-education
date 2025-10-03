-- Check the current schema of order_items table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Also check if there are any existing rows
SELECT COUNT(*) as total_rows FROM order_items;
