import { RESOURCE_OVERVIEW_URI } from '@mvb/shared';
import { ExtensionBridge } from './bridge';
import { JsonStreamParser, log, notification, response } from './rpc';
import { SessionStore } from './store';
import { TOOL_DEFS, handleToolCall } from './tools';

const store = new SessionStore();
const bridge = new ExtensionBridge(store);
bridge.start();

function handleRequest(id: number | string, method: string, params: Record<string, unknown> = {}): void {
  switch (method) {
    case 'initialize':
      response(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true, listChanged: true },
          logging: {},
        },
        serverInfo: { name: 'mobile-viewport-bridge', version: '0.1.0' },
      });
      break;

    case 'notifications/initialized':
      break;

    case 'ping':
      response(id, {});
      break;

    case 'tools/list':
      response(id, { tools: TOOL_DEFS });
      break;

    case 'tools/call': {
      const name = String((params as { name?: string }).name || '');
      const args = (params as { arguments?: Record<string, unknown> }).arguments;
      void handleToolCall(id, name, args, store, bridge);
      break;
    }

    case 'resources/list':
      response(id, {
        resources: [
          {
            uri: RESOURCE_OVERVIEW_URI,
            name: 'Viewport Session Overview',
            mimeType: 'application/json',
          },
        ],
      });
      break;

    case 'resources/read': {
      const uri = String((params as { uri?: string }).uri || '');
      if (uri === RESOURCE_OVERVIEW_URI) {
        response(id, {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(store.getOverview(), null, 2),
            },
          ],
        });
      } else {
        response(id, { contents: [] });
      }
      break;
    }

    case 'resources/subscribe':
      response(id, {});
      notification('notifications/message', {
        level: 'info',
        data: `subscribed:${(params as { uri?: string }).uri || ''}`,
      });
      break;

    case 'resources/unsubscribe':
      response(id, {});
      break;

    default:
      response(id, { content: [{ type: 'text', text: `Unknown method: ${method}` }] });
  }
}

const parser = new JsonStreamParser();
parser.on('message', (msg: { method?: string; id?: number | string; params?: Record<string, unknown> }) => {
  const { method, id, params } = msg;
  if (!method) return;
  if (id !== undefined) {
    handleRequest(id, method, params || {});
  } else if (method === 'initialize') {
    log('TRAE compat: initialize without id, reply with id=0');
    handleRequest(0, method, params || {});
  } else {
    log(`notification: ${method}`);
  }
});

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => parser.feed(chunk));
process.stdin.on('end', () => {
  log('stdin closed');
  process.exit(0);
});
process.on('SIGINT', () => process.exit(0));

log('mobile-viewport-bridge MCP ready');
