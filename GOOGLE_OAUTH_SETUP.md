# 🚀 Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for Rizqly.

---

## Why Google OAuth?

✅ **No email confirmation** - Users can sign in instantly
✅ **Secure** - Google handles all security
✅ **Familiar** - Everyone already has a Google account
✅ **Fast** - One-click sign-in
✅ **Gen Z friendly** - Modern, smooth experience

---

## Step 1: Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Providers**
5. Scroll down to find **Google**
6. Toggle **Enable Sign in with Google** to **ON**
7. **Don't save yet!** We need to configure it first

---

## Step 2: Create Google OAuth Credentials

### 2.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one:
   - Click the project dropdown at the top
   - Click **"New Project"**
   - Name it: `Rizqly` (or whatever you want)
   - Click **Create**
   - Wait a few seconds for it to be created
   - Select your new project from the dropdown

### 2.2 Enable Google+ API (if needed)

1. In the search bar at the top, type: **"Google+ API"**
2. Click on **Google+ API**
3. Click **Enable** (if it's not already enabled)

### 2.3 Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** as the User Type
3. Click **Create**
4. Fill in the required fields:
   - **App name**: `Rizqly`
   - **User support email**: Your email
   - **App logo**: (optional, can skip for now)
   - **Application home page**: `http://localhost:3000` (for development)
   - **Authorized domains**: Add `supabase.co`
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. On the **Scopes** page, click **Save and Continue** (we don't need to add custom scopes)
7. On the **Test users** page:
   - Click **+ Add Users**
   - Add your email address (you can test with this account)
   - Click **Save and Continue**
8. Review and click **Back to Dashboard**

### 2.4 Create OAuth Credentials

1. In the left sidebar, go to **Credentials**
2. Click **+ Create Credentials** at the top
3. Select **OAuth client ID**
4. Configure the OAuth client:
   - **Application type**: Select **Web application**
   - **Name**: `Rizqly Web Client`
   - **Authorized JavaScript origins**: Add these URLs:
     ```
     http://localhost:3000
     https://<your-project-ref>.supabase.co
     ```
     Replace `<your-project-ref>` with your Supabase project reference (from the URL)

   - **Authorized redirect URIs**: Add this exact URL (VERY IMPORTANT!):
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     **Example**: If your Supabase URL is `https://vxzjfvouxhcuiuyjpsdq.supabase.co`
     Then your redirect URI is: `https://vxzjfvouxhcuiuyjpsdq.supabase.co/auth/v1/callback`

5. Click **Create**
6. **IMPORTANT**: You'll see a popup with your credentials:
   - **Client ID** - Copy this!
   - **Client Secret** - Copy this!
   - Keep these safe, you'll need them in the next step

---

## Step 3: Add Google Credentials to Supabase

1. Go back to your **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** provider (should still be open)
3. Paste your credentials:
   - **Client ID (for OAuth)**: Paste the Client ID from Google
   - **Client Secret (for OAuth)**: Paste the Client Secret from Google
4. **IMPORTANT**: Add authorized redirect URL:
   - It should already show: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Make sure this EXACTLY matches what you added in Google Cloud Console
5. Click **Save**

---

## Step 4: Test the Integration

### 4.1 Run Your App

```bash
npm run dev
```

### 4.2 Try Signing In

1. Go to `http://localhost:3000/auth`
2. Click **"Continue with Google"**
3. You should be redirected to Google's sign-in page
4. Sign in with your Google account
5. Grant permissions when asked
6. You should be redirected back to `/budget`

### 4.3 Troubleshooting Common Issues

#### "redirect_uri_mismatch" Error

**Problem**: The redirect URI doesn't match what's configured in Google Cloud.

**Solution**:
1. Check the error message for the exact redirect URI it's trying to use
2. Go back to Google Cloud Console → Credentials
3. Edit your OAuth client
4. Add the exact redirect URI from the error message
5. Make sure there are no trailing slashes or typos
6. Save and try again

#### "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured properly.

**Solution**:
1. Go to Google Cloud Console → OAuth consent screen
2. Make sure Publishing status is **"Testing"** (not "In production")
3. Add your email to **Test users**
4. Try again

#### "Error 400: admin_policy_enforced"

**Problem**: Your Google Workspace admin has blocked third-party apps.

**Solution**:
- Use a personal Gmail account instead of a work/school account
- OR ask your admin to allow the app

---

## Step 5: Configure for Production

When you're ready to deploy your app:

### 5.1 Update Google Cloud Console

1. Go to **Credentials** in Google Cloud Console
2. Edit your OAuth client
3. Add your production domain:
   - **Authorized JavaScript origins**:
     ```
     https://yourdomain.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```

### 5.2 Publish OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (if you want anyone to use it)
4. OR keep it in "Testing" mode and manually add users

---

## Step 6: Verify Everything Works

After setup, verify:

- ✅ You can click "Continue with Google" button
- ✅ You're redirected to Google sign-in
- ✅ After signing in, you're redirected to `/budget`
- ✅ You can add expenses
- ✅ You can log out
- ✅ You can log back in

---

## 🎯 Quick Reference

### Your Supabase Redirect URI

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Replace `<your-project-ref>` with your actual project reference.

### Where to Find Things

- **Google Cloud Console**: https://console.cloud.google.com/
- **Supabase Dashboard**: https://supabase.com/dashboard
- **OAuth Credentials**: Google Cloud → APIs & Services → Credentials
- **OAuth Consent**: Google Cloud → APIs & Services → OAuth consent screen
- **Supabase Auth Settings**: Supabase → Authentication → Providers

---

## 📝 Next Steps

After Google OAuth is working:

1. ✅ Test signing in and out
2. ✅ Add your first expense
3. ✅ Make sure the database is working (run `FIX_DATABASE.sql` if needed)
4. ✅ Customize the look and feel
5. ✅ Deploy to production!

---

## 🆘 Need Help?

If you're stuck:

1. Check the browser console (F12) for error messages
2. Check Supabase Logs (Dashboard → Logs)
3. Make sure redirect URIs match EXACTLY
4. Try with a different Google account
5. Clear browser cache and cookies
6. Check `TROUBLESHOOTING.md` for common issues

---

## 🔒 Security Notes

- ✅ Never commit Google Client Secret to git
- ✅ Use environment variables for secrets
- ✅ Keep OAuth consent in "Testing" until ready for public
- ✅ Regularly review authorized domains
- ✅ Monitor Supabase auth logs for suspicious activity

**You're all set! Enjoy secure, one-click authentication! 🎉**
