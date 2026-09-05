# Provider 开发指南

ZTools 将翻译和 OCR 能力抽象为 Provider。插件可以提供自己的 Provider，也可以调用用户已经启用的其他 Provider。

AI 模型不属于 Provider，AI 能力请参考 [AI API](./ai-api.md) 和 [AI 插件开发指南](./ai-plugin-guide.md)。

## 支持的类型

| `type` | 用途 | 输入 | 输出 |
| --- | --- | --- | --- |
| `translation` | 文本翻译 | `{ text, from?, to? }` | `{ text, detectedFrom? }` |
| `ocr` | 图片文字识别 | `{ image, lang? }` | `{ text, blocks?, confidence? }` |

`ocr.image` 可以是本地路径、Data URI 或 URL，具体能力取决于 Provider 的实现。

## 声明 Provider

在 `plugin.json` 中添加 `providers`。对象 key 是插件内唯一的声明 key，不必等于 `type`。

```json
{
  "name": "cloud-services",
  "title": "云服务",
  "providers": {
    "baidu": {
      "type": "translation",
      "label": "百度翻译",
      "description": "百度翻译服务"
    },
    "cloud_ocr": {
      "type": "ocr",
      "label": "云 OCR"
    }
  }
}
```

字段说明：

- `type`: 必填，只能是 `translation` 或 `ocr`。
- `label`: 可选，设置页展示名称；省略时使用插件名称。
- `description`: 可选，设置页展示说明。

同一个插件可以为同一种 `type` 声明多个 key，例如 `baidu` 和 `google` 都声明为 `translation`。

## 注册处理器

在插件的 preload 脚本中注册处理器。首个参数必须是 `plugin.json.providers` 中的声明 key。

```javascript
ztools.registerProvider("baidu", async ({ text, from, to }) => {
  const response = await fetch("https://example.com/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from, to })
  });
  const data = await response.json();

  return {
    text: data.translated,
    detectedFrom: data.detectedSource
  };
});

ztools.registerProvider("cloud_ocr", async ({ image, lang }) => {
  const response = await fetch("https://example.com/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, lang })
  });
  const data = await response.json();

  return {
    text: data.text,
    blocks: data.blocks,
    confidence: data.confidence
  };
});
```

注册失败时会抛出 Error，常见原因包括：

- key 没有在 `plugin.json.providers` 中声明。
- key 为空。
- handler 不是函数。

每个声明 key 只能对应一个处理器。处理器应返回符合声明类型的 Promise 结果。

## 消费 Provider

任何插件都可以消费已经启用的 Provider，不要求自身声明 Provider。

### 查询 Provider

```javascript
const providers = await ztools.providers.getProviders("translation");
// [{ id, type, label, description, source, isDefault }, ...]

const defaultProvider = await ztools.providers.getDefaultProvider("translation");
// 没有可用 Provider 时为 null
```

`getProviders()` 不传 `type` 时返回所有类型的 Provider。

### 指定 Provider 调用

```javascript
const result = await ztools.providers.invokeProvider(
  "translation",
  { text: "hello", to: "zh" },
  "plugin:cloud-services:baidu"
);
```

省略第三个参数时，ZTools 使用该类型的默认 Provider。调用失败会抛出 Error，插件应使用 `try/catch` 处理。

### 便捷方法

```javascript
const translation = await ztools.translate("hello", {
  from: "en",
  to: "zh"
});

const ocr = await ztools.ocr("/path/to/image.png", {
  lang: "eng"
});
```

便捷方法的 `providerId` 也可以显式指定：

```javascript
const result = await ztools.translate("hello", {
  providerId: "plugin:cloud-services:baidu",
  to: "zh"
});
```

## Provider 选择规则

未指定 `providerId` 时，ZTools 按以下顺序选择：

1. 用户在设置页指定的默认 Provider。
2. 该类型下第一个启用的 Provider。
3. 该类型下第一个可用的 Provider。

没有可用 Provider 时，调用会失败并抛出 Error。

Provider 的启用状态、默认项和参数由用户在设置页管理，插件不应直接修改这些设置。
