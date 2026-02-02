# Skill: Stripe Payment Integration

> **适用场景：** 所有支付相关功能开发
> **核心价值：** 安全、合规的支付流程，正确处理资金托管

## 核心原则

1. **安全优先：** 永远不在客户端处理敏感信息（卡号、CVV等）
2. **Webhook验证：** 所有Webhook必须验证签名
3. **幂等性：** 处理Webhook时确保幂等操作
4. **错误处理：** 友好的错误提示，详细的日志记录

## Stripe配置

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 生产环境使用 pk_live_... 和 sk_live_...
```

### Stripe客户端初始化

```typescript
// /lib/stripe/client.ts (客户端)
import { loadStripe } from '@stripe/stripe-js'

export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// /lib/stripe/server.ts (服务端)
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})
```

## 支付流程

### 标准支付流程

```
1. 前端：用户选择奖励档位
2. 前端：调用API创建PaymentIntent
3. 后端：创建PaymentIntent并返回clientSecret
4. 后端：在数据库创建pending状态的backing记录
5. 前端：使用Stripe Elements收集支付信息
6. 前端：确认支付
7. Stripe：处理支付
8. Webhook：接收payment_intent.succeeded事件
9. 后端：更新backing状态为confirmed
10. 后端：创建escrow_transaction记录
11. 后端：发送确认邮件给用户
```

### 创建PaymentIntent

```typescript
// /app/api/payments/create-intent/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { projectId, rewardId, amount, currency = 'USD' } = await req.json()

    // 验证用户
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 验证项目状态
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, creator_id')
      .eq('id', projectId)
      .single()

    if (projectError || project.status !== 'live') {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
    }

    // 验证金额（如果选择了奖励）
    if (rewardId) {
      const { data: reward } = await supabase
        .from('rewards')
        .select('amount')
        .eq('id', rewardId)
        .single()

      if (reward && amount < reward.amount) {
        return NextResponse.json(
          { error: 'Amount less than reward minimum' },
          { status: 400 }
        )
      }
    }

    // 创建PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // 转换为分
      currency: currency.toLowerCase(),
      metadata: {
        projectId,
        rewardId: rewardId || '',
        backerId: user.id,
        projectTitle: project.title,
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

    if (backingError) {
      // 取消PaymentIntent
      await stripe.paymentIntents.cancel(paymentIntent.id)
      throw backingError
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      backingId: backing.id,
    })
  } catch (error) {
    console.error('Create PaymentIntent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
```

### 前端支付组件

```typescript
// /components/payment/CheckoutForm.tsx
'use client'

import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CheckoutFormProps {
  projectId: string
  rewardId?: string
  amount: number
  onSuccess: () => void
}

export function CheckoutForm({
  projectId,
  rewardId,
  amount,
  onSuccess,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/projects/${projectId}/success`,
        },
      })

      if (error) {
        toast.error('Payment failed', {
          description: error.message,
        })
      } else {
        // 支付成功，redirecting...
        onSuccess()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="rounded-lg bg-muted p-4">
        <div className="flex justify-between text-sm">
          <span>Amount</span>
          <span className="font-semibold">${amount.toFixed(2)}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your payment is secured by Stripe
      </p>
    </form>
  )
}
```

```typescript
// /components/payment/CheckoutWrapper.tsx
'use client'

import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/client'
import { CheckoutForm } from './CheckoutForm'

interface CheckoutWrapperProps {
  clientSecret: string
  projectId: string
  rewardId?: string
  amount: number
}

export function CheckoutWrapper({
  clientSecret,
  projectId,
  rewardId,
  amount,
}: CheckoutWrapperProps) {
  const stripePromise = getStripe()

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0070f3',
          },
        },
      }}
    >
      <CheckoutForm
        projectId={projectId}
        rewardId={rewardId}
        amount={amount}
        onSuccess={() => {
          // Handle success
        }}
      />
    </Elements>
  )
}
```

## Webhook处理

### Webhook端点

```typescript
// /app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

// 使用Service Role Key绕过RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    // 验证Webhook签名
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // 处理事件
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { id, metadata } = paymentIntent

  // 更新Backing状态（幂等操作）
  const { data: backing, error: updateError } = await supabase
    .from('backings')
    .update({
      payment_status: 'succeeded',
      status: 'confirmed',
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', id)
    .eq('payment_status', 'pending') // 确保幂等
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update backing:', updateError)
    throw updateError
  }

  if (!backing) {
    console.log('Backing already processed or not found')
    return
  }

  // 创建Escrow Transaction
  const { error: escrowError } = await supabase
    .from('escrow_transactions')
    .insert({
      project_id: backing.project_id,
      backing_id: backing.id,
      amount: backing.amount,
      currency: backing.currency,
      status: 'held',
    })

  if (escrowError) {
    console.error('Failed to create escrow transaction:', escrowError)
    // 不抛出错误，避免webhook重试
  }

  // 发送确认邮件（通过Edge Function或邮件服务）
  // await sendConfirmationEmail(backing)

  console.log('Payment succeeded:', id)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { id } = paymentIntent

  await supabase
    .from('backings')
    .update({
      payment_status: 'failed',
    })
    .eq('stripe_payment_intent_id', id)
    .eq('payment_status', 'pending')

  console.log('Payment failed:', id)
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string

  // 更新backing状态
  await supabase
    .from('backings')
    .update({
      payment_status: 'refunded',
      status: 'refunded',
    })
    .eq('stripe_payment_intent_id', paymentIntentId)

  // 更新escrow状态
  await supabase
    .from('escrow_transactions')
    .update({
      status: 'refunded',
    })
    .eq('backing_id', (
      await supabase
        .from('backings')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()
    ).data?.id)

  console.log('Charge refunded:', charge.id)
}
```

### 测试Webhook（本地开发）

```bash
# 安装Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 监听Webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 触发测试事件
stripe trigger payment_intent.succeeded
```

## Stripe Connect（创作者收款）

### 创建Connect账户

```typescript
// /app/api/stripe/connect/create-account/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查是否已有Connect账户
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('id', user.id)
      .single()

    if (userData?.stripe_connect_id) {
      return NextResponse.json({
        accountId: userData.stripe_connect_id,
      })
    }

    // 创建Connect账户
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    })

    // 保存Connect ID
    await supabase
      .from('users')
      .update({ stripe_connect_id: account.id })
      .eq('id', user.id)

    // 创建Account Link（Onboarding链接）
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/creator/settings`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/creator/settings?onboarding=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    })
  } catch (error) {
    console.error('Create Connect account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
```

### 释放资金到创作者

```typescript
// Database Function: 释放里程碑资金
CREATE OR REPLACE FUNCTION release_milestone_funds(p_milestone_id UUID)
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
  WHERE m.id = p_milestone_id
  AND m.status = 'verified';

  IF v_creator_stripe_id IS NULL THEN
    RAISE EXCEPTION 'Creator has no Stripe Connect account';
  END IF;

  -- 计算该里程碑的总托管金额
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_amount
  FROM escrow_transactions
  WHERE milestone_id = p_milestone_id
  AND status = 'held';

  -- 更新Escrow状态
  UPDATE escrow_transactions
  SET 
    status = 'released',
    released_at = NOW()
  WHERE milestone_id = p_milestone_id
  AND status = 'held';

  -- 创建待处理转账任务
  INSERT INTO pending_transfers (
    milestone_id,
    stripe_account_id,
    amount,
    currency,
    status
  ) VALUES (
    p_milestone_id,
    v_creator_stripe_id,
    v_total_amount,
    'USD',
    'pending'
  );
END;
$$ LANGUAGE plpgsql;

-- Edge Function: 执行实际转账
// /supabase/functions/process-transfers/index.ts
import Stripe from 'https://esm.sh/stripe@14.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

// 定期任务：处理待转账
async function processTransfers() {
  const { data: transfers } = await supabase
    .from('pending_transfers')
    .select('*')
    .eq('status', 'pending')
    .limit(10)

  for (const transfer of transfers || []) {
    try {
      // 执行Stripe Transfer
      const stripeTransfer = await stripe.transfers.create({
        amount: Math.round(transfer.amount * 100),
        currency: transfer.currency.toLowerCase(),
        destination: transfer.stripe_account_id,
        metadata: {
          milestone_id: transfer.milestone_id,
        },
      })

      // 更新状态
      await supabase
        .from('pending_transfers')
        .update({
          status: 'completed',
          stripe_transfer_id: stripeTransfer.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', transfer.id)

      console.log('Transfer completed:', stripeTransfer.id)
    } catch (error) {
      console.error('Transfer failed:', error)

      await supabase
        .from('pending_transfers')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', transfer.id)
    }
  }
}
```

## 退款处理

```typescript
// /app/api/payments/refund/route.ts
export async function POST(req: Request) {
  try {
    const { backingId, reason } = await req.json()

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取backing信息
    const { data: backing } = await supabase
      .from('backings')
      .select('*, project:projects(creator_id)')
      .eq('id', backingId)
      .single()

    if (!backing) {
      return NextResponse.json({ error: 'Backing not found' }, { status: 404 })
    }

    // 验证权限（管理员或项目创作者）
    const isCreator = backing.project.creator_id === user.id
    const isAdmin = false // TODO: 检查管理员权限

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 执行退款
    const refund = await stripe.refunds.create({
      payment_intent: backing.stripe_payment_intent_id,
      reason: reason || 'requested_by_customer',
    })

    // Webhook会处理backing和escrow状态更新

    return NextResponse.json({ success: true, refund })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
```

## 错误处理

### 常见错误

```typescript
// 支付错误处理
function handleStripeError(error: Stripe.StripeError) {
  switch (error.type) {
    case 'card_error':
      // 卡片问题
      toast.error('Card declined', {
        description: error.message,
      })
      break

    case 'invalid_request_error':
      // 请求参数错误
      console.error('Invalid request:', error)
      toast.error('Payment error', {
        description: 'Please contact support',
      })
      break

    case 'api_error':
      // Stripe API错误
      console.error('Stripe API error:', error)
      toast.error('Payment service error', {
        description: 'Please try again later',
      })
      break

    case 'authentication_error':
      // 认证错误
      console.error('Stripe authentication error:', error)
      toast.error('Configuration error', {
        description: 'Please contact support',
      })
      break

    default:
      toast.error('An unexpected error occurred')
  }
}
```

## 测试

### 测试卡号

```typescript
// Stripe测试卡号
const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  insufficient_funds: '4000 0000 0000 9995',
  expired: '4000 0000 0000 0069',
  incorrect_cvc: '4000 0000 0000 0127',
  processing_error: '4000 0000 0000 0119',
  require_3ds: '4000 0027 6000 3184',
}

// CVV: 任意3位数字
// 日期: 未来任意日期
// ZIP: 任意5位数字
```

## 安全检查清单

- [ ] 永远不在客户端存储Secret Key
- [ ] Webhook必须验证签名
- [ ] 敏感操作使用HTTPS
- [ ] PaymentIntent使用metadata记录业务信息
- [ ] 实现幂等性处理（防止重复扣款）
- [ ] 记录所有支付事件日志
- [ ] 退款前验证权限
- [ ] Connect账户验证完整性
- [ ] 定期审查Stripe Dashboard
- [ ] 生产环境使用Live Key
