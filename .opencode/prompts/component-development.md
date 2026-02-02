# 组件开发提示词

> **用途：** 开发React组件时使用
> **使用场景：** 创建新组件、重构现有组件、实现UI功能

## 项目目录结构

```
/app
  /(marketing)          # 营销页面路由组
    /page.tsx           # 首页
    /about/page.tsx     # 关于页面
  /(platform)           # 平台功能路由组
    /projects           # 项目相关
      /page.tsx         # 项目列表
      /[id]/page.tsx    # 项目详情
      /(create)         # 创建项目流程
        /basic/page.tsx
        /rewards/page.tsx
        /milestones/page.tsx
    /dashboard
      /creator          # 创作者仪表板
      /backer           # 支持者中心
  /api                  # API路由
    /webhooks/stripe/route.ts
/components
  /ui                   # shadcn/ui基础组件
    /button.tsx
    /card.tsx
    /dialog.tsx
  /project              # 项目相关组件
    /ProjectCard.tsx
    /ProjectDetail.tsx
    /ProjectFilters.tsx
  /creator              # 创作者相关组件
    /CreateProjectForm.tsx
    /MilestoneManager.tsx
  /backer               # 支持者相关组件
    /BackingHistory.tsx
    /PaymentForm.tsx
  /layout               # 布局组件
    /Header.tsx
    /Footer.tsx
    /Sidebar.tsx
  /forms                # 表单组件
/lib
  /supabase             # Supabase客户端
  /hooks                # 自定义Hooks
  /utils                # 工具函数
  /schemas              # Zod schemas
  /stores               # Zustand stores
/types                  # TypeScript类型
  /database.ts
  /supabase.ts
```

## 组件开发规范

### 组件模板

#### Server Component（默认）
```typescript
// /app/(platform)/projects/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ProjectDetail } from '@/components/project/ProjectDetail'
import { notFound } from 'next/navigation'

interface PageProps {
  params: { id: string }
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

  return (
    <main className="container mx-auto py-8">
      <ProjectDetail project={project} />
    </main>
  )
}

// 生成静态参数（可选）
export async function generateStaticParams() {
  const supabase = createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .limit(100)

  return projects?.map((project) => ({
    id: project.id,
  })) || []
}

// 元数据
export async function generateMetadata({ params }: PageProps) {
  const supabase = createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('title, description, cover_image')
    .eq('id', params.id)
    .single()

  return {
    title: project?.title,
    description: project?.description,
    openGraph: {
      images: [project?.cover_image],
    },
  }
}
```

#### Client Component
```typescript
// /components/project/ProjectCard.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/database'

interface ProjectCardProps {
  project: Project
  className?: string
  priority?: boolean // 图片优先加载
}

export function ProjectCard({ 
  project, 
  className,
  priority = false 
}: ProjectCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const fundingPercentage = (project.current_amount / project.goal_amount) * 100
  const daysLeft = Math.max(
    0,
    Math.floor(
      (new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  )

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-lg', className)}>
      <Link href={`/projects/${project.id}`}>
        <div className="relative aspect-video">
          <Image
            src={project.cover_image || '/placeholder-project.jpg'}
            alt={project.title}
            fill
            className="object-cover"
            priority={priority}
          />
          <div className="absolute top-2 right-2">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault()
                setIsLiked(!isLiked)
              }}
            >
              <HeartIcon className={cn(isLiked && 'fill-red-500 text-red-500')} />
            </Button>
          </div>
        </div>
      </Link>

      <CardHeader>
        <Link href={`/projects/${project.id}`}>
          <h3 className="line-clamp-2 text-xl font-semibold hover:underline">
            {project.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground">
          by <Link href={`/users/${project.creator.id}`} className="hover:underline">
            {project.creator.username}
          </Link>
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        <Progress value={Math.min(100, fundingPercentage)} />
        <div className="flex justify-between text-sm">
          <span className="font-semibold">
            ${project.current_amount.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            of ${project.goal_amount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{project.backer_count} backers</span>
          <span>{daysLeft} days left</span>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/projects/${project.id}`} className="w-full">
          <Button className="w-full">View Project</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
```

### 表单组件

```typescript
// /components/forms/CreateProjectForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { projectSchema, type ProjectFormData } from '@/lib/schemas/project-schema'
import { supabase } from '@/lib/supabase/client'

export function CreateProjectForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      goal_amount: 1000,
      category: '3D_PRINTER',
    },
  })

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          ...data,
          creator_id: user.id,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return project
    },
    onSuccess: (project) => {
      toast.success('Project created successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push(`/dashboard/creator/projects/${project.id}/edit`)
    },
    onError: (error) => {
      toast.error('Failed to create project', {
        description: error.message,
      })
    },
  })

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="My Amazing 3D Printer" {...field} />
              </FormControl>
              <FormDescription>
                A clear, concise title that describes your project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your project..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="3D_PRINTER">3D Printer</SelectItem>
                  <SelectItem value="FILAMENT">Filament</SelectItem>
                  <SelectItem value="TOOL">Tool</SelectItem>
                  <SelectItem value="ACCESSORY">Accessory</SelectItem>
                  <SelectItem value="SOFTWARE">Software</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goal_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding Goal (USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="10000"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Minimum: $1,000 | Maximum: $1,000,000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createProjectMutation.isPending}>
          {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </form>
    </Form>
  )
}
```

### 自定义Hooks

```typescript
// /lib/hooks/use-project.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Project } from '@/types/database'

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:users(*),
          rewards(*),
          milestones(*)
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error
      return data as Project
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return project
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// 实时订阅Hook
export function useProjectRealtime(projectId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
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
          queryClient.setQueryData(['projects', projectId], payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, queryClient])
}
```

```typescript
// /lib/hooks/use-auth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

## 样式规范

### Tailwind CSS最佳实践

```typescript
// ✅ 使用cn工具函数合并类名
import { cn } from '@/lib/utils'

export function Button({ className, variant = 'default', ...props }) {
  return (
    <button
      className={cn(
        'rounded-md px-4 py-2 font-medium transition-colors',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  )
}

// ❌ 避免字符串拼接
<button className={'px-4 ' + (isActive ? 'bg-blue-500' : 'bg-gray-500')} />

// ✅ 使用条件类名
<button className={cn('px-4', isActive ? 'bg-blue-500' : 'bg-gray-500')} />
```

### 响应式设计

```typescript
export function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {/* 内容 */}
    </div>
  )
}

// 响应式文字大小
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  Title
</h1>

// 响应式间距
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
  {/* 内容 */}
</div>
```

### 深色模式

```typescript
// 在tailwind.config.ts中启用darkMode
export default {
  darkMode: 'class', // 或 'media'
  // ...
}

// 使用dark:前缀
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
  Content
</div>

// shadcn/ui组件自动支持深色模式
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      Toggle Theme
    </Button>
  )
}
```

## 性能优化

### 图片优化

```typescript
import Image from 'next/image'

// ✅ 使用Next.js Image组件
<Image
  src="/project-image.jpg"
  alt="Project"
  width={800}
  height={600}
  priority // 首屏图片
  placeholder="blur" // 模糊占位符
  blurDataURL="data:image/..."
/>

// 动态图片尺寸
<Image
  src={project.cover_image}
  alt={project.title}
  fill // 填充父容器
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 代码分割

```typescript
// 动态导入组件
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // 禁用SSR
})

export function Page() {
  return (
    <div>
      <HeavyComponent />
    </div>
  )
}

// React.lazy + Suspense
import { lazy, Suspense } from 'react'

const Chart = lazy(() => import('@/components/Chart'))

export function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <Chart />
    </Suspense>
  )
}
```

### 缓存策略

```typescript
// React Query缓存配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// 预取数据
export function ProjectList() {
  const queryClient = useQueryClient()

  const prefetchProject = (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['projects', projectId],
      queryFn: () => fetchProject(projectId),
    })
  }

  return (
    <div>
      {projects.map((project) => (
        <div
          key={project.id}
          onMouseEnter={() => prefetchProject(project.id)}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  )
}
```

## 错误处理

### Error Boundary

```typescript
// /app/error.tsx (路由级错误处理)
'use client'

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

### 组件级错误处理

```typescript
import { toast } from 'sonner'

export function DeleteButton({ projectId }: { projectId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast.success('Project deleted')
    } catch (error) {
      toast.error('Failed to delete project', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
```

## 测试

### 组件测试示例

```typescript
// /components/project/__tests__/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '../ProjectCard'

const mockProject = {
  id: '1',
  title: 'Test Project',
  goal_amount: 10000,
  current_amount: 5000,
  backer_count: 50,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  // ...
}

describe('ProjectCard', () => {
  it('renders project title', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('displays correct funding percentage', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('$5,000')).toBeInTheDocument()
    expect(screen.getByText('of $10,000')).toBeInTheDocument()
  })

  it('shows days left', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText(/30 days left/)).toBeInTheDocument()
  })
})
```

## 无障碍性（A11y）

```typescript
// 语义化HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// 键盘导航
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  aria-label="Like project"
>
  <HeartIcon />
</button>

// ARIA属性
<div
  role="alert"
  aria-live="polite"
  aria-atomic="true"
>
  {errorMessage}
</div>

// 表单标签
<label htmlFor="project-title">
  Project Title
</label>
<input id="project-title" type="text" />
```
