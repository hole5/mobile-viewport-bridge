/** Shared protocol for Mobile Viewport Bridge */

export const DEFAULT_WS_PORT = 3847;
export const DEFAULT_PROXY_PORT = 3848;
export const VIEWPORT_EVENT_CHANNEL = 'viewportEventChannel';
export const RESOURCE_OVERVIEW_URI = 'viewport://session/overview';

export type DevicePreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  userAgent: string;
  hasTouch: boolean;
  isMobile: boolean;
};

export type EditOp =
  | { type: 'text'; value: string }
  | { type: 'style'; prop: string; value: string }
  | { type: 'attr'; name: string; value: string }
  | { type: 'move'; x: number; y: number };

export type PendingEdit = {
  id: string;
  nodeId: string;
  selector: string;
  sourceHint?: { file?: string; component?: string };
  ops: EditOp[];
  createdAt: string;
};

export type ViewportSelection = {
  nodeId: string;
  selector: string;
  tag: string;
  text?: string;
  rect?: { x: number; y: number; width: number; height: number };
  styles?: Record<string, string>;
};

export type SessionState = {
  sessionId: string;
  url: string;
  deviceId: string;
  connected: boolean;
  selection: ViewportSelection | null;
  pendingCount: number;
  lastScreenshotPath?: string;
  domSnippet?: string;
};

export type ViewportEventType =
  | 'selection_change'
  | 'text_change'
  | 'prop_change'
  | 'image_replace'
  | 'node_move'
  | 'apply_requested'
  | 'session_ready'
  | 'screenshot_ready';

export type ViewportEvent = {
  eventSource: 'viewport_user_action' | 'viewport_system';
  eventType: ViewportEventType;
  payload: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
};

export type BridgeMessage =
  | { type: 'hello'; role: 'extension' | 'mcp'; sessionId?: string }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'state'; state: Partial<SessionState> }
  | { type: 'command'; id: string; name: string; args?: Record<string, unknown> }
  | { type: 'command_result'; id: string; ok: boolean; result?: unknown; error?: string }
  | { type: 'event'; event: ViewportEvent }
  | { type: 'pending_upsert'; edit: PendingEdit }
  | { type: 'pending_clear'; editIds: string[] };

/** 同系列只保留基准型号（不含 Plus / Pro / Max / Ultra / e / Air 手机变体） */
export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'iphone-17',
    name: 'iPhone 17',
    width: 402,
    height: 874,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'pixel-9',
    name: 'Pixel 9',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    userAgent:
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'galaxy-s25',
    name: 'Galaxy S25',
    width: 360,
    height: 780,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'galaxy-s24',
    name: 'Galaxy S24',
    width: 360,
    height: 780,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  },
];

export function createSessionId(): string {
  return `vp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEditId(): string {
  return `edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export {
  LAYOUT_SNAP_STEP_PX,
  LAYOUT_SNAP_COARSE_PX,
  POSITIONISH_STYLE_PROPS,
  snapLayoutPx,
  parseCssPx,
  snapCssPxValue,
  snapCssBoxShorthand,
  alignMoveOp,
  alignStyleOpValue,
} from './layoutAlign';

export {
  screenInsetsFor,
  devicePhoneGeometry,
  insetPercentages,
} from './geometry';
export type { DeviceLike, PhoneInsets, PhoneGeometry } from './geometry';