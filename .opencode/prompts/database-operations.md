# 数据库操作提示词

> **用途：** 执行数据库查询、更新、RLS策略配置时使用
> **使用场景：** CRUD操作、复杂查询、数据迁移、RLS配置

## Supabase客户端使用

### 客户端组件（'use client'）
```typescript
import { supabase } from '@/lib/supabase/client'

// 查询数据
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'live')
```

### 服务端组件（Server Components / Route Handlers）
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data } = await supabase.from('projects').select('*')
  return <div>{/* ... */}</div>
}
```

### Edge Functions（Deno环境）
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role绕过RLS
)
```

## 基础CRUD操作

### 查询（SELECT）

#### 基础查询
```typescript
// 查询所有
const { data, error } = await supabase
  .from('projects')
  .select('*')

// 选择特定字段
const { data } = await supabase
  .from('projects')
  .select('id, title, creator_id')

// 单条记录
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single()
```

#### 关联查询（Joins）
```typescript
// 一对多：项目及其奖励
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    rewards (*)
  `)

// 多对一：项目及其创作者
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    creator:users (
      id,
      username,
      avatar_url
    )
  `)

// 多层关联
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    creator:users (*),
    rewards (*),
    backings (
      *,
      backer:users (*)
    )
  `)
```

#### 过滤条件
```typescript
// 相等
.eq('status', 'live')

// 不等
.neq('status', 'cancelled')

// 大于/小于
.gt('goal_amount', 10000)
.lt('current_amount', 5000)
.gte('created_at', '2024-01-01')
.lte('deadline', '2024-12-31')

// IN
.in('category', ['3D_PRINTER', 'FILAMENT'])

// LIKE
.like('title', '%printer%')
.ilike('title', '%PRINTER%') // 不区分大小写

// IS NULL
.is('deleted_at', null)

// 组合条件（AND）
.eq('status', 'live')
.gt('goal_amount', 1000)

// OR条件
.or('status.eq.live,status.eq.successful')

// 复杂条件
.or('status.eq.live,and(status.eq.draft,creator_id.eq.${userId})')
```

#### 排序与分页
```typescript
// 排序
.order('created_at', { ascending: false })
.order('current_amount', { ascending: false })

// 分页
.range(0, 9) // 前10条
.range(10, 19) // 第11-20条

// 限制数量
.limit(10)

// 多字段排序
.order('status', { ascending: true })
.order('created_at', { ascending: false })
```

### 插入（INSERT）

#### 单条插入
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    creator_id: userId,
    title: 'My Project',
    description: 'Description',
    goal_amount: 10000,
    category: '3D_PRINTER',
    status: 'draft',
  })
  .select() // 返回插入的数据
  .single()
```

#### 批量插入
```typescript
const { data, error } = await supabase
  .from('rewards')
  .insert([
    { project_id: projectId, title: 'Basic', amount: 50 },
    { project_id: projectId, title: 'Premium', amount: 100 },
    { project_id: projectId, title: 'Ultimate', amount: 200 },
  ])
  .select()
```

#### Upsert（插入或更新）
```typescript
const { data, error } = await supabase
  .from('projects')
  .upsert({
    id: projectId, // 如果存在则更新
    title: 'Updated Title',
    // ...
  })
  .select()
```

### 更新（UPDATE）

```typescript
// 单条更新
const { data, error } = await supabase
  .from('projects')
  .update({ status: 'live' })
  .eq('id', projectId)
  .select()

// 批量更新
const { data, error } = await supabase
  .from('projects')
  .update({ status: 'cancelled' })
  .eq('creator_id', userId)
  .eq('status', 'draft')

// 增量更新（使用数据库函数）
const { data, error } = await supabase.rpc('increment_view_count', {
  project_id: projectId,
})
```

### 删除（DELETE）

```typescript
// 软删除（推荐）
const { error } = await supabase
  .from('projects')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', projectId)

// 硬删除
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)
```

## 高级查询

### 全文搜索
```typescript
// 使用to_tsquery
const { data } = await supabase
  .from('projects')
  .select('*')
  .textSearch('title', `'3D' & 'printer'`)

// 使用plainto_tsquery（更灵活）
const { data } = await supabase
  .from('projects')
  .select('*')
  .textSearch('description', '3D printer', {
    type: 'plain',
  })
```

### 聚合查询
```typescript
// 使用Database Functions
const { data } = await supabase.rpc('get_project_stats', {
  project_id: projectId,
})

// Database Function定义
CREATE OR REPLACE FUNCTION get_project_stats(project_id UUID)
RETURNS TABLE (
  total_backers INTEGER,
  total_amount NUMERIC,
  avg_backing NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT backer_id)::INTEGER,
    COALESCE(SUM(amount), 0),
    COALESCE(AVG(amount), 0)
  FROM backings
  WHERE project_id = project_id
  AND payment_status = 'succeeded';
END;
$$ LANGUAGE plpgsql;
```

### 事务处理
```typescript
// 使用Database Functions实现事务
const { data, error } = await supabase.rpc('create_project_with_rewards', {
  project_data: {
    title: 'My Project',
    // ...
  },
  rewards_data: [
    { title: 'Basic', amount: 50 },
    { title: 'Premium', amount: 100 },
  ],
})

// Database Function定义
CREATE OR REPLACE FUNCTION create_project_with_rewards(
  project_data JSONB,
  rewards_data JSONB
) RETURNS UUID AS $$
DECLARE
  new_project_id UUID;
  reward JSONB;
BEGIN
  -- 插入项目
  INSERT INTO projects (title, description, goal_amount, creator_id)
  VALUES (
    project_data->>'title',
    project_data->>'description',
    (project_data->>'goal_amount')::NUMERIC,
    (project_data->>'creator_id')::UUID
  )
  RETURNING id INTO new_project_id;

  -- 插入奖励
  FOR reward IN SELECT * FROM jsonb_array_elements(rewards_data)
  LOOP
    INSERT INTO rewards (project_id, title, amount)
    VALUES (
      new_project_id,
      reward->>'title',
      (reward->>'amount')::NUMERIC
    );
  END LOOP;

  RETURN new_project_id;
END;
$$ LANGUAGE plpgsql;
```

## RLS策略配置

### 启用RLS
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

### 常见策略模式

#### 1. 查看权限
```sql
-- 所有人可查看公开项目
CREATE POLICY "Public projects are viewable by everyone"
  ON projects FOR SELECT
  USING (status IN ('live', 'successful'));

-- 创作者可查看自己的草稿
CREATE POLICY "Creators can view own drafts"
  ON projects FOR SELECT
  USING (auth.uid() = creator_id);

-- 管理员可查看所有
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

#### 2. 插入权限
```sql
-- 认证用户可创建项目
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('creator', 'admin')
    )
  );
```

#### 3. 更新权限
```sql
-- 创作者可更新自己的项目
CREATE POLICY "Creators can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (
    auth.uid() = creator_id
    AND status NOT IN ('successful', 'cancelled') -- 已完成项目不可编辑
  );
```

#### 4. 删除权限
```sql
-- 创作者可删除自己的草稿
CREATE POLICY "Creators can delete own drafts"
  ON projects FOR DELETE
  USING (
    auth.uid() = creator_id
    AND status = 'draft'
  );
```

### 组合策略
```sql
-- backings表：支持者和创作者都可查看
CREATE POLICY "Backers view own backings"
  ON backings FOR SELECT
  USING (auth.uid() = backer_id);

CREATE POLICY "Creators view project backings"
  ON backings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = backings.project_id
      AND projects.creator_id = auth.uid()
    )
  );
```

### 调试RLS策略
```sql
-- 临时禁用RLS测试
SET LOCAL ROLE postgres;
SELECT * FROM projects; -- 可以看到所有数据
RESET ROLE;

-- 使用特定用户测试
SET LOCAL auth.uid = '用户UUID';
SELECT * FROM projects; -- 看到该用户权限下的数据
RESET;
```

## 数据库函数

### 触发器（Triggers）

```sql
-- 自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 更新项目筹资金额
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
    )
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_project_funding
  AFTER INSERT OR UPDATE OF payment_status ON backings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_funding();
```

### 自定义函数
```sql
-- 检查项目是否达标
CREATE OR REPLACE FUNCTION is_project_funded(project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  project_record RECORD;
BEGIN
  SELECT current_amount, goal_amount 
  INTO project_record
  FROM projects
  WHERE id = project_id;
  
  RETURN project_record.current_amount >= project_record.goal_amount;
END;
$$ LANGUAGE plpgsql;

-- 使用
SELECT * FROM projects WHERE is_project_funded(id) = true;
```

## 实时订阅

### 订阅表变化
```typescript
const channel = supabase
  .channel('projects-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, 或 *
      schema: 'public',
      table: 'projects',
      filter: 'status=eq.live', // 可选过滤
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// 清理
supabase.removeChannel(channel)
```

### 订阅特定行
```typescript
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
      console.log('Project updated:', payload.new)
    }
  )
  .subscribe()
```

### Broadcast（自定义事件）
```typescript
// 发送
const channel = supabase.channel('room-1')
await channel.send({
  type: 'broadcast',
  event: 'test',
  payload: { message: 'hello' },
})

// 接收
channel.on('broadcast', { event: 'test' }, (payload) => {
  console.log(payload)
})
```

## 性能优化

### 索引
```sql
-- 创建索引
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- 复合索引
CREATE INDEX idx_backings_project_status 
  ON backings(project_id, payment_status);

-- 部分索引
CREATE INDEX idx_live_projects 
  ON projects(created_at) 
  WHERE status = 'live';
```

### 查询优化
```typescript
// ❌ 避免N+1查询
const projects = await supabase.from('projects').select('*')
for (const project of projects.data) {
  const rewards = await supabase
    .from('rewards')
    .select('*')
    .eq('project_id', project.id)
}

// ✅ 使用关联查询
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    rewards (*)
  `)
```

## 常见问题排查

### RLS导致查询返回空
```typescript
// 检查当前用户
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// 使用Service Role Key（绕过RLS）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ 仅服务端使用
)
```

### 外键约束错误
```typescript
// 确保外键存在
const { data: user } = await supabase
  .from('users')
  .select('id')
  .eq('id', userId)
  .single()

if (!user) throw new Error('User not found')

// 然后插入
await supabase.from('projects').insert({
  creator_id: userId,
  // ...
})
```

### 类型推导
```typescript
// 生成TypeScript类型
// supabase gen types typescript --local > types/supabase.ts

import type { Database } from '@/types/supabase'

const supabase = createClient<Database>(...)

// 自动类型推导
const { data } = await supabase.from('projects').select('*')
// data的类型为 Database['public']['Tables']['projects']['Row'][]
```
