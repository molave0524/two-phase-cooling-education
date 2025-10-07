CREATE TABLE "product_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_product_id" text NOT NULL,
	"component_product_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_included" boolean DEFAULT true NOT NULL,
	"price_override" real,
	"display_name" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_components_parent_product_id_component_product_id_unique" UNIQUE("parent_product_id","component_product_id"),
	CONSTRAINT "no_self_reference" CHECK ("product_components"."parent_product_id" != "product_components"."component_product_id")
);
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_slug" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_type" text DEFAULT 'standalone' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "component_tree" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "base_price" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "included_components_price" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "optional_components_price" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "line_total" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "current_product_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku_prefix" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku_category" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku_product_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku_version" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "component_price" real;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_product_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "previous_version_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "replaced_by" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_available_for_purchase" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sunset_date" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discontinued_date" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sunset_reason" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" text DEFAULT 'standalone' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_components" ADD CONSTRAINT "product_components_parent_product_id_products_id_fk" FOREIGN KEY ("parent_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_components" ADD CONSTRAINT "product_components_component_product_id_products_id_fk" FOREIGN KEY ("component_product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_previous_version_id_products_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_replaced_by_products_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "variant_name";