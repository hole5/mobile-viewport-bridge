import * as vscode from 'vscode';
import { DEVICE_PRESETS, DEFAULT_WS_PORT } from '@mvb/shared';
import { McpBridgeClient } from './bridge/WsClient';
import { ViewportPanel } from './panel/ViewportPanel';

let bridge: McpBridgeClient | undefined;
let bridgeStarted = false;

/**
 * Lazy-init the MCP bridge client.
 * The WebSocket connection only starts when the user first invokes a command,
 * avoiding a perpetual reconnection loop on every IDE startup.
 */
function ensureBridge(context: vscode.ExtensionContext): McpBridgeClient {
  if (!bridge) {
    const cfg = vscode.workspace.getConfiguration('mobileViewport');
    const wsPort = cfg.get<number>('wsPort', DEFAULT_WS_PORT);
    bridge = new McpBridgeClient(wsPort);

    bridge.onStatus((connected) => {
      if (connected) {
        vscode.window.setStatusBarMessage('$(device-mobile) Viewport MCP connected', 3000);
      }
    });

    // Dispose bridge when extension is deactivated
    context.subscriptions.push({ dispose: () => bridge?.dispose() });

    console.log(
      `[MVB] devices: ${DEVICE_PRESETS.map((d) => d.id).join(', ')} ws:${wsPort}`,
    );
  }
  if (!bridgeStarted) {
    bridge.start();
    bridgeStarted = true;
  }
  return bridge;
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mobileViewport.open', () => {
      const b = ensureBridge(context);
      ViewportPanel.show(context, b);
    }),
    vscode.commands.registerCommand('mobileViewport.reload', () => {
      ensureBridge(context);
      ViewportPanel.current?.reload();
    }),
    vscode.commands.registerCommand('mobileViewport.applyToCode', async () => {
      ensureBridge(context);
      if (ViewportPanel.current) {
        await ViewportPanel.current.applyToCodeViaMcpAgent();
        return;
      }
      vscode.window.showWarningMessage('请先打开 Mobile Viewport 面板并产生 pending 编辑。');
    }),
  );
}

export function deactivate(): void {
  bridge?.dispose();
}
