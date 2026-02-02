# 4D众筹平台 - 架构上下文提示词

> **用途：** 当LLM需要了解整体系统架构时使用此提示词
> **使用场景：** 新功能开发、架构讨论、技术选型、系统集成

## 系统概述

4D是一个专注于3D打印领域的众筹平台，采用milestone-based funding（里程碑式众筹）模式，帮助创作者逐步筹集资金，降低支持者风险。

## 技术栈总览

### 前端技术栈
- **框架：** Next.js 14+ (App Router)
- **UI库：** React 18+
- **类型系统：** TypeScript 5+
- **样式方案：** Tailwind CSS + shadcn/ui
- **状态管理：** Zustand (全局) + React Query (服务端)
- **表单处理：** React Hook Form + Zod
- **国际化：** next-intl

### 后端技术栈
- **BaaS平台：** Supabase
  - 数据库：PostgreSQL (带RLS)
  - 认证：Supabase Auth (JWT)
  - 存储：Supabase Storage
  - 实时：Realtime (WebSocket)
  - 计算：Edge Functions (Deno)

### 第三方服务
- **支付：** Stripe + Stripe Connect
- **邮件：** SendGrid
- **监控：** Sentry + Vercel Analytics
- **部署：** Vercel (前端) + Supabase Cloud (后端)

## 核心架构原则

1. **安全优先：** RLS保护所有数据表，JWT认证所有请求
2. **性能优化：** Server Components优先，Edge缓存，懒加载
3. **关注点分离：** 前端专注用户体验，后端专注数据与业务逻辑
4. **可扩展性：** 模块化设计，水平扩展能力
5. **开发效率：** 利用BaaS减少基础设施工作

## 核心业务流程

### 1. 用户注册流程
```
用户输入信息 → Supabase Auth注册 → 创建用户Profile → 发送验证邮件 → 跳转到仪表板
```

### 2. 项目创建流程
```
创作者填写项目信息 → 上传媒体文件 → 设置里程碑 → 提交审核 → 平台审核 → 批准上线
```

### 3. 支持项目流程
```
选择奖励档位 → 创建PaymentIntent → Stripe Elements收集支付信息 → 确认支付 → 
Webhook处理 → 更新backing状态 → 资金进入Escrow → 发送确认邮件
```

### 4. 里程碑验证与资金释放
```
创作者提交里程碑证明 → 平台审核 → 验证通过 → 触发资金释放函数 → 
Stripe Transfer到创作者账户 → 更新里程碑状态 → 通知支持者
```

## 数据库核心表结构

### 用户相关
- `users` - 用户信息（扩展auth.users）
- `user_roles` - 角色权限

### 项目相关
- `projects` - 项目主表
- `milestones` - 里程碑
- `rewards` - 奖励档位
- `project_updates` - 项目更新

### 交易相关
- `backings` - 支持记录
- `escrow_transactions` - 资金托管
- `payments` - 支付记录

### 社区相关
- `comments` - 评论
- `likes` - 点赞
- `follows` - 关注

## 安全机制

### Row Level Security (RLS)
所有表都启用RLS策略，示例：
```sql
-- 创作者只能编辑自己的项目
CREATE POLICY "Creators can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = creator_id);

-- 支持者只能查看自己的backing
CREATE POLICY "Backers view own backings"
  ON backings FOR SELECT
  USING (auth.uid() = backer_id);
```

### 认证与授权
- JWT Token验证（Supabase Auth）
- 多角色系统（backer, creator, admin）
- 中间件保护敏感路由
- API速率限制

## 关键设计模式

### 1. Server Components优先
```typescript
// 默认使用Server Component
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient() // 服务端客户端
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  return <ProjectDetail project={project} />
}
```

### 2. 服务端状态管理（React Query）
```typescript
'use client'

export function ProjectList() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*')
      return data
    },
  })

  if (isLoading) return <Skeleton />
  return <div>{data.map(p => <ProjectCard key={p.id} project={p} />)}</div>
}
```

### 3. Repository模式（数据访问抽象）
```typescript
// /lib/repositories/project-repository.ts
export class ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    return data
  }

  async create(dto: CreateProjectDTO): Promise<Project> {
    const { data } = await supabase
      .from('projects')
      .insert(dto)
      .select()
      .single()
    return data
  }
}
```

## 环境变量

### 必需变量
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # 仅服务端

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 应用
NEXT_PUBLIC_APP_URL=https://4d-crowdfunding.com
```

## 性能优化策略

### 1. 边缘缓存
- 静态页面：ISR增量渲染
- 动态数据：React Query缓存（5分钟）
- CDN：Vercel Edge Network

### 2. 代码分割
- 路由级别自动分割（Next.js）
- 组件级动态导入（React.lazy）
- 库按需加载（tree-shaking）

### 3. 图片优化
- next/image自动优化
- Supabase Storage Transform API
- WebP格式 + 响应式尺寸

## 开发规范

### 命名约定
- 文件名：kebab-case (project-card.tsx)
- 组件名：PascalCase (ProjectCard)
- 函数名：camelCase (createProject)
- 常量名：UPPER_SNAKE_CASE (MAX_UPLOAD_SIZE)

### 代码组织
```
/app
  /(marketing)     # 营销页面
  /(platform)      # 平台功能
  /api             # API路由
/components
  /ui              # shadcn/ui组件
  /project         # 项目组件
  /layout          # 布局组件
/lib
  /supabase        # Supabase客户端
  /repositories    # 数据访问层
  /hooks           # 自定义hooks
  /utils           # 工具函数
```

### TypeScript规范
- 严格模式启用
- 避免any，使用unknown
- 使用Zod定义schema，自动推导类型
- 数据库类型从Supabase生成

## 故障排查清单

### 数据查询失败
1. 检查RLS策略是否正确
2. 验证JWT token是否有效
3. 确认用户角色权限
4. 查看Supabase日志

### 支付问题
1. 验证Stripe webhook签名
2. 检查PaymentIntent状态
3. 查看backing记录状态
4. 确认Stripe Dashboard事件

### 实时订阅不工作
1. 检查RLS策略（Realtime需要SELECT权限）
2. 验证channel名称是否正确
3. 确认WebSocket连接状态
4. 查看浏览器控制台错误

## 扩展阅读

- [TECHNICAL_ARCHITECTURE.md](../TECHNICAL_ARCHITECTURE.md) - 完整技术文档
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Stripe Payments](https://stripe.com/docs/payments)
