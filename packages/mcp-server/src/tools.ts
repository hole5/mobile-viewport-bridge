import { DEVICE_PRESETS, createEditId, type PendingEdit } from '@mvb/shared';
import { ExtensionBridge } from './bridge';
import { response } from './rpc';
import { SessionStore, pushViewportEvent } from './store';

export const TOOL_DEFS = [
  {
    name: 'viewport_open',
    description: 'Open mobile viewport panel and load a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Preview URL, e.g. http://127.0.0.1:5173' },
        deviceId: { type: 'string', description: 'Device preset id' },
      },
      required: ['url'],
    },
  },
  {
    name: 'viewport_set_device',
    description: 'Switch device preset in the mobile viewport',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'Device preset id from overview' },
      },
      required: ['deviceId'],
    },
  },
  {
    name: 'viewport_get_overview',
    description: 'Get current viewport session state, selection, and pending edit count',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'viewport_screenshot',
    description: 'Capture current viewport preview screenshot (base64 png if available)',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'viewport_highlight',
    description: 'Highlight an element by CSS selector or nodeId',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        nodeId: { type: 'string' },
      },
    },
  },
  {
    name: 'viewport_get_dom_snippet',
    description: 'Get HTML/style snippet for selected or specified node',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        nodeId: { type: 'string' },
      },
    },
  },
  {
    name: 'viewport_get_pending_edits',
    description:
      'Fetch pending visual edits. After Apply to Code: text may already be applied locally; apply remaining style/attr/move strictly, snap layout px to 4px grid, verify, then viewport_apply_edit_result.',
    inputSchema: {
      type: 'object',
      properties: {
        clear: { type: 'boolean', description: 'Clear queue after fetch (default false)' },
      },
    },
  },
  {
    name: 'viewport_apply_edit_result',
    description: 'Confirm edits applied in source code and remove them from pending queue',
    inputSchema: {
      type: 'object',
      properties: {
        editIds: { type: 'array', items: { type: 'string' } },
        reload: { type: 'boolean', description: 'Reload viewport after clear' },
      },
      required: ['editIds'],
    },
  },
  {
    name: 'viewport_reload',
    description: 'Reload the preview iframe',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'viewport_list_devices',
    description: 'List available device presets',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'viewport_simulate_edit',
    description: 'Dev helper: enqueue a fake pending edit and push notification (no extension required)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        text: { type: 'string' },
      },
    },
  },
];

function ok(id: number | string, data: unknown): void {
  response(id, {
    content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  });
}

function fail(id: number | string, message: string): void {
  response(id, {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  });
}

export async function handleToolCall(
  id: number | string,
  name: string,
  args: Record<string, unknown> | undefined,
  store: SessionStore,
  bridge: ExtensionBridge,
): Promise<void> {
  const a = args || {};
  try {
    switch (name) {
      case 'viewport_list_devices':
        ok(id, DEVICE_PRESETS.map((d) => ({ id: d.id, name: d.name, width: d.width, height: d.height })));
        return;

      case 'viewport_get_overview':
        ok(id, {
          ...store.getOverview(),
          devices: DEVICE_PRESETS.map((d) => d.id),
          extensionConnected: bridge.isConnected,
        });
        return;

      case 'viewport_get_pending_edits': {
        const clear = Boolean(a.clear);
        const edits = store.getPending(clear);
        ok(id, {
          count: edits.length,
          edits,
          hint:
            'Apply style/attr/move (and any remaining text) strictly by selector/ops. Snap position/spacing px to 4px grid. Verify values, fix only rewrite-induced errors, then viewport_apply_edit_result with editIds.',
        });
        return;
      }

      case 'viewport_simulate_edit': {
        const edit: PendingEdit = {
          id: createEditId(),
          nodeId: 'sim-node-1',
          selector: String(a.selector || 'h1.title'),
          ops: [{ type: 'text', value: String(a.text || 'Hello from MCP simulate') }],
          createdAt: new Date().toISOString(),
        };
        store.upsertPending(edit);
        pushViewportEvent({
          eventSource: 'viewport_system',
          eventType: 'text_change',
          payload: { edit },
          timestamp: new Date().toISOString(),
          sessionId: store.sessionId,
        });
        ok(id, { enqueued: edit, pendingCount: store.pending.size });
        return;
      }

      case 'viewport_open': {
        const url = String(a.url || '');
        if (!url) return fail(id, 'url required');
        if (a.deviceId) store.patchState({ deviceId: String(a.deviceId) });
        store.patchState({ url });
        if (bridge.isConnected) {
          const result = await bridge.callExtension('open', {
            url,
            deviceId: store.state.deviceId,
          });
          ok(id, result ?? { opened: true, url });
        } else {
          ok(id, {
            queued: true,
            url,
            deviceId: store.state.deviceId,
            message: 'State saved. Open Mobile Viewport panel to apply.',
          });
        }
        return;
      }

      case 'viewport_set_device': {
        const deviceId = String(a.deviceId || '');
        const preset = DEVICE_PRESETS.find((d) => d.id === deviceId);
        if (!preset) return fail(id, `Unknown deviceId: ${deviceId}`);
        store.patchState({ deviceId });
        if (bridge.isConnected) {
          const result = await bridge.callExtension('set_device', { deviceId });
          ok(id, result ?? { deviceId });
        } else {
          ok(id, { deviceId, queued: true });
        }
        return;
      }

      case 'viewport_reload': {
        if (!bridge.isConnected) return fail(id, 'Extension not connected');
        const result = await bridge.callExtension('reload', {});
        ok(id, result ?? { reloaded: true });
        return;
      }

      case 'viewport_highlight': {
        if (!bridge.isConnected) return fail(id, 'Extension not connected');
        const result = await bridge.callExtension('highlight', {
          selector: a.selector,
          nodeId: a.nodeId,
        });
        ok(id, result ?? { highlighted: true });
        return;
      }

      case 'viewport_get_dom_snippet': {
        if (bridge.isConnected) {
          const result = await bridge.callExtension('dom_snippet', {
            selector: a.selector,
            nodeId: a.nodeId,
          });
          ok(id, result);
        } else if (store.lastDomSnippet) {
          ok(id, { snippet: store.lastDomSnippet });
        } else {
          fail(id, 'No DOM snippet available. Connect extension and select an element.');
        }
        return;
      }

      case 'viewport_screenshot': {
        if (bridge.isConnected) {
          const result = await bridge.callExtension('screenshot', {});
          ok(id, result);
        } else if (store.lastScreenshotBase64) {
          ok(id, { base64: store.lastScreenshotBase64.slice(0, 80) + '...', note: 'cached truncated' });
        } else {
          fail(id, 'No screenshot. Connect extension first.');
        }
        return;
      }

      case 'viewport_apply_edit_result': {
        const editIds = (a.editIds as string[]) || [];
        const cleared = store.clearPending(editIds);
        bridge.sendToExtension({ type: 'pending_clear', editIds });
        if (a.reload && bridge.isConnected) {
          await bridge.callExtension('reload', {});
        }
        ok(id, { cleared, remaining: store.pending.size });
        return;
      }

      default:
        fail(id, `Unknown tool: ${name}`);
    }
  } catch (e) {
    fail(id, (e as Error).message);
  }
}
