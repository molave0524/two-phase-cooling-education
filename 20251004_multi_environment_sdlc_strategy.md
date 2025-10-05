# Multi-Environment SDLC Strategy

**Document Date:** 2025-10-04
**Purpose:** Establish DEV, UAT, and PROD environments with proper Git branching strategy
**Audience:** Development Team

---

## Table of Contents

1. [Environment Overview](#1-environment-overview)
2. [Git Branching Strategy](#2-git-branching-strategy)
3. [Vercel Environment Setup](#3-vercel-environment-setup)
4. [Database Strategy](#4-database-strategy)
5. [Deployment Workflow](#5-deployment-workflow)
6. [Environment Variables](#6-environment-variables)
7. [Promotion Process](#7-promotion-process)
8. [Best Practices & Guardrails](#8-best-practices--guardrails)

---

## 1. Environment Overview

### Environment Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                     LOCAL                           │
│  - Developer machine                                │
│  - Docker PostgreSQL                                │
│  - http://localhost:3000                            │
│  - Full debug capabilities                          │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                      DEV                            │
│  - Vercel Preview Environment                       │
│  - Neon PostgreSQL (dev branch)                     │
│  - https://simple-todo-dev.vercel.app              │
│  - Auto-deployed from 'develop' branch              │
│  - Integration testing                              │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                      UAT                            │
│  - Vercel Preview Environment                       │
│  - Neon PostgreSQL (uat branch)                     │
│  - https://simple-todo-uat.vercel.app              │
│  - Auto-deployed from 'uat' branch                  │
│  - User acceptance testing                          │
│  - Staging environment                              │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                     PROD                            │
│  - Vercel Production Environment                    │
│  - Neon PostgreSQL (production branch)              │
│  - https://simple-todo.vercel.app                  │
│  - Auto-deployed from 'main' branch                 │
│  - Live customer traffic                            │
└─────────────────────────────────────────────────────┘
```

### Environment Characteristics

| Environment | Purpose | Data | Deployment | Rollback | Monitoring |
|-------------|---------|------|------------|----------|------------|
| **LOCAL** | Development & debugging | Synthetic/test data | Manual (`npm run dev`) | git reset | Console logs |
| **DEV** | Integration testing | Synthetic data | Auto on push to `develop` | Vercel rollback | Basic logs |
| **UAT** | User acceptance testing | Production-like data | Auto on push to `uat` | Vercel rollback | Full monitoring |
| **PROD** | Live production | Real customer data | Auto on push to `main` | Immediate rollback | Full monitoring + alerts |

---

## 2. Git Branching Strategy

### GitFlow Model (Recommended)

```
main (PROD)
├── uat (UAT)
│   ├── develop (DEV)
│   │   ├── feature/user-authentication
│   │   ├── feature/product-catalog
│   │   ├── feature/checkout-flow
│   │   └── ...
│   └── release/v1.2.0
└── hotfix/critical-bug-fix
```

### Branch Definitions

#### **1. `main` - Production Branch**
- **Purpose:** Production-ready code only
- **Deploys to:** PROD (Vercel Production)
- **Protected:** Yes (require PR reviews)
- **Auto-deploy:** Yes
- **Lifetime:** Permanent

**Rules:**
- ❌ Never commit directly to `main`
- ✅ Only merge from `uat` or `hotfix/*`
- ✅ All merges require PR approval
- ✅ Must pass all CI checks
- ✅ Tagged with version numbers (v1.0.0, v1.1.0, etc.)

#### **2. `uat` - User Acceptance Testing Branch**
- **Purpose:** Pre-production testing and validation
- **Deploys to:** UAT (Vercel Preview)
- **Protected:** Yes (require PR reviews)
- **Auto-deploy:** Yes
- **Lifetime:** Permanent

**Rules:**
- ❌ Never commit directly to `uat`
- ✅ Only merge from `develop` or `hotfix/*`
- ✅ Must pass QA testing before promoting to `main`
- ✅ Production-like configuration

#### **3. `develop` - Development Integration Branch**
- **Purpose:** Integration of all features
- **Deploys to:** DEV (Vercel Preview)
- **Protected:** Optional (recommended for teams)
- **Auto-deploy:** Yes
- **Lifetime:** Permanent

**Rules:**
- ❌ Avoid direct commits (use feature branches)
- ✅ Merge from `feature/*` branches
- ✅ Must be stable (all tests pass)
- ✅ Reset point if integration fails

#### **4. `feature/*` - Feature Development Branches**
- **Purpose:** Develop new features in isolation
- **Deploys to:** LOCAL only (or optional preview)
- **Protected:** No
- **Auto-deploy:** No (unless configured)
- **Lifetime:** Temporary (delete after merge)

**Naming Convention:**
```bash
feature/product-categories
feature/wishlist-functionality
feature/ai-assistant-integration
feature/bulk-operations
```

**Rules:**
- ✅ Branch from `develop`
- ✅ One feature per branch
- ✅ Regularly sync with `develop` (rebase or merge)
- ✅ Delete after merging to `develop`

#### **5. `hotfix/*` - Critical Production Fixes**
- **Purpose:** Emergency fixes for production issues
- **Deploys to:** PROD (after merge to `main`)
- **Protected:** No
- **Auto-deploy:** After merge
- **Lifetime:** Temporary (delete after merge)

**Naming Convention:**
```bash
hotfix/payment-gateway-timeout
hotfix/authentication-loop
```

**Rules:**
- ✅ Branch from `main`
- ✅ Merge to both `main` AND `uat`/`develop`
- ✅ Increment patch version (v1.0.0 → v1.0.1)
- ✅ Delete after merging

#### **6. `release/*` - Release Preparation (Optional)**
- **Purpose:** Prepare for production release
- **Deploys to:** UAT
- **Protected:** Optional
- **Auto-deploy:** Yes
- **Lifetime:** Temporary

**Naming Convention:**
```bash
release/v1.2.0
```

**Rules:**
- ✅ Branch from `develop`
- ✅ Only bug fixes allowed (no new features)
- ✅ Merge to both `main` and `develop`
- ✅ Delete after release

---

## 3. Vercel Environment Setup

### Step 1: Create Git Branches

```bash
# Create develop branch
git checkout -b develop
git push -u origin develop

# Create UAT branch
git checkout -b uat
git push -u origin uat

# Return to main
git checkout main
```

### Step 2: Configure Vercel Projects

**Option A: Single Project, Multiple Environments (Recommended)**

1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Configure branch deployments:

```
Production Branch: main
→ Deploys to: https://simple-todo.vercel.app (PROD)

Preview Branches:
- uat → https://simple-todo-git-uat.vercel.app (UAT)
- develop → https://simple-todo-git-develop.vercel.app (DEV)
```

**Option B: Separate Projects (Better Isolation)**

1. **Project 1: simple-todo-dev**
   - Connected to `develop` branch
   - Production domain: `simple-todo-dev.vercel.app`

2. **Project 2: simple-todo-uat**
   - Connected to `uat` branch
   - Production domain: `simple-todo-uat.vercel.app`

3. **Project 3: simple-todo** (existing)
   - Connected to `main` branch
   - Production domain: `simple-todo.vercel.app`

### Step 3: Vercel CLI Configuration

```bash
# Link to specific environment
vercel link

# Deploy to specific environment
vercel --prod                    # Production (main)
vercel --target preview          # Preview (develop/uat)

# Environment-specific deployment
vercel --prod --scope=simple-todo-dev
vercel --prod --scope=simple-todo-uat
vercel --prod --scope=simple-todo
```

---

## 4. Database Strategy

### Multi-Database Approach (Recommended)

Create separate Neon database branches for each environment:

```
Neon Project: twophase-education

Branches:
├── main (PROD)        → PostgreSQL production database
├── uat (UAT)          → PostgreSQL UAT database (copy of prod data)
├── develop (DEV)      → PostgreSQL dev database (synthetic data)
└── local (LOCAL)      → Docker PostgreSQL
```

### Neon Database Branch Setup

```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Create dev database branch
neonctl branches create --name develop --parent main

# Create UAT database branch
neonctl branches create --name uat --parent main

# Get connection strings
neonctl connection-string develop
neonctl connection-string uat
neonctl connection-string main
```

### Environment Variable Mapping

| Environment | Database Branch | Connection String Variable |
|-------------|-----------------|---------------------------|
| LOCAL | Docker PostgreSQL | `DATABASE_URL` (local) |
| DEV | Neon `develop` | `POSTGRES_URL` (Vercel) |
| UAT | Neon `uat` | `POSTGRES_URL` (Vercel) |
| PROD | Neon `main` | `POSTGRES_URL` (Vercel) |

### Database Promotion Strategy

```bash
# Promote UAT data to PROD (manual, careful!)
neonctl branches restore --branch main --source uat --preserve

# Sync PROD schema to UAT (for testing migrations)
pg_dump $PROD_URL --schema-only | psql $UAT_URL

# Reset DEV database (start fresh)
neonctl branches delete develop
neonctl branches create --name develop --parent main
```

---

## 5. Deployment Workflow

### Development Workflow

```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/product-wishlist

# 2. Develop locally
npm run dev
# Make changes, test locally

# 3. Commit changes
git add .
git commit -m "feat: add wishlist functionality"

# 4. Push to remote (triggers preview deployment if configured)
git push -u origin feature/product-wishlist

# 5. Create Pull Request to develop
gh pr create --base develop --head feature/product-wishlist \
  --title "Add wishlist functionality" \
  --body "Implements user wishlist with localStorage and DB sync"

# 6. After PR approval, merge
gh pr merge --squash

# 7. Delete feature branch
git branch -d feature/product-wishlist
git push origin --delete feature/product-wishlist
```

### DEV → UAT Promotion

```bash
# 1. Ensure develop is stable
git checkout develop
npm run type-check && npm run lint && npm run test && npm run build

# 2. Create PR from develop to UAT
git checkout uat
git pull origin uat

gh pr create --base uat --head develop \
  --title "Promote develop to UAT - $(date +%Y-%m-%d)" \
  --body "Promoting tested features from develop to UAT for acceptance testing"

# 3. After approval, merge
gh pr merge --merge  # Use merge commit for traceability

# 4. Verify UAT deployment
curl -I https://simple-todo-git-uat.vercel.app
```

### UAT → PROD Promotion

```bash
# 1. Ensure UAT passes all tests
# - Manual QA testing
# - User acceptance testing
# - Performance testing
# - Security scanning

# 2. Create release PR from UAT to main
git checkout main
git pull origin main

gh pr create --base main --head uat \
  --title "Release v1.2.0 to Production" \
  --body "$(cat <<'EOF'
## Release Summary
- Feature: Product wishlist functionality
- Feature: Recently viewed products
- Fix: Image loading on product pages

## Testing
- [x] All automated tests pass
- [x] UAT environment validated
- [x] Performance benchmarks met
- [x] Security scan completed

## Rollback Plan
Vercel deployment: simple-todo-abc123.vercel.app (previous)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 3. After approval, merge
gh pr merge --merge

# 4. Tag release
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0: Wishlist and Recently Viewed"
git push origin v1.2.0

# 5. Monitor production
vercel logs --follow
# Check error rates, response times, etc.
```

### Hotfix Workflow

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/payment-timeout

# 2. Fix the issue
# Edit code, test locally

# 3. Commit fix
git add .
git commit -m "fix: resolve payment gateway timeout issue"

# 4. Deploy to main (PROD)
gh pr create --base main --head hotfix/payment-timeout \
  --title "HOTFIX: Payment gateway timeout" \
  --body "Critical fix for payment processing timeout"

gh pr merge --squash

# 5. Backport to UAT and develop
git checkout uat
git pull origin uat
git merge hotfix/payment-timeout
git push origin uat

git checkout develop
git pull origin develop
git merge hotfix/payment-timeout
git push origin develop

# 6. Tag hotfix release
git checkout main
git pull origin main
git tag -a v1.2.1 -m "Hotfix v1.2.1: Payment timeout fix"
git push origin v1.2.1

# 7. Delete hotfix branch
git branch -d hotfix/payment-timeout
git push origin --delete hotfix/payment-timeout
```

---

## 6. Environment Variables

### Vercel Environment Configuration

Each Vercel environment (DEV/UAT/PROD) needs separate variables:

**Environment-Specific Variables:**

| Variable | LOCAL | DEV (develop) | UAT (uat) | PROD (main) |
|----------|-------|---------------|-----------|-------------|
| `NODE_ENV` | development | development | production | production |
| `NEXTAUTH_URL` | http://localhost:3000 | https://...-git-develop.vercel.app | https://...-git-uat.vercel.app | https://simple-todo.vercel.app |
| `POSTGRES_URL` | postgresql://postgres:postgres@localhost:5432/twophase_education_dev | postgresql://...@...neon.tech/dev | postgresql://...@...neon.tech/uat | postgresql://...@...neon.tech/prod |
| `GEMINI_API_KEY` | dev_key | dev_key | prod_key | prod_key |
| `STRIPE_SECRET_KEY` | sk_test_... | sk_test_... | sk_test_... | sk_live_... |

### Setting Environment Variables via Vercel CLI

```bash
# Set DEV environment variables (for develop branch)
vercel env add POSTGRES_URL development
# Enter value: postgresql://user:pass@ep-xxx.neon.tech/develop

vercel env add NEXTAUTH_URL development
# Enter value: https://simple-todo-git-develop.vercel.app

# Set UAT environment variables (for uat branch)
vercel env add POSTGRES_URL preview uat
# Enter value: postgresql://user:pass@ep-xxx.neon.tech/uat

vercel env add NEXTAUTH_URL preview uat
# Enter value: https://simple-todo-git-uat.vercel.app

# Set PROD environment variables (for main branch)
vercel env add POSTGRES_URL production
# Enter value: postgresql://user:pass@ep-xxx.neon.tech/main

vercel env add NEXTAUTH_URL production
# Enter value: https://simple-todo.vercel.app
```

### Environment Variable Script

Create `scripts/setup-env.sh`:

```bash
#!/bin/bash

ENV=$1  # dev, uat, or prod

case $ENV in
  dev)
    vercel env add POSTGRES_URL development < ./env-configs/dev.env
    vercel env add NEXTAUTH_URL development < ./env-configs/dev-url.env
    ;;
  uat)
    vercel env add POSTGRES_URL preview < ./env-configs/uat.env
    vercel env add NEXTAUTH_URL preview < ./env-configs/uat-url.env
    ;;
  prod)
    vercel env add POSTGRES_URL production < ./env-configs/prod.env
    vercel env add NEXTAUTH_URL production < ./env-configs/prod-url.env
    ;;
  *)
    echo "Usage: ./setup-env.sh [dev|uat|prod]"
    exit 1
    ;;
esac
```

---

## 7. Promotion Process

### Data Promotion Strategy

**Schema Promotion (Code-based):**
```bash
# 1. Develop schema changes locally
npm run db:generate
git add drizzle/postgres/
git commit -m "feat: add categories table"
git push origin feature/categories

# 2. Merge to develop → auto-deploy to DEV
# 3. DEV database migrations run automatically via Vercel build

# 4. Promote to UAT
git checkout uat
git merge develop
git push origin uat
# UAT database migrations run automatically

# 5. Promote to PROD
git checkout main
git merge uat
git push origin main
# PROD database migrations run automatically
```

**Data Promotion (Manual, Careful!):**

```bash
# Export products from PROD
pg_dump $PROD_URL -t products --data-only > prod-products.sql

# Import to UAT (for testing)
psql $UAT_URL < prod-products.sql

# Import to DEV (for development)
psql $DEV_URL < prod-products.sql
```

### Configuration Promotion

Create environment-specific config files:

```
config/
├── development.json   # DEV settings
├── uat.json          # UAT settings
└── production.json   # PROD settings
```

Load config based on environment:
```typescript
// src/config/index.ts
const env = process.env.NODE_ENV || 'development'
const config = require(`./config/${env}.json`)

export default config
```

---

## 8. Best Practices & Guardrails

### Branch Protection Rules

**GitHub Settings → Branches → Branch protection rules:**

#### **For `main` (PROD):**
- [x] Require pull request reviews before merging (2 approvals)
- [x] Require status checks to pass before merging
  - [x] build
  - [x] type-check
  - [x] lint
  - [x] test
- [x] Require branches to be up to date before merging
- [x] Include administrators
- [x] Require linear history (squash merges only)
- [x] Do not allow bypassing the above settings

#### **For `uat`:**
- [x] Require pull request reviews before merging (1 approval)
- [x] Require status checks to pass before merging
  - [x] build
  - [x] type-check
  - [x] lint
  - [x] test
- [x] Require branches to be up to date before merging

#### **For `develop`:**
- [x] Require status checks to pass before merging
  - [x] build
  - [x] type-check
  - [x] lint
  - [x] test

### CI/CD Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main, uat, develop]
  push:
    branches: [main, uat, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

      - name: Database migration check
        run: npm run db:generate

      - name: Check for uncommitted migrations
        run: |
          if [[ -n $(git status -s drizzle/) ]]; then
            echo "Error: Uncommitted migrations found"
            exit 1
          fi
```

### Pre-commit Hooks

Update `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Check for uncommitted migrations
if git diff --cached --name-only | grep -q "src/db/schema-pg.ts"; then
  echo "⚠️  Schema changes detected. Generating migrations..."
  npm run db:generate

  if [[ -n $(git status -s drizzle/) ]]; then
    echo "✅ Migrations generated. Please review and stage them:"
    git status drizzle/
    exit 1
  fi
fi
```

### Deployment Checklist

**Before promoting to PROD:**

- [ ] All automated tests pass in UAT
- [ ] Manual QA testing completed
- [ ] Performance benchmarks met
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Database migrations tested in UAT
- [ ] Environment variables verified
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured
- [ ] Stakeholders notified of deployment
- [ ] Changelog updated
- [ ] Documentation updated

### Rollback Procedures

**Immediate Rollback (Vercel):**
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or via Vercel dashboard
# Go to Deployments → Click three dots → Promote to Production
```

**Code Rollback (Git):**
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or hard reset (use with caution!)
git reset --hard HEAD~1
git push origin main --force
```

**Database Rollback:**
```bash
# Neon time travel (restore to point in time)
neonctl branches restore --branch main --timestamp "2025-10-04T12:00:00Z"

# Or from backup
pg_restore -d $POSTGRES_URL backup-20251004.dump
```

### Monitoring & Alerts

**Vercel Monitoring:**
- Enable Vercel Analytics
- Set up log drains to external service
- Configure deployment notifications (Slack/email)

**Application Monitoring:**
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const start = Date.now()

  // Track request
  const response = NextResponse.next()

  // Log performance
  const duration = Date.now() - start
  if (duration > 1000) {
    console.warn(`Slow request: ${request.url} took ${duration}ms`)
  }

  return response
}
```

---

## Quick Command Reference

### Branch Operations
```bash
# Create feature branch
git checkout -b feature/my-feature develop

# Update feature branch with latest develop
git checkout feature/my-feature
git pull origin develop --rebase

# Merge feature to develop
git checkout develop
git merge --no-ff feature/my-feature
git push origin develop
```

### Environment Promotion
```bash
# Promote develop → UAT
gh pr create --base uat --head develop --title "Promote to UAT"

# Promote UAT → PROD
gh pr create --base main --head uat --title "Release to Production"
```

### Vercel Deployments
```bash
# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url] --follow

# Rollback
vercel rollback [deployment-url]
```

### Database Operations
```bash
# Create Neon branch
neonctl branches create --name [branch-name]

# List branches
neonctl branches list

# Get connection string
neonctl connection-string [branch-name]
```

---

## Migration Guide: Single Branch → Multi-Environment

### Step-by-Step Migration

**Phase 1: Create Branches**
```bash
# 1. Ensure main is clean
git checkout main
git pull origin main

# 2. Create develop from main
git checkout -b develop
git push -u origin develop

# 3. Create UAT from main
git checkout main
git checkout -b uat
git push -u origin uat

# 4. Return to main
git checkout main
```

**Phase 2: Configure Vercel**
```bash
# 1. Update Vercel project settings
vercel
# Select production branch: main
# Add preview branches: develop, uat

# 2. Set environment variables for each environment
# (See section 6 above)
```

**Phase 3: Create Database Branches**
```bash
# 1. Create Neon branches
neonctl branches create --name develop --parent main
neonctl branches create --name uat --parent main

# 2. Get connection strings
neonctl connection-string develop
neonctl connection-string uat

# 3. Update Vercel environment variables
vercel env add POSTGRES_URL development
vercel env add POSTGRES_URL preview
```

**Phase 4: Update Documentation**
```bash
# 1. Update README with new workflow
# 2. Update deployment guide
# 3. Add this document to repository
git add .
git commit -m "docs: add multi-environment SDLC strategy"
git push origin main
```

**Phase 5: Enable Branch Protection**
```bash
# Go to GitHub → Settings → Branches
# Add protection rules for main, uat, develop
# (See section 8 above)
```

---

## Troubleshooting

### Issue: Wrong Environment Variables
**Symptom:** App uses wrong database
**Solution:**
```bash
# Check current env vars
vercel env ls

# Pull environment-specific vars
vercel env pull .env.development
vercel env pull .env.uat
vercel env pull .env.production

# Compare and fix discrepancies
```

### Issue: Migration Conflicts
**Symptom:** Database migration fails in UAT/PROD
**Solution:**
```bash
# Test migration locally first
npm run db:generate
npm run db:push  # Test on local DB

# Review generated SQL
cat drizzle/postgres/[latest].sql

# Apply to DEV database first
# Then UAT, then PROD
```

### Issue: Deployment Stuck
**Symptom:** Vercel deployment doesn't trigger
**Solution:**
```bash
# Check Vercel Git integration
vercel git ls

# Re-link repository
vercel link

# Force deployment
vercel --force
```

---

## Summary

### Environment Flow
```
LOCAL → feature/* → develop (DEV) → uat (UAT) → main (PROD)
```

### Key Principles
1. ✅ **Never commit directly to main, uat, or develop**
2. ✅ **Always use feature branches for development**
3. ✅ **Test in DEV before promoting to UAT**
4. ✅ **Validate in UAT before promoting to PROD**
5. ✅ **Tag all production releases**
6. ✅ **Document all migrations and breaking changes**
7. ✅ **Have a rollback plan for every deployment**

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Next Review:** After implementing multi-environment setup
