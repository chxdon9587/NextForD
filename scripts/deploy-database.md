# Deploy Supabase Database - Manual Steps

## ⚠️ CRITICAL: Do this BEFORE using the auth features

The Supabase CLI cannot connect due to network restrictions. Follow these manual steps:

## Step 1: Deploy Schema

1. Go to https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam
2. Click **SQL Editor** in left sidebar
3. Click **New Query** 

### Run Migration 1: Core Tables
Copy entire contents of `supabase/migrations/20260202000001_create_core_tables.sql` and paste into SQL Editor, then click **Run**.

Expected output: "Success. No rows returned"

### Run Migration 2: RLS Policies
Copy entire contents of `supabase/migrations/20260202000002_create_rls_policies.sql` and paste into SQL Editor, then click **Run**.

Expected output: "Success. No rows returned"

### Run Migration 3: Functions & Triggers
Copy entire contents of `supabase/migrations/20260202000003_create_functions_and_triggers.sql` and paste into SQL Editor, then click **Run**.

Expected output: "Success. No rows returned"

### (Optional) Run Seed Data
Copy entire contents of `supabase/seed.sql` and paste into SQL Editor, then click **Run**.

This creates 2 test users and 1 project for testing.

## Step 2: Verify Deployment

In SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these 10 tables:
- backings
- comments
- escrow_transactions
- follows
- likes
- milestones
- project_updates
- projects
- rewards
- users

## Step 3: Generate TypeScript Types

Back in your terminal:
```bash
cd /Users/a1-6/workspace/4D

SUPABASE_ACCESS_TOKEN=sbp_09e5e839aea624db9264a2d728ed60b58e5d9966 \
supabase gen types typescript --linked > types/database.types.ts
```

This generates TypeScript types from your deployed schema.

## Step 4: Commit Changes

```bash
git add types/database.types.ts
git commit -m "generate database types from deployed schema"
```

## ✅ Verification

Your database is ready when:
- [x] All 3 migrations ran without errors
- [x] 10 tables exist in public schema
- [x] TypeScript types generated
- [x] No connection errors when running the app

## 🚀 After This

You can now:
- Sign up for accounts in the app
- Create projects
- Back projects
- Use all features that depend on the database

---

**Estimated time:** 5 minutes
