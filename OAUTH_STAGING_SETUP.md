# Google OAuth Staging (UAT) Setup - Completed

**Date:** 2025-10-20
**Environment:** Staging/UAT
**Deployment URL:** https://two-phase-cooling-education-ctsptqxy9-molave0524s-projects.vercel.app

---

## ✅ Step 1: Vercel Environment Variables (COMPLETED)

The following environment variables have been configured for **staging**:

| Variable               | Status | Environment               |
| ---------------------- | ------ | ------------------------- |
| `NEXTAUTH_URL`         | ✅ Set | staging                   |
| `NEXTAUTH_SECRET`      | ✅ Set | staging                   |
| `GOOGLE_CLIENT_ID`     | ✅ Set | staging (UAT credentials) |
| `GOOGLE_CLIENT_SECRET` | ✅ Set | staging (UAT credentials) |
| `DATABASE_URL`         | ✅ Set | staging (UAT database)    |

---

## ⚠️ Step 2: Google OAuth Console Configuration (ACTION REQUIRED)

You need to configure the **redirect URI** in Google Cloud Console for your **UAT OAuth Client**.

### Instructions:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project

2. **Find UAT OAuth 2.0 Client ID:**
   - Look for Client ID: `1005067048373-v0d6pvhca1jgareem27ot8nbpspagaf4...`
   - Click to edit

3. **Add Authorized Redirect URIs:**

   ```
   https://two-phase-cooling-education-ctsptqxy9-molave0524s-projects.vercel.app/api/auth/callback/google
   ```

   **Also add wildcard for future deployments:**

   ```
   https://two-phase-cooling-education-*.vercel.app/api/auth/callback/google
   ```

4. **Save Changes**

---

## 🚀 Step 3: Redeploy (Required)

The new `NEXTAUTH_URL` environment variable requires a redeploy to take effect:

```bash
# Option 1: Trigger redeploy via Vercel CLI
vercel --prod

# Option 2: Trigger redeploy via Vercel Dashboard
# Go to Deployments → Click "Redeploy"

# Option 3: Push a new commit to your staging branch
git commit --allow-empty -m "chore: trigger redeploy for OAuth config"
git push origin develop
```

---

## 🧪 Step 4: Test OAuth Flow

After completing steps 2 & 3, test the Google OAuth:

1. Visit: https://two-phase-cooling-education-ctsptqxy9-molave0524s-projects.vercel.app
2. Click "Sign In"
3. Choose "Continue with Google"
4. Complete Google authentication
5. Verify you're redirected back successfully

---

## 🔍 Troubleshooting

### If OAuth Still Fails:

**Check Console Errors:**

- Open browser DevTools (F12)
- Check Console tab for errors
- Look for redirect_uri_mismatch errors

**Verify Environment Variables:**

```bash
vercel env ls
```

**Check Deployment Logs:**

```bash
vercel logs <deployment-url>
```

**Common Issues:**

- ❌ Redirect URI mismatch → Check Google Console settings
- ❌ NEXTAUTH_URL not set → Redeploy after setting
- ❌ Wrong CLIENT_ID → Verify UAT credentials are used
- ❌ Database connection failed → Check DATABASE_URL

---

## 📋 Environment Variable Values Reference

**From .env.local (UAT section):**

- `NEXTAUTH_URL`: Set to deployment URL
- `NEXTAUTH_SECRET`: `SdD/vRZUwhkrVhtl89TIbuk1Lvnw3w6Vi2wGqCRRGG8=`
- `GOOGLE_CLIENT_ID`: `1005067048373-v0d6pvhca1jgareem27ot8nbpspagaf4.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: `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`
- `DATABASE_URL`: UAT Neon database

---

## ✅ Checklist

- [x] Vercel environment variables configured
- [ ] Google OAuth Console redirect URI added
- [ ] Staging redeployed
- [ ] OAuth flow tested successfully

---

## 🎯 Next Steps

1. **Complete Google OAuth Console configuration** (Step 2 above)
2. **Trigger a redeploy** (Step 3)
3. **Test the OAuth flow** (Step 4)
4. **Report back** if any issues arise

**Need help?** Run these commands to diagnose:

```bash
# Check current env config
vercel env ls | grep -E "(NEXTAUTH|GOOGLE)"

# View deployment logs
vercel logs https://two-phase-cooling-education-ctsptqxy9-molave0524s-projects.vercel.app

# List recent deployments
vercel ls
```
