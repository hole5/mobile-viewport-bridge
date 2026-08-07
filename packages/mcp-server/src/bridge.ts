import { WebSocketServer, WebSocket } from 'ws';
import {
  DEFAULT_WS_PORT,
  type BridgeMessage,
  type PendingEdit,
  type ViewportEvent,
  type ViewportSelection,
} from '@mvb/shared';
import { log } from './rpc';
import { SessionStore, pushViewportEvent } from './store';

type PendingCommand = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
};

export class ExtensionBridge {
  private wss: WebSocketServer | null = null;
  private extensionSocket: WebSocket | null = null;
  private commands = new Map<string, PendingCommand>();
  private port: number;

  constructor(
    private store: SessionStore,
    port = Number(process.env.MVB_WS_PORT || DEFAULT_WS_PORT),
  ) {
    this.port = port;
  }

  start(): void {
    this.wss = new WebSocketServer({ host: '127.0.0.1', port: this.port });
    this.wss.on('listening', () => log(`WS bridge listening on 127.0.0.1:${this.port}`));
    this.wss.on('connection', (socket) => this.onConnection(socket));
    this.wss.on('error', (err) => log(`WS error: ${err.message}`));
  }

  get isConnected(): boolean {
    return !!this.extensionSocket && this.extensionSocket.readyState === WebSocket.OPEN;
  }

  private onConnection(socket: WebSocket): void {
    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as BridgeMessage;
        this.handleMessage(socket, msg);
      } catch (e) {
        log(`WS parse error: ${(e as Error).message}`);
      }
    });
    socket.on('close', () => {
      if (this.extensionSocket === socket) {
        this.extensionSocket = null;
        this.store.patchState({ connected: false });
        log('extension disconnected');
      }
    });
  }

  private handleMessage(socket: WebSocket, msg: BridgeMessage): void {
    switch (msg.type) {
      case 'hello':
        if (msg.role === 'extension') {
          this.extensionSocket = socket;
          this.store.patchState({ connected: true });
          this.send(socket, {
            type: 'hello',
            role: 'mcp',
            sessionId: this.store.sessionId,
          });
          this.send(socket, { type: 'state', state: this.store.getOverview() });
          log('extension connected');
        }
        break;
      case 'ping':
        this.send(socket, { type: 'pong' });
        break;
      case 'state':
        this.store.patchState(msg.state);
        break;
      case 'event':
        this.onViewportEvent(msg.event);
        break;
      case 'pending_upsert':
        this.store.upsertPending(msg.edit);
        pushViewportEvent({
          eventSource: 'viewport_user_action',
          eventType: 'prop_change',
          payload: { editId: msg.edit.id, ops: msg.edit.ops },
          timestamp: new Date().toISOString(),
          sessionId: this.store.sessionId,
        });
        break;
      case 'pending_clear':
        this.store.clearPending(msg.editIds);
        break;
      case 'command_result': {
        const pending = this.commands.get(msg.id);
        if (!pending) break;
        clearTimeout(pending.timer);
        this.commands.delete(msg.id);
        if (msg.ok) pending.resolve(msg.result);
        else pending.reject(new Error(msg.error || 'command failed'));
        break;
      }
      default:
        break;
    }
  }

  private onViewportEvent(event: ViewportEvent): void {
    if (event.eventType === 'selection_change') {
      this.store.patchState({
        selection: event.payload as unknown as ViewportSelection,
      });
    }
    if (event.eventType === 'apply_requested') {
      // keep pending; just notify host
    }
    pushViewportEvent(event);
  }

  sendToExtension(msg: BridgeMessage): boolean {
    if (!this.extensionSocket || this.extensionSocket.readyState !== WebSocket.OPEN) return false;
    this.send(this.extensionSocket, msg);
    return true;
  }

  private send(socket: WebSocket, msg: BridgeMessage): void {
    socket.send(JSON.stringify(msg));
  }

  callExtension(name: string, args: Record<string, unknown> = {}, timeoutMs = 15000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Extension not connected. Open Mobile Viewport panel in Cursor first.'));
        return;
      }
      const id = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const timer = setTimeout(() => {
        this.commands.delete(id);
        reject(new Error(`Command timeout: ${name}`));
      }, timeoutMs);
      this.commands.set(id, { resolve, reject, timer });
      this.sendToExtension({ type: 'command', id, name, args });
    });
  }

  upsertLocalPending(edit: PendingEdit): void {
    this.store.upsertPending(edit);
  }
}
