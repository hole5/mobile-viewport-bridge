/** Phone canvas layout — extracted from runtime.ts. */

import { devicePhoneGeometry } from './geometry';
import { layoutPhoneShell, layoutNotch, layoutHomeIndicator } from './utils';

export let userPhoneZoom = 1;
export let lastFitScale = 1;
export let isLandscape = false;
/** DPR 模拟开关 */
export let dprSimulation = false;
/** 可交互模式开关 */
export let interactiveMode = false;
/** 显示刘海/灵动岛 */
export let showNotch = true;

/** Device fields required by phone canvas layout calculations. */
export type DeviceCanvas = {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  hasTouch: boolean;
  notchType?: string;
  homeIndicatorType?: string;
};

export function sendHostToFrame(frameEl: HTMLIFrameElement | null, type: string, payload: unknown): void {
  try {
    if (frameEl && frameEl.contentWindow) {
      frameEl.contentWindow.postMessage({ source: 'mvb-host', type, payload }, '*');
    }
  } catch (_) {}
}

/**
 * 应用手机画布尺寸
 * 支持竖屏和横屏两种模式
 * 横屏时：交换宽高 + 旋转 90 度
 */
export function applyPhoneCanvasSize(d: DeviceCanvas): void {
  const phoneEl = document.getElementById('phone');
  const screenEl = document.getElementById('screen');
  const wrap = document.getElementById('phoneZoomWrap');
  const stage = document.getElementById('phoneStage');
  const hint = document.getElementById('phoneScaleHint');
  const notchEl = document.getElementById('notch');
  const homeIndicatorEl = document.getElementById('homeIndicator');
  if (!phoneEl || !screenEl || !wrap || !stage) return;

  // 计算竖屏几何（phone 和 screen 保持竖屏尺寸）
  const g = devicePhoneGeometry(d);
  layoutPhoneShell(phoneEl, screenEl, g);

  // 应用刘海和底部导航条布局（竖屏位置，旋转后自然在侧边）
  layoutNotch(notchEl, screenEl, g);
  layoutHomeIndicator(homeIndicatorEl, screenEl, g);

  // 控制刘海/灵动岛显示隐藏
  if (notchEl) {
    notchEl.style.display = showNotch ? '' : 'none';
  }

  // iframe 尺寸和 transform：支持 DPR 模拟 + 横竖屏
  // DPR 模拟原理：iframe 按 DPR 倍数放大渲染，然后用 scale(1/DPR) 缩小显示
  // 这样 1px CSS 像素对应 DPR 物理像素，和真机渲染效果一致
  const frameEl = document.getElementById('frame');
  if (frameEl) {
    const dpr = dprSimulation ? (d.deviceScaleFactor || 3) : 1;

    if (isLandscape) {
      // 横屏模式：iframe 反向旋转 90 度，抵消 phone 的旋转
      // iframe 尺寸保持竖屏尺寸，旋转后视觉宽高互换，正好填满横屏的 screen
      // 原理：
      // - iframe 旋转前尺寸：screenW × screenH（竖屏）
      // - 旋转 90 度后视觉尺寸：screenH × screenW（横屏）
      // - 正好等于 screen 旋转后的视觉尺寸
      const iframeW = g.screenW * dpr;
      const iframeH = g.screenH * dpr;

      frameEl.style.width = iframeW + 'px';
      frameEl.style.height = iframeH + 'px';
      frameEl.style.position = 'absolute';
      // 居中定位，让 iframe 中心与 screen 中心对齐
      frameEl.style.left = Math.round((g.screenW - iframeW) / 2) + 'px';
      frameEl.style.top = Math.round((g.screenH - iframeH) / 2) + 'px';
      frameEl.style.right = 'auto';
      frameEl.style.bottom = 'auto';
      // 绕中心旋转 90 度 + DPR 缩放
      // transform 执行顺序：先 scale(1/dpr) 缩小，再 rotate(90deg) 旋转
      // 旋转后宽高互换，视觉尺寸正好填满 screen
      frameEl.style.transform = 'rotate(90deg) scale(' + (1 / dpr) + ')';
      frameEl.style.transformOrigin = 'center center';
    } else {
      // 竖屏模式
      if (dprSimulation) {
        // DPR 模拟：放大渲染 + 缩小显示
        frameEl.style.width = g.screenW * dpr + 'px';
        frameEl.style.height = g.screenH * dpr + 'px';
        frameEl.style.position = 'absolute';
        frameEl.style.left = '0';
        frameEl.style.top = '0';
        frameEl.style.right = 'auto';
        frameEl.style.bottom = 'auto';
        // 绕左上角缩放，保持左上角对齐
        frameEl.style.transform = 'scale(' + (1 / dpr) + ')';
        frameEl.style.transformOrigin = 'top left';
      } else {
        // 无 DPR 模拟：默认填满
        frameEl.style.width = '';
        frameEl.style.height = '';
        frameEl.style.left = '';
        frameEl.style.top = '';
        frameEl.style.right = '';
        frameEl.style.bottom = '';
        frameEl.style.transform = '';
        frameEl.style.transformOrigin = '';
      }
    }

    // 可交互模式：控制 pointer-events
    frameEl.style.pointerEvents = interactiveMode ? 'auto' : 'none';
  }

  // 横屏模式 class
  if (isLandscape) {
    phoneEl.classList.add('landscape');
    wrap.classList.add('landscape');
  } else {
    phoneEl.classList.remove('landscape');
    wrap.classList.remove('landscape');
  }

  const padX = 48;
  const padY = 56;
  const maxW = Math.max(160, stage.clientWidth - padX);
  const maxH = Math.max(220, stage.clientHeight - padY);

  // displayW/displayH：横屏时宽高互换（旋转后的视觉尺寸）
  const displayW = isLandscape ? g.shellH : g.shellW;
  const displayH = isLandscape ? g.shellW : g.shellH;

  // 首次 boot 时 stage 尚未完成 layout（clientWidth=0），
  // 在下一帧重试，保证缩放 scale 基于真实 stage 尺寸计算，避免手机内容挤在一侧。
  if (stage.clientWidth <= 0 || stage.clientHeight <= 0) {
    let retry = 0;
    const retryLayout = () => {
      retry += 1;
      if (retry > 5) return;
      const w = Math.max(160, stage.clientWidth - padX);
      const h = Math.max(220, stage.clientHeight - padY);
      if (w <= 160 || h <= 220) {
        requestAnimationFrame(retryLayout);
        return;
      }
      const s = Math.min(1, w / displayW, h / displayH);
      lastFitScale = s;
      const scale = Math.max(0.2, s * userPhoneZoom);
      wrap.style.width = Math.round(displayW * scale) + 'px';
      wrap.style.height = Math.round(displayH * scale) + 'px';
      wrap.style.overflow = 'hidden';
      applyPhoneTransform(phoneEl, scale, g, isLandscape);
      if (hint) hint.textContent = Math.round(scale * 100) + '%';
    };
    requestAnimationFrame(retryLayout);
  }

  lastFitScale = Math.min(1, maxW / displayW, maxH / displayH);
  const scale = Math.max(0.2, lastFitScale * userPhoneZoom);

  wrap.style.width = Math.round(displayW * scale) + 'px';
  wrap.style.height = Math.round(displayH * scale) + 'px';
  wrap.style.overflow = 'hidden';

  applyPhoneTransform(phoneEl, scale, g, isLandscape);

  if (hint) hint.textContent = Math.round(scale * 100) + '%';
}

/**
 * 切换横竖屏模式
 * @returns 切换后的横屏状态
 */
export function toggleLandscape(): boolean {
  isLandscape = !isLandscape;
  return isLandscape;
}

/**
 * 设置横屏模式
 * @param value 是否横屏
 */
export function setLandscape(value: boolean): void {
  isLandscape = value;
}

/**
 * 设置 DPR 模拟开关
 * @param value 是否开启 DPR 模拟
 */
export function setDprSimulation(value: boolean): void {
  dprSimulation = value;
}

/**
 * 设置可交互模式开关
 * @param value 是否开启可交互模式
 */
export function setInteractiveMode(value: boolean): void {
  interactiveMode = value;
}

/**
 * 设置刘海/灵动岛显示
 * @param value 是否显示刘海/灵动岛
 */
export function setShowNotch(value: boolean): void {
  showNotch = value;
}

/**
 * 应用 phone 元素的 transform（缩放 + 可选旋转）
 * 横屏时：绕左上角旋转 -90 度，向下平移 shellW，然后缩放
 * 这样旋转后正好填满 wrap 容器，机框和屏幕永远对齐
 */
function applyPhoneTransform(
  phoneEl: HTMLElement,
  scale: number,
  g: { shellW: number; shellH: number },
  landscape: boolean,
): void {
  phoneEl.style.left = '0';
  phoneEl.style.top = '0';
  phoneEl.style.transformOrigin = 'top left';
  if (landscape) {
    // 从右到左执行：先旋转，再平移，最后缩放
    // 旋转 -90 度后，向下平移 shellW，让顶部对齐 y=0
    phoneEl.style.transform =
      'scale(' + scale + ') translateY(' + g.shellW + 'px) rotate(-90deg)';
  } else {
    phoneEl.style.transform = 'scale(' + scale + ')';
  }
}

export function applyFullPageScale(_pageHeight?: number): void {
  const frameEl = document.getElementById('frame');
  const pipFrameEl = document.getElementById('pipFrame');
  if (frameEl) {
    frameEl.style.transform = '';
    frameEl.style.width = '100%';
    frameEl.style.height = '100%';
    frameEl.style.transformOrigin = '';
  }
  if (pipFrameEl) {
    pipFrameEl.style.transform = '';
    pipFrameEl.style.width = '100%';
    pipFrameEl.style.height = '100%';
    pipFrameEl.style.transformOrigin = '';
  }
}

export function setUserPhoneZoom(value: number): void {
  userPhoneZoom = value;
}

export function setLastFitScale(value: number): void {
  lastFitScale = value;
}

export function getFitScale(): number {
  return lastFitScale;
}