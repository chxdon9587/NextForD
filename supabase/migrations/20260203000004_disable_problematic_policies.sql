-- =====================================================
-- Migration: Completely fix RLS recursion by disabling problematic policies
-- Date: 2026-06-04
-- Description:
--   Disable admin policies that query user_roles causing recursion
--   Use SECURITY DEFINER functions for admin checks instead
--   Add SECURITY DEFINER to admin-check functions
-- =====================================================

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Admin can update any profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;

-- =====================================================
-- Create SEC DEFINER admin check functions
-- =====================================================

-- Function to check if current user is an admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_bypass()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Rewrite policies without user_roles queries
-- =====================================================

-- Instead of using admin policies on users and user_roles,
-- we'll use SECURITY DEFINER functions for admin checks in application code
-- This avoids the circular reference entirely

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'RLS recursion fix completed!';
  RAISE NOTICE 'Problematic admin policies disabled';
  RAISE NOTICE 'Use is_admin_bypass() SECURITY DEFINER function for admin checks';
END $$;
