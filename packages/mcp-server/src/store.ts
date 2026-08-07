import {
  VIEWPORT_EVENT_CHANNEL,
  createSessionId,
  type PendingEdit,
  type SessionState,
  type ViewportEvent,
} from '@mvb/shared';
import { notification } from './rpc';

export class SessionStore {
  sessionId = createSessionId();
  state: SessionState = {
    sessionId: this.sessionId,
    url: 'http://127.0.0.1:5173',
    deviceId: 'iphone-14',
    connected: false,
    selection: null,
    pendingCount: 0,
  };
  pending = new Map<string, PendingEdit>();
  lastDomSnippet = '';
  lastScreenshotBase64 = '';

  getOverview() {
    return {
      ...this.state,
      pendingCount: this.pending.size,
      pendingIds: [...this.pending.keys()],
      selection: this.state.selection,
    };
  }

  /** Replace-by-id (idempotent). Re-sync from extension must not duplicate ops. */
  upsertPending(edit: PendingEdit): void {
    this.pending.set(edit.id, {
      ...edit,
      ops: [...edit.ops],
    });
    this.state.pendingCount = this.pending.size;
  }

  getPending(clear = false): PendingEdit[] {
    const list = [...this.pending.values()];
    if (clear) {
      this.pending.clear();
      this.state.pendingCount = 0;
    }
    return list;
  }

  clearPending(editIds: string[]): number {
    let n = 0;
    for (const id of editIds) {
      if (this.pending.delete(id)) n++;
    }
    this.state.pendingCount = this.pending.size;
    return n;
  }

  patchState(partial: Partial<SessionState>): void {
    this.state = { ...this.state, ...partial, sessionId: this.sessionId };
  }
}

export function pushViewportEvent(event: ViewportEvent): void {
  notification('notifications/message', {
    level: event.eventType === 'apply_requested' ? 'warning' : 'info',
    data: JSON.stringify({
      channel: VIEWPORT_EVENT_CHANNEL,
      event,
    }),
  });
  notification('notifications/resources/updated', {
    uri: 'viewport://session/overview',
  });
}
