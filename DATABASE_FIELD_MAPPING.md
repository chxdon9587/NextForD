# 数据库字段映射参考

## ✅ 已修复的字段不一致问题

项目代码现在完全匹配Supabase数据库schema。

---

## 📊 Projects表字段映射

| 代码中 | 数据库中 | 类型 | 说明 |
|--------|----------|------|------|
| `fundingGoal` | `goal_amount` | NUMERIC(12,2) | 资金目标 |
| `currentFunding` | `current_amount` | NUMERIC(12,2) | 当前资金 |
| `imageUrl` | `cover_image` | TEXT | 封面图片URL |
| `funding_goal` | `goal_amount` | NUMERIC(12,2) | 兼容旧字段名 |
| `current_funding` | `current_amount` | NUMERIC(12,2) | 兼容旧字段名 |

**代码支持双字段名：**
```typescript
const fundingGoal = project.goal_amount || project.funding_goal || 0;
const currentFunding = project.current_amount || project.current_funding || 0;
const imageUrl = project.cover_image || project.image_url;
```

---

## 📊 Milestones表字段映射

| 代码中 | 数据库中 | 类型 | 说明 |
|--------|----------|------|------|
| `fundingTarget` | `goal_amount` | NUMERIC(12,2) | 里程碑资金目标 |
| `currentFunding` | `current_amount` | NUMERIC(12,2) | 里程碑当前资金 |
| `order` | `order_index` | INTEGER | 里程碑顺序 |
| `deadline_days` | `deadline_days` | INTEGER | 截止天数（自动计算）⭐ |

**deadline_days计算逻辑：**
```typescript
// app/actions/project.ts
const baseDeadlineDays = 30;  // 基础30天
const deadlineDays = baseDeadlineDays + (index * 15);  // 每个+15天

// 结果：
// Milestone 1: 30天
// Milestone 2: 45天
// Milestone 3: 60天
```

---

## 📊 Rewards表字段映射

| 代码中（旧） | 代码中（新） | 数据库中 | 类型 | 说明 |
|-------------|-------------|----------|------|------|
| `pledgeAmount` | `amount` | `amount` | NUMERIC(10,2) | 支持金额 ✅ |
| `backerLimit` | `quantity_total` | `quantity_total` | INTEGER | 总限额 ✅ |
| `backersCount` | `quantity_claimed` | `quantity_claimed` | INTEGER | 已认领数量 ✅ |
| `estimatedDelivery` | `estimated_delivery` | `estimated_delivery` | DATE | 预计交付日期 ✅ |
| `shippingType` | `shipping_required` | `shipping_required` | BOOLEAN | 是否需要配送 ✅ |
| - | `shipping_locations` | `shipping_locations` | TEXT[] | 配送地区数组 ✅ |
| - | `order_index` | `order_index` | INTEGER | 奖励顺序 ✅ |
| - | `is_limited` | `is_limited` | BOOLEAN | 是否限量 ✅ |

**RewardCard组件现在支持双字段名：**
```typescript
interface RewardCardProps {
  // 新字段名（数据库）
  amount?: number;
  quantity_total?: number;
  quantity_claimed?: number;
  estimated_delivery?: string;
  shipping_required?: boolean;
  
  // 旧字段名（向后兼容）
  pledgeAmount?: number;
  backerLimit?: number;
  backersCount?: number;
  estimatedDelivery?: Date;
  shippingType?: string;
}

// 组件内部自动适配
const actualAmount = amount || pledgeAmount || 0;
const actualBackerLimit = quantity_total || backerLimit;
const actualBackersCount = quantity_claimed || backersCount || 0;
```

**Server Action插入数据：**
```typescript
// app/actions/project.ts
const rewardsData = rewards.map((r, index) => ({
  project_id: project.id,
  title: r.title,
  description: r.description,
  amount: r.pledgeAmount,  // ✅ 映射到amount
  quantity_total: r.backerLimit || null,  // ✅
  quantity_claimed: 0,  // ✅
  is_limited: r.backerLimit ? true : false,  // ✅
  estimated_delivery: r.estimatedDelivery.toISOString().split('T')[0],  // ✅ DATE格式
  shipping_required: r.shippingType !== 'digital',  // ✅
  shipping_locations: r.shippingType === 'worldwide' ? ['worldwide'] : 
                     r.shippingType === 'domestic' ? ['domestic'] :
                     r.shippingType === 'local' ? ['local'] : [],  // ✅
  order_index: index + 1,  // ✅
  is_active: true,  // ✅
}));
```

---

## 📊 Backings表字段映射

| 代码中 | 数据库中 | 类型 | 说明 |
|--------|----------|------|------|
| `projectId` | `project_id` | UUID | 项目ID |
| `rewardId` | `reward_id` | UUID | 奖励ID |
| `amount` | `amount` | NUMERIC(10,2) | 支持金额 |
| `userId` | `backer_id` | UUID | 支持者ID |
| `stripePaymentIntentId` | `stripe_payment_intent_id` | TEXT | Stripe支付ID |
| `status` | `status` | backing_status | 支持状态 |

---

## ✅ 验证清单

### Projects表
- [x] `goal_amount`（不是funding_goal）
- [x] `current_amount`（不是current_funding）
- [x] `cover_image`（不是image_url）
- [x] 代码支持双字段名（向后兼容）

### Milestones表
- [x] `goal_amount`（不是funding_target）
- [x] `current_amount`（自动为0）
- [x] `order_index`（不是order）
- [x] `deadline_days`（自动计算：30, 45, 60...）⭐

### Rewards表
- [x] `amount`（不是pledge_amount）
- [x] `quantity_total`（不是backer_limit）
- [x] `quantity_claimed`（不是backers_count）
- [x] `estimated_delivery`（DATE格式，不是timestamp）
- [x] `shipping_required`（BOOLEAN，不是shipping_type）
- [x] `shipping_locations`（TEXT[]数组）
- [x] `order_index`（自动递增）
- [x] `is_limited`（根据quantity_total自动设置）

### Backings表
- [x] `backer_id`（不是user_id）
- [x] `amount`（数字类型）
- [x] `stripe_payment_intent_id`（Mock值）

---

## 🎯 测试验证

### 创建项目测试
```bash
# 1. 访问 /create
# 2. 完成4步向导
# 3. 点击"发布项目"
# 4. 检查数据库

# 验证projects表：
SELECT id, title, goal_amount, current_amount, cover_image, status 
FROM projects 
ORDER BY created_at DESC LIMIT 1;

# 验证milestones表（检查deadline_days）：
SELECT id, title, goal_amount, current_amount, order_index, deadline_days
FROM milestones 
WHERE project_id = '[刚创建的项目ID]'
ORDER BY order_index;

# 应该看到：
# Milestone 1: deadline_days = 30
# Milestone 2: deadline_days = 45
# Milestone 3: deadline_days = 60

# 验证rewards表：
SELECT id, title, amount, quantity_total, quantity_claimed, 
       shipping_required, shipping_locations, order_index
FROM rewards 
WHERE project_id = '[刚创建的项目ID]'
ORDER BY order_index;

# 应该看到所有字段正确填充
```

### 支持项目测试
```bash
# 1. 访问项目详情页
# 2. 点击"Back This Project"
# 3. 选择奖励
# 4. 完成支付
# 5. 检查数据库

# 验证backings表：
SELECT id, project_id, backer_id, reward_id, amount, status
FROM backings
ORDER BY created_at DESC LIMIT 1;

# 验证触发器工作：
SELECT current_amount FROM projects WHERE id = '[项目ID]';
# current_amount应该已更新
```

---

## 🔧 如果遇到字段错误

### 错误："column xxx does not exist"

**原因：** 代码使用了错误的字段名

**解决：**
1. 检查本文档找到正确映射
2. 使用数据库字段名
3. 或使用兼容写法：`project.goal_amount || project.funding_goal`

### 错误："null value in column xxx violates not-null constraint"

**可能字段：**
- `milestones.deadline_days` ✅ 已修复（自动计算）
- `milestones.order_index` ✅ 已修复（使用m.order_index）
- `rewards.order_index` ✅ 已修复（自动递增）

---

## 📝 最佳实践

### 查询数据时
```typescript
// 从数据库读取
const { data: project } = await supabase
  .from("projects")
  .select("*")
  .single();

// 使用数据库字段名
const funding = project.goal_amount;  // ✅ 正确
const funding = project.fundingGoal;  // ❌ 不存在

// 或使用兼容写法
const funding = project.goal_amount || project.fundingGoal || 0;  // ✅ 安全
```

### 插入数据时
```typescript
// 使用数据库字段名
await supabase.from("projects").insert({
  goal_amount: 10000,  // ✅ 正确
  current_amount: 0,   // ✅ 正确
  cover_image: url,    // ✅ 正确
});

// 不要使用代码字段名
await supabase.from("projects").insert({
  fundingGoal: 10000,  // ❌ 错误
  currentFunding: 0,   // ❌ 错误
  imageUrl: url,       // ❌ 错误
});
```

---

## ✅ 修复总结

**已修复的字段不一致：**
1. ✅ Projects: `goal_amount`, `current_amount`, `cover_image`
2. ✅ Milestones: `goal_amount`, `current_amount`, `order_index`, `deadline_days`
3. ✅ Rewards: `amount`, `quantity_total`, `quantity_claimed`, `estimated_delivery`, `shipping_required`, `shipping_locations`, `order_index`, `is_limited`

**修复文件：**
- `app/actions/project.ts` - Server Action插入逻辑
- `app/projects/page.tsx` - 项目列表mock数据
- `app/projects/[slug]/page.tsx` - 项目详情mock数据
- `components/project/reward-card.tsx` - 兼容双字段名

**测试状态：**
- ✅ 构建成功
- ✅ 类型检查通过
- ✅ 所有字段正确映射

---

**现在项目代码与数据库schema 100%匹配！** ✅
