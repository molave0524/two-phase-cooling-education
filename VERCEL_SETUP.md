# Vercel Environment Setup

This document describes how to configure Vercel environment variables for automatic database migrations across the multi-environment deployment pipeline.

## Deployment Workflow

```
Local (feature) → develop → uat → main
                     ↓       ↓      ↓
                  Vercel   Vercel  Vercel
                   Dev     Preview  Prod
```

## Environment Variable Configuration

### Required Environment Variables

For automatic migrations to work, you must configure `DATABASE_URL` for each branch in the Vercel dashboard.

### Setup Instructions

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following environment variables:

#### For `develop` branch (Vercel Development environment):

```
Variable: DATABASE_URL
Value: postgresql://neondb_owner:npg_CcQ8o1Prbfmw@ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Production
Git Branch: develop
```

#### For `uat` branch (Vercel Preview environment):

```
Variable: DATABASE_URL
Value: postgresql://neondb_owner:f998ab36-768d-4389-917b-68435e3557bc!@ep-orange-haze-adxn06jb.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Preview
Git Branch: uat
```

#### For `main` branch (Vercel Production environment):

```
Variable: DATABASE_URL
Value: postgresql://neondb_owner:5b05cccd-65de-4e4c-ac05-34525aca6d2e!@ep-damp-fire-ad4x3c36-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Production
Git Branch: main
```

## How Automatic Migrations Work

1. **Code Changes**: Developer makes schema changes locally and generates migrations using `npm run db:generate`
2. **Commit & Push**: Migration files are committed to git and pushed to the appropriate branch
3. **Vercel Build**: When Vercel detects a push, it runs the build command
4. **Auto-Migration**: The build command (`npm run db:auto-migrate && npm run build`) runs migrations first
5. **Schema Applied**: Migrations are applied to the environment-specific database
6. **Build Continues**: If migrations succeed, the Next.js build proceeds
7. **Deployment**: The application is deployed with the updated schema

## Migration Tracking

Drizzle ORM automatically tracks which migrations have been applied using the `drizzle.__drizzle_migrations` table in each database. This ensures:

- Migrations run only once
- Migrations run in order
- Each environment maintains its own migration history
- Failed migrations prevent deployment

## Schema Change Workflow

### Adding a New Column (Example)

1. **Local Development**:

   ```bash
   # Edit schema file
   # Generate migration
   npm run db:generate

   # Review the generated migration in drizzle/postgres/
   # Test locally if needed
   ```

2. **Deploy to Development**:

   ```bash
   git add drizzle/postgres/
   git commit -m "feat: Add user_role column to users table"
   git push origin develop
   ```

   → Vercel automatically runs migration on DEV database

3. **Deploy to UAT**:

   ```bash
   git checkout uat
   git merge develop
   git push origin uat
   ```

   → Vercel automatically runs migration on UAT database

4. **Deploy to Production**:
   ```bash
   git checkout main
   git merge uat
   git push origin main
   ```
   → Vercel automatically runs migration on PROD database

## Product Sunsetting (Manual Process)

Product sunsetting remains a manual process that requires running scripts:

```bash
# Set environment variable for target database
export DATABASE_URL="<target_db_url>"

# Run sunsetting script
npm run products:sunset -- --product-id="PRODUCT_ID" --reason="End of life"
```

Note: Sunsetting scripts must be run manually against each environment as needed.

## Troubleshooting

### Build Fails Due to Migration Error

1. Check Vercel build logs for the specific migration error
2. Review the migration SQL file that failed
3. Fix the migration file locally
4. Commit and push the fix
5. Vercel will retry the migration on the next deployment

### Migration Runs But Application Fails

1. Check that the schema changes are reflected in `src/db/schemas/`
2. Ensure TypeScript types are updated
3. Run `npm run type-check` locally to catch type errors

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly for the branch
2. Check Neon database is accessible
3. Verify connection string includes `?sslmode=require`

## Security Notes

- Database credentials are stored as Vercel environment variables (encrypted at rest)
- Connection strings use SSL/TLS (`sslmode=require`)
- Each environment has isolated database credentials
- Rotate database passwords via Neon dashboard if credentials are compromised
