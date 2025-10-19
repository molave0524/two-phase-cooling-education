# Database Migration Issues & Resolution

## Problem Identified: Schema Drift (2025-10-19)

### What Happened:

Local development databases were out of sync with DEV/Production due to missing migrations in the migration journal.

### Root Cause:

- Migration files `0003-0009` exist in `drizzle/postgres/` folder
- BUT these migrations were **NOT registered** in `drizzle/postgres/meta/_journal.json`
- When developers run `npm run db:migrate`, only migrations in the journal are applied
- Result: Local databases missing critical fields (versioning, SKU breakdown, lifecycle management)

### Timeline:

1. **Initial migrations** (0000-0002) were properly generated and tracked
2. **Schema files updated** (`src/db/schemas/catalog.ts`) with new fields
3. **Migrations 0003-0009 created** but journal NOT updated (likely manual SQL on DEV)
4. **New developers** running `npm run db:migrate` only got migrations 0000-0002
5. **Schema drift** occurred between local and DEV/Production databases

## The Fix:

### Created Migration 0010

- File: `0010_sync_catalog_schema.sql`
- Purpose: Adds all missing fields from production schema
- Safe: Uses `IF NOT EXISTS` clauses to be idempotent
- Registered in journal as migration idx=3

### What Changed:

Added to `catalog.products` table:

- **SKU breakdown**: `sku_prefix`, `sku_category`, `sku_product_code`, `sku_version` (varchar 3)
- **Pricing**: `component_price` (real)
- **Versioning**: `version`, `base_product_id`, `previous_version_id`, `replaced_by`
- **Lifecycle**: `status`, `is_available_for_purchase`, `sunset_date`, `discontinued_date`, `sunset_reason`
- **Type**: `product_type` (standalone/bundle/component)
- **Constraints**: CHECK constraints for SKU format, foreign keys for versioning
- **Indexes**: Performance indexes for common queries

## For Future Developers:

### ✅ Correct Workflow:

```bash
# 1. Update schema files
vim src/db/schemas/catalog.ts

# 2. Generate migration (this updates both SQL AND journal)
npm run db:generate

# 3. Review generated migration
cat drizzle/postgres/NNNN_*.sql

# 4. Apply to local database
npm run db:migrate

# 5. Test thoroughly

# 6. Commit BOTH the SQL file AND meta/_journal.json
git add drizzle/postgres/NNNN_*.sql
git add drizzle/postgres/meta/_journal.json
git add drizzle/postgres/meta/NNNN_snapshot.json
git commit -m "feat(db): add product versioning fields"
```

### ❌ What NOT to Do:

- ❌ Don't manually create SQL files without running `db:generate`
- ❌ Don't edit `_journal.json` manually (let drizzle-kit manage it)
- ❌ Don't run SQL directly on DEV/Prod without migrations
- ❌ Don't skip committing the `meta/` folder changes

## Orphaned Migrations (0003-0009):

### Status:

These migration files exist but are NOT in the journal:

- `0003_catalog_versioning.sql` - Product versioning (SUPERSEDED by 0010)
- `0004_add_product_fk_to_order_items.sql`
- `0005_add_schema_comparison_sp.sql`
- `0006_remove_cart_id_from_orders.sql`
- `0007_remove_created_at_from_sessions.sql`
- `0008_fix_sessions_table_structure.sql`
- `0009_schema_separation.sql`

### Action Needed:

1. **Review each file** to understand what changes they contain
2. **Verify changes exist** in current schema files
3. **Two options:**
   - **Option A (Recommended)**: Delete files 0003-0009 if changes are in schema + migration 0010
   - **Option B**: Add missing ones to journal if they contain unique changes not in 0010
4. **Document decision** in this file

### Current Status:

- ✅ Migration 0010 covers the catalog.products schema changes from 0003
- ✅ Migration 0011 fixes all timestamp types to use timestamptz (with timezone)
- ✅ Migration 0012 fixes order_items table structure to match production
- ⚠️ Migrations 0004-0009 need review for other table changes
- 📝 TODO: Audit and clean up orphaned migrations
- ✅ Schema definition files updated to use `{ withTimezone: true }`
- ✅ Local schema now 100% matches DEV and UAT

## Schema Fixes Applied (2025-10-19):

### Migration 0011: Fix Timestamp Types

**Problem**: All timestamp columns were `timestamp without time zone`, but DEV/Production use `timestamp with time zone` (timestamptz).

**Fixed Tables**:

- auth.users (5 timestamp columns)
- auth.sessions (1 column)
- auth.verification_tokens (1 column)
- auth.addresses (2 columns)
- catalog.products (4 columns)
- catalog.product_components (2 columns)
- store.carts (2 columns)
- store.cart_items (2 columns)
- store.orders (7 columns)
- store.order_items (1 column)

### Migration 0012: Fix Order Items Structure

**Problem**: Local had obsolete `variant_id`/`variant_name` fields, missing modern product snapshot fields.

**Changes**:

- ❌ Removed: `variant_id`, `variant_name`
- ✅ Added: `product_slug`, `product_version`, `product_type`
- ✅ Added: `component_tree` (JSONB for nested component tracking)
- ✅ Added: `base_price`, `included_components_price`, `optional_components_price`, `line_total`
- ✅ Added: `current_product_id` (optional FK for reporting)
- ✅ Added: Indexes for performance

### Schema Files Updated:

All schema definition files now use `{ withTimezone: true }` to ensure future migrations generate correct types:

- `src/db/schemas/auth.ts` ✅
- `src/db/schemas/catalog.ts` ✅
- `src/db/schemas/store.ts` ✅

## Prevention:

### Pre-commit Hook:

Consider adding a check to ensure migration files match journal entries:

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for migration/journal sync
MIGRATION_COUNT=$(ls drizzle/postgres/*.sql 2>/dev/null | wc -l)
JOURNAL_COUNT=$(jq '.entries | length' drizzle/postgres/meta/_journal.json)

if [ "$MIGRATION_COUNT" -ne "$JOURNAL_COUNT" ]; then
  echo "❌ ERROR: Migration files ($MIGRATION_COUNT) don't match journal entries ($JOURNAL_COUNT)"
  echo "Run 'npm run db:generate' to create migrations properly"
  exit 1
fi
```

### CI/CD Check:

Add schema validation in CI:

```bash
npm run db:push -- --dry-run  # Check for drift
```

## Questions?

Contact the team lead or check:

- Drizzle Docs: https://orm.drizzle.team/docs/migrations
- Project Docs: `docs/architecture/database-schema.md`

---

**Last Updated:** 2025-10-19
**Updated By:** Development Setup Process
**Status:** ✅ Resolved with migration 0010
