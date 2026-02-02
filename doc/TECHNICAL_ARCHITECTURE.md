# 4D 众筹平台 - 技术架构设计文档

**项目名称：** 4D 3D打印众筹平台  
**文档版本：** v1.0  
**最后更新：** 2026-02-02  
**技术负责：** 技术架构团队

---

## 目录

1. [技术选型概览](#技术选型概览)
2. [系统架构设计](#系统架构设计)
3. [前端技术栈](#前端技术栈)
4. [后端技术栈（Supabase）](#后端技术栈supabase)
5. [数据库设计](#数据库设计)
6. [认证与授权](#认证与授权)
7. [支付与资金托管](#支付与资金托管)
8. [文件存储与媒体处理](#文件存储与媒体处理)
9. [实时功能](#实时功能)
10. [安全架构](#安全架构)
11. [部署与DevOps](#部署与devops)
12. [监控与告警](#监控与告警)
13. [技术债务与风险](#技术债务与风险)
14. [LLM上下文同步提示词](#llm上下文同步提示词)

---

## 技术选型概览

### 核心技术栈

| 层级 | 技术选型 | 选型理由 |
|-----|---------|---------|
| **前端框架** | Next.js 14+ (App Router) | • SSR/SSG支持，SEO友好<br>• React Server Components<br>• 内置性能优化<br>• 丰富的生态系统 |
| **UI框架** | React 18+ | • 组件化架构<br>• 大型社区支持<br>• 与Next.js原生集成 |
| **样式方案** | Tailwind CSS + shadcn/ui | • 快速开发<br>• 设计系统一致性<br>• 可定制化<br>• 优秀的DX |
| **状态管理** | Zustand + React Query | • 轻量级状态管理<br>• 服务端状态缓存<br>• 自动数据同步 |
| **类型系统** | TypeScript 5+ | • 类型安全<br>• 更好的IDE支持<br>• 减少运行时错误 |
| **后端服务** | Supabase | • BaaS平台，快速开发<br>• PostgreSQL数据库<br>• 实时订阅<br>• 内置认证<br>• 对象存储<br>• Edge Functions |
| **支付处理** | Stripe | • 全球支付支持<br>• 强大的API<br>• 合规性保障<br>• Escrow支持 |
| **文件存储** | Supabase Storage + CDN | • 内置存储服务<br>• RLS支持<br>• CDN加速 |
| **部署平台** | Vercel (前端) + Supabase Cloud (后端) | • 边缘计算<br>• 自动扩展<br>• CI/CD集成 |

---

## 系统架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          4D 众筹平台系统架构                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         用户层                                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │ Web浏览器│  │ 移动浏览器│  │  搜索引擎│  │  社交媒体│         │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      CDN边缘层                                   │    │
│  │         Vercel Edge Network + Supabase Edge Functions           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    前端应用层 (Next.js)                          │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ Pages & Layouts                                          │   │    │
│  │  │  • 首页 / 项目发现                                       │   │    │
│  │  │  • 项目详情 / 支持流程                                   │   │    │
│  │  │  • 创作者仪表板 / 项目管理                               │   │    │
│  │  │  • 支持者中心 / 订单管理                                 │   │    │
│  │  │  • 社区 / 更新日志                                       │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ Components                                               │   │    │
│  │  │  • UI组件库 (shadcn/ui)                                  │   │    │
│  │  │  • 业务组件 (ProjectCard, PaymentForm, etc.)            │   │    │
│  │  │  • 布局组件 (Header, Footer, Sidebar)                   │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ State Management                                         │   │    │
│  │  │  • Zustand (全局状态)                                    │   │    │
│  │  │  • React Query (服务端状态)                              │   │    │
│  │  │  • React Context (主题、国际化)                          │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   后端服务层 (Supabase)                          │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │    │
│  │  │   认证服务  │ │  数据库服务 │ │  存储服务   │ │ 实时服务 │  │    │
│  │  │   Auth      │ │  PostgreSQL │ │  Storage    │ │ Realtime │  │    │
│  │  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├──────────┤  │    │
│  │  │• JWT认证    │ │• RLS安全    │ │• 文件上传   │ │• WebSocket│  │    │
│  │  │• OAuth集成  │ │• 索引优化   │ │• 图片处理   │ │• 订阅     │  │    │
│  │  │• 多角色     │ │• 事务处理   │ │• CDN分发    │ │• 广播     │  │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │    │
│  │  │ Edge        │ │  Database   │ │   Webhook   │ │  Queue   │  │    │
│  │  │ Functions   │ │  Functions  │ │  Handlers   │ │  (pg_cron)│  │    │
│  │  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├──────────┤  │    │
│  │  │• 业务逻辑   │ │• 复杂查询   │ │• 支付回调   │ │• 定时任务 │  │    │
│  │  │• 数据验证   │ │• 触发器     │ │• 邮件通知   │ │• 数据清理 │  │    │
│  │  │• API代理    │ │• 聚合计算   │ │• 事件处理   │ │• 报告生成 │  │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      外部服务集成层                              │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │    │
│  │  │   Stripe    │ │  SendGrid   │ │   Vercel    │ │ Sentry   │  │    │
│  │  │   (支付)    │ │  (邮件)     │ │  (部署)     │ │ (监控)   │  │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 架构设计原则

1. **关注点分离**：前端专注用户体验，后端专注数据与业务逻辑
2. **安全优先**：多层安全防护，RLS确保数据隔离
3. **性能优化**：边缘计算、缓存策略、懒加载
4. **可扩展性**：模块化设计，支持水平扩展
5. **开发效率**：利用Supabase BaaS减少基础设施工作

---

## 前端技术栈

### 核心技术

#### Next.js 14+ App Router

```typescript
// 项目结构
/app
  /(marketing)          # 营销页面组
    /page.tsx           # 首页
    /about/page.tsx     # 关于我们
    /how-it-works/page.tsx
  /(platform)           # 平台功能组
    /projects
      /page.tsx         # 项目列表
      /[id]/page.tsx    # 项目详情
    /dashboard
      /creator          # 创作者仪表板
      /backer           # 支持者中心
  /api                  # API路由
    /webhooks           # Webhook处理
  /components           # 共享组件
  /lib                  # 工具库
  /styles               # 全局样式
```

#### 技术特性

| 特性 | 实现方式 | 业务价值 |
|-----|---------|---------|
| **SSR** | App Router默认SSR | SEO优化，首屏速度快 |
| **ISR** | revalidate配置 | 项目列表增量更新 |
| **Server Components** | 默认服务端组件 | 减少客户端JS，性能提升 |
| **Streaming** | Suspense边界 | 渐进式加载，更好UX |
| **Route Groups** | (marketing) (platform) | 布局隔离，代码组织 |

### UI组件库

#### shadcn/ui + Tailwind CSS

```bash
# 安装配置
npx shadcn-ui@latest init

# 添加组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

#### 设计系统

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        success: {...},
        warning: {...},
        error: {...},
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Cal Sans', 'sans-serif'],
      },
    },
  },
}
```

### 状态管理

#### Zustand (客户端全局状态)

```typescript
// /lib/store/user-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: 'user-storage' }
  )
)
```

#### React Query (服务端状态)

```typescript
// /lib/hooks/use-projects.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .match(filters)
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}
```

### 表单处理

#### React Hook Form + Zod

```typescript
// /lib/schemas/project-schema.ts
import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(50).max(5000),
  goal_amount: z.number().min(1000).max(1000000),
  category: z.enum(['3D_PRINTER', 'FILAMENT', 'TOOL', 'ACCESSORY']),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    goal_amount: z.number(),
    deadline_days: z.number(),
  })).min(1).max(5),
})

export type ProjectFormData = z.infer<typeof projectSchema>
```

```typescript
// 组件中使用
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export function CreateProjectForm() {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  })

  const onSubmit = async (data: ProjectFormData) => {
    // 提交逻辑
  }

  return <Form {...form}>...</Form>
}
```

### 国际化

#### next-intl

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'zh', 'de', 'fr'],
  defaultLocale: 'en',
})

// /app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await import(`@/messages/${locale}.json`)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
```

---

## 后端技术栈（Supabase）

### Supabase 核心服务

#### 1. 数据库 (PostgreSQL)

**特性：**
- 开源关系型数据库
- ACID事务保证
- 强大的查询能力
- 支持JSON/JSONB类型
- 全文搜索
- PostGIS地理扩展

**使用场景：**
- 用户数据存储
- 项目信息管理
- 订单与交易记录
- 里程碑进度跟踪
- 评论与社区内容

#### 2. 认证 (Auth)

**特性：**
- 内置JWT认证
- 社交登录（Google, GitHub等）
- 邮箱+密码
- 魔法链接登录
- 多因素认证(MFA)
- 行级安全(RLS)集成

**使用场景：**
- 用户注册/登录
- 创作者/支持者/管理员角色
- 会话管理
- 权限控制

#### 3. 存储 (Storage)

**特性：**
- 对象存储服务
- RLS权限控制
- 图片转换API
- CDN加速
- 断点续传

**使用场景：**
- 项目图片/视频
- 3D模型文件
- 用户头像
- 项目更新附件

#### 4. 实时 (Realtime)

**特性：**
- PostgreSQL Change Data Capture
- WebSocket订阅
- 广播通道
- Presence追踪

**使用场景：**
- 项目资金实时更新
- 评论实时显示
- 在线用户状态
- 通知推送

#### 5. Edge Functions

**特性：**
- Deno运行时
- 全球边缘部署
- 低延迟
- TypeScript支持

**使用场景：**
- 复杂业务逻辑
- 第三方API集成
- 支付Webhook处理
- 数据验证与清洗

### Supabase 客户端配置

```typescript
// /lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': '4d-crowdfunding',
      },
    },
  }
)
```

```typescript
// /lib/supabase/server.ts (服务端使用)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

---

## 数据库设计

### 核心表结构

#### 1. 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'backer',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('backer', 'creator', 'admin');

-- RLS策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### 2. 项目表 (projects)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category project_category NOT NULL,
  status project_status DEFAULT 'draft',
  
  -- 资金信息
  goal_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  funding_type funding_type DEFAULT 'milestone',
  
  -- 时间信息
  launch_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  
  -- 媒体
  cover_image TEXT,
  video_url TEXT,
  gallery JSONB DEFAULT '[]',
  
  -- 元数据
  backer_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_goal CHECK (goal_amount > 0)
);

CREATE TYPE project_category AS ENUM (
  '3D_PRINTER', 'FILAMENT', 'TOOL', 'ACCESSORY', 'SOFTWARE', 'OTHER'
);

CREATE TYPE project_status AS ENUM (
  'draft', 'pending_review', 'approved', 'live', 
  'successful', 'failed', 'cancelled'
);

CREATE TYPE funding_type AS ENUM (
  'all_or_nothing', 'flexible', 'milestone', 'in_demand'
);

-- 索引
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- RLS策略
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved/live projects"
  ON projects FOR SELECT
  USING (status IN ('approved', 'live', 'successful'));

CREATE POLICY "Creators can view own drafts"
  ON projects FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = creator_id);
```

#### 3. 里程碑表 (milestones)

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  order_index INTEGER NOT NULL,
  deadline_days INTEGER NOT NULL,
  status milestone_status DEFAULT 'pending',
  
  -- 验证信息
  completion_proof TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_milestone_goal CHECK (goal_amount > 0),
  CONSTRAINT valid_order CHECK (order_index >= 0)
);

CREATE TYPE milestone_status AS ENUM (
  'pending', 'in_progress', 'completed', 
  'verified', 'failed'
);

CREATE INDEX idx_milestones_project ON milestones(project_id);

-- RLS策略
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones visible with project"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = milestones.project_id
      AND (projects.status IN ('live', 'successful') OR projects.creator_id = auth.uid())
    )
  );
```

#### 4. 奖励档位表 (rewards)

```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  
  -- 库存管理
  quantity_total INTEGER,
  quantity_claimed INTEGER DEFAULT 0,
  is_limited BOOLEAN DEFAULT FALSE,
  
  -- 交付信息
  estimated_delivery DATE,
  shipping_required BOOLEAN DEFAULT TRUE,
  shipping_locations TEXT[] DEFAULT '{}',
  
  -- 顺序
  order_index INTEGER NOT NULL,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_amount CHECK (amount >= 0),
  CONSTRAINT valid_quantity CHECK (quantity_claimed <= quantity_total OR quantity_total IS NULL)
);

CREATE INDEX idx_rewards_project ON rewards(project_id);

-- RLS策略
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rewards visible with project"
  ON rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = rewards.project_id
      AND (projects.status IN ('live', 'successful') OR projects.creator_id = auth.uid())
    )
  );
```

#### 5. 支持记录表 (backings)

```sql
CREATE TABLE backings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  backer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id),
  
  -- 支付信息
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  
  -- 状态
  status backing_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  
  -- 配送信息
  shipping_address JSONB,
  tracking_number TEXT,
  
  -- 时间
  backed_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_backing_amount CHECK (amount > 0)
);

CREATE TYPE backing_status AS ENUM (
  'pending', 'confirmed', 'refunded', 'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'succeeded', 'failed', 'refunded'
);

CREATE INDEX idx_backings_project ON backings(project_id);
CREATE INDEX idx_backings_backer ON backings(backer_id);
CREATE INDEX idx_backings_stripe ON backings(stripe_payment_intent_id);

-- RLS策略
ALTER TABLE backings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backers can view own backings"
  ON backings FOR SELECT
  USING (auth.uid() = backer_id);

CREATE POLICY "Creators can view project backings"
  ON backings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = backings.project_id
      AND projects.creator_id = auth.uid()
    )
  );
```

#### 6. 资金托管表 (escrow_transactions)

```sql
CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  backing_id UUID REFERENCES backings(id),
  
  -- 金额信息
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- 状态
  status escrow_status DEFAULT 'held',
  
  -- Stripe信息
  stripe_transfer_id TEXT,
  stripe_account_id TEXT,
  
  -- 时间
  held_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE escrow_status AS ENUM (
  'held', 'released', 'refunded'
);

CREATE INDEX idx_escrow_project ON escrow_transactions(project_id);
CREATE INDEX idx_escrow_milestone ON escrow_transactions(milestone_id);
```

#### 7. 评论表 (comments)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  -- 状态
  is_creator_reply BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 2000)
);

CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- RLS策略
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments visible on live projects"
  ON comments FOR SELECT
  USING (
    NOT is_deleted AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = comments.project_id
      AND projects.status = 'live'
    )
  );

CREATE POLICY "Users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 8. 项目更新表 (project_updates)

```sql
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- 可见性
  visibility update_visibility DEFAULT 'public',
  
  -- 媒体
  images TEXT[],
  
  -- 统计
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE update_visibility AS ENUM (
  'public', 'backers_only'
);

CREATE INDEX idx_updates_project ON project_updates(project_id);

-- RLS策略
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public updates visible to all"
  ON project_updates FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Backer-only updates visible to backers"
  ON project_updates FOR SELECT
  USING (
    visibility = 'backers_only' AND
    EXISTS (
      SELECT 1 FROM backings
      WHERE backings.project_id = project_updates.project_id
      AND backings.backer_id = auth.uid()
    )
  );
```

### 数据库函数示例

#### 更新项目筹资金额

```sql
CREATE OR REPLACE FUNCTION update_project_funding()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET 
    current_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM backings
      WHERE project_id = NEW.project_id
      AND payment_status = 'succeeded'
    ),
    backer_count = (
      SELECT COUNT(DISTINCT backer_id)
      FROM backings
      WHERE project_id = NEW.project_id
      AND payment_status = 'succeeded'
    ),
    updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_project_funding
  AFTER INSERT OR UPDATE OF payment_status ON backings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_funding();
```

#### 检查里程碑完成

```sql
CREATE OR REPLACE FUNCTION check_milestone_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_amount >= NEW.goal_amount AND OLD.status = 'in_progress' THEN
    NEW.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_milestone_completion
  BEFORE UPDATE OF current_amount ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION check_milestone_completion();
```

---

## 认证与授权

### 认证流程

#### 用户注册

```typescript
// /lib/auth/register.ts
import { supabase } from '@/lib/supabase/client'

export async function registerUser(email: string, password: string, userData: {
  username: string
  full_name: string
  role: 'creator' | 'backer'
}) {
  // 1. 注册Auth用户
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: userData.username,
        full_name: userData.full_name,
      },
    },
  })

  if (authError) throw authError

  // 2. 创建用户Profile (通过触发器自动创建)
  // 或手动创建
  const { error: profileError } = await supabase
    .from('users')
    .update({
      username: userData.username,
      full_name: userData.full_name,
      role: userData.role,
    })
    .eq('id', authData.user!.id)

  if (profileError) throw profileError

  return authData.user
}
```

#### 社交登录

```typescript
// Google OAuth
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

// GitHub OAuth
export async function loginWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}
```

#### Auth Callback处理

```typescript
// /app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
```

### 授权策略

#### 角色定义

```typescript
// /lib/auth/roles.ts
export enum UserRole {
  BACKER = 'backer',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

export const rolePermissions = {
  [UserRole.BACKER]: [
    'projects:view',
    'projects:back',
    'comments:create',
    'profile:edit',
  ],
  [UserRole.CREATOR]: [
    'projects:view',
    'projects:back',
    'projects:create',
    'projects:edit',
    'comments:create',
    'profile:edit',
    'updates:create',
  ],
  [UserRole.ADMIN]: [
    '*', // 所有权限
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role]
  return permissions.includes('*') || permissions.includes(permission)
}
```

#### RLS策略最佳实践

```sql
-- 示例：创作者只能编辑自己的项目
CREATE POLICY "Creators can update own projects"
  ON projects FOR UPDATE
  USING (
    auth.uid() = creator_id
    AND status NOT IN ('successful', 'cancelled') -- 已完成项目不可编辑
  )
  WITH CHECK (
    auth.uid() = creator_id
  );

-- 示例：支持者只能看到自己的支持记录
CREATE POLICY "Backers view own backings"
  ON backings FOR SELECT
  USING (auth.uid() = backer_id);

-- 示例：管理员可以查看所有数据
CREATE POLICY "Admins can view all"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### 中间件保护

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 刷新会话
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 保护创作者路由
  if (req.nextUrl.pathname.startsWith('/dashboard/creator')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'creator' && user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/backer', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

---

## 支付与资金托管

### Stripe 集成架构

#### 架构流程

```
支持者发起支持
     ↓
前端创建Payment Intent (通过Edge Function)
     ↓
Stripe处理支付
     ↓
Webhook通知支付成功
     ↓
资金进入Escrow托管
     ↓
里程碑验证通过
     ↓
资金释放到创作者Stripe Connect账户
```

### Edge Function: 创建支付

```typescript
// /supabase/functions/create-payment-intent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { projectId, rewardId, amount, currency = 'USD' } = await req.json()

    // 验证用户身份
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    // 验证项目状态
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, creator_id')
      .eq('id', projectId)
      .single()

    if (projectError || project.status !== 'live') {
      return new Response(JSON.stringify({ error: 'Invalid project' }), {
        status: 400,
      })
    }

    // 创建Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // 转换为分
      currency: currency.toLowerCase(),
      metadata: {
        projectId,
        rewardId: rewardId || '',
        backerId: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // 创建Backing记录
    const { data: backing, error: backingError } = await supabase
      .from('backings')
      .insert({
        project_id: projectId,
        backer_id: user.id,
        reward_id: rewardId,
        amount,
        currency,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (backingError) throw backingError

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        backingId: backing.id,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})
```

### Webhook 处理

```typescript
// /supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role for admin access
)

serve(async (req) => {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // 处理不同事件类型
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // 更新Backing状态
      const { error } = await supabase
        .from('backings')
        .update({
          payment_status: 'succeeded',
          status: 'confirmed',
          paid_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      if (error) {
        console.error('Failed to update backing:', error)
      }

      // 创建Escrow记录
      const { data: backing } = await supabase
        .from('backings')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (backing) {
        await supabase.from('escrow_transactions').insert({
          project_id: backing.project_id,
          backing_id: backing.id,
          amount: backing.amount,
          currency: backing.currency,
          status: 'held',
        })
      }

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      await supabase
        .from('backings')
        .update({
          payment_status: 'failed',
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      break
    }

    // 其他事件...
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  })
})
```

### Stripe Connect (创作者收款)

```typescript
// Edge Function: 创建Connect账户
// /supabase/functions/create-connect-account/index.ts
serve(async (req) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }

  // 检查用户是否已有Connect账户
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_connect_id')
    .eq('id', user.id)
    .single()

  if (userData?.stripe_connect_id) {
    return new Response(
      JSON.stringify({ accountId: userData.stripe_connect_id }),
      { status: 200 }
    )
  }

  // 创建Connect账户
  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  // 保存Connect ID
  await supabase
    .from('users')
    .update({ stripe_connect_id: account.id })
    .eq('id', user.id)

  // 创建Account Link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${Deno.env.get('APP_URL')}/dashboard/creator/settings`,
    return_url: `${Deno.env.get('APP_URL')}/dashboard/creator/settings`,
    type: 'account_onboarding',
  })

  return new Response(
    JSON.stringify({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    }),
    { status: 200 }
  )
})
```

### 资金释放逻辑

```typescript
// Database Function: 释放里程碑资金
CREATE OR REPLACE FUNCTION release_milestone_funds(milestone_id UUID)
RETURNS void AS $$
DECLARE
  v_project_id UUID;
  v_creator_stripe_id TEXT;
  v_total_amount NUMERIC;
BEGIN
  -- 获取项目和创作者信息
  SELECT m.project_id, u.stripe_connect_id
  INTO v_project_id, v_creator_stripe_id
  FROM milestones m
  JOIN projects p ON p.id = m.project_id
  JOIN users u ON u.id = p.creator_id
  WHERE m.id = milestone_id
  AND m.status = 'verified';

  IF v_creator_stripe_id IS NULL THEN
    RAISE EXCEPTION 'Creator has no Stripe Connect account';
  END IF;

  -- 计算该里程碑的总托管金额
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_amount
  FROM escrow_transactions
  WHERE milestone_id = milestone_id
  AND status = 'held';

  -- 更新Escrow状态为released
  UPDATE escrow_transactions
  SET 
    status = 'released',
    released_at = NOW()
  WHERE milestone_id = milestone_id
  AND status = 'held';

  -- 这里需要通过Edge Function调用Stripe API进行实际转账
  -- 插入一个待处理任务
  INSERT INTO pending_transfers (
    milestone_id,
    stripe_account_id,
    amount
  ) VALUES (
    milestone_id,
    v_creator_stripe_id,
    v_total_amount
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 文件存储与媒体处理

### Supabase Storage 配置

#### Bucket 设置

```sql
-- 项目图片Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true);

-- 用户头像Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- 3D模型文件Bucket (私有)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('3d-models', '3d-models', false);
```

#### Storage RLS 策略

```sql
-- 项目图片：创作者可上传，所有人可查看
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "Creators can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 用户头像：用户可上传自己的头像
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

### 文件上传实现

```typescript
// /lib/storage/upload.ts
import { supabase } from '@/lib/supabase/client'

export async function uploadProjectImage(
  projectId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${projectId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('project-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 获取公共URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('project-images').getPublicUrl(filePath)

  return publicUrl
}

// 图片转换（利用Supabase Transform API）
export function getTransformedImageUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
  }
): string {
  const params = new URLSearchParams()
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.quality) params.set('quality', options.quality.toString())

  return `${url}?${params.toString()}`
}
```

### 组件使用示例

```typescript
// /components/ImageUpload.tsx
'use client'

import { useState } from 'react'
import { uploadProjectImage } from '@/lib/storage/upload'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  projectId: string
  onUploadComplete: (url: string) => void
}

export function ImageUpload({ projectId, onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const url = await uploadProjectImage(projectId, file)
      onUploadComplete(url)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}
```

---

## 实时功能

### Realtime 订阅

#### 项目资金实时更新

```typescript
// /lib/realtime/use-project-updates.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export function useProjectRealtime(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    // 初始加载
    const fetchProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      setProject(data)
    }

    fetchProject()

    // 订阅实时更新
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          setProject(payload.new as Project)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return project
}
```

#### 实时评论

```typescript
// /lib/realtime/use-comments.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Comment } from '@/types/database'

export function useCommentsRealtime(projectId: string) {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    // 初始加载
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, user:users(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      setComments(data || [])
    }

    fetchComments()

    // 订阅新评论
    const channel = supabase
      .channel(`comments:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return comments
}
```

#### Broadcast 通道（实时通知）

```typescript
// 创作者广播项目更新
export async function broadcastProjectUpdate(
  projectId: string,
  message: string
) {
  const channel = supabase.channel(`project:${projectId}`)

  await channel.send({
    type: 'broadcast',
    event: 'project_update',
    payload: { message },
  })
}

// 订阅广播
export function useBroadcastUpdates(projectId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`project:${projectId}`)
      .on('broadcast', { event: 'project_update' }, (payload) => {
        console.log('New update:', payload.message)
        // 显示通知
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])
}
```

---

## 安全架构

### 安全层级

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          安全架构分层                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Layer 1: 边界安全                                                │    │
│  │  • DDoS防护 (Vercel/Cloudflare)                                  │    │
│  │  • WAF规则                                                       │    │
│  │  • 速率限制                                                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Layer 2: 应用安全                                                │    │
│  │  • HTTPS强制                                                     │    │
│  │  • CORS策略                                                      │    │
│  │  • CSP头部                                                       │    │
│  │  • XSS防护                                                       │    │
│  │  • CSRF Token                                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Layer 3: 认证与授权                                              │    │
│  │  • JWT验证                                                       │    │
│  │  • 行级安全(RLS)                                                 │    │
│  │  • 角色权限                                                      │    │
│  │  • MFA (可选)                                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Layer 4: 数据安全                                                │    │
│  │  • 静态数据加密                                                  │    │
│  │  • 传输加密 (TLS 1.3)                                            │    │
│  │  • PII数据脱敏                                                   │    │
│  │  • 定期备份                                                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 安全配置

#### Next.js 安全头部

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
          ].join('; '),
        },
      ],
    },
  ],
}

module.exports = nextConfig
```

#### 输入验证与消毒

```typescript
// /lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

// Zod schema中的验证
import { z } from 'zod'

export const safeStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .transform((val) => sanitizeHTML(val))
```

#### 速率限制

```typescript
// /lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10请求/10秒
})

// 在API路由中使用
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }

  // 处理请求...
}
```

---

## 部署与DevOps

### 部署架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          部署架构                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    GitHub Repository                             │    │
│  │                  (源代码 + CI/CD配置)                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ GitHub Actions   │  │  Vercel Preview  │  │ Supabase CLI     │       │
│  │ (CI/CD)          │  │  (预览环境)      │  │ (数据库迁移)     │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   生产环境                                       │    │
│  │  ┌─────────────────┐            ┌─────────────────┐             │    │
│  │  │ Vercel          │            │ Supabase Cloud  │             │    │
│  │  │ (Next.js App)   │◄──────────►│ (后端服务)      │             │    │
│  │  │ • Edge Network  │            │ • PostgreSQL    │             │    │
│  │  │ • Serverless    │            │ • Auth          │             │    │
│  │  │ • Auto-scaling  │            │ • Storage       │             │    │
│  │  └─────────────────┘            │ • Realtime      │             │    │
│  │                                 └─────────────────┘             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 环境配置

#### 环境变量

```bash
# .env.local (开发环境)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel生产环境
# NEXT_PUBLIC_APP_URL=https://4d-crowdfunding.com
```

### CI/CD 流程

#### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm tsc --noEmit
      
      - name: Run tests
        run: pnpm test

  deploy-preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 数据库迁移

```bash
# 安装Supabase CLI
npm install -g supabase

# 初始化
supabase init

# 创建迁移
supabase migration new create_projects_table

# 应用迁移
supabase db push

# 生成TypeScript类型
supabase gen types typescript --local > types/supabase.ts
```

```sql
-- supabase/migrations/20260202_create_projects.sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  -- ... 其他字段
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 监控与告警

### 监控工具栈

| 工具 | 用途 | 关键指标 |
|-----|------|---------|
| **Vercel Analytics** | 前端性能 | 首屏加载、Core Web Vitals |
| **Sentry** | 错误追踪 | 错误率、用户影响 |
| **Supabase Dashboard** | 后端监控 | 数据库性能、API延迟 |
| **Stripe Dashboard** | 支付监控 | 成功率、拒绝原因 |
| **Uptime Robot** | 可用性 | Uptime、响应时间 |

### Sentry 配置

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  
  beforeSend(event, hint) {
    // 过滤敏感信息
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers
    }
    return event
  },
  
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

### 关键指标

```typescript
// /lib/analytics/metrics.ts
import { Analytics } from '@vercel/analytics/react'

// 自定义事件追踪
export function trackProjectCreated(projectId: string, category: string) {
  if (typeof window !== 'undefined') {
    window.gtag?.('event', 'project_created', {
      project_id: projectId,
      category,
    })
  }
}

export function trackBackingCompleted(
  projectId: string,
  amount: number,
  currency: string
) {
  if (typeof window !== 'undefined') {
    window.gtag?.('event', 'purchase', {
      transaction_id: projectId,
      value: amount,
      currency,
    })
  }
}
```

---

## 技术债务与风险

### 已知技术债务

| 债务项 | 优先级 | 影响 | 缓解计划 |
|-------|-------|------|---------|
| Supabase锁定风险 | 中 | 迁移成本高 | 抽象数据访问层 |
| 实时功能扩展性 | 低 | 高并发场景 | 监控连接数，必要时引入Redis |
| 文件存储成本 | 中 | 成本上升 | CDN优化，冷数据归档 |
| Edge Function限制 | 低 | 复杂逻辑受限 | 关键逻辑迁移到独立服务 |

### 风险管理

```typescript
// 数据访问抽象层示例
// /lib/data/repository.ts
interface ProjectRepository {
  findById(id: string): Promise<Project | null>
  create(data: CreateProjectDTO): Promise<Project>
  update(id: string, data: UpdateProjectDTO): Promise<Project>
  delete(id: string): Promise<void>
}

// Supabase实现
class SupabaseProjectRepository implements ProjectRepository {
  async findById(id: string) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    return data
  }
  
  // ... 其他方法
}

// 未来可替换为其他实现
class CustomAPIProjectRepository implements ProjectRepository {
  // ...
}
```

---

## LLM上下文同步提示词

### 系统架构提示词

```markdown
# 4D众筹平台技术架构概要

**技术栈：**
- 前端：Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- 后端：Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- 支付：Stripe + Stripe Connect
- 部署：Vercel (前端) + Supabase Cloud (后端)

**核心功能模块：**
1. 用户系统：注册/登录、角色管理（创作者/支持者/管理员）
2. 项目系统：创建/审核/展示/搜索、里程碑管理
3. 支付系统：Stripe集成、资金托管(Escrow)、里程碑释放
4. 社区系统：评论/问答、项目更新、实时通知
5. 文件系统：Supabase Storage、图片/视频/3D模型上传

**数据库核心表：**
- users: 用户信息
- projects: 项目信息
- milestones: 里程碑
- rewards: 奖励档位
- backings: 支持记录
- escrow_transactions: 资金托管
- comments: 评论
- project_updates: 项目更新

**安全机制：**
- Row Level Security (RLS): 数据行级权限控制
- JWT认证: Supabase Auth
- 多角色授权: 创作者/支持者/管理员
- 输入验证: Zod schema
- 速率限制: Upstash Redis

**关键设计模式：**
- Server Components优先
- React Query管理服务端状态
- Zustand管理客户端状态
- Repository模式抽象数据访问
- Edge Functions处理业务逻辑

**开发规范：**
- TypeScript严格模式
- ESLint + Prettier
- 组件化开发
- RLS策略保护所有表
- 事务处理确保数据一致性
```

### 数据库操作提示词

```markdown
# 数据库操作规范

**使用Supabase客户端：**
- 客户端组件: import { supabase } from '@/lib/supabase/client'
- 服务端组件: import { createClient } from '@/lib/supabase/server'

**查询示例：**
```typescript
// 查询项目
const { data, error } = await supabase
  .from('projects')
  .select('*, creator:users(*), rewards(*)')
  .eq('status', 'live')
  .order('created_at', { ascending: false })
  .limit(10)
```

**插入数据：**
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    creator_id: user.id,
    title: 'My Project',
    // ...
  })
  .select()
  .single()
```

**更新数据：**
```typescript
const { error } = await supabase
  .from('projects')
  .update({ status: 'live' })
  .eq('id', projectId)
  .eq('creator_id', user.id) // RLS会再次验证
```

**实时订阅：**
```typescript
const channel = supabase
  .channel('project-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'projects',
    filter: `id=eq.${projectId}`,
  }, (payload) => {
    console.log(payload.new)
  })
  .subscribe()
```

**RLS注意事项：**
- 所有表必须启用RLS
- 查询自动应用RLS策略
- Service Role Key绕过RLS（仅服务端使用）
- 测试时验证RLS策略生效
```

### 支付集成提示词

```markdown
# Stripe支付集成规范

**支付流程：**
1. 前端调用Edge Function创建PaymentIntent
2. 使用Stripe Elements收集支付信息
3. 确认支付
4. Webhook处理支付结果
5. 更新数据库状态
6. 创建Escrow记录

**创建PaymentIntent：**
```typescript
const response = await fetch('/api/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId,
    rewardId,
    amount: 100,
    currency: 'USD',
  }),
})
const { clientSecret } = await response.json()
```

**Webhook处理：**
- 验证签名: stripe.webhooks.constructEvent()
- 处理事件: payment_intent.succeeded, payment_intent.failed
- 更新backing状态
- 创建escrow_transaction

**Stripe Connect（创作者收款）：**
- 创建Express账户
- 引导创作者完成Onboarding
- 里程碑验证后通过Transfer释放资金

**测试：**
- 测试卡号: 4242 4242 4242 4242
- 使用Stripe CLI监听Webhook: stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 组件开发提示词

```markdown
# 组件开发规范

**目录结构：**
```
/components
  /ui              # shadcn/ui基础组件
  /project         # 项目相关组件
    ProjectCard.tsx
    ProjectDetail.tsx
  /layout          # 布局组件
    Header.tsx
    Footer.tsx
  /forms           # 表单组件
    CreateProjectForm.tsx
```

**组件模板：**
```typescript
'use client' // 如果需要交互

import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  // ... 其他props
}

export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn('default-classes', className)}>
      {/* 内容 */}
    </div>
  )
}
```

**状态管理：**
- 本地状态: useState
- 服务端状态: useQuery (React Query)
- 全局状态: useStore (Zustand)
- 表单状态: useForm (React Hook Form)

**样式规范：**
- 使用Tailwind CSS utility classes
- 响应式: mobile-first (sm: md: lg: xl:)
- 深色模式: dark: prefix
- 使用shadcn/ui组件保持一致性
```

---

**文档版本：** v1.0  
**维护责任：** 技术架构团队  
**更新频率：** 随技术演进及时更新  
**反馈渠道：** 技术团队内部文档系统
