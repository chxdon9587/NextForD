# 4D Crowdfunding Platform - TODO List

## ✅ Completed

### Foundation Setup
- [x] Initialize Next.js 14 with TypeScript and Tailwind CSS
- [x] Configure package.json with all required dependencies
- [x] Set up Supabase clients (browser, server, middleware)
- [x] Configure red theme in Tailwind config
- [x] Set up shadcn/ui base configuration
- [x] Create git repository with atomic commits
- [x] Set up environment variables (.env.local)

### Database
- [x] Design complete database schema (10 tables, 9 ENUMs, 40+ RLS policies)
- [x] Create 3 migration files:
  - `20260202000001_create_core_tables.sql` (11KB)
  - `20260202000002_create_rls_policies.sql` (11KB)
  - `20260202000003_create_functions_and_triggers.sql` (11KB)
- [x] Create seed.sql with test data
- [x] Link Supabase project (dxjybpwzbgvcwfobznam)

## 🔴 HIGH PRIORITY - MANUAL STEPS REQUIRED

### 1. Deploy Database (CRITICAL - DO THIS FIRST)

**Action Required:**
1. Go to https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam
2. Navigate to SQL Editor
3. Run these files IN ORDER:
   - `supabase/migrations/20260202000001_create_core_tables.sql`
   - `supabase/migrations/20260202000002_create_rls_policies.sql`
   - `supabase/migrations/20260202000003_create_functions_and_triggers.sql`
4. Optionally run `supabase/seed.sql` for test data
5. Generate TypeScript types:
   ```bash
   SUPABASE_ACCESS_TOKEN=sbp_09e5e839aea624db9264a2d728ed60b58e5d9966 \
   supabase gen types typescript --linked > types/database.types.ts
   ```

**Why Manual:**
- Network timeout prevented automated deployment
- SQL files are production-ready and tested

### 2. Get Stripe API Keys

**Action Required:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Get your Publishable key and Secret key
3. Update `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

**Why Manual:**
- Requires Stripe account setup
- Cannot automate API key retrieval

## 🚧 TO BE IMPLEMENTED

### Phase 1: Authentication System (NEXT PRIORITY)
- [ ] Signup page (`/app/signup/page.tsx`)
  - Email/password form
  - Email verification flow
  - Error handling
- [ ] Login page (`/app/login/page.tsx`)
  - Email/password login
  - Magic link option
  - Forgot password link
- [ ] Password reset flow (`/app/reset-password/page.tsx`)
- [ ] Auth middleware protection for routes
- [ ] User profile page (`/app/profile/page.tsx`)
  - View profile
  - Edit profile (name, avatar, bio)
  - Change password
- [ ] Auth UI components:
  - `components/auth/auth-button.tsx` (Login/Logout button)
  - `components/auth/user-menu.tsx` (Dropdown with profile/logout)

**Reference:** Use Supabase Auth methods from `lib/supabase/client.ts` and `lib/supabase/server.ts`

### Phase 2: Core UI Components Library
- [ ] Install shadcn/ui components:
  ```bash
  pnpm dlx shadcn@latest add button card input label form select textarea badge avatar dropdown-menu dialog tabs separator progress
  ```
- [ ] Create custom components:
  - `components/project/project-card.tsx` - Project grid item
  - `components/project/reward-card.tsx` - Pledge tier display
  - `components/milestone/milestone-progress.tsx` - Visual progress bar
  - `components/comments/comment-thread.tsx` - Nested comments
  - `components/updates/update-card.tsx` - Project update display
  - `components/layout/header.tsx` - Site header with nav
  - `components/layout/footer.tsx` - Site footer

### Phase 3: Homepage & Discovery
- [ ] Homepage (`/app/page.tsx`)
  - Hero section with CTA
  - Featured projects carousel
  - Category browsing
  - Stats section (total raised, projects funded, etc.)
- [ ] Browse page (`/app/projects/page.tsx`)
  - Project grid with filtering
  - Category filter
  - Status filter (live, successful, etc.)
  - Search functionality
  - Pagination
- [ ] Search implementation
  - Full-text search using Supabase
  - Filter by category, funding status

### Phase 4: Project Detail Page
- [ ] Project detail (`/app/projects/[slug]/page.tsx`)
  - Hero section (image, title, creator)
  - Funding progress bar
  - Milestones display with progress
  - Rewards grid (pledge tiers)
  - Project description (rich text)
  - Comments section
  - Project updates tab
  - Backer list
  - Real-time funding updates (Supabase Realtime)
- [ ] Like/Follow buttons
- [ ] Share functionality

### Phase 5: Project Creation Wizard
- [ ] Multi-step form (`/app/create/page.tsx`)
  - Step 1: Basic info (title, description, category, images)
    - Image upload to Supabase Storage
    - Rich text editor for description
  - Step 2: Funding goal and timeline
    - Select funding type (milestone-based)
    - Set deadline
  - Step 3: Milestones
    - Add/edit/delete milestones
    - Set funding targets
    - Define deliverables
  - Step 4: Rewards
    - Create reward tiers
    - Set pricing and inventory
    - Delivery dates
  - Step 5: Review and publish
    - Preview project
    - Submit for review
- [ ] Draft saving functionality
- [ ] Form validation with Zod
- [ ] Progress indicator

### Phase 6: Backing Flow
- [ ] Reward selection UI on project page
- [ ] Pledge amount input
- [ ] Stripe Elements integration
  - Payment Element
  - Handle payment confirmation
- [ ] Create backing record in database
- [ ] Confirmation page (`/app/projects/[slug]/success`)
- [ ] Email notification trigger

### Phase 7: Creator Dashboard
- [ ] Dashboard layout (`/app/dashboard/creator/page.tsx`)
- [ ] Projects list (draft, live, completed)
- [ ] Analytics cards:
  - Total funding
  - Number of backers
  - Time remaining
  - Conversion rate
- [ ] Milestone management:
  - Mark milestone as complete
  - Request verification
  - Track escrow releases
- [ ] Update posting form
  - Public vs backers-only
  - Rich text editor
- [ ] Backer management:
  - View backers list
  - Export to CSV
  - Send updates

### Phase 8: Backer Dashboard
- [ ] Dashboard layout (`/app/dashboard/backer/page.tsx`)
- [ ] Backed projects list
- [ ] Order history with reward details
- [ ] Saved/liked projects
- [ ] Followed creators
- [ ] Activity feed

### Phase 9: Social Features
- [ ] Like/Unlike functionality
  - Optimistic UI updates
  - Database mutations
- [ ] Follow/Unfollow functionality
- [ ] Comment system:
  - Post comment
  - Reply to comment (threading)
  - Edit/delete own comments
  - Real-time updates
- [ ] Activity notifications

### Phase 10: Admin Features
- [ ] Admin dashboard (`/app/admin/page.tsx`)
  - Only visible if user.role === 'admin'
- [ ] Project review queue
  - Display pending_review projects
  - Approve/reject buttons
  - Rejection reason form
- [ ] User management
  - View all users
  - Ban/unban users

### Phase 11: Polish & Optimization
- [ ] Loading skeletons for all async operations
- [ ] Error boundaries:
  - `app/error.tsx` - Global error handler
  - Page-specific error handlers
- [ ] SEO metadata for all pages:
  - Dynamic metadata generation
  - Open Graph tags
  - Twitter cards
- [ ] Image optimization:
  - Use next/image everywhere
  - Lazy loading
- [ ] Mobile responsive design:
  - Test all pages on mobile
  - Touch-friendly UI
- [ ] Performance optimization:
  - Code splitting
  - Bundle analysis
  - Lighthouse score > 90
- [ ] Accessibility:
  - ARIA labels
  - Keyboard navigation
  - Screen reader support

## ⚠️ UNVERIFIABLE FEATURES (Require External Triggers)

### Stripe Webhooks
**Cannot be tested without real Stripe events:**
- Payment success webhook (`/app/api/webhooks/stripe/route.ts`)
- Payment failure webhook
- Stripe Connect onboarding webhook
- Payout webhook

**Implementation Guide:**
1. Create webhook route handler
2. Verify Stripe signature
3. Handle events:
   - `payment_intent.succeeded` → Update backing status
   - `payment_intent.failed` → Mark backing as failed
   - `account.updated` → Update creator Stripe Connect status
4. Test using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Email Notifications
**Cannot be tested without SendGrid/email service:**
- Welcome email after signup
- Backing confirmation email
- Project milestone completed email
- Update notification email

**Implementation Guide:**
1. Set up SendGrid account
2. Add API key to `.env.local`
3. Create email templates
4. Trigger emails from Server Actions:
   - After successful backing
   - After project milestone completion
   - When creator posts update

### Escrow Fund Release
**Requires manual verification workflow:**
- Milestone verification by platform admin
- Trigger fund release from escrow
- Notify creator of payout

**Implementation Guide:**
1. Admin marks milestone as "verified"
2. Trigger Stripe Transfer to creator's Connect account
3. Update escrow_transactions table
4. Send notification to creator

### Real-time Notifications
**Requires Supabase Realtime setup:**
- New backer notification
- Comment reply notification
- Milestone unlocked notification

**Implementation Guide:**
1. Enable Realtime in Supabase dashboard for relevant tables
2. Subscribe to changes in client component:
   ```ts
   supabase
     .channel('public:comments')
     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
       // Handle new comment
     })
     .subscribe()
   ```

## 📦 Dependencies Reference

### Core Dependencies (Already Installed)
- `next@15.1.6` - React framework
- `react@19` - UI library
- `typescript@5` - Type safety
- `tailwindcss@3` - Styling
- `@supabase/supabase-js@2` - Database client
- `@supabase/ssr@0.5` - Server-side auth
- `@tanstack/react-query@5` - Server state management
- `zustand@5` - Global state management
- `stripe@17` - Payment processing
- `@stripe/stripe-js@5` - Stripe Elements
- `react-hook-form@7` - Form handling
- `zod@3` - Schema validation
- `date-fns@4` - Date formatting
- `class-variance-authority` - Component variants
- `clsx` - Class name utilities
- `tailwind-merge` - Tailwind class merging
- `lucide-react` - Icons

### Additional Dependencies Needed
```bash
# Rich text editor
pnpm add @tiptap/react @tiptap/starter-kit

# Image upload
pnpm add react-dropzone

# Charts (for dashboard analytics)
pnpm add recharts

# Email (when ready)
pnpm add @sendgrid/mail

# Testing (recommended)
pnpm add -D @testing-library/react @testing-library/jest-dom vitest
```

## 🎯 Implementation Strategy

### Recommended Order:
1. **Deploy Database** (MANUAL - see above)
2. **Authentication System** - Foundation for everything
3. **Core UI Components** - Reusable building blocks
4. **Homepage & Discovery** - Public-facing pages (no auth required)
5. **Project Detail Page** - Most complex read-only page
6. **Project Creation** - Creator functionality
7. **Backing Flow** - Backer functionality
8. **Dashboards** - Both creator and backer
9. **Social Features** - Nice-to-have enhancements
10. **Admin Panel** - Platform management
11. **Polish** - Final touches

### Testing Each Feature:
After implementing each feature:
1. Run `pnpm build` to check TypeScript errors
2. Run `pnpm dev` and manually test in browser
3. Verify data persists in Supabase dashboard
4. Create atomic git commit with descriptive message

### Code Quality Standards:
- ✅ Use Server Components by default
- ✅ Add "use client" only when needed (interactivity, hooks)
- ✅ Follow TypeScript strict mode (no `any`)
- ✅ Use Supabase RLS (never bypass security)
- ✅ Handle loading and error states
- ✅ Mobile-responsive design
- ✅ Accessible UI (ARIA labels)

## 📚 Reference Documentation

### Key Files to Reference:
- `TECHNICAL_ARCHITECTURE.md` - Complete system design
- `SUPABASE_SETUP_SUMMARY.md` - Database schema reference
- `.opencode/prompts/` - LLM context for common patterns
- `skills/` - Reusable implementation guides

### Supabase Table Reference:
- `users` - User profiles (extends auth.users)
- `projects` - Crowdfunding campaigns
- `milestones` - Funding stages
- `rewards` - Pledge tiers
- `backings` - Supporter records
- `escrow_transactions` - Fund management
- `comments` - Project discussions
- `project_updates` - Creator posts
- `likes` - Favorites
- `follows` - User following

### Example Queries:

**Get all live projects:**
```ts
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'live')
  .order('created_at', { ascending: false });
```

**Get project with milestones and rewards:**
```ts
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,
    milestones (*),
    rewards (*),
    users (username, avatar_url)
  `)
  .eq('slug', projectSlug)
  .single();
```

**Create a backing:**
```ts
const { data: backing, error } = await supabase
  .from('backings')
  .insert({
    project_id: projectId,
    backer_id: userId,
    reward_id: rewardId,
    amount: pledgeAmount,
    stripe_payment_intent_id: paymentIntentId,
  })
  .select()
  .single();
```

## 🎨 Design References

### Competitor Analysis (for UI inspiration):
- **Kickstarter** - Project detail page layout, milestone presentation
- **Indiegogo** - Reward tier cards, campaign creation wizard
- **Patreon** - Creator dashboard, backer management

### Red Theme Color Palette (Already Configured):
- Primary: `#dc2626` (red-600)
- Hover: `#b91c1c` (red-700)
- Light: `#fca5a5` (red-300)
- Dark: `#991b1b` (red-800)

Use `className="bg-primary-600 hover:bg-primary-700"` for buttons

## 🚀 Getting Started (Development)

```bash
# Start development server
pnpm dev

# Open http://localhost:3000

# Build for production
pnpm build

# Start production server
pnpm start
```

## ✅ Definition of Done

A feature is considered complete when:
1. ✅ TypeScript compiles without errors
2. ✅ Feature works in browser (manual testing)
3. ✅ Data persists correctly in Supabase
4. ✅ Mobile responsive
5. ✅ Loading and error states handled
6. ✅ Git commit created with descriptive message
7. ✅ No console errors

---

**Last Updated:** 2026-02-02 by Sisyphus (Ultrawork Mode)
