# 🚀 Quick Start: Deploy to Supabase

This guide gets your 4D Crowdfunding database up and running in 5 minutes.

## Prerequisites

- [x] Supabase CLI installed (v2.72.7+)
- [x] Supabase account ([supabase.com](https://supabase.com))
- [x] Git repository cloned

## Option 1: Deploy to Supabase Cloud (Recommended)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: 4D-Crowdfunding
   - **Database Password**: (save this!)
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for provisioning

### Step 2: Get Your Credentials

1. In project dashboard, go to **Settings** > **API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Link Your Local Project

```bash
cd /Users/a1-6/workspace/4D

supabase link --project-ref xxxxx
```

### Step 4: Deploy Database Schema

```bash
supabase db push
```

You should see:
```
Applying migration 20260202000001_create_core_tables.sql...
Applying migration 20260202000002_create_rls_policies.sql...
Applying migration 20260202000003_create_functions_and_triggers.sql...
Finished supabase db push.
```

### Step 5: Verify Deployment

```bash
supabase db remote commit
```

Visit your Supabase Dashboard > **Database** > **Tables** to see all 10 tables created!

### Step 6: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Step 7: Load Test Data (Optional)

```bash
supabase db remote psql < supabase/seed.sql
```

### Step 8: Generate TypeScript Types

```bash
supabase gen types typescript --linked > types/supabase.ts
```

## Option 2: Local Development Setup

### Step 1: Start Local Supabase

```bash
supabase start
```

Output will show:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
anon key: eyJhbGci...
service_role key: eyJhbGci...
```

### Step 2: Migrations Already Applied!

Local Supabase automatically applies migrations from `/supabase/migrations/`.

### Step 3: Load Test Data

```bash
supabase db reset --db-only
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/seed.sql
```

### Step 4: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with local credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Step 5: Generate Types

```bash
supabase gen types typescript --local > types/supabase.ts
```

## ✅ Verification Checklist

Run these checks to ensure everything works:

### 1. Check Tables

```bash
supabase db remote ls  # For cloud
# OR
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt public.*"  # For local
```

Expected output: 10 tables

### 2. Verify RLS Policies

```sql
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

Expected: 40+ policies

### 3. Test Functions

```sql
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

Expected: 11 functions

### 4. Query Sample Data

```sql
SELECT title, status, current_amount, goal_amount FROM projects;
```

If you loaded seed data, you should see "Revolutionary 3D Printer"

## 🎯 Next Steps

1. **Test Client Connection**
   ```bash
   npm install @supabase/supabase-js
   npx tsx scripts/test-connection.ts
   ```

2. **Build Your Next.js App**
   - Copy client setup from `/TECHNICAL_ARCHITECTURE.md`
   - Use types from `/types/supabase.ts`
   - Follow patterns in `/.opencode/prompts/`

3. **Configure Stripe**
   - Set up Stripe account
   - Add webhook endpoint
   - Configure environment variables

4. **Enable Realtime**
   In Supabase Dashboard:
   - Database > Replication > Enable for tables
   - Projects table > Enable Realtime

## 🔍 Troubleshooting

### Error: "relation does not exist"
**Solution**: Migrations didn't apply. Run `supabase db push` again.

### Error: "RLS policy blocks query"
**Solution**: Check you're using correct authentication context. Use service_role key for testing.

### Error: "Function not found"
**Solution**: Migration 003 didn't apply. Check migration status with `supabase migration list`

### Error: "Connection refused"
**Solution**: 
- **Cloud**: Check project URL is correct
- **Local**: Run `supabase start` first

## 📚 Additional Resources

- **Full Setup Guide**: `/SUPABASE_SETUP_SUMMARY.md`
- **Verification Tests**: `/scripts/verify-supabase-setup.md`
- **Technical Docs**: `/TECHNICAL_ARCHITECTURE.md`
- **Database Operations**: `/.opencode/prompts/database-operations.md`

## 🆘 Getting Help

### Check Migration Status
```bash
supabase migration list
```

### View Logs
```bash
supabase functions serve  # Watch edge functions
supabase logs  # View all logs
```

### Reset Database (Development Only!)
```bash
supabase db reset
```

⚠️ **Warning**: This deletes all data!

## 🎉 Success!

You now have a fully functional Supabase database with:
- ✅ 10 tables with proper relationships
- ✅ 40+ RLS policies for security
- ✅ 11 database functions
- ✅ 15+ automatic triggers
- ✅ Test data loaded (optional)
- ✅ TypeScript types generated

Ready to build your crowdfunding platform! 🚀
