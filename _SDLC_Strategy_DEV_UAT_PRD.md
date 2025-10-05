# SDLC Branch & Environment Strategy

**Project:** Two-Phase Cooling Education
**Strategy:** DEV → UAT → PRD
**Version:** 1.0
**Last Updated:** 2025-10-04

---

## Overview

This document defines the Software Development Lifecycle (SDLC) strategy with three environments:
- **DEV** (Development) - Active development & testing
- **UAT** (User Acceptance Testing) - Staging for client review
- **PRD** (Production) - Live production environment

---

## Branch Strategy

### Main Branches

```
main (PRD)           ← Production-ready code
├── uat              ← Staging/UAT environment
│   └── develop      ← Active development
```

### Branch Hierarchy & Flow

1. **`develop`** - Development branch
   - All feature branches merge here first
   - Deployed to DEV environment
   - Continuous integration testing

2. **`uat`** - UAT/Staging branch
   - Created from `develop` when features are ready for testing
   - Deployed to UAT environment
   - Client/stakeholder testing
   - Bug fixes merge back to `develop` first, then to `uat`

3. **`main`** - Production branch
   - Merged from `uat` after UAT approval
   - Deployed to PRD environment
   - Tagged with version numbers
   - Hotfixes only (emergency fixes)

### Supporting Branches

```
feature/*     - New features (branch from: develop, merge to: develop)
bugfix/*      - Bug fixes (branch from: develop, merge to: develop)
hotfix/*      - Production emergency fixes (branch from: main, merge to: main + develop)
release/*     - Release preparation (branch from: develop, merge to: uat then main)
```

---

## Environment Configuration

### DEV Environment (Development)

**Branch:** `develop`
**Deployment:** Vercel (auto-deploy on push to `develop`)
**URL:** `https://your-app-dev.vercel.app`
**Database:** Neon PostgreSQL (DEV instance)

**Purpose:**
- Developer testing
- Feature integration testing
- Automated CI/CD testing
- Breaking changes allowed

**Environment Variables:**
```env
VERCEL_ENV=development
NEXT_PUBLIC_APP_URL=https://your-app-dev.vercel.app
POSTGRES_URL=<neon-dev-connection-string>
DATABASE_URL=<neon-dev-connection-string>
NODE_ENV=development
```

**Deployment Trigger:** Push to `develop` branch

---

### UAT Environment (Staging)

**Branch:** `uat`
**Deployment:** Vercel (auto-deploy on push to `uat`)
**URL:** `https://your-app-uat.vercel.app`
**Database:** Neon PostgreSQL (UAT instance - production mirror)

**Purpose:**
- Client/stakeholder testing
- User acceptance testing
- Performance testing
- Final validation before production
- Production-like environment

**Environment Variables:**
```env
VERCEL_ENV=preview
NEXT_PUBLIC_APP_URL=https://your-app-uat.vercel.app
POSTGRES_URL=<neon-uat-connection-string>
DATABASE_URL=<neon-uat-connection-string>
NODE_ENV=production
```

**Deployment Trigger:** Push to `uat` branch

---

### PRD Environment (Production)

**Branch:** `main`
**Deployment:** Vercel (auto-deploy on push to `main`)
**URL:** `https://your-app.vercel.app` or custom domain
**Database:** Neon PostgreSQL (PRD instance)

**Purpose:**
- Live production environment
- Serving real users
- Highest stability & security
- No breaking changes

**Environment Variables:**
```env
VERCEL_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
POSTGRES_URL=<neon-prod-connection-string>
DATABASE_URL=<neon-prod-connection-string>
NODE_ENV=production
```

**Deployment Trigger:** Push to `main` branch (requires PR approval)

---

## Workflow Examples

### Feature Development Flow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/user-dashboard

# 2. Develop feature
# ... make changes ...

# 3. Commit and push
git add .
git commit -m "feat: add user dashboard"
git push origin feature/user-dashboard

# 4. Create PR to develop
# Review and merge via GitHub

# 5. Automatic deployment to DEV
# Test at https://your-app-dev.vercel.app
```

### UAT Release Flow

```bash
# 1. Ensure develop is stable
git checkout develop
git pull origin develop
npm run type-check && npm run lint && npm run build

# 2. Merge develop to uat
git checkout uat
git pull origin uat
git merge develop
git push origin uat

# 3. Automatic deployment to UAT
# Client testing at https://your-app-uat.vercel.app

# 4. If bugs found, fix in develop first
git checkout develop
git checkout -b bugfix/login-error
# ... fix bug ...
git push origin bugfix/login-error
# PR to develop -> merge -> merge develop to uat again
```

### Production Release Flow

```bash
# 1. UAT approved by client/stakeholders
# 2. Create release branch
git checkout uat
git pull origin uat
git checkout -b release/v1.2.0

# 3. Final version bump & changelog
npm version 1.2.0
# Update CHANGELOG.md

# 4. Merge to main via PR
git push origin release/v1.2.0
# Create PR: release/v1.2.0 -> main
# Require approval + all checks pass

# 5. After merge, tag release
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0: User dashboard feature"
git push origin v1.2.0

# 6. Automatic deployment to PRD
# Live at https://your-app.vercel.app

# 7. Merge main back to develop (keep in sync)
git checkout develop
git merge main
git push origin develop
```

### Hotfix Flow (Production Emergency)

```bash
# 1. Critical bug found in production
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. Fix the issue
# ... fix code ...

# 3. Test locally
npm run type-check && npm run lint && npm run test && npm run build

# 4. Create PR to main (expedited review)
git push origin hotfix/critical-security-fix
# Create PR: hotfix/critical-security-fix -> main
# Fast-track approval process

# 5. After merge to main
# Automatic deployment to PRD

# 6. Backport to develop and uat
git checkout develop
git merge hotfix/critical-security-fix
git push origin develop

git checkout uat
git merge hotfix/critical-security-fix
git push origin uat
```

---

## GitHub Branch Protection Rules

### `main` Branch

- ✅ Require pull request before merging
- ✅ Require approvals: 1 (or 2 for critical systems)
- ✅ Require status checks to pass:
  - TypeScript type-check
  - ESLint
  - Jest tests
  - Vercel build preview
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ❌ Allow force pushes: No
- ❌ Allow deletions: No

### `uat` Branch

- ✅ Require pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass:
  - TypeScript type-check
  - ESLint
  - Jest tests
- ✅ Require conversation resolution before merging
- ❌ Allow force pushes: No
- ❌ Allow deletions: No

### `develop` Branch

- ✅ Require pull request before merging
- ✅ Require status checks to pass:
  - TypeScript type-check
  - ESLint
- ⚠️ Require approvals: 0 (optional: 1 for team collaboration)
- ❌ Allow force pushes: No
- ❌ Allow deletions: No

---

## Vercel Project Setup

### Create Vercel Projects

You'll need **3 separate Vercel projects** or use **environment-specific deployments**:

#### Option A: Single Project (Recommended)

```bash
# Single Vercel project with environment-based deployments
vercel link

# DEV: develop branch
# UAT: uat branch
# PRD: main branch (production)
```

**Vercel Settings:**
- Production Branch: `main`
- Preview Branches: `uat`, `develop`
- Environment Variables: Set per environment (Production/Preview/Development)

#### Option B: Multiple Projects (Alternative)

```bash
# Three separate projects
vercel link --scope your-team --project your-app-dev      # DEV
vercel link --scope your-team --project your-app-uat      # UAT
vercel link --scope your-team --project your-app-prod     # PRD
```

### Vercel Environment Variables Setup

#### Production (main branch)
```bash
vercel env add POSTGRES_URL production
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
# ... add all production secrets
```

#### Preview (uat branch)
```bash
vercel env add POSTGRES_URL preview
vercel env add DATABASE_URL preview
vercel env add NEXTAUTH_SECRET preview
vercel env add NEXTAUTH_URL preview
# ... add all UAT secrets
```

#### Development (develop branch)
```bash
vercel env add POSTGRES_URL development
vercel env add DATABASE_URL development
vercel env add NEXTAUTH_SECRET development
vercel env add NEXTAUTH_URL development
# ... add all dev secrets
```

---

## Database Strategy

### Neon PostgreSQL Instances

Create **3 separate database instances**:

1. **DEV Database**
   - Connection: `postgresql://user:pass@ep-dev-xxx.neon.tech/dbname`
   - Purpose: Development testing, can be reset
   - Backup: Not critical

2. **UAT Database**
   - Connection: `postgresql://user:pass@ep-uat-xxx.neon.tech/dbname`
   - Purpose: Mirrors production, client testing
   - Backup: Daily snapshots

3. **PRD Database**
   - Connection: `postgresql://user:pass@ep-prod-xxx.neon.tech/dbname`
   - Purpose: Live production data
   - Backup: Continuous + daily snapshots

### Migration Strategy

```bash
# DEV: Apply migrations immediately
npm run db:push

# UAT: Apply via migration files
npm run db:generate
git add drizzle/postgres/
git commit -m "chore: add database migration"
# Merge to uat -> migrations auto-apply or manual run

# PRD: Controlled migration
# 1. Test in UAT first
# 2. Backup production database
# 3. Apply migrations during maintenance window
# 4. Monitor for errors
```

---

## CI/CD Pipeline (GitHub Actions)

### Recommended Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [develop, uat, main]
  pull_request:
    branches: [develop, uat, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-uat:
    if: github.ref == 'refs/heads/uat'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Team Guidelines

### For Developers

1. **Always branch from `develop`** for new features
2. **Never push directly** to `uat` or `main`
3. **Test locally** before pushing to `develop`
4. **Write meaningful commit messages** following conventional commits
5. **Update documentation** when adding features

### For QA/Testers

1. **Test in DEV first** before moving to UAT
2. **Report bugs** with clear reproduction steps
3. **Verify fixes** in UAT before approving for production
4. **Document test cases** for regression testing

### For Release Managers

1. **Create release notes** for each UAT/PRD deployment
2. **Coordinate with stakeholders** for UAT approval
3. **Schedule production releases** during low-traffic periods
4. **Monitor deployments** for errors
5. **Maintain changelog** with version history

---

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Git Rollback

```bash
# Revert last commit (creates new commit)
git revert HEAD
git push origin main

# Hard reset (DANGEROUS - use only if necessary)
git reset --hard HEAD~1
git push origin main --force
```

### Database Rollback

```bash
# Restore from backup
pg_restore -d $POSTGRES_URL /path/to/backup.sql

# Or use Neon dashboard to restore snapshot
```

---

## Initial Setup Steps

### 1. Create Branches

```bash
# On main branch
git checkout main
git pull origin main

# Create develop branch
git checkout -b develop
git push origin develop

# Create uat branch
git checkout -b uat
git push origin uat
```

### 2. Setup Vercel Environments

```bash
# Link project
vercel link

# Configure branch deployments in Vercel dashboard:
# - Production: main
# - Preview: uat, develop
```

### 3. Create Neon Databases

1. Go to https://neon.tech
2. Create 3 projects:
   - `your-app-dev`
   - `your-app-uat`
   - `your-app-prod`
3. Copy connection strings to respective Vercel environments

### 4. Apply Branch Protection

1. Go to GitHub → Settings → Branches
2. Add protection rules for `main`, `uat`, `develop`
3. Configure as specified in "Branch Protection Rules" section

### 5. Test Deployment Flow

```bash
# Test DEV
git checkout develop
git commit --allow-empty -m "test: trigger DEV deployment"
git push origin develop

# Test UAT
git checkout uat
git merge develop
git push origin uat

# Verify both deployments succeed
```

---

## Quick Reference

| Environment | Branch | URL | Database | Auto-Deploy | Approval Required |
|------------|--------|-----|----------|-------------|-------------------|
| DEV | `develop` | `*-dev.vercel.app` | Neon DEV | ✅ Yes | ❌ No |
| UAT | `uat` | `*-uat.vercel.app` | Neon UAT | ✅ Yes | ⚠️ Optional |
| PRD | `main` | `*.vercel.app` | Neon PRD | ✅ Yes | ✅ Required |

---

## Support & Questions

For questions about this SDLC strategy, contact:
- **Technical Lead:** [Name/Email]
- **DevOps:** [Name/Email]
- **Project Manager:** [Name/Email]

---

**Document Version:** 1.0
**Next Review:** [Set review date]
