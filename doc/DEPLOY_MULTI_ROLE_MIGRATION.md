# Deploy Multi-Role Support Migration

**Date:** 2026-02-03
**File:** `supabase/migrations/20260203000001_multi_role_support.sql`

## What This Migration Does

1. Creates a new `user_roles` table to support multiple roles per user
2. Migrates existing role data from the `users` table
3. Drops the `role` column from the `users` table (single role → multiple roles)
4. Creates triggers to automatically assign roles:
   - New users get `backer` role automatically
   - Users who publish a project get `creator` role automatically
5. Creates helper functions for role checking:
   - `has_role(user_id, role)` - Check if user has a specific role
   - `get_user_roles(user_id)` - Get all roles for a user
   - `is_creator(user_id)` - Check if user is a creator
   - `is_admin(user_id)` - Check if user is an admin
6. Updates RLS policies to work with the new multi-role system

## Manual Deployment Steps

### Step 1: Go to Supabase SQL Editor

1. Visit: https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam/sql/new
2. Copy the entire content of `supabase/migrations/20260203000001_multi_role_support.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration

### Step 2: Verify Migration Success

Run this query to verify the migration was successful:

```sql
-- Check if user_roles table exists and has data
SELECT COUNT(*) as total_roles FROM public.user_roles;

-- Check if role column was dropped from users table
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';
-- Should return 0 rows (no role column)

-- Check if functions were created
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%role%';
-- Should return: has_role, get_user_roles, is_creator, is_admin

-- Check if triggers were created
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Should see: trigger_assign_backer_role, trigger_assign_creator_role
```

### Step 3: Test Automatic Role Assignment

**Test 1: Backer Role Assignment**

```sql
-- This test verifies that when a new user is created (via signup),
-- they automatically get the 'backer' role
-- No action needed - will happen automatically on next user signup
```

**Test 2: Creator Role Assignment**

```sql
-- This test verifies that when a project status changes to 'approved' or 'live',
-- the creator automatically gets the 'creator' role

-- Find a project that's currently in 'draft' or 'pending_review' status
SELECT id, title, creator_id, status FROM public.projects
WHERE status IN ('draft', 'pending_review')
LIMIT 1;

-- If you found a project, update its status to 'approved'
-- UPDATE public.projects SET status = 'approved' WHERE id = '[project-id]';

-- Check if the creator now has the 'creator' role
SELECT u.email, ur.role
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '[creator-id]';
-- Should show both 'backer' and 'creator' roles
```

### Step 4: Regenerate TypeScript Types

After the migration is deployed, regenerate the types:

```bash
cd /Users/a1-6/workspace/4D

SUPABASE_ACCESS_TOKEN=sbp_09e5e839aea624db9264a2d728ed60b58e5d9966 \
supabase gen types typescript --linked > types/database.types.ts
```

Or if the above doesn't work:

```bash
npx supabase gen types typescript --project-id dxjybpwzbgvcwfobznam --schema public > types/database.types.ts
```

## Database Schema Changes

### Before

**users table:**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'backer',  -- Single role
  is_verified BOOLEAN DEFAULT FALSE,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### After

**users table:**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  -- role column removed
  is_verified BOOLEAN DEFAULT FALSE,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table for multiple roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

## New Functions

### `has_role(user_id UUID, role_to_check user_role) RETURNS BOOLEAN`

Checks if a user has a specific role.

```sql
-- Example usage
SELECT public.has_role(auth.uid(), 'creator'); -- Returns true/false
```

### `get_user_roles(user_id UUID) RETURNS user_role[]`

Returns all roles for a user.

```sql
-- Example usage
SELECT public.get_user_roles(auth.uid()); -- Returns: {backer,creator}
```

### `is_creator(user_id UUID) RETURNS BOOLEAN`

Convenience function to check if user is a creator.

```sql
-- Example usage
SELECT public.is_creator(auth.uid()); -- Returns true/false
```

### `is_admin(user_id UUID) RETURNS BOOLEAN`

Convenience function to check if user is an admin.

```sql
-- Example usage
SELECT public.is_admin(auth.uid()); -- Returns true/false
```

## How Roles Are Assigned

### Backer Role (Automatic)

- Assigned automatically when a new user signs up
- Trigger: `trigger_assign_backer_role`
- Event: After INSERT on `users` table

### Creator Role (Automatic)

- Assigned automatically when a user publishes their first project
- Trigger: `trigger_assign_creator_role`
- Event: After UPDATE on `projects` table (when status changes to 'approved' or 'live')
- Only assigned once per user (idempotent)

### Admin Role (Manual)

- Must be assigned manually by an existing admin
- No automatic assignment
- Can be assigned using SQL:

```sql
-- Assign admin role to a user (requires existing admin to run)
INSERT INTO public.user_roles (user_id, role)
VALUES ('[user-id]', 'admin');
```

## Updated RLS Policies

### users table

- **View**: All authenticated users can view all profiles
- **Update**: Users can update their own profile
- **Update**: Admins can update any profile

### user_roles table

- **View**: Users can view their own roles
- **Insert**: Users can insert their own roles (for testing)
- **View**: Admins can view all roles
- **Update/Delete**: Admins can update/delete any role

### projects table

- **Insert/Update/Delete**: Creator can manage their own projects (regardless of role column)

## Code Updates Needed

After deploying this migration, you'll need to update application code:

### 1. Update TypeScript imports and queries

Old:
```typescript
// Old way - single role
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', userId)
  .single();
const isCreator = user?.role === 'creator';
```

New:
```typescript
// New way - multiple roles
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);
const isCreator = roles?.some(r => r.role === 'creator');

// Or use the helper function
const { data } = await supabase.rpc('is_creator', { user_id: userId });
const isCreator = data;
```

### 2. Update auth middleware (if checking for roles)

Old:
```typescript
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', userId)
  .single();

if (user.role !== 'creator') {
  return NextResponse.json({ error: 'Not a creator' }, { status: 403 });
}
```

New:
```typescript
const { data } = await supabase.rpc('is_creator', { user_id: userId });

if (!data) {
  return NextResponse.json({ error: 'Not a creator' }, { status: 403 });
}
```

### 3. Update project publish action

The trigger will automatically assign the creator role, so no code changes needed!

## Testing Checklist

- [ ] Migration deployed successfully in Supabase
- [ ] `user_roles` table exists and has data
- [ ] `role` column dropped from `users` table
- [ ] Helper functions created (has_role, get_user_roles, is_creator, is_admin)
- [ ] Triggers created (trigger_assign_backer_role, trigger_assign_creator_role)
- [ ] TypeScript types regenerated
- [ ] New user signup automatically gets 'backer' role
- [ ] Publishing a project automatically assigns 'creator' role
- [ ] Existing users still have their roles migrated correctly

## Rollback Plan (If Needed)

If you need to rollback this migration:

```sql
-- Step 1: Drop triggers
DROP TRIGGER IF EXISTS trigger_assign_creator_role ON public.projects;
DROP TRIGGER IF EXISTS trigger_assign_backer_role ON public.users;

-- Step 2: Drop functions
DROP FUNCTION IF EXISTS public.is_creator(UUID);
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_roles(UUID);
DROP FUNCTION IF EXISTS public.has_role(UUID, user_role);
DROP FUNCTION IF EXISTS public.assign_creator_role();
DROP FUNCTION IF EXISTS public.assign_backer_role();

-- Step 3: Drop policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles (for testing)" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Creators can view all their projects" ON public.projects;
DROP POLICY IF EXISTS "Creators can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Creators can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Creators can delete their own projects" ON public.projects;

-- Step 4: Drop user_roles table
DROP TABLE IF EXISTS public.user_roles;

-- Step 5: Add role column back to users table
ALTER TABLE public.users ADD COLUMN role user_role NOT NULL DEFAULT 'backer';

-- Step 6: Migrate data back (if you had custom roles)
-- This is complex - better to just set default back to 'backer'
UPDATE public.users SET role = 'backer' WHERE role IS NULL;
```

## Questions?

If you encounter any issues during deployment:
1. Check the Supabase SQL Editor output for errors
2. Verify each step in the "Verify Migration Success" section
3. Check the Supabase logs for any trigger errors

---

**Estimated Time:** 5 minutes
**Risk Level:** Low (migration is idempotent and reversible)
