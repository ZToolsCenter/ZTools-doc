# 插件 API 文档

ZTools 为插件提供了一套丰富的 API，通过全局对象 `window.ztools` 暴露。

## 基础 API

### `window.ztools.onPluginEnter(callback)`
监听插件进入事件。当用户打开插件时触发。

- **callback**: `(param: LaunchParam) => void` - 回调函数，接收启动参数。

#### LaunchParam 结构
- `payload`: `any` - 传递的数据（例如搜索框内容）
- `type`: `'text' | 'regex' | 'over'` - 命令类型
  - `'text'`: 文本匹配
  - `'regex'`: 正则表达式匹配
  - `'over'`: 任意文本匹配
- `code`: `string` - 插件 Feature Code (如果是由 Feature 触发)

### `window.ztools.setExpendHeight(height)`
设置插件视图的高度。

- **height**: `number` - 期望的高度（像素）。

### `window.ztools.showNotification(body)`
显示系统通知。

- **body**: `string` - 通知内容。

### `window.ztools.sendInputEvent(event)`
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

### `window.ztools.showSaveDialog(options)`
弹出文件保存框。

- **options**: `SaveDialogOptions` - 对话框配置，与 Electron `showSaveDialogSync` 保持一致。
- **返回**: `string | undefined` - 选择的路径。用户取消则返回 `undefined`。

### `window.ztools.screenCapture(callback)`
屏幕截图，会进入截图模式，用户截图完执行回调函数。

- **callback**: `(image: string) => void` - 截图完的回调函数。
  - `image`: 截图的图像 base64 Data Url。

### `window.ztools.hideMainWindow(isRestorePreWindow)`
执行该方法将会隐藏 uTools 主窗口，包括此时正在主窗口运行的插件应用。

- **isRestorePreWindow**: `boolean` - (可选) 是否焦点回归到前面的活动窗口，默认 `true`。
- **返回**: `boolean`

### `window.ztools.outPlugin(isKill)`
退出插件应用，默认将插件应用隐藏后台。

- **isKill**: `boolean` - (可选) 为 `true` 时，将结束运行插件应用 (杀死进程)。
- **返回**: `boolean`



## 搜索框 API

### `window.ztools.setSubInput(onChange, placeholder)`
设置主窗口搜索框的行为（当插件处于活动状态时）。

- **onChange**: `(text: string) => void` - 当用户在搜索框输入时触发的回调函数。
- **placeholder**: `string` - 搜索框的占位符文本。

## 数据库 API

插件拥有独立的数据库存储空间（Bucket），以插件名称隔离。

### `window.ztools.db.put(key, data)`
保存数据。

- **key**: `string` - 键名。
- **data**: `any` - 要保存的数据。

### `window.ztools.db.get(key)`
获取数据。

- **key**: `string` - 键名。
- **返回**: `Promise<any>` - 数据内容。

### `window.ztools.db.remove(doc)`
删除数据。

- **doc**: `object` - 要删除的文档对象（通常包含 `_id` 和 `_rev`）。
