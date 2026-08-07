/** Pure utility helpers — no DOM or state dependencies. */

export type EditOp =
  | { type: 'text'; value: string }
  | { type: 'style'; prop: string; value: string }
  | { type: 'attr'; name: string; value: string }
  | { type: 'move'; x: number; y: number };

export type PendingFields = {
  sel: string;
  text?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  width?: string;
  height?: string;
  display?: string;
  borderRadius?: string;
  margin?: string;
  padding?: string;
  src?: string;
};

/** Build edit ops from inspector field values. */
export function buildOps(fields: PendingFields): EditOp[] {
  const ops: EditOp[] = [];
  if (fields.text) ops.push({ type: 'text', value: fields.text });
  if (fields.color) ops.push({ type: 'style', prop: 'color', value: fields.color });
  if (fields.fontSize) ops.push({ type: 'style', prop: 'fontSize', value: fields.fontSize });
  if (fields.fontWeight) ops.push({ type: 'style', prop: 'fontWeight', value: fields.fontWeight });
  if (fields.width) ops.push({ type: 'style', prop: 'width', value: fields.width });
  if (fields.height) ops.push({ type: 'style', prop: 'height', value: fields.height });
  if (fields.display) ops.push({ type: 'style', prop: 'display', value: fields.display });
  if (fields.borderRadius) ops.push({ type: 'style', prop: 'borderRadius', value: fields.borderRadius });
  if (fields.margin) ops.push({ type: 'style', prop: 'margin', value: fields.margin });
  if (fields.padding) ops.push({ type: 'style', prop: 'padding', value: fields.padding });
  if (fields.src) ops.push({ type: 'attr', name: 'src', value: fields.src });
  return ops;
}

/** Merge two op lists; later entries override earlier by key. */
export function mergeOps(prev: EditOp[] | undefined, next: EditOp[] | undefined): EditOp[] {
  const map = new Map<string, EditOp>();
  const keyOf = (op: EditOp): string => {
    if (op.type === 'text') return 'text';
    if (op.type === 'style') return 'style:' + op.prop;
    if (op.type === 'attr') return 'attr:' + op.name;
    return op.type;
  };
  (prev || []).forEach((op) => map.set(keyOf(op), op));
  (next || []).forEach((op) => map.set(keyOf(op), op));
  return [...map.values()];
}

/** Summarize ops list to a human-readable string. */
export function summarizeOps(ops: EditOp[] | undefined): string {
  if (!ops || !ops.length) return '无变更';
  return ops
    .map((op) => {
      if (op.type === 'text') return 'text';
      if (op.type === 'style') return op.prop;
      if (op.type === 'attr') return op.name;
      return op.type;
    })
    .join(' · ');
}

/** Format ISO timestamp to HH:MM:SS (zh-CN). */
export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

/** Cache-bust a URL by appending _ts=<timestamp>. */
export function withCacheBust(url: string): string {
  if (!url) return '';
  return url + (url.includes('?') ? '&' : '?') + '_ts=' + Date.now();
}

export type PhoneShellGeometry = {
  shellW: number;
  shellH: number;
  screenW: number;
  screenH: number;
  inset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    radius: string;
  };
};

/** Lay out phone shell + screen elements from geometry. */
export function layoutPhoneShell(
  shellEl: HTMLElement | null,
  screenEl: HTMLElement | null,
  g: PhoneShellGeometry,
): void {
  if (!shellEl || !screenEl) return;
  shellEl.style.width = g.shellW + 'px';
  shellEl.style.height = g.shellH + 'px';
  shellEl.style.aspectRatio = g.shellW + ' / ' + g.shellH;
  screenEl.style.top = Math.round(g.shellH * g.inset.top) + 'px';
  screenEl.style.left = Math.round(g.shellW * g.inset.left) + 'px';
  screenEl.style.right = 'auto';
  screenEl.style.bottom = 'auto';
  screenEl.style.width = g.screenW + 'px';
  screenEl.style.height = g.screenH + 'px';
  screenEl.style.borderRadius = g.inset.radius;
}

/** Copy text to clipboard with execCommand fallback. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}