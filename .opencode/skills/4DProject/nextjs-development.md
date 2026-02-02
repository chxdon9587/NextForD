# Skill: Next.js Development

> **适用场景：** 所有Next.js应用开发
> **核心价值：** 充分利用Next.js 14+ App Router特性，优化性能和开发体验

## 核心原则

1. **Server Components优先：** 默认使用Server Components，需要交互时才用Client Components
2. **数据获取：** 在Server Components中直接获取数据，避免客户端请求
3. **性能优化：** 使用streaming、prefetching、缓存策略
4. **类型安全：** TypeScript + 自动类型推导

## 路由与布局

### App Router结构

```
/app
  layout.tsx              # 根布局
  page.tsx                # 首页
  loading.tsx             # 加载状态
  error.tsx               # 错误处理
  not-found.tsx           # 404页面
  
  /(marketing)            # 路由组（不影响URL）
    layout.tsx            # 营销页面布局
    /page.tsx             # 营销首页
    /about/page.tsx       # 关于页面
  
  /(platform)             # 平台功能路由组
    layout.tsx            # 平台布局（含导航）
    /projects
      /page.tsx           # 项目列表
      /[id]
        /page.tsx         # 项目详情
        /loading.tsx      # 详情页加载
        /error.tsx        # 详情页错误
    /dashboard
      /creator
        /page.tsx         # 创作者仪表板
      /backer
        /page.tsx         # 支持者中心
  
  /api                    # API路由
    /projects/route.ts
    /webhooks
      /stripe/route.ts
```

### 布局组件

```typescript
// /app/layout.tsx (根布局)
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    template: '%s | 4D Crowdfunding',
    default: '4D Crowdfunding - 3D Printing Projects',
  },
  description: 'Support innovative 3D printing projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

```typescript
// /app/(platform)/layout.tsx (平台布局)
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 未登录用户重定向到登录页
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

### 动态路由

```typescript
// /app/(platform)/projects/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectDetail } from '@/components/project/ProjectDetail'

interface PageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ProjectPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      creator:users(*),
      rewards(*),
      milestones(*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !project) {
    notFound()
  }

  return <ProjectDetail project={project} />
}

// 生成静态参数（ISR）
export async function generateStaticParams() {
  const supabase = createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('status', 'live')
    .limit(100)

  return projects?.map((project) => ({
    id: project.id,
  })) || []
}

// 生成元数据
export async function generateMetadata({ params }: PageProps) {
  const supabase = createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('title, description, cover_image')
    .eq('id', params.id)
    .single()

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: [project.cover_image],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description,
      images: [project.cover_image],
    },
  }
}
```

## Server Components vs Client Components

### Server Components（默认）

```typescript
// ✅ Server Component - 直接数据获取
import { createClient } from '@/lib/supabase/server'

export default async function ProjectList() {
  const supabase = createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'live')
    .order('created_at', { ascending: false })

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {projects?.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// 优势：
// - SEO友好（HTML直接包含内容）
// - 更快的首屏加载
// - 无需发送JS到客户端
// - 安全访问后端资源
```

### Client Components

```typescript
// ❌ 不要为了数据获取使用Client Component
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function ProjectList() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    supabase.from('projects').select('*').then(({ data }) => {
      setProjects(data)
    })
  }, [])

  return <div>{/* ... */}</div>
}

// ✅ Client Component适用场景：
// 1. 需要交互（onClick, onChange等）
// 2. 需要React Hooks（useState, useEffect等）
// 3. 需要浏览器API（window, document等）
// 4. 需要Context
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function LikeButton({ projectId }: { projectId: string }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)

  const handleLike = async () => {
    setLiked(!liked)
    // 调用API更新点赞
  }

  return (
    <Button onClick={handleLike} variant={liked ? 'default' : 'outline'}>
      ❤️ {count}
    </Button>
  )
}
```

### 组件组合策略

```typescript
// ✅ Server Component包含Client Component
// /app/projects/[id]/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { LikeButton } from '@/components/project/LikeButton' // Client Component
import { CommentSection } from '@/components/project/CommentSection' // Client Component

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  return (
    <div>
      {/* Server Component渲染 */}
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      
      {/* Client Component交互 */}
      <LikeButton projectId={project.id} initialCount={project.like_count} />
      
      {/* Client Component交互 */}
      <CommentSection projectId={project.id} />
    </div>
  )
}
```

## 数据获取

### Parallel Data Fetching

```typescript
// ✅ 并行获取数据
export default async function Dashboard() {
  // 并行执行
  const [projectsData, statsData, recentBackingsData] = await Promise.all([
    supabase.from('projects').select('*').eq('creator_id', userId),
    supabase.rpc('get_creator_stats', { creator_id: userId }),
    supabase.from('backings').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div>
      <Stats data={statsData.data} />
      <ProjectList projects={projectsData.data} />
      <RecentBackings backings={recentBackingsData.data} />
    </div>
  )
}

// ❌ 避免串行获取
async function getData() {
  const projects = await supabase.from('projects').select('*')
  const stats = await supabase.rpc('get_creator_stats') // 等待上一个完成
  const backings = await supabase.from('backings').select('*') // 等待上一个完成
  return { projects, stats, backings }
}
```

### Streaming with Suspense

```typescript
// /app/dashboard/page.tsx
import { Suspense } from 'react'
import { ProjectList } from '@/components/dashboard/ProjectList'
import { Stats } from '@/components/dashboard/Stats'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats快速加载 */}
      <Suspense fallback={<Skeleton className="h-32" />}>
        <Stats />
      </Suspense>

      {/* ProjectList可能慢，独立streaming */}
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  )
}

// /components/dashboard/Stats.tsx (Server Component)
export async function Stats() {
  const stats = await getStats() // 可能慢的异步操作
  return <div>{/* 统计信息 */}</div>
}
```

## 缓存策略

### 路由缓存

```typescript
// app/projects/page.tsx
export const revalidate = 60 // ISR: 每60秒重新验证

export default async function ProjectsPage() {
  const projects = await getProjects()
  return <ProjectList projects={projects} />
}

// 或者按需重新验证
import { revalidatePath, revalidateTag } from 'next/cache'

// 在Server Action或Route Handler中
export async function createProject(data: FormData) {
  // 创建项目...
  
  revalidatePath('/projects') // 重新验证项目列表页
  revalidateTag('projects') // 重新验证带有'projects'标签的所有请求
}
```

### Fetch缓存

```typescript
// 默认缓存
const data = await fetch('https://api.example.com/data')

// 不缓存
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
})

// 重新验证
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }, // 60秒后重新验证
})

// 标签缓存
const data = await fetch('https://api.example.com/data', {
  next: { tags: ['projects'] },
})
```

## API Routes

### Route Handler

```typescript
// /app/api/projects/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const supabase = createClient()
    let query = supabase.from('projects').select('*')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// POST /api/projects
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...body,
        creator_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// 动态路由
// /app/api/projects/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  return NextResponse.json(data)
}
```

## Server Actions

```typescript
// /app/actions/project-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const goal_amount = parseFloat(formData.get('goal_amount') as string)

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      creator_id: user.id,
      title,
      description,
      goal_amount,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/dashboard/creator/projects')
  redirect(`/dashboard/creator/projects/${project.id}/edit`)
}

// 在表单中使用
// /components/forms/CreateProjectForm.tsx
export function CreateProjectForm() {
  return (
    <form action={createProject}>
      <input name="title" type="text" required />
      <textarea name="description" required />
      <input name="goal_amount" type="number" required />
      <button type="submit">Create Project</button>
    </form>
  )
}

// 或者在Client Component中使用
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createProject } from '@/app/actions/project-actions'

export function CreateProjectForm() {
  const [state, formAction] = useFormState(createProject, null)

  return (
    <form action={formAction}>
      {/* ... */}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Project'}
    </button>
  )
}
```

## 中间件

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 刷新session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 保护路由
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // 角色检查
    if (req.nextUrl.pathname.startsWith('/dashboard/creator')) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (user?.role !== 'creator' && user?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/backer', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
}
```

## 性能优化

### 图片优化

```typescript
import Image from 'next/image'

// ✅ 使用Next.js Image组件
<Image
  src={project.cover_image}
  alt={project.title}
  width={800}
  height={600}
  priority // 首屏图片
  placeholder="blur"
  blurDataURL="data:image/..."
/>

// 动态尺寸
<div className="relative aspect-video">
  <Image
    src={project.cover_image}
    alt={project.title}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

### 字体优化

```typescript
// /app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}

// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-playfair)'],
      },
    },
  },
}
```

### 代码分割

```typescript
import dynamic from 'next/dynamic'

// 动态导入Client Component
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false, // 禁用SSR
})

// 条件导入
const AdminPanel = dynamic(() => import('@/components/AdminPanel'))

export function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

## 错误处理

### 全局错误边界

```typescript
// /app/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={() => reset()} className="mt-4">
        Try again
      </Button>
    </div>
  )
}

// /app/global-error.tsx (捕获layout错误)
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}

// /app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <Link href="/">
        <Button className="mt-4">Go Home</Button>
      </Link>
    </div>
  )
}
```

## 国际化

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'zh', 'de', 'fr'],
  defaultLocale: 'en',
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}

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

// 使用翻译
import { useTranslations } from 'next-intl'

export function Component() {
  const t = useTranslations('ProjectCard')

  return <div>{t('title')}</div>
}
```

## 环境变量

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # 仅服务端
STRIPE_SECRET_KEY=... # 仅服务端

// 访问
process.env.NEXT_PUBLIC_SUPABASE_URL // 客户端+服务端
process.env.STRIPE_SECRET_KEY // 仅服务端

// 类型安全
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      SUPABASE_SERVICE_ROLE_KEY: string
      // ...
    }
  }
}
```
