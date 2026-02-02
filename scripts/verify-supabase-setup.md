# Supabase Setup Verification Guide

This guide helps you verify that your Supabase database is correctly configured with all migrations, RLS policies, and test data.

## Prerequisites

1. Supabase project created (either local or cloud)
2. Environment variables configured in `.env.local`
3. Supabase CLI installed

## Step 1: Configure Your Supabase Project

### Option A: Use Supabase Cloud

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Get your credentials from Project Settings > API
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Option B: Use Local Supabase (Development)

1. Start local Supabase:
   ```bash
   supabase start
   ```
2. Note the output credentials (API URL, anon key, service_role key)
3. Update `.env.local` with local credentials

## Step 2: Link to Your Supabase Project

### For Cloud Project:
```bash
supabase link --project-ref your-project-id
```

### For Local Project:
Already linked when you run `supabase start`

## Step 3: Apply Database Migrations

Run all migrations in order:

```bash
supabase db push
```

This will apply:
1. `20260202000001_create_core_tables.sql` - Creates all database tables
2. `20260202000002_create_rls_policies.sql` - Sets up Row Level Security
3. `20260202000003_create_functions_and_triggers.sql` - Creates database functions

## Step 4: Verify Migrations

Check that all tables were created:

```bash
supabase db reset
```

Or query directly:
```bash
psql -h localhost -p 54322 -U postgres -d postgres -c "\dt public.*"
```

Expected tables:
- users
- projects
- milestones
- rewards
- backings
- escrow_transactions
- comments
- project_updates
- likes
- follows

## Step 5: Seed Test Data (Optional)

```bash
psql $(supabase status -o env | grep DATABASE_URL | cut -d '=' -f2-) < supabase/seed.sql
```

Or manually in Supabase Dashboard > SQL Editor.

## Step 6: Verify RLS Policies

### Test 1: Public can view live projects
```sql
SELECT * FROM public.projects WHERE status = 'live';
```
✅ Should return projects with status 'live'

### Test 2: Authenticated user can create project
First, get a valid JWT token from Supabase Auth, then:
```sql
SET LOCAL auth.uid = 'your-user-id';
INSERT INTO public.projects (creator_id, title, ...) VALUES (...);
```
✅ Should succeed if creator_id = auth.uid

### Test 3: User cannot view others' draft projects
```sql
SET LOCAL auth.uid = 'user-id-1';
SELECT * FROM public.projects WHERE creator_id = 'user-id-2' AND status = 'draft';
```
❌ Should return empty (RLS blocks access)

## Step 7: Test Database Functions

### Test get_project_stats
```sql
SELECT * FROM get_project_stats('project-id');
```

Expected output:
```
 total_backers | total_amount | avg_backing | completion_percentage | days_remaining
---------------+--------------+-------------+-----------------------+----------------
             1 |       699.00 |      699.00 |                  1.40 |             53
```

### Test get_creator_stats
```sql
SELECT * FROM get_creator_stats('creator-user-id');
```

Expected output:
```
 total_projects | total_raised | total_backers | success_rate
----------------+--------------+---------------+--------------
              1 |       699.00 |             1 |         0.00
```

## Step 8: Test Triggers

### Test auto-update updated_at
```sql
UPDATE public.projects SET title = 'New Title' WHERE id = 'project-id';
SELECT updated_at FROM public.projects WHERE id = 'project-id';
```
✅ updated_at should be current timestamp

### Test auto-update project funding
```sql
INSERT INTO public.backings (project_id, backer_id, amount, payment_status)
VALUES ('project-id', 'user-id', 100.00, 'succeeded');

SELECT current_amount, backer_count FROM public.projects WHERE id = 'project-id';
```
✅ current_amount and backer_count should be updated automatically

### Test milestone completion check
```sql
UPDATE public.milestones 
SET current_amount = goal_amount 
WHERE id = 'milestone-id' AND status = 'in_progress';

SELECT status FROM public.milestones WHERE id = 'milestone-id';
```
✅ status should automatically change to 'completed'

## Step 9: Generate TypeScript Types

```bash
supabase gen types typescript --local > types/supabase.ts
```

Or for cloud:
```bash
supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

## Step 10: Test Client Connection

Create a simple test file:

```typescript
// test-connection.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testConnection() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'live')

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success! Found projects:', data)
  }
}

testConnection()
```

Run:
```bash
npx tsx test-connection.ts
```

## Troubleshooting

### Issue: RLS policies block all queries
**Solution:** Make sure you're using the correct auth context. Use service_role key for admin operations, anon key with proper auth.uid() for user operations.

### Issue: Migrations fail with duplicate key error
**Solution:** Reset database and reapply migrations:
```bash
supabase db reset
supabase db push
```

### Issue: Functions not found
**Solution:** Check that migration 003 was applied:
```bash
psql ... -c "\df public.*"
```

### Issue: Triggers not firing
**Solution:** Verify triggers exist:
```bash
psql ... -c "SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';"
```

## Verification Checklist

- [ ] All 10 tables created
- [ ] RLS enabled on all tables
- [ ] Can query public projects without auth
- [ ] Cannot query draft projects of other users
- [ ] Triggers update timestamps automatically
- [ ] Project funding updates when backing created
- [ ] Milestone status updates when goal reached
- [ ] Database functions return correct results
- [ ] TypeScript types generated
- [ ] Client can connect and query data

## Next Steps

Once verification is complete:
1. Integrate Supabase client in Next.js app
2. Implement authentication flows
3. Create API routes for complex operations
4. Set up Stripe webhook handlers
5. Implement real-time subscriptions

## Support

- Supabase Docs: https://supabase.com/docs
- SQL Reference: https://www.postgresql.org/docs/
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
