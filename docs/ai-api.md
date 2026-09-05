# AI API

ZTools 通过 `window.ztools` 提供 AI 模型调用能力。本文档只介绍 AI 相关接口；插件的其他能力请参考 [插件 API](./plugin-api.md)。

当前公开的 AI 接口包括：

- `ztools.ai`：调用模型并由 ZTools 自动执行已注册的工具调用循环。
- `ztools.aiChat`：发起单轮流式请求，由插件自行处理工具调用循环。
- `ztools.allAiModels`：获取当前可用的模型列表。

## `ztools.ai`

### `ztools.ai(option, streamCallback)`

调用 AI 模型。省略 `streamCallback` 时为非流式调用；传入回调时为流式调用。返回的 Promise 同时提供 `abort()` 方法。

`ztools.ai` 会自动处理模型返回的 Function Calling 工具调用：模型请求工具时，ZTools 在插件上下文中查找并执行对应的 `window.exports` 方法，再将结果提交给模型继续请求。工具循环最多执行 25 轮。

- **option**: `object` - AI 调用配置，必须包含非空的 `messages` 数组。
  - `model`: `string` - (可选) `allAiModels()` 返回的 `value` 或兼容旧版本的 `id`。省略时使用首个可用模型。
  - `messages`: `AiMessage[]` - 消息数组。
  - `tools`: `AiTool[]` - (可选) OpenAI Function Calling 格式的工具定义。
- **streamCallback**: `(chunk: AiStreamChunk) => void` - (可选) 流式回调。
- **返回**: `PromiseLike & { abort: () => void }` - 可等待且可中止的请求。
  - 非流式调用：Promise resolve 为完整的助手消息。
  - 流式调用：每次回调接收一个助手消息片段，Promise 完成时表示流结束。
- **异常**: 请求失败时 Promise reject，并携带错误信息。

```javascript
// 非流式调用
const result = await ztools.ai({
  messages: [{ role: "user", content: "你好" }]
});
console.log(result.content);

// 流式调用
const request = ztools.ai(
  {
    messages: [{ role: "user", content: "写一段说明文字" }]
  },
  (chunk) => {
    if (chunk.content) appendText(chunk.content);
    if (chunk.reasoning_content) appendReasoning(chunk.reasoning_content);
  }
);

await request;

// 中断请求
request.abort();
```

## `ztools.aiChat`

### `ztools.aiChat(option, eventCallback)`

发起一次单轮流式 Chat Completions 请求。ZTools 负责解析模型、保护供应商凭据、适配不同供应商协议并传输流，但不会确认、执行或回填模型返回的工具调用。需要工具调用循环时，插件应读取 `tool_call` 事件，自行确认和执行工具，再把助手消息及工具结果追加到下一轮 `messages`。

- **option**: `AiChatOption` - 单轮请求配置。
  - `model`: `string` - (可选) `allAiModels()` 返回的 `value` 或兼容旧版本的 `id`。省略时使用首个可用模型。
  - `messages`: `AiMessage[]` - 必填且不能为空。支持 `system`、`user`、`assistant`、`tool` 角色。
  - `tools`: `AiTool[]` - (可选) Function Calling 工具定义。
  - `toolChoice`: `'auto' | 'none' | 'required'` - (可选) 工具选择策略。
  - `reasoningEffort`: `'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'` - (可选) 当前模型支持的推理档位。
  - `reasoning`: `{ effort?: string }` - (可选、兼容字段) 推荐使用 `reasoningEffort`。
  - `temperature`: `number` - (可选) 采样温度。
  - `maxTokens`: `number` - (可选) 最大输出 token 数。
  - `timeout`: `number` - (可选) 请求超时时间，单位为毫秒，默认约 120 秒，范围会被限制在 5 秒到 5 分钟之间。
  - `streamBatchIntervalMs`: `number` - (可选) 合并连续流事件的时间窗口，单位为毫秒，范围为 `0` 到 `1000`。省略或传 `0` 时逐事件回调。
- **eventCallback**: `(event: AiChatEvent) => void` - 流式事件回调。
- **返回**: `Promise<AiChatResult> & { abort: () => void }` - 单轮完整助手响应和中断方法。
- **异常**: 请求失败时 Promise reject，错误对象包含稳定的 `code`，并可能包含 `status`、`providerCode`、`requestId`、`retryAfterMs` 等字段。

### 流式事件

`eventCallback` 接收以下事件：

| `event.type` | 字段 | 说明 |
| --- | --- | --- |
| `request` | `requestId` | 请求已创建，可用于关联日志或状态 |
| `reasoning` | `delta` | 一段增量推理内容 |
| `reasoning_end` | 无 | 当前推理内容结束，正文或工具事件即将开始 |
| `content` | `delta` | 一段增量正文 |
| `tool_call` | `index`、`id`、`name`、`argumentsDelta` | 一段增量工具调用信息 |
| `usage` | `usage` | Token 用量信息 |

`streamBatchIntervalMs` 只影响连续事件的合并，不会跨越推理结束、工具调用边界或请求结束边界。

### 完整响应

```javascript
{
  role: "assistant",
  content: "最终回答",
  reasoning_content: "模型推理内容或 null",
  tool_calls: [],
  finish_reason: "stop",
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  },
  replay_state: {}
}
```

当模型返回工具调用时，`tool_calls` 中每项的 `function.arguments` 是 JSON 字符串。若下一轮继续请求，建议将宿主返回的 `replay_state` 原样保留在对应的 assistant message 中。

### 工具调用循环示例

```javascript
const messages = [
  { role: "user", content: "查询天气" }
];

const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "查询城市天气",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" }
        },
        required: ["city"]
      }
    }
  }
];

const request = ztools.aiChat(
  { messages, tools },
  (event) => {
    if (event.type === "content") appendText(event.delta);
  }
);

const assistant = await request;
if (assistant.tool_calls.length > 0) {
  const call = assistant.tool_calls[0];
  const input = JSON.parse(call.function.arguments);
  const output = await getWeather(input.city);

  messages.push({ ...assistant });
  messages.push({
    role: "tool",
    tool_call_id: call.id,
    content: JSON.stringify(output)
  });
  // 将 messages 作为下一次 aiChat 的输入，继续处理模型响应。
}
```

## `ztools.allAiModels`

### `ztools.allAiModels()`

获取当前用户可用的 AI 模型列表。返回的数据不包含供应商 API Key 或 API URL。

- **返回**: `Promise<AiModel[]>` - 可用模型数组。
- **异常**: 获取失败时 Promise reject。

每个模型通常包含以下字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 兼容旧插件的可读模型 ID |
| `value` | 新插件应优先回传的稳定模型选择 ID |
| `label` | 适合展示的模型名称 |
| `providerId` | Provider ID |
| `providerLabel` | Provider 展示名称 |
| `modelId` | 供应商接口使用的远端模型 ID |
| `description` | 模型描述 |
| `icon` | 模型图标 |
| `cost` | 成本标识 |
| `contextWindow` | 上下文窗口大小 |
| `inputModalities` | 支持的输入模态，例如 `text`、`image` |
| `reasoning` | 模型支持的推理档位和默认档位 |

```javascript
try {
  const models = await ztools.allAiModels();
  for (const model of models) {
    console.log(model.label, model.value || model.id);
  }
} catch (error) {
  console.error("获取 AI 模型失败", error);
}
```

## 类型说明

### `AiMessage`

```typescript
type AiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | Array<TextContentPart | ImageContentPart>;
  reasoning_content?: string;
  tool_calls?: AiToolCall[];
  tool_call_id?: string;
  name?: string;
  replay_state?: AiChatReplayState;
};
```

多模态消息的内容块：

```javascript
{
  role: "user",
  content: [
    { type: "text", text: "描述这张图片" },
    {
      type: "image_url",
      image_url: { url: "data:image/png;base64,...", detail: "auto" }
    }
  ]
}
```

### `AiTool` 和 `AiToolCall`

```typescript
type AiTool = {
  type: "function";
  function?: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

type AiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};
```

### Token 用量

`usage` 通常包含：`prompt_tokens`、`completion_tokens`、`total_tokens`，部分供应商还会返回 `cache_read_tokens`、`cache_write_tokens`、`reasoning_tokens`。
