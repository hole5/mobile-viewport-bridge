/** Picture-in-Picture management — extracted from runtime.ts. */

import { devicePhoneGeometry, type DeviceLike } from './geometry';
import { layoutPhoneShell } from './utils';
import {
  userPhoneZoom,
  lastFitScale,
  setLastFitScale,
  type DeviceCanvas,
} from './layout';
import { VSCODE_API, IS_EXTENSION } from '../bridge';

declare global {
  interface Window {
    documentPictureInPicture?: any;
    mozInnerScreenX?: number;
    mozInnerScreenY?: number;
  }
}

export const PIP_TOOLS_W = 148;

export type PipDetachMode = null | 'docpip' | 'popup' | 'host';

export type PipManagerCtx = {
  getPipOpen: () => boolean;
  setPipOpen: (v: boolean) => void;
  getPipToolsOpen: () => boolean;
  setPipToolsOpen: (v: boolean) => void;
  getPipDetachMode: () => PipDetachMode;
  setPipDetachMode: (v: PipDetachMode) => void;
  getPipExternalWin: () => Window | null;
  setPipExternalWin: (v: Window | null) => void;
  getPipDisplayScaleLocked: () => number | null;
  setPipDisplayScaleLocked: (v: number | null) => void;
  getPipSuppressResizeLayout: () => boolean;
  setPipSuppressResizeLayout: (v: boolean) => void;
  getPipProgrammaticFitAt: () => number;
  setPipProgrammaticFitAt: (v: number) => void;
  getPipDetachBoundDocs: () => WeakSet<Document>;
  getLoaded: () => boolean;
  getCurrentProxyUrl: () => string;
  getSettings: () => { showFrame: boolean; screenDim: number };
  getDeviceId: () => string;
  getDevice: () => DeviceCanvas;
  getUrlInputValue: () => string;
  getPending: () => unknown[];
  notify: (msg: string) => void;
  loadPreview: (silent?: boolean) => void;
  setMode: (mode: string, opts?: Record<string, unknown>) => void;
  setSetting: (key: string, value: unknown, label?: string) => void;
  applyToCode: () => Promise<void>;
  buildDemoSrc: () => string;
  getFrame: () => HTMLIFrameElement | null;
};

export type PipManager = {
  supportsDocPip: () => boolean;
  isIdeEmbeddedBrowser: () => boolean;
  canDetachExternally: () => boolean;
  hostPipWindow: () => HTMLElement | null;
  pipRoots: () => HTMLElement[];
  pipEl: (id: string) => HTMLElement | null;
  updatePipToolsUi: () => void;
  pipPhoneGeometry: () => ReturnType<typeof devicePhoneGeometry>;
  pipBodyBox: (win: HTMLElement | null) => { w: number; h: number };
  mainStageDisplayScale: () => number;
  pipFitScaleForWin: (win: HTMLElement, g: ReturnType<typeof devicePhoneGeometry>) => number;
  pipResolveDisplayScale: (win: HTMLElement, g: ReturnType<typeof devicePhoneGeometry>, refit: boolean) => number;
  measurePipShellSize: () => { width: number; height: number; phoneW: number; phoneH: number; screenW: number; screenH: number; displayScale: number; shellW: number; shellH: number };
  layoutPipPhoneIn: (win: HTMLElement, opts?: { refit?: boolean }) => void;
  layoutPipPhone: (opts?: { refit?: boolean }) => void;
  expandPipWindowForTools: (opening: boolean) => void;
  syncPipContent: () => void;
  bindPipDocClicks: (doc: Document) => void;
  handlePipButtonClick: (e: Event) => void;
  parkHostPip: (on: boolean) => void;
  estimateViewportScreenOrigin: () => { x: number; y: number };
  captureHostPipScreenBox: () => { left: number; top: number; width: number; height: number } | null;
  openPopupPipWindow: (box?: { left: number; top: number; width: number; height: number }) => Window;
  openDocPipWindow: (box?: { left: number; top: number; width: number; height: number }) => Promise<Window>;
  setPipToolsOpen: (on: boolean) => void;
  detachPipPin: () => Promise<void>;
  attachPipUnpin: () => Promise<void>;
  placePipWindowVisible: (win?: HTMLElement | null, opts?: { keepSize?: boolean; keepPos?: boolean }) => void;
  observePipWindowResize: (win: Window) => void;
  openPip: () => void;
  closePip: () => void;
  setupPipDrag: () => void;
  setupPipResize: () => void;
  handleDeviceChange: () => void;
  handleWindowResize: () => void;
  handlePipDetachMessage: (msg: { type: string }) => void;
};

const pipResizeObservers = new WeakMap<Window, ResizeObserver>();

export function createPipManager(ctx: PipManagerCtx): PipManager {
  const supportsDocPip = () =>
    !!(window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === 'function');

  const isIdeEmbeddedBrowser = () =>
    /Electron/i.test(navigator.userAgent || '');

  const canDetachExternally = () =>
    supportsDocPip() || !isIdeEmbeddedBrowser();

  const hostPipWindow = () =>
    document.getElementById('pipWindow');

  const pipRoots = (): HTMLElement[] => {
    const roots: HTMLElement[] = [];
    const host = hostPipWindow();
    if (host) roots.push(host);
    const extWin = ctx.getPipExternalWin();
    if (extWin && !extWin.closed) {
      try {
        const ext = extWin.document.getElementById('pipWindow');
        if (ext && ext !== host) roots.push(ext);
      } catch (_) {}
    }
    return roots;
  };

  const pipEl = (id: string): HTMLElement | null => {
    const extWin = ctx.getPipExternalWin();
    if (extWin && !extWin.closed) {
      try {
        const el = extWin.document.getElementById(id);
        if (el) return el;
      } catch (_) {}
    }
    return document.getElementById(id);
  };

  const mainStageDisplayScale = (): number => {
    const d = ctx.getDevice();
    const g = devicePhoneGeometry(d);
    const stage = document.getElementById('phoneStage');
    if (stage && stage.clientWidth > 0) {
      const padX = 48;
      const padY = 56;
      const maxW = Math.max(160, stage.clientWidth - padX);
      const maxH = Math.max(220, stage.clientHeight - padY);
      setLastFitScale(Math.min(1, maxW / g.shellW, maxH / g.shellH));
    }
    return Math.max(0.25, Math.min(1, lastFitScale * userPhoneZoom));
  };

  const pipPhoneGeometry = () =>
    devicePhoneGeometry(ctx.getDevice());

  const pipBodyBox = (win: HTMLElement | null): { w: number; h: number } => {
    const body = win && win.querySelector('#pipBody');
    if (!body) return { w: 200, h: 400 };
    const cs = win.ownerDocument.defaultView!.getComputedStyle(body);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const w = Math.max(60, body.clientWidth - padX);
    const h = Math.max(80, body.clientHeight - padY);
    return { w, h };
  };

  const pipFitScaleForWin = (win: HTMLElement, g: ReturnType<typeof devicePhoneGeometry>): number => {
    const box = pipBodyBox(win);
    const toolsW = ctx.getPipToolsOpen() ? PIP_TOOLS_W : 0;
    if (box.w < 40 || box.h < 40) {
      const maxW = Math.max(120, (win.clientWidth || 320) - 32 - toolsW);
      const maxH = Math.max(160, (win.clientHeight || 520) - 76);
      return Math.max(0.15, Math.min(maxW / g.shellW, maxH / g.shellH));
    }
    return Math.max(0.15, Math.min(box.w / g.shellW, box.h / g.shellH));
  };

  const pipResolveDisplayScale = (
    win: HTMLElement,
    g: ReturnType<typeof devicePhoneGeometry>,
    refit: boolean,
  ): number => {
    if (refit) {
      ctx.setPipDisplayScaleLocked(pipFitScaleForWin(win, g));
    } else if (ctx.getPipDisplayScaleLocked() == null) {
      ctx.setPipDisplayScaleLocked(mainStageDisplayScale());
    }
    return ctx.getPipDisplayScaleLocked() as number;
  };

  const measurePipShellSize = () => {
    const g = pipPhoneGeometry();
    const toolsW = ctx.getPipToolsOpen() ? PIP_TOOLS_W : 0;
    const padX = 32;
    const headerH = 48;
    const padY = 28;
    const displayScale = ctx.getPipDisplayScaleLocked() != null
      ? ctx.getPipDisplayScaleLocked() as number
      : mainStageDisplayScale();
    const phoneW = Math.round(g.shellW * displayScale);
    const phoneH = Math.round(g.shellH * displayScale);
    return {
      width: phoneW + toolsW + padX,
      height: phoneH + headerH + padY,
      phoneW,
      phoneH,
      screenW: g.screenW,
      screenH: g.screenH,
      displayScale,
      shellW: g.shellW,
      shellH: g.shellH,
    };
  };

  const parkHostPip = (on: boolean) => {
    const host = hostPipWindow();
    if (host) host.classList.toggle('pip-host-parked', !!on);
  };

  const estimateViewportScreenOrigin = () => {
    if (typeof window.mozInnerScreenX === 'number') {
      return { x: window.mozInnerScreenX, y: window.mozInnerScreenY };
    }
    const sx = window.screenLeft != null ? window.screenLeft : (window.screenX || 0);
    const sy = window.screenTop != null ? window.screenTop : (window.screenY || 0);
    const frameW = Math.max(0, window.outerWidth - window.innerWidth);
    const frameH = Math.max(0, window.outerHeight - window.innerHeight);
    return { x: sx + frameW / 2, y: sy + frameH };
  };

  const captureHostPipScreenBox = () => {
    const host = hostPipWindow();
    if (!host) return null;
    const rect = host.getBoundingClientRect();
    const origin = estimateViewportScreenOrigin();
    const vv = window.visualViewport;
    const ox = (vv && vv.offsetLeft) || 0;
    const oy = (vv && vv.offsetTop) || 0;
    const w = Math.max(240, Math.round(host.offsetWidth || rect.width));
    const h = Math.max(360, Math.round(host.offsetHeight || rect.height));
    return {
      left: Math.round(origin.x + ox + rect.left),
      top: Math.round(origin.y + oy + rect.top),
      width: w,
      height: h,
    };
  };

  const fitExternalInnerSize = (
    extWin: Window,
    box: { left: number; top: number; width: number; height: number },
  ): boolean => {
    if (!extWin || extWin.closed || !box) return false;
    try {
      ctx.setPipProgrammaticFitAt(Date.now());
      const dx = Math.round(box.width - extWin.innerWidth);
      const dy = Math.round(box.height - extWin.innerHeight);
      if (dx !== 0 || dy !== 0) {
        extWin.resizeTo(
          Math.max(220, Math.round(extWin.outerWidth + dx)),
          Math.max(280, Math.round(extWin.outerHeight + dy)),
        );
      }
      const chromeX = Math.max(0, extWin.outerWidth - extWin.innerWidth);
      const chromeY = Math.max(0, extWin.outerHeight - extWin.innerHeight);
      const sx = extWin.screenX != null ? extWin.screenX : extWin.screenLeft;
      const sy = extWin.screenY != null ? extWin.screenY : extWin.screenTop;
      const contentLeft = sx + chromeX / 2;
      const contentTop = sy + chromeY;
      const mx = Math.round(box.left - contentLeft);
      const my = Math.round(box.top - contentTop);
      if (mx || my) extWin.moveBy(mx, my);
      ctx.setPipProgrammaticFitAt(Date.now());
      return Math.abs(box.width - extWin.innerWidth) <= 2
        && Math.abs(box.height - extWin.innerHeight) <= 2;
    } catch (_) {
      return false;
    }
  };

  const snapExternalContentToBox = (
    extWin: Window,
    box: { left: number; top: number; width: number; height: number },
    onDone?: () => void,
  ) => {
    if (!extWin || !box) { onDone?.(); return; }
    let n = 0;
    const tick = () => {
      const ok = fitExternalInnerSize(extWin, box);
      n += 1;
      if (ok || n >= 12) { onDone?.(); return; }
      setTimeout(tick, 24 + n * 16);
    };
    tick();
    requestAnimationFrame(() => fitExternalInnerSize(extWin, box));
  };

  const copyAssetsToExternalDoc = (targetDoc: Document) => {
    targetDoc.documentElement.className = 'h-full';
    targetDoc.documentElement.style.cssText = 'height:100%;width:100%;background:#0a1a1f;';
    targetDoc.body.className = 'h-full';
    targetDoc.body.style.cssText = 'margin:0;background:#0a1a1f;overflow:hidden;height:100%;width:100%;';
    try { targetDoc.title = '悬浮预览'; } catch (_) {}
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      targetDoc.head.appendChild(node.cloneNode(true));
    });
    const base = targetDoc.createElement('base');
    base.href = document.baseURI;
    targetDoc.head.prepend(base);
    const boot = targetDoc.createElement('style');
    boot.textContent = [
      'html,body{background:#0a1a1f!important;color:#e2e8f0;height:100%;width:100%;margin:0;overflow:hidden}',
      '#pipToolsToggle{display:none!important}',
      '#pipPinBadge{display:none!important}',
    ].join('');
    targetDoc.head.appendChild(boot);
  };

  const hostPipSrcdoc = () => {
    const host = hostPipWindow();
    const pipFrame = host && host.querySelector<HTMLIFrameElement>('#pipFrame');
    if (pipFrame && pipFrame.srcdoc) return pipFrame.srcdoc;
    const mainFrame = document.getElementById('frame') as HTMLIFrameElement | null;
    if (mainFrame && mainFrame.srcdoc) return mainFrame.srcdoc;
    return ctx.getLoaded() ? ctx.buildDemoSrc() : '';
  };

  const lockScaleFromHost = () => {
    const host = hostPipWindow();
    const mainScale = mainStageDisplayScale();
    const hostScale = host && typeof (host as unknown as { _pipDisplayScale?: number })._pipDisplayScale === 'number'
      ? (host as unknown as { _pipDisplayScale: number })._pipDisplayScale
      : 0;
    if (hostScale > 0 && hostScale <= mainScale * 1.08) {
      ctx.setPipDisplayScaleLocked(hostScale);
    } else {
      ctx.setPipDisplayScaleLocked(mainScale);
    }
  };

  const layoutPipPhoneIn = (win: HTMLElement, opts?: { refit?: boolean }) => {
    if (!win) return;
    opts = opts || {};
    const g = pipPhoneGeometry();
    const displayScale = pipResolveDisplayScale(win, g, !!opts.refit);
    (win as unknown as { _pipDisplayScale: number })._pipDisplayScale = displayScale;

    const scaleWrap = win.querySelector<HTMLElement>('#pipPhoneScaleWrap');
    const shell = win.querySelector<HTMLElement>('#pipPhoneShell');
    const screenEl = win.querySelector<HTMLElement>('#pipScreen');
    if (!shell || !screenEl) return;

    layoutPhoneShell(shell, screenEl, g);
    shell.style.position = 'relative';
    shell.style.top = 'auto';
    shell.style.left = 'auto';
    shell.style.transform = 'none';

    if (scaleWrap) {
      const useZoom = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '1');
      scaleWrap.style.position = 'relative';
      scaleWrap.style.overflow = 'hidden';
      if (useZoom) {
        scaleWrap.style.zoom = String(displayScale);
        scaleWrap.style.width = g.shellW + 'px';
        scaleWrap.style.height = g.shellH + 'px';
        scaleWrap.style.transform = 'none';
      } else {
        scaleWrap.style.zoom = '';
        scaleWrap.style.width = Math.round(g.shellW * displayScale) + 'px';
        scaleWrap.style.height = Math.round(g.shellH * displayScale) + 'px';
        scaleWrap.style.transform = 'none';
        shell.style.position = 'absolute';
        shell.style.top = '0';
        shell.style.left = '0';
        shell.style.transform = 'scale(' + displayScale + ')';
        shell.style.transformOrigin = 'top left';
      }
    }

    const settings = ctx.getSettings();
    const dim = Math.max(0, Math.min(40, Number(settings.screenDim) || 0)) / 100;
    screenEl.style.background = 'rgba(0,0,0,' + dim + ')';
    const frameImg = win.querySelector<HTMLElement>('#pipPhoneFrame');
    if (frameImg) {
      frameImg.style.visibility = settings.showFrame ? 'visible' : 'hidden';
      frameImg.classList.toggle('opacity-0', !settings.showFrame);
    }
  };

  const observePipWindowResize = (win: Window) => {
    if (!win || typeof ResizeObserver === 'undefined') return;
    if (pipResizeObservers.has(win)) return;
    const ro = new ResizeObserver(() => {
      if (ctx.getPipSuppressResizeLayout()) return;
      if (!ctx.getPipOpen() && win !== (hostPipWindow() as unknown as Window)) return;
      layoutPipPhoneIn(win as unknown as HTMLElement);
      updatePipToolsUi();
    });
    ro.observe(win as unknown as Element);
    const body = (win as unknown as Element).querySelector('#pipBody');
    if (body) ro.observe(body);
    pipResizeObservers.set(win, ro);
  };

  const updatePipToolsUi = () => {
    const settings = ctx.getSettings();
    const device = ctx.getDevice();
    const pendingLen = ctx.getPending().length;
    const isDetached = !!ctx.getPipDetachMode();
    const detachMode = ctx.getPipDetachMode();
    const isExt = IS_EXTENSION;
    const toolsOpen = ctx.getPipToolsOpen();

    pipRoots().forEach((win) => {
      const doc = win.ownerDocument;
      const toggle = win.querySelector<HTMLElement>('#pipToolsToggle');
      const btn = win.querySelector<HTMLElement>('#btnPipTools');
      const pinBadge = win.querySelector<HTMLElement>('#pipPinBadge');
      const pinBtn = win.querySelector<HTMLElement>('#pipToolPin');
      const hdrPin = win.querySelector<HTMLElement>('#btnPipPin');

      win.classList.toggle('tools-collapsed', !toolsOpen);
      win.classList.toggle('pip-detached', isDetached && win !== hostPipWindow());
      if (pinBadge) pinBadge.classList.add('hidden');
      if (toggle) toggle.style.display = 'none';

      const pinHint = isDetached
        ? (detachMode === 'docpip'
          ? 'Document PiP · 点此收回'
          : (detachMode === 'host' ? '独立窗口 · 点此收回' : '独立窗回退 · 点此收回'))
        : (isExt
          ? '置顶到独立窗口（可离开主编辑区）'
          : (isIdeEmbeddedBrowser()
            ? '当前环境受限'
            : (supportsDocPip() ? 'Document PiP 精简置顶窗' : '回退：浏览器弹窗')));

      if (pinBtn) {
        pinBtn.textContent = '';
        pinBtn.appendChild(doc.createTextNode(isDetached ? '取消置顶' : '置顶弹出'));
        const s = doc.createElement('span');
        s.className = 'sub';
        s.id = 'pipToolPinSub';
        s.textContent = pinHint;
        pinBtn.appendChild(s);
      }
      if (hdrPin) {
        hdrPin.title = isDetached
          ? '取消置顶（收回宿主内）'
          : (isExt
            ? '置顶为独立窗口（可离开主编辑区，不打开系统浏览器）'
            : (supportsDocPip()
              ? 'Document PiP 置顶（精简浮窗）'
              : '当前环境无 Document PiP，将回退为弹窗'));
        const icon = hdrPin.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = isDetached ? 'keep_off' : 'keep';
        hdrPin.classList.toggle('text-cyber-cyan', isDetached);
      }
      if (btn) {
        btn.title = toolsOpen ? '隐藏功能框' : '显示功能框';
        btn.classList.toggle('text-cyber-cyan', toolsOpen);
      }
      const frameSub = win.querySelector<HTMLElement>('#pipToolFrameSub');
      if (frameSub) frameSub.textContent = settings.showFrame ? '显示中' : '已隐藏';
      const pendingSub = win.querySelector<HTMLElement>('#pipToolPendingSub');
      if (pendingSub) pendingSub.textContent = pendingLen + ' 条';
      const sizeEl = win.querySelector<HTMLElement>('#pipToolSize');
      const disp = Math.round(((win as unknown as { _pipDisplayScale?: number })._pipDisplayScale || 1) * 100);
      if (sizeEl) sizeEl.textContent = '视口 ' + device.width + '×' + device.height + ' · 显示 ' + disp + '%';
      const label = win.querySelector<HTMLElement>('#pipDeviceLabel');
      if (label) label.textContent = device.name + ' · 视口 ' + device.width + '×' + device.height + ' · 显示 ' + disp + '%';
    });
  };

  const layoutPipPhone = (opts?: { refit?: boolean }) => {
    pipRoots().forEach((win) => {
      observePipWindowResize(win as unknown as Window);
      layoutPipPhoneIn(win, opts);
    });
    updatePipToolsUi();
  };

  const expandPipWindowForTools = (opening: boolean) => {
    const delta = opening ? PIP_TOOLS_W : -PIP_TOOLS_W;
    ctx.setPipSuppressResizeLayout(true);
    pipRoots().forEach((win) => {
      if (win.classList.contains('pip-detached')) return;
      const rect = win.getBoundingClientRect();
      let w = Math.max(240, rect.width + delta);
      let left = rect.left;
      const top = rect.top;
      const h = rect.height;
      if (opening) {
        if (left + w > window.innerWidth - 8) {
          left = Math.max(8, window.innerWidth - 8 - w);
        }
        w = Math.min(w, window.innerWidth - 16);
      }
      win.style.width = w + 'px';
      win.style.height = h + 'px';
      win.style.left = left + 'px';
      win.style.top = top + 'px';
      win.dataset.userSized = '1';
    });
    updatePipToolsUi();
    layoutPipPhone();
    requestAnimationFrame(() => {
      layoutPipPhone();
      ctx.setPipSuppressResizeLayout(false);
    });
  };

  const expandDetachedPipForTools = (opening: boolean) => {
    const ext = ctx.getPipExternalWin();
    if (!ext || ext.closed) return;
    const delta = opening ? PIP_TOOLS_W : -PIP_TOOLS_W;
    ctx.setPipSuppressResizeLayout(true);
    try {
      const w = Math.max(240, (ext.outerWidth || ext.innerWidth) + delta);
      const h = ext.outerHeight || ext.innerHeight;
      ext.resizeTo(w, h);
    } catch (_) {}
    updatePipToolsUi();
    layoutPipPhone();
    requestAnimationFrame(() => {
      layoutPipPhone();
      ctx.setPipSuppressResizeLayout(false);
    });
  };

  const setPipToolsOpen = (on: boolean) => {
    const next = !!on;
    if (next === ctx.getPipToolsOpen()) return;
    ctx.setPipToolsOpen(next);
    if (!ctx.getPipDetachMode()) {
      expandPipWindowForTools(next);
      ctx.notify(next ? '功能框已展开' : '功能框已收起');
    } else {
      expandDetachedPipForTools(next);
      ctx.notify(next ? '功能框已展开' : '功能框已收起');
    }
  };

  const syncPipContent = () => {
    const loaded = ctx.getLoaded();
    const isExt = IS_EXTENSION;
    const proxyUrl = ctx.getCurrentProxyUrl();
    const demoSrc = ctx.buildDemoSrc();

    pipRoots().forEach((win) => {
      const pipFrame = win.querySelector<HTMLIFrameElement>('#pipFrame');
      const pipEmpty = win.querySelector<HTMLElement>('#pipEmpty');
      const pipEmptyText = win.querySelector<HTMLElement>('#pipEmptyText');
      if (!pipFrame) return;
      if (!loaded) {
        pipFrame.removeAttribute('src');
        pipFrame.srcdoc = '';
        if (pipEmpty) pipEmpty.classList.remove('hidden');
        if (pipEmptyText) pipEmptyText.textContent = '请先在主舞台加载预览';
        return;
      }
      if (isExt && proxyUrl) {
        pipFrame.removeAttribute('srcdoc');
        pipFrame.src = proxyUrl;
      } else {
        pipFrame.removeAttribute('src');
        pipFrame.srcdoc = demoSrc;
      }
      if (pipEmpty) pipEmpty.classList.add('hidden');
    });
    updatePipToolsUi();
  };

  const bindPipDocClicks = (doc: Document) => {
    const boundDocs = ctx.getPipDetachBoundDocs();
    if (!doc || boundDocs.has(doc)) return;
    boundDocs.add(doc);
    doc.addEventListener('click', handlePipButtonClick);
  };

  const handlePipButtonClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest('button') as HTMLElement | null;
    if (!btn || !btn.closest('#pipWindow')) return;
    const id = btn.id;
    if (id === 'btnPipClose') { closePip(); return; }
    if (id === 'btnPipPin' || id === 'pipToolPin') { void detachPipPin(); return; }
    if (id === 'btnPipTools') { setPipToolsOpen(!ctx.getPipToolsOpen()); return; }
    if (id === 'pipToolsToggle') { setPipToolsOpen(true); return; }
    if (id === 'pipToolHide') { setPipToolsOpen(false); return; }
    if (id === 'btnPipReload' || id === 'pipToolReload') {
      if (!ctx.getLoaded()) ctx.loadPreview(false);
      syncPipContent();
      ctx.notify('悬浮预览已刷新');
      return;
    }
    if (id === 'pipToolLoad') { ctx.loadPreview(true); syncPipContent(); return; }
    if (id === 'pipToolInspect') { ctx.setMode('inspect'); ctx.notify('已切入检查模式'); return; }
    if (id === 'pipToolPending') { ctx.setMode('pending'); return; }
    if (id === 'pipToolFrame') {
      const next = !ctx.getSettings().showFrame;
      ctx.setSetting('showFrame', next, next ? '外框 · 开' : '外框 · 关');
      layoutPipPhone();
      return;
    }
    if (id === 'pipToolApply') { void ctx.applyToCode(); }
  };

  const mountPipCloneInExternal = (extWin: Window): HTMLElement => {
    const host = hostPipWindow();
    if (!host || !extWin) throw new Error('no host/external');
    copyAssetsToExternalDoc(extWin.document);
    const clone = host.cloneNode(true) as HTMLElement;
    clone.classList.remove('pip-host-parked');
    clone.classList.add('pip-detached');
    clone.classList.toggle('tools-collapsed', !ctx.getPipToolsOpen());
    clone.style.cssText = 'position:relative;left:auto;top:auto;right:auto;bottom:auto;width:100%;height:100%;display:flex;max-width:none;max-height:none;';
    const frameImg = clone.querySelector<HTMLImageElement>('#pipPhoneFrame');
    if (frameImg) {
      const hostImg = (document.getElementById('phoneFrame') as HTMLImageElement | null) || (document.getElementById('pipPhoneFrame') as HTMLImageElement | null);
      const abs = hostImg && (hostImg.getAttribute('src') || hostImg.src);
      if (abs) frameImg.src = String(abs).split('?')[0];
    }
    const cloneFrame = clone.querySelector<HTMLIFrameElement>('#pipFrame');
    if (cloneFrame) cloneFrame.srcdoc = '';
    const sideToggle = clone.querySelector<HTMLElement>('#pipToolsToggle');
    if (sideToggle) sideToggle.remove();
    const badge = clone.querySelector<HTMLElement>('#pipPinBadge');
    if (badge) badge.classList.add('hidden');
    extWin.document.body.innerHTML = '';
    extWin.document.body.appendChild(clone);
    bindPipDocClicks(extWin.document);
    observePipWindowResize(extWin);
    return clone;
  };

  const fillExternalPip = (clone: HTMLElement) => {
    layoutPipPhoneIn(clone, { refit: false });
    const frame = clone.querySelector<HTMLIFrameElement>('#pipFrame');
    const empty = clone.querySelector<HTMLElement>('#pipEmpty');
    const emptyText = clone.querySelector<HTMLElement>('#pipEmptyText');
    let src = hostPipSrcdoc();
    if (!src && ctx.getLoaded()) src = ctx.buildDemoSrc();
    if (frame) {
      frame.srcdoc = '';
      frame.srcdoc = src || '';
      if (empty) empty.classList.toggle('hidden', !!src);
      if (emptyText && !src) emptyText.textContent = '请先在主舞台加载预览';
    }
    updatePipToolsUi();
  };

  const bindExternalPipLifecycle = (extWin: Window, clone: HTMLElement) => {
    let settled = false;
    let timer = 0;
    const onPipWinResize = () => {
      if (ctx.getPipSuppressResizeLayout() || settled) return;
      const programmatic = Date.now() - ctx.getPipProgrammaticFitAt() < 500;
      layoutPipPhoneIn(clone, { refit: !programmatic });
      updatePipToolsUi();
    };
    extWin.addEventListener('resize', onPipWinResize);

    const onHide = () => finishHide();
    const finishHide = () => {
      if (settled) return;
      settled = true;
      if (timer) clearInterval(timer);
      try {
        extWin.removeEventListener('pagehide', onHide);
        extWin.removeEventListener('unload', onHide);
        extWin.removeEventListener('resize', onPipWinResize);
      } catch (_) {}
      if (ctx.getPipExternalWin() !== extWin) return;
      ctx.setPipDetachMode(null);
      ctx.setPipExternalWin(null);
      parkHostPip(false);
      if (ctx.getPipOpen()) {
        const host = hostPipWindow();
        if (host) {
          host.classList.remove('pip-host-parked');
          layoutPipPhoneIn(host);
        }
        updatePipToolsUi();
        ctx.notify('已取消置顶 · 回到宿主内悬浮');
      } else {
        updatePipToolsUi();
      }
    };
    extWin.addEventListener('pagehide', onHide);
    extWin.addEventListener('unload', onHide);
    timer = window.setInterval(() => {
      if (!extWin || extWin.closed) finishHide();
    }, 400);
  };

  const openPopupPipWindow = (box?: { left: number; top: number; width: number; height: number }): Window => {
    const target = box || captureHostPipScreenBox();
    if (!target) throw new Error('no box');
    lockScaleFromHost();
    ctx.setPipSuppressResizeLayout(true);

    const features = [
      'popup=yes',
      'resizable=yes',
      'scrollbars=no',
      'width=' + target.width,
      'height=' + target.height,
      'left=' + Math.max(0, target.left),
      'top=' + Math.max(0, target.top),
    ].join(',');

    const popup = window.open('about:blank', 'mvb-pip-detach', features);
    if (!popup || popup === window) throw new Error('popup blocked');

    const clone = mountPipCloneInExternal(popup);
    ctx.setPipDetachMode('popup');
    ctx.setPipExternalWin(popup);
    fillExternalPip(clone);

    snapExternalContentToBox(popup, target, () => {
      fillExternalPip(clone);
      fitExternalInnerSize(popup, target);
      parkHostPip(true);
      setTimeout(() => {
        fitExternalInnerSize(popup, target);
        ctx.setPipSuppressResizeLayout(false);
      }, 120);
    });
    bindExternalPipLifecycle(popup, clone);
    return popup;
  };

  const openDocPipWindow = async (box?: { left: number; top: number; width: number; height: number }): Promise<Window> => {
    const target = box || captureHostPipScreenBox();
    if (!target) throw new Error('no box');
    if (!supportsDocPip()) throw new Error('Document PiP unsupported');
    lockScaleFromHost();
    ctx.setPipSuppressResizeLayout(true);

    const opts = {
      width: target.width,
      height: target.height,
      preferInitialWindowPlacement: false,
      disallowReturnToOpener: false,
    };
    const pipWin = await window.documentPictureInPicture!.requestWindow(opts);
    if (!pipWin || pipWin === window) throw new Error('invalid pip window');

    const clone = mountPipCloneInExternal(pipWin);
    ctx.setPipDetachMode('docpip');
    ctx.setPipExternalWin(pipWin);
    fillExternalPip(clone);

    snapExternalContentToBox(pipWin, target, () => {
      fillExternalPip(clone);
      parkHostPip(true);
      setTimeout(() => { ctx.setPipSuppressResizeLayout(false); }, 120);
    });
    bindExternalPipLifecycle(pipWin, clone);
    return pipWin;
  };

  const prepareHostPipForDetach = () => {
    const host = hostPipWindow();
    if (!host) return null;
    syncPipContent();
    lockScaleFromHost();
    layoutPipPhoneIn(host, { refit: false });
    const size = measurePipShellSize();
    const rect = host.getBoundingClientRect();
    host.style.width = size.width + 'px';
    host.style.height = size.height + 'px';
    host.style.left = Math.round(rect.left) + 'px';
    host.style.top = Math.round(rect.top) + 'px';
    host.dataset.userSized = '1';
    layoutPipPhoneIn(host, { refit: false });
    return captureHostPipScreenBox();
  };

  const detachPipPin = async () => {
    if (ctx.getPipDetachMode()) {
      await attachPipUnpin();
      return;
    }
    if (!ctx.getPipOpen()) openPip();
    if (!ctx.getLoaded()) ctx.loadPreview(false);
    const box = prepareHostPipForDetach() || captureHostPipScreenBox();
    if (!box) {
      ctx.notify('悬浮窗不可用');
      return;
    }

    if (IS_EXTENSION) {
      const g = devicePhoneGeometry(ctx.getDevice());
      VSCODE_API.postMessage({
        type: 'pip_detach',
        url: (ctx.getUrlInputValue() || '').trim(),
        proxyUrl: ctx.getCurrentProxyUrl() || '',
        deviceId: ctx.getDeviceId(),
        shellW: g.shellW,
        shellH: g.shellH,
        width: box.width,
        height: box.height,
      });
      ctx.setPipDetachMode('host');
      parkHostPip(true);
      updatePipToolsUi();
      ctx.notify('正在打开独立悬浮窗…');
      return;
    }

    if (supportsDocPip()) {
      try {
        await openDocPipWindow(box);
        ctx.notify('已 Document PiP 置顶 · 精简浮窗');
        return;
      } catch (err) {
        console.warn('Document PiP failed, fallback to popup', err);
        parkHostPip(false);
        ctx.setPipDetachMode(null);
        ctx.setPipExternalWin(null);
      }
    }

    if (isIdeEmbeddedBrowser()) {
      updatePipToolsUi();
      ctx.notify('当前内置页不支持置顶浮窗离开宿主；请在扩展面板内使用置顶');
      return;
    }

    try {
      openPopupPipWindow(box);
      ctx.notify('已回退为浏览器弹窗（无 Document PiP）');
      return;
    } catch (err2) {
      console.warn('popup pip failed', err2);
      parkHostPip(false);
      ctx.setPipDetachMode(null);
      ctx.setPipExternalWin(null);
    }

    ctx.notify('置顶失败 · 当前环境不支持离开宿主的浮窗');
  };

  const attachPipUnpin = async () => {
    if (!ctx.getPipDetachMode()) return;
    if (IS_EXTENSION && ctx.getPipDetachMode() === 'host') {
      VSCODE_API.postMessage({ type: 'pip_attach' });
      ctx.setPipDetachMode(null);
      ctx.setPipExternalWin(null);
      parkHostPip(false);
      const host = hostPipWindow();
      if (ctx.getPipOpen() && host) {
        host.classList.remove('pip-host-parked');
        layoutPipPhoneIn(host);
      }
      updatePipToolsUi();
      ctx.notify('已请求收回独立窗');
      return;
    }
    const ext = ctx.getPipExternalWin();
    ctx.setPipDetachMode(null);
    ctx.setPipExternalWin(null);
    parkHostPip(false);
    const host = hostPipWindow();
    if (ctx.getPipOpen() && host) {
      host.classList.remove('pip-host-parked');
      layoutPipPhoneIn(host);
      updatePipToolsUi();
    }
    try { if (ext && !ext.closed) ext.close(); } catch (_) {}
    updatePipToolsUi();
    ctx.notify('已取消置顶');
  };

  const placePipWindowVisible = (win?: HTMLElement | null, opts?: { keepSize?: boolean; keepPos?: boolean }) => {
    const target = win || hostPipWindow();
    if (!target) return;
    opts = opts || {};
    target.classList.remove('pip-detached', 'pip-host-parked');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    target.style.display = 'flex';
    target.style.position = 'fixed';
    target.style.zIndex = '9999';
    target.style.right = 'auto';
    target.style.bottom = 'auto';
    target.style.transform = 'none';
    target.style.opacity = '1';
    target.style.visibility = 'visible';

    const keepSize = !!opts.keepSize && target.dataset.userSized === '1';
    if (!keepSize) {
      ctx.setPipDisplayScaleLocked(mainStageDisplayScale());
      target.dataset.userSized = '0';
    }

    const size = measurePipShellSize();
    let w = keepSize ? target.offsetWidth : size.width;
    let h = keepSize ? target.offsetHeight : size.height;
    w = Math.max(220, Math.min(vw - 16, w));
    h = Math.max(300, Math.min(vh - 16, h));
    target.style.width = w + 'px';
    target.style.height = h + 'px';

    observePipWindowResize(target as unknown as Window);
    layoutPipPhoneIn(target, { refit: false });
    requestAnimationFrame(() => {
      layoutPipPhoneIn(target, { refit: false });
      updatePipToolsUi();
    });
    updatePipToolsUi();

    if (!opts.keepPos || !target.dataset.placed) {
      const left = Math.max(8, Math.min(vw - w - 8, Math.round((vw - w) * 0.55)));
      const top = Math.max(8, Math.min(vh - 64, 24));
      target.style.left = left + 'px';
      target.style.top = top + 'px';
    }
    target.dataset.placed = '1';
  };

  const openPip = () => {
    const modal = document.getElementById('pipModal');
    const win = hostPipWindow();
    if (!modal || !win) {
      ctx.notify('悬浮窗不可用，请刷新页面');
      return;
    }
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    ctx.setPipOpen(true);
    if (!ctx.getLoaded()) ctx.loadPreview(false);
    placePipWindowVisible(win);
    requestAnimationFrame(() => {
      syncPipContent();
      placePipWindowVisible(win, { keepPos: true });
    });
    ctx.notify('悬浮预览已打开 · 右下角可拖动调整大小');
  };

  const closePip = () => {
    if (ctx.getPipDetachMode()) {
      const ext = ctx.getPipExternalWin();
      ctx.setPipDetachMode(null);
      ctx.setPipExternalWin(null);
      parkHostPip(false);
      try { if (ext && !ext.closed) ext.close(); } catch (_) {}
    }
    const modal = document.getElementById('pipModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = '';
    }
    ctx.setPipOpen(false);
    const host = hostPipWindow();
    if (host) {
      const frameEl = host.querySelector<HTMLIFrameElement>('#pipFrame');
      if (frameEl) frameEl.srcdoc = '';
    }
  };

  const setupPipDrag = () => {
    const handle = document.getElementById('pipDragHandle');
    if (!handle) return;
    let dragging = false;
    let ox = 0;
    let oy = 0;
    let win: HTMLElement | null = null;

    handle.addEventListener('pointerdown', (e) => {
      if (ctx.getPipDetachMode()) return;
      if ((e.target as HTMLElement).closest('button')) return;
      win = hostPipWindow();
      if (!win) return;
      dragging = true;
      win.classList.add('dragging');
      const rect = win.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      win.style.left = rect.left + 'px';
      win.style.top = rect.top + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging || !win) return;
      const w = win.offsetWidth;
      const h = win.offsetHeight;
      const margin = 40;
      let left = e.clientX - ox;
      let top = e.clientY - oy;
      left = Math.min(window.innerWidth - margin, Math.max(margin - w, left));
      top = Math.min(window.innerHeight - margin, Math.max(0, top));
      win.style.left = left + 'px';
      win.style.top = top + 'px';
    });
    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (win) win.classList.remove('dragging');
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  };

  const setupPipResize = () => {
    const grip = document.getElementById('pipResizeHandle');
    if (!grip) return;
    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;
    let win: HTMLElement | null = null;

    grip.addEventListener('pointerdown', (e) => {
      if (ctx.getPipDetachMode()) return;
      win = hostPipWindow();
      if (!win) return;
      resizing = true;
      const rect = win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startW = rect.width;
      startH = rect.height;
      win.style.left = rect.left + 'px';
      win.style.top = rect.top + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      win.dataset.userSized = '1';
      grip.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });

    grip.addEventListener('pointermove', (e) => {
      if (!resizing || !win) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const left = win.offsetLeft;
      const top = win.offsetTop;
      let w = startW + (e.clientX - startX);
      let h = startH + (e.clientY - startY);
      w = Math.max(240, Math.min(vw - left - 8, w));
      h = Math.max(360, Math.min(vh - top - 8, h));
      win.style.width = w + 'px';
      win.style.height = h + 'px';
      layoutPipPhoneIn(win, { refit: true });
      updatePipToolsUi();
    });

    const endResize = (e: PointerEvent) => {
      if (!resizing) return;
      resizing = false;
      if (win) {
        layoutPipPhoneIn(win, { refit: true });
        updatePipToolsUi();
      }
      try { grip.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    grip.addEventListener('pointerup', endResize);
    grip.addEventListener('pointercancel', endResize);
  };

  const handleDeviceChange = () => {
    if (ctx.getPipOpen()) {
      if (!ctx.getPipDetachMode()) {
        placePipWindowVisible(hostPipWindow(), { keepSize: true, keepPos: true });
      } else {
        layoutPipPhone();
      }
      syncPipContent();
    }
  };

  const handleWindowResize = () => {
    if (ctx.getPipOpen() && !ctx.getPipDetachMode()) {
      const win = hostPipWindow();
      if (!win) return;
      const rect = win.getBoundingClientRect();
      if (rect.bottom < 40 || rect.right < 40 || rect.left > window.innerWidth - 40) {
        placePipWindowVisible(win, { keepSize: true });
      } else {
        const w = Math.min(win.offsetWidth, window.innerWidth - 16);
        const h = Math.min(win.offsetHeight, window.innerHeight - 16);
        win.style.width = w + 'px';
        win.style.height = h + 'px';
        layoutPipPhoneIn(win);
        updatePipToolsUi();
      }
    }
  };

  const handlePipDetachMessage = (msg: { type: string }) => {
    if (msg.type === 'pip_detach') {
      ctx.setPipDetachMode('host');
      parkHostPip(true);
      updatePipToolsUi();
      ctx.notify('已在独立窗口打开悬浮预览');
    } else if (msg.type === 'pip_attach_done') {
      ctx.setPipDetachMode(null);
      ctx.setPipExternalWin(null);
      parkHostPip(false);
      const host = hostPipWindow();
      if (ctx.getPipOpen() && host) {
        host.classList.remove('pip-host-parked');
        layoutPipPhoneIn(host);
      }
      updatePipToolsUi();
      ctx.notify('已收回独立悬浮窗');
    }
  };

  return {
    supportsDocPip,
    isIdeEmbeddedBrowser,
    canDetachExternally,
    hostPipWindow,
    pipRoots,
    pipEl,
    updatePipToolsUi,
    pipPhoneGeometry,
    pipBodyBox,
    mainStageDisplayScale,
    pipFitScaleForWin,
    pipResolveDisplayScale,
    measurePipShellSize,
    layoutPipPhoneIn,
    layoutPipPhone,
    expandPipWindowForTools,
    syncPipContent,
    bindPipDocClicks,
    handlePipButtonClick,
    parkHostPip,
    estimateViewportScreenOrigin,
    captureHostPipScreenBox,
    openPopupPipWindow,
    openDocPipWindow,
    setPipToolsOpen,
    detachPipPin,
    attachPipUnpin,
    placePipWindowVisible,
    observePipWindowResize,
    openPip,
    closePip,
    setupPipDrag,
    setupPipResize,
    handleDeviceChange,
    handleWindowResize,
    handlePipDetachMessage,
  };
}