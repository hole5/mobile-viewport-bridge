import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DEVICE_PRESETS, alignStyleOpValue, devicePhoneGeometry, type ViewportSelection } from '@mvb/shared';
import type { McpBridgeClient } from '../bridge/WsClient';
import { PreviewProxy } from '../bridge/PreviewProxy';
import { detectWorkspacePreviews, startPreviewInTerminal } from '../preview/detectPreview';

export class ViewportPanel {
  static current: ViewportPanel | undefined;
  private panel: vscode.WebviewPanel;
  private floatPanel: vscode.WebviewPanel | undefined;
  private proxy: PreviewProxy;
  private url: string;
  private deviceId: string;
  private selection: ViewportSelection | null = null;
  private lastDomSnippet = '';
  private disposed = false;
  private proxyReady = false;
  private webviewReady = false;
  /** 与 webview 横屏开关同步：决定 proxy viewport CSS 宽 */
  private landscape = false;

  static show(context: vscode.ExtensionContext, bridge: McpBridgeClient): void {
    if (ViewportPanel.current) {
      ViewportPanel.current.panel.reveal(vscode.ViewColumn.Beside);
      void ViewportPanel.current.offerPreviewOnOpen();
      return;
    }
    const cfg = vscode.workspace.getConfiguration('mobileViewport');
    const panel = vscode.window.createWebviewPanel(
      'mobileViewport',
      'Mobile Viewport',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'dist', 'media')),
          vscode.Uri.file(path.join(context.extensionPath, 'media')),
        ],
      },
    );
    ViewportPanel.current = new ViewportPanel(
      panel,
      context,
      bridge,
      cfg.get('url', 'http://127.0.0.1:5173'),
      cfg.get('deviceId', 'iphone-16'),
    );
    void ViewportPanel.current.offerPreviewOnOpen();
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private context: vscode.ExtensionContext,
    private bridge: McpBridgeClient,
    url: string,
    deviceId: string,
  ) {
    this.panel = panel;
    this.url = url;
    this.deviceId = deviceId;
    this.proxy = new PreviewProxy(3848);

    this.bridge.setCommandHandler((name, args) => this.handleMcpCommand(name, args));
    this.bridge.onPendingChange(() => {
      this.syncState();
      this.syncPendingToWebview();
    });

    void this.bootstrap();

    this.panel.onDidDispose(() => {
      this.disposed = true;
      this.floatPanel?.dispose();
      this.floatPanel = undefined;
      this.proxy.dispose();
      ViewportPanel.current = undefined;
    });

    this.panel.webview.onDidReceiveMessage((msg) => this.onWebviewMessage(msg));
  }

  private async bootstrap(): Promise<void> {
    // Load UI first so a busy proxy port never leaves a blank webview.
    try {
      this.panel.webview.html = this.getHtml();
    } catch (e) {
      const msg = (e as Error).message;
      this.panel.webview.html = `<!DOCTYPE html><html><body style="margin:0;background:#0a1a1f;color:#f87171;font:13px/1.5 sans-serif;padding:20px">
        <h3 style="color:#fca5a5;margin:0 0 8px">Mobile Viewport UI 加载失败</h3>
        <pre style="white-space:pre-wrap;color:#cbd5e1">${msg.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</pre>
      </body></html>`;
      vscode.window.showErrorMessage(`Mobile Viewport UI 加载失败：${msg}`);
      return;
    }

    try {
      await this.proxy.start();
    } catch (e) {
      vscode.window.showWarningMessage(
        `预览代理启动失败（${(e as Error).message}），将直连 iframe（可能无法点选编辑）。`,
      );
    }
    this.proxyReady = true;
    // 如果 webview 已经就绪但之前代理未启动，补发 configure
    if (this.webviewReady) {
      this.sendConfigureToWebview();
    }
    this.syncState();
  }

  private sendConfigureToWebview(): void {
    this.panel.webview.postMessage({
      type: 'configure',
      url: this.url,
      proxyUrl: this.proxySrc(),
      deviceId: this.deviceId,
      landscape: this.landscape,
      devices: DEVICE_PRESETS,
    });
  }

  reload(): void {
    this.panel.webview.postMessage({ type: 'reload' });
  }

  /** Push URL into webview and trigger proxy load. */
  loadPreviewUrl(url: string): void {
    this.url = url.trim();
    this.sendConfigureToWebview();
    this.syncState();
  }

  /**
   * On open: detect workspace web previews and prompt user to load / start one.
   */
  async offerPreviewOnOpen(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('mobileViewport');
    if (!cfg.get<boolean>('promptPreviewOnOpen', true)) return;

    const candidates = await detectWorkspacePreviews();
    const live = candidates.filter((c) => c.reachable);
    const startable = candidates.filter((c) => !c.reachable && c.script);

    if (live.length) {
      const best = live[0];
      if (live.length === 1) {
        const choice = await vscode.window.showInformationMessage(
          `检测到可预览的 Web 服务：${best.label}。是否加载到手机框进行编辑？`,
          '加载预览',
          '稍后再说',
        );
        if (choice === '加载预览') {
          this.loadPreviewUrl(best.url);
          vscode.window.showInformationMessage(`已加载预览：${best.url}`);
        }
        return;
      }

      type PickItem = vscode.QuickPickItem & { candidate: (typeof live)[number] };
      const picked = await vscode.window.showQuickPick(
        live.map(
          (c): PickItem => ({
            label: c.label,
            description: c.url,
            candidate: c,
          }),
        ),
        { title: '选择要加载到 Mobile Viewport 的 Web 预览', placeHolder: '已在运行的本地服务' },
      );
      if (picked) {
        this.loadPreviewUrl(picked.candidate.url);
        vscode.window.showInformationMessage(`已加载预览：${picked.candidate.url}`);
      }
      return;
    }

    if (startable.length) {
      const best = startable[0];
      const action = await vscode.window.showInformationMessage(
        `当前工作区有可预览项目（${best.label}），但服务未启动。扩展需要本地 Web 预览才能在手机框里点选编辑。`,
        '启动预览',
        '稍后手动加载',
      );
      if (action === '启动预览') {
        const started = await startPreviewInTerminal(best);
        const again = await vscode.window.showInformationMessage(
          `已在空闲端口启动预览：${started.url}（npm run ${started.script}）。服务就绪后点击加载。`,
          '加载预览',
        );
        if (again === '加载预览') {
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 800));
            try {
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 700);
              const res = await fetch(started.url, { method: 'GET', redirect: 'manual', signal: ctrl.signal });
              clearTimeout(timer);
              if (res.status > 0) {
                this.loadPreviewUrl(started.url);
                vscode.window.showInformationMessage(`已加载预览：${started.url}`);
                return;
              }
            } catch {
              /* wait */
            }
          }
          this.loadPreviewUrl(started.url);
          vscode.window.showWarningMessage(
            `已尝试加载 ${started.url}。若仍失败，请等终端出现 Local 地址后再点面板「加载」。`,
          );
        }
      }
      return;
    }

    await vscode.window.showInformationMessage(
      '未在工作区检测到正在运行的 Web 预览。请先在项目中启动前端（如 npm run dev），再在面板填写 URL 并点「加载」。',
      '知道了',
    );
  }

  buildApplyPrompt(): string {
    const edits = this.bridge.pendingLocal;
    return [
      '请调用 MCP 工具 viewport_get_pending_edits 获取可视化编辑队列，',
      '根据每条 edit 的 selector 与 ops 修改项目源码（文本已由扩展本地处理时可跳过），',
      '完成后调用 viewport_apply_edit_result（传入 editIds，reload: true）。',
      '',
      `当前本地 pending 数量: ${edits.length}`,
      edits.length ? `本地预览: ${JSON.stringify(edits, null, 2)}` : '',
    ].join('\n');
  }

  private syncPendingToWebview(): void {
    this.panel.webview.postMessage({
      type: 'pending_sync',
      edits: this.bridge.pendingLocal,
      pendingCount: this.bridge.pendingLocal.length,
    });
    this.floatPanel?.webview.postMessage({
      type: 'pending_sync',
      edits: this.bridge.pendingLocal,
      pendingCount: this.bridge.pendingLocal.length,
    });
  }

  /**
   * Hybrid apply:
   * 1) text ops → local workspace rewrite
   * 2) style / attr / move (+ failed text) → Cursor Agent via MCP
   */
  async applyToCodeViaMcpAgent(): Promise<void> {
    const edits = this.bridge.pendingLocal;
    if (!edits.length) {
      vscode.window.showWarningMessage('没有 pending 编辑可应用。请先在预览中写入改动。');
      return;
    }

    const { partitionPendingEdits } = await import('../apply/partitionEdits');
    const { applyTextEditsLocally } = await import('../apply/applyTextEdits');
    const {
      alignEditsForAgent,
      buildMcpApplyAgentPrompt,
      invokeCursorAgentWithPrompt,
    } = await import('../agent/invokeCursorAgent');

    const { textOnly, agentEdits } = partitionPendingEdits(edits);

    this.panel.webview.postMessage({
      type: 'apply_progress',
      phase: 'text',
      message: textOnly.length
        ? `正在本地回写 ${textOnly.length} 条文本…`
        : '无纯文本改动，准备交由 Agent…',
    });

    const textResult = textOnly.length
      ? await applyTextEditsLocally(textOnly)
      : { appliedIds: [] as string[], failed: [] as { id: string; reason: string }[], filesChanged: [] as string[] };

    // Failed text edits stay for Agent; successful pure-text drops out (not in agentEdits)
    const failedTextEdits = textOnly.filter((e) => textResult.failed.some((f) => f.id === e.id));
    const remainingForAgent = alignEditsForAgent([...agentEdits, ...failedTextEdits]);

    // Replace MCP/extension queue with only what Agent still needs
    this.bridge.setPendingQueue(remainingForAgent);
    this.syncState();
    this.syncPendingToWebview();

    if (!remainingForAgent.length) {
      this.reload();
      const files = textResult.filesChanged.length
        ? `文件：${textResult.filesChanged.map((f) => vscode.workspace.asRelativePath(f)).join(', ')}`
        : '';
      vscode.window.showInformationMessage(
        `文本已本地回写（${textResult.appliedIds.length} 条）。${files}`.trim(),
      );
      this.panel.webview.postMessage({
        type: 'apply_progress',
        phase: 'done',
        message: '文本已本地回写，无需 Agent',
      });
      return;
    }

    const prompt = buildMcpApplyAgentPrompt({
      editsJson: JSON.stringify(remainingForAgent, null, 2),
      pendingCount: remainingForAgent.length,
      textAppliedIds: textResult.appliedIds,
      textFailed: textResult.failed,
      textFilesChanged: textResult.filesChanged,
    });
    this.bridge.requestApply();

    this.panel.webview.postMessage({
      type: 'apply_progress',
      phase: 'agent',
      message: `正在交由 Agent 回写 ${remainingForAgent.length} 条非文本改动…`,
    });

    const result = await invokeCursorAgentWithPrompt(prompt);
    if (result.mode === 'agent') {
      const textNote = textResult.appliedIds.length
        ? `文本本地 ${textResult.appliedIds.length} 条；`
        : '';
      vscode.window.showInformationMessage(
        `${textNote}已打开 Cursor Agent 处理 ${remainingForAgent.length} 条（样式/属性/位移，含网格对齐与自检）。`,
      );
    } else {
      vscode.window.showWarningMessage(
        '剩余改动已同步到 MCP 并复制提示词。未能自动打开 Agent，请在 Chat/Agent 中粘贴后发送。',
      );
    }
  }

  private syncState(): void {
    this.bridge.pushState({
      url: this.url,
      deviceId: this.deviceId,
      connected: true,
      selection: this.selection,
      pendingCount: this.bridge.pendingLocal.length,
    });
  }

  private proxySrc(): string {
    try {
      const device = DEVICE_PRESETS.find((d) => d.id === this.deviceId) || DEVICE_PRESETS[0];
      // 横屏：CSS 视口宽 = 竖屏高；竖屏：CSS 视口宽 = 竖屏宽
      const viewportWidth = this.landscape ? device.height : device.width;
      return this.proxy.proxyUrl(this.url, device.userAgent, viewportWidth);
    } catch {
      return this.url;
    }
  }

  private async handleMcpCommand(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'open':
        if (args.url) this.url = String(args.url);
        if (args.deviceId) this.deviceId = String(args.deviceId);
        this.sendConfigureToWebview();
        this.syncState();
        return { opened: true, url: this.url, deviceId: this.deviceId };

      case 'set_device':
        this.deviceId = String(args.deviceId);
        // 重建 proxyUrl（UA + 设备 CSS 宽），使上游与 viewport meta 跟随机型
        this.sendConfigureToWebview();
        this.syncState();
        return { deviceId: this.deviceId };

      case 'reload':
        this.reload();
        return { reloaded: true };

      case 'highlight':
        this.panel.webview.postMessage({
          type: 'highlight',
          selector: args.selector,
          nodeId: args.nodeId,
        });
        return { highlighted: true, selector: args.selector };

      case 'dom_snippet':
        this.panel.webview.postMessage({
          type: 'dom_snippet',
          selector: args.selector,
          nodeId: args.nodeId,
        });
        await new Promise((r) => setTimeout(r, 200));
        return { snippet: this.lastDomSnippet || this.selection };

      case 'screenshot':
        return {
          note: 'Webview screenshot capture is limited in MVP; use OS snip or browser DevTools for now.',
          selection: this.selection,
          url: this.url,
          deviceId: this.deviceId,
        };

      default:
        throw new Error(`Unknown command: ${name}`);
    }
  }

  private onWebviewMessage(msg: Record<string, unknown>): void {
    const type = String(msg.type || '');
    if (type === 'ready') {
      this.webviewReady = true;
      // 等代理就绪后再发送 configure，避免 iframe 在代理准备好前加载
      if (this.proxyReady) {
        this.sendConfigureToWebview();
      }
      return;
    }
    if (type === 'url_change') {
      this.url = String(msg.url || this.url);
      this.sendConfigureToWebview();
      this.syncState();
      return;
    }
    if (type === 'device_change') {
      this.deviceId = String(msg.deviceId || this.deviceId);
      // 重建 proxyUrl（UA + vw）并重新加载，保证机型一致
      this.sendConfigureToWebview();
      this.syncState();
      return;
    }
    if (type === 'orientation_change') {
      this.landscape = !!msg.landscape;
      // 横竖屏切换必须重载：viewport meta 的 width 需要变成长边/短边
      this.sendConfigureToWebview();
      this.syncState();
      return;
    }
    if (type === 'selection_change') {
      this.selection = msg.payload as ViewportSelection;
      this.bridge.pushEvent({
        eventSource: 'viewport_user_action',
        eventType: 'selection_change',
        payload: this.selection as unknown as Record<string, unknown>,
        timestamp: new Date().toISOString(),
        sessionId: 'extension',
      });
      this.syncState();
      return;
    }
    if (type === 'text_change' || type === 'prop_change' || type === 'image_replace') {
      const payload = msg.payload as Record<string, unknown>;
      const selector = String(payload.selector || this.selection?.selector || '');
      const nodeId = String(payload.nodeId || this.selection?.nodeId || 'unknown');
      if (type === 'text_change') {
        this.bridge.createPending({
          nodeId,
          selector,
          ops: [{ type: 'text', value: String(payload.newText || '') }],
        });
      } else if (type === 'prop_change') {
        const prop = String(payload.prop || '');
        const raw = String(payload.new || payload.value || '');
        this.bridge.createPending({
          nodeId,
          selector,
          ops: [{ type: 'style', prop, value: alignStyleOpValue(prop, raw) }],
        });
      } else {
        this.bridge.createPending({
          nodeId,
          selector,
          ops: [{ type: 'attr', name: 'src', value: String(payload.newSrc || '') }],
        });
      }
      this.bridge.pushEvent({
        eventSource: 'viewport_user_action',
        eventType: type,
        payload,
        timestamp: new Date().toISOString(),
        sessionId: 'extension',
      });
      this.syncState();
      return;
    }
    if (type === 'dom_snippet') {
      this.lastDomSnippet = JSON.stringify(msg.payload || {});
      return;
    }
    if (type === 'apply_to_code') {
      void this.applyToCodeViaMcpAgent();
      return;
    }
    if (type === 'pip_detach') {
      void this.openFloatPreview(msg);
      return;
    }
    if (type === 'pip_attach') {
      this.closeFloatPreview();
      return;
    }
  }

  private closeFloatPreview(): void {
    if (this.floatPanel) {
      this.floatPanel.dispose();
      this.floatPanel = undefined;
    }
    this.panel.webview.postMessage({ type: 'pip_attach_done' });
  }

  private async openFloatPreview(msg: Record<string, unknown>): Promise<void> {
    const url = String(msg.url || this.url);
    const proxyUrl = String(msg.proxyUrl || this.proxySrc());
    const deviceId = String(msg.deviceId || this.deviceId);
    const device =
      DEVICE_PRESETS.find((d) => d.id === deviceId) || DEVICE_PRESETS[0];
    const geometry = devicePhoneGeometry(device);
    const shellW = Number(msg.shellW) || geometry.shellW;
    const shellH = Number(msg.shellH) || geometry.shellH;

    if (this.floatPanel) {
      this.floatPanel.reveal(undefined, false);
    } else {
      this.floatPanel = vscode.window.createWebviewPanel(
        'mobileViewportFloat',
        '悬浮预览',
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'media')),
            vscode.Uri.file(path.join(this.context.extensionPath, 'media')),
          ],
        },
      );
      this.floatPanel.webview.onDidReceiveMessage((m) => this.onWebviewMessage(m));
      this.floatPanel.onDidDispose(() => {
        this.floatPanel = undefined;
        if (!this.disposed) {
          this.panel.webview.postMessage({ type: 'pip_attach_done' });
        }
      });
    }

    this.floatPanel.webview.html = this.getFloatHtml({
      url,
      proxyUrl,
      deviceName: device.name,
      screenW: geometry.screenW,
      screenH: geometry.screenH,
      shellW,
      shellH,
      insetTop: geometry.inset.top,
      insetSide: geometry.inset.left,
      insetBottom: geometry.inset.bottom,
      insetRight: geometry.inset.right,
      radius: geometry.inset.radius,
    });

    // 尽量移到独立 IDE 窗口（可拖出主窗；仍属 Cursor，不是系统浏览器）
    this.floatPanel.reveal(undefined, false);
    try {
      await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
    } catch {
      /* older hosts may lack the command */
    }

    this.panel.webview.postMessage({ type: 'pip_detach_done', mode: 'host-window' });
    vscode.window.setStatusBarMessage(
      '$(pin) 悬浮预览已置顶到独立窗口（可离开主编辑区）',
      4000,
    );
  }

  private getFloatHtml(opts: {
    url: string;
    proxyUrl: string;
    deviceName: string;
    screenW: number;
    screenH: number;
    shellW: number;
    shellH: number;
    insetTop: number;
    insetSide: number;
    insetBottom: number;
    insetRight: number;
    radius: string;
  }): string {
    const mediaCandidates = [
      path.join(this.context.extensionPath, 'media', 'webview'),
      path.join(this.context.extensionPath, 'dist', 'media', 'webview'),
    ];
    const mediaDir = mediaCandidates.find((p) => fs.existsSync(path.join(p, 'ui-screen.png'))) || mediaCandidates[0];
    const screenUri = this.floatPanel!.webview
      .asWebviewUri(vscode.Uri.file(path.join(mediaDir, 'ui-screen.png')))
      .toString();
    const src = opts.proxyUrl || opts.url;
    const frameSrc = src + (src.includes('?') ? '&' : '?') + '_ts=' + Date.now();
    const insetTopPct = (opts.insetTop * 100).toFixed(4);
    const insetSidePct = (opts.insetSide * 100).toFixed(4);
    const insetBottomPct = (opts.insetBottom * 100).toFixed(4);

    const csp = [
      `default-src 'none'`,
      `img-src ${this.floatPanel!.webview.cspSource} http: https: data:`,
      `style-src ${this.floatPanel!.webview.cspSource} 'unsafe-inline'`,
      `script-src ${this.floatPanel!.webview.cspSource} 'unsafe-inline'`,
      `frame-src http: https:`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>悬浮预览</title>
  <style>
    html, body { margin:0; height:100%; background:#0a1a1f; color:#e2e8f0; font:12px/1.4 sans-serif; overflow:hidden; }
    .wrap { height:100%; display:flex; flex-direction:column; }
    .bar { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border-bottom:1px solid rgba(77,238,234,.28); background:rgba(0,0,0,.35); }
    .bar button { background:rgba(77,238,234,.15); color:#4deeea; border:1px solid rgba(77,238,234,.35); border-radius:8px; padding:4px 10px; cursor:pointer; }
    .stage { flex:1; min-height:0; display:flex; align-items:center; justify-content:center; padding:16px; overflow:hidden; background:radial-gradient(circle at 50% 30%, rgba(77,238,234,.08), transparent 55%); }
    #scaleWrap { position:relative; flex-shrink:0; transform-origin:center center; overflow:hidden; }
    .phone { position:relative; width:${opts.shellW}px; height:${opts.shellH}px; }
    .phone img { position:absolute; inset:0; width:100%; height:100%; object-fit:fill; pointer-events:none; }
    .screen { position:absolute; overflow:hidden; background:#000; border-radius:${opts.radius};
      top:${insetTopPct}%; left:${insetSidePct}%; right:${insetSidePct}%; bottom:${insetBottomPct}%; }
    iframe { border:0; width:100%; height:100%; display:block; background:#111; overflow:auto; -webkit-overflow-scrolling:touch; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="bar">
      <div>${opts.deviceName} · ${opts.screenW}×${opts.screenH}</div>
      <button type="button" id="btnBack">收回主面板</button>
    </div>
    <div class="stage">
      <div id="scaleWrap">
        <div class="phone">
          <img src="${screenUri}" alt="frame" />
          <div class="screen">
            <iframe id="frame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="${frameSrc}"></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('btnBack').onclick = () => vscode.postMessage({ type: 'pip_attach' });
    // 自适应缩放：让手机外壳完整显示在窗口内（等比，不破宽高比）
    function fitScale() {
      var sw = document.getElementById('scaleWrap');
      var phone = document.querySelector('.phone');
      var stage = document.querySelector('.stage');
      if (!sw || !phone || !stage) return;
      var margin = 32;
      var availW = Math.max(60, stage.clientWidth - margin);
      var availH = Math.max(80, stage.clientHeight - margin);
      var shellW = ${opts.shellW};
      var shellH = ${opts.shellH};
      var scale = Math.max(0.15, Math.min(1, availW / shellW, availH / shellH));
      sw.style.width = Math.round(shellW * scale) + 'px';
      sw.style.height = Math.round(shellH * scale) + 'px';
      phone.style.transformOrigin = 'top left';
      phone.style.transform = 'scale(' + scale + ')';
    }
    window.addEventListener('resize', fitScale);
    window.addEventListener('load', fitScale);
    setTimeout(fitScale, 100);
  </script>
</body>
</html>`;
  }

  private resolveWebviewHtmlPath(): string {
    const candidates = [
      path.join(this.context.extensionPath, 'media', 'webview', 'index.html'),
      path.join(this.context.extensionPath, 'dist', 'media', 'webview', 'index.html'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    throw new Error('Webview UI not found: media/webview/index.html');
  }

  private webviewAssetUri(mediaDir: string, relativePath: string): string {
    const abs = path.join(mediaDir, ...relativePath.split('/'));
    return this.panel.webview.asWebviewUri(vscode.Uri.file(abs)).toString();
  }

  private getHtml(): string {
    const htmlPath = this.resolveWebviewHtmlPath();
    const mediaDir = path.dirname(htmlPath);
    let html = fs.readFileSync(htmlPath, 'utf8');

    const cssUri = this.webviewAssetUri(mediaDir, 'styles/main.css');
    const appUri = this.webviewAssetUri(mediaDir, 'app.js');
    const screenUri = this.webviewAssetUri(mediaDir, 'ui-screen.png');
    const screen1Uri = this.webviewAssetUri(mediaDir, 'ui-screen1.png');
    const version = String(this.context.extension.packageJSON?.version || '0.0.0');

    html = html
      .split('__WV_CSS__')
      .join(cssUri)
      .split('__WV_APP__')
      .join(appUri)
      .split('__WV_SCREEN__')
      .join(screenUri)
      .split('__WV_SCREEN1__')
      .join(screen1Uri)
      .split('__WV_VERSION__')
      .join(version)
      .split('./ui-screen.png')
      .join(screenUri);

    const csp = [
      `default-src 'none'`,
      `img-src ${this.panel.webview.cspSource} http: https: data: blob:`,
      `style-src ${this.panel.webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.tailwindcss.com`,
      `font-src ${this.panel.webview.cspSource} https://cdnjs.cloudflare.com https://fonts.gstatic.com data:`,
      `script-src ${this.panel.webview.cspSource} 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com`,
      `frame-src http: https:`,
      `connect-src http: https: ${this.panel.webview.cspSource}`,
      `worker-src blob:`,
    ].join('; ');

    if (!/http-equiv="Content-Security-Policy"/i.test(html)) {
      html = html.replace(
        /<meta charset="utf-8"\s*\/>/i,
        `<meta charset="utf-8" />\n  <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      );
    }

    return html;
  }
}