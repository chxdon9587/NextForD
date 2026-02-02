-- =====================================================
-- 4D Crowdfunding Platform - Core Tables Migration
-- =====================================================

-- Create custom types
CREATE TYPE user_role AS ENUM ('backer', 'creator', 'admin');
CREATE TYPE project_category AS ENUM ('3D_PRINTER', 'FILAMENT', 'TOOL', 'ACCESSORY', 'SOFTWARE', 'OTHER');
CREATE TYPE project_status AS ENUM ('draft', 'pending_review', 'approved', 'live', 'successful', 'failed', 'cancelled');
CREATE TYPE funding_type AS ENUM ('all_or_nothing', 'flexible', 'milestone', 'in_demand');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'verified', 'failed');
CREATE TYPE backing_status AS ENUM ('pending', 'confirmed', 'refunded', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded');
CREATE TYPE update_visibility AS ENUM ('public', 'backers_only');

-- =====================================================
-- 1. Users Table (extends auth.users)
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'backer',
  is_verified BOOLEAN DEFAULT FALSE,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- =====================================================
-- 2. Projects Table
-- =====================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category project_category NOT NULL,
  status project_status DEFAULT 'draft',
  
  -- Funding information
  goal_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  funding_type funding_type DEFAULT 'milestone',
  
  -- Time information
  launch_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  
  -- Media
  cover_image TEXT,
  video_url TEXT,
  gallery JSONB DEFAULT '[]',
  
  -- Metadata
  backer_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_goal CHECK (goal_amount > 0),
  CONSTRAINT valid_current_amount CHECK (current_amount >= 0)
);

-- Indexes
CREATE INDEX idx_projects_creator ON public.projects(creator_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_category ON public.projects(category);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);

-- =====================================================
-- 3. Milestones Table
-- =====================================================
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  order_index INTEGER NOT NULL,
  deadline_days INTEGER NOT NULL,
  status milestone_status DEFAULT 'pending',
  
  -- Verification information
  completion_proof TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_milestone_goal CHECK (goal_amount > 0),
  CONSTRAINT valid_order CHECK (order_index >= 0),
  CONSTRAINT valid_deadline_days CHECK (deadline_days > 0)
);

CREATE INDEX idx_milestones_project ON public.milestones(project_id);
CREATE INDEX idx_milestones_status ON public.milestones(status);

-- =====================================================
-- 4. Rewards Table
-- =====================================================
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  
  -- Inventory management
  quantity_total INTEGER,
  quantity_claimed INTEGER DEFAULT 0,
  is_limited BOOLEAN DEFAULT FALSE,
  
  -- Delivery information
  estimated_delivery DATE,
  shipping_required BOOLEAN DEFAULT TRUE,
  shipping_locations TEXT[] DEFAULT '{}',
  
  -- Order and status
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_reward_amount CHECK (amount >= 0),
  CONSTRAINT valid_quantity CHECK (quantity_claimed <= quantity_total OR quantity_total IS NULL)
);

CREATE INDEX idx_rewards_project ON public.rewards(project_id);
CREATE INDEX idx_rewards_active ON public.rewards(is_active);

-- =====================================================
-- 5. Backings Table
-- =====================================================
CREATE TABLE public.backings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  backer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.rewards(id),
  
  -- Payment information
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  
  -- Status
  status backing_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  
  -- Shipping information
  shipping_address JSONB,
  tracking_number TEXT,
  
  -- Time tracking
  backed_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_backing_amount CHECK (amount > 0)
);

CREATE INDEX idx_backings_project ON public.backings(project_id);
CREATE INDEX idx_backings_backer ON public.backings(backer_id);
CREATE INDEX idx_backings_reward ON public.backings(reward_id);
CREATE INDEX idx_backings_stripe ON public.backings(stripe_payment_intent_id);
CREATE INDEX idx_backings_payment_status ON public.backings(payment_status);

-- =====================================================
-- 6. Escrow Transactions Table
-- =====================================================
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id),
  backing_id UUID REFERENCES public.backings(id),
  
  -- Amount information
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status escrow_status DEFAULT 'held',
  
  -- Stripe information
  stripe_transfer_id TEXT,
  stripe_account_id TEXT,
  
  -- Time tracking
  held_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_escrow_amount CHECK (amount > 0)
);

CREATE INDEX idx_escrow_project ON public.escrow_transactions(project_id);
CREATE INDEX idx_escrow_milestone ON public.escrow_transactions(milestone_id);
CREATE INDEX idx_escrow_backing ON public.escrow_transactions(backing_id);
CREATE INDEX idx_escrow_status ON public.escrow_transactions(status);

-- =====================================================
-- 7. Comments Table
-- =====================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  -- Status flags
  is_creator_reply BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 2000)
);

CREATE INDEX idx_comments_project ON public.comments(project_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- =====================================================
-- 8. Project Updates Table
-- =====================================================
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Visibility
  visibility update_visibility DEFAULT 'public',
  
  -- Media
  images TEXT[],
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_updates_project ON public.project_updates(project_id);
CREATE INDEX idx_updates_visibility ON public.project_updates(visibility);
CREATE INDEX idx_updates_created_at ON public.project_updates(created_at DESC);

-- =====================================================
-- 9. Likes Table
-- =====================================================
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_likes_project ON public.likes(project_id);
CREATE INDEX idx_likes_user ON public.likes(user_id);

-- =====================================================
-- 10. Follows Table
-- =====================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Core tables created successfully!';
END $$;
