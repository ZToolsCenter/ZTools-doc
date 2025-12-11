# ZTools 文档

这是 ZTools 插件系统的官方文档项目，使用 VitePress 构建。

## 项目简介

ZTools 是一个强大、可扩展的插件系统，支持跨平台运行（Windows、macOS、Linux）。通过简单的配置和丰富的 API，开发者可以轻松创建自定义插件来提升生产力。

### 主要特性

- **简单配置** - 通过标准的 `plugin.json` 文件轻松定义插件，无需复杂的设置
- **丰富的 API** - 通过全局 `ztools` 对象访问系统能力，包括通知、模拟输入和持久化存储
- **灵活的指令** - 使用文本、正则或全局钩子触发插件，适应任何工作流
- **跨平台** - 一次构建，在 Windows、macOS 和 Linux 上运行

## 技术栈

- [VitePress](https://vitepress.dev/) - 基于 Vite 的静态站点生成器
- Node.js - 运行环境

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

启动本地开发服务器：

```bash
npm run docs:dev
```

文档将在 `http://localhost:5173` 上运行。

### 构建文档

构建生产版本的文档：

```bash
npm run docs:build
```

构建后的文件将输出到 `docs/.vitepress/dist` 目录。

### 预览构建结果

预览构建后的文档：

```bash
npm run docs:preview
```

## 项目结构

```
doc/
├── docs/                    # 文档源文件
│   ├── index.md            # 首页
│   ├── file-structure.md   # 插件应用目录结构
│   ├── plugin.json.md      # plugin.json 配置说明
│   ├── plugin-api.md       # 插件 API 文档
│   ├── preload.js.md       # preload.js 说明
│   ├── node.js.md          # Node.js 相关文档
│   └── public/             # 静态资源
│       └── logo.png        # Logo 图片
├── package.json            # 项目配置
└── README.md              # 本文件
```

## 文档内容

- [插件应用目录结构](./docs/file-structure.md) - 了解插件应用的文件结构
- [plugin.json 配置](./docs/plugin.json.md) - 插件配置文件说明
- [插件 API](./docs/plugin-api.md) - 完整的 API 参考文档
- [preload.js](./docs/preload.js.md) - 预加载脚本说明
- [Node.js](./docs/node.js.md) - Node.js 相关功能

## 开发说明

### 添加新文档

1. 在 `docs/` 目录下创建新的 Markdown 文件
2. 在 `docs/.vitepress/config.js` 中配置导航（如果存在）
3. 使用标准的 Markdown 语法编写文档

### 文档格式

文档使用 Markdown 格式编写，支持 VitePress 的所有特性，包括：

- Front Matter（YAML 前置元数据）
- 代码高亮
- 自定义组件
- 搜索功能

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进文档。

