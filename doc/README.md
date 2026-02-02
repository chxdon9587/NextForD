# 4D 众筹平台项目

> 专注于3D打印领域的里程碑式众筹平台

## 项目概述

4D是一个创新的众筹平台，专为3D打印领域设计，采用milestone-based funding（里程碑式众筹）模式，帮助创作者逐步筹集资金，同时降低支持者的投资风险。

### 核心特点

- 🎯 **里程碑式众筹**：分阶段释放资金，降低风险
- 🔒 **资金托管**：Escrow机制保障双方权益
- ⚡ **实时更新**：WebSocket实时推送项目进展
- 🌍 **多币种支持**：全球化支付解决方案
- 🛡️ **安全可靠**：RLS行级安全，多层防护

## 技术栈

### 前端
- **框架**：Next.js 14+ (App Router)
- **UI库**：React 18 + TypeScript 5
- **样式**：Tailwind CSS + shadcn/ui
- **状态管理**：Zustand + React Query
- **表单处理**：React Hook Form + Zod

### 后端
- **BaaS平台**：Supabase
  - PostgreSQL数据库（带RLS）
  - 认证服务（JWT）
  - 对象存储
  - 实时订阅
  - Edge Functions

### 第三方服务
- **支付**：Stripe + Stripe Connect
- **邮件**：SendGrid
- **监控**：Sentry + Vercel Analytics
- **部署**：Vercel + Supabase Cloud

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 8+
- Supabase CLI
- Stripe CLI（开发环境）

### 安装步骤

```bash
# 克隆仓库
git clone <repository-url>
cd 4D

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的密钥

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 数据库设置

```bash
# 安装Supabase CLI
npm install -g supabase

# 初始化Supabase
supabase init

# 启动本地Supabase（可选）
supabase start

# 应用数据库迁移
supabase db push

# 生成TypeScript类型
supabase gen types typescript --local > types/supabase.ts
```

### Stripe设置（本地开发）

```bash
# 安装Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 监听Webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 项目结构

```
/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # 营销页面
│   ├── (platform)/         # 平台功能
│   ├── api/                # API路由
│   └── layout.tsx          # 根布局
├── components/             # React组件
│   ├── ui/                 # shadcn/ui组件
│   ├── project/            # 项目相关组件
│   ├── creator/            # 创作者组件
│   ├── backer/             # 支持者组件
│   └── layout/             # 布局组件
├── lib/                    # 工具库
│   ├── supabase/           # Supabase客户端
│   ├── stripe/             # Stripe客户端
│   ├── hooks/              # 自定义Hooks
│   ├── utils/              # 工具函数
│   └── schemas/            # Zod schemas
├── skills/                 # 开发规范技能
│   ├── supabase-integration.md
│   ├── stripe-payment-integration.md
│   └── nextjs-development.md
├── .opencode/              # LLM上下文提示词
│   └── prompts/
│       ├── architecture-context.md
│       ├── database-operations.md
│       └── component-development.md
├── types/                  # TypeScript类型定义
├── public/                 # 静态资源
├── supabase/               # Supabase配置
│   ├── migrations/         # 数据库迁移
│   └── functions/          # Edge Functions
└── TECHNICAL_ARCHITECTURE.md  # 完整技术文档
```

## 核心文档

- **[技术架构文档](./TECHNICAL_ARCHITECTURE.md)** - 完整的系统架构设计
- **[数据库操作指南](./.opencode/prompts/database-operations.md)** - Supabase数据库操作规范
- **[组件开发指南](./.opencode/prompts/component-development.md)** - React组件开发规范
- **[Supabase集成](./skills/supabase-integration.md)** - Supabase服务集成技能
- **[Stripe支付](./skills/stripe-payment-integration.md)** - Stripe支付集成技能
- **[Next.js开发](./skills/nextjs-development.md)** - Next.js开发最佳实践

## 开发规范

### 命名约定

- **文件名**：kebab-case (`project-card.tsx`)
- **组件名**：PascalCase (`ProjectCard`)
- **函数名**：camelCase (`createProject`)
- **常量名**：UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)

### Git提交规范

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链更新
```

### 代码风格

- 使用TypeScript严格模式
- 使用ESLint + Prettier
- 组件优先使用Server Components
- 遵循Tailwind CSS最佳实践

## 环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SendGrid（可选）
SENDGRID_API_KEY=SG...

# Sentry（可选）
NEXT_PUBLIC_SENTRY_DSN=https://...
```

## 测试

```bash
# 运行单元测试
pnpm test

# 运行E2E测试
pnpm test:e2e

# 类型检查
pnpm type-check

# Lint检查
pnpm lint
```

## 部署

### Vercel部署（推荐）

1. 连接GitHub仓库
2. 配置环境变量
3. 自动部署

### 手动部署

```bash
# 构建
pnpm build

# 启动生产服务器
pnpm start
```

## 常见问题

### 1. Supabase查询返回空

**问题**：数据存在但查询返回空数组  
**解决**：检查RLS策略是否正确配置

```sql
-- 查看RLS策略
SELECT * FROM pg_policies WHERE tablename = 'projects';
```

### 2. Stripe Webhook不触发

**问题**：支付成功但数据库未更新  
**解决**：

```bash
# 检查Webhook签名
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 验证STRIPE_WEBHOOK_SECRET配置正确
```

### 3. 图片上传失败

**问题**：上传返回403错误  
**解决**：检查Storage RLS策略

```sql
-- Storage策略示例
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 贡献指南

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

[MIT License](./LICENSE)

## 联系方式

- **项目负责人**：技术架构团队
- **邮箱**：tech@4d-crowdfunding.com
- **文档**：[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)

---

**文档版本**：v1.0  
**最后更新**：2026-02-02
