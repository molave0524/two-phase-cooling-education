# Multi-Environment Setup - COMPLETE ✅

**Date:** 2025-10-04
**Status:** Infrastructure Ready
**Next Steps:** Database branch setup and Vercel configuration

---

## What's Been Completed

### ✅ Git Branch Structure
```
main (PROD)     ← Production deployments
├── uat (UAT)   ← User acceptance testing
└── develop (DEV) ← Development integration
```

**All branches pushed to GitHub:**
- https://github.com/molave0524/two-phase-cooling-education/tree/main
- https://github.com/molave0524/two-phase-cooling-education/tree/uat
- https://github.com/molave0524/two-phase-cooling-education/tree/develop

### ✅ CI/CD Pipeline
- GitHub Actions workflow created (`.github/workflows/ci.yml`)
- Runs on PRs and pushes to main/uat/develop
- Automated checks:
  - Type checking
  - Linting
  - Testing
  - Build verification
  - Migration validation

### ✅ Documentation
- **20251004_multi_environment_sdlc_strategy.md** - Complete SDLC guide
- **20251004_deployment_guide_compliance_audit.md** - Compliance audit (95/100)
- **20251004_product_catalog_improvements.md** - Feature roadmap
- **_Smooooth_Dev_Deployment_V01.md** - Deployment guide

---

## Manual Steps Required

### 1. Configure Vercel Environments

**Option A: Single Project (Recommended)**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Git**

2. Configure branch deployments:
   ```
   Production Branch: main
   → https://simple-todo.vercel.app (PROD)

   Preview Branches (add both):
   - develop → https://simple-todo-git-develop.vercel.app (DEV)
   - uat → https://simple-todo-git-uat.vercel.app (UAT)
   ```

3. **Enable automatic deployments** for all branches

**Option B: Separate Projects (Better Isolation)**

Create 3 separate Vercel projects:
- `simple-todo-dev` (connected to `develop`)
- `simple-todo-uat` (connected to `uat`)
- `simple-todo` (connected to `main`)

---

### 2. Set Up Neon Database Branches

#### Install Neon CLI
```bash
npm install -g neonctl
neonctl auth
```

#### Create Database Branches
```bash
# Create DEV database
neonctl branches create --name develop --parent main

# Create UAT database
neonctl branches create --name uat --parent main

# Get connection strings
neonctl connection-string main       # PROD
neonctl connection-string uat        # UAT
neonctl connection-string develop    # DEV
```

---

### 3. Configure Environment Variables in Vercel

#### For DEV Environment (develop branch)
```bash
vercel env add POSTGRES_URL development
# Paste: postgresql://...@...neon.tech/develop

vercel env add NEXTAUTH_URL development
# Enter: https://simple-todo-git-develop.vercel.app

vercel env add NODE_ENV development
# Enter: development
```

#### For UAT Environment (uat branch)
```bash
vercel env add POSTGRES_URL preview
# Paste: postgresql://...@...neon.tech/uat

vercel env add NEXTAUTH_URL preview
# Enter: https://simple-todo-git-uat.vercel.app

vercel env add NODE_ENV preview
# Enter: production
```

#### For PROD Environment (main branch)
```bash
vercel env add POSTGRES_URL production
# Paste: postgresql://...@...neon.tech/main

vercel env add NEXTAUTH_URL production
# Enter: https://simple-todo.vercel.app

vercel env add NODE_ENV production
# Enter: production
```

**Copy all other environment variables** (GEMINI_API_KEY, GOOGLE_CLIENT_ID, etc.) to each environment.

---

### 4. Configure GitHub Branch Protection

Go to **GitHub** → **Settings** → **Branches** → **Add branch protection rule**

#### For `main` (PROD):
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging (2 approvals)
- ✅ Require status checks to pass:
  - `test`
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Require linear history

#### For `uat`:
- Branch name pattern: `uat`
- ✅ Require pull request reviews before merging (1 approval)
- ✅ Require status checks to pass:
  - `test`
- ✅ Require branches to be up to date

#### For `develop`:
- Branch name pattern: `develop`
- ✅ Require status checks to pass:
  - `test`

---

## Development Workflow (How to Use)

### Creating a New Feature

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/wishlist-functionality

# 3. Develop locally
npm run dev
# Make changes...

# 4. Commit and push
git add .
git commit -m "feat: add wishlist functionality"
git push -u origin feature/wishlist-functionality

# 5. Create PR to develop
gh pr create --base develop --head feature/wishlist-functionality

# 6. After approval, merge
# GitHub Actions will auto-deploy to DEV environment
```

### Promoting DEV → UAT

```bash
# 1. Ensure develop is stable
git checkout develop
npm run type-check && npm run build

# 2. Create PR from develop to UAT
gh pr create --base uat --head develop \
  --title "Promote to UAT - $(date +%Y-%m-%d)"

# 3. After approval, merge
# Auto-deploys to UAT environment
```

### Promoting UAT → PROD

```bash
# 1. Ensure UAT passes all testing
# - Manual QA ✅
# - User acceptance testing ✅
# - Performance testing ✅

# 2. Create release PR
gh pr create --base main --head uat \
  --title "Release v1.2.0 to Production"

# 3. After approval, merge
# Auto-deploys to PROD environment

# 4. Tag release
git checkout main
git pull
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

---

## Quick Reference

### Branch Flow
```
LOCAL → feature/* → develop (DEV) → uat (UAT) → main (PROD)
```

### Environment URLs (after Vercel setup)
- **DEV:** https://simple-todo-git-develop.vercel.app
- **UAT:** https://simple-todo-git-uat.vercel.app
- **PROD:** https://simple-todo.vercel.app

### Useful Commands
```bash
# Check current branch
git branch --show-current

# List all branches
git branch -a

# View branch deployment status
vercel ls

# View logs for specific environment
vercel logs --follow

# Rollback deployment
vercel rollback [deployment-url]
```

---

## Verification Checklist

### ✅ Completed
- [x] Git branches created (main, uat, develop)
- [x] Branches pushed to GitHub
- [x] CI/CD pipeline configured
- [x] Documentation created
- [x] .gitignore fixed for migrations
- [x] package.json updated for npm

### ⏳ Pending (Manual Steps)
- [ ] Vercel environment configuration
- [ ] Neon database branches created
- [ ] Environment variables set for each environment
- [ ] GitHub branch protection rules enabled
- [ ] Test deployment to DEV
- [ ] Test deployment to UAT
- [ ] Test deployment to PROD

---

## Troubleshooting

### Issue: Branch not deploying to Vercel
**Solution:** Check Vercel Git integration:
```bash
vercel git ls
vercel link  # Re-link if needed
```

### Issue: Environment variables not loading
**Solution:** Verify environment-specific vars:
```bash
vercel env ls
vercel env pull .env.development
vercel env pull .env.uat
vercel env pull .env.production
```

### Issue: Database connection fails
**Solution:** Check Neon connection strings:
```bash
neonctl branches list
neonctl connection-string [branch-name]
```

---

## Next Actions

1. **Immediate (Today):**
   - [ ] Set up Neon database branches
   - [ ] Configure Vercel environments
   - [ ] Set environment variables

2. **Soon (This Week):**
   - [ ] Enable GitHub branch protection
   - [ ] Test full deployment workflow
   - [ ] Deploy test feature to verify pipeline

3. **Ongoing:**
   - [ ] Use feature branches for all development
   - [ ] Follow promotion workflow (DEV → UAT → PROD)
   - [ ] Tag all production releases

---

## Support & Resources

- **Full SDLC Guide:** `20251004_multi_environment_sdlc_strategy.md`
- **Deployment Guide:** `_Smooooth_Dev_Deployment_V01.md`
- **Compliance Audit:** `20251004_deployment_guide_compliance_audit.md`
- **GitHub Repository:** https://github.com/molave0524/two-phase-cooling-education
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Dashboard:** https://neon.tech/dashboard

---

**Setup Status:** 60% Complete (Infrastructure ready, manual configuration pending)
**Last Updated:** 2025-10-04
**Created By:** Development Agent
