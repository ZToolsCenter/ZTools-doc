# 插件 API 文档

ZTools 为插件提供了一套丰富的 API，通过全局对象 `window.ztools` 暴露。

## 基础 API

### `ztools.getAppName()`
获取应用名称。

- **返回**: `string` - 应用名称，固定返回 `'ZTools'`。

### `ztools.getPathForFile(file)`
获取拖放文件的真实路径。用于处理用户拖放文件到插件界面的场景（基于 Electron `webUtils.getPathForFile`）。

- **file**: `File` - 拖放事件中的 File 对象。
- **返回**: `string` - 文件的本地路径。

### `ztools.isMacOs()` / `ztools.isMacOS()`
检测当前是否为 macOS 系统。

- **返回**: `boolean` - 是否为 macOS。

### `ztools.isWindows()`
检测当前是否为 Windows 系统。

- **返回**: `boolean` - 是否为 Windows。

### `ztools.isLinux()`
检测当前是否为 Linux 系统。

- **返回**: `boolean` - 是否为 Linux。

### `ztools.getNativeId()`
获取设备唯一标识符（32位字符串）。

- **返回**: `string` - 设备唯一标识符。

### `ztools.getAppVersion()`
获取应用版本号。

- **返回**: `string` - 应用版本号。

### `ztools.getWindowType()`
获取当前窗口类型。

- **返回**: `string` - 窗口类型。

### `ztools.isDarkColors()`
检测当前是否为深色主题。

- **返回**: `boolean` - 是否为深色主题。

### `ztools.getUser()`
获取当前登录用户的公开资料。未登录时返回 `null`。

- **返回**: `object | null` - 用户资料，通常包含 `avatar`、`nickname`、`uid`。

### `ztools.getUserTempToken()`
获取当前插件访问 ZTools 服务端的短期鉴权令牌。

- **返回**: `Promise<object>` - `{ token: string, expiredAt: number }`，`expiredAt` 为毫秒级时间戳。

::: tip 插件赞赏支付
需要在插件中发起赞赏或查询当前用户的支付记录时，请阅读独立的 [插件赞赏支付 API](./plugin-payment.md) 文档。
:::

### `ztools.getThemeInfo()`
获取当前主题信息。

- **返回**: `object` - 包含 `isDark`、`primaryColor`、`customColor`、`windowMaterial` 等字段。

### `ztools.onThemeChange(callback)`
监听主题变化。再次注册会替换之前的回调。

- **callback**: `(themeInfo: object) => void` - 主题变化时调用，参数结构与 `getThemeInfo()` 返回值一致。

### `ztools.isDev()`
检查当前插件是否处于开发模式。

- **返回**: `boolean` - 是否处于开发模式。

### `ztools.getWebContentsId()`
获取当前 WebContents ID。

- **返回**: `number` - WebContents ID。

### `ztools.setExpendHeight(height)`
设置插件视图的高度。

- **height**: `number` - 期望的高度（像素）。

### `ztools.showNotification(body)`
显示系统通知。

- **body**: `string` - 通知内容。

### `ztools.showToast(message, options)`
在 ZTools 界面中显示 Toast 提示。

- **message**: `string` - 提示内容。
- **options**: `object` - (可选) Toast 配置，会与 `message` 合并后传给宿主。
- **返回**: `Promise<object>` - 宿主返回的 Toast 操作结果。

### `ztools.sendInputEvent(event)`
发送模拟输入事件。

- **event**: `MouseInputEvent | MouseWheelInputEvent | KeyboardInputEvent` - 输入事件对象。

#### 事件对象结构

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

### `ztools.simulateKeyboardTap(key, ...modifiers)`
模拟键盘按键。

- **key**: `string` - 要按下的键。
- **modifiers**: `string[]` - 修饰键数组（可选）。
- **返回**: `boolean` - 是否成功。

### `ztools.findInPage(text, options)`
在当前插件页面中查找文本。

- **text**: `string` - 要查找的文本。
- **options**: `object` - (可选) 查找选项，可包含 `forward`、`findNext`、`matchCase`、`wordStart`、`medialCapitalAsWordStart`。
- **返回**: `Promise<{ success: boolean, requestId?: number, error?: string }>` - 查找请求结果。

### `ztools.stopFindInPage(action)`
停止页面查找。

- **action**: `'clearSelection' | 'keepSelection' | 'activateSelection'` - (可选) 停止行为，默认 `'clearSelection'`。
- **返回**: `Promise<{ success: boolean, error?: string }>` - 停止查找结果。

### `ztools.onFindInPageResult(callback)` / `ztools.offFindInPageResult(callback)`
监听或取消监听页面查找结果。

- **callback**: `(result: object) => void` - 查找结果回调。结果对象来自 Electron `found-in-page` 事件，包含 `requestId`、`activeMatchOrdinal`、`matches`、`selectionArea`、`finalUpdate` 等字段。

### `ztools.simulateMouseMove(x, y)`
模拟鼠标移动到屏幕坐标。

- **x**: `number` - 屏幕 X 坐标。
- **y**: `number` - 屏幕 Y 坐标。
- **返回**: `boolean` - 是否成功。

### `ztools.simulateMouseClick(x, y)` / `ztools.simulateMouseDoubleClick(x, y)` / `ztools.simulateMouseRightClick(x, y)`
分别模拟鼠标左键单击、左键双击和右键单击。

- **x**: `number` - 屏幕 X 坐标。
- **y**: `number` - 屏幕 Y 坐标。
- **返回**: `boolean` - 是否成功。

### `ztools.showMainWindow()`
显示主窗口。

- **返回**: `Promise<boolean>` - 是否成功。

### `ztools.hideMainWindow(isRestorePreWindow)`
隐藏主窗口，包括此时正在主窗口运行的插件应用。

- **isRestorePreWindow**: `boolean` - (可选) 是否焦点回归到前面的活动窗口，默认 `true`。
- **返回**: `Promise<boolean>` - 是否成功。

### `ztools.outPlugin(isKill)`
退出插件应用，默认将插件应用隐藏后台。

- **isKill**: `boolean` - (可选) 为 `true` 时，将结束运行插件应用 (杀死进程)。
- **返回**: `Promise<boolean>` - 是否成功。

## 事件 API

### `ztools.onPluginEnter(callback)`
监听插件进入事件。当用户打开插件时触发。

- **callback**: `(param: LaunchParam) => void` - 回调函数，接收启动参数。

#### LaunchParam 结构
- `payload`: `any` - 传递的数据（例如搜索框内容）
- `type`: `'text' | 'regex' | 'over'` - 命令类型
  - `'text'`: 文本匹配
  - `'regex'`: 正则表达式匹配
  - `'over'`: 任意文本匹配
- `code`: `string` - 插件 Feature Code (如果是由 Feature 触发)

### `ztools.onPluginOut(callback)`
监听插件退出事件。

- **callback**: `(isKill: boolean) => void` - 回调函数，接收退出参数。
  - `isKill`: 是否为强制退出（杀死进程）。

### `ztools.onPluginDetach(callback)`
监听插件被分离为独立窗口的事件。当用户将插件从主窗口分离时触发。

- **callback**: `() => void` - 回调函数。

### `ztools.onMainPush(callback, selectCallback)`
注册主搜索推送功能。插件可以在主搜索框中提供搜索结果，用户无需进入插件即可看到结果。

- **callback**: `(queryData: any) => object[]` - 查询回调函数，接收搜索数据，返回搜索结果数组。
- **selectCallback**: `(selectData: any) => boolean` - (可选) 用户选择搜索结果时的回调函数。返回 `true` 表示需要进入插件。

### `ztools.onPluginReady(callback)`
兼容旧 API，功能与 `onPluginEnter` 相同。

- **callback**: `(param: LaunchParam) => void` - 回调函数，接收启动参数。

## 搜索框 API

### `ztools.setSubInput(onChange, placeholder, isFocus)`
设置主窗口搜索框的行为（当插件处于活动状态时）。

- **onChange**: `(details: { text: string }) => void` - 当用户在搜索框输入时触发的回调函数。
- **placeholder**: `string` - 搜索框的占位符文本。
- **isFocus**: `boolean` - (可选) 是否自动聚焦搜索框，默认 `true`。

### `ztools.setSubInputValue(text)`
设置子输入框的值。

- **text**: `string` - 要设置的值。

### `ztools.subInputFocus()`
聚焦子输入框。

- **返回**: `boolean` - 是否成功。

### `ztools.subInputBlur()`
子输入框失去焦点，插件应用获得焦点。

- **返回**: `boolean` - 是否成功。

### `ztools.subInputSelect()`
子输入框获得焦点并选中全部内容。

- **返回**: `boolean` - 是否成功。

### `ztools.removeSubInput()`
移除（隐藏）子输入框。

- **返回**: `Promise<boolean>` - 是否成功。

## 数据库 API

插件拥有独立的数据库存储空间（Bucket），以插件名称隔离。

### `ztools.db.put(doc)`
保存数据。

- **doc**: `object` - 文档对象（必须包含 `_id` 字段）。
- **返回**: `object` - 保存后的文档对象（包含 `_id` 和 `_rev`）。

### `ztools.db.get(id)`
获取数据。

- **id**: `string` - 文档 ID。
- **返回**: `object | null` - 文档对象，不存在则返回 `null`。

### `ztools.db.remove(docOrId)`
删除数据。

- **docOrId**: `object | string` - 要删除的文档对象（通常包含 `_id` 和 `_rev`）或文档 ID。
- **返回**: `object` - 删除结果。

### `ztools.db.bulkDocs(docs)`
批量操作文档。

- **docs**: `object[]` - 文档数组。
- **返回**: `object[]` - 操作结果数组。

### `ztools.db.allDocs(key)`
获取所有文档或按 key 前缀查询。

- **key**: `string` - (可选) 文档 ID 前缀，用于过滤。
- **返回**: `object[]` - 文档数组。

### `ztools.db.postAttachment(id, attachment, type)`
为文档添加附件。

- **id**: `string` - 文档 ID。
- **attachment**: `string | Buffer` - 附件内容（base64 字符串或 Buffer）。
- **type**: `string` - 附件 MIME 类型。
- **返回**: `object` - 操作结果。

### `ztools.db.getAttachment(id)`
获取文档附件。

- **id**: `string` - 文档 ID。
- **返回**: `Buffer` - 附件内容。

### `ztools.db.getAttachmentType(id)`
获取文档附件的 MIME 类型。

- **id**: `string` - 文档 ID。
- **返回**: `string` - MIME 类型。

### Promise API

数据库 API 还提供了 Promise 版本，位于 `window.ztools.db.promises` 下，所有方法签名与同步版本相同，但返回 `Promise`。

- `window.ztools.db.promises.put(doc)`
- `window.ztools.db.promises.get(id)`
- `window.ztools.db.promises.remove(docOrId)`
- `window.ztools.db.promises.bulkDocs(docs)`
- `window.ztools.db.promises.allDocs(key)`
- `window.ztools.db.promises.postAttachment(id, attachment, type)`
- `window.ztools.db.promises.getAttachment(id)`
- `window.ztools.db.promises.getAttachmentType(id)`

## dbStorage API

类似 `localStorage` 的简化接口，用于简单的键值对存储。

### `ztools.dbStorage.setItem(key, value)`
保存数据。

- **key**: `string` - 键名。
- **value**: `any` - 要保存的数据（会自动序列化为 JSON）。

### `ztools.dbStorage.getItem(key)`
获取数据。

- **key**: `string` - 键名。
- **返回**: `any` - 数据内容，不存在则返回 `null`。

### `ztools.dbStorage.removeItem(key)`
删除数据。

- **key**: `string` - 键名。

## 动态 Feature API

### `ztools.getFeatures(codes)`
获取动态添加的 features。

- **codes**: `string[]` - (可选) 指定要获取的 feature codes，不传则返回所有。
- **返回**: `object[]` - Feature 数组。

### `ztools.setFeature(feature)`
设置动态 feature（如果已存在则更新）。

- **feature**: `object` - Feature 对象。
- **返回**: `boolean` - 是否成功。

### `ztools.removeFeature(code)`
删除指定的动态 feature。

- **code**: `string` - Feature code。
- **返回**: `boolean` - 是否成功。

## 剪贴板 API

### `ztools.clipboard.getHistory(page, pageSize, filter)`
获取剪贴板历史记录。

- **page**: `number` - 页码，从 1 开始。
- **pageSize**: `number` - 每页数量。
- **filter**: `string` - (可选) 过滤条件。
- **返回**: `Promise<object>` - 历史记录数据。

### `ztools.clipboard.search(keyword)`
搜索剪贴板历史。

- **keyword**: `string` - 搜索关键词。
- **返回**: `Promise<object[]>` - 匹配的记录数组。

### `ztools.clipboard.delete(id)`
删除剪贴板记录。

- **id**: `string` - 记录 ID。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

### `ztools.clipboard.clear(type)`
清空剪贴板历史。

- **type**: `string` - (可选) 类型过滤。
- **返回**: `Promise<{ success: boolean, count: number }>` - 是否成功及清除数量。

### `ztools.clipboard.getStatus()`
获取剪贴板状态。

- **返回**: `Promise<object>` - 状态信息。

### `ztools.clipboard.write(id, shouldPaste)`
将指定记录写入剪贴板。

- **id**: `string` - 记录 ID。
- **shouldPaste**: `boolean` - (可选) 是否同时模拟粘贴操作，默认 `true`。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

### `ztools.clipboard.writeContent(data, shouldPaste)`
写入内容到剪贴板。

- **data**: `object` - 数据对象。
  - `type`: `'text' | 'image' | 'file'` - 内容类型。
  - `content`: `string | string[]` - 文本、图片内容，或单个文件路径/文件路径数组。`text` 和 `image` 类型要求为字符串。
- **shouldPaste**: `boolean` - (可选) 是否同时模拟粘贴操作，默认 `true`。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

### `ztools.clipboard.updateConfig(config)`
更新剪贴板配置。

- **config**: `object` - 配置对象。
- **返回**: `Promise<{ success: boolean }>` - 是否成功。

### `ztools.clipboard.onChange(callback)`
监听剪贴板变化事件。

- **callback**: `(item: object) => void` - 回调函数，接收剪贴板变化项。

### `ztools.copyText(text)`
复制文本到剪贴板。

- **text**: `string` - 要复制的文本。
- **返回**: `boolean` - 是否成功。

### `ztools.copyImage(image)`
复制图片到剪贴板。

- **image**: `string | Buffer | Uint8Array` - 图片 base64 Data URL、文件路径或图片二进制数据。
- **返回**: `boolean` - 是否成功。

### `ztools.copyFile(filePath)`
复制文件到剪贴板。

- **filePath**: `string | string[]` - 单个文件路径或文件路径数组。
- **返回**: `boolean` - 是否成功。

### `ztools.getCopyedFiles()`
获取当前系统剪贴板中的文件或文件夹列表。方法名中的 `Copyed` 为兼容现有 API 的拼写。

- **返回**: `object[]` - 文件项数组，每项包含 `path`、`name`、`isFile`、`isDirectory`。

## 文件操作 API

### `ztools.getPath(name)`
获取系统路径。

- **name**: `string` - 路径名称（如 `'home'`, `'desktop'`, `'documents'` 等）。
- **返回**: `string` - 路径。

### `ztools.showSaveDialog(options)`
弹出文件保存对话框。

- **options**: `SaveDialogOptions` - 对话框配置，与 Electron `showSaveDialogSync` 保持一致。
- **返回**: `string | undefined` - 选择的路径。用户取消则返回 `undefined`。

### `ztools.showOpenDialog(options)`
弹出文件打开对话框。

- **options**: `OpenDialogOptions` - 对话框配置，与 Electron `showOpenDialogSync` 保持一致。
- **返回**: `string[] | undefined` - 选择的文件路径数组。用户取消则返回 `undefined`。

### `ztools.screenCapture(callback)`
屏幕截图，会进入截图模式，用户截图完执行回调函数。

- **callback**: `(image: string, bounds: object) => void` - 截图完的回调函数。
  - `image`: 截图的图像 base64 Data Url。
  - `bounds`: 截图区域，包含 `x`、`y`、`width`、`height`。
- **返回**: `Promise<void>` - 截图流程结束后完成。

### `ztools.screenColorPick(callback)`
进入屏幕取色模式，取色成功后调用回调。

- **callback**: `(color: { hex: string, rgb: string }) => void` - 取色结果回调。
- **返回**: `Promise<void>` - 取色流程结束后完成。

### `ztools.startDrag(filePath)`
开始将文件拖动到外部应用。

- **filePath**: `string | string[]` - 要拖动的文件路径或路径数组。

### `ztools.hideMainWindowPasteText(text)` / `ztools.hideMainWindowPasteImage(image)`
隐藏主窗口，并将文本或图片粘贴到之前获得焦点的外部应用。

- **text**: `string` - 要粘贴的文本。
- **image**: `string | Uint8Array` - 图片 Data URL、路径或图片二进制数据。
- **返回**: `boolean` - 是否成功。

### `ztools.hideMainWindowPasteFile(filePath)`
隐藏主窗口，并将文件粘贴到之前获得焦点的外部应用。

- **filePath**: `string | string[]` - 文件路径或路径数组。
- **返回**: `boolean` - 是否成功。

### `ztools.hideMainWindowTypeString(text)`
隐藏主窗口，并向之前获得焦点的外部应用模拟键入字符串。

- **text**: `string` - 要键入的文本。
- **返回**: `boolean` - 是否成功。

## 窗口 API

### `ztools.createBrowserWindow(url, options, callback)`
创建独立窗口。

- **url**: `string` - 窗口加载的 URL。
- **options**: `object` - 窗口选项，与 Electron `BrowserWindow` 构造函数选项保持一致。
- **callback**: `() => void` - (可选) 窗口加载完成后的回调函数。
- **返回**: `object` - 返回带 `id`、`webContents` 和宿主白名单方法的窗口对象。主窗口方法和 `webContents` 方法分别可能是同步方法或返回 Promise 的异步方法，具体方法由当前版本宿主提供。

### `ztools.sendToParent(channel, ...args)`
发送消息到父窗口。

- **channel**: `string` - 通道名称。
- **args**: `any[]` - 要传递的参数。

## 显示器 API

### `ztools.getPrimaryDisplay()`
获取主显示器信息。

- **返回**: `object` - 显示器信息对象。

### `ztools.getAllDisplays()`
获取所有显示器。

- **返回**: `object[]` - 显示器信息数组。

### `ztools.getCursorScreenPoint()`
获取鼠标光标的屏幕坐标。

- **返回**: `object` - 坐标对象 `{ x: number, y: number }`。

### `ztools.getDisplayNearestPoint(point)`
获取最接近指定点的显示器。

- **point**: `object` - 坐标对象 `{ x: number, y: number }`。
- **返回**: `object` - 显示器信息对象。

### `ztools.desktopCaptureSources(options)`
获取桌面捕获源。

- **options**: `object` - 捕获选项。
- **返回**: `Promise<object[]>` - 捕获源数组。

### `ztools.dipToScreenPoint(point)`
DIP 坐标转屏幕物理坐标。

- **point**: `object` - DIP 坐标对象 `{ x: number, y: number }`。
- **返回**: `object` - 屏幕物理坐标对象 `{ x: number, y: number }`。

### `ztools.screenToDipPoint(point)`
屏幕物理坐标转 DIP 坐标。

- **point**: `object` - 屏幕物理坐标对象 `{ x: number, y: number }`。
- **返回**: `object` - DIP 坐标对象 `{ x: number, y: number }`。

### `ztools.dipToScreenRect(rect)`
DIP 区域转屏幕物理区域。

- **rect**: `object` - DIP 区域对象 `{ x: number, y: number, width: number, height: number }`。
- **返回**: `object` - 屏幕物理区域对象 `{ x: number, y: number, width: number, height: number }`。

## Shell API

### `ztools.shellOpenExternal(url)`
使用系统默认程序打开 URL。

- **url**: `string` - 要打开的 URL。
- **返回**: `object` - `{ success: boolean, error?: string }`。

### `ztools.shellOpenPath(fullPath)`
使用系统默认方式打开文件或文件夹。

- **fullPath**: `string` - 文件或文件夹路径。
- **返回**: `object` - `{ success: boolean, error?: string }`。

### `ztools.shellShowItemInFolder(fullPath)`
在文件管理器中显示文件。

- **fullPath**: `string` - 文件路径。
- **返回**: `undefined` - 请求已发送；具体打开结果由系统文件管理器处理。

### `ztools.shellBeep()`
播放系统提示音。

- **返回**: `object` - `{ success: boolean, error?: string }`。

### `ztools.shellTrashItem(fullPath)`
将文件或文件夹移动到系统回收站。

- **fullPath**: `string` - 文件或文件夹路径。
- **返回**: `Promise<{ success: boolean }>` - 是否成功；失败时可能抛出 Error。

### `ztools.readCurrentFolderPath()`
读取当前活动文件管理器窗口的文件夹路径。macOS 支持 Finder，Windows 支持 Explorer。

- **返回**: `Promise<string>` - 当前文件夹路径。

### `ztools.readCurrentBrowserUrl()`
读取当前活动浏览器窗口的 URL。前提是当前活动窗口属于受支持的浏览器。

- **返回**: `Promise<string>` - 当前 URL。

### `ztools.getFileIcon(filePath)`
获取文件系统图标。

- **filePath**: `string` - 文件路径。
- **返回**: `string | null` - 图标的 base64 Data URL；获取失败时为 `null`。

## 其他 API

### `ztools.redirect(label, payload)`
插件跳转。

- **label**: `string | [string, string]` - 指令名称，或 `[插件标题, 指令名称]`。
- **payload**: `string` - (可选) 传递给目标指令的文本。当前实现只按字符串处理非空 payload。
- **返回**: `boolean` - 是否成功。

### `ztools.redirectHotKeySetting(cmdLabel)`
跳转到快捷键设置，并定位到指定指令。

- **cmdLabel**: `string` - 指令名称。
- **返回**: `boolean` - 是否成功。

### `ztools.redirectAiModelsSetting()`
跳转到 AI 模型设置页面。当前设置页已将 AI 模型入口并入 Provider 页面。

- **返回**: `boolean` - 是否成功。

### `ztools.http.setHeaders(headers)`
设置 HTTP 请求头。

- **headers**: `object` - 请求头对象。
- **返回**: `boolean` - 是否成功。

### `ztools.http.getHeaders()`
获取当前请求头配置。

- **返回**: `object` - 请求头对象。

### `ztools.http.clearHeaders()`
清除请求头配置。

- **返回**: `boolean` - 是否成功。

## 工具注册 API

### `ztools.registerTool(name, handler)`
注册一个供 ZTools MCP 服务调用的插件工具。工具必须先在 `plugin.json.tools` 中声明，详见 [plugin.json 配置](./plugin-json.md#tools-工具声明)。

- **name**: `string` - 工具名称，必须与 `plugin.json.tools` 中的 key 一致。
- **handler**: `(input: object) => any | Promise<any>` - 工具处理器，接收调用输入并返回结果。
- **返回**: `void` - 注册成功后结束。
- **异常**: 工具未声明、名称为空或 handler 不是函数时抛出 Error。

```javascript
ztools.registerTool("list_files", async ({ path }) => {
  return { path, entries: [] };
});
```

## Provider API

Provider 支持两种角色：插件可以注册翻译/OCR Provider，也可以消费其他插件或内置 Provider。完整配置和契约见 [Provider 开发指南](./provider-development-guide.md)。

### `ztools.registerProvider(key, handler)`
注册一个翻译或 OCR Provider 的处理器。

- **key**: `string` - 必须与 `plugin.json.providers` 中的 key 一致。
- **handler**: `(input: object) => Promise<object>` - Provider 处理器，输入输出结构由声明的 `type` 决定。
- **返回**: `void` - 注册成功后结束。
- **异常**: key 未声明、为空或 handler 不是函数时抛出 Error。

### `ztools.providers.getProviders(type)`
查询 Provider 列表。

- **type**: `'translation' | 'ocr'` - (可选) 指定类型；省略时返回全部类型。
- **返回**: `Promise<object[]>` - Provider 列表，每项包含 `id`、`type`、`label`、`description`、`source`、`isDefault` 等字段。

### `ztools.providers.getDefaultProvider(type)`
查询指定类型的默认 Provider。

- **type**: `'translation' | 'ocr'` - Provider 类型。
- **返回**: `Promise<object | null>` - 默认 Provider；没有可用 Provider 时返回 `null`。

### `ztools.providers.invokeProvider(type, input, providerId)`
调用 Provider。省略 `providerId` 时使用该类型的默认 Provider。

- **type**: `'translation' | 'ocr'` - Provider 类型。
- **input**: `object` - Provider 输入。
- **providerId**: `string` - (可选) 指定 Provider ID。
- **返回**: `Promise<object>` - Provider 输出。

### `ztools.translate(text, options)`
调用翻译 Provider 的便捷封装。

- **text**: `string` - 待翻译文本。
- **options**: `object` - (可选) `{ from?: string, to?: string, providerId?: string }`。
- **返回**: `Promise<{ text: string, detectedFrom?: string }>` - 翻译结果。

### `ztools.ocr(image, options)`
调用 OCR Provider 的便捷封装。

- **image**: `string` - 图片路径、Data URI 或 URL，具体支持取决于 Provider。
- **options**: `object` - (可选) `{ lang?: string, providerId?: string }`。
- **返回**: `Promise<{ text: string, blocks?: string[], confidence?: number }>` - OCR 结果。

## 浏览器自动化 API

`ztools.zbrowser` 和 `ztools.ubrowser` 都返回一个新的 Builder 实例，方法支持链式调用。调用 `run()` 时才会创建或复用浏览器窗口并执行操作队列。

```javascript
const result = await ztools.zbrowser
  .goto("https://example.com")
  .wait("h1")
  .click("a")
  .evaluate(() => document.title)
  .run({ width: 900, height: 600 })
```

### Builder 方法

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

### `ztools.getIdleUBrowsers()`
获取当前插件的空闲浏览器窗口。

- **返回**: `object[]` - 窗口信息数组，每项包含 `id`、`title`、`url`。

### `ztools.setUBrowserProxy(config)`
设置当前插件浏览器 Session 的代理。ZTools 返回 Promise，与 uTools 的同步 API 不同。

- **config**: `object` - Electron Session 代理配置，例如 `pacScript`、`proxyRules`、`proxyBypassRules`。
- **返回**: `Promise<boolean>` - 是否成功。

### `ztools.clearUBrowserCache()`
清除当前插件浏览器 Session 的缓存。

- **返回**: `Promise<boolean>` - 是否成功。

### `ztools.ubrowserLogin()`
兼容 uTools 的登录接口。

- **返回**: `Promise<null>` - ZTools 当前不支持此功能，固定返回 `null`。

## FFmpeg API

### `ztools.runFFmpeg(args, options)`
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
