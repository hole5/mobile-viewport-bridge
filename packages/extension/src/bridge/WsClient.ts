import WebSocket from 'ws';
import {
  createEditId,
  type BridgeMessage,
  type PendingEdit,
  type SessionState,
  type ViewportEvent,
} from '@mvb/shared';

type StatusCb = (connected: boolean) => void;
type CommandHandler = (name: string, args: Record<string, unknown>) => Promise<unknown>;
type PendingChangeCb = (pending: PendingEdit[]) => void;

export class McpBridgeClient {
  private ws: WebSocket | null = null;
  private timer: NodeJS.Timeout | null = null;
  private statusCbs: StatusCb[] = [];
  private pendingCbs: PendingChangeCb[] = [];
  private commandHandler: CommandHandler | null = null;
  private disposed = false;
  connected = false;
  pendingLocal: PendingEdit[] = [];

  constructor(private port: number) {}

  start(): void {
    this.connect();
  }

  onStatus(cb: StatusCb): void {
    this.statusCbs.push(cb);
  }

  onPendingChange(cb: PendingChangeCb): void {
    this.pendingCbs.push(cb);
  }

  setCommandHandler(handler: CommandHandler): void {
    this.commandHandler = handler;
  }

  private notifyPending(): void {
    for (const cb of this.pendingCbs) cb(this.pendingLocal);
  }

  private setConnected(v: boolean): void {
    this.connected = v;
    for (const cb of this.statusCbs) cb(v);
  }

  private connect(): void {
    if (this.disposed) return;
    try {
      this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      this.send({ type: 'hello', role: 'extension' });
      this.setConnected(true);
      // Re-sync local queue after reconnect
      for (const edit of this.pendingLocal) {
        this.send({ type: 'pending_upsert', edit });
      }
    });

    this.ws.on('message', (raw) => {
      void this.onMessage(String(raw));
    });

    this.ws.on('close', () => {
      this.setConnected(false);
      this.scheduleReconnect();
    });

    this.ws.on('error', () => {
      // close will fire
    });
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.connect(), 2000);
  }

  private async onMessage(raw: string): Promise<void> {
    let msg: BridgeMessage;
    try {
      msg = JSON.parse(raw) as BridgeMessage;
    } catch {
      return;
    }

    if (msg.type === 'pending_clear') {
      const before = this.pendingLocal.length;
      this.pendingLocal = this.pendingLocal.filter((e) => !msg.editIds.includes(e.id));
      if (this.pendingLocal.length !== before) this.notifyPending();
      return;
    }

    if (msg.type === 'command' && this.commandHandler) {
      try {
        const result = await this.commandHandler(msg.name, msg.args || {});
        this.send({ type: 'command_result', id: msg.id, ok: true, result });
      } catch (e) {
        this.send({
          type: 'command_result',
          id: msg.id,
          ok: false,
          error: (e as Error).message,
        });
      }
    }
  }

  send(msg: BridgeMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  pushState(state: Partial<SessionState>): void {
    this.send({ type: 'state', state });
  }

  pushEvent(event: ViewportEvent): void {
    this.send({ type: 'event', event });
  }

  /** Replace-by-id upsert (idempotent re-sync; does not append duplicate ops). */
  upsertPending(edit: PendingEdit): void {
    const idx = this.pendingLocal.findIndex((e) => e.id === edit.id);
    if (idx >= 0) this.pendingLocal[idx] = edit;
    else this.pendingLocal.push(edit);
    this.send({ type: 'pending_upsert', edit });
    this.notifyPending();
  }

  createPending(partial: Omit<PendingEdit, 'id' | 'createdAt'>): PendingEdit {
    const edit: PendingEdit = {
      ...partial,
      id: createEditId(),
      createdAt: new Date().toISOString(),
    };
    this.upsertPending(edit);
    return edit;
  }

  /** Replace entire local queue and re-sync to MCP (clear + upsert). */
  setPendingQueue(edits: PendingEdit[]): void {
    const prevIds = this.pendingLocal.map((e) => e.id);
    if (prevIds.length) this.send({ type: 'pending_clear', editIds: prevIds });
    this.pendingLocal = edits.map((e) => ({ ...e, ops: [...e.ops] }));
    for (const edit of this.pendingLocal) {
      this.send({ type: 'pending_upsert', edit });
    }
    this.notifyPending();
  }

  requestApply(): void {
    // Re-push queue so MCP store is in sync before Agent calls get_pending_edits
    for (const edit of this.pendingLocal) {
      this.send({ type: 'pending_upsert', edit });
    }
    const editIds = this.pendingLocal.map((e) => e.id);
    this.pushEvent({
      eventSource: 'viewport_user_action',
      eventType: 'apply_requested',
      payload: { editIds, count: editIds.length },
      timestamp: new Date().toISOString(),
      sessionId: 'extension',
    });
  }

  clearPending(editIds: string[]): void {
    if (!editIds.length) return;
    this.pendingLocal = this.pendingLocal.filter((e) => !editIds.includes(e.id));
    this.send({ type: 'pending_clear', editIds });
    this.notifyPending();
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
  }
}
