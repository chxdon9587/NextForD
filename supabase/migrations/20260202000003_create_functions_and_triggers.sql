-- =====================================================
-- 4D Crowdfunding Platform - Database Functions & Triggers
-- =====================================================

-- =====================================================
-- 1. Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_milestones
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_rewards
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_backings
  BEFORE UPDATE ON public.backings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_escrow
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_updates
  BEFORE UPDATE ON public.project_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. Auto-create user profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'backer')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 3. Update project funding when backing changes
-- =====================================================
CREATE OR REPLACE FUNCTION update_project_funding()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET 
    current_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.backings
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
      AND payment_status = 'succeeded'
    ),
    backer_count = (
      SELECT COUNT(DISTINCT backer_id)
      FROM public.backings
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
      AND payment_status = 'succeeded'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_project_funding_insert
  AFTER INSERT ON public.backings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_funding();

CREATE TRIGGER trg_update_project_funding_update
  AFTER UPDATE OF payment_status, amount ON public.backings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_funding();

CREATE TRIGGER trg_update_project_funding_delete
  AFTER DELETE ON public.backings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_funding();

-- =====================================================
-- 4. Update milestone funding when backing changes
-- =====================================================
CREATE OR REPLACE FUNCTION update_milestone_funding()
RETURNS TRIGGER AS $$
DECLARE
  v_milestone_id UUID;
  v_milestone_amount NUMERIC;
BEGIN
  FOR v_milestone_id IN
    SELECT id FROM public.milestones
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ORDER BY order_index
  LOOP
    SELECT COALESCE(SUM(e.amount), 0) INTO v_milestone_amount
    FROM public.escrow_transactions e
    WHERE e.milestone_id = v_milestone_id
    AND e.status = 'held';

    UPDATE public.milestones
    SET 
      current_amount = v_milestone_amount,
      updated_at = NOW()
    WHERE id = v_milestone_id;
  END LOOP;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_milestone_funding
  AFTER INSERT OR UPDATE OR DELETE ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_funding();

-- =====================================================
-- 5. Update reward quantity when backing changes
-- =====================================================
CREATE OR REPLACE FUNCTION update_reward_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reward_id IS NOT NULL THEN
    UPDATE public.rewards
    SET 
      quantity_claimed = (
        SELECT COUNT(*)
        FROM public.backings
        WHERE reward_id = NEW.reward_id
        AND payment_status = 'succeeded'
      ),
      updated_at = NOW()
    WHERE id = NEW.reward_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.reward_id IS NOT NULL AND OLD.reward_id != NEW.reward_id THEN
    UPDATE public.rewards
    SET 
      quantity_claimed = (
        SELECT COUNT(*)
        FROM public.backings
        WHERE reward_id = OLD.reward_id
        AND payment_status = 'succeeded'
      ),
      updated_at = NOW()
    WHERE id = OLD.reward_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_reward_quantity
  AFTER INSERT OR UPDATE OF reward_id, payment_status ON public.backings
  FOR EACH ROW
  EXECUTE FUNCTION update_reward_quantity();

-- =====================================================
-- 6. Update project like count
-- =====================================================
CREATE OR REPLACE FUNCTION update_project_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET 
    like_count = (
      SELECT COUNT(*)
      FROM public.likes
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_project_like_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_like_count();

-- =====================================================
-- 7. Check milestone completion
-- =====================================================
CREATE OR REPLACE FUNCTION check_milestone_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_amount >= NEW.goal_amount AND NEW.status = 'in_progress' THEN
    NEW.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_milestone_completion
  BEFORE UPDATE OF current_amount ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION check_milestone_completion();

-- =====================================================
-- 8. Validate reward quantity before backing
-- =====================================================
CREATE OR REPLACE FUNCTION validate_reward_quantity()
RETURNS TRIGGER AS $$
DECLARE
  v_reward RECORD;
BEGIN
  IF NEW.reward_id IS NOT NULL THEN
    SELECT * INTO v_reward
    FROM public.rewards
    WHERE id = NEW.reward_id;

    IF v_reward.is_limited AND v_reward.quantity_total IS NOT NULL THEN
      IF v_reward.quantity_claimed >= v_reward.quantity_total THEN
        RAISE EXCEPTION 'Reward is sold out';
      END IF;
    END IF;

    IF NOT v_reward.is_active THEN
      RAISE EXCEPTION 'Reward is not active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_reward_quantity
  BEFORE INSERT ON public.backings
  FOR EACH ROW
  EXECUTE FUNCTION validate_reward_quantity();

-- =====================================================
-- 9. Generate unique project slug
-- =====================================================
CREATE OR REPLACE FUNCTION generate_project_slug(project_title TEXT, project_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(project_title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  WHILE EXISTS (
    SELECT 1 FROM public.projects
    WHERE slug = final_slug
    AND (project_id IS NULL OR id != project_id)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_project_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_project_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_project_slug
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_slug();

-- =====================================================
-- 10. Get project statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_project_stats(p_project_id UUID)
RETURNS TABLE (
  total_backers INTEGER,
  total_amount NUMERIC,
  avg_backing NUMERIC,
  completion_percentage NUMERIC,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT b.backer_id)::INTEGER,
    COALESCE(SUM(b.amount), 0),
    COALESCE(AVG(b.amount), 0),
    CASE
      WHEN p.goal_amount > 0 THEN (p.current_amount / p.goal_amount * 100)
      ELSE 0
    END,
    CASE
      WHEN p.deadline IS NOT NULL THEN
        GREATEST(0, EXTRACT(DAY FROM (p.deadline - NOW()))::INTEGER)
      ELSE NULL
    END
  FROM public.projects p
  LEFT JOIN public.backings b ON b.project_id = p.id AND b.payment_status = 'succeeded'
  WHERE p.id = p_project_id
  GROUP BY p.id, p.goal_amount, p.current_amount, p.deadline;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 11. Get creator statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_creator_stats(p_creator_id UUID)
RETURNS TABLE (
  total_projects INTEGER,
  total_raised NUMERIC,
  total_backers INTEGER,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id)::INTEGER,
    COALESCE(SUM(p.current_amount), 0),
    COUNT(DISTINCT b.backer_id)::INTEGER,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE p.status = 'successful')::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0
    END
  FROM public.projects p
  LEFT JOIN public.backings b ON b.project_id = p.id AND b.payment_status = 'succeeded'
  WHERE p.creator_id = p_creator_id
  AND p.status != 'draft';
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Database functions and triggers created successfully!';
END $$;
