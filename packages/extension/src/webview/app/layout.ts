/** Phone canvas layout — extracted from runtime.ts. */

import { devicePhoneGeometry } from './geometry';
import { layoutPhoneShell } from './utils';

export let userPhoneZoom = 1;
export let lastFitScale = 1;

/** Device fields required by phone canvas layout calculations. */
export type DeviceCanvas = {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  hasTouch: boolean;
};

export function sendHostToFrame(frameEl: HTMLIFrameElement | null, type: string, payload: unknown): void {
  try {
    if (frameEl && frameEl.contentWindow) {
      frameEl.contentWindow.postMessage({ source: 'mvb-host', type, payload }, '*');
    }
  } catch (_) {}
}

export function applyPhoneCanvasSize(d: DeviceCanvas): void {
  const phoneEl = document.getElementById('phone');
  const screenEl = document.getElementById('screen');
  const wrap = document.getElementById('phoneZoomWrap');
  const stage = document.getElementById('phoneStage');
  const hint = document.getElementById('phoneScaleHint');
  if (!phoneEl || !screenEl || !wrap || !stage) return;

  const g = devicePhoneGeometry(d);
  layoutPhoneShell(phoneEl, screenEl, g);

  const padX = 48;
  const padY = 56;
  const maxW = Math.max(160, stage.clientWidth - padX);
  const maxH = Math.max(220, stage.clientHeight - padY);
  lastFitScale = Math.min(1, maxW / g.shellW, maxH / g.shellH);
  const scale = Math.max(0.2, lastFitScale * userPhoneZoom);

  wrap.style.width = Math.round(g.shellW * scale) + 'px';
  wrap.style.height = Math.round(g.shellH * scale) + 'px';
  wrap.style.overflow = 'hidden';
  phoneEl.style.transform = 'scale(' + scale + ')';
  phoneEl.style.transformOrigin = 'top left';
  if (hint) hint.textContent = Math.round(scale * 100) + '%';
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