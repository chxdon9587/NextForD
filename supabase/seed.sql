-- =====================================================
-- 4D Crowdfunding Platform - Seed Data for Testing
-- =====================================================

-- Create test users (passwords will be: testpass123)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES
  (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'creator@test.com',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"role": "creator", "username": "testcreator", "full_name": "Test Creator"}'::jsonb,
    'authenticated',
    'authenticated'
  ),
  (
    'b2222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'backer@test.com',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"role": "backer", "username": "testbacker", "full_name": "Test Backer"}'::jsonb,
    'authenticated',
    'authenticated'
  );

-- User profiles will be auto-created by trigger

-- Update user profiles
UPDATE public.users
SET 
  username = 'testcreator',
  full_name = 'Test Creator',
  bio = 'I create amazing 3D printing projects'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.users
SET 
  username = 'testbacker',
  full_name = 'Test Backer',
  bio = 'I support innovative projects'
WHERE id = 'b2222222-2222-2222-2222-222222222222';

-- Insert test project
INSERT INTO public.projects (
  id,
  creator_id,
  title,
  slug,
  description,
  category,
  status,
  goal_amount,
  currency,
  funding_type,
  launch_date,
  deadline,
  cover_image,
  tags
) VALUES
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Revolutionary 3D Printer',
    'revolutionary-3d-printer',
    'A groundbreaking 3D printer that can print in multiple colors simultaneously with unprecedented precision.',
    '3D_PRINTER',
    'live',
    50000.00,
    'USD',
    'milestone',
    now(),
    now() + interval '60 days',
    'https://images.unsplash.com/photo-1562408590-e32931084e23',
    ARRAY['3d-printing', 'innovation', 'technology']
  );

-- Insert milestones
INSERT INTO public.milestones (
  project_id,
  title,
  description,
  goal_amount,
  order_index,
  deadline_days,
  status
) VALUES
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Prototype Development',
    'Complete the working prototype with basic features',
    10000.00,
    0,
    30,
    'in_progress'
  ),
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Production Tooling',
    'Develop production molds and tooling',
    20000.00,
    1,
    45,
    'pending'
  ),
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Manufacturing & Shipping',
    'Mass production and delivery to backers',
    20000.00,
    2,
    60,
    'pending'
  );

-- Insert rewards
INSERT INTO public.rewards (
  project_id,
  title,
  description,
  amount,
  quantity_total,
  is_limited,
  estimated_delivery,
  order_index
) VALUES
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Early Bird Special',
    'Be one of the first 50 backers and get 30% off the retail price!',
    699.00,
    50,
    true,
    (now() + interval '120 days')::date,
    0
  ),
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Standard Printer',
    'The complete 3D printer package',
    999.00,
    NULL,
    false,
    (now() + interval '150 days')::date,
    1
  ),
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Pro Bundle',
    'Printer + extra filament spools + premium support',
    1499.00,
    100,
    true,
    (now() + interval '150 days')::date,
    2
  );

-- Insert a test backing
INSERT INTO public.backings (
  id,
  project_id,
  backer_id,
  reward_id,
  amount,
  payment_status,
  status,
  paid_at
) VALUES
  (
    'd4444444-4444-4444-4444-444444444444'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    (SELECT id FROM public.rewards WHERE project_id = 'c3333333-3333-3333-3333-333333333333' LIMIT 1),
    699.00,
    'succeeded',
    'confirmed',
    now()
  );

-- Insert comments
INSERT INTO public.comments (
  project_id,
  user_id,
  content
) VALUES
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'This looks amazing! Can''t wait to get mine!'
  ),
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Thank you for your support! We''re working hard to make this happen.'
  );

-- Insert project update
INSERT INTO public.project_updates (
  project_id,
  title,
  content,
  visibility
) VALUES
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'First Prototype Complete!',
    'We''re excited to announce that our first working prototype is complete and exceeding expectations. Here''s what we''ve achieved...',
    'public'
  );

-- Insert like
INSERT INTO public.likes (
  project_id,
  user_id
) VALUES
  (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid
  );

-- Verify seed data
DO $$
DECLARE
  user_count INTEGER;
  project_count INTEGER;
  backing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO project_count FROM public.projects;
  SELECT COUNT(*) INTO backing_count FROM public.backings;
  
  RAISE NOTICE '===== Seed Data Summary =====';
  RAISE NOTICE 'Users created: %', user_count;
  RAISE NOTICE 'Projects created: %', project_count;
  RAISE NOTICE 'Backings created: %', backing_count;
  RAISE NOTICE '============================';
END $$;
