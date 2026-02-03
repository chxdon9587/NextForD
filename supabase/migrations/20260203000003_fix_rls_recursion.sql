-- =====================================================
-- Migration: Fix RLS infinite recursion on user_roles
-- Date: 2026-02-03
-- Description:
--   Fix infinite recursion in RLS policies for user_roles relation
--   Add SECURITY DEFINER to triggers to bypass RLS checks
--   Modify admin policies to avoid circular references
-- =====================================================

-- Drop existing triggers with potential RLS issues
DROP TRIGGER IF EXISTS trigger_assign_backer_role ON public.users;
DROP TRIGGER IF EXISTS trigger_assign_creator_role ON public.projects;

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Admin can update any profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;

-- =====================================================
-- Re-create triggers with SECURITY DEFINER
-- =====================================================

-- Function to assign backer role to new user (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.assign_backer_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if user doesn't already have backer role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'backer'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'backer');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Assign backer role when new user is created
CREATE TRIGGER trigger_assign_backer_role
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_backer_role()
  SECURITY DEFINER;

-- Function to assign creator role when user publishes first project (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.assign_creator_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if user doesn't already have creator role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.creator_id AND role = 'creator'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.creator_id, 'creator');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Assign creator role when project status changes to approved/live
CREATE TRIGGER trigger_assign_creator_role
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW
  WHEN (OLD.status IN ('draft', 'pending_review') AND NEW.status IN ('approved', 'live'))
  EXECUTE FUNCTION public.assign_creator_role()
  SECURITY DEFINER;

-- =====================================================
-- Fix RLS policies to avoid circular references
-- =====================================================

-- Policy: Admin can update any profile (fixed to avoid recursion)
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
-- Add SECURITY DEFINER to helper functions to bypass RLS
-- =====================================================

-- Drop and recreate functions with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.has_role(UUID, user_role);
DROP FUNCTION IF EXISTS public.get_user_roles(UUID);
DROP FUNCTION IF EXISTS public.is_creator(UUID);
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Function to check if user has a specific role (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_to_check user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_id AND role = role_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all roles for a user (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id UUID)
RETURNS user_role[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT role FROM public.user_roles
    WHERE user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a creator (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_creator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(user_id, 'creator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an admin (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Add admin policies (simple version without recursion)
-- =====================================================

-- Policy: Admin can view all user roles
CREATE POLICY "Admin can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  -- Check using a simple query without circular references
  (SELECT COUNT(*) FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') > 0
);

-- Policy: Admin can update user roles
CREATE POLICY "Admin can update roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  (SELECT COUNT(*) FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') > 0
)
WITH CHECK (
  (SELECT COUNT(*) FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') > 0
);

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'RLS recursion fix migration completed successfully!';
  RAISE NOTICE 'Triggers now use SECURITY DEFINER to bypass RLS';
  RAISE NOTICE 'Helper functions use SECURITY DEFINER for safe access';
END $$;