# 开发者服务端 API

开发者可以在 **ZTools 开发者工具 → 赞赏服务 → 服务端 API** 中创建长期服务端 Token，让自己的服务器查询 ZTools 用户和插件订单。

服务端 API 仅对已通过赞赏服务个人或企业认证的开发者开放。认证状态被撤回、拒绝或账号被禁用后，已有 Token 也会立即失效。

生产环境 API 地址为 `https://z.zosen.link`。以下路径均为相对路径；

## 认证方式

服务端 Token 只绑定开发者账号，不绑定某一个插件。一个 Token 可以访问该开发者名下的多个插件；订单查询仍必须传入插件名，Server 会校验该插件归属。

```http
Authorization: Bearer zts_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Token 明文只在创建或轮换时显示一次。请保存到开发者自己的服务器环境变量中，不要写入前端代码、插件包、日志或 Git 仓库。

目前支持两个权限：

| 权限 | 用途 |
| --- | --- |
| `user:read` | 使用临时用户 Token 查询用户公开资料 |
| `payment:read` | 查询当前开发者插件的业务订单状态 |

## 查询用户公开资料

```http
POST /api/developer/v1/user/profile
Authorization: Bearer <服务端 Token>
Content-Type: application/json
```

请求体中的 `temporaryUserToken` 由 ZTools 宿主通过 `ztools.getUserTempToken()` 返回，通常只有几分钟有效期。它包含当前登录用户和发起请求的插件身份，Server 会校验该插件属于服务端 Token 对应的开发者。

```json
{
  "temporaryUserToken": "eyJ..."
}
```

成功响应只包含以下字段：

```json
{
  "uid": "gh_lzx8589561",
  "nickname": "ZTools 用户",
  "avatarUrl": "https://example.com/avatar.png"
}
```

不会返回 `username` 或其他账户敏感字段。

## 查询插件支付状态

```http
GET /api/developer/v1/plugins/{pluginName}/payments/{orderNo}
Authorization: Bearer <服务端 Token>
```

`pluginName` 和 `orderNo` 需要进行 URL 编码。查询范围由 Server 根据 Token 的开发者 UID 校验，不能读取其他开发者的插件订单。

```json
{
  "orderId": "PLabc123",
  "pluginName": "video-downloader",
  "orderNo": "pro-m6x-001",
  "productId": "PRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "productName": "专业版",
  "buyerUid": "gh_buyer",
  "amountCents": 500,
  "currency": "CNY",
  "status": "paid",
  "ext": {
    "plan": "pro"
  },
  "createdAt": 1778500000000,
  "expiresAt": 1778586400000,
  "paidAt": 1778500123456
}
```

订单状态包括：

| 状态 | 含义 |
| --- | --- |
| `pending` | 等待支付 |
| `paid` | Server 已确认支付成功，可以按 `orderId` 或 `orderNo` 幂等发放权益 |
| `expired` | 待支付订单已过期 |
| `abnormal` | 订单无法继续处理 |

订单查询返回 `paid` 只表示支付已经确认，不要求钱包结算完成。`ext` 是创建订单时插件传入的扩展数据；不要在其中放 Token、密码或其他敏感信息。

## 支付成功回调

开发者工具可以为开发者账号配置一套回调 URL 和签名密钥。开发者名下所有插件共用这套配置，回调正文中的 `pluginName` 用于区分来源插件。订单首次确认支付时，Server 将事件写入队列并异步投递；网络失败会自动重试，收到任意 `2xx` 响应才视为送达。

回调配置在开发者工具的 **赞赏服务 → 服务端 API** 中管理，不需要在每个插件里重复配置。启用回调时，Server 还会为该开发者历史上已经支付的订单补建通知事件。

### 投递次数和重试规则

- Server 的回调 worker 每 **10 秒**扫描一次待投递队列。
- 每条回调最多自动调用 **8 次**，`X-ZTools-Delivery-Attempt` 从 `1` 到 `8`。
- 第 1 次会在事件进入队列后尽快投递；失败后按指数退避重试：`30 秒、60 秒、2 分钟、4 分钟、8 分钟、16 分钟、32 分钟`。因此从第 1 次到第 8 次通常约需 63.5 分钟，另加队列扫描延迟。
- 单次 HTTP 请求超时时间为 **10 秒**。网络错误、连接超时、读取超时都会消耗一次尝试次数。
- 第 8 次仍失败后，事件变为最终的 `failed` 状态，不会继续自动调用。

以下情况算作调用成功：

```text
HTTP 状态码为 200–299
```

不要求响应正文内容。`3xx`、`4xx`、`5xx`，以及 DNS、连接、TLS、超时等错误都算失败。Server 不跟随重定向，因此回调地址应直接指向最终的 `POST` 接口。

开发者工具中的“重试”会将失败事件重新排队，并将自动尝试次数重置为 `0`，随后从第 1 次重新计算；正在投递的事件不能重复点击重试，已经 `delivered` 的事件也不能再次重试。由于请求可能在开发者服务器已经处理成功后才发生网络中断，同一个事件可能被重复投递，开发者服务器必须使用 `eventId` 或 `orderId` 幂等处理。

回调请求示例：

```http
POST https://example.com/api/ztools/payment-callback
Content-Type: application/json
X-ZTools-Event-Id: EVPLabc123
X-ZTools-Timestamp: 1778500123
X-ZTools-Signature: sha256=<HMAC-SHA256>
X-ZTools-Delivery-Attempt: 1
```

每一次重试都会生成新的 `X-ZTools-Timestamp` 和对应签名；请按当前请求的原始正文重新校验，不要复用上一次请求的签名。

签名原文为：

```text
<timestamp>.<request-body-原始字节>
```

使用开发者工具创建或轮换时显示的回调签名密钥，以 HMAC-SHA256 计算并与 `X-ZTools-Signature` 中 `sha256=` 后的值进行常量时间比较。校验通过后，应使用 `eventId` 或 `orderId` 做幂等处理。

回调正文的主要字段：

```json
{
  "eventId": "EVPLabc123",
  "eventType": "plugin.payment.succeeded",
  "createdAt": 1778500123456,
  "pluginName": "video-downloader",
  "orderId": "PLabc123",
  "orderNo": "pro-m6x-001",
  "status": "paid",
  "productId": "PRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "productName": "专业版",
  "amountCents": 500,
  "currency": "CNY",
  "buyerUid": "gh_buyer",
  "ext": { "plan": "pro" },
  "paidAt": 1778500123456
}
```

关闭支付窗口、插件退出或网络中断不会取消 Server 订单。开发者服务器应使用 `eventId` 或 `orderId` 幂等处理回调，并在必要时通过插件支付记录接口补偿查询，不能只依赖回调到达。

## 错误状态

| HTTP 状态 | 含义 |
| --- | --- |
| `400` | 参数格式不正确 |
| `401` | 服务端 Token 或临时用户 Token 无效、过期或已撤销 |
| `403` | Token 权限不足，或目标插件不属于当前开发者 |
| `404` | 订单不存在 |

## 服务端接入示例

下面示例使用 Node.js 原生 `fetch`，服务端 Token 只应保存在服务端环境变量中：

```js
const API_BASE = process.env.ZTOOLS_SERVER_URL || 'https://z.zosen.link'
const TOKEN = process.env.ZTOOLS_DEVELOPER_TOKEN

async function getPayment(pluginName, orderNo) {
  const url = `${API_BASE}/api/developer/v1/plugins/${encodeURIComponent(pluginName)}/payments/${encodeURIComponent(orderNo)}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!response.ok) throw new Error(`ZTools API ${response.status}`)
  return response.json()
}
```

回调接口收到请求后，应先读取原始请求体，再按“签名校验”一节验证签名，确认 `eventId` 未处理后返回 `2xx`。不要根据客户端传入的金额自行发放权益，应以订单查询结果和回调中的服务端字段为准。
