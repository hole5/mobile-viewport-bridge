/**
 * Panel UI runtime — ported from ui-preview/ui2 design.
 * Peel pip / inspect / pending into sibling modules when needed.
 */
import { VSCODE_API, IS_EXTENSION } from '../bridge';
import { DEVICE_PRESETS } from '../devices';
import { DEFAULT_SETTINGS, loadSettings, persistSettings } from '../settings';
import { MODE_META, PICKABLES } from '../constants';
import { devicePhoneGeometry } from './geometry';
import {
  buildOps,
  mergeOps,
  summarizeOps,
  formatTime,
  withCacheBust,
  layoutPhoneShell,
  copyText,
} from './utils';
import { createPendingManager } from './pending';
import { createPipManager } from './pip';
import {
  userPhoneZoom,
  lastFitScale,
  sendHostToFrame as sendHostToFrameImpl,
  applyPhoneCanvasSize as applyPhoneCanvasSizeImpl,
  applyFullPageScale as applyFullPageScaleImpl,
  setUserPhoneZoom,
  setLastFitScale,
  toggleLandscape,
  isLandscape,
  setLandscape,
  setDprSimulation,
  setInteractiveMode,
  setShowNotch,
} from './layout';

/** Typed getElementById helper to avoid verbose casts at every call site. */
function $id<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function boot(): void {
  let currentProxyUrl = '';
  let liveSelection: Record<string, unknown> | null = null;

let mode = 'preview';
let deviceId = 'iphone-16';
let loaded = false;
let refreshKey = 0;
let pending: ReturnType<typeof createPendingManager>['toProtocolEdit'] extends never ? never : any[] = [];
let selectedPendingId = '';
let appliedHistory: { at: string; count: number; ids: string[] }[] = [];
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let selectedSel = '';
let settings = loadSettings();
let pipOpen = false;
/** Mode nav (MVB 侧栏) pinned open; rail 再点同一模式可收起 */
let modeNavPinned = true;

if (IS_EXTENSION) {
  document.body.classList.add('is-extension');
}

const modeList = $id<HTMLElement>('modeList');
const modeTitle = $id<HTMLElement>('modeTitle');
const modeHint = $id<HTMLElement>('modeHint');
const deviceSelect = $id<HTMLSelectElement>('deviceSelect');
const sizeLabel = $id<HTMLElement>('sizeLabel');
const screen = $id<HTMLElement>('screen');
const frame = $id<HTMLIFrameElement>('frame');
const emptyHint = $id<HTMLElement>('emptyHint');
const pendingBadge = $id<HTMLElement>('pendingBadge');
const urlInput = $id<HTMLInputElement>('urlInput');
const phoneFrame = $id<HTMLImageElement>('phoneFrame');
const phoneOffline = $id<HTMLElement>('phoneOffline');

function device() {
  return DEVICE_PRESETS.find((d) => d.id === deviceId) || DEVICE_PRESETS[0];
}

function notify(msg) {
  let el = document.querySelector('.toast') as HTMLElement | null;
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  // 防止被 flex 布局挤到侧栏：始终挂在 body 末尾并强制 fixed
  if (el.parentElement !== document.body) document.body.appendChild(el);
  el.textContent = msg;
  el.style.cssText = '';
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, settings.toastMs || 2000);
}

function settingsSummaryText() {
  return [
    'showFrame: ' + settings.showFrame,
    'frameGlow: ' + settings.frameGlow,
    'screenDim: ' + settings.screenDim + '%',
    'wheelZoom: ' + settings.wheelZoom,
    'dblclickReset: ' + settings.dblclickReset,
    'showZoomBar: ' + settings.showZoomBar,
    'autoLoadInspect: ' + settings.autoLoadInspect,
    'mergePending: ' + settings.mergePending,
    'copyOnApply: ' + settings.copyOnApply,
    'showMcpPill: ' + settings.showMcpPill,
    'toastMs: ' + settings.toastMs,
    'defaultUrl: ' + settings.defaultUrl,
    'interactiveMode: ' + settings.interactiveMode,
    'fullPageScale: ' + settings.fullPageScale,
    'dprSimulation: ' + settings.dprSimulation,
    'touchSimulation: ' + settings.touchSimulation,
    'showNotch: ' + settings.showNotch,
  ].join('\n');
}

function applySettings() {
  const phoneEl = document.getElementById('phone');
  const frameImg = document.getElementById('phoneFrame');
  const screenEl = document.getElementById('screen');
  const hint = document.getElementById('emptyHint');
  const zoomBar = document.getElementById('zoomBar');
  const mcp = document.getElementById('mcpPill');
  const summary = document.getElementById('settingsSummary');

  if (frameImg) {
    frameImg.classList.toggle('opacity-0', !settings.showFrame);
    frameImg.style.visibility = settings.showFrame ? 'visible' : 'hidden';
    // 切换手机框样式
    const styleKey = settings.frameStyle === 'style1' ? 'data-screen-style1' : 'data-screen-default';
    const newSrc = frameImg.getAttribute(styleKey);
    if (newSrc && frameImg.getAttribute('src') !== newSrc) {
      frameImg.setAttribute('src', newSrc);
    }
  }
  if (phoneEl) {
    phoneEl.classList.toggle('phone-frame-glow', !!settings.frameGlow);
    if (!settings.frameGlow) {
      phoneEl.style.filter = 'drop-shadow(0 18px 40px rgba(0,0,0,.45))';
    } else {
      phoneEl.style.filter = 'none';
    }
  }
  const dim = Math.max(0, Math.min(40, Number(settings.screenDim) || 0)) / 100;
  if (screenEl) screenEl.style.background = 'rgba(0,0,0,' + dim + ')';
  if (hint) hint.style.background = 'rgba(0,0,0,' + Math.min(0.45, dim + 0.08) + ')';
  if (zoomBar) zoomBar.classList.toggle('hidden', !settings.showZoomBar);
  if (mcp) mcp.classList.toggle('hidden', !settings.showMcpPill);
  if (summary) summary.textContent = settingsSummaryText();
  document.getElementById('btnApply').title = settings.copyOnApply
    ? '应用到代码并复制 MCP 提示（演示）'
    : '应用到代码（演示，不自动复制）';

  // 同步预览体验设置
  setInteractiveMode(settings.interactiveMode);
  setDprSimulation(settings.dprSimulation);
  setShowNotch(settings.showNotch);
  applyPhoneCanvasSize(device());
  syncTouchSimulationToFrame();

  // 同步工具栏按钮状态
  const btnInteractive = document.getElementById('btnInteractive');
  if (btnInteractive) {
    btnInteractive.classList.toggle('text-cyber-cyan', settings.interactiveMode);
    btnInteractive.classList.toggle('border-cyber-cyan/50', settings.interactiveMode);
  }
  const btnDprEl = document.getElementById('btnDpr');
  if (btnDprEl) {
    btnDprEl.classList.toggle('text-cyber-cyan', settings.dprSimulation);
    btnDprEl.classList.toggle('border-cyber-cyan/50', settings.dprSimulation);
  }
  const btnTouchEl = document.getElementById('btnTouch');
  if (btnTouchEl) {
    btnTouchEl.classList.toggle('text-cyber-cyan', settings.touchSimulation);
    btnTouchEl.classList.toggle('border-cyber-cyan/50', settings.touchSimulation);
  }
  const btnNotchEl = document.getElementById('btnNotch');
  if (btnNotchEl) {
    btnNotchEl.classList.toggle('text-cyber-cyan', settings.showNotch);
    btnNotchEl.classList.toggle('border-cyber-cyan/50', settings.showNotch);
  }

  if (pipOpen) layoutPipPhone();
}

function setSetting(key, value, toastLabel) {
  settings[key] = value;
  persistSettings(settings);
  applySettings();
  if (mode === 'settings') renderModeList();
  if (toastLabel) notify(toastLabel);
}

const pendingMgr = createPendingManager({
  getPending: () => pending,
  setPending: (items) => { pending = items; },
  getSelectedId: () => selectedPendingId,
  setSelectedId: (id) => { selectedPendingId = id; },
  getAppliedHistory: () => appliedHistory,
  setAppliedHistory: (h) => { appliedHistory = h; },
  getMode: () => mode,
  getSettings: () => settings,
  notify,
  applySelection,
  setMode,
  renderModeList,
  pendingBadge,
});

function toProtocolEdit(p) { return pendingMgr.toProtocolEdit(p); }
function buildApplyPrompt() { return pendingMgr.buildApplyPrompt(); }
function refreshPendingUi() { pendingMgr.refreshPendingUi(); }
function upsertPending(fields) { return pendingMgr.upsertPending(fields); }
function removePending(id) { pendingMgr.removePending(id); }
function clearAllPending(silent) { pendingMgr.clearAllPending(silent); }
function focusPendingEdit(p) { pendingMgr.focusPendingEdit(p); }
async function applyToCode() { await pendingMgr.applyToCode(); }
function updatePendingBadge() { pendingMgr.updatePendingBadge(); }

let pipToolsOpen = false;
let pipDetachMode = null;
let pipExternalWin = null;
let pipDetachBoundDocs = new WeakSet();
let pipDisplayScaleLocked = null;
let pipSuppressResizeLayout = false;
let pipProgrammaticFitAt = 0;

const pipMgr = createPipManager({
  getPipOpen: () => pipOpen,
  setPipOpen: (v) => { pipOpen = v; },
  getPipToolsOpen: () => pipToolsOpen,
  setPipToolsOpen: (v) => { pipToolsOpen = v; },
  getPipDetachMode: () => pipDetachMode,
  setPipDetachMode: (v) => { pipDetachMode = v; },
  getPipExternalWin: () => pipExternalWin,
  setPipExternalWin: (v) => { pipExternalWin = v; },
  getPipDisplayScaleLocked: () => pipDisplayScaleLocked,
  setPipDisplayScaleLocked: (v) => { pipDisplayScaleLocked = v; },
  getPipSuppressResizeLayout: () => pipSuppressResizeLayout,
  setPipSuppressResizeLayout: (v) => { pipSuppressResizeLayout = v; },
  getPipProgrammaticFitAt: () => pipProgrammaticFitAt,
  setPipProgrammaticFitAt: (v) => { pipProgrammaticFitAt = v; },
  getPipDetachBoundDocs: () => pipDetachBoundDocs,
  getLoaded: () => loaded,
  getCurrentProxyUrl: () => currentProxyUrl,
  getSettings: () => settings,
  getDeviceId: () => deviceId,
  getDevice: () => device(),
  getUrlInputValue: () => urlInput.value,
  getPending: () => pending,
  notify,
  loadPreview,
  setMode,
  setSetting,
  applyToCode,
  buildDemoSrc,
  getFrame: () => frame,
});

function updateTouchLabel() {
  const label = document.getElementById('touchLabel');
  if (!label) return;
  if (settings.touchSimulation) {
    label.textContent = '模拟中';
    label.className = 'text-cyber-cyan';
    return;
  }
  const d = device();
  label.textContent = d.hasTouch ? '机型支持' : '未启用';
  label.className = d.hasTouch ? 'text-slate-300' : 'text-slate-500';
}

/** 把触控模拟开关同步进 iframe（代理页 picker / 演示 srcdoc 均监听 mvb-host） */
function syncTouchSimulationToFrame() {
  updateTouchLabel();
  sendHostToFrame('touchSimulation', { enabled: !!settings.touchSimulation });
}

function syncDeviceChrome() {
  const d = device();
  sizeLabel.textContent = d.width + '×' + d.height;
  document.getElementById('deviceLabel').textContent = d.name;
  document.getElementById('dprLabel').textContent = String(d.deviceScaleFactor);
  updateTouchLabel();
  deviceSelect.value = d.id;
  applyPhoneCanvasSize(d);
  if (pipOpen) layoutPipPhone();
  if (loaded) {
    if (!IS_EXTENSION) {
      const f = $id<HTMLIFrameElement>('frame');
      if (f) f.srcdoc = buildDemoSrc();
    }
    syncPipContent();
  }
}

function framePointerEvents(): string {
  return settings.interactiveMode || mode === 'inspect' ? 'auto' : 'none';
}

function applyConfigure(msg) {
  if (!msg) return;
  if (msg.deviceId) deviceId = String(msg.deviceId);
  if (msg.url) urlInput.value = String(msg.url);
  if (typeof msg.landscape === 'boolean' && msg.landscape !== isLandscape) {
    setLandscape(msg.landscape);
    const btnRotateEl = document.getElementById('btnRotate');
    if (btnRotateEl) {
      btnRotateEl.classList.toggle('text-cyber-cyan', msg.landscape);
      btnRotateEl.classList.toggle('border-cyber-cyan/50', msg.landscape);
    }
  }
  currentProxyUrl = String(msg.proxyUrl || msg.url || '');
  syncDeviceChrome();
  if (!currentProxyUrl) return;
  loaded = true;
  emptyHint.classList.add('hidden');
  frame.classList.remove('pointer-events-none');
  frame.style.pointerEvents = framePointerEvents();
  frame.removeAttribute('srcdoc');
  frame.src = withCacheBust(currentProxyUrl);
  applyPhoneCanvasSize(device());
  // 重载后 picker_ready 会再同步；此处作备份（延迟等待 iframe 就绪）
  setTimeout(() => syncTouchSimulationToFrame(), 300);
  setTimeout(() => syncTouchSimulationToFrame(), 1000);
  if (pipOpen) {
    layoutPipPhone();
    syncPipContent();
  }
  const mcp = document.getElementById('mcpPill');
  if (mcp && !mcp.textContent.includes('Picker')) {
    mcp.textContent = 'MCP ON';
  }
}

function sendHostToFrame(type: string, payload: unknown) {
  sendHostToFrameImpl(frame, type, payload);
}

/** 最近一次上报的页面高度（整页缩放开关打开时使用） */
let lastPageHeight = 0;
let pageHeightTimer: ReturnType<typeof setTimeout> | null = null;

function applyPhoneCanvasSize(d: Parameters<typeof applyPhoneCanvasSizeImpl>[0]) {
  applyPhoneCanvasSizeImpl(d);
  // layout 只看 interactiveMode；检查模式也需要可点选
  if (frame) frame.style.pointerEvents = framePointerEvents();
  // 画布重算后，若开启整页缩放则重新压入视口（避免被 DPR transform 盖掉）
  if (settings.fullPageScale && lastPageHeight > d.height) {
    applyFullPageScaleTransform(lastPageHeight);
  }
}

/** 默认真机滚动；仅 settings.fullPageScale=true 时做等比缩略 */
function applyFullPageScale(pageHeight?: number) {
  if (typeof pageHeight === 'number' && pageHeight > 0) {
    lastPageHeight = pageHeight;
  }
  const d = device();
  if (!settings.fullPageScale) {
    // 真机滚动：恢复设备视口（含 DPR / 横屏）
    applyFullPageScaleImpl();
    applyPhoneCanvasSizeImpl(d);
    return;
  }
  applyFullPageScaleTransform(lastPageHeight || pageHeight || 0);
}

function applyFullPageScaleTransform(pageHeight: number) {
  const d = device();
  const frameEl = document.getElementById('frame');
  const pipFrameEl = document.getElementById('pipFrame');
  const actualHeight = Math.max(0, pageHeight || 0);
  if (!frameEl) return;

  if (actualHeight <= d.height || actualHeight === 0) {
    applyFullPageScaleImpl();
    applyPhoneCanvasSizeImpl(d);
    return;
  }

  const scale = d.height / actualHeight;
  frameEl.style.width = d.width + 'px';
  frameEl.style.height = actualHeight + 'px';
  frameEl.style.transformOrigin = 'top left';
  frameEl.style.transform = 'scale(' + scale + ')';

  if (pipFrameEl) {
    pipFrameEl.style.width = d.width + 'px';
    pipFrameEl.style.height = actualHeight + 'px';
    pipFrameEl.style.transformOrigin = 'top left';
    pipFrameEl.style.transform = 'scale(' + scale + ')';
  }
}

function buildDemoSrc() {
  const d = device();
  const url = urlInput.value;
  // 横屏时 viewport 宽 = 竖屏高，页面才能延展铺满长边
  const vw = isLandscape ? d.height : d.width;
  const vh = isLandscape ? d.width : d.height;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=${vw},initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;min-width:100%;min-height:100%;height:auto;overflow:auto;overscroll-behavior:contain}
  body{font-family:system-ui,sans-serif;background:#0b1220;color:#e2e8f0;padding:20px 16px;-webkit-overflow-scrolling:touch}
  .hero{font-size:20px;font-weight:700;margin-bottom:6px;cursor:crosshair;border-radius:6px;outline-offset:3px}
  .sub{font-size:11px;opacity:.6;margin-bottom:16px;word-break:break-all}
  .card{background:#13222a;border:1px solid rgba(77,238,234,.3);border-radius:14px;padding:14px;margin-bottom:12px;cursor:crosshair;outline-offset:3px;transition:outline .12s,box-shadow .12s}
  .card:active{transform:scale(.98)}
  .chip{display:inline-block;padding:3px 8px;border-radius:999px;font-size:10px;background:rgba(77,238,234,.15);color:#4deeea;margin-right:4px}
  [data-sel].hov{outline:2px dashed rgba(77,238,234,.7);box-shadow:0 0 0 4px rgba(77,238,234,.12)}
  [data-sel].on{outline:2px solid #4deeea;box-shadow:0 0 0 4px rgba(77,238,234,.22)}
  body.pick{cursor:crosshair}
</style></head><body class="pick">
  <div class="hero" id="t1" data-sel="h1.hero" data-text="Mobile Viewport" data-color="#e2e8f0" data-fs="20px" data-fw="700" data-w="auto" data-h="auto" data-dis="block" data-br="6px" data-margin="0 0 6px" data-padding="0">Mobile Viewport</div>
  <div class="sub">${url}</div>
  <div class="card" id="c1" data-sel="div.card#overview" data-text="今日概览 — 点我选中" data-color="#4deeea" data-fs="14px" data-fw="500" data-w="auto" data-h="auto" data-dis="block" data-br="14px" data-margin="0 0 12px" data-padding="14px">
<span class="chip">${d.name}</span>
<span class="chip">${vw}×${vh}${isLandscape ? ' · 横屏' : ''}</span>
<div style="margin-top:10px;font-size:14px;color:#4deeea" id="c1text" data-edit-text>今日概览 — 点我选中</div>
  </div>
  <div class="card" id="c2" data-sel="div.card#cta" data-text="开始体验" data-color="#0a1a1f" data-fs="15px" data-fw="700" data-w="auto" data-h="auto" data-dis="block" data-br="10px" data-margin="0 0 12px" data-padding="0">
<div id="c2text" data-edit-text style="background:#4deeea;color:#0a1a1f;text-align:center;padding:10px;border-radius:10px;font-weight:700;font-size:15px">开始体验</div>
  </div>
  <div class="card"><div style="font-size:13px;line-height:1.6">📱 滚动测试区 — 鼠标滚轮 / 触控板上下滚动即可在手机内浏览长页面，与真实手机浏览器一致。</div></div>
  ${Array.from({length: 6}, (_, i) => `<div class="card"><span class="chip">卡片 ${i+1}</span><div style="margin-top:8px;font-size:13px;line-height:1.5">这是第 ${i+1} 段示例内容，用来演示页面在手机屏幕内的自然滚动行为。实际使用时，把预览 URL 替换成你自己的页面即可。</div></div>`).join('')}
<script>
  let current = null;
  function mark(sel){
document.querySelectorAll('[data-sel]').forEach(n=>n.classList.remove('on'));
const el = document.querySelector('[data-sel="'+sel+'"]');
if(el){ el.classList.add('on'); current = el; }
  }
  function emit(el){
const textNode = el.querySelector('[data-edit-text]');
parent.postMessage({
  type:'demo-select',
  sel: el.dataset.sel,
  text: el.dataset.text || (textNode ? textNode.textContent : el.innerText.slice(0,40)),
  color: el.dataset.color || '',
  fontSize: el.dataset.fs || '',
  fontWeight: el.dataset.fw || '',
  width: el.dataset.w || '',
  height: el.dataset.h || '',
  display: el.dataset.dis || '',
  borderRadius: el.dataset.br || '',
  margin: el.dataset.margin || '',
  padding: el.dataset.padding || '',
  src: el.dataset.src || ''
},'*');
  }
  document.querySelectorAll('[data-sel]').forEach(el=>{
el.addEventListener('mouseenter',()=>{ if(!el.classList.contains('on')) el.classList.add('hov'); });
el.addEventListener('mouseleave',()=> el.classList.remove('hov'));
el.addEventListener('click',e=>{
  e.stopPropagation();
  e.preventDefault();
  document.querySelectorAll('[data-sel]').forEach(n=>n.classList.remove('on','hov'));
  el.classList.add('on');
  current = el;
  emit(el);
});
  });
  let touchSimStyle = null;
  let touchNavPatched = false;
  function setTouchSimulation(enabled){
    var root = document.documentElement;
    try {
      if (enabled && !touchNavPatched) {
        Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, get: function(){ return 5; } });
        if (!('ontouchstart' in window)) { try { window.ontouchstart = null; } catch(_){} }
        touchNavPatched = true;
      }
    } catch(_){}
    if (enabled) {
      if (root) root.classList.add('mvb-touch-sim');
      if (touchSimStyle) return;
      touchSimStyle = document.createElement('style');
      touchSimStyle.setAttribute('data-mvb','touch-simulation');
      touchSimStyle.textContent = 'html.mvb-touch-sim,html.mvb-touch-sim *{-webkit-tap-highlight-color:transparent!important;touch-action:manipulation!important}html.mvb-touch-sim *:hover{cursor:pointer!important;transition:none!important;transform:none!important;filter:none!important;box-shadow:none!important;outline:none!important;text-decoration:inherit!important}';
      if (root) root.appendChild(touchSimStyle);
    } else {
      if (root) root.classList.remove('mvb-touch-sim');
      if (touchSimStyle && touchSimStyle.parentNode) touchSimStyle.parentNode.removeChild(touchSimStyle);
      touchSimStyle = null;
    }
  }
  window.addEventListener('message',e=>{
const m = e.data;
if(!m) return;
if(m.source==='mvb-host' && m.type==='touchSimulation'){
  setTouchSimulation(!!(m.payload && m.payload.enabled));
  return;
}
if(m.type==='inspect-highlight' && m.sel){ mark(m.sel); return; }
if(m.type==='inspect-clear'){
  document.querySelectorAll('[data-sel]').forEach(n=>n.classList.remove('on','hov'));
  current = null;
  return;
}
if(m.type==='inspect-apply' && m.sel){
  const el = document.querySelector('[data-sel="'+m.sel+'"]');
  if(!el) return;
  mark(m.sel);
  const textNode = el.querySelector('[data-edit-text]') || el;
  if(m.text!=null && m.text!==''){
    textNode.textContent = m.text;
    el.dataset.text = m.text;
  }
  if(m.color){
    textNode.style.color = m.color;
    el.dataset.color = m.color;
    if(el.id==='c2'){ textNode.style.background = m.color==='#0a1a1f' ? '#4deeea' : m.color; }
  }
  if(m.fontSize){ textNode.style.fontSize = m.fontSize; el.dataset.fs = m.fontSize; }
  if(m.fontWeight){ textNode.style.fontWeight = m.fontWeight; el.dataset.fw = m.fontWeight; }
  if(m.width){ textNode.style.width = m.width; el.dataset.w = m.width; }
  if(m.height){ textNode.style.height = m.height; el.dataset.h = m.height; }
  if(m.display){ textNode.style.display = m.display; el.dataset.dis = m.display; }
  if(m.borderRadius){ textNode.style.borderRadius = m.borderRadius; el.dataset.br = m.borderRadius; }
  if(m.margin){ el.style.margin = m.margin; el.dataset.margin = m.margin; }
  if(m.padding){ el.style.padding = m.padding; el.dataset.padding = m.padding; }
  if(m.src && textNode.tagName==='IMG') textNode.src = m.src;
  parent.postMessage({ type:'inspect-applied', sel: m.sel }, '*');
}
  });
  // wheel inside the demo iframe now scrolls natively (like a real phone browser).
  // Zoom control is handled at the host level (outside the phone screen).
<\/script>
</body></html>`;
}

function renderModeList() {
  const meta = MODE_META[mode];
  modeTitle.textContent = meta.title;
  modeHint.textContent = meta.hint;
  modeList.innerHTML = '';

  if (mode === 'preview') {
    const d = device();
    const rows = [
      { k: '当前设备', v: d.name },
      { k: '视口', v: d.width + '×' + d.height },
      { k: 'DPR', v: String(d.deviceScaleFactor) },
      { k: '地址', v: urlInput.value || '—' },
      { k: '预览', v: loaded ? '已加载' : '未加载' },
      { k: 'pending', v: String(pending.length) },
    ];
    rows.forEach((it) => {
      const row = document.createElement('div');
      row.className = 'px-4 py-2.5 text-xs border-b border-white/5';
      row.innerHTML = '<div class="text-slate-500">' + it.k + '</div><div class="text-slate-200 mt-0.5 break-all">' + it.v + '</div>';
      modeList.appendChild(row);
    });
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'mx-3 mt-3 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs font-semibold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 hover:bg-cyber-cyan/30';
    go.textContent = '去选择设备 →';
    go.addEventListener('click', () => setMode('devices'));
    modeList.appendChild(go);
    return;
  }

  if (mode === 'devices') {
    DEVICE_PRESETS.forEach((d) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'mode-nav-item' + (d.id === deviceId ? ' is-active' : '');
      row.innerHTML = '<i class="fa-solid fa-circle-dot text-[8px] shrink-0"></i><span class="truncate">' + d.name +
        '</span><span class="res">' + d.width + '×' + d.height + '</span>';
      row.addEventListener('click', () => {
        deviceId = d.id;
        syncDeviceChrome();
        renderModeList();
        if (IS_EXTENSION) {
          VSCODE_API.postMessage({ type: 'device_change', deviceId });
        } else if (loaded) {
          loadPreview(false);
        }
        notify('设备：' + d.name + ' · ' + d.width + '×' + d.height);
      });
      modeList.appendChild(row);
    });
    return;
  }

  if (mode === 'pending') {
    const head = document.createElement('div');
    head.className = 'px-3 pb-2 space-y-2';
    head.innerHTML =
      '<div class="flex items-center justify-between text-xs">' +
      '<span class="text-slate-400">队列</span>' +
      '<span class="font-mono text-cyber-cyan">' + pending.length + '</span></div>';
    modeList.appendChild(head);

    const actions = document.createElement('div');
    actions.className = 'px-3 pb-3 flex flex-col gap-1.5';
    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.disabled = !pending.length;
    applyBtn.className = 'w-full px-3 py-2 rounded-lg text-xs font-semibold bg-cyber-cyan/85 text-black hover:bg-cyber-cyan disabled:opacity-40 disabled:cursor-not-allowed';
    applyBtn.textContent = '应用到代码';
    applyBtn.addEventListener('click', () => { void applyToCode(); });
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.disabled = !pending.length;
    clearBtn.className = 'w-full px-3 py-1.5 rounded-lg text-xs border border-cyber-border text-slate-400 hover:text-rose-300 hover:border-rose-400/40 disabled:opacity-40';
    clearBtn.textContent = '清空队列';
    clearBtn.addEventListener('click', () => clearAllPending(false));
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.disabled = !pending.length;
    copyBtn.className = 'w-full px-3 py-1.5 rounded-lg text-xs border border-cyber-border text-slate-400 hover:text-cyber-cyan hover:border-cyber-cyan/50 disabled:opacity-40';
    copyBtn.textContent = '复制 MCP 提示';
    copyBtn.addEventListener('click', async () => {
      if (!pending.length) return;
      const ok = await copyText(buildApplyPrompt());
      notify(ok ? 'MCP 提示已复制' : '复制失败');
    });
    actions.appendChild(applyBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(clearBtn);
    modeList.appendChild(actions);

    if (!pending.length) {
      const empty = document.createElement('div');
      empty.className = 'px-4 py-3 text-xs text-slate-500 leading-relaxed';
      empty.textContent = '暂无 pending。在属性检查中写入预览后会出现在此。';
      modeList.appendChild(empty);
      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'mx-3 mt-1 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs font-semibold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 hover:bg-cyber-cyan/30';
      go.textContent = '去属性检查 →';
      go.addEventListener('click', () => setMode('inspect'));
      modeList.appendChild(go);
    } else {
      pending.slice().reverse().forEach((p) => {
        const wrap = document.createElement('div');
        const active = selectedPendingId === p.id;
        wrap.className = 'mx-2 mb-1.5 rounded-lg border overflow-hidden ' +
          (active ? 'border-cyber-cyan/50 bg-cyber-cyan/10' : 'border-white/5 bg-black/20');

        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'w-full text-left px-3 py-2.5 hover:bg-white/5';
        row.innerHTML =
          '<div class="flex items-center justify-between gap-2">' +
          '<span class="text-[10px] font-mono text-cyber-cyan truncate">' + p.id + '</span>' +
          '<span class="text-[9px] text-slate-500 shrink-0">' + formatTime(p.updatedAt || p.createdAt) + '</span>' +
          '</div>' +
          '<div class="text-[11px] text-slate-300 mt-1 font-mono truncate">' + p.sel + '</div>' +
          '<div class="text-[10px] text-slate-500 mt-0.5 truncate">' + summarizeOps(p.ops) +
          (p.text ? ' · ' + String(p.text).slice(0, 18) : '') + '</div>';
        row.addEventListener('click', () => focusPendingEdit(p));

        const tools = document.createElement('div');
        tools.className = 'flex border-t border-white/5';
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'flex-1 px-2 py-1.5 text-[10px] text-slate-500 hover:text-rose-300 hover:bg-rose-500/10';
        del.textContent = '删除';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          removePending(p.id);
        });
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'flex-1 px-2 py-1.5 text-[10px] text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 border-l border-white/5';
        editBtn.textContent = '检查编辑';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          focusPendingEdit(p);
          setMode('inspect', { quiet: true });
          notify('已载入队列项，可修改后再次写入');
        });
        tools.appendChild(del);
        tools.appendChild(editBtn);
        wrap.appendChild(row);
        wrap.appendChild(tools);
        modeList.appendChild(wrap);
      });
    }

    if (appliedHistory.length) {
      const histTitle = document.createElement('div');
      histTitle.className = 'px-3 pt-3 mt-2 border-t border-cyber-border/40 text-[10px] uppercase tracking-wider text-slate-500';
      histTitle.textContent = '最近应用';
      modeList.appendChild(histTitle);
      appliedHistory.slice(0, 3).forEach((h) => {
        const row = document.createElement('div');
        row.className = 'px-4 py-2 text-[11px] text-slate-500';
        row.innerHTML = '<span class="text-emerald-400/90">' + h.count + ' 条</span>' +
          ' · ' + formatTime(h.at) +
          '<div class="font-mono text-[9px] text-slate-600 mt-0.5 truncate">' + h.ids.join(', ') + '</div>';
        modeList.appendChild(row);
      });
    }
    return;
  }

  if (mode === 'inspect') {
    const tip = document.createElement('div');
    tip.className = 'px-3 pb-2 text-[11px] text-slate-500 leading-relaxed';
    tip.textContent = loaded
      ? '在手机内点击，或从下方节点选取：'
      : '将自动加载演示预览以便选取…';
    modeList.appendChild(tip);

    PICKABLES.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.sel = p.sel;
      const active = selectedSel === p.sel;
      btn.className = 'w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ' +
        (active
          ? 'active-nav-item text-white'
          : 'hover:bg-white/5 text-slate-300');
      btn.innerHTML =
        '<div class="flex items-center gap-2">' +
        '<i class="fa-solid fa-crosshairs text-[10px] ' + (active ? 'text-cyber-cyan' : 'text-slate-500') + '"></i>' +
        '<span class="text-xs font-medium">' + p.label + '</span>' +
        '</div>' +
        '<div class="text-[10px] text-slate-500 mt-0.5 pl-4 font-mono truncate">' + p.sel + '</div>' +
        '<div class="text-[11px] text-slate-400 mt-0.5 pl-4 truncate">' + p.desc + '</div>';
      btn.addEventListener('click', () => {
        if (!loaded) loadPreview(false);
        applySelection({
          sel: p.sel,
          text: p.text,
          color: p.color,
          fontSize: p.fontSize,
          fontWeight: p.fontWeight,
          width: p.width,
          height: p.height,
          display: p.display,
          borderRadius: p.borderRadius,
          margin: p.margin,
          padding: p.padding,
          src: p.src || '',
        }, true);
      });
      modeList.appendChild(btn);
    });

    const reloadBtn = document.createElement('button');
    reloadBtn.type = 'button';
    reloadBtn.className = 'mx-3 mt-3 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs border border-cyber-border text-slate-400 hover:text-cyber-cyan hover:border-cyber-cyan/50';
    reloadBtn.textContent = loaded ? '重新加载演示页' : '加载演示页';
    reloadBtn.addEventListener('click', () => {
      loadPreview(true);
      clearSelection(false);
    });
    modeList.appendChild(reloadBtn);
    return;
  }

  if (mode === 'settings') {
    const tip = document.createElement('div');
    tip.className = 'px-3 pb-2 text-[11px] text-slate-500 leading-relaxed';
    tip.textContent = '偏好即时生效，并保存到本机 localStorage。';
    modeList.appendChild(tip);

    function addSection(title) {
      const el = document.createElement('div');
      el.className = 'px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500';
      el.textContent = title;
      modeList.appendChild(el);
    }

    function addToggle(key, label, hint) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'setting-row mx-2';
      btn.style.width = 'calc(100% - 1rem)';
      const on = !!settings[key];
      btn.innerHTML =
        '<div class="min-w-0"><div class="text-xs text-slate-200">' + label + '</div>' +
        (hint ? '<div class="meta">' + hint + '</div>' : '') + '</div>' +
        '<span class="toggle-pill' + (on ? ' on' : '') + '" aria-hidden="true"></span>';
      btn.addEventListener('click', () => {
        const next = !settings[key];
        setSetting(key, next, label + (next ? ' · 开' : ' · 关'));
      });
      modeList.appendChild(btn);
    }

    addSection('画布');
    addToggle('showFrame', '手机外框', '显示机框图');
    addToggle('frameGlow', '机框高亮描边', 'phone-frame-glow');

    // 手机框样式切换
    const frameStyleBtn = document.createElement('button');
    frameStyleBtn.type = 'button';
    frameStyleBtn.className = 'setting-row mx-2';
    frameStyleBtn.style.width = 'calc(100% - 1rem)';
    const frameStyleLabel = settings.frameStyle === 'style1' ? '新框 (ui-screen1)' : '默认框 (ui-screen)';
    frameStyleBtn.innerHTML =
      '<div class="min-w-0"><div class="text-xs text-slate-200">手机框样式</div>' +
      '<div class="meta">点击切换机框图</div></div>' +
      '<span class="text-[11px] font-mono text-cyber-cyan shrink-0">' + frameStyleLabel + '</span>';
    frameStyleBtn.addEventListener('click', () => {
      const next = settings.frameStyle === 'style1' ? 'default' : 'style1';
      setSetting('frameStyle', next, '手机框 · ' + (next === 'style1' ? '新框' : '默认框'));
    });
    modeList.appendChild(frameStyleBtn);

    addToggle('showZoomBar', '缩放控件', '右下角 + / − / 重置');
    addToggle('wheelZoom', '滚轮缩放', '指针在画布上时滚轮缩放');
    addToggle('dblclickReset', '双击重置缩放', '双击画布回到 100%');

    // screen dim cycle
    const dimBtn = document.createElement('button');
    dimBtn.type = 'button';
    dimBtn.className = 'setting-row mx-2';
    dimBtn.style.width = 'calc(100% - 1rem)';
    dimBtn.innerHTML =
      '<div class="min-w-0"><div class="text-xs text-slate-200">屏幕遮罩</div>' +
      '<div class="meta">开孔半透明强度</div></div>' +
      '<span class="text-[11px] font-mono text-cyber-cyan shrink-0">' + settings.screenDim + '%</span>';
    dimBtn.addEventListener('click', () => {
      const steps = [0, 8, 12, 20, 30];
      const i = steps.indexOf(settings.screenDim);
      const next = steps[(i < 0 ? 2 : i + 1) % steps.length];
      setSetting('screenDim', next, '屏幕遮罩 · ' + next + '%');
    });
    modeList.appendChild(dimBtn);

    addSection('编辑');
    addToggle('autoLoadInspect', '检查时自动加载', '进入检查模式自动加载演示页');
    addToggle('mergePending', '合并同选择器', '写入 pending 时合并 ops');
    addToggle('copyOnApply', '应用时复制 MCP', '「应用到代码」自动复制提示词');

    addSection('预览体验');
    addToggle('interactiveMode', '可交互模式', '允许 iframe 滚动和点击');
    addToggle('fullPageScale', '整页缩放', '把长页等比压进一屏（默认关·真机滚动）');
    addToggle('dprSimulation', 'DPR 高分辨率', '按设备像素比渲染，更接近真机');
    addToggle('touchSimulation', '触控模拟', '禁用 hover 效果，模拟移动端');
    addToggle('showNotch', '灵动岛/刘海', '显示屏幕顶部的刘海或灵动岛');

    addSection('界面');
    addToggle('showMcpPill', 'MCP 标签', '左侧标题旁 MCP demo');

    const toastBtn = document.createElement('button');
    toastBtn.type = 'button';
    toastBtn.className = 'setting-row mx-2';
    toastBtn.style.width = 'calc(100% - 1rem)';
    toastBtn.innerHTML =
      '<div class="min-w-0"><div class="text-xs text-slate-200">提示时长</div>' +
      '<div class="meta">Toast 显示毫秒</div></div>' +
      '<span class="text-[11px] font-mono text-cyber-cyan shrink-0">' + settings.toastMs + '</span>';
    toastBtn.addEventListener('click', () => {
      const steps = [1200, 2000, 3200, 5000];
      const i = steps.indexOf(settings.toastMs);
      const next = steps[(i < 0 ? 1 : i + 1) % steps.length];
      setSetting('toastMs', next, '提示时长 · ' + next + 'ms');
    });
    modeList.appendChild(toastBtn);

    addSection('默认地址');
    const urlWrap = document.createElement('div');
    urlWrap.className = 'px-3 pb-2 space-y-1.5';
    const urlField = document.createElement('input');
    urlField.type = 'text';
    urlField.value = settings.defaultUrl;
    urlField.className = 'w-full bg-black/35 border border-cyber-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-200 outline-none focus:border-cyber-cyan/50';
    urlField.placeholder = 'http://127.0.0.1:5173/';
    const urlActions = document.createElement('div');
    urlActions.className = 'flex gap-1.5';
    const saveUrl = document.createElement('button');
    saveUrl.type = 'button';
    saveUrl.className = 'flex-1 px-2 py-1.5 rounded-lg text-[10px] bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40';
    saveUrl.textContent = '保存默认';
    saveUrl.addEventListener('click', () => {
      const v = urlField.value.trim() || DEFAULT_SETTINGS.defaultUrl;
      setSetting('defaultUrl', v, '已保存默认地址');
    });
    const useUrl = document.createElement('button');
    useUrl.type = 'button';
    useUrl.className = 'flex-1 px-2 py-1.5 rounded-lg text-[10px] border border-cyber-border text-slate-400 hover:text-cyber-cyan';
    useUrl.textContent = '填入顶栏';
    useUrl.addEventListener('click', () => {
      urlInput.value = settings.defaultUrl;
      notify('已填入默认地址');
    });
    urlActions.appendChild(saveUrl);
    urlActions.appendChild(useUrl);
    urlWrap.appendChild(urlField);
    urlWrap.appendChild(urlActions);
    modeList.appendChild(urlWrap);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'mx-3 mt-2 mb-1 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs border border-rose-500/30 text-rose-300/90 hover:bg-rose-500/10';
    reset.textContent = '恢复全部默认';
    reset.addEventListener('click', () => {
      settings = Object.assign({}, DEFAULT_SETTINGS);
      persistSettings(settings);
      applySettings();
      renderModeList();
      notify('已恢复默认设置');
    });
    modeList.appendChild(reset);

    const note = document.createElement('div');
    note.className = 'px-4 py-2 text-[10px] text-slate-600 leading-relaxed';
    note.textContent = IS_EXTENSION
      ? '偏好已写入本机；预览经本地代理注入点选器。'
      : '独立稿演示 · 代理剥 XFO 仅在扩展内生效';
    modeList.appendChild(note);
    return;
  }
}

function syncColorPicker(hex) {
  const picker = $id<HTMLInputElement>('colorPicker');
  const color = $id<HTMLInputElement>('color');
  if (!hex) return;
  const m = String(hex).trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (m) {
    let h = m[0];
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    picker.value = h.toLowerCase();
  }
  color.value = hex;
}

function setInspectChrome(on) {
  const panel = document.getElementById('inspectorPanel');
  const stage = document.getElementById('phoneStage');
  const badge = document.getElementById('inspectModeBadge');
  const pendingBadgeEl = document.getElementById('pendingModeBadge');
  const settingsBadgeEl = document.getElementById('settingsModeBadge');
  const pendingPanel = document.getElementById('pendingPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const title = document.getElementById('inspectorTitle');
  const desc = document.getElementById('inspectorDesc');

  panel.classList.toggle('inspect-active', on && mode === 'inspect');
  panel.classList.toggle('pending-active', mode === 'pending');
  panel.classList.toggle('settings-active', mode === 'settings');
  stage.classList.toggle('inspect-active', on && mode === 'inspect');
  badge.classList.toggle('hidden', mode !== 'inspect');
  pendingBadgeEl.classList.toggle('hidden', mode !== 'pending');
  settingsBadgeEl.classList.toggle('hidden', mode !== 'settings');
  pendingPanel.classList.toggle('hidden', mode !== 'pending');
  settingsPanel.classList.toggle('hidden', mode !== 'settings');

  if (mode === 'pending') {
    title.textContent = 'Pending 队列';
    desc.textContent = '文本由扩展本地回写；样式/属性/位移交 Agent（4px 网格对齐 + 自检）。';
  } else if (mode === 'inspect') {
    title.textContent = '属性检查';
    desc.textContent = '进入「检查」后点击手机内元素；改属性后点「写入预览」即时生效并入 pending。';
  } else if (mode === 'settings') {
    title.textContent = '设置';
    desc.textContent = '画布 / 编辑 / 界面偏好；变更即时生效并写入 localStorage。';
    const summary = document.getElementById('settingsSummary');
    if (summary) summary.textContent = settingsSummaryText();
  } else {
    title.textContent = '属性';
    desc.textContent = '在检查模式选中元素后可编辑；写入会进入 pending 队列。';
  }
  $id<HTMLButtonElement>('btnCommit').disabled = !selectedSel;
}

function postToFrame(payload) {
  try {
    if (frame.contentWindow) frame.contentWindow.postMessage(payload, '*');
  } catch (_) {}
}

function applySelection(msg, highlightInFrame, opts?) {
  const stay = opts && opts.stay;
  selectedSel = msg.sel || '';
  $id<HTMLInputElement | HTMLSelectElement>('sel').value = selectedSel;
  $id<HTMLInputElement | HTMLSelectElement>('text').value = msg.text || '';
  syncColorPicker(msg.color || '#4deeea');
  $id<HTMLInputElement | HTMLSelectElement>('fontSize').value = msg.fontSize || '';
  $id<HTMLInputElement | HTMLSelectElement>('fontWeight').value = msg.fontWeight || '';
  $id<HTMLInputElement | HTMLSelectElement>('width').value = msg.width || '';
  $id<HTMLInputElement | HTMLSelectElement>('height').value = msg.height || '';
  $id<HTMLInputElement | HTMLSelectElement>('display').value = msg.display || '';
  $id<HTMLInputElement | HTMLSelectElement>('borderRadius').value = msg.borderRadius || '';
  $id<HTMLInputElement | HTMLSelectElement>('margin').value = msg.margin || '';
  $id<HTMLInputElement | HTMLSelectElement>('padding').value = msg.padding || '';
  $id<HTMLInputElement | HTMLSelectElement>('src').value = msg.src || '';
  document.getElementById('inspectHint').textContent = selectedSel
    ? '已选中 · 可编辑后写入预览'
    : '等待选择元素…';
  $id<HTMLButtonElement>('btnCommit').disabled = !selectedSel;
  if (highlightInFrame && selectedSel) {
    const run = () => postToFrame({ type: 'inspect-highlight', sel: selectedSel });
    run();
    setTimeout(run, 80);
  }
  if (stay) {
    if (mode === 'inspect' || mode === 'pending') renderModeList();
    return;
  }
  if (mode === 'inspect') renderModeList();
  else setMode('inspect', { quiet: true });
}

function clearSelection(notifyUser) {
  selectedSel = '';
  $id<HTMLInputElement | HTMLSelectElement>('sel').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('text').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('color').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('fontSize').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('fontWeight').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('width').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('height').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('display').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('borderRadius').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('margin').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('padding').value = '';
  $id<HTMLInputElement | HTMLSelectElement>('src').value = '';
  document.getElementById('inspectHint').textContent = '等待选择元素…';
  $id<HTMLButtonElement>('btnCommit').disabled = true;
  postToFrame({ type: 'inspect-clear' });
  if (mode === 'inspect') renderModeList();
  if (notifyUser !== false) notify('已清除选中');
}

function setModeNavPinned(on, opts?) {
  modeNavPinned = !!on;
  const nav = document.getElementById('modeNav');
  if (nav) nav.classList.toggle('mode-nav-collapsed', !modeNavPinned);
  document.querySelectorAll<HTMLElement>('.rail-btn').forEach((b) => {
    const active = b.dataset.mode === mode;
    const base = b.getAttribute('data-title-base') || b.dataset.mode || '';
    b.classList.toggle('rail-active', active && modeNavPinned);
    b.classList.toggle('text-slate-500', !(active && modeNavPinned));
    b.title = active && modeNavPinned ? base + '（再点收起侧栏）' : base;
  });
  if (!(opts && opts.quiet)) {
    requestAnimationFrame(() => applyPhoneCanvasSize(device()));
  }
}

function setMode(next, opts?) {
  const quiet = opts && opts.quiet;
  const forceOpen = opts && opts.forceOpen;
  mode = next;
  if (forceOpen || !modeNavPinned) setModeNavPinned(true, { quiet: true });
  document.querySelectorAll<HTMLElement>('.rail-btn').forEach((b) => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('rail-active', active && modeNavPinned);
    b.classList.toggle('text-slate-500', !(active && modeNavPinned));
  });
  setInspectChrome(mode === 'inspect');
  if (mode === 'inspect' && !loaded && settings.autoLoadInspect) {
    loadPreview(false);
    if (!quiet) {
      notify(IS_EXTENSION
        ? '检查模式 · 正在加载预览，点击元素选取'
        : '检查模式 · 演示预览已加载，点击元素选取');
    }
  } else if (mode === 'inspect' && !loaded && !quiet) {
    notify('检查模式 · 请先加载预览');
  } else if (mode === 'inspect' && !quiet) {
    notify('检查模式 · 点击手机内元素或左侧节点');
  } else if (mode === 'pending' && !quiet) {
    notify(pending.length ? ('Pending · ' + pending.length + ' 条待回写') : 'Pending · 队列为空');
  } else if (mode === 'settings' && !quiet) {
    notify('设置 · 偏好即时生效');
  }
  if (mode === 'pending') refreshPendingUi();
  if (mode === 'settings') applySettings();
  renderModeList();
}

function loadPreview(announce) {
  refreshKey += 1;
  if (IS_EXTENSION) {
    const url = (urlInput.value || '').trim();
    if (!url) {
      notify('请输入预览 URL');
      return;
    }
    VSCODE_API.postMessage({ type: 'url_change', url });
    if (announce !== false) notify('正在加载预览…');
    return;
  }
  loaded = true;
  emptyHint.classList.add('hidden');
  frame.classList.remove('pointer-events-none');
  frame.style.pointerEvents = framePointerEvents();
  frame.removeAttribute('src');
  frame.srcdoc = buildDemoSrc();
  applyPhoneCanvasSize(device());
  // srcdoc 就绪后补发触控状态（脚本已监听 mvb-host）
  setTimeout(() => syncTouchSimulationToFrame(), 50);
  if (pipOpen) {
    layoutPipPhone();
    syncPipContent();
  }
  if (announce !== false) notify('预览已加载到手机屏幕内');
}

// device select
DEVICE_PRESETS.forEach((d) => {
  const opt = document.createElement('option');
  opt.value = d.id;
  opt.textContent = d.name + ' (' + d.width + '×' + d.height + ')';
  deviceSelect.appendChild(opt);
});
deviceSelect.addEventListener('change', () => {
  deviceId = deviceSelect.value;
  syncDeviceChrome();
  renderModeList();
  if (IS_EXTENSION) {
    VSCODE_API.postMessage({ type: 'device_change', deviceId });
  } else if (loaded) {
    loadPreview(false);
  }
  const d = device();
  notify('设备：' + d.name + ' · ' + d.width + '×' + d.height);
});

document.querySelectorAll<HTMLElement>('.rail-btn').forEach((b) => {
  if (!b.getAttribute('data-title-base')) {
    b.setAttribute('data-title-base', b.getAttribute('title') || b.dataset.mode || '');
  }
  b.addEventListener('click', () => {
    const next = b.dataset.mode;
    // 再点当前模式：收起 MVB 侧栏；其它模式：展开并切换
    if (next === mode && modeNavPinned) {
      setModeNavPinned(false);
      notify('已收起侧栏 · 再点图标可展开');
      return;
    }
    setMode(next, { forceOpen: true });
  });
  b.addEventListener('mouseenter', () => {
    if (!modeNavPinned) {
      b.classList.add('text-cyber-cyan');
    }
  });
  b.addEventListener('mouseleave', () => {
    if (!modeNavPinned && b.dataset.mode !== mode) {
      b.classList.remove('text-cyber-cyan');
    }
  });
});

(function setupInspectorResize() {
  const panel = document.getElementById('inspectorPanel');
  const handle = document.getElementById('inspectorResizeHandle');
  if (!panel || !handle) return;

  const KEY = 'mvb-inspector-width';
  const MIN = 176;
  const MAX = () => Math.min(Math.floor(window.innerWidth * 0.4), 448);

  function applyWidth(px) {
    const w = Math.max(MIN, Math.min(MAX(), Math.round(px)));
    panel.style.width = w + 'px';
    panel.style.minWidth = w + 'px';
    panel.style.maxWidth = w + 'px';
    return w;
  }

  try {
    const saved = parseInt(localStorage.getItem(KEY) || '', 10);
    if (saved && saved >= MIN) applyWidth(saved);
  } catch (_) {}

  let dragging = false;
  let startX = 0;
  let startW = 0;

  handle.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startW = panel.getBoundingClientRect().width;
    document.body.classList.add('inspector-resizing');
    try { handle.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    // 右栏在右侧：向左拖变宽，向右拖变窄
    applyWidth(startW + (startX - e.clientX));
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('inspector-resizing');
    try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    const w = panel.getBoundingClientRect().width;
    try { localStorage.setItem(KEY, String(Math.round(w))); } catch (_) {}
    requestAnimationFrame(() => applyPhoneCanvasSize(device()));
  }

  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => {
    const cur = panel.getBoundingClientRect().width;
    if (cur > MAX()) applyWidth(MAX());
  });
})();

document.getElementById('btnLoad').addEventListener('click', () => loadPreview(true));
document.getElementById('btnReload').addEventListener('click', () => {
  if (!loaded) {
    loadPreview(true);
    return;
  }
  if (IS_EXTENSION) {
    if (currentProxyUrl) frame.src = withCacheBust(currentProxyUrl);
    else if (frame.src) frame.src = frame.src;
    if (pipOpen) syncPipContent();
    notify('已刷新手机内预览');
    return;
  }
  frame.srcdoc = buildDemoSrc();
  if (pipOpen) syncPipContent();
  notify('已刷新手机内预览');
});
document.getElementById('btnRetry3d').addEventListener('click', () => {
  const baseScreen = (phoneFrame.getAttribute('src') || phoneFrame.src || '').split('?')[0];
  phoneFrame.src = baseScreen + '?t=' + Date.now();
  phoneOffline.classList.add('hidden');
});
phoneFrame.addEventListener('error', () => phoneOffline.classList.remove('hidden'));
phoneFrame.addEventListener('load', () => phoneOffline.classList.add('hidden'));

document.getElementById('btnCommit').addEventListener('click', () => {
  const sel = $id<HTMLInputElement | HTMLSelectElement>('sel').value;
  if (!sel) { notify('请先选中元素'); return; }
  const fields = {
    sel,
    text: $id<HTMLInputElement | HTMLSelectElement>('text').value,
    color: $id<HTMLInputElement | HTMLSelectElement>('color').value,
    fontSize: $id<HTMLInputElement | HTMLSelectElement>('fontSize').value,
    fontWeight: $id<HTMLInputElement | HTMLSelectElement>('fontWeight').value,
    width: $id<HTMLInputElement | HTMLSelectElement>('width').value,
    height: $id<HTMLInputElement | HTMLSelectElement>('height').value,
    display: $id<HTMLInputElement | HTMLSelectElement>('display').value,
    borderRadius: $id<HTMLInputElement | HTMLSelectElement>('borderRadius').value,
    margin: $id<HTMLInputElement | HTMLSelectElement>('margin').value,
    padding: $id<HTMLInputElement | HTMLSelectElement>('padding').value,
    src: $id<HTMLInputElement | HTMLSelectElement>('src').value,
  };
  const { edit, merged } = upsertPending(fields);
  if (IS_EXTENSION) {
    const prevText = (liveSelection && liveSelection.text) || '';
    if (fields.text !== '' && fields.text !== prevText) {
      sendHostToFrame('apply_text', { value: fields.text });
    }
    if (fields.color) sendHostToFrame('apply_style', { prop: 'color', value: fields.color });
    if (fields.fontSize) sendHostToFrame('apply_style', { prop: 'font-size', value: fields.fontSize });
    if (fields.fontWeight) sendHostToFrame('apply_style', { prop: 'font-weight', value: fields.fontWeight });
    if (fields.width) sendHostToFrame('apply_style', { prop: 'width', value: fields.width });
    if (fields.height) sendHostToFrame('apply_style', { prop: 'height', value: fields.height });
    if (fields.display) sendHostToFrame('apply_style', { prop: 'display', value: fields.display });
    if (fields.borderRadius) sendHostToFrame('apply_style', { prop: 'border-radius', value: fields.borderRadius });
    if (fields.margin) sendHostToFrame('apply_style', { prop: 'margin', value: fields.margin });
    if (fields.padding) sendHostToFrame('apply_style', { prop: 'padding', value: fields.padding });
    if (fields.src) sendHostToFrame('apply_attr', { name: 'src', value: fields.src });
  } else {
    postToFrame({ type: 'inspect-apply', ...fields, id: edit.id });
  }
  document.getElementById('inspectHint').textContent =
    (merged ? '已合并 pending · ' : '已写入预览并入 pending · ') + edit.id;
  notify(merged ? '同选择器已合并 · pending 仍为 ' + pending.length : '已写入预览 · pending +1');
});

document.getElementById('btnClearSel').addEventListener('click', () => clearSelection(true));

document.getElementById('colorPicker').addEventListener('input', (e) => {
  $id<HTMLInputElement>('color').value = (e.target as HTMLInputElement).value;
});
document.getElementById('color').addEventListener('change', (e) => {
  syncColorPicker((e.target as HTMLInputElement).value);
});

document.getElementById('btnApply').addEventListener('click', () => {
  void applyToCode();
});

pendingBadge.addEventListener('click', () => setMode('pending'));

document.getElementById('btnCopyPrompt').addEventListener('click', async () => {
  if (!pending.length) {
    notify('队列为空，无需复制');
    return;
  }
  const ok = await copyText(buildApplyPrompt());
  notify(ok ? 'MCP 提示已复制' : '复制失败');
});

document.getElementById('btnResetSettings').addEventListener('click', () => {
  settings = Object.assign({}, DEFAULT_SETTINGS);
  persistSettings(settings);
  applySettings();
  if (mode === 'settings') renderModeList();
  notify('已恢复默认设置');
});

// 横竖屏切换按钮
const btnRotate = document.getElementById('btnRotate');
if (btnRotate) {
  btnRotate.addEventListener('click', () => {
    const newLandscape = toggleLandscape();
    // 重新应用机框/iframe 几何
    applyPhoneCanvasSize(device());
    // 更新按钮状态
    btnRotate.classList.toggle('text-cyber-cyan', newLandscape);
    btnRotate.classList.toggle('border-cyber-cyan/50', newLandscape);
    // 同步到 PiP
    if (pipOpen) pipMgr.handleDeviceChange();
    // 重载预览：更新 viewport meta（横屏 width=竖屏高），否则页面仍按竖屏宽排版、右侧留白
    if (IS_EXTENSION && loaded) {
      VSCODE_API.postMessage({ type: 'orientation_change', landscape: newLandscape });
    } else if (loaded) {
      loadPreview(false);
    }
    notify(newLandscape ? '已切换为横屏 · 视口已按长边重载' : '已切换为竖屏 · 视口已重载');
  });
}

document.getElementById('btnPip').addEventListener('click', () => {
  if (pipOpen && !pipDetachMode) closePip();
  else openPip();
});

// 可交互模式按钮
const btnInteractive = document.getElementById('btnInteractive');
if (btnInteractive) {
  // 初始化按钮状态
  btnInteractive.classList.toggle('text-cyber-cyan', settings.interactiveMode);
  btnInteractive.classList.toggle('border-cyber-cyan/50', settings.interactiveMode);
  setInteractiveMode(settings.interactiveMode);

  btnInteractive.addEventListener('click', () => {
    const next = !settings.interactiveMode;
    settings.interactiveMode = next;
    persistSettings(settings);
    setInteractiveMode(next);
    applyPhoneCanvasSize(device());
    // 立刻打开 iframe 命中，避免等下一帧 layout
    if (frame) {
      frame.style.pointerEvents = next || mode === 'inspect' ? 'auto' : 'none';
      frame.classList.toggle('pointer-events-none', !(next || mode === 'inspect'));
    }
    btnInteractive.classList.toggle('text-cyber-cyan', next);
    btnInteractive.classList.toggle('border-cyber-cyan/50', next);
    notify(next ? '可交互模式 · 开（滚轮滚动页面，边缘可缩放画布）' : '可交互模式 · 关');
  });
}

// DPR 模拟按钮
const btnDpr = document.getElementById('btnDpr');
if (btnDpr) {
  // 初始化按钮状态
  btnDpr.classList.toggle('text-cyber-cyan', settings.dprSimulation);
  btnDpr.classList.toggle('border-cyber-cyan/50', settings.dprSimulation);
  setDprSimulation(settings.dprSimulation);

  btnDpr.addEventListener('click', () => {
    const next = !settings.dprSimulation;
    settings.dprSimulation = next;
    persistSettings(settings);
    setDprSimulation(next);
    applyPhoneCanvasSize(device());
    btnDpr.classList.toggle('text-cyber-cyan', next);
    btnDpr.classList.toggle('border-cyber-cyan/50', next);
    notify(next ? 'DPR 高分辨率 · 开' : 'DPR 高分辨率 · 关');
  });
}

// 触控模拟按钮
const btnTouch = document.getElementById('btnTouch');
if (btnTouch) {
  // 初始化按钮状态
  btnTouch.classList.toggle('text-cyber-cyan', settings.touchSimulation);
  btnTouch.classList.toggle('border-cyber-cyan/50', settings.touchSimulation);

  btnTouch.addEventListener('click', () => {
    const next = !settings.touchSimulation;
    settings.touchSimulation = next;
    // 开触控时自动进入可交互，否则 iframe 指针事件被关掉，模拟无意义
    if (next && !settings.interactiveMode) {
      settings.interactiveMode = true;
      setInteractiveMode(true);
      const btnInteractive = document.getElementById('btnInteractive');
      if (btnInteractive) {
        btnInteractive.classList.toggle('text-cyber-cyan', true);
        btnInteractive.classList.toggle('border-cyber-cyan/50', true);
      }
    }
    persistSettings(settings);
    btnTouch.classList.toggle('text-cyber-cyan', next);
    btnTouch.classList.toggle('border-cyber-cyan/50', next);
    syncTouchSimulationToFrame();
    notify(next ? '触控模拟 · 开（已联动可交互）' : '触控模拟 · 关');
  });
}

// 显示/隐藏灵动岛和刘海按钮
const btnNotch = document.getElementById('btnNotch');
if (btnNotch) {
  // 初始化按钮状态
  btnNotch.classList.toggle('text-cyber-cyan', settings.showNotch);
  btnNotch.classList.toggle('border-cyber-cyan/50', settings.showNotch);
  setShowNotch(settings.showNotch);

  btnNotch.addEventListener('click', () => {
    const next = !settings.showNotch;
    settings.showNotch = next;
    persistSettings(settings);
    setShowNotch(next);
    applyPhoneCanvasSize(device());
    btnNotch.classList.toggle('text-cyber-cyan', next);
    btnNotch.classList.toggle('border-cyber-cyan/50', next);
    notify(next ? '灵动岛 · 显示' : '灵动岛 · 隐藏');
  });
}

function supportsDocPip() { return pipMgr.supportsDocPip(); }

function isIdeEmbeddedBrowser() { return pipMgr.isIdeEmbeddedBrowser(); }
function canDetachExternally() { return pipMgr.canDetachExternally(); }
function hostPipWindow() { return pipMgr.hostPipWindow(); }
function pipRoots() { return pipMgr.pipRoots(); }
function pipEl(id) { return pipMgr.pipEl(id); }

function updatePipToolsUi() { pipMgr.updatePipToolsUi(); }
function pipPhoneGeometry() { return pipMgr.pipPhoneGeometry(); }
function pipBodyBox(win) { return pipMgr.pipBodyBox(win); }
function mainStageDisplayScale() { return pipMgr.mainStageDisplayScale(); }
function pipFitScaleForWin(win, g) { return pipMgr.pipFitScaleForWin(win, g); }
function pipResolveDisplayScale(win, g, refit) { return pipMgr.pipResolveDisplayScale(win, g, refit); }
function measurePipShellSize() { return pipMgr.measurePipShellSize(); }

function layoutPipPhoneIn(win, opts?) { pipMgr.layoutPipPhoneIn(win, opts); }
function layoutPipPhone(opts?) { pipMgr.layoutPipPhone(opts); }
function syncPipContent() { pipMgr.syncPipContent(); }

function expandPipWindowForTools(opening) { pipMgr.expandPipWindowForTools(opening); }
function bindPipDocClicks(doc) { pipMgr.bindPipDocClicks(doc); }
function handlePipButtonClick(e) { pipMgr.handlePipButtonClick(e); }
function parkHostPip(on) { pipMgr.parkHostPip(on); }

function estimateViewportScreenOrigin() { return pipMgr.estimateViewportScreenOrigin(); }
function captureHostPipScreenBox() { return pipMgr.captureHostPipScreenBox(); }

function placePipWindowVisible(win, opts) { pipMgr.placePipWindowVisible(win, opts); }
function openPip() { pipMgr.openPip(); }
function closePip() { pipMgr.closePip(); }
function detachPipPin() { return pipMgr.detachPipPin(); }
function attachPipUnpin() { return pipMgr.attachPipUnpin(); }
function observePipWindowResize(win) { pipMgr.observePipWindowResize(win); }
function setPipToolsOpen(on) { pipMgr.setPipToolsOpen(on); }

pipMgr.setupPipDrag();
pipMgr.setupPipResize();

bindPipDocClicks(document);

deviceSelect.addEventListener('change', () => { pipMgr.handleDeviceChange(); });
window.addEventListener('resize', () => { pipMgr.handleWindowResize(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pipOpen) closePip();
});

window.addEventListener('message', (e) => {
  const msg = e.data;
  if (!msg) return;

  if (msg.source === 'mvb-picker') {
    if (msg.type === 'selection_change' && msg.payload) {
      liveSelection = msg.payload;
      applySelection({
        sel: msg.payload.selector || '',
        text: msg.payload.text || '',
        color: (msg.payload.styles && msg.payload.styles.color) || '',
        fontSize: (msg.payload.styles && msg.payload.styles.fontSize) || '',
        fontWeight: (msg.payload.styles && msg.payload.styles.fontWeight) || '',
        width: (msg.payload.styles && msg.payload.styles.width) || '',
        height: (msg.payload.styles && msg.payload.styles.height) || '',
        display: (msg.payload.styles && msg.payload.styles.display) || '',
        borderRadius: (msg.payload.styles && msg.payload.styles.borderRadius) || '',
        margin: (msg.payload.styles && msg.payload.styles.margin) || '',
        padding: (msg.payload.styles && msg.payload.styles.padding) || '',
        src: msg.payload.src || '',
      }, false);
      if (IS_EXTENSION) {
        VSCODE_API.postMessage({ type: 'selection_change', payload: msg.payload });
      }
      notify('已选中 ' + (msg.payload.selector || ''));
      return;
    }
    if (msg.type === 'text_change' || msg.type === 'prop_change' || msg.type === 'image_replace') {
      if (IS_EXTENSION) {
        VSCODE_API.postMessage({ type: msg.type, payload: msg.payload });
      }
      return;
    }
    if (msg.type === 'dom_snippet') {
      if (IS_EXTENSION) {
        VSCODE_API.postMessage({ type: 'dom_snippet', payload: msg.payload });
      }
      return;
    }
    if (msg.type === 'picker_ready') {
      const mcp = document.getElementById('mcpPill');
      if (mcp) {
        mcp.textContent = 'Picker ON';
        mcp.classList.add('border-emerald-400/50');
      }
      // 代理重载后重放触控模拟状态（避免仅靠延时备份）
      syncTouchSimulationToFrame();
    }
    // === 页面高度：默认真机滚动忽略缩放；开启 fullPageScale 时防抖缩放 ===
    if (msg.type === 'page_height' && msg.payload) {
      const h = Number(msg.payload.height) || 0;
      if (pageHeightTimer) clearTimeout(pageHeightTimer);
      pageHeightTimer = setTimeout(() => applyFullPageScale(h), 100);
    }
    return;
  }

  if (msg.type === 'demo-select') {
    applySelection(msg, false);
    notify('已选中 ' + msg.sel);
    return;
  }
  if (msg.type === 'inspect-applied') {
    document.getElementById('inspectHint').textContent = '预览已更新 · ' + (msg.sel || '');
    return;
  }

  if (!IS_EXTENSION) return;
  if (msg.type === 'pip_detach_done') {
    pipDetachMode = 'host';
    parkHostPip(true);
    updatePipToolsUi();
    notify('已置顶到独立窗口 · 可拖离主编辑区（不打开系统浏览器）');
    return;
  }
  if (msg.type === 'pip_attach_done') {
    pipDetachMode = null;
    pipExternalWin = null;
    parkHostPip(false);
    const host = hostPipWindow();
    if (pipOpen && host) {
      host.classList.remove('pip-host-parked');
      layoutPipPhoneIn(host);
    }
    updatePipToolsUi();
    notify('已收回独立悬浮窗');
    return;
  }
  if (msg.type === 'configure') {
    applyConfigure(msg);
    return;
  }
  if (msg.type === 'set_device') {
    deviceId = String(msg.deviceId || deviceId);
    syncDeviceChrome();
    return;
  }
  if (msg.type === 'reload') {
    if (currentProxyUrl) frame.src = withCacheBust(currentProxyUrl);
    else if (frame.src) frame.src = frame.src;
    if (pipOpen) syncPipContent();
    return;
  }
  if (msg.type === 'apply_progress') {
    notify(String(msg.message || msg.phase || '应用中…'));
    return;
  }
  if (msg.type === 'pending_sync') {
    const hostEdits = Array.isArray(msg.edits) ? msg.edits : [];
    // Extension queue is source of truth after apply (UI ids ≠ bridge ids)
    pending = hostEdits.map((he) => {
      const ops = Array.isArray(he.ops) ? he.ops : [];
      const textOp = [...ops].reverse().find((o) => o && o.type === 'text');
      const colorOp = [...ops].reverse().find((o) => o && o.type === 'style' && o.prop === 'color');
      const fontOp = [...ops].reverse().find((o) => o && o.type === 'style' && (o.prop === 'font-size' || o.prop === 'fontSize'));
      const marginOp = [...ops].reverse().find((o) => o && o.type === 'style' && o.prop === 'margin');
      const paddingOp = [...ops].reverse().find((o) => o && o.type === 'style' && o.prop === 'padding');
      const srcOp = [...ops].reverse().find((o) => o && o.type === 'attr' && o.name === 'src');
      return {
        id: he.id,
        nodeId: he.nodeId || he.selector,
        sel: he.selector || '',
        text: textOp ? textOp.value : '',
        color: colorOp ? colorOp.value : '',
        fontSize: fontOp ? fontOp.value : '',
        margin: marginOp ? marginOp.value : '',
        padding: paddingOp ? paddingOp.value : '',
        src: srcOp ? srcOp.value : '',
        ops,
        createdAt: he.createdAt || new Date().toISOString(),
        sourceHint: he.sourceHint || { component: 'demo' },
      };
    });
    if (selectedPendingId && !pending.some((p) => p.id === selectedPendingId)) {
      selectedPendingId = '';
    }
    refreshPendingUi();
    return;
  }
  if (msg.type === 'highlight') {
    sendHostToFrame('highlight', { selector: msg.selector });
    return;
  }
  if (msg.type === 'dom_snippet') {
    sendHostToFrame('dom_snippet', { selector: msg.selector });
  }
});

syncDeviceChrome();
applySettings();
setMode('preview');
updatePendingBadge();
$id<HTMLButtonElement>('btnCommit').disabled = true;
loaded = false;
window.addEventListener('resize', () => applyPhoneCanvasSize(device()));
requestAnimationFrame(() => {
  applyPhoneCanvasSize(device());
  document.body.classList.remove('js-pre-init');
});
// 二次兜底：等主机 webview 注入 configure、首屏 layout 真正稳定之后，
// 再按当前设备强制重算一次屏幕开孔和缩放，确保预览完全贴合手机内屏。
setTimeout(() => applyPhoneCanvasSize(device()), 80);
setTimeout(() => applyPhoneCanvasSize(device()), 400);

if (IS_EXTENSION) {
  const mcp = document.getElementById('mcpPill');
  if (mcp) mcp.textContent = 'MCP …';
  VSCODE_API.postMessage({ type: 'ready' });
}

// 滚轮 / 按钮缩放手机画布（相对「舞台适配」倍率；iframe 视口始终是机型 CSS 像素）
(function setupPhoneZoom() {
  const stage = document.getElementById('phoneStage');
  const hint = document.getElementById('phoneScaleHint');
  const MIN = 0.4;
  const MAX = 2.4;

  function setScale(next: number) {
    setUserPhoneZoom(Math.round(Math.min(MAX, Math.max(MIN, next)) * 100) / 100);
    applyPhoneCanvasSize(device());
  }

  function zoomByDelta(deltaY) {
    if (!deltaY) return;
    const step = Math.abs(deltaY) > 50 ? 0.12 : 0.1;
    setScale(userPhoneZoom + (deltaY > 0 ? -step : step));
  }

  function isOverStage(clientX, clientY) {
    const r = stage.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  document.addEventListener('wheel', (e) => {
    const screenEl = document.getElementById('screen');
    let overScreen = false;
    if (screenEl) {
      const sr = screenEl.getBoundingClientRect();
      overScreen = e.clientX >= sr.left && e.clientX <= sr.right
        && e.clientY >= sr.top && e.clientY <= sr.bottom;
    }

    // 可交互 / 检查模式：指针在屏幕开孔上时，把滚轮交给 iframe 内页面滚动。
    // VS Code webview 里仅靠不 preventDefault 往往无法让嵌套 iframe 原生滚动。
    if (overScreen && (settings.interactiveMode || mode === 'inspect')) {
      try {
        const win = frame && frame.contentWindow;
        if (win) {
          const doc = win.document;
          const se = doc.scrollingElement || doc.documentElement || doc.body;
          if (se) {
            const beforeTop = se.scrollTop;
            const beforeLeft = se.scrollLeft;
            se.scrollTop += e.deltaY;
            se.scrollLeft += e.deltaX;
            // 若文档本身不可滚，再试 window.scrollBy
            if (se.scrollTop === beforeTop && se.scrollLeft === beforeLeft) {
              win.scrollBy(e.deltaX, e.deltaY);
            }
          } else {
            win.scrollBy(e.deltaX, e.deltaY);
          }
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      } catch (_) {
        /* cross-origin：无法注入滚动，交给浏览器默认行为 */
      }
      return;
    }

    if (!settings.wheelZoom) return;
    if (!isOverStage(e.clientX, e.clientY)) return;
    // 非交互时屏幕区域不吞滚轮做缩放，避免误触
    if (overScreen) return;

    e.preventDefault();
    e.stopPropagation();
    zoomByDelta(e.deltaY || e.deltaX);
  }, { passive: false, capture: true });

  document.getElementById('btnZoomIn').addEventListener('click', () => setScale(userPhoneZoom + 0.1));
  document.getElementById('btnZoomOut').addEventListener('click', () => setScale(userPhoneZoom - 0.1));
  document.getElementById('btnZoomReset').addEventListener('click', () => {
    setScale(1);
    notify('已重置为舞台适配');
  });

  stage.addEventListener('dblclick', (e) => {
    if (!settings.dblclickReset) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setScale(1);
    notify('已重置为舞台适配');
  });

  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (msg && msg.type === 'phone-zoom') {
      // 可交互时 iframe 内滚轮应滚动页面，不再转成画布缩放
      if (!settings.wheelZoom || settings.interactiveMode || mode === 'inspect') return;
      zoomByDelta(msg.deltaY || 0);
    }
  });

  if (hint) hint.textContent = '—';
})();

}