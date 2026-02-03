-- =====================================================
-- Migration: Add Project Creation Policies (No RLS Recursion)
-- Date: 2026-02-03
-- Description:
--   Re-add necessary policies for project creation without causing RLS recursion
--   - Allow creators to insert their own projects
--   - Allow admins to view all projects
-- =====================================================

-- =====================================================
-- Policy: Creators can insert projects
-- =====================================================
DROP POLICY IF EXISTS "Creators can insert projects" ON public.projects;

CREATE POLICY "Creators can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = creator_id
  );
-- Note: Creator role is auto-assigned by trigger when project is published
-- So we allow insertion first, then trigger assigns creator role

-- =====================================================
-- Policy: Admins can view all projects
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;

CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.is_admin_bypass());
-- Use SECURITY DEFINER function instead of querying user_roles directly

-- =====================================================
-- Policy: Admins can update projects
-- =====================================================
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.is_admin_bypass())
  WITH CHECK (public.is_admin_bypass());

-- =====================================================
-- Policy: Milestones visible to admins
-- =====================================================
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
        OR public.is_admin_bypass()
      )
    )
  );

-- =====================================================
-- Policy: Rewards visible to admins
-- =====================================================
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
        OR public.is_admin_bypass()
      )
    )
  );

-- =====================================================
-- Policy: Admins can view all backings
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all backings" ON public.backings;

CREATE POLICY "Admins can view all backings"
  ON public.backings FOR SELECT
  TO authenticated
  USING (public.is_admin_bypass());

-- =====================================================
-- Policy: Admins can view all escrow transactions
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all escrow" ON public.escrow_transactions;

CREATE POLICY "Admins can view all escrow"
  ON public.escrow_transactions FOR SELECT
  TO authenticated
  USING (public.is_admin_bypass());

-- =====================================================
-- Policy: Admins can update any profile
-- =====================================================
DROP POLICY IF EXISTS "Admin can update any profile" ON public.users;

CREATE POLICY "Admin can update any profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.is_admin_bypass())
  WITH CHECK (public.is_admin_bypass());

-- =====================================================
-- Policy: Admins can view all user roles
-- =====================================================
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;

CREATE POLICY "Admin can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin_bypass());

-- =====================================================
-- Policy: Admins can update user roles
-- =====================================================
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;

CREATE POLICY "Admin can update roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin_bypass())
  WITH CHECK (public.is_admin_bypass());

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Project Creation Policies Added!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Re-added 9 policies using is_admin_bypass()';
  RAISE NOTICE 'No RLS recursion - functions bypass RLS';
  RAISE NOTICE 'Project creation should now work';
  RAISE NOTICE '==========================================';
END $$;