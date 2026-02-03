-- =====================================================
-- Migration: Support Multiple User Roles
-- Date: 2026-02-03
-- Description:
--   1. Create user_roles table to store multiple roles per user
--   2. Migrate existing role data from users table
--   3. Drop role column from users table
--   4. Create trigger to assign backer role to new users
--   5. Create trigger to assign creator role when user publishes a project
--   6. Update RLS policies to work with new multi-role system
-- =====================================================

-- =====================================================
-- Step 1: Create user_roles table
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, role)
);

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- =====================================================
-- Step 2: Migrate existing role data from users table
-- =====================================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.users;

-- =====================================================
-- Step 3: Update existing RLS policies that reference users.role
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Creators can insert projects" ON public.projects;
CREATE POLICY "Creators can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Milestones visible with project" ON public.milestones;
CREATE POLICY "Milestones visible with project"
  ON public.milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = milestones.project_id
      AND (
        projects.status IN ('live', 'successful', 'failed')
        OR projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Rewards visible with project" ON public.rewards;
CREATE POLICY "Rewards visible with project"
  ON public.rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = rewards.project_id
      AND (
        projects.status IN ('live', 'successful', 'failed')
        OR projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins can view all backings" ON public.backings;
CREATE POLICY "Admins can view all backings"
  ON public.backings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all escrow" ON public.escrow_transactions;
CREATE POLICY "Admins can view all escrow"
  ON public.escrow_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Step 4: Drop role column from users table
-- =====================================================
ALTER TABLE public.users DROP COLUMN IF EXISTS role;

-- =====================================================
-- Step 5: Create trigger to assign backer role to new users
-- =====================================================

-- Function to assign backer role to new user
CREATE OR REPLACE FUNCTION public.assign_backer_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'backer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Assign backer role when new user is created
DROP TRIGGER IF EXISTS trigger_assign_backer_role ON public.users;
CREATE TRIGGER trigger_assign_backer_role
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_backer_role()
  SECURITY DEFINER;

-- Trigger: Assign creator role when project status changes to approved/live
DROP TRIGGER IF EXISTS trigger_assign_creator_role ON public.projects;
CREATE TRIGGER trigger_assign_creator_role
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW
  WHEN (OLD.status IN ('draft', 'pending_review') AND NEW.status IN ('approved', 'live'))
  EXECUTE FUNCTION public.assign_creator_role()
  SECURITY DEFINER;

-- =====================================================
-- Step 7: Update RLS policies for multi-role system
-- =====================================================

-- Drop existing policies that reference the old role column
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Create new policy: All authenticated users can view profiles
CREATE POLICY "Users can view all profiles"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admin can update any profile
CREATE POLICY "Admin can update any profile"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- =====================================================
-- Step 8: Update user_roles table RLS policies
-- =====================================================

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can insert their own roles (for testing)
CREATE POLICY "Users can insert own roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Admin can view all user roles
CREATE POLICY "Admin can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Policy: Admin can update user roles
CREATE POLICY "Admin can update roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- =====================================================
-- Step 9: Helper functions for role checking
-- =====================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_to_check user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id UUID)
RETURNS user_role[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT role FROM public.user_roles
    WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a creator
CREATE OR REPLACE FUNCTION public.is_creator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(user_id, 'creator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 10: Update other policies that check roles
-- =====================================================

DROP POLICY IF EXISTS "Creators can view all their projects" ON public.projects;
CREATE POLICY "Creators can view all their projects"
ON public.projects FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can update their own projects" ON public.projects;
CREATE POLICY "Creators can update their own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can delete their own projects" ON public.projects;
CREATE POLICY "Creators can delete their own projects"
ON public.projects FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Multi-role support migration completed successfully!';
  RAISE NOTICE 'Users table: role column dropped';
  RAISE NOTICE 'user_roles table: created with trigger-based role assignment';
  RAISE NOTICE 'Functions created: has_role(), get_user_roles(), is_creator(), is_admin()';
END $$;
