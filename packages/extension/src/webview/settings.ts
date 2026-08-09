export type UiSettings = {
  showFrame: boolean;
  frameGlow: boolean;
  frameStyle: string; // 'default' | 'style1'
  screenDim: number;
  wheelZoom: boolean;
  dblclickReset: boolean;
  showZoomBar: boolean;
  autoLoadInspect: boolean;
  mergePending: boolean;
  copyOnApply: boolean;
  showMcpPill: boolean;
  defaultUrl: string;
  toastMs: number;
  // 可交互模式：允许 iframe 滚动和点击
  interactiveMode: boolean;
  // 整页缩放：把长页等比压进一屏（默认关，与真机滚动互斥）
  fullPageScale: boolean;
  // DPR 模拟：按设备像素比高分辨率渲染
  dprSimulation: boolean;
  // 触控模拟：禁用 hover 效果，模拟移动端触控体验
  touchSimulation: boolean;
  // 显示刘海/灵动岛
  showNotch: boolean;
};

const SETTINGS_KEY = 'mvb-ui2-settings';

export const DEFAULT_SETTINGS: UiSettings = {
  showFrame: true,
  frameGlow: false,
  frameStyle: 'default',
  screenDim: 12,
  wheelZoom: true,
  dblclickReset: true,
  showZoomBar: true,
  autoLoadInspect: true,
  mergePending: true,
  copyOnApply: true,
  showMcpPill: true,
  defaultUrl: 'http://127.0.0.1:5173/',
  toastMs: 2000,
  interactiveMode: false,
  fullPageScale: false,
  dprSimulation: false,
  touchSimulation: false,
  showNotch: true,
};

export function loadSettings(): UiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function persistSettings(settings: UiSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
