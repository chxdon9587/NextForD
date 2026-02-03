# RLS 无限递归修复指南

## 问题
创建项目时提示: `Error: infinite recursion detected in policy for relation "user_roles"`

## 根本原因
原始 migration 中有 **9 个 policies** 都在查询 `user_roles` 表。当 trigger 尝试插入 `user_roles` 时，这些 policies 执行检查并再次查询 `user_roles`，造成无限循环。

## 修复方案
新 migration: `20260203000005_fix_rls_recursion_complete.sql`

**做了什么:**
1. 删除所有 9 个查询 `user_roles` 的 policies
2. 将 trigger 函数改为 `SECURITY DEFINER` 以绕过 RLS
3. 创建绕过 RLS 的辅助函数 `is_admin_bypass()` 和 `has_role_bypass()`

## 部署步骤

### 方法 1: Supabase SQL Editor (推荐)

1. 访问: https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam/sql/new
2. 复制 `supabase/migrations/20260203000005_fix_rls_recursion_complete.sql` 的内容
3. 粘贴到 SQL Editor
4. 点击 "Run"
5. 应该看到成功消息: "RLS Recursion Fix Complete!"

### 方法 2: Supabase CLI

```bash
cd /Users/a1-6/workspace/4D

# 列出所有 migrations
supabase db list --linked

# 应用新的 migration
supabase db push
```

## 验证修复

### 1. 创建测试项目
```bash
pnpm dev
# 访问 http://localhost:3000/create
# 创建一个新项目
```

### 2. 检查数据库
```sql
-- 检查用户角色 (应该自动分配 backer 角色)
SELECT u.email, ur.role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id;

-- 检查项目是否创建成功
SELECT id, title, status, creator_id
FROM projects
ORDER BY created_at DESC
LIMIT 5;
```

### 3. 测试 trigger
创建新账号后，应该自动获得 `backer` 角色。发布项目后，应该自动获得 `creator` 角色。

## 回滚计划 (如果失败)

```sql
-- 如果修复导致问题，可以回滚:
DROP FUNCTION IF EXISTS public.is_admin_bypass() CASCADE;
DROP FUNCTION IF EXISTS public.has_role_bypass(UUID, user_role) CASCADE;

-- 重新启用原 policies (需要重新运行 20260203000001 migration)
```

## 预期结果

✅ 不再出现 RLS 递归错误
✅ 创建项目正常工作
✅ 用户注册自动获得 backer 角色
✅ 发布项目自动获得 creator 角色
✅ 使用 `is_admin_bypass()` 检查管理员状态

## 注意事项

⚠️ 这个修复删除了一些 admin policies，如果需要完整的管理员功能，需要在应用代码中使用 `is_admin_bypass()` 函数替代 RLS policies。

⚠️ 应用代码中使用角色检查的地方需要更新为使用 `is_admin_bypass()` 和 `has_role_bypass()` 函数。