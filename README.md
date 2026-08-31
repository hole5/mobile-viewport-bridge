# Mobile Viewport Bridge

Cursor / VS Code 扩展：**手机视窗实时预览** + **可视化编辑** + **MCP 双向通道**（本期不含 APK 运行时）。

## Product page (for Creem / support)

- **Product site:** https://hole5.github.io/mobile-viewport-bridge/
- **Repository:** https://github.com/hole5/mobile-viewport-bridge
- **Support email:** tnyuan2005@gmail.com
- **Sponsorship:** optional one-time **$5** “Support Development” (digital, no physical goods)

English summary for reviewers: Mobile Viewport Bridge (MVB) is an independent-developer IDE extension for phone-frame preview and visual editing in Cursor/VS Code. Monetization is currently a simple one-time sponsorship checkout via Creem.

## 快速开始

### 1. 安装依赖并构建

```bash
cd mobile-viewport-bridge
npm install
npm run build
```

### 2. 启动演示页

```bash
npm run demo
# http://127.0.0.1:5173
```

### 3. 配置 MCP（Cursor）

复制并按本机路径修改 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "mobile-viewport-bridge": {
      "command": "node",
      "args": [
        "D:/stitch_parent_child_design_system/mobile-viewport-bridge/packages/mcp-server/dist/server.js"
      ],
      "env": {
        "MVB_WS_PORT": "3847"
      }
    }
  }
}
```

在 Cursor Settings → MCP 中确认服务器已连接，然后再开扩展面板（扩展会连 `ws://127.0.0.1:3847`）。

### 4. 安装 / 调试扩展

**安装 VSIX（推荐）**

已打包文件：

- `mobile-viewport-bridge/mobile-viewport-bridge-0.1.0.vsix`
- `mobile-viewport-bridge/packages/extension/mobile-viewport-bridge-0.1.0.vsix`

在 Cursor 中：

1. `Ctrl+Shift+P` → **Extensions: Install from VSIX…**
2. 选择上述 `.vsix`
3. 重载窗口后，命令面板执行 **Mobile Viewport: Open**

重新打包：

```bash
cd packages/extension
npm run package
```

**调试（开发）**

1. 用 Cursor/VS Code 打开 `mobile-viewport-bridge` 文件夹
2. 运行 `npm run build -w mobile-viewport-bridge`
3. 按 F5 启动 Extension Development Host
4. 命令面板执行：`Mobile Viewport: Open`

### 5. 验收 MCP（无需扩展）

```bash
npm run test:mcp
```

## 工作流

1. 打开手机视窗，加载 `http://127.0.0.1:5173`
2. 点击页面元素 → 右侧改文本/颜色/间距 → **写入预览**
3. 点 **应用到代码**：
   - **文本**：扩展本地直接改源码
   - **样式 / 属性 / 位移**：自动唤起 Cursor Agent，按 MCP pending 严格回写
   - 间距与拖动坐标按 **4px 网格**对齐；Agent 写完需自检
4. Agent 调用：
   - `viewport_get_pending_edits`
   - 改源码并校验
   - `viewport_apply_edit_result`
   - `viewport_reload`（可选）

## 包结构

- `packages/shared` — 协议与设备预设
- `packages/mcp-server` — stdio MCP + WS 桥
- `packages/extension` — Cursor/VS Code 扩展
- `examples/demo-web` — Vite 演示页

## 限制（MVP）

- 点选编辑依赖本地代理注入脚本（默认 `127.0.0.1:3848`）
- 截图工具仅返回元数据，完整截图后续增强
- 不包含 APK / Android Emulator
- 源码文件映射靠 selector + Agent 搜索，无 source map

## 协议

见 [docs/PROTOCOL.md](./docs/PROTOCOL.md)
