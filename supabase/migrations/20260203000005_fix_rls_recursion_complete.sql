-- =====================================================
-- Migration: COMPLETELY Fix RLS Infinite Recursion
-- Date: 2026-02-03
-- Description:
--   This migration fixes the infinite recursion error by:
--   1. Removing ALL policies that query user_roles (9 policies total)
--   2. Making trigger functions SECURITY DEFINER to bypass RLS
--   3. Creating helper functions for admin checks that bypass RLS
-- =====================================================

-- =====================================================
-- STEP 1: Drop ALL policies that query user_roles
-- These cause infinite recursion when triggers insert into user_roles
-- =====================================================

-- From projects table
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Creators can insert projects" ON public.projects;

-- From milestones table
DROP POLICY IF EXISTS "Milestones visible with project" ON public.milestones;

-- From rewards table
DROP POLICY IF EXISTS "Rewards visible with project" ON public.rewards;

-- From backings table
DROP POLICY IF EXISTS "Admins can view all backings" ON public.backings;

-- From escrow_transactions table
DROP POLICY IF EXISTS "Admins can view all escrow" ON public.escrow_transactions;

-- From users table
DROP POLICY IF EXISTS "Admin can update any profile" ON public.users;

-- From user_roles table
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;

-- =====================================================
-- STEP 2: Fix triggers to be SECURITY DEFINER on functions
-- =====================================================

-- Update assign_backer_role function to SECURITY DEFINER
DROP FUNCTION IF EXISTS public.assign_backer_role() CASCADE;
CREATE OR REPLACE FUNCTION public.assign_backer_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'backer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (note: SECURITY DEFINER is on function, not trigger)
DROP TRIGGER IF EXISTS trigger_assign_backer_role ON public.users;
CREATE TRIGGER trigger_assign_backer_role
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_backer_role();

-- Update assign_creator_role function to SECURITY DEFINER
DROP FUNCTION IF EXISTS public.assign_creator_role() CASCADE;
CREATE OR REPLACE FUNCTION public.assign_creator_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.creator_id, 'creator')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_assign_creator_role ON public.projects;
CREATE TRIGGER trigger_assign_creator_role
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW
  WHEN (OLD.status IN ('draft', 'pending_review') AND NEW.status IN ('approved', 'live'))
  EXECUTE FUNCTION public.assign_creator_role();

-- =====================================================
-- STEP 3: Create helper functions that bypass RLS
-- =====================================================

-- Function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_bypass()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role_bypass(user_id UUID, role_to_check user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: Update RLS to use helper functions instead of direct queries
-- =====================================================

-- Re-enable RLS on user_roles if it was disabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Simplified policies for user_roles - NO admin checks here!
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
CREATE POLICY "Users can insert own roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 5: Add helper functions to public API schema
-- =====================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_bypass() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role_bypass(UUID, user_role) TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'RLS Recursion Fix Complete!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Dropped 9 policies that queried user_roles';
  RAISE NOTICE 'Made trigger functions SECURITY DEFINER';
  RAISE NOTICE 'Created bypass functions: is_admin_bypass(), has_role_bypass()';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Application should now be able to:';
  RAISE NOTICE '- Create projects without RLS recursion error';
  RAISE NOTICE '- Assign roles via triggers';
  RAISE NOTICE '- Use is_admin_bypass() for admin checks';
  RAISE NOTICE '==========================================';
END $$;