# Deployment Guide - Vercel Postgres Setup

This guide walks you through setting up PostgreSQL for production on Vercel using **Neon**.

## Architecture

- **Local Development**: SQLite database (`.data/app.db`)
- **Production (Vercel)**: PostgreSQL database (Neon)

The application automatically detects which database to use based on environment variables.

## Why Neon?

We chose **Neon** for production because:

- ✅ Native Vercel integration (seamless setup)
- ✅ Serverless Postgres (scales to zero when idle)
- ✅ Automatic scaling (cost-effective)
- ✅ Works perfectly with Drizzle ORM
- ✅ Free tier: 0.5 GB storage

**Not using authentication** - The app doesn't require user accounts yet (cart uses localStorage). Authentication can be added later when needed.

## Step 1: Create Neon Postgres Database

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to the **Storage** tab
4. Click **Create Database**
5. Select **Neon** (recommended)
6. Choose a database name (e.g., `two-phase-cooling-db`)
7. Select your preferred region (choose closest to your users)
8. **Authentication**: Keep it **OFF** (we don't need it yet)
9. Click **Create**

## Step 2: Connect Database to Project

Vercel will automatically add these environment variables to your project:

```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NO_SSL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

The app uses `POSTGRES_URL` to detect and connect to PostgreSQL.

## Step 3: Get Database Connection String

1. After creating the database, Vercel shows environment variables
2. Copy the `POSTGRES_URL` value (starts with `postgres://`)
3. This URL is already automatically added to your Vercel project

## Step 4: Push Database Schema

Initialize the database schema from your local machine:

```bash
# Windows (Command Prompt)
set POSTGRES_URL=postgres://your-connection-string
npm run db:push

# Windows (PowerShell)
$env:POSTGRES_URL="postgres://your-connection-string"
npm run db:push

# Mac/Linux
export POSTGRES_URL="postgres://your-connection-string"
npm run db:push
```

This creates all the tables in your Neon database.

## Step 5: Seed the Database

Populate the database with your 11 products:

```bash
# Same environment variable from Step 4
npm run db:seed
```

You should see:

```
🌱 Seeding database...
📦 Using PostgreSQL
✓ Cleared existing products
✓ Inserted product: Two-Phase Cooling Case Pro
✓ Inserted product: Two-Phase Cooling Case Compact
...
🎉 Successfully seeded 11 products!
```

## Step 6: Verify Production Database

### Option A: Vercel Dashboard (Easiest)

1. Go to Vercel Dashboard → Storage → Your Database
2. Click the **Data** tab
3. Click on `products` table
4. You should see all 11 products listed

### Option B: Drizzle Studio (Local GUI)

```bash
# Windows (PowerShell)
$env:POSTGRES_URL="postgres://your-connection-string"
npm run db:studio

# Mac/Linux
export POSTGRES_URL="postgres://your-connection-string"
npm run db:studio
```

Opens a web UI at http://localhost:4983

### Option C: Check Your Live Site

1. Trigger a new deployment (or wait for auto-deploy)
2. Visit your production URL
3. Products should load from Neon Postgres

## Checking Production Data

After deployment, you can verify data using:

1. **Vercel Dashboard**: Storage → Database → Data → products table
2. **Drizzle Studio**: Set `POSTGRES_URL` and run `npm run db:studio`
3. **Your Live Site**: Products should display on homepage and /products page

## Troubleshooting

### Products not showing after deployment?

1. **Check database has data**: Vercel Dashboard → Storage → Data → products table
2. **Verify environment variables**: Vercel Dashboard → Settings → Environment Variables (should have `POSTGRES_URL`)
3. **Check deployment logs**: Vercel Dashboard → Deployments → Latest → View Logs
4. **Re-seed if empty**: Run `npm run db:seed` with `POSTGRES_URL` set

### How to reset/re-seed the database?

```bash
# Windows (PowerShell)
$env:POSTGRES_URL="postgres://your-connection-string"
npm run db:push   # Recreates tables
npm run db:seed   # Adds products

# Mac/Linux
export POSTGRES_URL="postgres://your-connection-string"
npm run db:push
npm run db:seed
```

### "Module not found" or build errors?

The Postgres migration requires these packages (already installed):

- `@vercel/postgres`
- `pg`
- `drizzle-orm@latest`

If errors occur, run: `npm install`

### Still using SQLite in production?

Check that `POSTGRES_URL` environment variable exists in Vercel. The app logs will show either:

- `💾 Using SQLite database` (local development)
- `🐘 Using PostgreSQL database` (production)

## Adding Authentication Later

The database schema includes `users` and `sessions` tables ready for authentication. When you need user accounts:

1. Enable authentication in Vercel Storage settings
2. Install auth package (NextAuth, Clerk, etc.)
3. Update cart to sync with user accounts
4. The tables are already there!

## Summary

✅ **Local**: SQLite (automatic, no setup needed)
✅ **Production**: Neon Postgres (Vercel Storage)
✅ **No Authentication** (keep cart in localStorage for now)
✅ **11 Products** seeded and ready to display
