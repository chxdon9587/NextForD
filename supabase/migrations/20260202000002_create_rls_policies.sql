-- =====================================================
-- 4D Crowdfunding Platform - Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Users Table Policies
-- =====================================================

CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Projects Table Policies
-- =====================================================

CREATE POLICY "Anyone can view approved/live projects"
  ON public.projects FOR SELECT
  USING (status IN ('approved', 'live', 'successful', 'failed'));

CREATE POLICY "Creators can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Creators can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('creator', 'admin')
    )
  );

CREATE POLICY "Creators can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (
    auth.uid() = creator_id
    AND status NOT IN ('successful', 'cancelled')
  );

CREATE POLICY "Creators can delete own draft projects"
  ON public.projects FOR DELETE
  USING (
    auth.uid() = creator_id
    AND status = 'draft'
  );

-- =====================================================
-- Milestones Table Policies
-- =====================================================

CREATE POLICY "Milestones visible with project"
  ON public.milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = milestones.project_id
      AND (
        projects.status IN ('live', 'successful', 'failed')
        OR projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Creators can insert milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = milestones.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update milestones"
  ON public.milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = milestones.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete milestones"
  ON public.milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = milestones.project_id
      AND projects.creator_id = auth.uid()
      AND projects.status = 'draft'
    )
  );

-- =====================================================
-- Rewards Table Policies
-- =====================================================

CREATE POLICY "Rewards visible with project"
  ON public.rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = rewards.project_id
      AND (
        projects.status IN ('live', 'successful', 'failed')
        OR projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Creators can insert rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = rewards.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update rewards"
  ON public.rewards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = rewards.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete rewards"
  ON public.rewards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = rewards.project_id
      AND projects.creator_id = auth.uid()
      AND projects.status IN ('draft', 'pending_review')
    )
  );

-- =====================================================
-- Backings Table Policies
-- =====================================================

CREATE POLICY "Backers can view own backings"
  ON public.backings FOR SELECT
  USING (auth.uid() = backer_id);

CREATE POLICY "Creators can view project backings"
  ON public.backings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = backings.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all backings"
  ON public.backings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create backings"
  ON public.backings FOR INSERT
  WITH CHECK (
    auth.uid() = backer_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = backings.project_id
      AND projects.status = 'live'
    )
  );

CREATE POLICY "Backers can update own backings"
  ON public.backings FOR UPDATE
  USING (auth.uid() = backer_id)
  WITH CHECK (auth.uid() = backer_id);

-- =====================================================
-- Escrow Transactions Policies
-- =====================================================

CREATE POLICY "Backers can view own escrow"
  ON public.escrow_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.backings
      WHERE backings.id = escrow_transactions.backing_id
      AND backings.backer_id = auth.uid()
    )
  );

CREATE POLICY "Creators can view project escrow"
  ON public.escrow_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = escrow_transactions.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all escrow"
  ON public.escrow_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- Comments Table Policies
-- =====================================================

CREATE POLICY "Comments visible on live projects"
  ON public.comments FOR SELECT
  USING (
    NOT is_deleted
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = comments.project_id
      AND projects.status IN ('live', 'successful', 'failed')
    )
  );

CREATE POLICY "Authenticated users can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = comments.project_id
      AND projects.status = 'live'
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Project Updates Policies
-- =====================================================

CREATE POLICY "Public updates visible to all"
  ON public.project_updates FOR SELECT
  USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_updates.project_id
      AND projects.status IN ('live', 'successful', 'failed')
    )
  );

CREATE POLICY "Backer-only updates visible to backers"
  ON public.project_updates FOR SELECT
  USING (
    visibility = 'backers_only'
    AND (
      EXISTS (
        SELECT 1 FROM public.backings
        WHERE backings.project_id = project_updates.project_id
        AND backings.backer_id = auth.uid()
        AND backings.payment_status = 'succeeded'
      )
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_updates.project_id
        AND projects.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Creators can insert updates"
  ON public.project_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_updates.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update own updates"
  ON public.project_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_updates.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete own updates"
  ON public.project_updates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_updates.project_id
      AND projects.creator_id = auth.uid()
    )
  );

-- =====================================================
-- Likes Table Policies
-- =====================================================

CREATE POLICY "Anyone can view likes"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON public.likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = likes.project_id
      AND projects.status IN ('live', 'successful', 'failed')
    )
  );

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Follows Table Policies
-- =====================================================

CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully!';
END $$;
