# 🚀 Quick Fix for Foreign Key Error

## Error You're Seeing

```
{
    "code": "23503",
    "details": "Key is not present in table \"profiles\".",
    "message": "insert or update on table \"banks\" violates foreign key constraint \"banks_user_id_fkey\""
}
```

## What's Wrong

The `categories` and `banks` tables are trying to reference a `profiles` table, but:
1. The profiles table might not exist
2. OR your user record isn't in the profiles table
3. OR the foreign key is pointing to the wrong table

## ✅ Solution (5 Minutes)

### Step 1: Run the Complete Database Fix

1. **Open your Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to SQL Editor** (left sidebar)
3. **Open the file**: `FIX_DATABASE_COMPLETE.sql`
4. **Copy ALL the SQL** from that file
5. **Paste it into the SQL Editor**
6. **Click RUN** (or press Ctrl+Enter / Cmd+Enter)
7. **Wait** for it to complete (should take ~5 seconds)

### Step 2: Verify It Worked

You should see messages like:
- ✅ Tables created successfully
- ✅ Default categories inserted
- ✅ "Database setup complete!"

### Step 3: Test the App

1. **Refresh your browser**
2. **Try adding a category** in Settings
3. **Try adding a bank** in Settings
4. **Try adding an expense**

Everything should work now! 🎉

---

## What the Fix Does

The `FIX_DATABASE_COMPLETE.sql` script:

1. ✅ **Drops old tables** with broken foreign keys
2. ✅ **Creates profiles table** properly
3. ✅ **Creates expenses table** with correct references
4. ✅ **Creates categories table** referencing `auth.users` directly
5. ✅ **Creates banks table** referencing `auth.users` directly
6. ✅ **Inserts default categories** (Food, Transport, etc.)
7. ✅ **Sets up RLS policies** so users can only see their own data
8. ✅ **Auto-creates profile** when you sign in with Google

---

## Key Changes

### Before (Broken):
```sql
CREATE TABLE banks (
  user_id UUID REFERENCES profiles(id)  -- ❌ Breaks if profile doesn't exist
)
```

### After (Fixed):
```sql
CREATE TABLE banks (
  user_id UUID REFERENCES auth.users(id)  -- ✅ Always works
)
```

---

## Why This Happened

When you signed in with Google OAuth:
- ✅ Google created a user in `auth.users` table
- ❌ But no profile was created in `profiles` table
- ❌ So when adding a category/bank, the foreign key check failed

The new schema fixes this by:
- Using `auth.users` directly (which always exists)
- Auto-creating profiles when users sign in
- Making profiles optional

---

## If You Still Get Errors

### Error: "relation already exists"

**Solution**: The tables already exist. You need to drop them first.

Run this first, THEN run the complete fix:
```sql
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

### Error: "permission denied"

**Solution**: You might not have permission in Supabase.
- Make sure you're in the SQL Editor
- Make sure you're logged into the right Supabase project

### Error: "still getting foreign key error"

**Solution**:
1. Clear your browser cache
2. Log out and log back in
3. Make sure the SQL ran successfully (check for green checkmarks)
4. Verify tables exist: Go to Supabase → Table Editor

---

## Test Checklist

After running the fix, verify:

- [ ] Can sign in with Google OAuth ✅
- [ ] Can add a category in Settings
- [ ] Can delete a category you created
- [ ] Can add a bank in Settings
- [ ] Can delete a bank you created
- [ ] Can add an expense
- [ ] Can see default categories (Food, Transport, etc.)
- [ ] Expenses show up in the budget page

---

## Need Help?

If you're still stuck:

1. Check the **browser console** (F12) for detailed errors
2. Go to **Supabase Dashboard** → **Table Editor**
3. Verify these tables exist:
   - `profiles`
   - `expenses`
   - `categories`
   - `banks`
   - `goals`
4. Check **Supabase Logs** for any database errors

---

## Success! 🎉

Once the fix is applied:
- ✅ No more foreign key errors
- ✅ Categories and banks work perfectly
- ✅ Everything references the right tables
- ✅ Auto-profile creation on Google sign-in
- ✅ Default categories are pre-loaded

**You're ready to start tracking expenses!** 💰
