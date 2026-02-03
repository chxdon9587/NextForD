# Deploy RLS Infinite Recursion Fix

**Date:** 2026-02-03  
**File:** `supabase/migrations/20260203000003_fix_rls_recursion.sql`

## What This Migration Does

1. **Fixes RLS infinite recursion** - The `user_roles` table RLS policies were causing circular reference errors when creating projects  
2. **Adds SECURITY DEFINER to functions** - Allows role assignment functions to bypass RLS checks  
3. **Fixes circular reference in admin policies** - Simplifies admin role checking to avoid loops  
4. **Updates helper functions** - Adds `SECURITY DEFINER` to `has_role`, `is_creator`, `is_admin` functions

## Problem Solved

**Error:** `Error: infinite recursion detected in policy for relation "user_roles"`

**Root Cause:**
- The trigger `trigger_assign_backer_role` and `trigger_assign_creator_role` were attempting to insert into the `user_roles` table  
- The `user_roles` table has RLS enabled with policies that check related tables  
- This created a circular dependency causing infinite recursion

**Solution:**
- Functions that insert into `user_roles` now use `SECURITY DEFINER` to bypass RLS  
- **IMPORTANT:** Triggers do NOT need `SECURITY DEFINER` - it's only needed on function definitions  
- Admin policies are simplified to avoid subqueries that reference `user_roles`

## Deployment Steps

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam/sql/new

2. Copy and run the entire content of:
   `supabase/migrations/20260203000003_fix_rls_recursion.sql`

3. Click "Run" to execute the migration

## Verification

After deployment, run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check migration exists
SELECT * FROM pg_migrations
ORDER BY name DESC LIMIT 3;

-- 2. Check triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%role%';
-- Should see: trigger_assign_backer_role, trigger_assign_creator_role

-- 3. Check functions have SECURITY DEFINER
SELECT routine_name, routine_language, security_definer
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%role%';
-- Should show: has_role, get_user_roles, is_creator, is_admin
-- All should show: SECURITY DEFINER = f (false)
-- EXCEPT the actual functions which should have it = t (true)

-- 4. Test: Create a project should now work without error
```

## Testing Checklist

After deployment, test these scenarios:

**Test 1: Sign up new user**
```bash
# Expected:
# - New user automatically gets 'backer' role
# - No RLS recursion error
```

**Test 2: Create new project**
```bash
# Expected:
# - Project is created successfully
# - User automatically gets 'creator' role
# - No RLS recursion error
```

**Test 3: Check roles**
```sql
-- Verify user has both backer and creator roles
SELECT u.id, u.email, ur.role
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';
-- Should return: 2 rows (backer, creator)
```

## Key Changes

**Before:**
- Triggers: `EXECUTE FUNCTION name() SECURITY DEFINER` ❌ (WRONG SYNTAX)
- Functions: Without `SECURITY DEFINER`
- Policies: Admin policies using subqueries causing loops

**After:**
- Triggers: `EXECUTE FUNCTION name()` ✅ (CORRECT SYNTAX)
- Functions: `SECURITY DEFINER` ✅
- Policies: Simplified using direct checks ✅

## Notes

- This migration is **safe to run** - it only drops and recreates triggers/policies/functions  
- All existing data in `user_roles` table is preserved  
- This fix is backwards compatible with existing code  
- The previous migration (`20260203000001_multi_role_support.sql`) still exists but its problematic parts are overridden by this migration

## Reference

**Related Files:**
- `supabase/migrations/20260203000001_multi_role_support.sql` - Original multi-role migration  
- `app/actions/project.ts` - Creates projects and triggers auto-role assignment  
- `lib/roles.ts` - Frontend helper functions using these database functions

## Troubleshooting

**If you still see errors:**

1. Check if migration ran:  
```sql
SELECT * FROM pg_migrations
ORDER BY name DESC LIMIT 3;
```

2. Verify functions exist with correct properties:  
```sql
SELECT routine_name, routine_language, security_definer
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%role%';
```

3. Test with a simple insert:  
```sql
INSERT INTO public.users (id, email)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com')
ON CONFLICT (email) DO NOTHING;
-- This should auto-trigger and assign backer role
```

---

**Deploy Status:** ⏳ Pending your deployment  
**Risk Level:** Low (migration is idempotent and reversible)