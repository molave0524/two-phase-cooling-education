# Database Migration Scripts

This directory contains database migration and maintenance scripts for managing schema changes across environments.

## Environment Variables

All scripts require environment variables to be set in `.env.local`:

### Required Variables

```bash
# Local Development Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/twophase_education_dev
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/twophase_education_dev

# Neon DEV Database
DEV_DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
DEV_POSTGRES_URL=postgresql://neondb_owner:PASSWORD@ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Neon UAT Database
UAT_DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Replace `PASSWORD` with the actual database passwords (check Vercel environment variables or .env.vercel-staging).

## Script Categories

### Schema Migration Scripts

**move-tables-to-schemas.ts**

- Migrates tables from public schema to modular schemas (auth, catalog, store)
- Works on LOCAL database
- Usage: `npx tsx scripts/move-tables-to-schemas.ts`

**migrate-neon-dev.ts**

- Migrates DEV database to modular schemas
- Requires: `DEV_DATABASE_URL`
- Usage: `npx tsx scripts/migrate-neon-dev.ts`

**migrate-neon-uat.ts**

- Migrates UAT database to modular schemas
- Requires: `UAT_DATABASE_URL`
- Usage: `npx tsx scripts/migrate-neon-uat.ts`

### Schema Alignment Scripts

**migrate-uat-timestamps.ts**

- Converts UAT timestamp columns to `timestamptz(6)` to match LOCAL/DEV
- Fixes sessions table structure (renames expires_at, adds session_token)
- Requires: `UAT_DATABASE_URL`
- Usage: `npx tsx scripts/migrate-uat-timestamps.ts`

**update-uat-precision.ts**

- Updates UAT timestamp precision to `timestamptz(6)`
- Requires: `UAT_DATABASE_URL`
- Usage: `npx tsx scripts/update-uat-precision.ts`

**align-uat-products.ts**

- Adds missing columns to UAT catalog.products table
- Truncates table before adding columns
- Requires: `UAT_DATABASE_URL`
- Usage: `npx tsx scripts/align-uat-products.ts`

**align-uat-store-schema.ts**

- Aligns UAT store schema (orders, order_items) with LOCAL/DEV
- Truncates tables before schema changes
- Requires: `UAT_DATABASE_URL`
- Usage: `npx tsx scripts/align-uat-store-schema.ts`

**create-uat-product-components.ts**

- Creates catalog.product_components table in UAT
- Requires: `UAT_DATABASE_URL`
- Usage: `npx tsx scripts/create-uat-product-components.ts`

### Data Copy Scripts

**copy-local-catalog-to-dev.ts**

- Copies products and product_components from LOCAL to DEV
- Requires: `DATABASE_URL` and `DEV_POSTGRES_URL`
- Usage: `npx tsx scripts/copy-local-catalog-to-dev.ts`

**copy-local-catalog-to-uat.ts**

- Copies products and product_components from LOCAL to UAT
- Requires: `DATABASE_URL` and `UAT_DATABASE_URL`
- Usage: `npx tsx scripts/copy-local-catalog-to-uat.ts`

### Schema Comparison Scripts

**compare-all-schemas.ts**

- Compares all schemas between LOCAL and remote databases
- Shows tables, column counts, and data type differences
- Usage: `npx tsx scripts/compare-all-schemas.ts`

**compare-all-tables.ts**

- Compares all tables across environments
- Usage: `npx tsx scripts/compare-all-tables.ts`

**compare-products-columns.ts**

- Detailed comparison of catalog.products columns
- Usage: `npx tsx scripts/compare-products-columns.ts`

### Product Data Scripts

**check-product-status.ts**

- Checks product status across environments
- Usage: `npx tsx scripts/check-product-status.ts`

**list-dev-products.ts**

- Lists all products in DEV database
- Requires: `DEV_POSTGRES_URL`
- Usage: `npx tsx scripts/list-dev-products.ts`

**sync-products-to-dev.ts**

- Syncs products from LOCAL to DEV
- Usage: `npx tsx scripts/sync-products-to-dev.ts`

### Image Fixing Scripts

**fix-product-images.ts**

- Fixes product image URLs
- Usage: `npx tsx scripts/fix-product-images.ts`

**fix-gallery-images.ts**

- Fixes gallery image URLs
- Usage: `npx tsx scripts/fix-gallery-images.ts`

**fix-duplicate-components.ts**

- Removes duplicate product components
- Usage: `npx tsx scripts/fix-duplicate-components.ts`

**fix-third-gallery-image.ts** & **fix-third-image-v2.ts**

- Fixes specific gallery image issues
- Usage: `npx tsx scripts/fix-third-gallery-image.ts`

**fix-dev-triggers.ts**

- Fixes trigger functions to use schema-qualified table names
- Usage: `npx tsx scripts/fix-dev-triggers.ts`

### Standard Drizzle Scripts

**migrate.ts**

- Standard Drizzle migration runner
- Usage: `npm run db:migrate`

**migrate-dryrun.ts**

- Dry run for Drizzle migrations
- Usage: Custom dry run

## Security Notes

⚠️ **IMPORTANT**: Never commit files with hardcoded credentials!

- All scripts now use environment variables
- No credentials should be hardcoded in script files
- `.env.local` and `.env.vercel-staging` are gitignored
- Check `.gitignore` before committing any new files

## Schema Organization

After migration, the database is organized into three modular schemas:

- **auth**: users, accounts, sessions, verification_tokens, addresses
- **catalog**: products, product_components
- **store**: carts, cart_items, orders, order_items

## Running Scripts

1. Ensure `.env.local` has all required environment variables
2. Run scripts using `npx tsx scripts/<script-name>.ts`
3. Check script output for success/error messages
4. Scripts will exit with code 0 on success, 1 on failure

## Migration Order

When setting up a new environment:

1. **Schema Migration**: `migrate-neon-{env}.ts`
2. **Timestamp Alignment**: `migrate-{env}-timestamps.ts`
3. **Schema Alignment**: `align-{env}-*.ts`
4. **Data Copy**: `copy-local-catalog-to-{env}.ts`
5. **Verification**: `compare-all-schemas.ts`
