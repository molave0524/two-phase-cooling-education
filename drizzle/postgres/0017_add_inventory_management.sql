-- Add low_stock_threshold column to catalog.products table
ALTER TABLE "catalog"."products" ADD COLUMN "low_stock_threshold" integer DEFAULT 5 NOT NULL;

--> statement-breakpoint

-- Create inventory_reservations table in store schema
CREATE TABLE "store"."inventory_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"reserved_by" text,
	"reservation_type" text DEFAULT 'checkout' NOT NULL,
	"stripe_payment_intent_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);

--> statement-breakpoint

-- Add foreign key constraint for product_id
ALTER TABLE "store"."inventory_reservations"
ADD CONSTRAINT "inventory_reservations_product_id_products_id_fk"
FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id")
ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- Create index for efficient querying of active reservations
CREATE INDEX "inventory_reservations_product_status_idx"
ON "store"."inventory_reservations" ("product_id", "status", "expires_at");

--> statement-breakpoint

-- Create index for cleanup of expired reservations
CREATE INDEX "inventory_reservations_expires_at_idx"
ON "store"."inventory_reservations" ("expires_at", "status");
