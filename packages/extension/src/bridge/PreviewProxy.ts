import * as http from 'http';
import { URL } from 'url';
import { DEFAULT_PROXY_PORT } from '@mvb/shared';

const PICKER_SCRIPT = `
(() => {
  if (window.__mvbPicker) return;
  window.__mvbPicker = true;
  // MVB 预览兜底：强制 html/body 铺满整个设备视口宽度，
  // 避免页面缺少 width:100% 时 body 只占内容宽度，造成屏幕右侧大片空白。
  (function () {
    var s = document.createElement('style');
    s.setAttribute('data-mvb', 'viewport-reset');
    s.textContent = 'html,body{width:100%!important;min-width:100%!important;max-width:none!important;margin:0!important;padding:0!important;box-sizing:border-box!important;}*,*::before,*::after{box-sizing:inherit;}';
    if (document.documentElement) document.documentElement.appendChild(s);
    else document.addEventListener('DOMContentLoaded', function () { document.documentElement.appendChild(s); }, { once: true });
  })();
  // MVB 滚动修复：仅当 html/body 被锁死滚动时放宽 overflow-y，
  // 不强制 height:auto，避免破坏 height:100% + 内部滚动容器的 SPA。
  (function () {
    function needsUnlock(el) {
      if (!el) return false;
      var cs = getComputedStyle(el);
      return cs.overflow === 'hidden' || cs.overflowY === 'hidden';
    }
    function applyOverflowFix() {
      var de = document.documentElement;
      var b = document.body;
      if (!de) return;
      de.style.setProperty('overscroll-behavior', 'contain', 'important');
      if (needsUnlock(de)) {
        de.style.setProperty('overflow-y', 'auto', 'important');
        de.style.setProperty('overflow-x', 'hidden', 'important');
      }
      if (b) {
        b.style.setProperty('overscroll-behavior', 'contain', 'important');
        b.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        if (needsUnlock(b)) {
          b.style.setProperty('overflow-y', 'auto', 'important');
          b.style.setProperty('overflow-x', 'hidden', 'important');
        }
      }
    }
    if (document.documentElement) applyOverflowFix();
    else document.addEventListener('DOMContentLoaded', applyOverflowFix, { once: true });
    window.addEventListener('load', function () {
      setTimeout(applyOverflowFix, 100);
      setTimeout(applyOverflowFix, 500);
      setTimeout(applyOverflowFix, 1500);
    }, { once: true });
  })();
  let selected = null;
  let hover = null;
  let nodeSeq = 0;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #3b82f6;background:rgba(59,130,246,.12);display:none;';
  document.documentElement.appendChild(overlay);

  function cssPath(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && parts.length < 5) {
      let part = cur.tagName.toLowerCase();
      if (cur.classList && cur.classList.length) {
        part += '.' + [...cur.classList].slice(0, 2).map(c => CSS.escape(c)).join('.');
      }
      const parent = cur.parentElement;
      if (parent) {
        const same = [...parent.children].filter(c => c.tagName === cur.tagName);
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(cur) + 1) + ')';
      }
      parts.unshift(part);
      cur = parent;
      if (cur && cur.tagName === 'BODY') break;
    }
    return parts.join(' > ');
  }

  function ensureId(el) {
    if (!el.dataset.mvbId) el.dataset.mvbId = 'n' + (++nodeSeq);
    return el.dataset.mvbId;
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }

  function post(type, payload) {
    parent.postMessage({ source: 'mvb-picker', type, payload }, '*');
  }

  function paint(el, box) {
    if (!el) { box.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.x + 'px';
    box.style.top = r.y + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
  }

  document.addEventListener('mousemove', (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el || el === overlay) return;
    hover = el;
    if (selected !== el) paint(el, overlay);
  }, true);

  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el || el === overlay) return;
    e.preventDefault();
    e.stopPropagation();
    selected = el;
    const nodeId = ensureId(el);
    const cs = getComputedStyle(el);
    post('selection_change', {
      nodeId,
      selector: cssPath(el),
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || '').slice(0, 200),
      rect: rectOf(el),
      styles: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        width: cs.width,
        height: cs.height,
        display: cs.display,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        margin: cs.margin,
      },
      src: el.tagName === 'IMG' ? el.getAttribute('src') : undefined,
    });
    paint(el, overlay);
    overlay.style.borderColor = '#22c55e';
  }, true);

  // 触控模拟：伪装触控能力 + 抑制桌面 hover 样式
  let touchSimStyle = null;
  let touchNavPatched = false;
  let touchNavBackup = null;
  function patchTouchNavigator(enabled) {
    try {
      if (enabled) {
        if (touchNavPatched) return;
        touchNavBackup = {
          maxTouchPoints: navigator.maxTouchPoints,
          ontouchstart: 'ontouchstart' in window,
        };
        try {
          Object.defineProperty(navigator, 'maxTouchPoints', {
            configurable: true,
            get: function () { return 5; },
          });
        } catch (_) {}
        if (!('ontouchstart' in window)) {
          try { window.ontouchstart = null; } catch (_) {}
        }
        touchNavPatched = true;
      } else if (touchNavPatched) {
        try {
          if (touchNavBackup) {
            Object.defineProperty(navigator, 'maxTouchPoints', {
              configurable: true,
              get: function () { return touchNavBackup.maxTouchPoints; },
            });
          }
        } catch (_) {}
        touchNavPatched = false;
        touchNavBackup = null;
      }
    } catch (_) {}
  }
  function setTouchSimulation(enabled) {
    var root = document.documentElement;
    patchTouchNavigator(!!enabled);
    if (enabled) {
      if (root) root.classList.add('mvb-touch-sim');
      if (touchSimStyle) return;
      touchSimStyle = document.createElement('style');
      touchSimStyle.setAttribute('data-mvb', 'touch-simulation');
      // 1) tap 高亮 / 双击缩放  2) 抑制常见 hover 视觉（不强制 color:initial，避免闪错色）
      touchSimStyle.textContent = [
        'html.mvb-touch-sim, html.mvb-touch-sim * {',
        '  -webkit-tap-highlight-color: transparent !important;',
        '  touch-action: manipulation !important;',
        '}',
        'html.mvb-touch-sim *:hover {',
        '  cursor: pointer !important;',
        '  transition: none !important;',
        '  transform: none !important;',
        '  filter: none !important;',
        '  box-shadow: none !important;',
        '  outline: none !important;',
        '  text-decoration: inherit !important;',
        '}',
      ].join('');
      if (root) root.appendChild(touchSimStyle);
      else document.addEventListener('DOMContentLoaded', function () {
        if (touchSimStyle && document.documentElement) {
          document.documentElement.classList.add('mvb-touch-sim');
          document.documentElement.appendChild(touchSimStyle);
        }
      }, { once: true });
    } else {
      if (root) root.classList.remove('mvb-touch-sim');
      if (touchSimStyle && touchSimStyle.parentNode) {
        touchSimStyle.parentNode.removeChild(touchSimStyle);
      }
      touchSimStyle = null;
    }
  }

  window.addEventListener('message', (ev) => {
    const data = ev.data;
    if (!data || data.source !== 'mvb-host') return;
    if (data.type === 'apply_style' && selected) {
      const { prop, value } = data.payload || {};
      if (prop) selected.style.setProperty(prop, value);
      post('prop_change', { nodeId: ensureId(selected), selector: cssPath(selected), prop, old: '', new: value });
    }
    if (data.type === 'apply_text' && selected) {
      const { value } = data.payload || {};
      const old = selected.innerText;
      selected.innerText = value;
      post('text_change', { nodeId: ensureId(selected), selector: cssPath(selected), oldText: old, newText: value });
    }
    if (data.type === 'apply_attr' && selected) {
      const { name, value } = data.payload || {};
      const old = selected.getAttribute(name);
      selected.setAttribute(name, value);
      post('image_replace', { nodeId: ensureId(selected), selector: cssPath(selected), oldSrc: old, newSrc: value });
    }
    if (data.type === 'highlight') {
      const sel = data.payload && data.payload.selector;
      const el = sel ? document.querySelector(sel) : null;
      if (el) { selected = el; paint(el, overlay); overlay.style.borderColor = '#f59e0b'; }
    }
    if (data.type === 'dom_snippet') {
      const sel = (data.payload && data.payload.selector) || (selected && cssPath(selected));
      const el = sel ? document.querySelector(sel) : selected;
      post('dom_snippet', {
        selector: sel,
        html: el ? el.outerHTML.slice(0, 2000) : '',
        text: el ? (el.innerText || '').slice(0, 500) : '',
      });
    }
    if (data.type === 'touchSimulation') {
      const { enabled } = data.payload || {};
      setTouchSimulation(!!enabled);
    }
  });

  post('picker_ready', { href: location.href });

  // === 整页高度上报：供父窗口「整页缩放」模式使用（默认关闭时父页会忽略缩放） ===
  let heightTimer = 0;
  function reportPageHeight() {
    const body = document.body;
    const docEl = document.documentElement;
    const h = Math.max(
      body ? body.scrollHeight : 0,
      docEl ? docEl.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      docEl ? docEl.offsetHeight : 0,
    );
    post('page_height', {
      height: h,
      viewportWidth: docEl ? docEl.clientWidth : (body ? body.clientWidth : 0),
    });
  }
  function scheduleReport() {
    if (heightTimer) clearTimeout(heightTimer);
    heightTimer = setTimeout(reportPageHeight, 120);
  }
  if (document.readyState === 'complete') scheduleReport();
  else window.addEventListener('load', scheduleReport);
  setTimeout(scheduleReport, 300);
  setTimeout(scheduleReport, 1000);
  setTimeout(scheduleReport, 2500);
  if (typeof MutationObserver !== 'undefined') {
    const mo = new MutationObserver(() => scheduleReport());
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  }
})();
`;

export class PreviewProxy {
  private server: http.Server | null = null;
  /** True when port was already bound (reuse existing listener; do not close on dispose). */
  private reusedExternal = false;
  private _port: number;

  constructor(port = DEFAULT_PROXY_PORT) {
    this._port = port;
  }

  get port(): number {
    return this._port;
  }

  async start(): Promise<void> {
    if (this.server || this.reusedExternal) return;

    const base = this._port;
    let lastErr: NodeJS.ErrnoException | undefined;

    for (let p = base; p < base + 10; p++) {
      try {
        await this.listenOn(p);
        this._port = p;
        return;
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        lastErr = err;
        if (err.code !== 'EADDRINUSE') throw err;
      }
    }

    // All candidate ports busy — reuse base if an MVB proxy is already healthy.
    try {
      await this.probeExisting(base);
      this._port = base;
      this.reusedExternal = true;
      return;
    } catch {
      throw lastErr || new Error(`No free preview proxy port near ${base}`);
    }
  }

  private listenOn(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        void this.handle(req, res);
      });
      const onError = (err: NodeJS.ErrnoException) => {
        server.close();
        reject(err);
      };
      server.once('error', onError);
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', onError);
        this.server = server;
        resolve();
      });
    });
  }

  private async probeExisting(port: number): Promise<void> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1200);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/picker.js`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`proxy probe HTTP ${res.status}`);
    } finally {
      clearTimeout(timer);
    }
  }

  proxyUrl(target: string, userAgent?: string, viewportWidth?: number): string {
    let url = `http://127.0.0.1:${this._port}/proxy?url=${encodeURIComponent(target)}`;
    if (userAgent) url += '&ua=' + encodeURIComponent(userAgent);
    if (viewportWidth && viewportWidth > 0) url += '&vw=' + encodeURIComponent(String(Math.round(viewportWidth)));
    return url;
  }

  dispose(): void {
    if (this.reusedExternal) {
      this.reusedExternal = false;
      this.server = null;
      return;
    }
    this.server?.close();
    this.server = null;
  }

  private async handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const u = new URL(req.url || '/', `http://127.0.0.1:${this._port}`);
      if (u.pathname === '/picker.js') {
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
          'Etag': '"' + PICKER_SCRIPT.length + '-' + PICKER_SCRIPT.slice(0, 100).length + '"',
        });
        res.end(PICKER_SCRIPT);
        return;
      }
      if (u.pathname !== '/proxy') {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const target = u.searchParams.get('url');
      if (!target) {
        res.writeHead(400);
        res.end('missing url');
        return;
      }
      const isHttpsTarget = /^https:/i.test(target);
      const ua = u.searchParams.get('ua') || req.headers['user-agent'] || 'MVB-Proxy';
      const upstream = await fetch(target, {
        headers: { 'User-Agent': ua },
        redirect: 'follow',
      });
      const contentType = upstream.headers.get('content-type') || 'text/html';
      let body = Buffer.from(await upstream.arrayBuffer());
      if (contentType.includes('text/html')) {
        let html = body.toString('utf8');
        const inject = isHttpsTarget
          ? `<script>${PICKER_SCRIPT}</script>`
          : `<script src="http://127.0.0.1:${this._port}/picker.js"></script>`;
        if (isHttpsTarget) {
          const notice = `<!-- MVB proxy: target is HTTPS → picker script inlined to avoid mixed-content blocking -->`;
          html = notice + html;
        }
        if (!/<base\s/i.test(html)) {
          const base = target.endsWith('/') ? target : target.replace(/\/[^/]*$/, '/');
          html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
        }
        // 隐藏滚动条轨道；不强制 height/overflow，由 picker 按需解锁
        const scrollbarCSS = `<style data-mvb="scrollbar">
html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0;display:none;-webkit-appearance:none}
html,body{scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior:contain}
</style>`;
        // 锁定为设备 CSS 宽（来自 ?vw=），避免 device-width 跟随错误 iframe 尺寸
        const vwRaw = u.searchParams.get('vw');
        const viewportWidth =
          vwRaw && /^\d+$/.test(vwRaw) ? vwRaw : 'device-width';
        const viewportMeta = `<meta name="viewport" content="width=${viewportWidth}, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">`;
        html = html.replace(/<meta\s+name=["']viewport["'][^>]*>/gi, '');
        if (html.includes('</head>')) html = html.replace('</head>', `${viewportMeta}</head>`);
        else html += viewportMeta;
        if (html.includes('</body>')) html = html.replace('</body>', `${scrollbarCSS}${inject}</body>`);
        else { html += scrollbarCSS + inject; }
        body = Buffer.from(html, 'utf8');
      }
      // HTTPS 目标：picker 已内联，不再注入收紧的 CSP，以免阻断页面自身 CDN 脚本
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Proxy error: ${(e as Error).message}`);
    }
  }
}