/** Layout snap helpers — keep drag/position writes on a stable grid. */

export const LAYOUT_SNAP_STEP_PX = 4;
export const LAYOUT_SNAP_COARSE_PX = 8;

/** Round a px length to the nearest step (default 4px). */
export function snapLayoutPx(value: number, step = LAYOUT_SNAP_STEP_PX): number {
  if (!Number.isFinite(value)) return 0;
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/** Parse CSS length like `12.3px` / `12px` → number; otherwise null. */
export function parseCssPx(raw: string): number | null {
  const m = String(raw || '')
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*px$/i);
  return m ? Number(m[1]) : null;
}

/**
 * Snap a single CSS length string when it is px-based.
 * Non-px values (%, rem, auto, shorthands with mixed units) are left unchanged.
 */
export function snapCssPxValue(raw: string, step = LAYOUT_SNAP_STEP_PX): string {
  const n = parseCssPx(raw);
  if (n === null) return raw;
  return `${snapLayoutPx(n, step)}px`;
}

/**
 * Snap shorthand margin/padding when every segment is px (e.g. `16px 0px` → `16px 0px`).
 */
export function snapCssBoxShorthand(raw: string, step = LAYOUT_SNAP_STEP_PX): string {
  const parts = String(raw || '')
    .trim()
    .split(/\s+/);
  if (!parts.length) return raw;
  const snapped: string[] = [];
  for (const p of parts) {
    const n = parseCssPx(p);
    if (n === null) return raw;
    snapped.push(`${snapLayoutPx(n, step)}px`);
  }
  return snapped.join(' ');
}

export type MoveOpLike = { type: 'move'; x: number; y: number };

/** Snap move op coordinates onto the layout grid. */
export function alignMoveOp<T extends MoveOpLike>(op: T, step = LAYOUT_SNAP_STEP_PX): T {
  return {
    ...op,
    x: snapLayoutPx(op.x, step),
    y: snapLayoutPx(op.y, step),
  };
}

/** Style props that usually come from drag / freehand resize and should be snapped. */
export const POSITIONISH_STYLE_PROPS = new Set([
  'left',
  'top',
  'right',
  'bottom',
  'width',
  'height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'gap',
  'row-gap',
  'column-gap',
  'translate',
  'inset',
]);

/**
 * Align a style op value when the prop is position/spacing related.
 * Prefer grid spacing over noisy sub-pixel drag offsets.
 */
export function alignStyleOpValue(prop: string, value: string, step = LAYOUT_SNAP_STEP_PX): string {
  const key = prop.trim().toLowerCase();
  if (!POSITIONISH_STYLE_PROPS.has(key) && key !== 'transform') return value;

  if (key === 'transform') {
    return value.replace(/(-?\d+(?:\.\d+)?)px/g, (m) => snapCssPxValue(m, step));
  }

  if (key.includes('margin') || key.includes('padding') || key === 'inset' || key === 'gap' || key.endsWith('-gap')) {
    return snapCssBoxShorthand(value, step);
  }

  return snapCssPxValue(value, step);
}
