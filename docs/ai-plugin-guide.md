---
downloadMarkdown: true
---

# ZTools AI 插件开发指南

本文档面向 AI 编程助手，用于在接到“开发一个 ZTools 插件”的需求后，快速做出正确技术判断并产出可运行、可构建、可发布的插件项目。

ZTools 插件的核心模型是：**Web 前端页面 + Node.js 本地能力 + ZTools 平台 API**。

- 前端页面负责 UI 和交互，可使用原生 HTML/CSS/JS、Vue、React 等技术。
- `preload.js` 负责暴露本地能力，可使用 Node.js 16.x 原生模块、Electron 渲染进程 API 和可读的第三方 CommonJS 模块。
- `plugin.json` 负责声明插件元信息、入口、Logo、功能和触发指令。
- `window.ztools` 是插件调用 ZTools 能力的全局 API。

本页按插件开发顺序组织，并完整包含配置规范、公开插件 API、AI API 和 Provider 契约，可以单独作为交给 AI 的开发上下文。

## 给 AI 的执行规则

当 AI 生成或修改 ZTools 插件时，必须遵守以下规则：

1. 先明确插件形态：有 UI 插件、纯 preload 插件、文件处理插件、图片处理插件、主搜索增强插件、AI 能力插件。
2. 先写 `plugin.json`，再实现 `preload.js` 和前端入口。
3. 使用框架时只把构建产物作为插件应用，通常是 `dist/`，不要把源码项目根目录当成最终插件目录。
4. 前端依赖可以被 Vite/Webpack 等工具打包；Node.js 依赖必须与 `preload.js` 同级并保持源码可读。
5. `preload.js` 不允许压缩、混淆或打包成不可读代码。
6. 涉及文件系统、命令执行、网络请求、剪贴板和系统窗口时，优先在 `preload.js` 封装最小 API，再暴露给前端。
7. 使用 `window.ztools` 时要考虑异步返回值、平台差异和插件生命周期。
8. 生成代码时默认兼容 Windows、macOS、Linux；确有平台限制时在 `plugin.json` 顶层 `platform` 中声明。
9. 所有用户输入、文件路径、网络结果都要做基本校验和错误处理。
10. 发布前必须能通过构建，并确认 `dist/` 中包含 `plugin.json`、`main` 指向的页面、`logo` 和 `preload` 指向的文件。
11. 有 `main` 页面入口的 UI 插件不要使用 `window.exports` + `mode: "none"`；该模式只用于无界面或纯 preload 命令插件。UI 插件应通过 `ztools.onPluginEnter` 接收入口参数。

## 插件开发决策树

收到用户需求后，AI 应按下面顺序判断：

| 需求特征 | 推荐方案 |
| --- | --- |
| 需要表单、列表、设置页、结果展示 | Vue/React/Vite 或原生 Web UI |
| 只需要后台处理、复制、通知、快速响应 | Preload Only |
| 需要读写文件、调用系统命令、访问本地程序 | 在 `preload.js` 使用 Node.js API |
| 需要处理用户粘贴的图片 | 使用 `img` 指令 |
| 需要处理用户粘贴的文件或文件夹 | 使用 `files` 指令 |
| 需要匹配特定输入格式 | 使用 `regex` 指令 |
| 需要处理任意搜索框输入 | 使用 `over` 指令 |
| 需要在主搜索结果中直接显示候选项 | 使用 `ztools.onMainPush` |
| 需要保存插件数据 | 简单键值用 `ztools.dbStorage`，结构化数据用 `ztools.db` |
| 需要调用 AI 模型 | 使用 `ztools.ai` 和 `ztools.allAiModels` |

## 标准开发流程

### 1. 创建项目

推荐使用官方 CLI：

```bash
npm install -g @ztools-center/plugin-cli
ztools create my-plugin
cd my-plugin
npm install
```

CLI 会引导选择模板：

- `Vue + TypeScript + Vite`：适合复杂 UI。
- `React + TypeScript + Vite`：适合复杂 UI。
- `Preload Only (TypeScript)`：适合无 UI 或轻量自动化能力。

### 2. 开发运行

```bash
npm run dev
```

开发模式下，通常在 `plugin.json` 中配置：

```json
{
  "main": "index.html",
  "development": {
    "main": "http://localhost:5173"
  }
}
```

ZTools 开发模式会使用 `development.main` 覆盖基础 `main`。

### 3. 构建插件

```bash
npm run build
```

构建后通常输出到 `dist/`。最终提交给 ZTools 的插件应用应是构建产物目录，而不是带有源码、构建缓存和开发依赖的项目根目录。

### 4. 发布插件

发布前要求：

- 项目根目录存在 `plugin.json`。
- 已初始化 Git 仓库。
- 至少有一次 commit。

```bash
git init
git add .
git commit -m "Initial commit"
ztools publish
```

`ztools publish` 会进行 GitHub OAuth 认证、Fork 插件中心仓库、创建 `plugin/{插件名称}` 分支、重放 commit、推送并创建 Pull Request。

## 插件目录结构

最小插件必须包含：

- `plugin.json`
- `logo` 指向的 png 或 jpg 文件
- `main` 或 `preload` 字段中的至少一个实际入口

典型构建产物：

```text
my-plugin-dist/
├── plugin.json
├── preload.js
├── index.html
├── index.js
├── index.css
└── logo.png
```

使用 Vite 和框架时，源码项目可能类似：

```text
my-plugin/
├── plugin.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── preload.ts
│   ├── main.ts
│   └── App.vue
├── public/
│   ├── logo.png
│   ├── plugin.json
│   ├── preload.js
│   └── package.json
└── dist/
```

AI 生成项目时要确认构建配置会把 `plugin.json`、`preload.js` 和 `logo` 复制到 `dist/`，否则插件无法被 ZTools 正确识别。

使用 Vite 且项目根目录为 `"type": "module"` 时，`public/preload.js` 仍必须保持 CommonJS。推荐在 `public/package.json` 中声明：

```json
{
  "type": "commonjs"
}
```

这样构建后的 `dist/preload.js` 可以继续使用 `require()`。

## plugin.json 配置

plugin.json 文件是插件应用的配置文件，它是最重要的一个文件，用来定义这个插件应用将如何与 ZTools 集成。 每当你创建一个插件应用时，都需要从创建一个 plugin.json 文件开始。

### 配置文件格式
plugin.json 文件是一个标准的 JSON 文件，它的结构如下：
```json
{
  "name": "example",
  "title": "示例插件",
  "description": "这是一个示例插件",
  "version": "1.0.0",
  "platform": ["darwin"],
  "main": "index.html",
  "logo": "logo.png",
  "preload": "preload.js",
  "features": [
    {
      "code": "hello",
      "explain": "hello world",
      "cmds": ["hello", "你好"]
    }
  ]
}
```

### 基础字段说明

#### `name`
- 类型：`string`
- 必填：是

插件应用唯一标识（ID），用于在系统中唯一标识该插件。

#### `title`
- 类型：`string`
- 必填：是

插件应用显示名称，在 ZTools 中展示给用户看的标题。

#### `description`
- 类型：`string`
- 必填：否

插件应用描述

#### `version`
- 类型：`string`
- 必填：否

插件应用版本

#### `platform`
- 类型：`Array<'win32' | 'darwin' | 'linux'>`
- 必填：否

限制整个插件支持的平台。不填写时默认支持所有平台。平台限制应放在 `plugin.json` 顶层，不要写到 `features[]` 内。

#### `main`
- 类型：`string`
- 必填：是

插件入口，可以是一个相对于 `plugin.json` 的相对路径的 `.html` 文件，或者是一个在线地址

#### `logo`
- 类型：`string`
- 必填：是

插件应用 Logo，必须为 png 或 jpg 文件

#### `preload`
- 类型：`string`
- 必填：是

预加载 js 文件，这是一个关键文件，你可以在此文件内调用 nodejs、 electron 提供的 api。
本页后文包含 `preload.js` 的开发规范和可用的公开 API。

#### `tools` 工具声明
- 类型：`Record<string, ToolDeclaration>`
- 必填：否

声明插件通过 `ztools.registerTool` 暴露给 ZTools MCP 服务的工具。每个 key 是工具名称，必须与 preload 中 `ztools.registerTool(name, handler)` 的 `name` 一致。

```json
{
  "tools": {
    "list_files": {
      "description": "列出指定目录中的文件",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        },
        "required": ["path"]
      },
      "outputSchema": {
        "type": "object"
      }
    }
  }
}
```

##### ToolDeclaration 字段

- `description`: `string`，必填，工具说明。
- `inputSchema`: `object`，必填，符合 JSON Schema 的输入结构。
- `outputSchema`: `object`，可选，工具输出结构。

工具声明只描述名称和数据结构，实际处理器仍需在 preload 中注册：

```javascript
ztools.registerTool("list_files", async ({ path }) => {
  return { path, entries: [] };
});
```

#### `providers` Provider 声明
- 类型：`Record<string, ProviderDeclaration>`
- 必填：否

声明插件提供的翻译或 OCR Provider。对象 key 是插件内唯一的声明 key，不必等于 `type`；后续 `ztools.registerProvider(key, handler)` 必须使用相同的 key。

```json
{
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

##### ProviderDeclaration 字段

- `type`: `'translation' | 'ocr'`，必填。
  - `translation` 的输入为 `{ text, from?, to? }`。
  - `ocr` 的输入为 `{ image, lang? }`。
- `label`: `string`，可选，在设置页展示的名称。
- `description`: `string`，可选，在设置页展示的说明。

同一插件可以为同一 `type` 声明多个不同 key。完整的注册和消费方式见本文后面的 Provider API 与开发章节。

### 开发模式字段说明

#### `development`
- 类型：`object`
- 必填：否

开发模式下的配置，对象的同名字段会覆盖基础配置字段。

#### `development.main`
- 类型：`string`
- 必填：否

开发模式下，插件应用的入口文件，与基础配置字段 main 字段相同

### 插件应用功能字段说明
#### `features`
- 类型：`Array<Feature>`
- 必填：否

插件功能列表，定义插件支持的功能及其触发方式。

#### `feature.code`
- 类型：`string`
- 说明：功能唯一标识，用于区分不同功能。

#### `feature.explain`
- 类型：`string`
- 说明：功能说明，显示在搜索结果中。

#### `feature.cmds`
- 类型：`Array<string | RegexCmd | OverCmd | ImgCmd | FilesCmd>`
- 说明：触发指令列表。可以是简单的字符串，也可以是匹配对象（正则、全局、图片、文件等）。

#### `feature.platform`
- 类型：`Array<'win32' | 'darwin' | 'linux'>`
- 必填：否
- 说明：支持的平台。如果不填，默认支持所有平台。

### 指令类型详解

#### 文本指令 (String)
最简单的触发方式，当用户输入完全匹配该文本时触发。
```json
{
  "features": [
    {
      "code": "hello",
      "explain": "打招呼",
      "cmds": ["hello", "你好"]
    }
  ]
}
```

#### 正则表达式指令 (RegexCmd)
使用正则表达式匹配用户输入。
```json
{
  "features": [
    {
      "code": "color",
      "explain": "颜色预览",
      "cmds": [
        {
          "type": "regex",
          "label": "颜色预览",
          "match": "/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/i",
          "minLength": 4
        }
      ]
    }
  ]
}
```
- `type`: 固定为 `"regex"`
- `label`: 匹配成功后显示的名称
- `match`: 正则表达式字符串 (例如 `"/^abc/i"`)
- `minLength`: 触发匹配的最小字符长度

#### 全局匹配指令 (OverCmd)
匹配任意文本，通常用于需要处理所有输入的场景（如翻译、搜索插件）。
```json
{
  "features": [
    {
      "code": "translate",
      "explain": "翻译",
      "cmds": [
        {
          "type": "over",
          "label": "翻译",
          "exclude": "/^exclude/i",
          "minLength": 1,
          "maxLength": 1000
        }
      ]
    }
  ]
}
```
- `type`: 固定为 `"over"`
- `label`: 显示的名称
- `exclude`: (可选) 排除匹配的正则表达式字符串
- `minLength`: (可选) 最小字符数
- `maxLength`: (可选) 最大字符数 (默认 10000)

#### 图片匹配指令 (ImgCmd)
当用户粘贴图片到 ZTools 时触发，用于处理图片的插件（如图片压缩、格式转换、OCR 识别等）。

```json
{
  "features": [
    {
      "code": "image-process",
      "explain": "图片处理",
      "cmds": [
        {
          "type": "img",
          "label": "图片处理"
        }
      ]
    }
  ]
}
```
- `type`: 固定为 `"img"`
- `label`: 显示的名称

**使用场景**：
- 图片压缩
- 图片格式转换
- OCR 文字识别
- 图片编辑
- 图片上传

#### 文件匹配指令 (FilesCmd)
当用户粘贴文件或文件夹到 ZTools 时触发，支持多种过滤条件来精确匹配文件。

```json
{
  "features": [
    {
      "code": "file-process",
      "explain": "文件处理",
      "cmds": [
        {
          "type": "files",
          "label": "批量重命名",
          "fileType": "file",
          "extensions": ["txt", "md", "json"],
          "match": "/^test/i",
          "minLength": 1,
          "maxLength": 100
        }
      ]
    }
  ]
}
```

- `type`: 固定为 `"files"`
- `label`: 显示的名称
- `fileType`: (可选) 文件类型，`"file"` 表示只匹配文件，`"directory"` 表示只匹配文件夹。不指定则文件和文件夹都匹配
- `extensions`: (可选) 文件扩展名数组，只对文件有效（不检查文件夹）。例如 `["jpg", "png", "gif"]`
- `match`: (可选) 匹配文件(夹)名称的正则表达式字符串。例如 `"/^test/i"` 表示匹配以 "test" 开头的文件名（不区分大小写）
- `minLength`: (可选) 最少文件数，默认 1
- `maxLength`: (可选) 最多文件数，默认 10000

**匹配规则**：
1. 首先检查文件数量是否在 `minLength` 和 `maxLength` 范围内
2. 然后检查每个文件是否满足以下条件（如果指定）：
   - 文件类型（`fileType`）
   - 文件扩展名（`extensions`）
   - 文件名正则匹配（`match`）

**使用场景**：
- 批量文件重命名
- 文件格式转换
- 文件压缩打包
- 文件批量上传
- 代码文件批量处理

## preload.js 开发规范

`preload.js` 用于访问本地能力，遵循 CommonJS 规范：

```javascript
const fs = require("node:fs");
const path = require("node:path");
const { clipboard, nativeImage } = require("electron");

window.services = {
  readFile(filename) {
    return fs.readFileSync(filename, { encoding: "utf-8" });
  },
  getFolder(filepath) {
    return path.dirname(filepath);
  },
  copyImage(imageFilePath) {
    clipboard.writeImage(nativeImage.createFromPath(imageFilePath));
    return true;
  }
};
```

前端可直接调用：

```javascript
const text = window.services.readFile("/path/to/file.txt");
```

AI 编写 `preload.js` 时应遵守：

- 使用 `require`，不要使用 ESM `import`。
- 只暴露业务需要的最小接口，不把 `fs`、`child_process` 等完整模块直接挂到 `window`。
- 对路径、参数、文件大小和扩展名做校验。
- 对可能失败的本地操作返回明确错误信息。
- 不要在 preload 中写 UI 逻辑。
- 不要压缩、混淆或打包 preload 代码。

### Node.js 依赖

如果 `preload.js` 需要第三方 npm 模块，应在 `preload.js` 同级目录准备独立的 CommonJS `package.json`：

```json
{
  "type": "commonjs",
  "dependencies": {
    "colord": "^2.9.3"
  }
}
```

然后在同级目录执行：

```bash
npm install
```

再在 `preload.js` 中使用：

```javascript
const { colord, getFormat } = require("colord");
```

提交插件时，第三方模块源码也必须保持清晰可读。

## 生命周期和入口参数

前端应使用 `ztools.onPluginEnter` 接收插件启动参数：

```javascript
ztools.onPluginEnter(({ payload, type, code }) => {
  if (code === "translate" && payload) {
    runTranslate(payload);
  }
});
```

有 `main` 页面入口的 UI 插件应使用上面的方式接收参数，不要在 `preload.js` 中声明 `window.exports`：

```javascript
// UI 插件不要这样写
window.exports = {
  "some-code": {
    mode: "none",
    args: {
      enter() {}
    }
  }
};
```

`window.exports` + `mode: "none"` 适合无界面插件或纯 preload 命令插件；如果插件有 Vue/React/HTML 页面，使用它会绕开正常页面入口，可能导致窗口高度、生命周期和 payload 传递异常。

`LaunchParam` 字段：

| 字段 | 说明 |
| --- | --- |
| `payload` | 传递数据，例如搜索框文本、粘贴图片或文件信息 |
| `type` | 命令类型，常见值为 `text`、`regex`、`over` |
| `code` | 触发的 Feature Code |

其他生命周期：

```javascript
ztools.onPluginOut((isKill) => {
  // 插件退出，isKill 表示是否强制结束
});

ztools.onPluginDetach(() => {
  // 插件被分离为独立窗口
});
```

## 界面样式和主题

ZTools 主窗口可能使用透明或半透明材质。UI 插件不要写死大面积纯白、浅灰或深色背景，应优先使用透明背景和 CSS 变量适配主题。推荐全局样式：

```css
:root {
  --bg-app: transparent;
  --bg-surface: transparent;
  --bg-hover: rgba(245, 245, 245, 0.7);
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-app: transparent;
    --bg-surface: transparent;
    --bg-hover: rgba(50, 50, 70, 0.7);
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
    --border-color: rgba(255, 255, 255, 0.1);
  }
}

html,
body {
  margin: 0;
  background: transparent;
  color: var(--text-primary);
}
```

组件内部用 `var(--bg-app)`、`var(--bg-surface)`、`var(--text-primary)`、`var(--border-color)` 等变量，不要把主要容器写成固定的 `#fff`、`#f4f6fb` 或 `#111827`。如需半透明遮罩，可使用 `rgba(...)` 配合 `backdrop-filter`，并为暗色模式单独定义变量。

## 公开 API 参考

以下内容只收录普通插件可以调用的公开接口。生成代码时应优先使用这些接口；不要推测或调用未列出的宿主内部接口。

ZTools 为插件提供了一套丰富的 API，通过全局对象 `window.ztools` 暴露。

### 基础 API

#### `ztools.getAppName()`
获取应用名称。

- **返回**: `string` - 应用名称，固定返回 `'ZTools'`。

#### `ztools.getPathForFile(file)`
获取拖放文件的真实路径。用于处理用户拖放文件到插件界面的场景（基于 Electron `webUtils.getPathForFile`）。

- **file**: `File` - 拖放事件中的 File 对象。
- **返回**: `string` - 文件的本地路径。

#### `ztools.isMacOs()` / `ztools.isMacOS()`
检测当前是否为 macOS 系统。

- **返回**: `boolean` - 是否为 macOS。

#### `ztools.isWindows()`
检测当前是否为 Windows 系统。

- **返回**: `boolean` - 是否为 Windows。

#### `ztools.isLinux()`
检测当前是否为 Linux 系统。

- **返回**: `boolean` - 是否为 Linux。

#### `ztools.getNativeId()`
获取设备唯一标识符（32位字符串）。

- **返回**: `string` - 设备唯一标识符。

#### `ztools.getAppVersion()`
获取应用版本号。

- **返回**: `string` - 应用版本号。

#### `ztools.getWindowType()`
获取当前窗口类型。

- **返回**: `string` - 窗口类型。

#### `ztools.isDarkColors()`
检测当前是否为深色主题。

- **返回**: `boolean` - 是否为深色主题。

#### `ztools.getUser()`
获取当前登录用户的公开资料。未登录时返回 `null`。

- **返回**: `object | null` - 用户资料，通常包含 `avatar`、`nickname`、`uid`。

#### `ztools.getUserTempToken()`
获取当前插件访问 ZTools 服务端的短期鉴权令牌。

- **返回**: `Promise<object>` - `{ token: string, expiredAt: number }`，`expiredAt` 为毫秒级时间戳。

#### `ztools.getThemeInfo()`
获取当前主题信息。

- **返回**: `object` - 包含 `isDark`、`primaryColor`、`customColor`、`windowMaterial` 等字段。

#### `ztools.onThemeChange(callback)`
监听主题变化。再次注册会替换之前的回调。

- **callback**: `(themeInfo: object) => void` - 主题变化时调用，参数结构与 `getThemeInfo()` 返回值一致。

#### `ztools.isDev()`
检查当前插件是否处于开发模式。

- **返回**: `boolean` - 是否处于开发模式。

#### `ztools.getWebContentsId()`
获取当前 WebContents ID。

- **返回**: `number` - WebContents ID。

#### `ztools.setExpendHeight(height)`
设置插件视图的高度。

- **height**: `number` - 期望的高度（像素）。

#### `ztools.showNotification(body)`
显示系统通知。

- **body**: `string` - 通知内容。

#### `ztools.showToast(message, options)`
在 ZTools 界面中显示 Toast 提示。

- **message**: `string` - 提示内容。
- **options**: `object` - (可选) Toast 配置，会与 `message` 合并后传给宿主。
- **返回**: `Promise<object>` - 宿主返回的 Toast 操作结果。

#### `ztools.sendInputEvent(event)`
发送模拟输入事件。

- **event**: `MouseInputEvent | MouseWheelInputEvent | KeyboardInputEvent` - 输入事件对象。

##### 事件对象结构

**KeyboardInputEvent (键盘事件)**
- `type`: `'keyDown'` | `'keyUp'` | `'char'`
- `keyCode`: `string` - 键盘代码
- `modifiers`: `string[]` - 修饰键数组 (例如 `['shift', 'control']`)

**MouseInputEvent (鼠标事件)**
- `type`: `'mouseDown'` | `'mouseUp'` | `'mouseEnter'` | `'mouseLeave'` | `'contextMenu'` | `'mouseMove'`
- `x`: `number` - X 坐标
- `y`: `number` - Y 坐标
- `button`: `'left'` | `'middle'` | `'right'` - 按钮类型
- `clickCount`: `number` - 点击次数

**MouseWheelInputEvent (滚轮事件)**
- `type`: `'mouseWheel'`
- `deltaX`: `number`
- `deltaY`: `number`
- `wheelTicksX`: `number`
- `wheelTicksY`: `number`
- `accelerationRatioX`: `number`
- `accelerationRatioY`: `number`
- `hasPreciseScrollingDeltas`: `boolean`
- `canScroll`: `boolean`

#### `ztools.simulateKeyboardTap(key, ...modifiers)`
模拟键盘按键。

- **key**: `string` - 要按下的键。
- **modifiers**: `string[]` - 修饰键数组（可选）。
- **返回**: `boolean` - 是否成功。

#### `ztools.findInPage(text, options)`
在当前插件页面中查找文本。

- **text**: `string` - 要查找的文本。
- **options**: `object` - (可选) 查找选项，可包含 `forward`、`findNext`、`matchCase`、`wordStart`、`medialCapitalAsWordStart`。
- **返回**: `Promise<{ success: boolean, requestId?: number, error?: string }>` - 查找请求结果。

#### `ztools.stopFindInPage(action)`
停止页面查找。

- **action**: `'clearSelection' | 'keepSelection' | 'activateSelection'` - (可选) 停止行为，默认 `'clearSelection'`。
- **返回**: `Promise<{ success: boolean, error?: string }>` - 停止查找结果。

#### `ztools.onFindInPageResult(callback)` / `ztools.offFindInPageResult(callback)`
监听或取消监听页面查找结果。

- **callback**: `(result: object) => void` - 查找结果回调。结果对象来自 Electron `found-in-page` 事件，包含 `requestId`、`activeMatchOrdinal`、`matches`、`selectionArea`、`finalUpdate` 等字段。

#### `ztools.simulateMouseMove(x, y)`
模拟鼠标移动到屏幕坐标。

- **x**: `number` - 屏幕 X 坐标。
- **y**: `number` - 屏幕 Y 坐标。
- **返回**: `boolean` - 是否成功。

#### `ztools.simulateMouseClick(x, y)` / `ztools.simulateMouseDoubleClick(x, y)` / `ztools.simulateMouseRightClick(x, y)`
分别模拟鼠标左键单击、左键双击和右键单击。

- **x**: `number` - 屏幕 X 坐标。
- **y**: `number` - 屏幕 Y 坐标。
- **返回**: `boolean` - 是否成功。

#### `ztools.showMainWindow()`
显示主窗口。

- **返回**: `Promise<boolean>` - 是否成功。

#### `ztools.hideMainWindow(isRestorePreWindow)`
隐藏主窗口，包括此时正在主窗口运行的插件应用。

- **isRestorePreWindow**: `boolean` - (可选) 是否焦点回归到前面的活动窗口，默认 `true`。
- **返回**: `Promise<boolean>` - 是否成功。

#### `ztools.outPlugin(isKill)`
退出插件应用，默认将插件应用隐藏后台。

- **isKill**: `boolean` - (可选) 为 `true` 时，将结束运行插件应用 (杀死进程)。
- **返回**: `Promise<boolean>` - 是否成功。

### 事件 API

#### `ztools.onPluginEnter(callback)`
监听插件进入事件。当用户打开插件时触发。

- **callback**: `(param: LaunchParam) => void` - 回调函数，接收启动参数。

##### LaunchParam 结构
- `payload`: `any` - 传递的数据（例如搜索框内容）
- `type`: `'text' | 'regex' | 'over'` - 命令类型
  - `'text'`: 文本匹配
  - `'regex'`: 正则表达式匹配
  - `'over'`: 任意文本匹配
- `code`: `string` - 插件 Feature Code (如果是由 Feature 触发)

#### `ztools.onPluginOut(callback)`
监听插件退出事件。

- **callback**: `(isKill: boolean) => void` - 回调函数，接收退出参数。
  - `isKill`: 是否为强制退出（杀死进程）。

#### `ztools.onPluginDetach(callback)`
监听插件被分离为独立窗口的事件。当用户将插件从主窗口分离时触发。

- **callback**: `() => void` - 回调函数。

#### `ztools.onMainPush(callback, selectCallback)`
注册主搜索推送功能。插件可以在主搜索框中提供搜索结果，用户无需进入插件即可看到结果。

- **callback**: `(queryData: any) => object[]` - 查询回调函数，接收搜索数据，返回搜索结果数组。
- **selectCallback**: `(selectData: any) => boolean` - (可选) 用户选择搜索结果时的回调函数。返回 `true` 表示需要进入插件。

#### `ztools.onPluginReady(callback)`
兼容旧 API，功能与 `onPluginEnter` 相同。

- **callback**: `(param: LaunchParam) => void` - 回调函数，接收启动参数。

### 搜索框 API

#### `ztools.setSubInput(onChange, placeholder, isFocus)`
设置主窗口搜索框的行为（当插件处于活动状态时）。

- **onChange**: `(details: { text: string }) => void` - 当用户在搜索框输入时触发的回调函数。
- **placeholder**: `string` - 搜索框的占位符文本。
- **isFocus**: `boolean` - (可选) 是否自动聚焦搜索框，默认 `true`。

#### `ztools.setSubInputValue(text)`
设置子输入框的值。

- **text**: `string` - 要设置的值。

#### `ztools.subInputFocus()`
聚焦子输入框。

- **返回**: `boolean` - 是否成功。

#### `ztools.subInputBlur()`
子输入框失去焦点，插件应用获得焦点。

- **返回**: `boolean` - 是否成功。

#### `ztools.subInputSelect()`
子输入框获得焦点并选中全部内容。

- **返回**: `boolean` - 是否成功。

#### `ztools.removeSubInput()`
移除（隐藏）子输入框。

- **返回**: `Promise<boolean>` - 是否成功。

### 数据库 API

插件拥有独立的数据库存储空间（Bucket），以插件名称隔离。

#### `ztools.db.put(doc)`
保存数据。

- **doc**: `object` - 文档对象（必须包含 `_id` 字段）。
- **返回**: `object` - 保存后的文档对象（包含 `_id` 和 `_rev`）。

#### `ztools.db.get(id)`
获取数据。

- **id**: `string` - 文档 ID。
- **返回**: `object | null` - 文档对象，不存在则返回 `null`。

#### `ztools.db.remove(docOrId)`
删除数据。

- **docOrId**: `object | string` - 要删除的文档对象（通常包含 `_id` 和 `_rev`）或文档 ID。
- **返回**: `object` - 删除结果。

#### `ztools.db.bulkDocs(docs)`
批量操作文档。

- **docs**: `object[]` - 文档数组。
- **返回**: `object[]` - 操作结果数组。

#### `ztools.db.allDocs(key)`
获取所有文档或按 key 前缀查询。

- **key**: `string` - (可选) 文档 ID 前缀，用于过滤。
- **返回**: `object[]` - 文档数组。

#### `ztools.db.postAttachment(id, attachment, type)`
为文档添加附件。

- **id**: `string` - 文档 ID。
- **attachment**: `string | Buffer` - 附件内容（base64 字符串或 Buffer）。
- **type**: `string` - 附件 MIME 类型。
- **返回**: `object` - 操作结果。

#### `ztools.db.getAttachment(id)`
获取文档附件。

- **id**: `string` - 文档 ID。
- **返回**: `Buffer` - 附件内容。

#### `ztools.db.getAttachmentType(id)`
获取文档附件的 MIME 类型。

- **id**: `string` - 文档 ID。
- **返回**: `string` - MIME 类型。

#### Promise API

数据库 API 还提供了 Promise 版本，位于 `window.ztools.db.promises` 下，所有方法签名与同步版本相同，但返回 `Promise`。

- `window.ztools.db.promises.put(doc)`
- `window.ztools.db.promises.get(id)`
- `window.ztools.db.promises.remove(docOrId)`
- `window.ztools.db.promises.bulkDocs(docs)`
- `window.ztools.db.promises.allDocs(key)`
- `window.ztools.db.promises.postAttachment(id, attachment, type)`
- `window.ztools.db.promises.getAttachment(id)`
- `window.ztools.db.promises.getAttachmentType(id)`

### dbStorage API

类似 `localStorage` 的简化接口，用于简单的键值对存储。

#### `ztools.dbStorage.setItem(key, value)`
保存数据。

- **key**: `string` - 键名。
- **value**: `any` - 要保存的数据（会自动序列化为 JSON）。

#### `ztools.dbStorage.getItem(key)`
获取数据。

- **key**: `string` - 键名。
- **返回**: `any` - 数据内容，不存在则返回 `null`。

#### `ztools.dbStorage.removeItem(key)`
删除数据。

- **key**: `string` - 键名。

### 动态 Feature API

#### `ztools.getFeatures(codes)`
获取动态添加的 features。

- **codes**: `string[]` - (可选) 指定要获取的 feature codes，不传则返回所有。
- **返回**: `object[]` - Feature 数组。

#### `ztools.setFeature(feature)`
设置动态 feature（如果已存在则更新）。

- **feature**: `object` - Feature 对象。
- **返回**: `boolean` - 是否成功。

#### `ztools.removeFeature(code)`
删除指定的动态 feature。

- **code**: `string` - Feature code。
- **返回**: `boolean` - 是否成功。

### 剪贴板 API

#### `ztools.clipboard.getHistory(page, pageSize, filter)`
获取剪贴板历史记录。

- **page**: `number` - 页码，从 1 开始。
- **pageSize**: `number` - 每页数量。
- **filter**: `string` - (可选) 过滤条件。
- **返回**: `Promise<object>` - 历史记录数据。

#### `ztools.clipboard.search(keyword)`
搜索剪贴板历史。

- **keyword**: `string` - 搜索关键词。
- **返回**: `Promise<object[]>` - 匹配的记录数组。

#### `ztools.clipboard.delete(id)`
删除剪贴板记录。

- **id**: `string` - 记录 ID。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

#### `ztools.clipboard.clear(type)`
清空剪贴板历史。

- **type**: `string` - (可选) 类型过滤。
- **返回**: `Promise<{ success: boolean, count: number }>` - 是否成功及清除数量。

#### `ztools.clipboard.getStatus()`
获取剪贴板状态。

- **返回**: `Promise<object>` - 状态信息。

#### `ztools.clipboard.write(id, shouldPaste)`
将指定记录写入剪贴板。

- **id**: `string` - 记录 ID。
- **shouldPaste**: `boolean` - (可选) 是否同时模拟粘贴操作，默认 `true`。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

#### `ztools.clipboard.writeContent(data, shouldPaste)`
写入内容到剪贴板。

- **data**: `object` - 数据对象。
  - `type`: `'text' | 'image' | 'file'` - 内容类型。
  - `content`: `string | string[]` - 文本、图片内容，或单个文件路径/文件路径数组。`text` 和 `image` 类型要求为字符串。
- **shouldPaste**: `boolean` - (可选) 是否同时模拟粘贴操作，默认 `true`。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

#### `ztools.clipboard.updateConfig(config)`
更新剪贴板配置。

- **config**: `object` - 配置对象。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

#### `ztools.clipboard.onChange(callback)`
监听剪贴板变化事件。

- **callback**: `(item: object) => void` - 回调函数，接收剪贴板变化项。

#### `ztools.copyText(text)`
复制文本到剪贴板。

- **text**: `string` - 要复制的文本。
- **返回**: `boolean` - 是否成功。

#### `ztools.copyImage(image)`
复制图片到剪贴板。

- **image**: `string | Buffer | Uint8Array` - 图片 base64 Data URL、文件路径或图片二进制数据。
- **返回**: `boolean` - 是否成功。

#### `ztools.copyFile(filePath)`
复制文件到剪贴板。

- **filePath**: `string | string[]` - 单个文件路径或文件路径数组。
- **返回**: `boolean` - 是否成功。

#### `ztools.getCopyedFiles()`
获取当前系统剪贴板中的文件或文件夹列表。方法名中的 `Copyed` 为兼容现有 API 的拼写。

- **返回**: `object[]` - 文件项数组，每项包含 `path`、`name`、`isFile`、`isDirectory`。

### 文件操作 API

#### `ztools.getPath(name)`
获取系统路径。

- **name**: `string` - 路径名称（如 `'home'`, `'desktop'`, `'documents'` 等）。
- **返回**: `string` - 路径。

#### `ztools.showSaveDialog(options)`
弹出文件保存对话框。

- **options**: `SaveDialogOptions` - 对话框配置，与 Electron `showSaveDialogSync` 保持一致。
- **返回**: `string | undefined` - 选择的路径。用户取消则返回 `undefined`。

#### `ztools.showOpenDialog(options)`
弹出文件打开对话框。

- **options**: `OpenDialogOptions` - 对话框配置，与 Electron `showOpenDialogSync` 保持一致。
- **返回**: `string[] | undefined` - 选择的文件路径数组。用户取消则返回 `undefined`。

#### `ztools.screenCapture(callback)`
屏幕截图，会进入截图模式，用户截图完执行回调函数。

- **callback**: `(image: string, bounds: object) => void` - 截图完的回调函数。
  - `image`: 截图的图像 base64 Data Url。
  - `bounds`: 截图区域，包含 `x`、`y`、`width`、`height`。
- **返回**: `Promise<void>` - 截图流程结束后完成。

#### `ztools.screenColorPick(callback)`
进入屏幕取色模式，取色成功后调用回调。

- **callback**: `(color: { hex: string, rgb: string }) => void` - 取色结果回调。
- **返回**: `Promise<void>` - 取色流程结束后完成。

#### `ztools.startDrag(filePath)`
开始将文件拖动到外部应用。

- **filePath**: `string | string[]` - 要拖动的文件路径或路径数组。

#### `ztools.hideMainWindowPasteText(text)` / `ztools.hideMainWindowPasteImage(image)`
隐藏主窗口，并将文本或图片粘贴到之前获得焦点的外部应用。

- **text**: `string` - 要粘贴的文本。
- **image**: `string | Uint8Array` - 图片 Data URL、路径或图片二进制数据。
- **返回**: `boolean` - 是否成功。

#### `ztools.hideMainWindowPasteFile(filePath)`
隐藏主窗口，并将文件粘贴到之前获得焦点的外部应用。

- **filePath**: `string | string[]` - 文件路径或路径数组。
- **返回**: `boolean` - 是否成功。

#### `ztools.hideMainWindowTypeString(text)`
隐藏主窗口，并向之前获得焦点的外部应用模拟键入字符串。

- **text**: `string` - 要键入的文本。
- **返回**: `boolean` - 是否成功。

### 窗口 API

#### `ztools.createBrowserWindow(url, options, callback)`
创建独立窗口。

- **url**: `string` - 窗口加载的 URL。
- **options**: `object` - 窗口选项，与 Electron `BrowserWindow` 构造函数选项保持一致。
- **callback**: `() => void` - (可选) 窗口加载完成后的回调函数。
- **返回**: `object` - 返回带 `id`、`webContents` 和宿主白名单方法的窗口对象。主窗口方法和 `webContents` 方法分别可能是同步方法或返回 Promise 的异步方法，具体方法由当前版本宿主提供。

#### `ztools.sendToParent(channel, ...args)`
发送消息到父窗口。

- **channel**: `string` - 通道名称。
- **args**: `any[]` - 要传递的参数。

### 显示器 API

#### `ztools.getPrimaryDisplay()`
获取主显示器信息。

- **返回**: `object` - 显示器信息对象。

#### `ztools.getAllDisplays()`
获取所有显示器。

- **返回**: `object[]` - 显示器信息数组。

#### `ztools.getCursorScreenPoint()`
获取鼠标光标的屏幕坐标。

- **返回**: `object` - 坐标对象 `{ x: number, y: number }`。

#### `ztools.getDisplayNearestPoint(point)`
获取最接近指定点的显示器。

- **point**: `object` - 坐标对象 `{ x: number, y: number }`。
- **返回**: `object` - 显示器信息对象。

#### `ztools.desktopCaptureSources(options)`
获取桌面捕获源。

- **options**: `object` - 捕获选项。
- **返回**: `Promise<object[]>` - 捕获源数组。

#### `ztools.dipToScreenPoint(point)`
DIP 坐标转屏幕物理坐标。

- **point**: `object` - DIP 坐标对象 `{ x: number, y: number }`。
- **返回**: `object` - 屏幕物理坐标对象 `{ x: number, y: number }`。

#### `ztools.screenToDipPoint(point)`
屏幕物理坐标转 DIP 坐标。

- **point**: `object` - 屏幕物理坐标对象 `{ x: number, y: number }`。
- **返回**: `object` - DIP 坐标对象 `{ x: number, y: number }`。

#### `ztools.dipToScreenRect(rect)`
DIP 区域转屏幕物理区域。

- **rect**: `object` - DIP 区域对象 `{ x: number, y: number, width: number, height: number }`。
- **返回**: `object` - 屏幕物理区域对象 `{ x: number, y: number, width: number, height: number }`。

### Shell API

#### `ztools.shellOpenExternal(url)`
使用系统默认程序打开 URL。

- **url**: `string` - 要打开的 URL。
- **返回**: `object` - `{ success: boolean, error?: string }`。

#### `ztools.shellOpenPath(fullPath)`
使用系统默认方式打开文件或文件夹。

- **fullPath**: `string` - 文件或文件夹路径。
- **返回**: `object` - `{ success: boolean, error?: string }`。

#### `ztools.shellShowItemInFolder(fullPath)`
在文件管理器中显示文件。

- **fullPath**: `string` - 文件路径。
- **返回**: `undefined` - 请求已发送；具体打开结果由系统文件管理器处理。

#### `ztools.shellBeep()`
播放系统提示音。

- **返回**: `object` - `{ success: boolean, error?: string }`。

#### `ztools.shellTrashItem(fullPath)`
将文件或文件夹移动到系统回收站。

- **fullPath**: `string` - 文件或文件夹路径。
- **返回**: `Promise<{ success: boolean }>` - 是否成功；失败时可能抛出 Error。

#### `ztools.readCurrentFolderPath()`
读取当前活动文件管理器窗口的文件夹路径。macOS 支持 Finder，Windows 支持 Explorer。

- **返回**: `Promise<string>` - 当前文件夹路径。

#### `ztools.readCurrentBrowserUrl()`
读取当前活动浏览器窗口的 URL。前提是当前活动窗口属于受支持的浏览器。

- **返回**: `Promise<string>` - 当前 URL。

#### `ztools.getFileIcon(filePath)`
获取文件系统图标。

- **filePath**: `string` - 文件路径。
- **返回**: `string | null` - 图标的 base64 Data URL；获取失败时为 `null`。

### 其他 API

#### `ztools.redirect(label, payload)`
插件跳转。

- **label**: `string | [string, string]` - 指令名称，或 `[插件标题, 指令名称]`。
- **payload**: `string` - (可选) 传递给目标指令的文本。当前实现只按字符串处理非空 payload。
- **返回**: `boolean` - 是否成功。

#### `ztools.redirectHotKeySetting(cmdLabel)`
跳转到快捷键设置，并定位到指定指令。

- **cmdLabel**: `string` - 指令名称。
- **返回**: `boolean` - 是否成功。

#### `ztools.redirectAiModelsSetting()`
跳转到 AI 模型设置页面。当前设置页已将 AI 模型入口并入 Provider 页面。

- **返回**: `boolean` - 是否成功。

#### `ztools.http.setHeaders(headers)`
设置 HTTP 请求头。

- **headers**: `object` - 请求头对象。
- **返回**: `boolean` - 是否成功。

#### `ztools.http.getHeaders()`
获取当前请求头配置。

- **返回**: `object` - 请求头对象。

#### `ztools.http.clearHeaders()`
清除请求头配置。

- **返回**: `boolean` - 是否成功。

### 工具注册 API

#### `ztools.registerTool(name, handler)`
注册一个供 ZTools MCP 服务调用的插件工具。工具必须先在 `plugin.json.tools` 中声明，具体格式见本文 `plugin.json` 配置章节。

- **name**: `string` - 工具名称，必须与 `plugin.json.tools` 中的 key 一致。
- **handler**: `(input: object) => any | Promise<any>` - 工具处理器，接收调用输入并返回结果。
- **返回**: `void` - 注册成功后结束。
- **异常**: 工具未声明、名称为空或 handler 不是函数时抛出 Error。

```javascript
ztools.registerTool("list_files", async ({ path }) => {
  return { path, entries: [] };
});
```

### Provider API

Provider 支持两种角色：插件可以注册翻译/OCR Provider，也可以消费其他插件或内置 Provider。完整配置和契约见本文 Provider API 与开发章节。

#### `ztools.registerProvider(key, handler)`
注册一个翻译或 OCR Provider 的处理器。

- **key**: `string` - 必须与 `plugin.json.providers` 中的 key 一致。
- **handler**: `(input: object) => Promise<object>` - Provider 处理器，输入输出结构由声明的 `type` 决定。
- **返回**: `void` - 注册成功后结束。
- **异常**: key 未声明、为空或 handler 不是函数时抛出 Error。

#### `ztools.providers.getProviders(type)`
查询 Provider 列表。

- **type**: `'translation' | 'ocr'` - (可选) 指定类型；省略时返回全部类型。
- **返回**: `Promise<object[]>` - Provider 列表，每项包含 `id`、`type`、`label`、`description`、`source`、`isDefault` 等字段。

#### `ztools.providers.getDefaultProvider(type)`
查询指定类型的默认 Provider。

- **type**: `'translation' | 'ocr'` - Provider 类型。
- **返回**: `Promise<object | null>` - 默认 Provider；没有可用 Provider 时返回 `null`。

#### `ztools.providers.invokeProvider(type, input, providerId)`
调用 Provider。省略 `providerId` 时使用该类型的默认 Provider。

- **type**: `'translation' | 'ocr'` - Provider 类型。
- **input**: `object` - Provider 输入。
- **providerId**: `string` - (可选) 指定 Provider ID。
- **返回**: `Promise<object>` - Provider 输出。

#### `ztools.translate(text, options)`
调用翻译 Provider 的便捷封装。

- **text**: `string` - 待翻译文本。
- **options**: `object` - (可选) `{ from?: string, to?: string, providerId?: string }`。
- **返回**: `Promise<{ text: string, detectedFrom?: string }>` - 翻译结果。

#### `ztools.ocr(image, options)`
调用 OCR Provider 的便捷封装。

- **image**: `string` - 图片路径、Data URI 或 URL，具体支持取决于 Provider。
- **options**: `object` - (可选) `{ lang?: string, providerId?: string }`。
- **返回**: `Promise<{ text: string, blocks?: string[], confidence?: number }>` - OCR 结果。

### 浏览器自动化 API

`ztools.zbrowser` 和 `ztools.ubrowser` 都返回一个新的 Builder 实例，方法支持链式调用。调用 `run()` 时才会创建或复用浏览器窗口并执行操作队列。

```javascript
const result = await ztools.zbrowser
  .goto("https://example.com")
  .wait("h1")
  .click("a")
  .evaluate(() => document.title)
  .run({ width: 900, height: 600 })
```

#### Builder 方法

| 方法 | 说明 |
| --- | --- |
| `goto(url, headers?, timeout?)` | 打开 URL |
| `hide()` / `show()` | 隐藏或显示浏览器窗口 |
| `useragent(userAgent)` | 设置 User-Agent |
| `viewport(width, height)` | 设置视口大小 |
| `css(css)` | 注入 CSS |
| `press(key, ...modifiers)` | 模拟键盘按键 |
| `paste(text?)` | 执行粘贴，可选传入文本或图片 Base64 |
| `screenshot(arg?, savePath?)` | 截图，可按选择器或区域截图 |
| `pdf(options?, savePath?)` | 导出 PDF |
| `device(device)` | 模拟设备尺寸和 User-Agent |
| `cookies(nameOrFilter?)` | 获取 Cookie |
| `setCookies(name, value)` / `setCookies(cookies)` | 设置 Cookie |
| `removeCookies(name)` | 删除 Cookie |
| `clearCookies(url?)` | 清空 Cookie |
| `devTools(mode?)` | 打开开发者工具 |
| `evaluate(fn, ...args)` | 在目标页面执行 JS，可执行异步函数 |
| `wait(msOrSelectorOrFn, options?, ...args)` | 等待时间、元素或判断函数 |
| `when(selectorOrFn, ...args)` / `end()` | 条件执行操作队列 |
| `mouse(eventName, selector)` | 对元素分发鼠标事件 |
| `click(target, mouseButton?)` | 点击元素或坐标 |
| `mousedown(target, mouseButton?)` / `mouseup(target, mouseButton?)` | 鼠标按下或抬起 |
| `dblclick(target, mouseButton?)` | 双击元素或坐标 |
| `hover(target)` | 悬停元素或移动到坐标 |
| `drop(target, payload)` | 拖放文件到元素或坐标 |
| `markdown(selector?)` | 将页面或元素转换为 Markdown |
| `input(text)` / `input(selector, text)` | 输入文本 |
| `file(selector, fileData)` | 设置文件 input，支持路径、Base64、`Uint8Array` 或路径数组 |
| `download(urlOrFunction, savePath?, ...args)` | 下载 URL 或函数返回的 URL |
| `value(selector, value)` | 设置表单元素的值 |
| `check(selector, checked?)` | 设置复选框状态 |
| `focus(selector)` | 聚焦元素 |
| `scroll(...)` | 滚动页面或滚动到元素 |
| `run(ubrowserIdOrOptions?, options?)` | 执行队列并返回 Promise |

`run()` 支持以下形式：

```javascript
await ztools.zbrowser.goto("https://example.com").run()
await ztools.zbrowser.goto("https://example.com").run({ show: true })
await ztools.zbrowser.goto("https://example.com").run(3, { show: true })
```

当窗口保持显示时，后续 Builder 实例可以通过 `getIdleUBrowsers()` 返回的窗口 ID 复用它。

#### `ztools.getIdleUBrowsers()`
获取当前插件的空闲浏览器窗口。

- **返回**: `object[]` - 窗口信息数组，每项包含 `id`、`title`、`url`。

#### `ztools.setUBrowserProxy(config)`
设置当前插件浏览器 Session 的代理。ZTools 返回 Promise，与 uTools 的同步 API 不同。

- **config**: `object` - Electron Session 代理配置，例如 `pacScript`、`proxyRules`、`proxyBypassRules`。
- **返回**: `Promise<boolean>` - 是否成功。

#### `ztools.clearUBrowserCache()`
清除当前插件浏览器 Session 的缓存。

- **返回**: `Promise<boolean>` - 是否成功。

#### `ztools.ubrowserLogin()`
兼容 uTools 的登录接口。

- **返回**: `Promise<null>` - ZTools 当前不支持此功能，固定返回 `null`。

### FFmpeg API

#### `ztools.runFFmpeg(args, options)`
在插件进程中执行 FFmpeg 命令。FFmpeg 路径由 ZTools 管理，插件只需要传入命令行参数。

- **args**: `string[]` - FFmpeg 命令行参数。
- **options**: `Function | object` - (可选) 直接传入函数时视为 `onProgress`；传入对象时可包含 `onProgress` 和 `onLog`。
- **返回**: `Promise<void> & { kill: () => void, quit: () => void }` - 可等待、强制终止或优雅退出的任务。

`onProgress` 会收到解析后的 FFmpeg 进度对象，包含 FFmpeg 输出中的键值，可能额外包含 `percent`；`onLog` 会收到 stderr 文本。覆盖已有文件时，ZTools 会自动回答 `N`，拒绝覆盖。

```javascript
const task = ztools.runFFmpeg(
  ["-i", inputPath, "-y", outputPath],
  {
    onProgress: (progress) => console.log(progress.percent),
    onLog: (line) => console.log(line)
  }
)

await task
```

需要停止时可以调用 `task.kill()`，希望 FFmpeg 自己收尾时调用 `task.quit()`。

### AI API

ZTools 通过 `window.ztools` 提供 AI 模型调用能力。本节只介绍 AI 相关接口，插件的其他公开能力见本文前面的常规插件 API 章节。

当前公开的 AI 接口包括：

- `ztools.ai`：调用模型并由 ZTools 自动执行已注册的工具调用循环。
- `ztools.aiChat`：发起单轮流式请求，由插件自行处理工具调用循环。
- `ztools.allAiModels`：获取当前可用的模型列表。

#### `ztools.ai`

##### `ztools.ai(option, streamCallback)`

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

#### `ztools.aiChat`

##### `ztools.aiChat(option, eventCallback)`

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

##### 流式事件

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

##### 完整响应

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

##### 工具调用循环示例

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

#### `ztools.allAiModels`

##### `ztools.allAiModels()`

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

#### 类型说明

##### `AiMessage`

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

##### `AiTool` 和 `AiToolCall`

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

##### Token 用量

`usage` 通常包含：`prompt_tokens`、`completion_tokens`、`total_tokens`，部分供应商还会返回 `cache_read_tokens`、`cache_write_tokens`、`reasoning_tokens`。

### Provider API 与开发

ZTools 将翻译和 OCR 能力抽象为 Provider。插件可以提供自己的 Provider，也可以调用用户已经启用的其他 Provider。

AI 模型不属于 Provider，AI 能力见本文前面的 AI API 章节和后面的 AI 插件任务模板。

#### 支持的类型

| `type` | 用途 | 输入 | 输出 |
| --- | --- | --- | --- |
| `translation` | 文本翻译 | `{ text, from?, to? }` | `{ text, detectedFrom? }` |
| `ocr` | 图片文字识别 | `{ image, lang? }` | `{ text, blocks?, confidence? }` |

`ocr.image` 可以是本地路径、Data URI 或 URL，具体能力取决于 Provider 的实现。

#### 声明 Provider

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

#### 注册处理器

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

#### 消费 Provider

任何插件都可以消费已经启用的 Provider，不要求自身声明 Provider。

##### 查询 Provider

```javascript
const providers = await ztools.providers.getProviders("translation");
// [{ id, type, label, description, source, isDefault }, ...]

const defaultProvider = await ztools.providers.getDefaultProvider("translation");
// 没有可用 Provider 时为 null
```

`getProviders()` 不传 `type` 时返回所有类型的 Provider。

##### 指定 Provider 调用

```javascript
const result = await ztools.providers.invokeProvider(
  "translation",
  { text: "hello", to: "zh" },
  "plugin:cloud-services:baidu"
);
```

省略第三个参数时，ZTools 使用该类型的默认 Provider。调用失败会抛出 Error，插件应使用 `try/catch` 处理。

##### 便捷方法

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

#### Provider 选择规则

未指定 `providerId` 时，ZTools 按以下顺序选择：

1. 用户在设置页指定的默认 Provider。
2. 该类型下第一个启用的 Provider。
3. 该类型下第一个可用的 Provider。

没有可用 Provider 时，调用会失败并抛出 Error。

Provider 的启用状态、默认项和参数由用户在设置页管理，插件不应直接修改这些设置。

sed: 1: "1894,
": expected context address
## 任务模板

### 文本处理插件

使用场景：翻译、格式化、正则提取、编码解码、AI 总结。

`plugin.json` 建议：

```json
{
  "features": [
    {
      "code": "text-process",
      "explain": "处理文本",
      "cmds": [
        {
          "type": "over",
          "label": "处理文本",
          "minLength": 1,
          "maxLength": 5000
        }
      ]
    }
  ]
}
```

实现要点：

- 在 `onPluginEnter` 中读取 `payload`。
- 使用 `setSubInput` 支持二次输入。
- 结果支持复制到剪贴板。
- 长文本处理要显示加载状态和错误状态。

### 文件处理插件

使用场景：批量重命名、转换格式、压缩、提取元数据。

`plugin.json` 建议：

```json
{
  "features": [
    {
      "code": "file-process",
      "explain": "处理文件",
      "cmds": [
        {
          "type": "files",
          "label": "处理文件",
          "fileType": "file",
          "extensions": ["txt", "md"],
          "minLength": 1,
          "maxLength": 100
        }
      ]
    }
  ]
}
```

实现要点：

- 文件读写放在 `preload.js`。
- 前端只传路径和用户选项。
- 修改文件前建议让用户选择输出目录或生成新文件。
- 对批量任务显示进度和失败列表。

### 图片处理插件

使用场景：压缩、格式转换、OCR、上传。

`plugin.json` 建议：

```json
{
  "features": [
    {
      "code": "image-process",
      "explain": "处理图片",
      "cmds": [
        {
          "type": "img",
          "label": "处理图片"
        }
      ]
    }
  ]
}
```

实现要点：

- 图片数据通常从 `payload` 或剪贴板能力进入。
- 图片本地处理可在 `preload.js` 中调用 Node.js 模块。
- 输出支持保存文件、复制图片、打开所在文件夹。

### 主搜索增强插件

使用场景：字典、书签、命令面板、快速搜索。

实现要点：

- 使用 `ztools.onMainPush` 返回候选结果。
- 候选结果要轻量快速，避免阻塞主搜索。
- 选择结果后如需打开完整 UI，`selectCallback` 返回 `true`。
- 搜索索引或缓存可用 `dbStorage` 或 `db` 保存。

### AI 插件

使用场景：问答、总结、翻译、改写、代码解释。

实现要点：

- 使用 `ztools.ai`，流式输出时提供停止按钮并调用 `abort()`。
- 使用 `allAiModels()` 展示可选模型时要处理获取失败。
- 长内容输入要限制长度或分段处理。
- 提供复制结果、重新生成、清空历史等基础操作。

## 完整最小示例

### plugin.json

```json
{
  "name": "quick-text-tools",
  "title": "快速文本工具",
  "description": "对输入文本进行大小写转换并复制结果",
  "version": "1.0.0",
  "main": "index.html",
  "logo": "logo.png",
  "preload": "preload.js",
  "development": {
    "main": "http://localhost:5173"
  },
  "features": [
    {
      "code": "text-tools",
      "explain": "快速文本处理",
      "cmds": [
        "文本工具",
        {
          "type": "over",
          "label": "转换文本",
          "minLength": 1,
          "maxLength": 2000
        }
      ]
    }
  ]
}
```

### preload.js

```javascript
window.textTools = {
  upper(text) {
    if (typeof text !== "string") {
      return { ok: false, error: "text must be a string" };
    }
    return { ok: true, value: text.toUpperCase() };
  },
  lower(text) {
    if (typeof text !== "string") {
      return { ok: false, error: "text must be a string" };
    }
    return { ok: true, value: text.toLowerCase() };
  }
};
```

### 前端逻辑

```javascript
let currentText = "";

function render(text) {
  document.querySelector("#input").value = text;
  document.querySelector("#output").textContent = text;
}

function convert(mode) {
  const service = window.textTools[mode];
  const result = service(currentText);
  if (!result.ok) {
    ztools.showNotification(result.error);
    return;
  }
  render(result.value);
  ztools.copyText(result.value);
}

ztools.onPluginEnter(({ payload }) => {
  currentText = typeof payload === "string" ? payload : "";
  render(currentText);
});

ztools.setSubInput(({ text }) => {
  currentText = text;
  render(text);
}, "输入要处理的文本");
```

## 发布前检查清单

AI 完成插件开发后，应逐项检查：

- `plugin.json` 是合法 JSON，没有注释或尾逗号。
- `name` 唯一且使用稳定英文标识。
- `title`、`description` 能准确说明插件用途。
- 平台限制写在顶层 `platform`，没有误写到 `features[]` 内。
- `main` 指向存在的 HTML 文件或可访问的在线地址。
- `logo` 指向 png 或 jpg 文件。
- `preload` 指向存在的 JS 文件。
- `features[].code` 不重复。
- `cmds` 与需求匹配，没有过宽的 `over` 或正则误触发。
- 框架项目已配置构建复制 `plugin.json`、`logo`、`preload.js`。
- Vite/ESM 项目的 `dist/preload.js` 可使用 CommonJS；必要时已提供 `public/package.json` 声明 `{ "type": "commonjs" }`。
- `preload.js` 可读，没有压缩、混淆、隐藏危险操作。
- Node.js 第三方依赖与 `preload.js` 同级，并且可被 `require` 解析。
- UI 插件没有使用 `window.exports` + `mode: "none"` 绕开页面入口。
- UI 主背景适配透明材质和暗色模式，没有写死大面积浅色或深色背景。
- 文件处理、命令执行、网络请求有错误处理。
- Windows、macOS、Linux 路径和快捷键差异已处理。
- 插件进入、退出、重复打开时状态不会错乱。
- 构建命令能成功执行。
- 最终插件目录中不包含无关源码缓存、`.git`、构建临时文件。

## 常见错误

| 错误 | 修正 |
| --- | --- |
| 把整个源码项目作为插件包 | 只使用构建后的插件应用目录，通常是 `dist/` |
| `plugin.json` 中写了注释 | JSON 不支持注释，必须删除 |
| 平台限制写在 `features[].platform` | 移到 `plugin.json` 顶层 `platform` |
| `preload.js` 使用 `import` | 改为 CommonJS `require` |
| Vite 项目根目录是 ESM，构建后 `preload.js` 不能 `require` | 在 `public/package.json` 写 `{ "type": "commonjs" }` 并随构建复制到 `dist/` |
| UI 插件使用 `window.exports` + `mode: "none"` | 删除 `window.exports`，改用 `ztools.onPluginEnter` 接收入口参数 |
| UI 背景写死为纯白、浅灰或深色 | 使用透明背景、CSS 变量和 `prefers-color-scheme` 适配 ZTools 材质与暗色模式 |
| Node.js 依赖被打包压缩 | 保持依赖源码可读并放在 `preload.js` 同级 |
| `main` 指向开发服务器但生产包中不可用 | 生产 `main` 指向本地 HTML，开发地址放 `development.main` |
| 使用 `over` 但没有长度限制 | 设置合理的 `minLength` 和 `maxLength` |
| 文件处理直接覆盖原文件 | 默认生成新文件或询问保存位置 |
| 异步 API 当同步 API 使用 | 查看返回值，Promise API 必须 `await` |
| 跨平台快捷键固定为 `control` | macOS 使用 `command`，其他系统使用 `control` |

## 给 AI 的输出格式建议

当 AI 交付 ZTools 插件代码时，建议按以下格式说明：

```text
已实现：
- 插件配置：plugin.json
- 本地能力：preload.js
- 前端页面：index.html / src/*
- 触发方式：说明 feature 和 cmds

运行：
- npm install
- npm run dev
- npm run build

验证：
- 检查 dist/ 是否包含 plugin.json、index.html、preload.js、logo.png
- 在 ZTools 中用指定关键词触发插件
```

如果无法完成构建或验证，必须明确说明阻塞原因和下一步需要用户提供的信息。
