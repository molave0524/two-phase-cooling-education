# Legacy SQLite Migration Scripts

**Archived on:** 2025-10-19

## Purpose

These scripts were used during the original development phase when the application supported both SQLite (for local development) and PostgreSQL (for production).

## Why Archived

The application has been fully migrated to use PostgreSQL for all environments:

- Local development: PostgreSQL (Docker)
- Production: PostgreSQL (Neon Database)

These scripts are no longer needed as:

1. All database configuration now uses PostgreSQL exclusively
2. The codebase has been cleaned to remove SQLite-specific conditional logic
3. Package dependencies do not include `better-sqlite3`

## Files Included

1. `setup-db.js` - SQLite database setup script
2. `verify-auth.js` - Auth verification for SQLite
3. `create-fresh-db.js` - Fresh SQLite database creation
4. `migrate-local-db.js` - Local SQLite migration tool
5. `cleanup-users.js` - User cleanup for SQLite
6. `check-users.js` - User verification for SQLite
7. `check-users-schema.js` - Schema verification
8. `check-db.js` - Database verification
9. `check-cart.js` - Cart verification for SQLite
10. `add-image-column.js` - SQLite schema migration
11. `fix-billing-address.js` - Billing address migration
12. `migrate-orders-schema.js` - Orders schema migration
13. `run-account-migration.js` - Account migration runner

## If You Need These

These files are kept for historical reference. If you need to reference the original SQLite implementation, these scripts are available here.

**Do not use these scripts** - they are incompatible with the current PostgreSQL-only architecture.
