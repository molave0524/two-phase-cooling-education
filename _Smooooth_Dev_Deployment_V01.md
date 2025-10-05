# Smooooth Dev & Deployment Guide V01

> **Purpose:** Ensure consistent development practices and eliminate deployment friction between local and Vercel environments.

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Database Consistency Standards](#2-database-consistency-standards)
3. [Environment Variables Management](#3-environment-variables-management)
4. [Pre-Deployment Checklist](#4-pre-deployment-checklist)
5. [Deployment Process](#5-deployment-process)
6. [Post-Deployment Verification](#6-post-deployment-verification)
7. [Troubleshooting Guide](#7-troubleshooting-guide)
8. [Emergency Rollback](#8-emergency-rollback)

---

## 1. Development Environment Setup

### 1.1 Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd simple-todo

# Install dependencies (use npm, not pnpm despite package.json)
npm install

# Copy environment template
cp .env.example .env.local

# Configure local environment variables (see section 3)
# Edit .env.local with your values
```

### 1.2 Required Tools

- **Node.js**: v22.x (specified in package.json engines)
- **npm**: >=8.0.0
- **PostgreSQL**: 14+ (local Docker or native)
- **Vercel CLI**: `npm i -g vercel`

### 1.3 Local Database Setup

```bash
# Option A: Docker PostgreSQL (recommended)
docker run -d \
  --name twophase-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=twophase_education_dev \
  -p 5432:5432 \
  postgres:14-alpine

# Option B: Native PostgreSQL
# Install PostgreSQL and create database
createdb twophase_education_dev

# Verify connection
psql postgresql://postgres:postgres@localhost:5432/twophase_education_dev -c "\dt"
```

### 1.4 Initial Database Migration

```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations
npm run db:push

# (Optional) Seed with sample data
npm run db:seed

# Verify with Drizzle Studio
npm run db:studio
```

---

## 2. Database Consistency Standards

### 2.1 Database Architecture

**Current Setup:**
- **Local Development**: PostgreSQL via `postgres-js` driver
- **Vercel Production**: PostgreSQL via `@neondatabase/serverless` driver
- **Schema File**: `src/db/schema-pg.ts` (single source of truth)
- **Connection Logic**: `src/db/index.ts` (environment-aware)

### 2.2 Schema Management Rules

**DO:**
- ✅ Always modify `src/db/schema-pg.ts` only
- ✅ Run `npm run db:generate` after schema changes
- ✅ Commit generated migrations to git
- ✅ Test migrations locally before deploying
- ✅ Use `drizzle-kit push` for dev, `migrate` for production

**DON'T:**
- ❌ Never manually edit migration files
- ❌ Don't use `schema.ts` (legacy SQLite schema)
- ❌ Don't skip migration generation
- ❌ Don't apply untested migrations to production

### 2.3 Pre-Commit Schema Checks

```bash
# Before committing schema changes
npm run db:generate          # Generate migrations
git add drizzle/postgres/    # Stage migrations
npm run type-check           # Verify TypeScript
npm run build               # Ensure build succeeds
```

---

## 3. Environment Variables Management

### 3.1 Required Variables by Environment

#### **Local Development (.env.local)**

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/twophase_education_dev"

# Auth (use openssl rand -base64 32)
NEXTAUTH_SECRET="<generate-with-openssl>"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (optional for local dev)
GOOGLE_CLIENT_ID="<from-google-console>"
GOOGLE_CLIENT_SECRET="<from-google-console>"
GITHUB_CLIENT_ID="<from-github-settings>"
GITHUB_CLIENT_SECRET="<from-github-settings>"

# AI Services (optional)
GEMINI_API_KEY="<your-gemini-key>"

# Development
NODE_ENV="development"
```

#### **Vercel Production (Environment Variables)**

```env
# Database (Neon)
POSTGRES_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
DATABASE_URL="<same-as-postgres-url>"

# Auth
NEXTAUTH_SECRET="<same-strong-secret>"
NEXTAUTH_URL="https://your-app.vercel.app"

# OAuth (production credentials)
GOOGLE_CLIENT_ID="<production-google-id>"
GOOGLE_CLIENT_SECRET="<production-google-secret>"
GITHUB_CLIENT_ID="<production-github-id>"
GITHUB_CLIENT_SECRET="<production-github-secret>"

# AI Services
GEMINI_API_KEY="<production-key>"

# Environment
NODE_ENV="production"
VERCEL="1"
```

### 3.2 Environment Variable Validation

**Before Development:**
```bash
# Check local env file exists
test -f .env.local && echo "✅ .env.local exists" || echo "❌ Missing .env.local"

# Verify required variables
node -e "
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
required.forEach(key => {
  console.log(process.env[key] ? \`✅ \${key}\` : \`❌ Missing \${key}\`);
});
"
```

**Before Deployment:**
```bash
# List Vercel environment variables
vercel env ls

# Pull production env to compare
vercel env pull .env.vercel.production

# Compare with local
diff <(grep -oE '^[A-Z_]+=' .env.local | sort) \
     <(grep -oE '^[A-Z_]+=' .env.vercel.production | sort)
```

### 3.3 Adding New Environment Variables

1. Add to `.env.example` with description
2. Add to `.env.local` with actual value
3. Add to Vercel dashboard (`vercel env add <KEY>`)
4. Document in this guide
5. Update `vercel.json` if needed for build-time variables

---

## 4. Pre-Deployment Checklist

### 4.1 Code Quality Gates

```bash
# Run all checks before committing
npm run type-check           # TypeScript validation
npm run lint                # ESLint checks
npm run test                # Jest tests
npm run build               # Production build test
```

**All must pass with zero errors.**

### 4.2 Database Health Check

```bash
# Verify schema is current
npm run db:generate

# Check for pending migrations
git status drizzle/

# Test database connection
npm run db:studio

# Verify migration history
node -e "
const { db } = require('./src/db');
db.select().from('__drizzle_migrations').then(console.log);
"
```

### 4.3 Dependency Audit

```bash
# Check for version conflicts
npm ls drizzle-orm next next-auth

# Security audit
npm audit --production

# Verify lockfile is current
git diff package-lock.json
```

### 4.4 Git Hygiene

```bash
# Verify no sensitive files staged
git status --ignored

# Check .gitignore coverage
cat .gitignore | grep -E "(\.env|\.db|node_modules)"

# Ensure clean working tree
git status --short

# Verify on correct branch
git branch --show-current
```

---

## 5. Deployment Process

### 5.1 Pre-Deployment Steps

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop & Test Locally**
   ```bash
   npm run dev                    # Start dev server
   # Test thoroughly at http://localhost:3000
   ```

3. **Run Full Quality Check**
   ```bash
   npm run type-check && \
   npm run lint && \
   npm run test && \
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   ```

5. **Merge to Main**
   ```bash
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

### 5.2 Deployment to Vercel

**Option A: Automatic Deployment**
- Push to `main` branch triggers automatic Vercel deployment
- Monitor deployment at https://vercel.com/dashboard

**Option B: Manual Deployment**
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# With specific environment
vercel --prod --env VARIABLE=value
```

### 5.3 Database Migration on Production

```bash
# IMPORTANT: Test migration locally first!
npm run db:push  # Local test

# For production, use Vercel CLI
vercel env pull
# Review migration SQL in drizzle/postgres/
# Apply via Vercel dashboard or migration script
```

**⚠️ Production Migration Safety:**
- Always backup production database before migrations
- Test migrations on staging environment first
- Use transactions for reversible migrations
- Have rollback plan ready

---

## 6. Post-Deployment Verification

### 6.1 Immediate Health Checks

```bash
# Check deployment status
vercel ls

# View latest logs
vercel logs --follow

# Test production URL
curl -I https://your-app.vercel.app

# Test API endpoints
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/auth/providers
```

### 6.2 Functional Testing

**Manual Checks:**
- [ ] Homepage loads without errors
- [ ] Authentication flow works (login/logout)
- [ ] Database queries execute successfully
- [ ] API routes respond correctly
- [ ] No console errors in browser DevTools
- [ ] OAuth providers work (Google/GitHub)
- [ ] Protected routes require authentication

### 6.3 Performance Monitoring

```bash
# Check Vercel Analytics
# Visit: https://vercel.com/<team>/<project>/analytics

# Monitor error rate
# Visit: https://vercel.com/<team>/<project>/logs

# Check build logs
vercel logs --build
```

---

## 7. Troubleshooting Guide

### 7.1 Common Issues & Solutions

#### **Issue: Database Connection Fails on Vercel**

**Symptoms:**
- `ECONNREFUSED` errors
- `getaddrinfo ENOTFOUND` errors

**Solution:**
```bash
# Verify environment variable exists
vercel env ls | grep DATABASE_URL

# Check connection string format
vercel env pull
cat .env.production.local | grep POSTGRES_URL

# Ensure using Neon serverless driver
# Check src/db/index.ts uses @neondatabase/serverless when VERCEL=1
```

#### **Issue: Schema Mismatch Between Local & Production**

**Symptoms:**
- SQL errors about missing columns/tables
- Type errors after deployment

**Solution:**
```bash
# Compare local and production schemas
npm run db:generate
git diff drizzle/postgres/

# Force push schema to production (CAUTION: data loss risk)
# npm run db:push  # Only for dev/staging
```

#### **Issue: Environment Variables Not Loading**

**Symptoms:**
- `undefined` values in runtime
- Auth errors, API failures

**Solution:**
```bash
# Verify in Vercel dashboard
vercel env ls

# Pull and inspect
vercel env pull .env.vercel.check
cat .env.vercel.check

# Re-add missing variables
vercel env add MISSING_VAR
```

#### **Issue: Build Fails on Vercel**

**Symptoms:**
- Deployment fails during build step
- TypeScript or lint errors in logs

**Solution:**
```bash
# Reproduce locally
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Check Vercel build logs
vercel logs --build

# Verify Node version matches
node -v  # Should be 22.x
cat vercel.json | grep node
```

### 7.2 Database Debugging

```bash
# Test local database connection
psql $DATABASE_URL -c "SELECT version();"

# Test production database (READ-ONLY)
psql $POSTGRES_URL -c "\dt"

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM __drizzle_migrations;"

# Inspect specific table
psql $DATABASE_URL -c "\d+ users"
```

### 7.3 Vercel-Specific Debugging

```bash
# Check deployment details
vercel inspect <deployment-url>

# Download deployment logs
vercel logs <deployment-url> --output logs.txt

# Check function execution
vercel logs --since 1h

# Review environment variables
vercel env ls --environment production
```

---

## 8. Emergency Rollback

### 8.1 Immediate Rollback

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback <deployment-url>
```

### 8.2 Code Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or hard reset (use with caution)
git reset --hard HEAD~1
git push origin main --force
```

### 8.3 Database Rollback

**⚠️ Database rollbacks are complex. Prevention is key!**

```bash
# If you have backup
pg_restore -d $DATABASE_URL /path/to/backup.dump

# If migration was recent
# Manually revert using down migration (if exists)
psql $DATABASE_URL < drizzle/postgres/down.sql
```

**Best Practice:** Always backup before migrations:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

---

## 9. Best Practices Summary

### Development Workflow

1. ✅ **Always work on feature branches**
2. ✅ **Test locally before pushing**
3. ✅ **Run full quality checks before committing**
4. ✅ **Keep .env.local in sync with .env.example**
5. ✅ **Commit migrations with schema changes**

### Database Management

1. ✅ **Single schema file** (`schema-pg.ts`)
2. ✅ **Generate migrations** after every schema change
3. ✅ **Test migrations locally** before production
4. ✅ **Backup production database** before migrations
5. ✅ **Use environment-aware connection** logic

### Deployment

1. ✅ **Verify environment variables** before deploying
2. ✅ **Monitor deployment logs** in real-time
3. ✅ **Test production immediately** after deployment
4. ✅ **Have rollback plan ready**
5. ✅ **Document any manual steps required**

---

## 10. Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run db:studio             # Open database GUI
npm run db:seed               # Seed database

# Quality Checks
npm run type-check            # TypeScript validation
npm run lint                  # ESLint
npm run test                  # Jest tests
npm run build                 # Production build

# Database
npm run db:generate           # Generate migrations
npm run db:push              # Push schema to DB
npm run db:migrate           # Run migrations

# Deployment
vercel                        # Preview deployment
vercel --prod                # Production deployment
vercel logs --follow         # Monitor logs
vercel env ls                # List env vars
vercel rollback              # Emergency rollback

# Git
git status                    # Check status
git diff                      # View changes
git add .                     # Stage all
git commit -m "message"       # Commit
git push origin main          # Push to main
```

---

## 11. Contacts & Resources

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Database (Neon)**: https://neon.tech/dashboard
- **Repository**: [Add your repo URL]
- **Documentation**: [Add docs URL]

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| V01 | 2025-10-04 | Initial guide creation | James (Dev Agent) |

---

**Last Updated:** 2025-10-04
**Maintained By:** Development Team
**Next Review:** [Add date]
