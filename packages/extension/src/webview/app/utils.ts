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
  notch?: {
    type: string;
    widthRatio: number;
    heightRatio: number;
    topRatio: number;
    borderRadius: number;
  };
  homeIndicator?: {
    type: string;
    widthRatio: number;
    height: number;
    bottomOffset: number;
    borderRadius: number;
  };
};

/**
 * 将竖屏几何信息转换为横屏几何信息（逆时针旋转 90 度，顶部朝左）
 * 用于实现真正的横屏模拟：视口宽高互换，页面重新布局
 */
export function landscapeGeometry(g: PhoneShellGeometry): PhoneShellGeometry {
  // 横屏时：
  // - 原来的顶部 → 现在的左边
  // - 原来的右边 → 现在的顶部
  // - 原来的底部 → 现在的右边
  // - 原来的左边 → 现在的底部
  const result: PhoneShellGeometry = {
    shellW: g.shellH,
    shellH: g.shellW,
    screenW: g.screenH,
    screenH: g.screenW,
    inset: {
      top: g.inset.right,
      bottom: g.inset.left,
      left: g.inset.top,
      right: g.inset.bottom,
      radius: g.inset.radius, // 圆角比例保持，后续可优化
    },
  };

  // 转换刘海几何：从顶部居中 → 左侧居中
  if (g.notch && g.notch.type !== 'none') {
    // 横屏时刘海在左侧，宽高互换
    // 原来的宽度 → 现在的高度
    // 原来的高度 → 现在的宽度
    // 原来的水平居中 → 现在的垂直居中
    result.notch = {
      type: g.notch.type,
      widthRatio: g.notch.heightRatio,  // 原来的高度比 → 现在的宽度比
      heightRatio: g.notch.widthRatio,  // 原来的宽度比 → 现在的高度比
      topRatio: (1 - g.notch.widthRatio) / 2, // 垂直居中
      borderRadius: g.notch.borderRadius,
    };
  }

  // 转换底部导航条几何：从底部居中 → 右侧居中
  if (g.homeIndicator && g.homeIndicator.type !== 'none') {
    // 横屏时导航条在右侧，宽高互换
    // 原来的宽度 → 现在的高度
    // 原来的高度 → 现在的宽度
    // 原来的底部偏移 → 现在的右侧偏移
    result.homeIndicator = {
      type: g.homeIndicator.type,
      widthRatio: g.homeIndicator.height / g.screenH, // 原来的高度 → 现在的宽度比
      height: Math.round(g.screenW * g.homeIndicator.widthRatio), // 原来的宽度 → 现在的高度
      bottomOffset: g.homeIndicator.bottomOffset, // 右侧偏移 = 原来的底部偏移
      borderRadius: g.homeIndicator.borderRadius,
    };
  }

  return result;
}

/**
 * 布局手机外壳 + 屏幕元素
 * 根据几何信息动态计算位置和尺寸
 */
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

/**
 * 布局设备顶部刘海/打孔元素
 * 根据 notch 几何信息动态计算位置和尺寸
 * @param notchEl 刘海 DOM 元素
 * @param screenEl 屏幕 DOM 元素（用于计算相对位置）
 * @param g 几何信息
 * @param isLandscape 是否横屏模式
 */
export function layoutNotch(
  notchEl: HTMLElement | null,
  screenEl: HTMLElement | null,
  g: PhoneShellGeometry,
  isLandscape = false,
): void {
  if (!notchEl || !screenEl || !g.notch || g.notch.type === 'none') {
    if (notchEl) notchEl.style.display = 'none';
    return;
  }

  const screenW = g.screenW;
  const screenH = g.screenH;
  const notch = g.notch;

  notchEl.style.display = 'block';
  notchEl.style.position = 'absolute';

  if (isLandscape) {
    // 横屏模式：刘海在左侧，垂直居中
    const width = Math.round(screenW * notch.widthRatio);
    const height = Math.round(screenH * notch.heightRatio);
    const left = 0;
    const top = Math.round((screenH - height) / 2); // 垂直居中

    notchEl.style.top = top + 'px';
    notchEl.style.left = left + 'px';
    notchEl.style.right = 'auto';
    notchEl.style.bottom = 'auto';
    notchEl.style.width = width + 'px';
    notchEl.style.height = height + 'px';
    notchEl.style.borderRadius = notch.borderRadius + 'px';

    // 横屏时添加 landscape class，用于 CSS 样式调整
    notchEl.className = 'device-notch notch-' + notch.type + ' notch-landscape';
  } else {
    // 竖屏模式：刘海在顶部，水平居中
    const width = Math.round(screenW * notch.widthRatio);
    const height = Math.round(screenH * notch.heightRatio);
    const top = Math.round(screenH * notch.topRatio);
    const left = Math.round((screenW - width) / 2); // 水平居中

    notchEl.style.top = top + 'px';
    notchEl.style.left = left + 'px';
    notchEl.style.right = 'auto';
    notchEl.style.bottom = 'auto';
    notchEl.style.width = width + 'px';
    notchEl.style.height = height + 'px';
    notchEl.style.borderRadius = notch.borderRadius + 'px';

    notchEl.className = 'device-notch notch-' + notch.type;
  }
}

/**
 * 布局底部导航条元素
 * @param indicatorEl 导航条 DOM 元素
 * @param screenEl 屏幕 DOM 元素
 * @param g 几何信息
 */
export function layoutHomeIndicator(
  indicatorEl: HTMLElement | null,
  screenEl: HTMLElement | null,
  g: PhoneShellGeometry,
  isLandscape = false,
): void {
  if (!indicatorEl || !screenEl || !g.homeIndicator || g.homeIndicator.type === 'none') {
    if (indicatorEl) indicatorEl.style.display = 'none';
    return;
  }

  const screenW = g.screenW;
  const screenH = g.screenH;
  const hi = g.homeIndicator;

  indicatorEl.style.display = 'block';
  indicatorEl.style.position = 'absolute';

  if (isLandscape) {
    // 横屏模式：导航条在右侧，垂直居中
    const height = Math.round(screenH * hi.widthRatio);
    const width = hi.height;
    const right = hi.bottomOffset; // 右侧偏移 = 原来的底部偏移
    const top = Math.round((screenH - height) / 2); // 垂直居中

    indicatorEl.style.top = top + 'px';
    indicatorEl.style.right = right + 'px';
    indicatorEl.style.left = 'auto';
    indicatorEl.style.bottom = 'auto';
    indicatorEl.style.width = width + 'px';
    indicatorEl.style.height = height + 'px';
    indicatorEl.style.borderRadius = hi.borderRadius + 'px';

    // 横屏时添加 landscape class
    indicatorEl.className = 'device-home-indicator indicator-' + hi.type + ' indicator-landscape';
  } else {
    // 竖屏模式：导航条在底部，水平居中
    const width = Math.round(screenW * hi.widthRatio);
    const left = Math.round((screenW - width) / 2); // 水平居中
    const bottom = hi.bottomOffset;

    indicatorEl.style.bottom = bottom + 'px';
    indicatorEl.style.left = left + 'px';
    indicatorEl.style.right = 'auto';
    indicatorEl.style.top = 'auto';
    indicatorEl.style.width = width + 'px';
    indicatorEl.style.height = hi.height + 'px';
    indicatorEl.style.borderRadius = hi.borderRadius + 'px';

    indicatorEl.className = 'device-home-indicator indicator-' + hi.type;
  }
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