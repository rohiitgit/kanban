# Vercel Environment Variables Setup 🔧

## Issue: Secret References Error

If you see: `Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "supabase-url", which does not exist.`

**Solution:** Add environment variables directly through Vercel Dashboard (not via vercel.json)

---

## How to Add Environment Variables

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **Don't click Deploy yet!**
4. Click "Environment Variables" section

### Step 2: Add Variables One by One

Click **"Add"** and enter each variable:

#### Variable 1:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://your-project.supabase.co`
- **Environment:** All (Production, Preview, Development)

#### Variable 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key)
- **Environment:** All

#### Variable 3:
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your service role key)
- **Environment:** All
- ⚠️ **Keep this secret!**

#### Variable 4:
- **Name:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://your-app.vercel.app`
- **Environment:** Production only (for now)

### Step 3: Deploy

After adding all variables, click **"Deploy"**

---

## Where to Find Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## After First Deployment

### Update NEXT_PUBLIC_APP_URL

1. After first deploy, Vercel gives you a URL like:
   ```
   https://kanban-abc123.vercel.app
   ```

2. Go to **Project Settings → Environment Variables**

3. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL

4. **Redeploy:**
   - Go to Deployments
   - Click ⋮ on latest deployment
   - Click "Redeploy"

---

## Visual Guide

### Adding Environment Variable:

```
┌─────────────────────────────────────────┐
│ Environment Variables                   │
├─────────────────────────────────────────┤
│                                         │
│ Name:  NEXT_PUBLIC_SUPABASE_URL        │
│ Value: https://xxx.supabase.co         │
│                                         │
│ ☑ Production                           │
│ ☑ Preview                              │
│ ☑ Development                          │
│                                         │
│              [ Save ]                   │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: Still see secret reference error

**Solution:** 
1. Delete the `vercel.json` file from your repo
2. Push changes
3. Try importing again

### Issue: Build fails after adding variables

**Solution:**
1. Check all 4 variables are added
2. Check no typos in variable names
3. Check Supabase keys are correct
4. Redeploy

### Issue: App deployed but OAuth doesn't work

**Solution:**
1. Update Supabase redirect URLs
2. Add your Vercel URL to allowed redirects
3. See `VERCEL_DEPLOYMENT_GUIDE.md` Step 4

---

## Complete Variable List

Copy this for reference:

```bash
# Required Variables (All Environments)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App URL (Production only initially)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Quick Checklist

Before deploying:
- [ ] All 4 environment variables added
- [ ] Values copied correctly (no extra spaces)
- [ ] "All environments" selected for first 3 variables
- [ ] Supabase keys from correct project
- [ ] Ready to click "Deploy"

After first deployment:
- [ ] Get Vercel URL
- [ ] Update `NEXT_PUBLIC_APP_URL` with actual URL
- [ ] Redeploy
- [ ] Update Supabase redirect URLs
- [ ] Test OAuth flow

---

## Summary

**Don't use vercel.json for environment variables.**

**Instead:**
1. Add variables through Vercel Dashboard
2. Use the UI to add each one
3. Deploy
4. Update app URL after first deploy
5. Redeploy

Simple and works every time! ✅

