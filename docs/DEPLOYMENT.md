# Deployment Guide

## Environment Strategy

### Branch → Environment Mapping

- `main` → **Production** (auto-deploy on push)
- `develop` → **Preview/DEV** (auto-deploy on push)
- `feature/*` → **Preview** (auto-deploy on push)

### Database Configuration by Environment

| Environment    | Branch    | Database URL        | Vercel Env Var              |
| -------------- | --------- | ------------------- | --------------------------- |
| **Production** | `main`    | `PROD_POSTGRES_URL` | `DATABASE_URL` (Production) |
| **DEV**        | `develop` | `DEV_POSTGRES_URL`  | `DATABASE_URL` (Preview)    |
| **UAT**        | `uat`     | `UAT_POSTGRES_URL`  | `DATABASE_URL` (Preview)    |

## Vercel Dashboard Configuration

### 1. Git Settings

Navigate to: **Project Settings → Git**

- ✅ **Production Branch:** `main` ONLY
- ✅ **Automatic Deployments:** Enabled
- ✅ **Deploy Previews:** Enabled for all branches

### 2. Environment Variables

Navigate to: **Project Settings → Environment Variables**

**For Production (main branch):**

```bash
DATABASE_URL = postgresql://neondb_owner:...@ep-damp-fire-ad4x3c36-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Production
```

**For DEV (develop branch):**

```bash
DATABASE_URL = postgresql://neondb_owner:...@ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Preview
```

**For UAT (uat branch):**

```bash
DATABASE_URL = postgresql://neondb_owner:...@ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Preview
```

### 3. Deployment Protection

Enable **Deployment Protection** to prevent accidental production deployments:

1. Go to: **Project Settings → General**
2. Enable: **Vercel Authentication** (requires login to view deployments)
3. Enable: **Password Protection** for Preview deployments (optional)

## Safe Deployment Workflow

### ❌ NEVER Do This:

```bash
# DON'T: Manually deploy to production
vercel --prod

# DON'T: Deploy from wrong branch
git checkout develop
vercel --prod  # This deploys develop to production!
```

### ✅ ALWAYS Do This:

**For DEV deployment:**

```bash
# 1. Ensure you're on develop branch
git checkout develop

# 2. Make your changes and commit
git add .
git commit -m "feat: your changes"

# 3. Push to trigger automatic DEV deployment
git push origin develop

# 4. Wait for automatic Preview deployment
# URL: https://your-project-git-develop-username.vercel.app
```

**For Production deployment:**

```bash
# 1. Create PR from develop to main
gh pr create --base main --head develop --title "Release: vX.X.X"

# 2. Get approval and merge PR
gh pr merge <PR_NUMBER>

# 3. Production deploys automatically from main
# No manual deployment needed!
```

## CLI Safety Commands

**Check what branch you're on:**

```bash
git branch --show-current
```

**View deployment status (no changes):**

```bash
vercel ls --yes
vercel inspect <deployment-url> --logs
```

**Deploy to specific environment (if needed):**

```bash
# Preview/DEV only (from develop branch)
vercel --yes

# Check deployment target before proceeding
git branch --show-current  # Should be 'develop'
```

## Deployment Checklist

Before ANY deployment:

- [ ] Confirm current branch: `git branch --show-current`
- [ ] Verify environment variables in Vercel dashboard
- [ ] Run tests locally: `npm test`
- [ ] Run build locally: `npm run build`
- [ ] Check database connection: `npm run db:check` (if available)
- [ ] For production: Ensure PR is approved and merged to `main`

## Emergency Rollback

If production deployment fails:

1. **Via Vercel Dashboard:**
   - Go to Deployments tab
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Via CLI:**

   ```bash
   # List deployments
   vercel ls --yes

   # Promote previous deployment
   vercel promote <deployment-url> --yes
   ```

3. **Via Git:**
   ```bash
   # Revert last commit on main
   git checkout main
   git revert HEAD
   git push origin main
   ```

## Database Migrations

**Never run migrations directly on production!**

1. Test migration on DEV database
2. Apply to UAT database for testing
3. Create PR with migration files
4. After PR merge, migration runs automatically via Vercel build

```bash
# DEV database
DATABASE_URL=$DEV_POSTGRES_URL npx drizzle-kit push

# UAT database
DATABASE_URL=$UAT_POSTGRES_URL npx drizzle-kit push

# Production (via automated deployment only)
# Runs automatically when main branch is deployed
```

## Troubleshooting

**Issue: Deployment went to wrong environment**

- Check Vercel dashboard → Deployments tab
- Verify which branch triggered the deployment
- Roll back if necessary

**Issue: Environment variables not working**

- Verify variables are set for correct environment (Production vs Preview)
- Redeploy after updating env vars

**Issue: Database connection fails**

- Check DATABASE_URL in Vercel environment variables
- Test connection: `https://your-deployment.vercel.app/api/debug/db-test`
- Verify Neon database is accessible (not paused)

## Contact

For deployment issues, check:

- Vercel Dashboard: https://vercel.com/dashboard
- Deployment Logs: `vercel inspect <url> --logs`
- GitHub Actions (if configured)
