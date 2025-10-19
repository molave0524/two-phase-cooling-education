# Vercel Environment Variables Setup

## Required Environment Variable

Add this to Vercel dashboard at:
https://vercel.com/molave0524s-projects/simple-todo/settings/environment-variables

### DATABASE_URL

**Value:**

```
postgresql://neondb_owner:npg_CcQ8o1Prbfmw@ep-rough-lab-addes3ze.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Environments to enable:**

- ✅ Preview (for staging deployments)
- ✅ Production (for main branch)
- ⬜ Development (optional - used for `vercel dev`)

## Steps:

1. Go to Vercel Dashboard
2. Navigate to Project Settings → Environment Variables
3. Click "Add New"
4. Enter:
   - Name: `DATABASE_URL`
   - Value: (paste the connection string above)
   - Select environments: Preview + Production
5. Click "Save"
6. Redeploy the staging environment

## After Adding:

The staging URL will be able to connect to the DEV database and show all 30 products.
