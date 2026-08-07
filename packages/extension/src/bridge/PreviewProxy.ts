import * as http from 'http';
import { URL } from 'url';
import { DEFAULT_PROXY_PORT } from '@mvb/shared';

const PICKER_SCRIPT = `
(() => {
  if (window.__mvbPicker) return;
  window.__mvbPicker = true;
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
  });

  post('picker_ready', { href: location.href });

  // === 整页高度上报：用于父窗口等比缩放整页预览 ===
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
  if (document.readyState === 'complete') reportPageHeight();
  else window.addEventListener('load', reportPageHeight);
  // 动态内容延迟上报
  setTimeout(reportPageHeight, 300);
  setTimeout(reportPageHeight, 1000);
  setTimeout(reportPageHeight, 2500);
  // 监听 DOM 变化重新上报
  if (typeof MutationObserver !== 'undefined') {
    const mo = new MutationObserver(() => reportPageHeight());
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

  proxyUrl(target: string, userAgent?: string): string {
    const base = `http://127.0.0.1:${this._port}/proxy?url=${encodeURIComponent(target)}`;
    if (userAgent) return base + '&ua=' + encodeURIComponent(userAgent);
    return base;
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
        if (html.includes('</body>')) html = html.replace('</body>', `${inject}</body>`);
        else html += inject;
        if (!/<base\s/i.test(html)) {
          const base = target.endsWith('/') ? target : target.replace(/\/[^/]*$/, '/');
          html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
        }
        // 注入 viewport meta（页面缺失时）+ 整页预览 CSS（禁止滚动，交由外层等比缩放展示）
        const scrollbarCSS = `<style>
html::-webkit-scrollbar,body::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;-webkit-appearance:none!important}
html{scrollbar-width:none!important;-ms-overflow-style:none!important;overflow:hidden!important;overscroll-behavior:none!important}
body{overflow:hidden!important;scrollbar-width:none!important;-ms-overflow-style:none!important;overscroll-behavior:none!important}
body::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;-webkit-appearance:none!important}
</style>`;
        const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`;
        if (!/name=["']viewport["']/i.test(html)) {
          html = html.replace(/<head([^>]*)>/i, `<head$1>${viewportMeta}${scrollbarCSS}`);
        } else {
          if (html.includes('</head>')) html = html.replace('</head>', `${scrollbarCSS}</head>`);
          else html = scrollbarCSS + html;
        }
        body = Buffer.from(html, 'utf8');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        ...(isHttpsTarget ? { 'Content-Security-Policy': "script-src 'unsafe-inline' 'self'" } : {}),
      });
      res.end(body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Proxy error: ${(e as Error).message}`);
    }
  }
}