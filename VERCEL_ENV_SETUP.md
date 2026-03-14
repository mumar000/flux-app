# 🚀 Vercel Environment Variables Setup

## Problem
OAuth is redirecting to `localhost:3000` instead of your production domain.

## Solution
Set the `NEXT_PUBLIC_APP_URL` environment variable in Vercel.

---

## Step-by-Step Guide

### 1. Go to Your Vercel Dashboard

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **rizqly-app** project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

---

### 2. Add Environment Variables

Add these environment variables (if not already added):

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://vxzjfvouxhcuiuyjpsdq.supabase.co
Environment: Production, Preview, Development (select all)
```

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4empmdm91eGhjdWl1eWpwc2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjEwNTgsImV4cCI6MjA4NjE5NzA1OH0.cEBlm40kkaZmqCDqe0n-3XAZAW8LlJP5EeDF-dBJa0A
Environment: Production, Preview, Development (select all)
```

#### Variable 3: NEXT_PUBLIC_APP_URL (IMPORTANT!)
```
Name: NEXT_PUBLIC_APP_URL
Value: https://rizqly-app.vercel.app
Environment: Production, Preview (select these two ONLY)
```

**Note:** Don't select "Development" for APP_URL - it should use localhost there.

---

### 3. Save and Redeploy

After adding the environment variables:

1. **Click "Save"** on each variable
2. **Go to Deployments** tab
3. **Click on the latest deployment**
4. **Click "Redeploy"** button (3 dots menu → Redeploy)
5. **Wait** for deployment to complete (~2 minutes)

---

## 📋 Environment Variables Summary

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vxzjfvouxhcuiuyjpsdq.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | All |
| `NEXT_PUBLIC_APP_URL` | `https://rizqly-app.vercel.app` | Production, Preview |

---

## ✅ How to Verify It's Working

After redeploying:

1. **Go to your production site:** `https://rizqly-app.vercel.app/auth`
2. **Click "Continue with Google"**
3. **Sign in with Google**
4. **Check the URL** - it should redirect to:
   ```
   https://rizqly-app.vercel.app/auth/callback?code=xxx
   ```
   NOT `localhost:3000`

5. **You should land on:**
   ```
   https://rizqly-app.vercel.app/budget
   ```

---

## 🔍 Debug Tips

### If still redirecting to localhost:

**Check in browser console (F12):**
```javascript
console.log(process.env.NEXT_PUBLIC_APP_URL)
// Should show: https://rizqly-app.vercel.app
```

### Clear Vercel Build Cache:

1. Go to **Settings** → **General**
2. Scroll down to **Build & Development Settings**
3. Clear build cache if needed
4. Redeploy

### Check Environment Variables Are Set:

In Vercel deployment logs, you should see:
```
✓ Environment variables loaded
```

---

## 🎯 Alternative: Use Vercel System Environment Variable

Instead of setting `NEXT_PUBLIC_APP_URL`, you can use Vercel's built-in variable:

Update `hooks/useAuth.ts`:
```typescript
const appUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';
```

This automatically uses your Vercel deployment URL!

---

## 📝 Quick Checklist

- [ ] Added `NEXT_PUBLIC_APP_URL` to Vercel
- [ ] Set value to `https://rizqly-app.vercel.app`
- [ ] Selected Production & Preview environments
- [ ] Saved the variable
- [ ] Redeployed the app
- [ ] Tested OAuth flow in production
- [ ] Redirects to production domain ✅

---

**After setting the environment variable and redeploying, OAuth should work correctly in production!** 🎉
