  # Supabase Setup Guide

This guide will help you set up Supabase for the Rizqly GenZ app.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Fill in the details:
   - **Name**: flux-financial-genz (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the left sidebar
2. Go to **API** section
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (a long JWT token starting with `eyJ...`)

## Step 3: Set Up Environment Variables

1. In your project root, create a `.env.local` file:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace `your_project_url_here` and `your_anon_key_here` with the values you copied

3. **Important**: Make sure `.env.local` is in your `.gitignore` file (it should be by default in Next.js)

## Step 4: Create Database Tables

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar
2. Click "New Query"
3. Copy and paste the following SQL schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  bank_account TEXT NOT NULL DEFAULT 'Cash',
  raw_input TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  emoji TEXT,
  deadline DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  monthly_limit DECIMAL(10, 2) NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (user_id, name, emoji, color, is_default) VALUES
  (NULL, 'Food', '🍔', '#FF6B6B', TRUE),
  (NULL, 'Transport', '🚗', '#4ECDC4', TRUE),
  (NULL, 'Shopping', '🛍️', '#FFE66D', TRUE),
  (NULL, 'Entertainment', '🎮', '#A8E6CF', TRUE),
  (NULL, 'Bills', '📱', '#FF8B94', TRUE),
  (NULL, 'Health', '💊', '#95E1D3', TRUE),
  (NULL, 'Education', '📚', '#C7CEEA', TRUE),
  (NULL, 'Other', '💰', '#FFDAC1', TRUE);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
5. You should see a success message

## Step 5: Set Up Authentication

1. In your Supabase dashboard, go to **Authentication** in the left sidebar
2. Click on **Providers**
3. Enable **Email** provider (should be enabled by default)
4. Optionally, enable social providers (Google, GitHub, etc.) if you want

## Step 6: Configure Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the email templates to match your brand
3. Update the confirmation and magic link emails

## Step 7: Install Supabase Client

Run this command in your terminal:

```bash
npm install @supabase/supabase-js
```

## Step 8: Create Supabase Client

The Supabase client configuration file has been created at `lib/supabase/client.ts`

## Testing Your Connection

After completing the setup, you can test your connection by:

1. Starting your development server: `npm run dev`
2. The app should connect to Supabase successfully
3. Check the browser console for any connection errors

## Troubleshooting

### "Invalid API key" error

- Double-check your `.env.local` file has the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after changing environment variables

### "Row Level Security" errors

- Make sure you ran all the SQL in Step 4
- Check that RLS policies are enabled on all tables

### Tables not found

- Verify the SQL schema was executed successfully in the SQL Editor
- Check the Table Editor in Supabase to see if tables exist

## Next Steps

Once your Supabase is set up:

- Start adding authentication to your app
- Create your first expense
- Test the database queries

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. Use **Row Level Security** policies (already set up)
3. Keep your **anon key** public-facing only
4. Never expose your **service_role** key in client-side code
5. Use **environment variables** for all sensitive data

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
