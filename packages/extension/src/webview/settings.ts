export type UiSettings = {
  showFrame: boolean;
  frameGlow: boolean;
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
};

const SETTINGS_KEY = 'mvb-ui2-settings';

export const DEFAULT_SETTINGS: UiSettings = {
  showFrame: true,
  frameGlow: false,
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
