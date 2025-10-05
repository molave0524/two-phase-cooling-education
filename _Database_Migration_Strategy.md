# Database Migration Strategy

**Project:** Two-Phase Cooling Education
**Strategy:** PRD Clone → UAT Testing → PRD Migration
**Last Updated:** 2025-10-04

---

## Overview

Database schema changes follow a **safe, tested approach** to prevent production data loss:

1. **Develop** - Test migrations on DEV database (can be reset)
2. **UAT Preparation** - Clone PRD database to UAT
3. **UAT Testing** - Apply migrations to cloned data (validates no data loss)
4. **Production** - Apply same migrations to PRD (pre-tested on real data structure)

---

## Database Instances

### DEV Database
- **Purpose:** Development testing, can be reset anytime
- **Source:** Seed data or sanitized production subset
- **Migrations:** Apply immediately with `npm run db:push`
- **Connection:** `postgresql://user:pass@ep-dev-xxx.neon.tech/dbname`

### UAT Database
- **Purpose:** Test migrations on production-like data
- **Source:** **Cloned from PRD before each UAT deployment**
- **Migrations:** Applied via migration scripts (`npm run db:migrate`)
- **Connection:** `postgresql://user:pass@ep-uat-xxx.neon.tech/dbname`

### PRD Database
- **Purpose:** Live production data
- **Source:** Real user data
- **Migrations:** Applied after UAT validation (with backup)
- **Connection:** `postgresql://user:pass@ep-prod-xxx.neon.tech/dbname`

---

## Schema Change Workflow

### Step 1: Develop Schema Changes (DEV)

```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/add-user-preferences

# 2. Modify schema
# Edit: src/db/schema-pg.ts
# Add new table/columns

# 3. Generate migration files
npm run db:generate
# Creates: drizzle/postgres/0003_new_migration.sql

# 4. Apply to DEV database (safe to break)
npm run db:push
# OR manually: npm run db:migrate

# 5. Test locally
npm run dev
# Verify application works with new schema

# 6. Commit migration files
git add drizzle/postgres/
git add src/db/schema-pg.ts
git commit -m "feat: add user preferences table"
git push origin feature/add-user-preferences

# 7. Merge to develop → auto-deploy to DEV
# Create PR, review, merge
```

### Step 2: Clone PRD to UAT (Before UAT Deployment)

**Using Neon Dashboard (Recommended):**

```bash
# Option A: Neon Branch Feature (Instant Copy-on-Write)
1. Go to Neon Dashboard → PRD Project
2. Click "Branches" → "Create Branch"
3. Name: "uat-snapshot-YYYYMMDD"
4. Source: main (production branch)
5. Copy connection string

6. Update Vercel UAT environment:
   vercel env rm POSTGRES_URL preview
   vercel env add POSTGRES_URL preview
   # Paste new UAT branch connection string
```

**Using pg_dump/pg_restore (Alternative):**

```bash
# 1. Backup PRD database
pg_dump $POSTGRES_URL_PRD > prd-backup-$(date +%Y%m%d).sql

# 2. Restore to UAT database (CAUTION: Drops existing UAT data)
psql $POSTGRES_URL_UAT -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql $POSTGRES_URL_UAT < prd-backup-$(date +%Y%m%d).sql

# 3. Verify UAT has PRD data
psql $POSTGRES_URL_UAT -c "SELECT COUNT(*) FROM users;"
```

**Using Neon CLI (Fastest):**

```bash
# Install Neon CLI
npm install -g neonctl

# Create branch from PRD
neonctl branches create \
  --project-id <prd-project-id> \
  --name uat-snapshot-$(date +%Y%m%d) \
  --parent main

# Get connection string
neonctl connection-string uat-snapshot-$(date +%Y%m%d)

# Update Vercel UAT environment
vercel env add POSTGRES_URL preview
# Paste connection string
```

### Step 3: Deploy to UAT & Apply Migrations

```bash
# 1. Ensure UAT database is cloned from PRD
# (See Step 2 above)

# 2. Merge develop to uat
git checkout uat
git pull origin uat
git merge develop
git push origin uat

# 3. Vercel auto-deploys to UAT
# Migration files in drizzle/postgres/ are included in deployment

# 4. Apply migrations to UAT database
# Option A: Auto-apply on deployment (add to package.json)
# "build": "npm run db:migrate && next build"

# Option B: Manual apply via Vercel CLI
vercel env pull --environment=preview
npm run db:migrate

# Option C: Run migration script in Vercel Function
# Create: src/scripts/migrate.ts
# Trigger: https://your-app-uat.vercel.app/api/migrate?secret=xxx

# 5. Verify UAT application works
# Test at: https://your-app-uat.vercel.app
# Check:
# - New schema applied
# - Existing PRD data intact
# - No data loss
# - All features functional
```

### Step 4: Validate in UAT

**Testing Checklist:**

```bash
# 1. Schema validation
psql $POSTGRES_URL_UAT -c "\d+ users"  # Check new columns exist
psql $POSTGRES_URL_UAT -c "SELECT COUNT(*) FROM users;"  # Data count matches PRD

# 2. Application testing
# - Test new features using new schema
# - Test existing features (regression)
# - Verify no broken functionality

# 3. Data integrity checks
# - Run data validation queries
# - Check foreign key constraints
# - Verify indexes created

# 4. Performance testing
# - Test query performance
# - Check for N+1 queries
# - Monitor slow queries

# 5. Rollback test (if needed)
# - Verify rollback procedure works
# - Keep previous UAT snapshot for emergency rollback
```

### Step 5: Production Migration (After UAT Approval)

**Pre-Migration Checklist:**

- [ ] UAT testing complete and approved
- [ ] Migration scripts tested on PRD clone (UAT)
- [ ] Backup strategy confirmed
- [ ] Rollback procedure documented
- [ ] Maintenance window scheduled (if needed)
- [ ] Team notified of deployment

**Migration Procedure:**

```bash
# 1. CRITICAL: Backup PRD database
pg_dump $POSTGRES_URL_PRD > prd-backup-$(date +%Y%m%d-%H%M%S).sql

# OR use Neon snapshot
neonctl branches create \
  --project-id <prd-project-id> \
  --name prd-backup-$(date +%Y%m%d-%H%M%S) \
  --parent main

# 2. Verify backup integrity
psql $POSTGRES_URL_PRD -c "SELECT COUNT(*) FROM users;" > pre-migration-counts.txt

# 3. Merge uat to main (via PR)
git checkout main
git pull origin main
# Create PR: uat -> main
# Require approval + checks pass

# 4. After PR merge, Vercel auto-deploys to PRD
# Migrations auto-apply (if configured in build script)

# 5. Manual migration (if not auto)
vercel env pull --environment=production
npm run db:migrate

# 6. Verify PRD migration success
psql $POSTGRES_URL_PRD -c "\d+ users"  # Check schema
psql $POSTGRES_URL_PRD -c "SELECT COUNT(*) FROM users;" > post-migration-counts.txt

# Compare counts
diff pre-migration-counts.txt post-migration-counts.txt

# 7. Monitor application
# - Check Vercel logs for errors
# - Monitor database performance
# - Verify all features working

# 8. If issues found: ROLLBACK
# See "Emergency Rollback" section below
```

---

## Migration File Best Practices

### Safe Migration Patterns

**✅ DO:**

```sql
-- Add nullable column (safe)
ALTER TABLE users ADD COLUMN preferences JSONB;

-- Add column with default (safe)
ALTER TABLE users ADD COLUMN theme VARCHAR(20) DEFAULT 'light';

-- Create new table (safe)
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  settings JSONB
);

-- Add index (safe, can be CONCURRENT)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Add constraint with validation (safe)
ALTER TABLE users ADD CONSTRAINT check_email
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') NOT VALID;
ALTER TABLE users VALIDATE CONSTRAINT check_email;
```

**❌ DON'T:**

```sql
-- Drop column (data loss!)
ALTER TABLE users DROP COLUMN old_field;

-- Change column type (potential data loss)
ALTER TABLE users ALTER COLUMN age TYPE INTEGER;

-- Add NOT NULL without default (breaks existing rows)
ALTER TABLE users ADD COLUMN required_field VARCHAR(50) NOT NULL;

-- Drop table (data loss!)
DROP TABLE old_table;

-- Rename column without migration path
ALTER TABLE users RENAME COLUMN old_name TO new_name;
```

### Multi-Step Migration for Breaking Changes

**Example: Renaming a column safely**

```sql
-- Migration 1: Add new column
ALTER TABLE users ADD COLUMN new_name VARCHAR(100);

-- Migration 2: Copy data (in application code or SQL)
UPDATE users SET new_name = old_name WHERE new_name IS NULL;

-- Migration 3: Make new column NOT NULL (after data copied)
ALTER TABLE users ALTER COLUMN new_name SET NOT NULL;

-- Migration 4: Update application code to use new_name

-- Migration 5: (Later) Drop old column
-- ALTER TABLE users DROP COLUMN old_name;
```

---

## Automated Migration in Build

**Option A: Auto-migrate on Vercel Build**

```json
// package.json
{
  "scripts": {
    "build": "npm run db:migrate && next build",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

**⚠️ Caution:** Auto-migrations can fail builds. Consider manual migration for production.

**Option B: Migration API Endpoint (Controlled)**

```typescript
// src/app/api/admin/migrate/route.ts
import { db } from '@/db'
import { migrate } from 'drizzle-orm/neon-http/migrator'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  // Validate secret
  if (secret !== process.env.MIGRATION_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await migrate(db, { migrationsFolder: './drizzle/postgres' })
    return Response.json({ success: true, message: 'Migrations applied' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

**Usage:**
```bash
# After deployment, trigger migration
curl -X POST "https://your-app-uat.vercel.app/api/admin/migrate?secret=YOUR_SECRET"
```

---

## Emergency Rollback Procedures

### Rollback Vercel Deployment

```bash
# 1. List recent deployments
vercel ls

# 2. Rollback to previous deployment
vercel rollback <previous-deployment-url>
```

### Rollback Database (Neon Branch)

```bash
# 1. List Neon branches (backups)
neonctl branches list --project-id <prd-project-id>

# 2. Get connection string of backup branch
neonctl connection-string prd-backup-YYYYMMDD-HHMMSS

# 3. Update Vercel production database URL
vercel env rm POSTGRES_URL production
vercel env add POSTGRES_URL production
# Paste backup connection string

# 4. Redeploy
vercel --prod
```

### Rollback Database (pg_restore)

```bash
# 1. Restore from backup file
psql $POSTGRES_URL_PRD -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pg_restore -d $POSTGRES_URL_PRD prd-backup-YYYYMMDD-HHMMSS.sql

# 2. Verify restoration
psql $POSTGRES_URL_PRD -c "SELECT COUNT(*) FROM users;"
```

### Rollback Git

```bash
# 1. Revert merge commit
git checkout main
git revert -m 1 HEAD  # Revert the merge
git push origin main

# 2. Vercel auto-deploys reverted code
```

---

## Migration Checklist Template

**Copy this checklist for each schema change:**

### Pre-Migration
- [ ] Schema changes developed and tested in DEV
- [ ] Migration files generated and committed
- [ ] UAT database cloned from PRD (fresh copy)
- [ ] Migrations applied to UAT successfully
- [ ] UAT testing complete (all tests pass)
- [ ] Data integrity verified in UAT
- [ ] Rollback procedure documented
- [ ] PRD database backup created
- [ ] Team notified of deployment

### Migration
- [ ] PR created: uat → main
- [ ] PR approved by [approver name]
- [ ] All CI/CD checks pass
- [ ] Merged to main
- [ ] Vercel deployment successful
- [ ] Migrations applied to PRD
- [ ] PRD schema verified (matches UAT)

### Post-Migration
- [ ] Data counts match pre-migration
- [ ] Application functionality verified
- [ ] No errors in Vercel logs
- [ ] Database performance normal
- [ ] Monitoring dashboards checked
- [ ] Backup retention confirmed
- [ ] Documentation updated

### Rollback (If Needed)
- [ ] Issue identified and documented
- [ ] Rollback decision approved
- [ ] Deployment rolled back
- [ ] Database restored from backup
- [ ] Verification complete
- [ ] Incident report created

---

## Tools & Scripts

### Quick Clone PRD to UAT Script

```bash
#!/bin/bash
# clone-prd-to-uat.sh

set -e

echo "🔄 Cloning PRD database to UAT..."

# Load environment variables
source .env.production

# Create Neon branch (instant copy)
BRANCH_NAME="uat-snapshot-$(date +%Y%m%d-%H%M%S)"

neonctl branches create \
  --project-id $NEON_PRD_PROJECT_ID \
  --name $BRANCH_NAME \
  --parent main

# Get new connection string
UAT_CONN=$(neonctl connection-string $BRANCH_NAME --project-id $NEON_PRD_PROJECT_ID)

# Update Vercel UAT environment
vercel env rm POSTGRES_URL preview --yes
echo $UAT_CONN | vercel env add POSTGRES_URL preview

echo "✅ UAT database cloned from PRD"
echo "Connection string updated in Vercel"
echo "Branch name: $BRANCH_NAME"
```

### Database Diff Script

```bash
#!/bin/bash
# db-diff.sh - Compare PRD and UAT schemas

psql $POSTGRES_URL_PRD -c "\dt" > prd-tables.txt
psql $POSTGRES_URL_UAT -c "\dt" > uat-tables.txt

echo "Schema differences:"
diff prd-tables.txt uat-tables.txt
```

---

## Summary: Complete Flow

```
1. [DEV] Develop schema changes → Generate migrations → Test locally
   ↓
2. [DEV] Merge to develop → Auto-deploy to DEV → Verify
   ↓
3. [UAT Prep] Clone PRD database to UAT (fresh copy with real data structure)
   ↓
4. [UAT] Merge develop to uat → Auto-deploy → Apply migrations to cloned data
   ↓
5. [UAT] Test migrations on production-like data → Validate no data loss
   ↓
6. [UAT] Client/stakeholder approval
   ↓
7. [PRD] Backup PRD database → Merge uat to main → Auto-deploy
   ↓
8. [PRD] Apply same migrations (already tested on real data in UAT)
   ↓
9. [PRD] Verify & monitor → Success! ✅
```

**Key Principle:** Never apply untested migrations to production. UAT validates migrations on production data structure first.

---

**Questions or need help with migration setup?** Contact DevOps team.

**Last Updated:** 2025-10-04
**Next Review:** [Set date]
