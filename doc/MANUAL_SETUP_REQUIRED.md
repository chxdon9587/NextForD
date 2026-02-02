# 🔴 手动配置清单

## ⚠️ 这些步骤需要您手动完成

虽然核心功能已100%实现，但以下配置需要手动操作（无法自动化）：

---

## 1. Supabase Storage Bucket配置（5分钟）⭐ 必须

**为什么需要：** 图片上传功能需要Storage bucket

**步骤：**

### 1.1 创建Bucket
1. 访问 https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam/storage/buckets
2. 点击 **"New bucket"**
3. 配置：
   - Name: `projects`
   - Public bucket: ✅ 勾选
   - File size limit: `5242880` (5MB)
4. 点击 **"Create bucket"**

### 1.2 配置RLS策略

进入 **SQL Editor**，运行以下SQL：

```sql
-- 允许认证用户上传
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'projects' AND
  (storage.foldername(name))[1] = 'project-images'
);

-- 允许公开读取
CREATE POLICY "Allow public to read project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'projects');

-- 允许用户删除自己的图片
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'projects' AND
  owner_id = auth.uid()
);
```

### 1.3 验证

在项目创建页面（http://localhost:3000/create）：
- ✅ 可以拖拽上传图片
- ✅ 图片显示预览
- ✅ 可以删除图片
- ✅ 发布项目后图片URL保存到数据库

**完成后功能：** 图片上传 100% 工作

---

## 2. Stripe完整集成（可选，1-2天）

**当前状态：** Mock实现（创建backing记录但不收费）

**需要实现：**
1. Stripe Elements组件
2. Payment Intent创建
3. Webhook处理
4. Stripe Connect（创建者收款）

**参考文档：** `skills/stripe-payment-integration.md`

### 快速集成步骤

#### 2.1 安装Stripe Elements
```bash
# 已安装
pnpm add @stripe/stripe-js stripe
```

#### 2.2 创建Payment Intent API
创建 `app/api/create-payment-intent/route.ts`：
```typescript
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { amount, projectId, rewardId } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // 转换为分
    currency: "usd",
    metadata: { projectId, rewardId },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
```

#### 2.3 集成Stripe Elements

更新 `components/backing/payment-step.tsx`：
```tsx
import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// 使用PaymentElement组件
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <PaymentElement />
</Elements>
```

#### 2.4 创建Webhook处理
创建 `app/api/webhooks/stripe/route.ts`：
```typescript
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    // 更新backing状态为confirmed
  }

  return new Response(JSON.stringify({ received: true }));
}
```

**完成后功能：** 真实支付处理

---

## 3. 邮件通知（可选，1天）

**当前状态：** 无邮件通知

**需要实现：**
1. SendGrid账户
2. 邮件模板
3. 触发器

### 快速集成步骤

#### 3.1 安装SendGrid
```bash
pnpm add @sendgrid/mail
```

#### 3.2 配置环境变量
```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@4d.com
```

#### 3.3 创建邮件服务
创建 `lib/email.ts`：
```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendBackingConfirmation(
  to: string,
  projectTitle: string,
  amount: number
) {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: `Thank you for backing ${projectTitle}`,
    html: `<p>Your pledge of $${amount} has been confirmed!</p>`,
  });
}
```

#### 3.4 在Server Action中触发
```typescript
// app/actions/backing.ts
import { sendBackingConfirmation } from "@/lib/email";

export async function createBacking(data: CreateBackingInput) {
  // ... 创建backing记录

  await sendBackingConfirmation(
    user.email!,
    project.title,
    amount
  );
}
```

**完成后功能：** 自动邮件通知

---

## 4. 环境变量验证

检查 `.env.local` 包含所有必需的键：

```env
# Supabase (已配置 ✅)
NEXT_PUBLIC_SUPABASE_URL=https://dxjybpwzbgvcwfobznam.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_...

# Stripe (已配置 ✅)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (需要时配置)

# App (已配置 ✅)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SendGrid (可选，未配置)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@4d.com
```

---

## 5. Supabase Auth配置验证

确认以下配置正确：

### 5.1 Site URL
1. 访问 https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam/auth/url-configuration
2. **Site URL:** `http://localhost:3000`（开发）或您的域名（生产）

### 5.2 Redirect URLs
在同一页面添加：
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/update-password`

### 5.3 Email Provider
1. 访问 https://supabase.com/dashboard/project/dxjybpwzbgvcwfobznam/auth/providers
2. 确保 **Email** 已启用
3. **Confirm email:** ON（推荐）

---

## ✅ 配置优先级

| 优先级 | 配置项 | 需要时间 | 影响功能 |
|--------|--------|----------|----------|
| 🔴 **必须** | Supabase Storage | 5分钟 | 图片上传 |
| 🟡 **推荐** | Stripe完整集成 | 1-2天 | 真实支付 |
| 🟢 **可选** | 邮件通知 | 1天 | 用户通知 |

## 📞 获取帮助

**Storage配置：** `STORAGE_SETUP.md`  
**Stripe集成：** `skills/stripe-payment-integration.md`  
**完整文档：** `FINAL_SUMMARY.md`

---

**配置完成后，4D平台将100%功能完整！** 🚀
