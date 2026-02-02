# Skill: Supabase Integration

> **适用场景：** 所有涉及Supabase后端服务的开发工作
> **核心价值：** 确保正确使用Supabase各项服务，遵循安全最佳实践

## 核心原则

1. **安全优先：** 所有表启用RLS，客户端永远使用anon key
2. **类型安全：** 使用Supabase CLI生成的TypeScript类型
3. **性能优化：** 合理使用关联查询，避免N+1问题
4. **错误处理：** 始终检查error，给用户友好的错误提示

## 客户端使用规范

### 环境区分

```typescript
// ❌ 错误：客户端和服务端混用
import { supabase } from '@/lib/supabase/client'

export default async function Page() {
  const { data } = await supabase.from('projects').select('*')
  return <div>{/* ... */}</div>
}

// ✅ 正确：Server Component使用服务端客户端
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data } = await supabase.from('projects').select('*')
  return <div>{/* ... */}</div>
}

// ✅ 正确：Client Component使用客户端
'use client'
import { supabase } from '@/lib/supabase/client'

export function Component() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    supabase.from('projects').select('*').then(({ data }) => setData(data))
  }, [])
  
  return <div>{/* ... */}</div>
}
```

### RLS策略检查清单

**创建新表时必须：**

1. 启用RLS：`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. 创建查看策略（SELECT policy）
3. 创建操作策略（INSERT/UPDATE/DELETE policies）
4. 测试策略是否生效

```sql
-- 示例：创建项目表的RLS策略
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 查看策略
CREATE POLICY "Public can view live projects"
  ON projects FOR SELECT
  USING (status = 'live');

CREATE POLICY "Creators can view own drafts"
  ON projects FOR SELECT
  USING (auth.uid() = creator_id);

-- 插入策略
CREATE POLICY "Creators can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- 更新策略
CREATE POLICY "Creators can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- 删除策略
CREATE POLICY "Creators can delete own drafts"
  ON projects FOR DELETE
  USING (auth.uid() = creator_id AND status = 'draft');
```

### 认证流程标准

```typescript
// 注册
export async function signUp(email: string, password: string, metadata: {
  username: string
  full_name: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data.user
}

// 登录
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data.user
}

// 登出
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 获取当前用户
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// 监听认证状态变化
export function useAuthStateChange(callback: (user: User | null) => void) {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        callback(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [callback])
}
```

### 文件上传标准

```typescript
// 上传文件
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  // 验证文件大小
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 10MB')
  }

  // 验证文件类型
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return publicUrl
}

// 删除文件
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
}

// 获取图片转换URL
export function getTransformedImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number }
) {
  const params = new URLSearchParams()
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.quality) params.set('quality', options.quality.toString())

  return `${url}?${params.toString()}`
}
```

### 实时订阅标准

```typescript
// 订阅表变化
export function useTableSubscription<T>(
  table: string,
  callback: (payload: T) => void,
  filter?: string
) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          callback(payload.new as T)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, callback])
}

// 使用示例
export function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null)

  useTableSubscription<Project>(
    'projects',
    (newProject) => setProject(newProject),
    `id=eq.${projectId}`
  )

  return <div>{/* ... */}</div>
}
```

## Edge Functions 规范

### Function 结构模板

```typescript
// /supabase/functions/function-name/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 验证认证
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // 解析请求体
    const body = await req.json()

    // 业务逻辑
    // ...

    // 返回响应
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})
```

### 调用Edge Function

```typescript
// 从客户端调用
export async function invokeEdgeFunction<T>(
  functionName: string,
  data: Record<string, any>
): Promise<T> {
  const { data: result, error } = await supabase.functions.invoke(functionName, {
    body: data,
  })

  if (error) throw error
  return result as T
}

// 使用示例
const result = await invokeEdgeFunction('create-payment-intent', {
  projectId: '123',
  amount: 100,
})
```

## 数据库函数规范

### Function命名约定

- 查询函数：`get_*` (例如：get_project_stats)
- 操作函数：`create_*`, `update_*`, `delete_*`
- 验证函数：`is_*`, `can_*`, `has_*`
- 触发器函数：`*_trigger` (例如：update_timestamp_trigger)

### Function模板

```sql
-- 查询函数
CREATE OR REPLACE FUNCTION get_project_stats(p_project_id UUID)
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
  WHERE project_id = p_project_id
  AND payment_status = 'succeeded';
END;
$$ LANGUAGE plpgsql STABLE;

-- 操作函数（带事务）
CREATE OR REPLACE FUNCTION create_project_with_rewards(
  p_project_data JSONB,
  p_rewards_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
  v_reward JSONB;
BEGIN
  -- 插入项目
  INSERT INTO projects (title, description, goal_amount, creator_id)
  VALUES (
    p_project_data->>'title',
    p_project_data->>'description',
    (p_project_data->>'goal_amount')::NUMERIC,
    (p_project_data->>'creator_id')::UUID
  )
  RETURNING id INTO v_project_id;

  -- 插入奖励
  FOR v_reward IN SELECT * FROM jsonb_array_elements(p_rewards_data)
  LOOP
    INSERT INTO rewards (project_id, title, amount)
    VALUES (
      v_project_id,
      v_reward->>'title',
      (v_reward->>'amount')::NUMERIC
    );
  END LOOP;

  RETURN v_project_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating project: %', SQLERRM;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 触发器函数
CREATE OR REPLACE FUNCTION update_timestamp_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_trigger();
```

## 常见问题解决

### 问题1：查询返回空但数据存在
**原因：** RLS策略阻止访问  
**解决：**
```sql
-- 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'projects';

-- 临时禁用RLS测试（开发环境）
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- 查询
-- 重新启用
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

### 问题2：实时订阅不触发
**原因：** RLS策略未授予SELECT权限  
**解决：**
```sql
-- Realtime需要SELECT权限
CREATE POLICY "Authenticated users can view updates"
  ON project_updates FOR SELECT
  USING (auth.role() = 'authenticated');
```

### 问题3：文件上传失败
**原因：** Storage RLS策略或文件大小限制  
**解决：**
```sql
-- 检查Storage策略
SELECT * FROM storage.policies WHERE bucket_id = 'project-images';

-- 创建正确的策略
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 问题4：Edge Function超时
**原因：** 长时间运行的操作  
**解决：**
- 使用Database Functions处理复杂逻辑
- 异步处理（通过队列）
- 拆分为多个小函数

## 性能优化检查清单

- [ ] 使用索引优化常用查询
- [ ] 避免SELECT *，只查询需要的字段
- [ ] 使用关联查询代替多次查询
- [ ] 合理设置React Query缓存时间
- [ ] 对大表使用分页
- [ ] 使用Database Functions处理复杂聚合
- [ ] 图片使用Transform API压缩
- [ ] 长列表使用虚拟滚动
- [ ] 实时订阅仅订阅必要字段

## 安全检查清单

- [ ] 所有表启用RLS
- [ ] 客户端仅使用Anon Key
- [ ] Service Role Key仅在服务端使用
- [ ] 敏感操作使用Edge Functions
- [ ] 验证用户输入（Zod schema）
- [ ] 文件上传验证类型和大小
- [ ] API路由使用中间件保护
- [ ] 定期审查RLS策略
- [ ] 不在客户端暴露敏感数据
- [ ] 使用参数化查询防止SQL注入
