/**
 * Build modular src/webview from media extract (refresh helper).
 * After scaffold, edit src/webview/** — media/webview is build output.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'webview');
const scriptPath = path.join(root, '_extracted_script.js');
const bodyPath = path.join(root, '_extracted_body.html');

if (!fs.existsSync(scriptPath) || !fs.existsSync(bodyPath)) {
  console.error('Run extract-webview.js first');
  process.exit(1);
}

const rawScript = fs.readFileSync(scriptPath, 'utf8');
const body = fs.readFileSync(bodyPath, 'utf8');

function write(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

write(
  'bridge.ts',
  `/** VS Code webview bridge (null when opened as plain browser demo). */

export type VsCodeApi = {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

declare function acquireVsCodeApi(): VsCodeApi;

export const VSCODE_API: VsCodeApi | null =
  typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

export const IS_EXTENSION = !!VSCODE_API;

export function postToExtension(message: Record<string, unknown>): void {
  VSCODE_API?.postMessage(message);
}
`,
);

write(
  'devices.ts',
  `/** Keep aligned with @mvb/shared DEVICE_PRESETS (slim series list). */

export type DevicePreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  hasTouch: boolean;
};

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'iphone-17', name: 'iPhone 17', width: 402, height: 874, deviceScaleFactor: 3, hasTouch: true },
  { id: 'iphone-16', name: 'iPhone 16', width: 393, height: 852, deviceScaleFactor: 3, hasTouch: true },
  { id: 'iphone-15', name: 'iPhone 15', width: 393, height: 852, deviceScaleFactor: 3, hasTouch: true },
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, deviceScaleFactor: 3, hasTouch: true },
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2, hasTouch: true },
  { id: 'pixel-9', name: 'Pixel 9', width: 412, height: 915, deviceScaleFactor: 2.625, hasTouch: true },
  { id: 'galaxy-s25', name: 'Galaxy S25', width: 360, height: 780, deviceScaleFactor: 3, hasTouch: true },
  { id: 'galaxy-s24', name: 'Galaxy S24', width: 360, height: 780, deviceScaleFactor: 3, hasTouch: true },
  { id: 'ipad-mini', name: 'iPad Mini', width: 768, height: 1024, deviceScaleFactor: 2, hasTouch: true },
  { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, deviceScaleFactor: 2, hasTouch: true },
];
`,
);

write(
  'settings.ts',
  `export type UiSettings = {
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
`,
);

write(
  'constants.ts',
  `export const MODE_META: Record<string, { title: string; hint: string }> = {
  preview: { title: '预览', hint: '中间为手机视窗；用顶部加载/刷新控制预览内容。' },
  devices: { title: '设备', hint: '选择 DEVICE_PRESETS，画布按视口宽高自动切换。' },
  inspect: { title: '检查', hint: '点击手机内元素或左侧节点列表选中；右侧改属性后「写入预览」。' },
  pending: { title: 'Pending', hint: '待回写队列 · 可单项删除、合并同选择器、应用到代码（演示清空并复制 MCP 提示）。' },
  settings: { title: '设置', hint: '预览与编辑偏好，即时生效并写入 localStorage。' },
};

export type Pickable = {
  id: string;
  sel: string;
  label: string;
  desc: string;
  text: string;
  color: string;
  fontSize: string;
  margin: string;
  padding: string;
  src: string;
};

export const PICKABLES: Pickable[] = [
  { id: 't1', sel: 'h1.hero', label: '标题', desc: 'Mobile Viewport', text: 'Mobile Viewport', color: '#e2e8f0', fontSize: '20px', margin: '0 0 6px', padding: '0', src: '' },
  { id: 'c1', sel: 'div.card#overview', label: '卡片', desc: '今日概览', text: '今日概览 — 点我选中', color: '#4deeea', fontSize: '14px', margin: '0 0 12px', padding: '14px', src: '' },
  { id: 'c2', sel: 'div.card#cta', label: '按钮', desc: '开始体验', text: '开始体验', color: '#0a1a1f', fontSize: '15px', margin: '0', padding: '0', src: '' },
];
`,
);

// Slice from first runtime state var; drop inlined copies of modules.
const modeAt = rawScript.indexOf("let mode = 'preview'");
if (modeAt < 0) {
  console.error('could not find let mode');
  process.exit(1);
}

let bootBody = rawScript.slice(modeAt);

// Ensure extension-only state vars exist (they were above DEVICE_PRESETS in extract)
if (!bootBody.includes('currentProxyUrl')) {
  bootBody = `let currentProxyUrl = '';\nlet liveSelection = null;\n\n` + bootBody;
} else {
  // If somehow still present above mode — shouldn't be after slice
}

bootBody = bootBody.replace(/\bsaveSettings\(\)/g, 'persistSettings(settings)');

// Dedent common 4-space indent from original script block
bootBody = bootBody
  .split('\n')
  .map((line) => (line.startsWith('    ') ? line.slice(4) : line))
  .join('\n');

write(
  'app/runtime.ts',
  `// @ts-nocheck
/**
 * Panel UI runtime — ported from ui-preview/ui2 design.
 * Peel pip / inspect / pending into sibling modules when needed.
 */
import { VSCODE_API, IS_EXTENSION } from '../bridge';
import { DEVICE_PRESETS } from '../devices';
import { DEFAULT_SETTINGS, loadSettings, persistSettings } from '../settings';
import { MODE_META, PICKABLES } from '../constants';

export function boot(): void {
  let currentProxyUrl = '';
  let liveSelection = null;

${bootBody}
}
`,
);

write(
  'main.ts',
  `import { boot } from './app/runtime';

boot();
`,
);

const indexHtml = `<!DOCTYPE html>
<html class="h-full" lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <title>Mobile Viewport Bridge</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            cyber: {
              bg: '#0a1a1f',
              panel: 'rgba(20, 40, 45, 0.7)',
              cyan: '#4deeea',
              cyanGlow: 'rgba(77, 238, 234, 0.4)',
              border: 'rgba(77, 238, 234, 0.3)',
            }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="__WV_CSS__" />
</head>
<body class="h-full flex overflow-hidden">
${body}
  <script src="__WV_APP__"></script>
</body>
</html>
`;

write('index.html', indexHtml.replace(/\.\/ui-screen\.png/g, '__WV_SCREEN__'));

write(
  'README.md',
  `# Webview UI source

Design reference only: \`ui-preview/ui2\`.

| Path | Role |
|------|------|
| \`index.html\` | Shell markup |
| \`styles/main.css\` | Panel styles |
| \`assets/ui-screen.png\` | Phone chrome |
| \`bridge.ts\` | VS Code messaging |
| \`devices.ts\` | Device presets |
| \`settings.ts\` | Preferences |
| \`constants.ts\` | Mode meta / demo pickables |
| \`app/runtime.ts\` | UI orchestration |
| \`main.ts\` | Entry |

\`npm run build\` emits \`media/webview/\` — do not treat media as source.
`,
);

for (const f of ['_extracted_script.js', '_extracted_body.html', '_body_attrs.txt']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// Ensure asset present
const assetSrc = path.join(__dirname, '..', 'media', 'webview', 'ui-screen.png');
const assetDst = path.join(root, 'assets', 'ui-screen.png');
fs.mkdirSync(path.dirname(assetDst), { recursive: true });
if (fs.existsSync(assetSrc)) fs.copyFileSync(assetSrc, assetDst);

console.log('scaffolded ok; runtime lines', runtimeLineCount());

function runtimeLineCount() {
  return fs.readFileSync(path.join(root, 'app', 'runtime.ts'), 'utf8').split('\n').length;
}
