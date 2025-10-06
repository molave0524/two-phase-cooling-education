-- Migration: Add FK constraint from order_items.product_id to products.id
-- This prevents orphaned order items when products are deleted

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_product_id_products_id_fk"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
