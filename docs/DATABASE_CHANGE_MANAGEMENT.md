# Database Change Management

## Overview
This document defines the process for managing database schema changes across all environments (local, dev, UAT, production) to ensure consistency, prevent breaking changes, and maintain data integrity.

## Core Principles

### 1. All Schema Changes MUST Have Migrations
- No direct database modifications in dev/UAT/production
- Every schema change requires a versioned migration file
- Migrations are the single source of truth for schema evolution

### 2. Schema Validation Before Deployment
- Use DevOps Schema Comparison tool before deploying
- Automated checks in CI/CD pipeline
- Manual verification for production deployments

### 3. Breaking Changes Require Special Approval
- Breaking changes need tech lead approval
- Must include rollback plan
- Coordinated deployment with application code

## Development Workflow

### Making Database Schema Changes

#### Step 1: Update Schema Definition
```bash
# Edit the schema file
src/db/schema-pg.ts
```

#### Step 2: Generate Migration
```bash
npm run db:generate
# Creates a new file in drizzle/postgres/XXXX_description.sql
```

#### Step 3: Test Migration Locally
```bash
npm run db:migrate
# Applies migration to your local database
```

#### Step 4: Verify Schema Compatibility
1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:3000/devops/schema-comparison
3. Compare: `local → dev`
4. Review any breaking changes

#### Step 5: Commit Changes
```bash
git add src/db/schema-pg.ts
git add drizzle/postgres/XXXX_description.sql
git commit -m "feat: Add user preferences table"
```

#### Step 6: Create Pull Request
Include in PR description:
- Migration file name
- Schema changes summary
- Breaking changes (if any)
- Rollback plan (if breaking)

## CI/CD Integration

### Automated Checks (GitHub Actions)
The following checks run automatically on every PR:

1. **Schema Drift Detection**
   - Compares local schema against dev environment
   - Fails if incompatible changes detected
   - Comments on PR with schema diff

2. **Migration File Validation**
   - Ensures migration exists for schema changes
   - Validates SQL syntax
   - Checks for destructive operations

3. **Deployment Gates**
   - ✅ All checks pass → Auto-merge to dev
   - ⚠️ Breaking changes → Requires manual approval
   - ❌ Incompatible → Blocks merge

### Deployment Process

#### To DEV (Automated)
```bash
git push origin develop
# GitHub Actions automatically:
# 1. Runs schema validation
# 2. Applies migrations to dev database
# 3. Deploys application
```

#### To UAT (Semi-Automated)
```bash
# Create release branch
git checkout -b release/v1.2.0

# Manual schema comparison
# Navigate to: https://dev.yourapp.com/devops/schema-comparison
# Compare: dev → uat

# If compatible:
git push origin release/v1.2.0
# Requires approval before merge
```

#### To PROD (Manual)
```bash
# Pre-deployment checklist:
# ☐ Schema comparison (uat → prod) shows no breaking changes
# ☐ Rollback plan documented
# ☐ Database backup completed
# ☐ Maintenance window scheduled (if needed)

# Deploy with manual approval
```

## Breaking Changes Policy

### What Qualifies as Breaking?
- ❌ Dropping tables
- ❌ Dropping columns
- ❌ Changing column data types (non-compatible)
- ❌ Adding NOT NULL columns without defaults
- ⚠️ Renaming tables/columns (requires coordination)

### Non-Breaking Changes
- ✅ Adding new tables
- ✅ Adding nullable columns
- ✅ Adding indexes
- ✅ Adding constraints (with validation)

### Handling Breaking Changes

#### Option 1: Multi-Phase Deployment (Preferred)
```
Phase 1: Add new column (nullable)
Phase 2: Backfill data
Phase 3: Make column NOT NULL
Phase 4: Remove old column
```

#### Option 2: Maintenance Window
```
1. Schedule downtime
2. Take database backup
3. Apply migration
4. Deploy application
5. Verify functionality
6. Resume operations
```

## Rollback Procedures

### Automatic Rollback (Non-Breaking)
```bash
# Revert migration
npm run db:rollback

# Deploy previous version
git revert <commit-hash>
git push
```

### Manual Rollback (Breaking Changes)
```bash
# 1. Restore from backup
psql $DATABASE_URL < backup.sql

# 2. Deploy previous application version
vercel rollback

# 3. Notify team via Slack/email
```

## Tools & Resources

### DevOps Schema Comparison
- **Local**: http://localhost:3000/devops/schema-comparison
- **Dev**: https://dev.yourapp.com/devops/schema-comparison
- **UAT**: https://uat.yourapp.com/devops/schema-comparison

### Useful Commands
```bash
# Generate migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Check migration status
npm run db:status

# Compare schemas
npm run db:compare
```

### Environment Variables
Required for schema comparison across environments:
```env
# .env.local
DATABASE_URL=postgresql://...           # Local database
DEV_POSTGRES_URL=postgresql://...       # Dev environment
UAT_POSTGRES_URL=postgresql://...       # UAT environment
PROD_POSTGRES_URL=postgresql://...      # Production (read-only)
```

## Monitoring & Alerts

### Schema Drift Alerts
Automated daily checks:
- Compares dev/UAT/prod schemas
- Alerts if drift detected
- Posts to #devops Slack channel

### Migration Failures
If migration fails in any environment:
1. GitHub Actions job fails
2. Deployment halted
3. Team notified via Slack
4. Manual intervention required

## Story/Epic Template

### Epic: Database Schema Change Management
```markdown
## Epic Description
Implement automated validation and deployment process for database schema changes to prevent drift and breaking changes across environments.

## User Stories

### Story 1: Schema Validation in CI/CD
**As a** developer
**I want** automated schema validation in pull requests
**So that** I catch breaking changes before deployment

**Acceptance Criteria:**
- [ ] GitHub Action runs on every PR
- [ ] Compares local schema against target environment
- [ ] Comments on PR with schema differences
- [ ] Blocks merge if breaking changes detected without approval

---

### Story 2: Pre-Deployment Schema Comparison
**As a** DevOps engineer
**I want** to compare schemas before deployment
**So that** I can prevent incompatible deployments

**Acceptance Criteria:**
- [ ] Web UI accessible at /devops/schema-comparison
- [ ] Can select source and target environments
- [ ] Shows side-by-side table and column comparison
- [ ] Highlights breaking changes in red
- [ ] Provides copy-to-clipboard functionality

---

### Story 3: Migration Generation Workflow
**As a** developer
**I want** clear guidelines for creating migrations
**So that** schema changes are consistent and traceable

**Acceptance Criteria:**
- [ ] Documentation in CONTRIBUTING.md
- [ ] Example migration files
- [ ] Pre-commit hook validates migrations
- [ ] Migration naming conventions enforced

---

### Story 4: Automated Migration Deployment
**As a** platform engineer
**I want** migrations to deploy automatically to dev/UAT
**So that** manual database operations are minimized

**Acceptance Criteria:**
- [ ] Migrations auto-apply on successful deployment
- [ ] Rollback mechanism for failed migrations
- [ ] Migration status visible in deployment logs
- [ ] Alerts sent on migration failures

---

### Story 5: Rollback Procedures & Documentation
**As a** team member
**I want** documented rollback procedures
**So that** I can safely recover from failed deployments

**Acceptance Criteria:**
- [ ] Rollback documentation in /docs
- [ ] Automated rollback for non-breaking changes
- [ ] Manual rollback checklist for breaking changes
- [ ] Backup/restore procedures documented
```

## FAQ

**Q: What if I need to make an emergency schema change in production?**
A: Follow the emergency change process:
1. Create migration file locally
2. Test in dev environment first
3. Get approval from tech lead
4. Apply to production during maintenance window
5. Create retro-fix PR afterward

**Q: Can I skip migrations for small changes?**
A: No. All schema changes require migrations, regardless of size. This ensures consistency and traceability.

**Q: What if schema comparison shows differences that don't exist?**
A: This may indicate:
- Cached metadata (restart dev server)
- Manual changes made outside migrations
- Migration not applied to target environment

**Q: How do I handle data migrations (not schema)?**
A: Create a separate migration file with data manipulation SQL. Include in the same PR as schema changes.

## References

- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [PostgreSQL Foreign Data Wrappers](https://www.postgresql.org/docs/current/postgres-fdw.html)
- [Database Versioning Best Practices](https://www.liquibase.com/blog/database-version-control)

---

**Last Updated:** 2025-10-06
**Owner:** DevOps Team
**Review Cycle:** Quarterly
