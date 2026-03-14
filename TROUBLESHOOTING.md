# 🔧 Troubleshooting Guide

## "Failed to Fetch" Error

This error typically means the database tables don't exist or RLS policies are blocking access.

### Quick Fix Steps:

### 1. **Run the Database Setup SQL**

The most common cause is that the database tables haven't been created yet.

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Click **SQL Editor** in the left sidebar
4. Copy the entire contents of `FIX_DATABASE.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
7. Wait for all queries to complete successfully

### 2. **Use the Connection Test Tool**

We've created a diagnostic page to help you identify the exact issue:

1. Start your dev server: `npm run dev`
2. Navigate to: http://localhost:3000/test-connection
3. Click "Run Tests"
4. Review the results to see which specific test is failing

### 3. **Check Your Environment Variables**

Make sure your `.env.local` file has the correct values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** After changing `.env.local`, you MUST restart your dev server!

```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

### 4. **Verify You're Logged In**

- Go to http://localhost:3000/auth
- Log in with your account
- Then try adding an expense again

---

## Common Error Messages & Solutions

### ❌ "relation 'expenses' does not exist"

**Problem:** The database table hasn't been created.

**Solution:** Run the SQL in `FIX_DATABASE.sql` in your Supabase SQL Editor.

---

### ❌ "row-level security policy" or "permission denied"

**Problem:** RLS policies are blocking access.

**Solution:**
1. Run the SQL in `FIX_DATABASE.sql` to create proper RLS policies
2. Make sure you're logged in
3. Check that the policies were created in Supabase Dashboard → Authentication → Policies

---

### ❌ "Failed to fetch" or "Network error"

**Possible Causes:**
1. **Supabase project is paused** - Check your Supabase dashboard
2. **Wrong URL/Key in .env.local** - Verify your credentials
3. **Internet connection** - Check your network
4. **Firewall blocking** - Try disabling VPN/firewall temporarily

**Solution:**
1. Check Supabase dashboard to ensure project is active
2. Verify `.env.local` has correct values
3. Restart your dev server
4. Try the test-connection page

---

### ❌ "You must be logged in to add expenses"

**Problem:** Authentication state hasn't loaded yet or you're not logged in.

**Solution:**
1. Make sure you're logged in at `/auth`
2. Wait for the page to fully load (you should see the loading spinner disappear)
3. Clear browser cache and localStorage
4. Try logging out and back in

---

## Debug Checklist

If you're still having issues, go through this checklist:

- [ ] ✓ Supabase URL and Anon Key are in `.env.local`
- [ ] ✓ Restarted dev server after changing `.env.local`
- [ ] ✓ Ran the SQL from `FIX_DATABASE.sql` in Supabase SQL Editor
- [ ] ✓ Supabase project is active (not paused)
- [ ] ✓ Logged in to the app
- [ ] ✓ Checked browser console for errors (F12)
- [ ] ✓ Ran the test-connection page
- [ ] ✓ Cleared browser cache and localStorage

---

## Browser Console Debugging

The app now provides detailed error logging. To see detailed errors:

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try adding an expense
4. Look for error messages that start with:
   - `Supabase insert error:`
   - `Error details:`
   - `Failed to save to Supabase:`

These will show you the exact error from Supabase.

---

## Still Having Issues?

If none of the above solutions work:

1. **Check the test-connection page** - http://localhost:3000/test-connection
2. **Take a screenshot** of:
   - The error message in the app
   - The browser console errors
   - The test-connection results
3. **Verify** your Supabase dashboard shows the `expenses` table exists
4. **Try** creating an expense directly in Supabase Table Editor to test RLS policies

---

## Fresh Start (Last Resort)

If you want to start completely fresh:

1. In Supabase SQL Editor, run:
   ```sql
   DROP TABLE IF EXISTS expenses CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   ```
2. Run the entire `FIX_DATABASE.sql` script
3. Log out and log back in
4. Try adding an expense

---

## Need More Help?

Check the detailed setup guides:
- `SUPABASE_SETUP.md` - Full Supabase setup instructions
- `FIX_DATABASE.sql` - Database schema and RLS policies
- `README_DEV.md` - Development setup guide
