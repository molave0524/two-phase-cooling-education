# 🔴 OAuth Staging Diagnosis Report

**Date:** 2025-10-20
**Tested URL:** https://two-phase-cooling-education-ctsptqxy9-molave0524s-projects.vercel.app
**Test Method:** Playwright automated testing

---

## 🎯 Test Results

### ❌ OAuth Flow: FAILED

**Error:** `Error 400: redirect_uri_mismatch`

**Screenshot:** `.playwright-mcp/oauth-error-staging.png`

---

## 🔍 Root Cause Analysis

### **Problem 1: WRONG Google Client ID** ⚠️

The staging deployment is using **DEV** credentials instead of **UAT** credentials.

**What's Happening:**

```
Client ID being used:    1005067048373-audf0nn8lgg3t6kkq0ee5sei091433br
Expected (UAT):         1005067048373-v0d6pvhca1jgareem27ot8nbpspagaf4
```

**Redirect URI attempted:**

```
https://two-phase-cooling-education-ctsptqxy9-molave0524s-projects.vercel.app/api/auth/callback/google
```

### **Problem 2: Redirect URI Not Registered**

Even with the correct Client ID, the redirect URI is not registered in Google Console for the UAT OAuth client.

---

## 🛠️ Fix Required

### **Step 1: Update Vercel Environment Variable**

The `GOOGLE_CLIENT_ID` for **staging** environment needs to be changed:

**Current (DEV):**

```
1005067048373-audf0nn8lgg3t6kkq0ee5sei091433br.apps.googleusercontent.com
```

**Should be (UAT):**

```
1005067048373-v0d6pvhca1jgareem27ot8nbpspagaf4.apps.googleusercontent.com
```

**Commands to fix:**

```bash
# Remove current staging GOOGLE_CLIENT_ID
vercel env rm GOOGLE_CLIENT_ID staging

# Add correct UAT GOOGLE_CLIENT_ID
echo "1005067048373-v0d6pvhca1jgareem27ot8nbpspagaf4.apps.googleusercontent.com" | vercel env add GOOGLE_CLIENT_ID staging

# Also update GOOGLE_CLIENT_SECRET for staging
vercel env rm GOOGLE_CLIENT_SECRET staging
echo "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" | vercel env add GOOGLE_CLIENT_SECRET staging
```

### **Step 2: Configure Google OAuth Console**

1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Find UAT Client:** `1005067048373-v0d6pvhca1jgareem27ot8nbpspagaf4...`
3. **Add Authorized Redirect URI:**
   ```
   https://two-phase-cooling-education-ctsptqxy9-molave0524s-projects.vercel.app/api/auth/callback/google
   ```
4. **Also add wildcard for future deployments:**
   ```
   https://two-phase-cooling-education-*.vercel.app/api/auth/callback/google
   ```
5. **Save**

### **Step 3: Redeploy**

After updating environment variables:

```bash
# Trigger redeploy to pick up new env vars
vercel --prod

# Or push a commit
git commit --allow-empty -m "chore: fix OAuth config for staging"
git push origin develop
```

---

## 📊 Environment Variable Audit

### Current Vercel Staging Configuration:

| Variable               | Current Status     | Correct?                 |
| ---------------------- | ------------------ | ------------------------ |
| `NEXTAUTH_URL`         | ✅ Set             | ✅ Correct               |
| `NEXTAUTH_SECRET`      | ✅ Set             | ✅ Correct               |
| `GOOGLE_CLIENT_ID`     | ⚠️ DEV credentials | ❌ Wrong (should be UAT) |
| `GOOGLE_CLIENT_SECRET` | ⚠️ DEV credentials | ❌ Wrong (should be UAT) |
| `DATABASE_URL`         | ✅ Set             | ✅ Correct (UAT DB)      |

---

## 🔐 Credentials Reference

### DEV Credentials (Currently being used - WRONG):

```
Client ID:     1005067048373-audf0nn8lgg3t6kkq0ee5sei091433br.apps.googleusercontent.com
Client Secret: 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
```

### UAT Credentials (Should be used - CORRECT):

```
Client ID:     1005067048373-v0d6pvhca1jgareem27ot8nbpspagaf4.apps.googleusercontent.com
Client Secret: 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
```

---

## ✅ Resolution Checklist

- [ ] Update `GOOGLE_CLIENT_ID` to UAT credentials in Vercel
- [ ] Update `GOOGLE_CLIENT_SECRET` to UAT credentials in Vercel
- [ ] Add redirect URI to Google OAuth Console (UAT client)
- [ ] Redeploy staging
- [ ] Retest OAuth flow with Playwright

---

## 🧪 Testing Command

After fixes are applied, re-run this test:

```bash
# I can retest using Playwright once you've made the changes
# Just let me know when you're ready!
```

---

## 📝 Notes

- The **NEXTAUTH_URL** was successfully configured earlier
- The code auto-detection logic in `auth.ts` is working correctly
- The issue is purely credential mismatch (DEV vs UAT)
- Once credentials are swapped, OAuth should work immediately

---

## 🚀 Next Actions

**Priority 1 (Immediate):**

1. Update Vercel environment variables (5 minutes)
2. Configure Google Console redirect URI (5 minutes)
3. Redeploy (2 minutes)
4. Retest OAuth (I can help with this!)

**Would you like me to:**

- ✅ Update the Vercel environment variables now?
- ✅ Create the Google Console configuration script?
- ✅ Trigger a redeploy?
- ✅ Retest after fixes?
