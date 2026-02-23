# 第一个插件

本指南将帮助你使用 `@ztools-center/plugin-cli` 快速创建你的第一个 ZTools 插件，并发布到插件中心。

## 前置要求

在开始之前，请确保你已经安装了以下工具：

- **Node.js** >= 16.0.0
- **npm** 或 **pnpm** 包管理器
- **Git**（用于版本控制和发布）

## 安装 CLI 工具

首先，全局安装 ZTools 插件 CLI 工具：

```bash
npm install -g @ztools-center/plugin-cli
# 或
pnpm add -g @ztools-center/plugin-cli
```

安装完成后，你可以使用 `ztools` 命令来创建和管理插件。

## 创建第一个插件

### 步骤 1: 创建插件项目

使用 CLI 工具创建一个新的插件项目：

```bash
ztools create my-first-plugin
```

这个命令会引导你完成以下步骤：

1. **选择模板** - 你可以选择以下三种模板之一：
   - **Vue + TypeScript + Vite** - 使用 Vue 3 开发插件 UI
   - **React + TypeScript + Vite** - 使用 React 开发插件 UI
   - **Preload Only (TypeScript)** - 仅使用 Preload API，无 UI 界面

2. **输入插件信息**：
   - **Plugin name** - 插件唯一标识（ID），用于系统内部识别
   - **Plugin title** - 插件显示名称（在 ZTools 中展示给用户的标题）
   - **Plugin description** - 插件描述
   - **Author** - 作者名称

### 步骤 2: 进入项目目录

创建完成后，进入项目目录：

```bash
cd my-first-plugin
```

### 步骤 3: 安装依赖

根据你选择的包管理器安装依赖：

```bash
npm install
# 或
pnpm install
```

### 步骤 4: 开发插件

现在你可以开始开发你的插件了。根据你选择的模板，项目结构会有所不同：

- **Vue/React 模板**：在 `src/` 目录下开发 UI 组件
- **Preload Only 模板**：在 `src/` 目录下编写 Preload 脚本

开发时，你可以运行开发服务器：

```bash
npm run dev
# 或
pnpm run dev
```

### 步骤 5: 构建插件

开发完成后，构建插件：

```bash
npm run build
# 或
pnpm run build
```

构建产物会输出到 `dist/` 目录。这个目录就是你的插件应用，可以打包提交。

## 发布插件

当你完成插件开发并准备好发布时，可以使用 CLI 工具将插件发布到 ZTools 插件中心。

### 前置条件

在发布之前，请确保：

1. ✅ 项目包含 `plugin.json` 文件（CLI 会自动生成）
2. ✅ 已初始化 Git 仓库（`git init`）
3. ✅ 至少有一次提交记录

### 初始化 Git 仓库

如果还没有初始化 Git 仓库，请执行：

```bash
git init
git add .
git commit -m "Initial commit"
```

### 发布流程

执行发布命令：

```bash
ztools publish
```

#### 首次发布

首次执行 `ztools publish` 时，CLI 会：

1. **GitHub OAuth 认证** - 自动打开浏览器进行 GitHub OAuth 认证
2. **保存 Token** - 授权成功后，Token 将保存到本地（`~/.config/ztools/cli-config.json`）
3. **Fork 仓库** - 自动 Fork ZTools 中心插件仓库（如果尚未 fork）
4. **创建插件分支** - 创建名为 `plugin/{插件名称}` 的分支
5. **重放提交历史** - 将所有 commit 历史重放到插件目录
6. **推送到远程** - 推送到你的 fork 仓库
7. **创建 Pull Request** - 自动创建 PR 到中心仓库

#### 后续发布

如果你修改了插件并再次执行 `ztools publish`，将会：

- 保留所有新的 commit 历史
- 创建新的 Pull Request

### 发布后的步骤

发布成功后，CLI 会显示 Pull Request 链接。接下来：

1. **访问 PR 链接** - 查看 Pull Request 详情
2. **等待审核** - 等待维护者审核你的插件
3. **插件上线** - PR 合并后，你的插件将在插件中心上线

## 项目结构

创建的项目通常包含以下结构：

```
my-first-plugin/
├── plugin.json          # 插件配置文件
├── package.json         # 项目依赖配置
├── tsconfig.json        # TypeScript 配置
├── vite.config.js       # Vite 构建配置（如果使用 Vite 模板）
├── src/                 # 源代码目录
│   ├── preload.ts       # Preload 脚本
│   └── ...              # 其他源文件
├── public/              # 静态资源
│   └── logo.png         # 插件 Logo
└── dist/                # 构建输出目录（构建后生成）
```

## 常见问题

### Q: 如何修改插件配置？

A: 编辑项目根目录下的 `plugin.json` 文件。你可以修改插件标识（name）、显示名称（title）、描述、功能列表等。更多信息请参考 [plugin.json 配置](./plugin-json.md)。

### Q: 如何添加插件功能？

A: 在 `plugin.json` 的 `features` 数组中添加功能配置。每个功能需要定义：
- `code` - 功能唯一标识
- `explain` - 功能说明
- `cmds` - 触发指令列表

### Q: 发布失败怎么办？

A: 检查以下几点：
- 确保在插件项目根目录下执行命令
- 确保已初始化 Git 并至少有一次提交
- 确保 `plugin.json` 文件存在且格式正确
- 检查网络连接和 GitHub 认证状态

### Q: 如何更新已发布的插件？

A: 修改代码后，提交更改并再次执行 `ztools publish`。CLI 会创建新的 Pull Request。

## 下一步

- 📖 了解 [插件应用目录结构](./file-structure.md)
- 📖 学习 [plugin.json 配置](./plugin-json.md)
- 📖 查看 [插件 API 文档](./plugin-api.md)
- 📖 阅读 [preload.js 说明](./preload-js.md)

## 相关资源

- [ZTools GitHub 仓库](https://github.com/ZToolsCenter/ZTools)
- [API 类型定义](https://www.npmjs.com/package/@ztools-center/ztools-api-types)
- [插件 CLI 工具](https://www.npmjs.com/package/@ztools-center/plugin-cli)

