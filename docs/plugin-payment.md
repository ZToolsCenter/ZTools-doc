# 插件赞赏支付 API

ZTools 为已开通赞赏服务的闭源插件提供支付能力。插件只需要传入商品 ID 和自己的业务订单号，ZTools 会完成用户身份验证、订单创建、支付确认窗口、爱发电收银台打开以及支付状态检查。

本页介绍两个插件 API：

- `ztools.requestPayment()`：创建赞赏订单并打开支付窗口。
- `ztools.getPaymentRecords()`：查询当前用户在当前插件中的赞赏记录。

## 使用前准备

开发者需要先在 **ZTools 开发者工具 → 赞赏服务** 中完成以下配置：

1. 提交个人或企业认证并通过审核。
2. 选择自己已经审核上架的闭源插件，开启赞赏服务。
3. 创建商品并设置价格。
4. 复制以 `PR` 开头的商品 ID，填写到插件代码中。

商品名称、价格、收款开发者和插件归属均由 ZTools Server 保存。插件不能在调用支付 API 时临时修改价格，也不需要接触爱发电 Token 或用户登录凭据。

::: warning 适用范围
目前赞赏服务只支持归属当前开发者、已经审核上架的闭源插件。支付渠道固定为爱发电，不提供退款、订阅扣款或自动发货 API。
:::

## 快速接入

```javascript
const PRODUCT_ID = 'PRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

function createOrderNo() {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  return `support-${Date.now().toString(36)}-${random}`
}

async function openSponsorPayment() {
  try {
    const order = await window.ztools.requestPayment(
      {
        productId: PRODUCT_ID,
        orderNo: createOrderNo(),
        ext: {
          scene: 'plugin-sponsorship'
        }
      },
      (paidOrder) => {
        // 只有 ZTools Server 确认支付成功后才会进入这里。
        console.log('支付成功', paidOrder.orderId)
        showSponsorSuccess(paidOrder)
      }
    )

    // 这里只表示订单已经创建或找到，不代表用户已经付款。
    console.log('订单已创建', order.orderId, order.status)
  } catch (error) {
    console.error('发起赞赏失败', error)
  }
}
```

::: danger 不要把 Promise resolve 当成支付成功
`requestPayment()` 返回的 Promise 在订单创建完成后就会 resolve。新订单通常返回 `pending`，真正支付成功应以成功回调中的订单为准；插件重新进入或回调未送达时，应通过 `getPaymentRecords()` 恢复状态。
:::

## `ztools.requestPayment()`

### 方法签名

```typescript
ztools.requestPayment(
  options: {
    productId: string
    orderNo: string
    ext?: Record<string, unknown>
  },
  callback: (order: PaymentRecord) => void
): Promise<PaymentRecord>
```

### `options` 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `productId` | `string` | 是 | 开发者工具中创建商品后生成的商品 ID，最长 64 个字符。 |
| `orderNo` | `string` | 是 | 插件生成的业务订单号，当前插件内必须唯一，最长 64 个字符。 |
| `ext` | `object` | 否 | 插件业务扩展数据，最大 4KB，查询记录时会原样返回。 |

`ext` 适合保存功能标识、套餐标识或插件内部关联信息，不要放入 Token、密码、Cookie、银行卡或其他敏感信息。

### `callback` 参数

成功回调只会在 ZTools Server 确认订单已经支付后触发：

```javascript
const createdOrder = await window.ztools.requestPayment(options, async (paidOrder) => {
  // 发放权益必须按 orderId 或 orderNo 做幂等处理。
  await enableFeatureOnce(paidOrder.orderId)
})
```

支付窗口关闭、插件退出、账号切换、网络中断或本地监听超时，都可能导致本次回调无法送达。用户已经付款并不保证插件页面一定保持打开，因此不能只依赖回调保存业务状态。

插件应当把 `orderId` 或 `orderNo` 作为发放权益的幂等键。同一笔已支付订单即使通过回调和历史记录被处理多次，也只能发放一次权益。

### 返回值

Promise 返回创建或复用的订单对象。返回值中不会包含爱发电收银台地址。

```typescript
interface PaymentRecord {
  orderId: string
  orderNo: string
  productId: string
  productName: string
  pluginName: string
  pluginTitle: string
  merchantName: string
  amountCents: number
  currency: 'CNY'
  status: 'pending' | 'paid' | 'expired' | 'abnormal'
  ext?: Record<string, unknown>
  createdAt: number
  expiresAt: number
  paidAt?: number
}
```

| 字段 | 说明 |
| --- | --- |
| `orderId` | ZTools Server 生成的平台订单号。 |
| `orderNo` | 插件传入的业务订单号。 |
| `productId` / `productName` | 商品 ID 和服务端保存的商品名称。 |
| `pluginName` / `pluginTitle` | 发起支付的真实插件身份。 |
| `merchantName` | 用户确认付款时看到的收款开发者名称。 |
| `amountCents` | 商品金额，单位为人民币分，例如 `500` 表示 ¥5.00。 |
| `currency` | 当前固定为 `CNY`。 |
| `status` | 当前订单状态。 |
| `ext` | 创建订单时传入的扩展数据。 |
| `createdAt` / `expiresAt` | 毫秒级时间戳。 |
| `paidAt` | 支付成功时间，未支付订单可能不存在或为 `0`。 |

### 订单状态

| 状态 | 说明 | 插件建议 |
| --- | --- | --- |
| `pending` | 等待用户完成支付。 | 不发放权益，等待成功回调或稍后查询。 |
| `paid` | 服务端已经确认并入账。 | 按订单号幂等发放权益。 |
| `expired` | 订单已经过期。 | 使用新的 `orderNo` 创建新订单。 |
| `abnormal` | 订单状态异常或无法继续处理。 | 提示用户查询记录或重新创建订单。 |

### 业务订单号与幂等

同一插件内的 `orderNo` 必须唯一。相同订单号的重试必须保持以下内容完全一致：

- 当前登录用户
- `productId`
- `ext`

如果复用同一个 `orderNo`，但商品或扩展数据发生变化，服务端会拒绝请求。已经过期或异常的订单也不能换参数后继续使用原订单号，应生成新的业务订单号。

推荐的订单号应具有业务前缀、时间和随机部分，同时保持在 64 个字符以内：

```javascript
function createOrderNo() {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  return `pro-${Date.now().toString(36)}-${random}`
}
```

### 宿主处理流程

调用 `requestPayment()` 后，ZTools 会：

1. 根据真实插件视图确定插件身份，不接受插件自行传入用户 ID 或插件 ID。
2. 验证用户已经登录 ZTools。
3. 从 Server 获取商品名称、金额和收款开发者。
4. 向用户显示可信的付款确认信息。
5. 打开独立的爱发电支付窗口，并复用之前的爱发电登录状态。
6. 每 3 秒向 Server 查询一次订单状态，最长持续约 30 分钟。
7. 确认支付成功后关闭支付窗口，并调用插件传入的成功回调。

关闭支付窗口不等于取消服务端订单。插件退出或账号变化后，ZTools 会停止本地状态监听，但订单仍可能在渠道侧完成支付。

## `ztools.getPaymentRecords()`

### 方法签名

```typescript
ztools.getPaymentRecords(query?: {
  productId?: string
  orderNo?: string
  status?: 'pending' | 'paid' | 'expired' | 'abnormal'
  cursor?: string
  limit?: number
}): Promise<{
  items: PaymentRecord[]
  nextCursor: string
  hasMore: boolean
}>
```

### 查询参数

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `productId` | `string` | 只查询指定商品。 |
| `orderNo` | `string` | 精确查询指定业务订单号。 |
| `status` | `string` | 按订单状态筛选。 |
| `cursor` | `string` | 上一页返回的不透明游标，继续查询时原样传回。 |
| `limit` | `number` | 每页数量，最大为 50；省略或无效时按 20 条处理。 |

记录范围始终限定为 **当前登录用户 + 当前插件**。插件不能通过查询参数读取其他用户或其他插件的订单。

### 查询已支付记录

```javascript
const result = await window.ztools.getPaymentRecords({
  productId: 'PRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  status: 'paid',
  limit: 20
})

for (const order of result.items) {
  console.log(order.orderNo, order.amountCents, order.paidAt)
}
```

### 分页加载

```javascript
async function loadAllPaidOrders(productId) {
  const orders = []
  let cursor = ''

  do {
    const page = await window.ztools.getPaymentRecords({
      productId,
      status: 'paid',
      cursor: cursor || undefined,
      limit: 50
    })

    orders.push(...page.items)
    cursor = page.hasMore ? page.nextCursor : ''
  } while (cursor)

  return orders
}
```

`nextCursor` 是服务端生成的不透明值，不要解析、修改或持久依赖其内部格式。

## 恢复未送达的支付结果

推荐在插件每次进入时查询已支付记录，并与本地已经处理的订单集合进行对账：

```javascript
const PRODUCT_ID = 'PRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const STORAGE_KEY = 'processed-sponsor-orders'

async function restorePaidOrders() {
  const processed = new Set(
    window.ztools.dbStorage.getItem(STORAGE_KEY) || []
  )

  const result = await window.ztools.getPaymentRecords({
    productId: PRODUCT_ID,
    status: 'paid',
    limit: 50
  })

  for (const order of result.items) {
    if (processed.has(order.orderId)) continue

    await enableFeature(order)
    processed.add(order.orderId)
  }

  window.ztools.dbStorage.setItem(STORAGE_KEY, [...processed])
}

window.ztools.onPluginEnter(() => {
  restorePaidOrders().catch(console.error)
})
```

如果支付权益长期有效或记录超过一页，插件应继续使用 `nextCursor` 获取后续页面，或在自己的数据库中保存业务订单与权益状态。

## 错误处理

`requestPayment()` 和 `getPaymentRecords()` 都可能 reject。常见情况包括：

| 场景 | 处理建议 |
| --- | --- |
| 用户未登录 ZTools | 提示用户先登录账号。 |
| 赞赏服务或商品未启用 | 检查开发者工具中的服务和商品状态。 |
| 插件尚未审核上架 | 完成闭源插件审核后再开启赞赏服务。 |
| 同一窗口正在创建订单 | 禁用按钮并等待前一次调用完成，避免重复点击。 |
| 业务订单号与原载荷冲突 | 复用完全相同的参数，或创建新的业务订单号。 |
| 订单已经过期或异常 | 查询历史记录，并使用新的订单号重新发起。 |
| 网络短暂中断 | 保留业务订单号，使用相同参数重试或稍后查询记录。 |
| 插件退出或账号发生变化 | 重新进入插件后调用记录接口恢复状态。 |

```javascript
try {
  await window.ztools.requestPayment(options, handlePaidOrder)
} catch (error) {
  const message = error instanceof Error ? error.message : '支付请求失败'
  showError(message)
}
```

## 安全建议

- 不要在插件中保存爱发电 Token、ZTools 临时 Token 或用户登录凭据。
- 不要让插件页面自行决定或展示一个与服务端商品不一致的付款金额。
- 不要通过“支付窗口已关闭”等本地事件判断付款成功。
- 只有成功回调或 `getPaymentRecords()` 返回的 `paid` 状态可以作为支付成功依据。
- 发放权益时必须按 `orderId` 或 `orderNo` 做幂等处理。
- `ext` 不要存放密码、Cookie、密钥或其他敏感信息。

