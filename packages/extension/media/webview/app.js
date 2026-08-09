"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../shared/dist/layoutAlign.js
  var require_layoutAlign = __commonJS({
    "../shared/dist/layoutAlign.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.POSITIONISH_STYLE_PROPS = exports.LAYOUT_SNAP_COARSE_PX = exports.LAYOUT_SNAP_STEP_PX = void 0;
      exports.snapLayoutPx = snapLayoutPx;
      exports.parseCssPx = parseCssPx;
      exports.snapCssPxValue = snapCssPxValue;
      exports.snapCssBoxShorthand = snapCssBoxShorthand;
      exports.alignMoveOp = alignMoveOp;
      exports.alignStyleOpValue = alignStyleOpValue;
      exports.LAYOUT_SNAP_STEP_PX = 4;
      exports.LAYOUT_SNAP_COARSE_PX = 8;
      function snapLayoutPx(value, step = exports.LAYOUT_SNAP_STEP_PX) {
        if (!Number.isFinite(value))
          return 0;
        if (step <= 0)
          return value;
        return Math.round(value / step) * step;
      }
      function parseCssPx(raw) {
        const m = String(raw || "").trim().match(/^(-?\d+(?:\.\d+)?)\s*px$/i);
        return m ? Number(m[1]) : null;
      }
      function snapCssPxValue(raw, step = exports.LAYOUT_SNAP_STEP_PX) {
        const n = parseCssPx(raw);
        if (n === null)
          return raw;
        return `${snapLayoutPx(n, step)}px`;
      }
      function snapCssBoxShorthand(raw, step = exports.LAYOUT_SNAP_STEP_PX) {
        const parts = String(raw || "").trim().split(/\s+/);
        if (!parts.length)
          return raw;
        const snapped = [];
        for (const p of parts) {
          const n = parseCssPx(p);
          if (n === null)
            return raw;
          snapped.push(`${snapLayoutPx(n, step)}px`);
        }
        return snapped.join(" ");
      }
      function alignMoveOp(op, step = exports.LAYOUT_SNAP_STEP_PX) {
        return {
          ...op,
          x: snapLayoutPx(op.x, step),
          y: snapLayoutPx(op.y, step)
        };
      }
      exports.POSITIONISH_STYLE_PROPS = /* @__PURE__ */ new Set([
        "left",
        "top",
        "right",
        "bottom",
        "width",
        "height",
        "margin",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "padding",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "gap",
        "row-gap",
        "column-gap",
        "translate",
        "inset"
      ]);
      function alignStyleOpValue(prop, value, step = exports.LAYOUT_SNAP_STEP_PX) {
        const key = prop.trim().toLowerCase();
        if (!exports.POSITIONISH_STYLE_PROPS.has(key) && key !== "transform")
          return value;
        if (key === "transform") {
          return value.replace(/(-?\d+(?:\.\d+)?)px/g, (m) => snapCssPxValue(m, step));
        }
        if (key.includes("margin") || key.includes("padding") || key === "inset" || key === "gap" || key.endsWith("-gap")) {
          return snapCssBoxShorthand(value, step);
        }
        return snapCssPxValue(value, step);
      }
    }
  });

  // ../shared/dist/geometry.js
  var require_geometry = __commonJS({
    "../shared/dist/geometry.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.screenInsetsFor = screenInsetsFor2;
      exports.devicePhoneGeometry = devicePhoneGeometry2;
      exports.insetPercentages = insetPercentages;
      function screenInsetsFor2(device) {
        const isTablet = device.width / device.height > 0.65;
        return isTablet ? { top: 0.022, bottom: 0.02, left: 0.018, right: 0.018, radius: "4% / 3%" } : { top: 0.0105, bottom: 0.0115, left: 0.0145, right: 0.0145, radius: "10% / 5.2%" };
      }
      function devicePhoneGeometry2(device) {
        const inset = screenInsetsFor2(device);
        const screenW = device.width;
        const screenH = device.height;
        const shellW = Math.round(screenW / (1 - inset.left - inset.right));
        const shellH = Math.round(screenH / (1 - inset.top - inset.bottom));
        return { device, inset, screenW, screenH, shellW, shellH };
      }
      function insetPercentages(inset) {
        return {
          topPct: (inset.top * 100).toFixed(4) + "%",
          bottomPct: (inset.bottom * 100).toFixed(4) + "%",
          leftPct: (inset.left * 100).toFixed(4) + "%",
          rightPct: (inset.right * 100).toFixed(4) + "%"
        };
      }
    }
  });

  // ../shared/dist/protocol.js
  var require_protocol = __commonJS({
    "../shared/dist/protocol.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.insetPercentages = exports.devicePhoneGeometry = exports.screenInsetsFor = exports.alignStyleOpValue = exports.alignMoveOp = exports.snapCssBoxShorthand = exports.snapCssPxValue = exports.parseCssPx = exports.snapLayoutPx = exports.POSITIONISH_STYLE_PROPS = exports.LAYOUT_SNAP_COARSE_PX = exports.LAYOUT_SNAP_STEP_PX = exports.DEVICE_PRESETS = exports.RESOURCE_OVERVIEW_URI = exports.VIEWPORT_EVENT_CHANNEL = exports.DEFAULT_PROXY_PORT = exports.DEFAULT_WS_PORT = void 0;
      exports.createSessionId = createSessionId;
      exports.createEditId = createEditId;
      exports.DEFAULT_WS_PORT = 3847;
      exports.DEFAULT_PROXY_PORT = 3848;
      exports.VIEWPORT_EVENT_CHANNEL = "viewportEventChannel";
      exports.RESOURCE_OVERVIEW_URI = "viewport://session/overview";
      exports.DEVICE_PRESETS = [
        {
          id: "iphone-17",
          name: "iPhone 17",
          width: 402,
          height: 874,
          deviceScaleFactor: 3,
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
          hasTouch: true,
          isMobile: true,
          notchType: "dynamic-island",
          homeIndicatorType: "home-indicator"
        },
        {
          id: "iphone-16",
          name: "iPhone 16",
          width: 393,
          height: 852,
          deviceScaleFactor: 3,
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
          hasTouch: true,
          isMobile: true,
          notchType: "dynamic-island",
          homeIndicatorType: "home-indicator"
        },
        {
          id: "iphone-15",
          name: "iPhone 15",
          width: 393,
          height: 852,
          deviceScaleFactor: 3,
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          hasTouch: true,
          isMobile: true,
          notchType: "dynamic-island",
          homeIndicatorType: "home-indicator"
        },
        {
          id: "iphone-14",
          name: "iPhone 14",
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
          hasTouch: true,
          isMobile: true,
          notchType: "notch",
          homeIndicatorType: "home-indicator"
        },
        {
          id: "iphone-se",
          name: "iPhone SE",
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
          hasTouch: true,
          isMobile: true,
          notchType: "none",
          homeIndicatorType: "none"
        },
        {
          id: "pixel-9",
          name: "Pixel 9",
          width: 412,
          height: 915,
          deviceScaleFactor: 2.625,
          userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          hasTouch: true,
          isMobile: true,
          notchType: "pill",
          homeIndicatorType: "gesture-bar"
        },
        {
          id: "galaxy-s25",
          name: "Galaxy S25",
          width: 360,
          height: 780,
          deviceScaleFactor: 3,
          userAgent: "Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          hasTouch: true,
          isMobile: true,
          notchType: "hole-punch",
          homeIndicatorType: "gesture-bar"
        },
        {
          id: "galaxy-s24",
          name: "Galaxy S24",
          width: 360,
          height: 780,
          deviceScaleFactor: 3,
          userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          hasTouch: true,
          isMobile: true,
          notchType: "hole-punch",
          homeIndicatorType: "gesture-bar"
        },
        {
          id: "ipad-mini",
          name: "iPad Mini",
          width: 768,
          height: 1024,
          deviceScaleFactor: 2,
          userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          hasTouch: true,
          isMobile: true,
          notchType: "none",
          homeIndicatorType: "none"
        },
        {
          id: "ipad-air",
          name: "iPad Air",
          width: 820,
          height: 1180,
          deviceScaleFactor: 2,
          userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          hasTouch: true,
          isMobile: true,
          notchType: "none",
          homeIndicatorType: "none"
        }
      ];
      function createSessionId() {
        return `vp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }
      function createEditId() {
        return `edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }
      var layoutAlign_1 = require_layoutAlign();
      Object.defineProperty(exports, "LAYOUT_SNAP_STEP_PX", { enumerable: true, get: function() {
        return layoutAlign_1.LAYOUT_SNAP_STEP_PX;
      } });
      Object.defineProperty(exports, "LAYOUT_SNAP_COARSE_PX", { enumerable: true, get: function() {
        return layoutAlign_1.LAYOUT_SNAP_COARSE_PX;
      } });
      Object.defineProperty(exports, "POSITIONISH_STYLE_PROPS", { enumerable: true, get: function() {
        return layoutAlign_1.POSITIONISH_STYLE_PROPS;
      } });
      Object.defineProperty(exports, "snapLayoutPx", { enumerable: true, get: function() {
        return layoutAlign_1.snapLayoutPx;
      } });
      Object.defineProperty(exports, "parseCssPx", { enumerable: true, get: function() {
        return layoutAlign_1.parseCssPx;
      } });
      Object.defineProperty(exports, "snapCssPxValue", { enumerable: true, get: function() {
        return layoutAlign_1.snapCssPxValue;
      } });
      Object.defineProperty(exports, "snapCssBoxShorthand", { enumerable: true, get: function() {
        return layoutAlign_1.snapCssBoxShorthand;
      } });
      Object.defineProperty(exports, "alignMoveOp", { enumerable: true, get: function() {
        return layoutAlign_1.alignMoveOp;
      } });
      Object.defineProperty(exports, "alignStyleOpValue", { enumerable: true, get: function() {
        return layoutAlign_1.alignStyleOpValue;
      } });
      var geometry_1 = require_geometry();
      Object.defineProperty(exports, "screenInsetsFor", { enumerable: true, get: function() {
        return geometry_1.screenInsetsFor;
      } });
      Object.defineProperty(exports, "devicePhoneGeometry", { enumerable: true, get: function() {
        return geometry_1.devicePhoneGeometry;
      } });
      Object.defineProperty(exports, "insetPercentages", { enumerable: true, get: function() {
        return geometry_1.insetPercentages;
      } });
    }
  });

  // src/webview/bridge.ts
  var VSCODE_API = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;
  var IS_EXTENSION = !!VSCODE_API;

  // src/webview/devices.ts
  var import_shared = __toESM(require_protocol());

  // src/webview/settings.ts
  var SETTINGS_KEY = "mvb-ui2-settings";
  var DEFAULT_SETTINGS = {
    showFrame: true,
    frameGlow: false,
    frameStyle: "default",
    screenDim: 12,
    wheelZoom: true,
    dblclickReset: true,
    showZoomBar: true,
    autoLoadInspect: true,
    mergePending: true,
    copyOnApply: true,
    showMcpPill: true,
    defaultUrl: "http://127.0.0.1:5173/",
    toastMs: 2e3,
    interactiveMode: false,
    fullPageScale: false,
    dprSimulation: false,
    touchSimulation: false,
    showNotch: true
  };
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
  function persistSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
    }
  }

  // src/webview/constants.ts
  var MODE_META = {
    preview: { title: "\u9884\u89C8", hint: "\u4E2D\u95F4\u4E3A\u624B\u673A\u89C6\u7A97\uFF1B\u7528\u9876\u90E8\u52A0\u8F7D/\u5237\u65B0\u63A7\u5236\u9884\u89C8\u5185\u5BB9\u3002" },
    devices: { title: "\u8BBE\u5907", hint: "\u9009\u62E9 DEVICE_PRESETS\uFF0C\u753B\u5E03\u6309\u89C6\u53E3\u5BBD\u9AD8\u81EA\u52A8\u5207\u6362\u3002" },
    inspect: { title: "\u68C0\u67E5", hint: "\u70B9\u51FB\u624B\u673A\u5185\u5143\u7D20\u6216\u5DE6\u4FA7\u8282\u70B9\u5217\u8868\u9009\u4E2D\uFF1B\u53F3\u4FA7\u6539\u5C5E\u6027\u540E\u300C\u5199\u5165\u9884\u89C8\u300D\u3002" },
    pending: { title: "Pending", hint: "\u5F85\u56DE\u5199\u961F\u5217 \xB7 \u6587\u672C\u672C\u5730\u5E94\u7528\uFF0C\u6837\u5F0F/\u5C5E\u6027/\u4F4D\u79FB\u4EA4 Agent\uFF08\u542B\u62D6\u52A8\u7F51\u683C\u5BF9\u9F50\uFF09\u3002" },
    settings: { title: "\u8BBE\u7F6E", hint: "\u9884\u89C8\u4E0E\u7F16\u8F91\u504F\u597D\uFF0C\u5373\u65F6\u751F\u6548\u5E76\u5199\u5165 localStorage\u3002" }
  };
  var PICKABLES = [
    { id: "t1", sel: "h1.hero", label: "\u6807\u9898", desc: "Mobile Viewport", text: "Mobile Viewport", color: "#e2e8f0", fontSize: "20px", fontWeight: "700", width: "auto", height: "auto", display: "block", borderRadius: "6px", margin: "0 0 6px", padding: "0", src: "" },
    { id: "c1", sel: "div.card#overview", label: "\u5361\u7247", desc: "\u4ECA\u65E5\u6982\u89C8", text: "\u4ECA\u65E5\u6982\u89C8 \u2014 \u70B9\u6211\u9009\u4E2D", color: "#4deeea", fontSize: "14px", fontWeight: "500", width: "auto", height: "auto", display: "block", borderRadius: "14px", margin: "0 0 12px", padding: "14px", src: "" },
    { id: "c2", sel: "div.card#cta", label: "\u6309\u94AE", desc: "\u5F00\u59CB\u4F53\u9A8C", text: "\u5F00\u59CB\u4F53\u9A8C", color: "#0a1a1f", fontSize: "15px", fontWeight: "700", width: "auto", height: "auto", display: "block", borderRadius: "10px", margin: "0", padding: "0", src: "" }
  ];

  // src/webview/app/utils.ts
  function buildOps(fields) {
    const ops = [];
    if (fields.text) ops.push({ type: "text", value: fields.text });
    if (fields.color) ops.push({ type: "style", prop: "color", value: fields.color });
    if (fields.fontSize) ops.push({ type: "style", prop: "fontSize", value: fields.fontSize });
    if (fields.fontWeight) ops.push({ type: "style", prop: "fontWeight", value: fields.fontWeight });
    if (fields.width) ops.push({ type: "style", prop: "width", value: fields.width });
    if (fields.height) ops.push({ type: "style", prop: "height", value: fields.height });
    if (fields.display) ops.push({ type: "style", prop: "display", value: fields.display });
    if (fields.borderRadius) ops.push({ type: "style", prop: "borderRadius", value: fields.borderRadius });
    if (fields.margin) ops.push({ type: "style", prop: "margin", value: fields.margin });
    if (fields.padding) ops.push({ type: "style", prop: "padding", value: fields.padding });
    if (fields.src) ops.push({ type: "attr", name: "src", value: fields.src });
    return ops;
  }
  function mergeOps(prev, next) {
    const map = /* @__PURE__ */ new Map();
    const keyOf = (op) => {
      if (op.type === "text") return "text";
      if (op.type === "style") return "style:" + op.prop;
      if (op.type === "attr") return "attr:" + op.name;
      return op.type;
    };
    (prev || []).forEach((op) => map.set(keyOf(op), op));
    (next || []).forEach((op) => map.set(keyOf(op), op));
    return [...map.values()];
  }
  function summarizeOps(ops) {
    if (!ops || !ops.length) return "\u65E0\u53D8\u66F4";
    return ops.map((op) => {
      if (op.type === "text") return "text";
      if (op.type === "style") return op.prop;
      if (op.type === "attr") return op.name;
      return op.type;
    }).join(" \xB7 ");
  }
  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  }
  function withCacheBust(url) {
    if (!url) return "";
    return url + (url.includes("?") ? "&" : "?") + "_ts=" + Date.now();
  }
  function layoutPhoneShell(shellEl, screenEl, g) {
    if (!shellEl || !screenEl) return;
    shellEl.style.width = g.shellW + "px";
    shellEl.style.height = g.shellH + "px";
    shellEl.style.aspectRatio = g.shellW + " / " + g.shellH;
    screenEl.style.top = Math.round(g.shellH * g.inset.top) + "px";
    screenEl.style.left = Math.round(g.shellW * g.inset.left) + "px";
    screenEl.style.right = "auto";
    screenEl.style.bottom = "auto";
    screenEl.style.width = g.screenW + "px";
    screenEl.style.height = g.screenH + "px";
    screenEl.style.borderRadius = g.inset.radius;
  }
  function layoutNotch(notchEl, screenEl, g, isLandscape2 = false) {
    if (!notchEl || !screenEl || !g.notch || g.notch.type === "none") {
      if (notchEl) notchEl.style.display = "none";
      return;
    }
    const screenW = g.screenW;
    const screenH = g.screenH;
    const notch = g.notch;
    notchEl.style.display = "block";
    notchEl.style.position = "absolute";
    if (isLandscape2) {
      const width = Math.round(screenW * notch.widthRatio);
      const height = Math.round(screenH * notch.heightRatio);
      const left = 0;
      const top = Math.round((screenH - height) / 2);
      notchEl.style.top = top + "px";
      notchEl.style.left = left + "px";
      notchEl.style.right = "auto";
      notchEl.style.bottom = "auto";
      notchEl.style.width = width + "px";
      notchEl.style.height = height + "px";
      notchEl.style.borderRadius = notch.borderRadius + "px";
      notchEl.className = "device-notch notch-" + notch.type + " notch-landscape";
    } else {
      const width = Math.round(screenW * notch.widthRatio);
      const height = Math.round(screenH * notch.heightRatio);
      const top = Math.round(screenH * notch.topRatio);
      const left = Math.round((screenW - width) / 2);
      notchEl.style.top = top + "px";
      notchEl.style.left = left + "px";
      notchEl.style.right = "auto";
      notchEl.style.bottom = "auto";
      notchEl.style.width = width + "px";
      notchEl.style.height = height + "px";
      notchEl.style.borderRadius = notch.borderRadius + "px";
      notchEl.className = "device-notch notch-" + notch.type;
    }
  }
  function layoutHomeIndicator(indicatorEl, screenEl, g, isLandscape2 = false) {
    if (!indicatorEl || !screenEl || !g.homeIndicator || g.homeIndicator.type === "none") {
      if (indicatorEl) indicatorEl.style.display = "none";
      return;
    }
    const screenW = g.screenW;
    const screenH = g.screenH;
    const hi = g.homeIndicator;
    indicatorEl.style.display = "block";
    indicatorEl.style.position = "absolute";
    if (isLandscape2) {
      const height = Math.round(screenH * hi.widthRatio);
      const width = hi.height;
      const right = hi.bottomOffset;
      const top = Math.round((screenH - height) / 2);
      indicatorEl.style.top = top + "px";
      indicatorEl.style.right = right + "px";
      indicatorEl.style.left = "auto";
      indicatorEl.style.bottom = "auto";
      indicatorEl.style.width = width + "px";
      indicatorEl.style.height = height + "px";
      indicatorEl.style.borderRadius = hi.borderRadius + "px";
      indicatorEl.className = "device-home-indicator indicator-" + hi.type + " indicator-landscape";
    } else {
      const width = Math.round(screenW * hi.widthRatio);
      const left = Math.round((screenW - width) / 2);
      const bottom = hi.bottomOffset;
      indicatorEl.style.bottom = bottom + "px";
      indicatorEl.style.left = left + "px";
      indicatorEl.style.right = "auto";
      indicatorEl.style.top = "auto";
      indicatorEl.style.width = width + "px";
      indicatorEl.style.height = hi.height + "px";
      indicatorEl.style.borderRadius = hi.borderRadius + "px";
      indicatorEl.className = "device-home-indicator indicator-" + hi.type;
    }
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      } catch {
        return false;
      }
    }
  }

  // src/webview/app/pending.ts
  function createPendingManager(ctx) {
    const toProtocolEdit = (p) => ({
      id: p.id,
      nodeId: p.nodeId || p.sel,
      selector: p.sel,
      sourceHint: p.sourceHint || { component: "demo" },
      ops: p.ops || buildOps(p),
      createdAt: p.createdAt
    });
    const buildApplyPrompt = () => {
      const edits = ctx.getPending().map(toProtocolEdit);
      return [
        "\u8BF7\u8C03\u7528 MCP \u5DE5\u5177 viewport_get_pending_edits \u83B7\u53D6\u53EF\u89C6\u5316\u7F16\u8F91\u961F\u5217\uFF0C",
        "\u6839\u636E\u6BCF\u6761 edit \u7684 selector \u4E0E ops \u4FEE\u6539\u9879\u76EE\u6E90\u7801\uFF0C",
        "\u5B8C\u6210\u540E\u8C03\u7528 viewport_apply_edit_result\uFF08\u4F20\u5165 editIds\uFF09\u5E76 viewport_reload\u3002",
        "",
        "\u5F53\u524D\u672C\u5730 pending \u6570\u91CF: " + edits.length,
        edits.length ? "\u672C\u5730\u9884\u89C8:\n" + JSON.stringify(edits, null, 2) : ""
      ].filter(Boolean).join("\n");
    };
    const updatePendingBadge = () => {
      const pending = ctx.getPending();
      if (ctx.pendingBadge) {
        ctx.pendingBadge.textContent = "pending: " + pending.length;
        ctx.pendingBadge.classList.toggle("text-cyber-cyan", pending.length > 0);
        ctx.pendingBadge.classList.toggle("border-cyber-cyan/40", pending.length > 0);
      }
      const rail = document.getElementById("railPendingCount");
      if (rail) {
        rail.textContent = pending.length > 9 ? "9+" : String(pending.length);
        rail.classList.toggle("hidden", pending.length === 0);
      }
      const btnApply = document.getElementById("btnApply");
      if (btnApply) btnApply.disabled = !pending.length;
      const pendingSub = document.getElementById("pipToolPendingSub");
      if (pendingSub) pendingSub.textContent = pending.length + " \u6761";
    };
    const refreshPendingUi = () => {
      updatePendingBadge();
      const pending = ctx.getPending();
      const preview = document.getElementById("pendingPromptPreview");
      const stat = document.getElementById("pendingStat");
      if (stat) stat.textContent = String(pending.length);
      if (preview) {
        preview.textContent = pending.length ? buildApplyPrompt() : "\u961F\u5217\u4E3A\u7A7A \xB7 \u5728\u68C0\u67E5\u6A21\u5F0F\u5199\u5165\u9884\u89C8\u540E\u4F1A\u51FA\u73B0\u5728\u6B64";
      }
      const btnApply = document.getElementById("btnApply");
      if (btnApply) btnApply.disabled = !pending.length;
      if (ctx.getMode() === "pending") ctx.renderModeList();
    };
    const upsertPending = (fields) => {
      const ops = buildOps(fields);
      const pending = ctx.getPending();
      const settings = ctx.getSettings();
      const existing = settings.mergePending ? pending.find((p) => p.sel === String(fields.sel)) : null;
      if (existing) {
        existing.ops = mergeOps(existing.ops, ops);
        existing.text = String(fields.text || existing.text);
        existing.color = String(fields.color || existing.color);
        existing.fontSize = String(fields.fontSize || existing.fontSize);
        existing.fontWeight = String(fields.fontWeight || existing.fontWeight);
        existing.width = String(fields.width || existing.width);
        existing.height = String(fields.height || existing.height);
        existing.display = String(fields.display || existing.display);
        existing.borderRadius = String(fields.borderRadius || existing.borderRadius);
        existing.margin = String(fields.margin || existing.margin);
        existing.padding = String(fields.padding || existing.padding);
        existing.src = String(fields.src || existing.src);
        existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        ctx.setSelectedId(existing.id);
        ctx.setPending([...pending]);
        refreshPendingUi();
        return { edit: existing, merged: true };
      }
      const edit = {
        id: "edit-" + Date.now().toString(36),
        nodeId: "node-" + (String(fields.sel) || "x").replace(/[^a-zA-Z0-9]+/g, "-"),
        sel: String(fields.sel),
        text: String(fields.text || ""),
        color: String(fields.color || ""),
        fontSize: String(fields.fontSize || ""),
        fontWeight: String(fields.fontWeight || ""),
        width: String(fields.width || ""),
        height: String(fields.height || ""),
        display: String(fields.display || ""),
        borderRadius: String(fields.borderRadius || ""),
        margin: String(fields.margin || ""),
        padding: String(fields.padding || ""),
        src: String(fields.src || ""),
        ops,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        sourceHint: { component: "demo" }
      };
      pending.push(edit);
      ctx.setPending(pending);
      ctx.setSelectedId(edit.id);
      refreshPendingUi();
      return { edit, merged: false };
    };
    const removePending = (id) => {
      const pending = ctx.getPending();
      const idx = pending.findIndex((p) => p.id === id);
      if (idx < 0) return;
      pending.splice(idx, 1);
      ctx.setPending(pending);
      if (ctx.getSelectedId() === id) ctx.setSelectedId("");
      refreshPendingUi();
      ctx.notify("\u5DF2\u79FB\u9664 " + id);
    };
    const clearAllPending = (silent) => {
      const pending = ctx.getPending();
      if (!pending.length) {
        if (!silent) ctx.notify("\u961F\u5217\u5DF2\u7A7A");
        return;
      }
      const n = pending.length;
      ctx.setPending([]);
      ctx.setSelectedId("");
      refreshPendingUi();
      if (!silent) ctx.notify("\u5DF2\u6E05\u7A7A " + n + " \u6761 pending");
    };
    const focusPendingEdit = (p) => {
      ctx.setSelectedId(p.id);
      ctx.applySelection(
        {
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
          src: p.src
        },
        true,
        { stay: true }
      );
      const hint = document.getElementById("inspectHint");
      if (hint) hint.textContent = "\u961F\u5217\u9879 \xB7 " + p.id + " \xB7 " + summarizeOps(p.ops);
      if (ctx.getMode() === "pending") ctx.renderModeList();
    };
    const applyToCode = async () => {
      if (IS_EXTENSION) {
        VSCODE_API.postMessage({ type: "apply_to_code" });
        ctx.notify("\u6B63\u5728\u5E94\u7528\uFF1A\u6587\u672C\u672C\u5730\u56DE\u5199\uFF0C\u5176\u4F59\u4EA4 Agent\u2026");
        return;
      }
      const pending = ctx.getPending();
      if (!pending.length) {
        ctx.notify("\u65E0 pending edits");
        return;
      }
      const count = pending.length;
      const ids = pending.map((p) => p.id);
      const prompt = buildApplyPrompt();
      const settings = ctx.getSettings();
      let ok = true;
      if (settings.copyOnApply) {
        ok = await copyText(prompt);
      }
      const appliedHistory = ctx.getAppliedHistory();
      appliedHistory.unshift({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        count,
        ids
      });
      if (appliedHistory.length > 8) appliedHistory.length = 8;
      ctx.setAppliedHistory(appliedHistory);
      ctx.setPending([]);
      ctx.setSelectedId("");
      refreshPendingUi();
      ctx.setMode("pending", { quiet: true });
      if (!settings.copyOnApply) {
        ctx.notify("\u5DF2\u5E94\u7528\uFF08\u6F14\u793A\uFF09" + count + " \u6761 \xB7 \u672A\u6539\u9879\u76EE\u6587\u4EF6");
      } else {
        ctx.notify(ok ? "\u5DF2\u5E94\u7528\uFF08\u6F14\u793A\uFF09" + count + " \u6761 \xB7 MCP \u63D0\u793A\u5DF2\u590D\u5236 \xB7 \u672A\u6539\u9879\u76EE\u6587\u4EF6" : "\u5DF2\u5E94\u7528\uFF08\u6F14\u793A\uFF09" + count + " \u6761 \xB7 \u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236\u53F3\u4FA7\u63D0\u793A");
      }
    };
    return {
      toProtocolEdit,
      buildApplyPrompt,
      refreshPendingUi,
      upsertPending,
      removePending,
      clearAllPending,
      focusPendingEdit,
      applyToCode,
      updatePendingBadge
    };
  }

  // src/webview/app/geometry.ts
  function notchGeometryFor(device) {
    const type = device.notchType || "none";
    const w = device.width;
    switch (type) {
      case "dynamic-island":
        return {
          type,
          widthRatio: 0.33,
          heightRatio: 0.035,
          topRatio: 0.012,
          borderRadius: Math.round(w * 0.05)
          // 约 20px @ 393px
        };
      case "notch":
        return {
          type,
          widthRatio: 0.45,
          heightRatio: 0.04,
          topRatio: 0,
          borderRadius: Math.round(w * 0.04)
          // 底部圆角
        };
      case "pill":
        return {
          type,
          widthRatio: 0.12,
          heightRatio: 0.025,
          topRatio: 0.015,
          borderRadius: Math.round(w * 0.06)
          // 全圆角
        };
      case "hole-punch":
        return {
          type,
          widthRatio: 0.06,
          heightRatio: 0.06,
          topRatio: 0.018,
          borderRadius: Math.round(w * 0.03)
          // 正圆
        };
      case "none":
      default:
        return {
          type: "none",
          widthRatio: 0,
          heightRatio: 0,
          topRatio: 0,
          borderRadius: 0
        };
    }
  }
  function homeIndicatorGeometryFor(device) {
    const type = device.homeIndicatorType || "none";
    const w = device.width;
    switch (type) {
      case "home-indicator":
        return {
          type,
          widthRatio: 0.36,
          height: 5,
          bottomOffset: 8,
          borderRadius: 3
        };
      case "gesture-bar":
        return {
          type,
          widthRatio: 0.3,
          height: 3,
          bottomOffset: 6,
          borderRadius: 2
        };
      case "none":
      default:
        return {
          type: "none",
          widthRatio: 0,
          height: 0,
          bottomOffset: 0,
          borderRadius: 0
        };
    }
  }
  function screenInsetsFor(device) {
    const isTablet = device.width / device.height > 0.65;
    return isTablet ? { top: 0.022, bottom: 0.02, left: 0.018, right: 0.018, radius: "4% / 3%" } : { top: 0.0105, bottom: 0.0115, left: 0.0145, right: 0.0145, radius: "10% / 5.2%" };
  }
  function devicePhoneGeometry(device) {
    const inset = screenInsetsFor(device);
    const screenW = device.width;
    const screenH = device.height;
    const shellW = Math.round(screenW / (1 - inset.left - inset.right));
    const shellH = Math.round(screenH / (1 - inset.top - inset.bottom));
    const notch = notchGeometryFor(device);
    const homeIndicator = homeIndicatorGeometryFor(device);
    return { device, inset, screenW, screenH, shellW, shellH, notch, homeIndicator };
  }

  // src/webview/app/layout.ts
  var userPhoneZoom = 1;
  var lastFitScale = 1;
  var isLandscape = false;
  var dprSimulation = false;
  var interactiveMode = false;
  var showNotch = true;
  function sendHostToFrame(frameEl, type, payload) {
    try {
      if (frameEl && frameEl.contentWindow) {
        frameEl.contentWindow.postMessage({ source: "mvb-host", type, payload }, "*");
      }
    } catch (_) {
    }
  }
  function applyPhoneCanvasSize(d) {
    const phoneEl = document.getElementById("phone");
    const screenEl = document.getElementById("screen");
    const wrap = document.getElementById("phoneZoomWrap");
    const stage = document.getElementById("phoneStage");
    const hint = document.getElementById("phoneScaleHint");
    const notchEl = document.getElementById("notch");
    const homeIndicatorEl = document.getElementById("homeIndicator");
    if (!phoneEl || !screenEl || !wrap || !stage) return;
    const g = devicePhoneGeometry(d);
    layoutPhoneShell(phoneEl, screenEl, g);
    layoutNotch(notchEl, screenEl, g);
    layoutHomeIndicator(homeIndicatorEl, screenEl, g);
    if (notchEl) {
      notchEl.style.display = showNotch ? "" : "none";
    }
    const frameEl = document.getElementById("frame");
    if (frameEl) {
      const dpr = dprSimulation ? d.deviceScaleFactor || 3 : 1;
      if (isLandscape) {
        const iframeW = g.screenW * dpr;
        const iframeH = g.screenH * dpr;
        frameEl.style.width = iframeW + "px";
        frameEl.style.height = iframeH + "px";
        frameEl.style.position = "absolute";
        frameEl.style.left = Math.round((g.screenW - iframeW) / 2) + "px";
        frameEl.style.top = Math.round((g.screenH - iframeH) / 2) + "px";
        frameEl.style.right = "auto";
        frameEl.style.bottom = "auto";
        frameEl.style.transform = "rotate(90deg) scale(" + 1 / dpr + ")";
        frameEl.style.transformOrigin = "center center";
      } else {
        if (dprSimulation) {
          frameEl.style.width = g.screenW * dpr + "px";
          frameEl.style.height = g.screenH * dpr + "px";
          frameEl.style.position = "absolute";
          frameEl.style.left = "0";
          frameEl.style.top = "0";
          frameEl.style.right = "auto";
          frameEl.style.bottom = "auto";
          frameEl.style.transform = "scale(" + 1 / dpr + ")";
          frameEl.style.transformOrigin = "top left";
        } else {
          frameEl.style.width = "";
          frameEl.style.height = "";
          frameEl.style.left = "";
          frameEl.style.top = "";
          frameEl.style.right = "";
          frameEl.style.bottom = "";
          frameEl.style.transform = "";
          frameEl.style.transformOrigin = "";
        }
      }
      frameEl.style.pointerEvents = interactiveMode ? "auto" : "none";
    }
    if (isLandscape) {
      phoneEl.classList.add("landscape");
      wrap.classList.add("landscape");
    } else {
      phoneEl.classList.remove("landscape");
      wrap.classList.remove("landscape");
    }
    const padX = 48;
    const padY = 56;
    const maxW = Math.max(160, stage.clientWidth - padX);
    const maxH = Math.max(220, stage.clientHeight - padY);
    const displayW = isLandscape ? g.shellH : g.shellW;
    const displayH = isLandscape ? g.shellW : g.shellH;
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
        const scale2 = Math.max(0.2, s * userPhoneZoom);
        wrap.style.width = Math.round(displayW * scale2) + "px";
        wrap.style.height = Math.round(displayH * scale2) + "px";
        wrap.style.overflow = "hidden";
        applyPhoneTransform(phoneEl, scale2, g, isLandscape);
        if (hint) hint.textContent = Math.round(scale2 * 100) + "%";
      };
      requestAnimationFrame(retryLayout);
    }
    lastFitScale = Math.min(1, maxW / displayW, maxH / displayH);
    const scale = Math.max(0.2, lastFitScale * userPhoneZoom);
    wrap.style.width = Math.round(displayW * scale) + "px";
    wrap.style.height = Math.round(displayH * scale) + "px";
    wrap.style.overflow = "hidden";
    applyPhoneTransform(phoneEl, scale, g, isLandscape);
    if (hint) hint.textContent = Math.round(scale * 100) + "%";
  }
  function toggleLandscape() {
    isLandscape = !isLandscape;
    return isLandscape;
  }
  function setLandscape(value) {
    isLandscape = value;
  }
  function setDprSimulation(value) {
    dprSimulation = value;
  }
  function setInteractiveMode(value) {
    interactiveMode = value;
  }
  function setShowNotch(value) {
    showNotch = value;
  }
  function applyPhoneTransform(phoneEl, scale, g, landscape) {
    phoneEl.style.left = "0";
    phoneEl.style.top = "0";
    phoneEl.style.transformOrigin = "top left";
    if (landscape) {
      phoneEl.style.transform = "scale(" + scale + ") translateY(" + g.shellW + "px) rotate(-90deg)";
    } else {
      phoneEl.style.transform = "scale(" + scale + ")";
    }
  }
  function applyFullPageScale(_pageHeight) {
    const frameEl = document.getElementById("frame");
    const pipFrameEl = document.getElementById("pipFrame");
    if (frameEl) {
      frameEl.style.transform = "";
      frameEl.style.width = "100%";
      frameEl.style.height = "100%";
      frameEl.style.transformOrigin = "";
    }
    if (pipFrameEl) {
      pipFrameEl.style.transform = "";
      pipFrameEl.style.width = "100%";
      pipFrameEl.style.height = "100%";
      pipFrameEl.style.transformOrigin = "";
    }
  }
  function setUserPhoneZoom(value) {
    userPhoneZoom = value;
  }
  function setLastFitScale(value) {
    lastFitScale = value;
  }

  // src/webview/app/pip.ts
  var PIP_TOOLS_W = 148;
  var pipResizeObservers = /* @__PURE__ */ new WeakMap();
  function createPipManager(ctx) {
    const supportsDocPip = () => !!(window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === "function");
    const isIdeEmbeddedBrowser = () => /Electron/i.test(navigator.userAgent || "");
    const canDetachExternally = () => supportsDocPip() || !isIdeEmbeddedBrowser();
    const hostPipWindow = () => document.getElementById("pipWindow");
    const pipRoots = () => {
      const roots = [];
      const host = hostPipWindow();
      if (host) roots.push(host);
      const extWin = ctx.getPipExternalWin();
      if (extWin && !extWin.closed) {
        try {
          const ext = extWin.document.getElementById("pipWindow");
          if (ext && ext !== host) roots.push(ext);
        } catch (_) {
        }
      }
      return roots;
    };
    const pipEl = (id) => {
      const extWin = ctx.getPipExternalWin();
      if (extWin && !extWin.closed) {
        try {
          const el = extWin.document.getElementById(id);
          if (el) return el;
        } catch (_) {
        }
      }
      return document.getElementById(id);
    };
    const mainStageDisplayScale = () => {
      const d = ctx.getDevice();
      const g = devicePhoneGeometry(d);
      const stage = document.getElementById("phoneStage");
      if (stage && stage.clientWidth > 0) {
        const padX = 48;
        const padY = 56;
        const maxW = Math.max(160, stage.clientWidth - padX);
        const maxH = Math.max(220, stage.clientHeight - padY);
        setLastFitScale(Math.min(1, maxW / g.shellW, maxH / g.shellH));
      }
      return Math.max(0.25, Math.min(1, lastFitScale * userPhoneZoom));
    };
    const pipPhoneGeometry = () => devicePhoneGeometry(ctx.getDevice());
    const pipBodyBox = (win) => {
      const body = win && win.querySelector("#pipBody");
      if (!body) return { w: 200, h: 400 };
      const cs = win.ownerDocument.defaultView.getComputedStyle(body);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const w = Math.max(60, body.clientWidth - padX);
      const h = Math.max(80, body.clientHeight - padY);
      return { w, h };
    };
    const pipFitScaleForWin = (win, g) => {
      const box = pipBodyBox(win);
      const toolsW = ctx.getPipToolsOpen() ? PIP_TOOLS_W : 0;
      if (box.w < 40 || box.h < 40) {
        const maxW = Math.max(120, (win.clientWidth || 320) - 32 - toolsW);
        const maxH = Math.max(160, (win.clientHeight || 520) - 76);
        return Math.max(0.15, Math.min(maxW / g.shellW, maxH / g.shellH));
      }
      return Math.max(0.15, Math.min(box.w / g.shellW, box.h / g.shellH));
    };
    const pipResolveDisplayScale = (win, g, refit) => {
      if (refit) {
        ctx.setPipDisplayScaleLocked(pipFitScaleForWin(win, g));
      } else if (ctx.getPipDisplayScaleLocked() == null) {
        ctx.setPipDisplayScaleLocked(mainStageDisplayScale());
      }
      return ctx.getPipDisplayScaleLocked();
    };
    const measurePipShellSize = () => {
      const g = pipPhoneGeometry();
      const toolsW = ctx.getPipToolsOpen() ? PIP_TOOLS_W : 0;
      const padX = 32;
      const headerH = 48;
      const padY = 28;
      const displayScale = ctx.getPipDisplayScaleLocked() != null ? ctx.getPipDisplayScaleLocked() : mainStageDisplayScale();
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
        shellH: g.shellH
      };
    };
    const parkHostPip = (on) => {
      const host = hostPipWindow();
      if (host) host.classList.toggle("pip-host-parked", !!on);
    };
    const estimateViewportScreenOrigin = () => {
      if (typeof window.mozInnerScreenX === "number") {
        return { x: window.mozInnerScreenX, y: window.mozInnerScreenY };
      }
      const sx = window.screenLeft != null ? window.screenLeft : window.screenX || 0;
      const sy = window.screenTop != null ? window.screenTop : window.screenY || 0;
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
      const ox = vv && vv.offsetLeft || 0;
      const oy = vv && vv.offsetTop || 0;
      const w = Math.max(240, Math.round(host.offsetWidth || rect.width));
      const h = Math.max(360, Math.round(host.offsetHeight || rect.height));
      return {
        left: Math.round(origin.x + ox + rect.left),
        top: Math.round(origin.y + oy + rect.top),
        width: w,
        height: h
      };
    };
    const fitExternalInnerSize = (extWin, box) => {
      if (!extWin || extWin.closed || !box) return false;
      try {
        ctx.setPipProgrammaticFitAt(Date.now());
        const dx = Math.round(box.width - extWin.innerWidth);
        const dy = Math.round(box.height - extWin.innerHeight);
        if (dx !== 0 || dy !== 0) {
          extWin.resizeTo(
            Math.max(220, Math.round(extWin.outerWidth + dx)),
            Math.max(280, Math.round(extWin.outerHeight + dy))
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
        return Math.abs(box.width - extWin.innerWidth) <= 2 && Math.abs(box.height - extWin.innerHeight) <= 2;
      } catch (_) {
        return false;
      }
    };
    const snapExternalContentToBox = (extWin, box, onDone) => {
      if (!extWin || !box) {
        onDone?.();
        return;
      }
      let n = 0;
      const tick = () => {
        const ok = fitExternalInnerSize(extWin, box);
        n += 1;
        if (ok || n >= 12) {
          onDone?.();
          return;
        }
        setTimeout(tick, 24 + n * 16);
      };
      tick();
      requestAnimationFrame(() => fitExternalInnerSize(extWin, box));
    };
    const copyAssetsToExternalDoc = (targetDoc) => {
      targetDoc.documentElement.className = "h-full";
      targetDoc.documentElement.style.cssText = "height:100%;width:100%;background:#0a1a1f;";
      targetDoc.body.className = "h-full";
      targetDoc.body.style.cssText = "margin:0;background:#0a1a1f;overflow:auto;height:100%;width:100%;-webkit-overflow-scrolling:touch;";
      try {
        targetDoc.title = "\u60AC\u6D6E\u9884\u89C8";
      } catch (_) {
      }
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        targetDoc.head.appendChild(node.cloneNode(true));
      });
      const base = targetDoc.createElement("base");
      base.href = document.baseURI;
      targetDoc.head.prepend(base);
      const boot2 = targetDoc.createElement("style");
      boot2.textContent = [
        "html,body{background:#0a1a1f!important;color:#e2e8f0;height:100%;width:100%;margin:0;overflow:auto;-webkit-overflow-scrolling:touch}",
        "#pipToolsToggle{display:none!important}",
        "#pipPinBadge{display:none!important}"
      ].join("");
      targetDoc.head.appendChild(boot2);
    };
    const hostPipSrcdoc = () => {
      const host = hostPipWindow();
      const pipFrame = host && host.querySelector("#pipFrame");
      if (pipFrame && pipFrame.srcdoc) return pipFrame.srcdoc;
      const mainFrame = document.getElementById("frame");
      if (mainFrame && mainFrame.srcdoc) return mainFrame.srcdoc;
      return ctx.getLoaded() ? ctx.buildDemoSrc() : "";
    };
    const lockScaleFromHost = () => {
      const host = hostPipWindow();
      const mainScale = mainStageDisplayScale();
      const hostScale = host && typeof host._pipDisplayScale === "number" ? host._pipDisplayScale : 0;
      if (hostScale > 0 && hostScale <= mainScale * 1.08) {
        ctx.setPipDisplayScaleLocked(hostScale);
      } else {
        ctx.setPipDisplayScaleLocked(mainScale);
      }
    };
    const layoutPipPhoneIn = (win, opts) => {
      if (!win) return;
      opts = opts || {};
      const g = pipPhoneGeometry();
      const displayScale = pipResolveDisplayScale(win, g, !!opts.refit);
      win._pipDisplayScale = displayScale;
      const scaleWrap = win.querySelector("#pipPhoneScaleWrap");
      const shell = win.querySelector("#pipPhoneShell");
      const screenEl = win.querySelector("#pipScreen");
      if (!shell || !screenEl) return;
      layoutPhoneShell(shell, screenEl, g);
      shell.style.position = "relative";
      shell.style.top = "auto";
      shell.style.left = "auto";
      shell.style.transform = "none";
      const notchEl = win.querySelector("#pipNotch");
      const homeIndicatorEl = win.querySelector("#pipHomeIndicator");
      layoutNotch(notchEl, screenEl, g);
      layoutHomeIndicator(homeIndicatorEl, screenEl, g);
      if (scaleWrap) {
        const useZoom = typeof CSS !== "undefined" && CSS.supports && CSS.supports("zoom", "1");
        scaleWrap.style.position = "relative";
        scaleWrap.style.overflow = "hidden";
        if (useZoom) {
          scaleWrap.style.zoom = String(displayScale);
          scaleWrap.style.width = g.shellW + "px";
          scaleWrap.style.height = g.shellH + "px";
          scaleWrap.style.transform = "none";
        } else {
          scaleWrap.style.zoom = "";
          scaleWrap.style.width = Math.round(g.shellW * displayScale) + "px";
          scaleWrap.style.height = Math.round(g.shellH * displayScale) + "px";
          scaleWrap.style.transform = "none";
          shell.style.position = "absolute";
          shell.style.top = "0";
          shell.style.left = "0";
          shell.style.transform = "scale(" + displayScale + ")";
          shell.style.transformOrigin = "top left";
        }
      }
      const settings = ctx.getSettings();
      const dim = Math.max(0, Math.min(40, Number(settings.screenDim) || 0)) / 100;
      screenEl.style.background = "rgba(0,0,0," + dim + ")";
      const frameImg = win.querySelector("#pipPhoneFrame");
      if (frameImg) {
        frameImg.style.visibility = settings.showFrame ? "visible" : "hidden";
        frameImg.classList.toggle("opacity-0", !settings.showFrame);
        const styleKey = settings.frameStyle === "style1" ? "data-screen-style1" : "data-screen-default";
        const newSrc = frameImg.getAttribute(styleKey);
        if (newSrc && frameImg.getAttribute("src") !== newSrc) {
          frameImg.setAttribute("src", newSrc);
        }
      }
    };
    const observePipWindowResize = (win) => {
      if (!win || typeof ResizeObserver === "undefined") return;
      if (pipResizeObservers.has(win)) return;
      const ro = new ResizeObserver(() => {
        if (ctx.getPipSuppressResizeLayout()) return;
        if (!ctx.getPipOpen() && win !== hostPipWindow()) return;
        layoutPipPhoneIn(win);
        updatePipToolsUi();
      });
      ro.observe(win);
      const body = win.querySelector("#pipBody");
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
        const toggle = win.querySelector("#pipToolsToggle");
        const btn = win.querySelector("#btnPipTools");
        const pinBadge = win.querySelector("#pipPinBadge");
        const pinBtn = win.querySelector("#pipToolPin");
        const hdrPin = win.querySelector("#btnPipPin");
        win.classList.toggle("tools-collapsed", !toolsOpen);
        win.classList.toggle("pip-detached", isDetached && win !== hostPipWindow());
        if (pinBadge) pinBadge.classList.add("hidden");
        if (toggle) toggle.style.display = "none";
        const pinHint = isDetached ? detachMode === "docpip" ? "Document PiP \xB7 \u70B9\u6B64\u6536\u56DE" : detachMode === "host" ? "\u72EC\u7ACB\u7A97\u53E3 \xB7 \u70B9\u6B64\u6536\u56DE" : "\u72EC\u7ACB\u7A97\u56DE\u9000 \xB7 \u70B9\u6B64\u6536\u56DE" : isExt ? "\u7F6E\u9876\u5230\u72EC\u7ACB\u7A97\u53E3\uFF08\u53EF\u79BB\u5F00\u4E3B\u7F16\u8F91\u533A\uFF09" : isIdeEmbeddedBrowser() ? "\u5F53\u524D\u73AF\u5883\u53D7\u9650" : supportsDocPip() ? "Document PiP \u7CBE\u7B80\u7F6E\u9876\u7A97" : "\u56DE\u9000\uFF1A\u6D4F\u89C8\u5668\u5F39\u7A97";
        if (pinBtn) {
          pinBtn.textContent = "";
          pinBtn.appendChild(doc.createTextNode(isDetached ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\u5F39\u51FA"));
          const s = doc.createElement("span");
          s.className = "sub";
          s.id = "pipToolPinSub";
          s.textContent = pinHint;
          pinBtn.appendChild(s);
        }
        if (hdrPin) {
          hdrPin.title = isDetached ? "\u53D6\u6D88\u7F6E\u9876\uFF08\u6536\u56DE\u5BBF\u4E3B\u5185\uFF09" : isExt ? "\u7F6E\u9876\u4E3A\u72EC\u7ACB\u7A97\u53E3\uFF08\u53EF\u79BB\u5F00\u4E3B\u7F16\u8F91\u533A\uFF0C\u4E0D\u6253\u5F00\u7CFB\u7EDF\u6D4F\u89C8\u5668\uFF09" : supportsDocPip() ? "Document PiP \u7F6E\u9876\uFF08\u7CBE\u7B80\u6D6E\u7A97\uFF09" : "\u5F53\u524D\u73AF\u5883\u65E0 Document PiP\uFF0C\u5C06\u56DE\u9000\u4E3A\u5F39\u7A97";
          const icon = hdrPin.querySelector(".material-symbols-outlined");
          if (icon) icon.textContent = isDetached ? "keep_off" : "keep";
          hdrPin.classList.toggle("text-cyber-cyan", isDetached);
        }
        if (btn) {
          btn.title = toolsOpen ? "\u9690\u85CF\u529F\u80FD\u6846" : "\u663E\u793A\u529F\u80FD\u6846";
          btn.classList.toggle("text-cyber-cyan", toolsOpen);
        }
        const frameSub = win.querySelector("#pipToolFrameSub");
        if (frameSub) frameSub.textContent = settings.showFrame ? "\u663E\u793A\u4E2D" : "\u5DF2\u9690\u85CF";
        const pendingSub = win.querySelector("#pipToolPendingSub");
        if (pendingSub) pendingSub.textContent = pendingLen + " \u6761";
        const sizeEl = win.querySelector("#pipToolSize");
        const disp = Math.round((win._pipDisplayScale || 1) * 100);
        if (sizeEl) sizeEl.textContent = "\u89C6\u53E3 " + device.width + "\xD7" + device.height + " \xB7 \u663E\u793A " + disp + "%";
        const label = win.querySelector("#pipDeviceLabel");
        if (label) label.textContent = device.name + " \xB7 \u89C6\u53E3 " + device.width + "\xD7" + device.height + " \xB7 \u663E\u793A " + disp + "%";
      });
    };
    const layoutPipPhone = (opts) => {
      pipRoots().forEach((win) => {
        observePipWindowResize(win);
        layoutPipPhoneIn(win, opts);
      });
      updatePipToolsUi();
    };
    const expandPipWindowForTools = (opening) => {
      const delta = opening ? PIP_TOOLS_W : -PIP_TOOLS_W;
      ctx.setPipSuppressResizeLayout(true);
      pipRoots().forEach((win) => {
        if (win.classList.contains("pip-detached")) return;
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
        win.style.width = w + "px";
        win.style.height = h + "px";
        win.style.left = left + "px";
        win.style.top = top + "px";
        win.dataset.userSized = "1";
      });
      updatePipToolsUi();
      layoutPipPhone();
      requestAnimationFrame(() => {
        layoutPipPhone();
        ctx.setPipSuppressResizeLayout(false);
      });
    };
    const expandDetachedPipForTools = (opening) => {
      const ext = ctx.getPipExternalWin();
      if (!ext || ext.closed) return;
      const delta = opening ? PIP_TOOLS_W : -PIP_TOOLS_W;
      ctx.setPipSuppressResizeLayout(true);
      try {
        const w = Math.max(240, (ext.outerWidth || ext.innerWidth) + delta);
        const h = ext.outerHeight || ext.innerHeight;
        ext.resizeTo(w, h);
      } catch (_) {
      }
      updatePipToolsUi();
      layoutPipPhone();
      requestAnimationFrame(() => {
        layoutPipPhone();
        ctx.setPipSuppressResizeLayout(false);
      });
    };
    const setPipToolsOpen = (on) => {
      const next = !!on;
      if (next === ctx.getPipToolsOpen()) return;
      ctx.setPipToolsOpen(next);
      if (!ctx.getPipDetachMode()) {
        expandPipWindowForTools(next);
        ctx.notify(next ? "\u529F\u80FD\u6846\u5DF2\u5C55\u5F00" : "\u529F\u80FD\u6846\u5DF2\u6536\u8D77");
      } else {
        expandDetachedPipForTools(next);
        ctx.notify(next ? "\u529F\u80FD\u6846\u5DF2\u5C55\u5F00" : "\u529F\u80FD\u6846\u5DF2\u6536\u8D77");
      }
    };
    const syncPipContent = () => {
      const loaded = ctx.getLoaded();
      const isExt = IS_EXTENSION;
      const proxyUrl = ctx.getCurrentProxyUrl();
      const demoSrc = ctx.buildDemoSrc();
      pipRoots().forEach((win) => {
        const pipFrame = win.querySelector("#pipFrame");
        const pipEmpty = win.querySelector("#pipEmpty");
        const pipEmptyText = win.querySelector("#pipEmptyText");
        if (!pipFrame) return;
        if (!loaded) {
          pipFrame.removeAttribute("src");
          pipFrame.srcdoc = "";
          if (pipEmpty) pipEmpty.classList.remove("hidden");
          if (pipEmptyText) pipEmptyText.textContent = "\u8BF7\u5148\u5728\u4E3B\u821E\u53F0\u52A0\u8F7D\u9884\u89C8";
          return;
        }
        if (isExt && proxyUrl) {
          pipFrame.removeAttribute("srcdoc");
          pipFrame.src = proxyUrl;
        } else {
          pipFrame.removeAttribute("src");
          pipFrame.srcdoc = demoSrc;
        }
        if (pipEmpty) pipEmpty.classList.add("hidden");
      });
      updatePipToolsUi();
    };
    const bindPipDocClicks = (doc) => {
      const boundDocs = ctx.getPipDetachBoundDocs();
      if (!doc || boundDocs.has(doc)) return;
      boundDocs.add(doc);
      doc.addEventListener("click", handlePipButtonClick);
    };
    const handlePipButtonClick = (e) => {
      const btn = e.target.closest && e.target.closest("button");
      if (!btn || !btn.closest("#pipWindow")) return;
      const id = btn.id;
      if (id === "btnPipClose") {
        closePip();
        return;
      }
      if (id === "btnPipPin" || id === "pipToolPin") {
        void detachPipPin();
        return;
      }
      if (id === "btnPipTools") {
        setPipToolsOpen(!ctx.getPipToolsOpen());
        return;
      }
      if (id === "pipToolsToggle") {
        setPipToolsOpen(true);
        return;
      }
      if (id === "pipToolHide") {
        setPipToolsOpen(false);
        return;
      }
      if (id === "btnPipReload" || id === "pipToolReload") {
        if (!ctx.getLoaded()) ctx.loadPreview(false);
        syncPipContent();
        ctx.notify("\u60AC\u6D6E\u9884\u89C8\u5DF2\u5237\u65B0");
        return;
      }
      if (id === "pipToolLoad") {
        ctx.loadPreview(true);
        syncPipContent();
        return;
      }
      if (id === "pipToolInspect") {
        ctx.setMode("inspect");
        ctx.notify("\u5DF2\u5207\u5165\u68C0\u67E5\u6A21\u5F0F");
        return;
      }
      if (id === "pipToolPending") {
        ctx.setMode("pending");
        return;
      }
      if (id === "pipToolFrame") {
        const next = !ctx.getSettings().showFrame;
        ctx.setSetting("showFrame", next, next ? "\u5916\u6846 \xB7 \u5F00" : "\u5916\u6846 \xB7 \u5173");
        layoutPipPhone();
        return;
      }
      if (id === "pipToolApply") {
        void ctx.applyToCode();
      }
    };
    const mountPipCloneInExternal = (extWin) => {
      const host = hostPipWindow();
      if (!host || !extWin) throw new Error("no host/external");
      copyAssetsToExternalDoc(extWin.document);
      const clone = host.cloneNode(true);
      clone.classList.remove("pip-host-parked");
      clone.classList.add("pip-detached");
      clone.classList.toggle("tools-collapsed", !ctx.getPipToolsOpen());
      clone.style.cssText = "position:relative;left:auto;top:auto;right:auto;bottom:auto;width:100%;height:100%;display:flex;max-width:none;max-height:none;";
      const frameImg = clone.querySelector("#pipPhoneFrame");
      if (frameImg) {
        const hostImg = document.getElementById("phoneFrame") || document.getElementById("pipPhoneFrame");
        const abs = hostImg && (hostImg.getAttribute("src") || hostImg.src);
        if (abs) frameImg.src = String(abs).split("?")[0];
      }
      const cloneFrame = clone.querySelector("#pipFrame");
      if (cloneFrame) cloneFrame.srcdoc = "";
      const sideToggle = clone.querySelector("#pipToolsToggle");
      if (sideToggle) sideToggle.remove();
      const badge = clone.querySelector("#pipPinBadge");
      if (badge) badge.classList.add("hidden");
      extWin.document.body.innerHTML = "";
      extWin.document.body.appendChild(clone);
      bindPipDocClicks(extWin.document);
      observePipWindowResize(extWin);
      return clone;
    };
    const fillExternalPip = (clone) => {
      layoutPipPhoneIn(clone, { refit: false });
      const frame = clone.querySelector("#pipFrame");
      const empty = clone.querySelector("#pipEmpty");
      const emptyText = clone.querySelector("#pipEmptyText");
      let src = hostPipSrcdoc();
      if (!src && ctx.getLoaded()) src = ctx.buildDemoSrc();
      if (frame) {
        frame.srcdoc = "";
        frame.srcdoc = src || "";
        if (empty) empty.classList.toggle("hidden", !!src);
        if (emptyText && !src) emptyText.textContent = "\u8BF7\u5148\u5728\u4E3B\u821E\u53F0\u52A0\u8F7D\u9884\u89C8";
      }
      updatePipToolsUi();
    };
    const bindExternalPipLifecycle = (extWin, clone) => {
      let settled = false;
      let timer = 0;
      const onPipWinResize = () => {
        if (ctx.getPipSuppressResizeLayout() || settled) return;
        const programmatic = Date.now() - ctx.getPipProgrammaticFitAt() < 500;
        layoutPipPhoneIn(clone, { refit: !programmatic });
        updatePipToolsUi();
      };
      extWin.addEventListener("resize", onPipWinResize);
      const onHide = () => finishHide();
      const finishHide = () => {
        if (settled) return;
        settled = true;
        if (timer) clearInterval(timer);
        try {
          extWin.removeEventListener("pagehide", onHide);
          extWin.removeEventListener("unload", onHide);
          extWin.removeEventListener("resize", onPipWinResize);
        } catch (_) {
        }
        if (ctx.getPipExternalWin() !== extWin) return;
        ctx.setPipDetachMode(null);
        ctx.setPipExternalWin(null);
        parkHostPip(false);
        if (ctx.getPipOpen()) {
          const host = hostPipWindow();
          if (host) {
            host.classList.remove("pip-host-parked");
            layoutPipPhoneIn(host);
          }
          updatePipToolsUi();
          ctx.notify("\u5DF2\u53D6\u6D88\u7F6E\u9876 \xB7 \u56DE\u5230\u5BBF\u4E3B\u5185\u60AC\u6D6E");
        } else {
          updatePipToolsUi();
        }
      };
      extWin.addEventListener("pagehide", onHide);
      extWin.addEventListener("unload", onHide);
      timer = window.setInterval(() => {
        if (!extWin || extWin.closed) finishHide();
      }, 400);
    };
    const openPopupPipWindow = (box) => {
      const target = box || captureHostPipScreenBox();
      if (!target) throw new Error("no box");
      lockScaleFromHost();
      ctx.setPipSuppressResizeLayout(true);
      const features = [
        "popup=yes",
        "resizable=yes",
        "scrollbars=no",
        "width=" + target.width,
        "height=" + target.height,
        "left=" + Math.max(0, target.left),
        "top=" + Math.max(0, target.top)
      ].join(",");
      const popup = window.open("about:blank", "mvb-pip-detach", features);
      if (!popup || popup === window) throw new Error("popup blocked");
      const clone = mountPipCloneInExternal(popup);
      ctx.setPipDetachMode("popup");
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
    const openDocPipWindow = async (box) => {
      const target = box || captureHostPipScreenBox();
      if (!target) throw new Error("no box");
      if (!supportsDocPip()) throw new Error("Document PiP unsupported");
      lockScaleFromHost();
      ctx.setPipSuppressResizeLayout(true);
      const opts = {
        width: target.width,
        height: target.height,
        preferInitialWindowPlacement: false,
        disallowReturnToOpener: false
      };
      const pipWin = await window.documentPictureInPicture.requestWindow(opts);
      if (!pipWin || pipWin === window) throw new Error("invalid pip window");
      const clone = mountPipCloneInExternal(pipWin);
      ctx.setPipDetachMode("docpip");
      ctx.setPipExternalWin(pipWin);
      fillExternalPip(clone);
      snapExternalContentToBox(pipWin, target, () => {
        fillExternalPip(clone);
        parkHostPip(true);
        setTimeout(() => {
          ctx.setPipSuppressResizeLayout(false);
        }, 120);
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
      host.style.width = size.width + "px";
      host.style.height = size.height + "px";
      host.style.left = Math.round(rect.left) + "px";
      host.style.top = Math.round(rect.top) + "px";
      host.dataset.userSized = "1";
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
        ctx.notify("\u60AC\u6D6E\u7A97\u4E0D\u53EF\u7528");
        return;
      }
      if (IS_EXTENSION) {
        const g = devicePhoneGeometry(ctx.getDevice());
        VSCODE_API.postMessage({
          type: "pip_detach",
          url: (ctx.getUrlInputValue() || "").trim(),
          proxyUrl: ctx.getCurrentProxyUrl() || "",
          deviceId: ctx.getDeviceId(),
          shellW: g.shellW,
          shellH: g.shellH,
          width: box.width,
          height: box.height
        });
        ctx.setPipDetachMode("host");
        parkHostPip(true);
        updatePipToolsUi();
        ctx.notify("\u6B63\u5728\u6253\u5F00\u72EC\u7ACB\u60AC\u6D6E\u7A97\u2026");
        return;
      }
      if (supportsDocPip()) {
        try {
          await openDocPipWindow(box);
          ctx.notify("\u5DF2 Document PiP \u7F6E\u9876 \xB7 \u7CBE\u7B80\u6D6E\u7A97");
          return;
        } catch (err) {
          console.warn("Document PiP failed, fallback to popup", err);
          parkHostPip(false);
          ctx.setPipDetachMode(null);
          ctx.setPipExternalWin(null);
        }
      }
      if (isIdeEmbeddedBrowser()) {
        updatePipToolsUi();
        ctx.notify("\u5F53\u524D\u5185\u7F6E\u9875\u4E0D\u652F\u6301\u7F6E\u9876\u6D6E\u7A97\u79BB\u5F00\u5BBF\u4E3B\uFF1B\u8BF7\u5728\u6269\u5C55\u9762\u677F\u5185\u4F7F\u7528\u7F6E\u9876");
        return;
      }
      try {
        openPopupPipWindow(box);
        ctx.notify("\u5DF2\u56DE\u9000\u4E3A\u6D4F\u89C8\u5668\u5F39\u7A97\uFF08\u65E0 Document PiP\uFF09");
        return;
      } catch (err2) {
        console.warn("popup pip failed", err2);
        parkHostPip(false);
        ctx.setPipDetachMode(null);
        ctx.setPipExternalWin(null);
      }
      ctx.notify("\u7F6E\u9876\u5931\u8D25 \xB7 \u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u79BB\u5F00\u5BBF\u4E3B\u7684\u6D6E\u7A97");
    };
    const attachPipUnpin = async () => {
      if (!ctx.getPipDetachMode()) return;
      if (IS_EXTENSION && ctx.getPipDetachMode() === "host") {
        VSCODE_API.postMessage({ type: "pip_attach" });
        ctx.setPipDetachMode(null);
        ctx.setPipExternalWin(null);
        parkHostPip(false);
        const host2 = hostPipWindow();
        if (ctx.getPipOpen() && host2) {
          host2.classList.remove("pip-host-parked");
          layoutPipPhoneIn(host2);
        }
        updatePipToolsUi();
        ctx.notify("\u5DF2\u8BF7\u6C42\u6536\u56DE\u72EC\u7ACB\u7A97");
        return;
      }
      const ext = ctx.getPipExternalWin();
      ctx.setPipDetachMode(null);
      ctx.setPipExternalWin(null);
      parkHostPip(false);
      const host = hostPipWindow();
      if (ctx.getPipOpen() && host) {
        host.classList.remove("pip-host-parked");
        layoutPipPhoneIn(host);
        updatePipToolsUi();
      }
      try {
        if (ext && !ext.closed) ext.close();
      } catch (_) {
      }
      updatePipToolsUi();
      ctx.notify("\u5DF2\u53D6\u6D88\u7F6E\u9876");
    };
    const placePipWindowVisible = (win, opts) => {
      const target = win || hostPipWindow();
      if (!target) return;
      opts = opts || {};
      target.classList.remove("pip-detached", "pip-host-parked");
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      target.style.display = "flex";
      target.style.position = "fixed";
      target.style.zIndex = "9999";
      target.style.right = "auto";
      target.style.bottom = "auto";
      target.style.transform = "none";
      target.style.opacity = "1";
      target.style.visibility = "visible";
      const keepSize = !!opts.keepSize && target.dataset.userSized === "1";
      if (!keepSize) {
        ctx.setPipDisplayScaleLocked(mainStageDisplayScale());
        target.dataset.userSized = "0";
      }
      const size = measurePipShellSize();
      let w = keepSize ? target.offsetWidth : size.width;
      let h = keepSize ? target.offsetHeight : size.height;
      w = Math.max(220, Math.min(vw - 16, w));
      h = Math.max(300, Math.min(vh - 16, h));
      target.style.width = w + "px";
      target.style.height = h + "px";
      observePipWindowResize(target);
      layoutPipPhoneIn(target, { refit: false });
      requestAnimationFrame(() => {
        layoutPipPhoneIn(target, { refit: false });
        updatePipToolsUi();
      });
      updatePipToolsUi();
      if (!opts.keepPos || !target.dataset.placed) {
        const left = Math.max(8, Math.min(vw - w - 8, Math.round((vw - w) * 0.55)));
        const top = Math.max(8, Math.min(vh - 64, 24));
        target.style.left = left + "px";
        target.style.top = top + "px";
      }
      target.dataset.placed = "1";
    };
    const openPip = () => {
      const modal = document.getElementById("pipModal");
      const win = hostPipWindow();
      if (!modal || !win) {
        ctx.notify("\u60AC\u6D6E\u7A97\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5237\u65B0\u9875\u9762");
        return;
      }
      modal.classList.remove("hidden");
      modal.style.display = "block";
      ctx.setPipOpen(true);
      if (!ctx.getLoaded()) ctx.loadPreview(false);
      placePipWindowVisible(win);
      requestAnimationFrame(() => {
        syncPipContent();
        placePipWindowVisible(win, { keepPos: true });
      });
      ctx.notify("\u60AC\u6D6E\u9884\u89C8\u5DF2\u6253\u5F00 \xB7 \u53F3\u4E0B\u89D2\u53EF\u62D6\u52A8\u8C03\u6574\u5927\u5C0F");
    };
    const closePip = () => {
      if (ctx.getPipDetachMode()) {
        const ext = ctx.getPipExternalWin();
        ctx.setPipDetachMode(null);
        ctx.setPipExternalWin(null);
        parkHostPip(false);
        try {
          if (ext && !ext.closed) ext.close();
        } catch (_) {
        }
      }
      const modal = document.getElementById("pipModal");
      if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "";
      }
      ctx.setPipOpen(false);
      const host = hostPipWindow();
      if (host) {
        const frameEl = host.querySelector("#pipFrame");
        if (frameEl) frameEl.srcdoc = "";
      }
    };
    const setupPipDrag = () => {
      const handle = document.getElementById("pipDragHandle");
      if (!handle) return;
      let dragging = false;
      let ox = 0;
      let oy = 0;
      let win = null;
      handle.addEventListener("pointerdown", (e) => {
        if (ctx.getPipDetachMode()) return;
        if (e.target.closest("button")) return;
        win = hostPipWindow();
        if (!win) return;
        dragging = true;
        win.classList.add("dragging");
        const rect = win.getBoundingClientRect();
        ox = e.clientX - rect.left;
        oy = e.clientY - rect.top;
        win.style.left = rect.left + "px";
        win.style.top = rect.top + "px";
        win.style.right = "auto";
        win.style.bottom = "auto";
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      handle.addEventListener("pointermove", (e) => {
        if (!dragging || !win) return;
        const w = win.offsetWidth;
        const h = win.offsetHeight;
        const margin = 40;
        let left = e.clientX - ox;
        let top = e.clientY - oy;
        left = Math.min(window.innerWidth - margin, Math.max(margin - w, left));
        top = Math.min(window.innerHeight - margin, Math.max(0, top));
        win.style.left = left + "px";
        win.style.top = top + "px";
      });
      const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        if (win) win.classList.remove("dragging");
        try {
          handle.releasePointerCapture(e.pointerId);
        } catch (_) {
        }
      };
      handle.addEventListener("pointerup", endDrag);
      handle.addEventListener("pointercancel", endDrag);
    };
    const setupPipResize = () => {
      const grip = document.getElementById("pipResizeHandle");
      if (!grip) return;
      let resizing = false;
      let startX = 0;
      let startY = 0;
      let startW = 0;
      let startH = 0;
      let win = null;
      grip.addEventListener("pointerdown", (e) => {
        if (ctx.getPipDetachMode()) return;
        win = hostPipWindow();
        if (!win) return;
        resizing = true;
        const rect = win.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startW = rect.width;
        startH = rect.height;
        win.style.left = rect.left + "px";
        win.style.top = rect.top + "px";
        win.style.right = "auto";
        win.style.bottom = "auto";
        win.dataset.userSized = "1";
        grip.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      });
      grip.addEventListener("pointermove", (e) => {
        if (!resizing || !win) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const left = win.offsetLeft;
        const top = win.offsetTop;
        let w = startW + (e.clientX - startX);
        let h = startH + (e.clientY - startY);
        w = Math.max(240, Math.min(vw - left - 8, w));
        h = Math.max(360, Math.min(vh - top - 8, h));
        win.style.width = w + "px";
        win.style.height = h + "px";
        layoutPipPhoneIn(win, { refit: true });
        updatePipToolsUi();
      });
      const endResize = (e) => {
        if (!resizing) return;
        resizing = false;
        if (win) {
          layoutPipPhoneIn(win, { refit: true });
          updatePipToolsUi();
        }
        try {
          grip.releasePointerCapture(e.pointerId);
        } catch (_) {
        }
      };
      grip.addEventListener("pointerup", endResize);
      grip.addEventListener("pointercancel", endResize);
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
          win.style.width = w + "px";
          win.style.height = h + "px";
          layoutPipPhoneIn(win);
          updatePipToolsUi();
        }
      }
    };
    const handlePipDetachMessage = (msg) => {
      if (msg.type === "pip_detach") {
        ctx.setPipDetachMode("host");
        parkHostPip(true);
        updatePipToolsUi();
        ctx.notify("\u5DF2\u5728\u72EC\u7ACB\u7A97\u53E3\u6253\u5F00\u60AC\u6D6E\u9884\u89C8");
      } else if (msg.type === "pip_attach_done") {
        ctx.setPipDetachMode(null);
        ctx.setPipExternalWin(null);
        parkHostPip(false);
        const host = hostPipWindow();
        if (ctx.getPipOpen() && host) {
          host.classList.remove("pip-host-parked");
          layoutPipPhoneIn(host);
        }
        updatePipToolsUi();
        ctx.notify("\u5DF2\u6536\u56DE\u72EC\u7ACB\u60AC\u6D6E\u7A97");
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
      handlePipDetachMessage
    };
  }

  // src/webview/app/runtime.ts
  function $id(id) {
    return document.getElementById(id);
  }
  function boot() {
    let currentProxyUrl = "";
    let liveSelection = null;
    let mode = "preview";
    let deviceId = "iphone-16";
    let loaded = false;
    let refreshKey = 0;
    let pending = [];
    let selectedPendingId = "";
    let appliedHistory = [];
    let toastTimer = null;
    let selectedSel = "";
    let settings = loadSettings();
    let pipOpen = false;
    let modeNavPinned = true;
    if (IS_EXTENSION) {
      document.body.classList.add("is-extension");
    }
    const modeList = $id("modeList");
    const modeTitle = $id("modeTitle");
    const modeHint = $id("modeHint");
    const deviceSelect = $id("deviceSelect");
    const sizeLabel = $id("sizeLabel");
    const screen = $id("screen");
    const frame = $id("frame");
    const emptyHint = $id("emptyHint");
    const pendingBadge = $id("pendingBadge");
    const urlInput = $id("urlInput");
    const phoneFrame = $id("phoneFrame");
    const phoneOffline = $id("phoneOffline");
    function device() {
      return import_shared.DEVICE_PRESETS.find((d) => d.id === deviceId) || import_shared.DEVICE_PRESETS[0];
    }
    function notify(msg) {
      let el = document.querySelector(".toast");
      if (!el) {
        el = document.createElement("div");
        el.className = "toast";
        el.setAttribute("role", "status");
        document.body.appendChild(el);
      }
      if (el.parentElement !== document.body) document.body.appendChild(el);
      el.textContent = msg;
      el.style.cssText = "";
      el.style.display = "block";
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        el.style.display = "none";
      }, settings.toastMs || 2e3);
    }
    function settingsSummaryText() {
      return [
        "showFrame: " + settings.showFrame,
        "frameGlow: " + settings.frameGlow,
        "screenDim: " + settings.screenDim + "%",
        "wheelZoom: " + settings.wheelZoom,
        "dblclickReset: " + settings.dblclickReset,
        "showZoomBar: " + settings.showZoomBar,
        "autoLoadInspect: " + settings.autoLoadInspect,
        "mergePending: " + settings.mergePending,
        "copyOnApply: " + settings.copyOnApply,
        "showMcpPill: " + settings.showMcpPill,
        "toastMs: " + settings.toastMs,
        "defaultUrl: " + settings.defaultUrl,
        "interactiveMode: " + settings.interactiveMode,
        "fullPageScale: " + settings.fullPageScale,
        "dprSimulation: " + settings.dprSimulation,
        "touchSimulation: " + settings.touchSimulation,
        "showNotch: " + settings.showNotch
      ].join("\n");
    }
    function applySettings() {
      const phoneEl = document.getElementById("phone");
      const frameImg = document.getElementById("phoneFrame");
      const screenEl = document.getElementById("screen");
      const hint = document.getElementById("emptyHint");
      const zoomBar = document.getElementById("zoomBar");
      const mcp = document.getElementById("mcpPill");
      const summary = document.getElementById("settingsSummary");
      if (frameImg) {
        frameImg.classList.toggle("opacity-0", !settings.showFrame);
        frameImg.style.visibility = settings.showFrame ? "visible" : "hidden";
        const styleKey = settings.frameStyle === "style1" ? "data-screen-style1" : "data-screen-default";
        const newSrc = frameImg.getAttribute(styleKey);
        if (newSrc && frameImg.getAttribute("src") !== newSrc) {
          frameImg.setAttribute("src", newSrc);
        }
      }
      if (phoneEl) {
        phoneEl.classList.toggle("phone-frame-glow", !!settings.frameGlow);
        if (!settings.frameGlow) {
          phoneEl.style.filter = "drop-shadow(0 18px 40px rgba(0,0,0,.45))";
        } else {
          phoneEl.style.filter = "none";
        }
      }
      const dim = Math.max(0, Math.min(40, Number(settings.screenDim) || 0)) / 100;
      if (screenEl) screenEl.style.background = "rgba(0,0,0," + dim + ")";
      if (hint) hint.style.background = "rgba(0,0,0," + Math.min(0.45, dim + 0.08) + ")";
      if (zoomBar) zoomBar.classList.toggle("hidden", !settings.showZoomBar);
      if (mcp) mcp.classList.toggle("hidden", !settings.showMcpPill);
      if (summary) summary.textContent = settingsSummaryText();
      document.getElementById("btnApply").title = settings.copyOnApply ? "\u5E94\u7528\u5230\u4EE3\u7801\u5E76\u590D\u5236 MCP \u63D0\u793A\uFF08\u6F14\u793A\uFF09" : "\u5E94\u7528\u5230\u4EE3\u7801\uFF08\u6F14\u793A\uFF0C\u4E0D\u81EA\u52A8\u590D\u5236\uFF09";
      setInteractiveMode(settings.interactiveMode);
      setDprSimulation(settings.dprSimulation);
      setShowNotch(settings.showNotch);
      applyPhoneCanvasSize2(device());
      syncTouchSimulationToFrame();
      const btnInteractive2 = document.getElementById("btnInteractive");
      if (btnInteractive2) {
        btnInteractive2.classList.toggle("text-cyber-cyan", settings.interactiveMode);
        btnInteractive2.classList.toggle("border-cyber-cyan/50", settings.interactiveMode);
      }
      const btnDprEl = document.getElementById("btnDpr");
      if (btnDprEl) {
        btnDprEl.classList.toggle("text-cyber-cyan", settings.dprSimulation);
        btnDprEl.classList.toggle("border-cyber-cyan/50", settings.dprSimulation);
      }
      const btnTouchEl = document.getElementById("btnTouch");
      if (btnTouchEl) {
        btnTouchEl.classList.toggle("text-cyber-cyan", settings.touchSimulation);
        btnTouchEl.classList.toggle("border-cyber-cyan/50", settings.touchSimulation);
      }
      const btnNotchEl = document.getElementById("btnNotch");
      if (btnNotchEl) {
        btnNotchEl.classList.toggle("text-cyber-cyan", settings.showNotch);
        btnNotchEl.classList.toggle("border-cyber-cyan/50", settings.showNotch);
      }
      if (pipOpen) layoutPipPhone();
    }
    function setSetting(key, value, toastLabel) {
      settings[key] = value;
      persistSettings(settings);
      applySettings();
      if (mode === "settings") renderModeList();
      if (toastLabel) notify(toastLabel);
    }
    const pendingMgr = createPendingManager({
      getPending: () => pending,
      setPending: (items) => {
        pending = items;
      },
      getSelectedId: () => selectedPendingId,
      setSelectedId: (id) => {
        selectedPendingId = id;
      },
      getAppliedHistory: () => appliedHistory,
      setAppliedHistory: (h) => {
        appliedHistory = h;
      },
      getMode: () => mode,
      getSettings: () => settings,
      notify,
      applySelection,
      setMode,
      renderModeList,
      pendingBadge
    });
    function toProtocolEdit(p) {
      return pendingMgr.toProtocolEdit(p);
    }
    function buildApplyPrompt() {
      return pendingMgr.buildApplyPrompt();
    }
    function refreshPendingUi() {
      pendingMgr.refreshPendingUi();
    }
    function upsertPending(fields) {
      return pendingMgr.upsertPending(fields);
    }
    function removePending(id) {
      pendingMgr.removePending(id);
    }
    function clearAllPending(silent) {
      pendingMgr.clearAllPending(silent);
    }
    function focusPendingEdit(p) {
      pendingMgr.focusPendingEdit(p);
    }
    async function applyToCode() {
      await pendingMgr.applyToCode();
    }
    function updatePendingBadge() {
      pendingMgr.updatePendingBadge();
    }
    let pipToolsOpen = false;
    let pipDetachMode = null;
    let pipExternalWin = null;
    let pipDetachBoundDocs = /* @__PURE__ */ new WeakSet();
    let pipDisplayScaleLocked = null;
    let pipSuppressResizeLayout = false;
    let pipProgrammaticFitAt = 0;
    const pipMgr = createPipManager({
      getPipOpen: () => pipOpen,
      setPipOpen: (v) => {
        pipOpen = v;
      },
      getPipToolsOpen: () => pipToolsOpen,
      setPipToolsOpen: (v) => {
        pipToolsOpen = v;
      },
      getPipDetachMode: () => pipDetachMode,
      setPipDetachMode: (v) => {
        pipDetachMode = v;
      },
      getPipExternalWin: () => pipExternalWin,
      setPipExternalWin: (v) => {
        pipExternalWin = v;
      },
      getPipDisplayScaleLocked: () => pipDisplayScaleLocked,
      setPipDisplayScaleLocked: (v) => {
        pipDisplayScaleLocked = v;
      },
      getPipSuppressResizeLayout: () => pipSuppressResizeLayout,
      setPipSuppressResizeLayout: (v) => {
        pipSuppressResizeLayout = v;
      },
      getPipProgrammaticFitAt: () => pipProgrammaticFitAt,
      setPipProgrammaticFitAt: (v) => {
        pipProgrammaticFitAt = v;
      },
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
      getFrame: () => frame
    });
    function updateTouchLabel() {
      const label = document.getElementById("touchLabel");
      if (!label) return;
      if (settings.touchSimulation) {
        label.textContent = "\u6A21\u62DF\u4E2D";
        label.className = "text-cyber-cyan";
        return;
      }
      const d = device();
      label.textContent = d.hasTouch ? "\u673A\u578B\u652F\u6301" : "\u672A\u542F\u7528";
      label.className = d.hasTouch ? "text-slate-300" : "text-slate-500";
    }
    function syncTouchSimulationToFrame() {
      updateTouchLabel();
      sendHostToFrame2("touchSimulation", { enabled: !!settings.touchSimulation });
    }
    function syncDeviceChrome() {
      const d = device();
      sizeLabel.textContent = d.width + "\xD7" + d.height;
      document.getElementById("deviceLabel").textContent = d.name;
      document.getElementById("dprLabel").textContent = String(d.deviceScaleFactor);
      updateTouchLabel();
      deviceSelect.value = d.id;
      applyPhoneCanvasSize2(d);
      if (pipOpen) layoutPipPhone();
      if (loaded) {
        if (!IS_EXTENSION) {
          const f = $id("frame");
          if (f) f.srcdoc = buildDemoSrc();
        }
        syncPipContent();
      }
    }
    function framePointerEvents() {
      return settings.interactiveMode || mode === "inspect" ? "auto" : "none";
    }
    function applyConfigure(msg) {
      if (!msg) return;
      if (msg.deviceId) deviceId = String(msg.deviceId);
      if (msg.url) urlInput.value = String(msg.url);
      if (typeof msg.landscape === "boolean" && msg.landscape !== isLandscape) {
        setLandscape(msg.landscape);
        const btnRotateEl = document.getElementById("btnRotate");
        if (btnRotateEl) {
          btnRotateEl.classList.toggle("text-cyber-cyan", msg.landscape);
          btnRotateEl.classList.toggle("border-cyber-cyan/50", msg.landscape);
        }
      }
      currentProxyUrl = String(msg.proxyUrl || msg.url || "");
      syncDeviceChrome();
      if (!currentProxyUrl) return;
      loaded = true;
      emptyHint.classList.add("hidden");
      frame.classList.remove("pointer-events-none");
      frame.style.pointerEvents = framePointerEvents();
      frame.removeAttribute("srcdoc");
      frame.src = withCacheBust(currentProxyUrl);
      applyPhoneCanvasSize2(device());
      setTimeout(() => syncTouchSimulationToFrame(), 300);
      setTimeout(() => syncTouchSimulationToFrame(), 1e3);
      if (pipOpen) {
        layoutPipPhone();
        syncPipContent();
      }
      const mcp = document.getElementById("mcpPill");
      if (mcp && !mcp.textContent.includes("Picker")) {
        mcp.textContent = "MCP ON";
      }
    }
    function sendHostToFrame2(type, payload) {
      sendHostToFrame(frame, type, payload);
    }
    let lastPageHeight = 0;
    let pageHeightTimer = null;
    function applyPhoneCanvasSize2(d) {
      applyPhoneCanvasSize(d);
      if (frame) frame.style.pointerEvents = framePointerEvents();
      if (settings.fullPageScale && lastPageHeight > d.height) {
        applyFullPageScaleTransform(lastPageHeight);
      }
    }
    function applyFullPageScale2(pageHeight) {
      if (typeof pageHeight === "number" && pageHeight > 0) {
        lastPageHeight = pageHeight;
      }
      const d = device();
      if (!settings.fullPageScale) {
        applyFullPageScale();
        applyPhoneCanvasSize(d);
        return;
      }
      applyFullPageScaleTransform(lastPageHeight || pageHeight || 0);
    }
    function applyFullPageScaleTransform(pageHeight) {
      const d = device();
      const frameEl = document.getElementById("frame");
      const pipFrameEl = document.getElementById("pipFrame");
      const actualHeight = Math.max(0, pageHeight || 0);
      if (!frameEl) return;
      if (actualHeight <= d.height || actualHeight === 0) {
        applyFullPageScale();
        applyPhoneCanvasSize(d);
        return;
      }
      const scale = d.height / actualHeight;
      frameEl.style.width = d.width + "px";
      frameEl.style.height = actualHeight + "px";
      frameEl.style.transformOrigin = "top left";
      frameEl.style.transform = "scale(" + scale + ")";
      if (pipFrameEl) {
        pipFrameEl.style.width = d.width + "px";
        pipFrameEl.style.height = actualHeight + "px";
        pipFrameEl.style.transformOrigin = "top left";
        pipFrameEl.style.transform = "scale(" + scale + ")";
      }
    }
    function buildDemoSrc() {
      const d = device();
      const url = urlInput.value;
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
  <div class="card" id="c1" data-sel="div.card#overview" data-text="\u4ECA\u65E5\u6982\u89C8 \u2014 \u70B9\u6211\u9009\u4E2D" data-color="#4deeea" data-fs="14px" data-fw="500" data-w="auto" data-h="auto" data-dis="block" data-br="14px" data-margin="0 0 12px" data-padding="14px">
<span class="chip">${d.name}</span>
<span class="chip">${vw}\xD7${vh}${isLandscape ? " \xB7 \u6A2A\u5C4F" : ""}</span>
<div style="margin-top:10px;font-size:14px;color:#4deeea" id="c1text" data-edit-text>\u4ECA\u65E5\u6982\u89C8 \u2014 \u70B9\u6211\u9009\u4E2D</div>
  </div>
  <div class="card" id="c2" data-sel="div.card#cta" data-text="\u5F00\u59CB\u4F53\u9A8C" data-color="#0a1a1f" data-fs="15px" data-fw="700" data-w="auto" data-h="auto" data-dis="block" data-br="10px" data-margin="0 0 12px" data-padding="0">
<div id="c2text" data-edit-text style="background:#4deeea;color:#0a1a1f;text-align:center;padding:10px;border-radius:10px;font-weight:700;font-size:15px">\u5F00\u59CB\u4F53\u9A8C</div>
  </div>
  <div class="card"><div style="font-size:13px;line-height:1.6">\u{1F4F1} \u6EDA\u52A8\u6D4B\u8BD5\u533A \u2014 \u9F20\u6807\u6EDA\u8F6E / \u89E6\u63A7\u677F\u4E0A\u4E0B\u6EDA\u52A8\u5373\u53EF\u5728\u624B\u673A\u5185\u6D4F\u89C8\u957F\u9875\u9762\uFF0C\u4E0E\u771F\u5B9E\u624B\u673A\u6D4F\u89C8\u5668\u4E00\u81F4\u3002</div></div>
  ${Array.from({ length: 6 }, (_, i) => `<div class="card"><span class="chip">\u5361\u7247 ${i + 1}</span><div style="margin-top:8px;font-size:13px;line-height:1.5">\u8FD9\u662F\u7B2C ${i + 1} \u6BB5\u793A\u4F8B\u5185\u5BB9\uFF0C\u7528\u6765\u6F14\u793A\u9875\u9762\u5728\u624B\u673A\u5C4F\u5E55\u5185\u7684\u81EA\u7136\u6EDA\u52A8\u884C\u4E3A\u3002\u5B9E\u9645\u4F7F\u7528\u65F6\uFF0C\u628A\u9884\u89C8 URL \u66FF\u6362\u6210\u4F60\u81EA\u5DF1\u7684\u9875\u9762\u5373\u53EF\u3002</div></div>`).join("")}
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
      modeList.innerHTML = "";
      if (mode === "preview") {
        const d = device();
        const rows = [
          { k: "\u5F53\u524D\u8BBE\u5907", v: d.name },
          { k: "\u89C6\u53E3", v: d.width + "\xD7" + d.height },
          { k: "DPR", v: String(d.deviceScaleFactor) },
          { k: "\u5730\u5740", v: urlInput.value || "\u2014" },
          { k: "\u9884\u89C8", v: loaded ? "\u5DF2\u52A0\u8F7D" : "\u672A\u52A0\u8F7D" },
          { k: "pending", v: String(pending.length) }
        ];
        rows.forEach((it) => {
          const row = document.createElement("div");
          row.className = "px-4 py-2.5 text-xs border-b border-white/5";
          row.innerHTML = '<div class="text-slate-500">' + it.k + '</div><div class="text-slate-200 mt-0.5 break-all">' + it.v + "</div>";
          modeList.appendChild(row);
        });
        const go = document.createElement("button");
        go.type = "button";
        go.className = "mx-3 mt-3 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs font-semibold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 hover:bg-cyber-cyan/30";
        go.textContent = "\u53BB\u9009\u62E9\u8BBE\u5907 \u2192";
        go.addEventListener("click", () => setMode("devices"));
        modeList.appendChild(go);
        return;
      }
      if (mode === "devices") {
        import_shared.DEVICE_PRESETS.forEach((d) => {
          const row = document.createElement("button");
          row.type = "button";
          row.className = "mode-nav-item" + (d.id === deviceId ? " is-active" : "");
          row.innerHTML = '<i class="fa-solid fa-circle-dot text-[8px] shrink-0"></i><span class="truncate">' + d.name + '</span><span class="res">' + d.width + "\xD7" + d.height + "</span>";
          row.addEventListener("click", () => {
            deviceId = d.id;
            syncDeviceChrome();
            renderModeList();
            if (IS_EXTENSION) {
              VSCODE_API.postMessage({ type: "device_change", deviceId });
            } else if (loaded) {
              loadPreview(false);
            }
            notify("\u8BBE\u5907\uFF1A" + d.name + " \xB7 " + d.width + "\xD7" + d.height);
          });
          modeList.appendChild(row);
        });
        return;
      }
      if (mode === "pending") {
        const head = document.createElement("div");
        head.className = "px-3 pb-2 space-y-2";
        head.innerHTML = '<div class="flex items-center justify-between text-xs"><span class="text-slate-400">\u961F\u5217</span><span class="font-mono text-cyber-cyan">' + pending.length + "</span></div>";
        modeList.appendChild(head);
        const actions = document.createElement("div");
        actions.className = "px-3 pb-3 flex flex-col gap-1.5";
        const applyBtn = document.createElement("button");
        applyBtn.type = "button";
        applyBtn.disabled = !pending.length;
        applyBtn.className = "w-full px-3 py-2 rounded-lg text-xs font-semibold bg-cyber-cyan/85 text-black hover:bg-cyber-cyan disabled:opacity-40 disabled:cursor-not-allowed";
        applyBtn.textContent = "\u5E94\u7528\u5230\u4EE3\u7801";
        applyBtn.addEventListener("click", () => {
          void applyToCode();
        });
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.disabled = !pending.length;
        clearBtn.className = "w-full px-3 py-1.5 rounded-lg text-xs border border-cyber-border text-slate-400 hover:text-rose-300 hover:border-rose-400/40 disabled:opacity-40";
        clearBtn.textContent = "\u6E05\u7A7A\u961F\u5217";
        clearBtn.addEventListener("click", () => clearAllPending(false));
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.disabled = !pending.length;
        copyBtn.className = "w-full px-3 py-1.5 rounded-lg text-xs border border-cyber-border text-slate-400 hover:text-cyber-cyan hover:border-cyber-cyan/50 disabled:opacity-40";
        copyBtn.textContent = "\u590D\u5236 MCP \u63D0\u793A";
        copyBtn.addEventListener("click", async () => {
          if (!pending.length) return;
          const ok = await copyText(buildApplyPrompt());
          notify(ok ? "MCP \u63D0\u793A\u5DF2\u590D\u5236" : "\u590D\u5236\u5931\u8D25");
        });
        actions.appendChild(applyBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(clearBtn);
        modeList.appendChild(actions);
        if (!pending.length) {
          const empty = document.createElement("div");
          empty.className = "px-4 py-3 text-xs text-slate-500 leading-relaxed";
          empty.textContent = "\u6682\u65E0 pending\u3002\u5728\u5C5E\u6027\u68C0\u67E5\u4E2D\u5199\u5165\u9884\u89C8\u540E\u4F1A\u51FA\u73B0\u5728\u6B64\u3002";
          modeList.appendChild(empty);
          const go = document.createElement("button");
          go.type = "button";
          go.className = "mx-3 mt-1 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs font-semibold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 hover:bg-cyber-cyan/30";
          go.textContent = "\u53BB\u5C5E\u6027\u68C0\u67E5 \u2192";
          go.addEventListener("click", () => setMode("inspect"));
          modeList.appendChild(go);
        } else {
          pending.slice().reverse().forEach((p) => {
            const wrap = document.createElement("div");
            const active = selectedPendingId === p.id;
            wrap.className = "mx-2 mb-1.5 rounded-lg border overflow-hidden " + (active ? "border-cyber-cyan/50 bg-cyber-cyan/10" : "border-white/5 bg-black/20");
            const row = document.createElement("button");
            row.type = "button";
            row.className = "w-full text-left px-3 py-2.5 hover:bg-white/5";
            row.innerHTML = '<div class="flex items-center justify-between gap-2"><span class="text-[10px] font-mono text-cyber-cyan truncate">' + p.id + '</span><span class="text-[9px] text-slate-500 shrink-0">' + formatTime(p.updatedAt || p.createdAt) + '</span></div><div class="text-[11px] text-slate-300 mt-1 font-mono truncate">' + p.sel + '</div><div class="text-[10px] text-slate-500 mt-0.5 truncate">' + summarizeOps(p.ops) + (p.text ? " \xB7 " + String(p.text).slice(0, 18) : "") + "</div>";
            row.addEventListener("click", () => focusPendingEdit(p));
            const tools = document.createElement("div");
            tools.className = "flex border-t border-white/5";
            const del = document.createElement("button");
            del.type = "button";
            del.className = "flex-1 px-2 py-1.5 text-[10px] text-slate-500 hover:text-rose-300 hover:bg-rose-500/10";
            del.textContent = "\u5220\u9664";
            del.addEventListener("click", (e) => {
              e.stopPropagation();
              removePending(p.id);
            });
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "flex-1 px-2 py-1.5 text-[10px] text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 border-l border-white/5";
            editBtn.textContent = "\u68C0\u67E5\u7F16\u8F91";
            editBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              focusPendingEdit(p);
              setMode("inspect", { quiet: true });
              notify("\u5DF2\u8F7D\u5165\u961F\u5217\u9879\uFF0C\u53EF\u4FEE\u6539\u540E\u518D\u6B21\u5199\u5165");
            });
            tools.appendChild(del);
            tools.appendChild(editBtn);
            wrap.appendChild(row);
            wrap.appendChild(tools);
            modeList.appendChild(wrap);
          });
        }
        if (appliedHistory.length) {
          const histTitle = document.createElement("div");
          histTitle.className = "px-3 pt-3 mt-2 border-t border-cyber-border/40 text-[10px] uppercase tracking-wider text-slate-500";
          histTitle.textContent = "\u6700\u8FD1\u5E94\u7528";
          modeList.appendChild(histTitle);
          appliedHistory.slice(0, 3).forEach((h) => {
            const row = document.createElement("div");
            row.className = "px-4 py-2 text-[11px] text-slate-500";
            row.innerHTML = '<span class="text-emerald-400/90">' + h.count + " \u6761</span> \xB7 " + formatTime(h.at) + '<div class="font-mono text-[9px] text-slate-600 mt-0.5 truncate">' + h.ids.join(", ") + "</div>";
            modeList.appendChild(row);
          });
        }
        return;
      }
      if (mode === "inspect") {
        const tip = document.createElement("div");
        tip.className = "px-3 pb-2 text-[11px] text-slate-500 leading-relaxed";
        tip.textContent = loaded ? "\u5728\u624B\u673A\u5185\u70B9\u51FB\uFF0C\u6216\u4ECE\u4E0B\u65B9\u8282\u70B9\u9009\u53D6\uFF1A" : "\u5C06\u81EA\u52A8\u52A0\u8F7D\u6F14\u793A\u9884\u89C8\u4EE5\u4FBF\u9009\u53D6\u2026";
        modeList.appendChild(tip);
        PICKABLES.forEach((p) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.dataset.sel = p.sel;
          const active = selectedSel === p.sel;
          btn.className = "w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors " + (active ? "active-nav-item text-white" : "hover:bg-white/5 text-slate-300");
          btn.innerHTML = '<div class="flex items-center gap-2"><i class="fa-solid fa-crosshairs text-[10px] ' + (active ? "text-cyber-cyan" : "text-slate-500") + '"></i><span class="text-xs font-medium">' + p.label + '</span></div><div class="text-[10px] text-slate-500 mt-0.5 pl-4 font-mono truncate">' + p.sel + '</div><div class="text-[11px] text-slate-400 mt-0.5 pl-4 truncate">' + p.desc + "</div>";
          btn.addEventListener("click", () => {
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
              src: p.src || ""
            }, true);
          });
          modeList.appendChild(btn);
        });
        const reloadBtn = document.createElement("button");
        reloadBtn.type = "button";
        reloadBtn.className = "mx-3 mt-3 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs border border-cyber-border text-slate-400 hover:text-cyber-cyan hover:border-cyber-cyan/50";
        reloadBtn.textContent = loaded ? "\u91CD\u65B0\u52A0\u8F7D\u6F14\u793A\u9875" : "\u52A0\u8F7D\u6F14\u793A\u9875";
        reloadBtn.addEventListener("click", () => {
          loadPreview(true);
          clearSelection(false);
        });
        modeList.appendChild(reloadBtn);
        return;
      }
      if (mode === "settings") {
        let addSection2 = function(title) {
          const el = document.createElement("div");
          el.className = "px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500";
          el.textContent = title;
          modeList.appendChild(el);
        }, addToggle2 = function(key, label, hint) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "setting-row mx-2";
          btn.style.width = "calc(100% - 1rem)";
          const on = !!settings[key];
          btn.innerHTML = '<div class="min-w-0"><div class="text-xs text-slate-200">' + label + "</div>" + (hint ? '<div class="meta">' + hint + "</div>" : "") + '</div><span class="toggle-pill' + (on ? " on" : "") + '" aria-hidden="true"></span>';
          btn.addEventListener("click", () => {
            const next = !settings[key];
            setSetting(key, next, label + (next ? " \xB7 \u5F00" : " \xB7 \u5173"));
          });
          modeList.appendChild(btn);
        };
        var addSection = addSection2, addToggle = addToggle2;
        const tip = document.createElement("div");
        tip.className = "px-3 pb-2 text-[11px] text-slate-500 leading-relaxed";
        tip.textContent = "\u504F\u597D\u5373\u65F6\u751F\u6548\uFF0C\u5E76\u4FDD\u5B58\u5230\u672C\u673A localStorage\u3002";
        modeList.appendChild(tip);
        addSection2("\u753B\u5E03");
        addToggle2("showFrame", "\u624B\u673A\u5916\u6846", "\u663E\u793A\u673A\u6846\u56FE");
        addToggle2("frameGlow", "\u673A\u6846\u9AD8\u4EAE\u63CF\u8FB9", "phone-frame-glow");
        const frameStyleBtn = document.createElement("button");
        frameStyleBtn.type = "button";
        frameStyleBtn.className = "setting-row mx-2";
        frameStyleBtn.style.width = "calc(100% - 1rem)";
        const frameStyleLabel = settings.frameStyle === "style1" ? "\u65B0\u6846 (ui-screen1)" : "\u9ED8\u8BA4\u6846 (ui-screen)";
        frameStyleBtn.innerHTML = '<div class="min-w-0"><div class="text-xs text-slate-200">\u624B\u673A\u6846\u6837\u5F0F</div><div class="meta">\u70B9\u51FB\u5207\u6362\u673A\u6846\u56FE</div></div><span class="text-[11px] font-mono text-cyber-cyan shrink-0">' + frameStyleLabel + "</span>";
        frameStyleBtn.addEventListener("click", () => {
          const next = settings.frameStyle === "style1" ? "default" : "style1";
          setSetting("frameStyle", next, "\u624B\u673A\u6846 \xB7 " + (next === "style1" ? "\u65B0\u6846" : "\u9ED8\u8BA4\u6846"));
        });
        modeList.appendChild(frameStyleBtn);
        addToggle2("showZoomBar", "\u7F29\u653E\u63A7\u4EF6", "\u53F3\u4E0B\u89D2 + / \u2212 / \u91CD\u7F6E");
        addToggle2("wheelZoom", "\u6EDA\u8F6E\u7F29\u653E", "\u6307\u9488\u5728\u753B\u5E03\u4E0A\u65F6\u6EDA\u8F6E\u7F29\u653E");
        addToggle2("dblclickReset", "\u53CC\u51FB\u91CD\u7F6E\u7F29\u653E", "\u53CC\u51FB\u753B\u5E03\u56DE\u5230 100%");
        const dimBtn = document.createElement("button");
        dimBtn.type = "button";
        dimBtn.className = "setting-row mx-2";
        dimBtn.style.width = "calc(100% - 1rem)";
        dimBtn.innerHTML = '<div class="min-w-0"><div class="text-xs text-slate-200">\u5C4F\u5E55\u906E\u7F69</div><div class="meta">\u5F00\u5B54\u534A\u900F\u660E\u5F3A\u5EA6</div></div><span class="text-[11px] font-mono text-cyber-cyan shrink-0">' + settings.screenDim + "%</span>";
        dimBtn.addEventListener("click", () => {
          const steps = [0, 8, 12, 20, 30];
          const i = steps.indexOf(settings.screenDim);
          const next = steps[(i < 0 ? 2 : i + 1) % steps.length];
          setSetting("screenDim", next, "\u5C4F\u5E55\u906E\u7F69 \xB7 " + next + "%");
        });
        modeList.appendChild(dimBtn);
        addSection2("\u7F16\u8F91");
        addToggle2("autoLoadInspect", "\u68C0\u67E5\u65F6\u81EA\u52A8\u52A0\u8F7D", "\u8FDB\u5165\u68C0\u67E5\u6A21\u5F0F\u81EA\u52A8\u52A0\u8F7D\u6F14\u793A\u9875");
        addToggle2("mergePending", "\u5408\u5E76\u540C\u9009\u62E9\u5668", "\u5199\u5165 pending \u65F6\u5408\u5E76 ops");
        addToggle2("copyOnApply", "\u5E94\u7528\u65F6\u590D\u5236 MCP", "\u300C\u5E94\u7528\u5230\u4EE3\u7801\u300D\u81EA\u52A8\u590D\u5236\u63D0\u793A\u8BCD");
        addSection2("\u9884\u89C8\u4F53\u9A8C");
        addToggle2("interactiveMode", "\u53EF\u4EA4\u4E92\u6A21\u5F0F", "\u5141\u8BB8 iframe \u6EDA\u52A8\u548C\u70B9\u51FB");
        addToggle2("fullPageScale", "\u6574\u9875\u7F29\u653E", "\u628A\u957F\u9875\u7B49\u6BD4\u538B\u8FDB\u4E00\u5C4F\uFF08\u9ED8\u8BA4\u5173\xB7\u771F\u673A\u6EDA\u52A8\uFF09");
        addToggle2("dprSimulation", "DPR \u9AD8\u5206\u8FA8\u7387", "\u6309\u8BBE\u5907\u50CF\u7D20\u6BD4\u6E32\u67D3\uFF0C\u66F4\u63A5\u8FD1\u771F\u673A");
        addToggle2("touchSimulation", "\u89E6\u63A7\u6A21\u62DF", "\u7981\u7528 hover \u6548\u679C\uFF0C\u6A21\u62DF\u79FB\u52A8\u7AEF");
        addToggle2("showNotch", "\u7075\u52A8\u5C9B/\u5218\u6D77", "\u663E\u793A\u5C4F\u5E55\u9876\u90E8\u7684\u5218\u6D77\u6216\u7075\u52A8\u5C9B");
        addSection2("\u754C\u9762");
        addToggle2("showMcpPill", "MCP \u6807\u7B7E", "\u5DE6\u4FA7\u6807\u9898\u65C1 MCP demo");
        const toastBtn = document.createElement("button");
        toastBtn.type = "button";
        toastBtn.className = "setting-row mx-2";
        toastBtn.style.width = "calc(100% - 1rem)";
        toastBtn.innerHTML = '<div class="min-w-0"><div class="text-xs text-slate-200">\u63D0\u793A\u65F6\u957F</div><div class="meta">Toast \u663E\u793A\u6BEB\u79D2</div></div><span class="text-[11px] font-mono text-cyber-cyan shrink-0">' + settings.toastMs + "</span>";
        toastBtn.addEventListener("click", () => {
          const steps = [1200, 2e3, 3200, 5e3];
          const i = steps.indexOf(settings.toastMs);
          const next = steps[(i < 0 ? 1 : i + 1) % steps.length];
          setSetting("toastMs", next, "\u63D0\u793A\u65F6\u957F \xB7 " + next + "ms");
        });
        modeList.appendChild(toastBtn);
        addSection2("\u9ED8\u8BA4\u5730\u5740");
        const urlWrap = document.createElement("div");
        urlWrap.className = "px-3 pb-2 space-y-1.5";
        const urlField = document.createElement("input");
        urlField.type = "text";
        urlField.value = settings.defaultUrl;
        urlField.className = "w-full bg-black/35 border border-cyber-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-200 outline-none focus:border-cyber-cyan/50";
        urlField.placeholder = "http://127.0.0.1:5173/";
        const urlActions = document.createElement("div");
        urlActions.className = "flex gap-1.5";
        const saveUrl = document.createElement("button");
        saveUrl.type = "button";
        saveUrl.className = "flex-1 px-2 py-1.5 rounded-lg text-[10px] bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40";
        saveUrl.textContent = "\u4FDD\u5B58\u9ED8\u8BA4";
        saveUrl.addEventListener("click", () => {
          const v = urlField.value.trim() || DEFAULT_SETTINGS.defaultUrl;
          setSetting("defaultUrl", v, "\u5DF2\u4FDD\u5B58\u9ED8\u8BA4\u5730\u5740");
        });
        const useUrl = document.createElement("button");
        useUrl.type = "button";
        useUrl.className = "flex-1 px-2 py-1.5 rounded-lg text-[10px] border border-cyber-border text-slate-400 hover:text-cyber-cyan";
        useUrl.textContent = "\u586B\u5165\u9876\u680F";
        useUrl.addEventListener("click", () => {
          urlInput.value = settings.defaultUrl;
          notify("\u5DF2\u586B\u5165\u9ED8\u8BA4\u5730\u5740");
        });
        urlActions.appendChild(saveUrl);
        urlActions.appendChild(useUrl);
        urlWrap.appendChild(urlField);
        urlWrap.appendChild(urlActions);
        modeList.appendChild(urlWrap);
        const reset = document.createElement("button");
        reset.type = "button";
        reset.className = "mx-3 mt-2 mb-1 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg text-xs border border-rose-500/30 text-rose-300/90 hover:bg-rose-500/10";
        reset.textContent = "\u6062\u590D\u5168\u90E8\u9ED8\u8BA4";
        reset.addEventListener("click", () => {
          settings = Object.assign({}, DEFAULT_SETTINGS);
          persistSettings(settings);
          applySettings();
          renderModeList();
          notify("\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E");
        });
        modeList.appendChild(reset);
        const note = document.createElement("div");
        note.className = "px-4 py-2 text-[10px] text-slate-600 leading-relaxed";
        note.textContent = IS_EXTENSION ? "\u504F\u597D\u5DF2\u5199\u5165\u672C\u673A\uFF1B\u9884\u89C8\u7ECF\u672C\u5730\u4EE3\u7406\u6CE8\u5165\u70B9\u9009\u5668\u3002" : "\u72EC\u7ACB\u7A3F\u6F14\u793A \xB7 \u4EE3\u7406\u5265 XFO \u4EC5\u5728\u6269\u5C55\u5185\u751F\u6548";
        modeList.appendChild(note);
        return;
      }
    }
    function syncColorPicker(hex) {
      const picker = $id("colorPicker");
      const color = $id("color");
      if (!hex) return;
      const m = String(hex).trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
      if (m) {
        let h = m[0];
        if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
        picker.value = h.toLowerCase();
      }
      color.value = hex;
    }
    function setInspectChrome(on) {
      const panel = document.getElementById("inspectorPanel");
      const stage = document.getElementById("phoneStage");
      const badge = document.getElementById("inspectModeBadge");
      const pendingBadgeEl = document.getElementById("pendingModeBadge");
      const settingsBadgeEl = document.getElementById("settingsModeBadge");
      const pendingPanel = document.getElementById("pendingPanel");
      const settingsPanel = document.getElementById("settingsPanel");
      const title = document.getElementById("inspectorTitle");
      const desc = document.getElementById("inspectorDesc");
      panel.classList.toggle("inspect-active", on && mode === "inspect");
      panel.classList.toggle("pending-active", mode === "pending");
      panel.classList.toggle("settings-active", mode === "settings");
      stage.classList.toggle("inspect-active", on && mode === "inspect");
      badge.classList.toggle("hidden", mode !== "inspect");
      pendingBadgeEl.classList.toggle("hidden", mode !== "pending");
      settingsBadgeEl.classList.toggle("hidden", mode !== "settings");
      pendingPanel.classList.toggle("hidden", mode !== "pending");
      settingsPanel.classList.toggle("hidden", mode !== "settings");
      if (mode === "pending") {
        title.textContent = "Pending \u961F\u5217";
        desc.textContent = "\u6587\u672C\u7531\u6269\u5C55\u672C\u5730\u56DE\u5199\uFF1B\u6837\u5F0F/\u5C5E\u6027/\u4F4D\u79FB\u4EA4 Agent\uFF084px \u7F51\u683C\u5BF9\u9F50 + \u81EA\u68C0\uFF09\u3002";
      } else if (mode === "inspect") {
        title.textContent = "\u5C5E\u6027\u68C0\u67E5";
        desc.textContent = "\u8FDB\u5165\u300C\u68C0\u67E5\u300D\u540E\u70B9\u51FB\u624B\u673A\u5185\u5143\u7D20\uFF1B\u6539\u5C5E\u6027\u540E\u70B9\u300C\u5199\u5165\u9884\u89C8\u300D\u5373\u65F6\u751F\u6548\u5E76\u5165 pending\u3002";
      } else if (mode === "settings") {
        title.textContent = "\u8BBE\u7F6E";
        desc.textContent = "\u753B\u5E03 / \u7F16\u8F91 / \u754C\u9762\u504F\u597D\uFF1B\u53D8\u66F4\u5373\u65F6\u751F\u6548\u5E76\u5199\u5165 localStorage\u3002";
        const summary = document.getElementById("settingsSummary");
        if (summary) summary.textContent = settingsSummaryText();
      } else {
        title.textContent = "\u5C5E\u6027";
        desc.textContent = "\u5728\u68C0\u67E5\u6A21\u5F0F\u9009\u4E2D\u5143\u7D20\u540E\u53EF\u7F16\u8F91\uFF1B\u5199\u5165\u4F1A\u8FDB\u5165 pending \u961F\u5217\u3002";
      }
      $id("btnCommit").disabled = !selectedSel;
    }
    function postToFrame(payload) {
      try {
        if (frame.contentWindow) frame.contentWindow.postMessage(payload, "*");
      } catch (_) {
      }
    }
    function applySelection(msg, highlightInFrame, opts) {
      const stay = opts && opts.stay;
      selectedSel = msg.sel || "";
      $id("sel").value = selectedSel;
      $id("text").value = msg.text || "";
      syncColorPicker(msg.color || "#4deeea");
      $id("fontSize").value = msg.fontSize || "";
      $id("fontWeight").value = msg.fontWeight || "";
      $id("width").value = msg.width || "";
      $id("height").value = msg.height || "";
      $id("display").value = msg.display || "";
      $id("borderRadius").value = msg.borderRadius || "";
      $id("margin").value = msg.margin || "";
      $id("padding").value = msg.padding || "";
      $id("src").value = msg.src || "";
      document.getElementById("inspectHint").textContent = selectedSel ? "\u5DF2\u9009\u4E2D \xB7 \u53EF\u7F16\u8F91\u540E\u5199\u5165\u9884\u89C8" : "\u7B49\u5F85\u9009\u62E9\u5143\u7D20\u2026";
      $id("btnCommit").disabled = !selectedSel;
      if (highlightInFrame && selectedSel) {
        const run = () => postToFrame({ type: "inspect-highlight", sel: selectedSel });
        run();
        setTimeout(run, 80);
      }
      if (stay) {
        if (mode === "inspect" || mode === "pending") renderModeList();
        return;
      }
      if (mode === "inspect") renderModeList();
      else setMode("inspect", { quiet: true });
    }
    function clearSelection(notifyUser) {
      selectedSel = "";
      $id("sel").value = "";
      $id("text").value = "";
      $id("color").value = "";
      $id("fontSize").value = "";
      $id("fontWeight").value = "";
      $id("width").value = "";
      $id("height").value = "";
      $id("display").value = "";
      $id("borderRadius").value = "";
      $id("margin").value = "";
      $id("padding").value = "";
      $id("src").value = "";
      document.getElementById("inspectHint").textContent = "\u7B49\u5F85\u9009\u62E9\u5143\u7D20\u2026";
      $id("btnCommit").disabled = true;
      postToFrame({ type: "inspect-clear" });
      if (mode === "inspect") renderModeList();
      if (notifyUser !== false) notify("\u5DF2\u6E05\u9664\u9009\u4E2D");
    }
    function setModeNavPinned(on, opts) {
      modeNavPinned = !!on;
      const nav = document.getElementById("modeNav");
      if (nav) nav.classList.toggle("mode-nav-collapsed", !modeNavPinned);
      document.querySelectorAll(".rail-btn").forEach((b) => {
        const active = b.dataset.mode === mode;
        const base = b.getAttribute("data-title-base") || b.dataset.mode || "";
        b.classList.toggle("rail-active", active && modeNavPinned);
        b.classList.toggle("text-slate-500", !(active && modeNavPinned));
        b.title = active && modeNavPinned ? base + "\uFF08\u518D\u70B9\u6536\u8D77\u4FA7\u680F\uFF09" : base;
      });
      if (!(opts && opts.quiet)) {
        requestAnimationFrame(() => applyPhoneCanvasSize2(device()));
      }
    }
    function setMode(next, opts) {
      const quiet = opts && opts.quiet;
      const forceOpen = opts && opts.forceOpen;
      mode = next;
      if (forceOpen || !modeNavPinned) setModeNavPinned(true, { quiet: true });
      document.querySelectorAll(".rail-btn").forEach((b) => {
        const active = b.dataset.mode === mode;
        b.classList.toggle("rail-active", active && modeNavPinned);
        b.classList.toggle("text-slate-500", !(active && modeNavPinned));
      });
      setInspectChrome(mode === "inspect");
      if (mode === "inspect" && !loaded && settings.autoLoadInspect) {
        loadPreview(false);
        if (!quiet) {
          notify(IS_EXTENSION ? "\u68C0\u67E5\u6A21\u5F0F \xB7 \u6B63\u5728\u52A0\u8F7D\u9884\u89C8\uFF0C\u70B9\u51FB\u5143\u7D20\u9009\u53D6" : "\u68C0\u67E5\u6A21\u5F0F \xB7 \u6F14\u793A\u9884\u89C8\u5DF2\u52A0\u8F7D\uFF0C\u70B9\u51FB\u5143\u7D20\u9009\u53D6");
        }
      } else if (mode === "inspect" && !loaded && !quiet) {
        notify("\u68C0\u67E5\u6A21\u5F0F \xB7 \u8BF7\u5148\u52A0\u8F7D\u9884\u89C8");
      } else if (mode === "inspect" && !quiet) {
        notify("\u68C0\u67E5\u6A21\u5F0F \xB7 \u70B9\u51FB\u624B\u673A\u5185\u5143\u7D20\u6216\u5DE6\u4FA7\u8282\u70B9");
      } else if (mode === "pending" && !quiet) {
        notify(pending.length ? "Pending \xB7 " + pending.length + " \u6761\u5F85\u56DE\u5199" : "Pending \xB7 \u961F\u5217\u4E3A\u7A7A");
      } else if (mode === "settings" && !quiet) {
        notify("\u8BBE\u7F6E \xB7 \u504F\u597D\u5373\u65F6\u751F\u6548");
      }
      if (mode === "pending") refreshPendingUi();
      if (mode === "settings") applySettings();
      renderModeList();
    }
    function loadPreview(announce) {
      refreshKey += 1;
      if (IS_EXTENSION) {
        const url = (urlInput.value || "").trim();
        if (!url) {
          notify("\u8BF7\u8F93\u5165\u9884\u89C8 URL");
          return;
        }
        VSCODE_API.postMessage({ type: "url_change", url });
        if (announce !== false) notify("\u6B63\u5728\u52A0\u8F7D\u9884\u89C8\u2026");
        return;
      }
      loaded = true;
      emptyHint.classList.add("hidden");
      frame.classList.remove("pointer-events-none");
      frame.style.pointerEvents = framePointerEvents();
      frame.removeAttribute("src");
      frame.srcdoc = buildDemoSrc();
      applyPhoneCanvasSize2(device());
      setTimeout(() => syncTouchSimulationToFrame(), 50);
      if (pipOpen) {
        layoutPipPhone();
        syncPipContent();
      }
      if (announce !== false) notify("\u9884\u89C8\u5DF2\u52A0\u8F7D\u5230\u624B\u673A\u5C4F\u5E55\u5185");
    }
    import_shared.DEVICE_PRESETS.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name + " (" + d.width + "\xD7" + d.height + ")";
      deviceSelect.appendChild(opt);
    });
    deviceSelect.addEventListener("change", () => {
      deviceId = deviceSelect.value;
      syncDeviceChrome();
      renderModeList();
      if (IS_EXTENSION) {
        VSCODE_API.postMessage({ type: "device_change", deviceId });
      } else if (loaded) {
        loadPreview(false);
      }
      const d = device();
      notify("\u8BBE\u5907\uFF1A" + d.name + " \xB7 " + d.width + "\xD7" + d.height);
    });
    document.querySelectorAll(".rail-btn").forEach((b) => {
      if (!b.getAttribute("data-title-base")) {
        b.setAttribute("data-title-base", b.getAttribute("title") || b.dataset.mode || "");
      }
      b.addEventListener("click", () => {
        const next = b.dataset.mode;
        if (next === mode && modeNavPinned) {
          setModeNavPinned(false);
          notify("\u5DF2\u6536\u8D77\u4FA7\u680F \xB7 \u518D\u70B9\u56FE\u6807\u53EF\u5C55\u5F00");
          return;
        }
        setMode(next, { forceOpen: true });
      });
      b.addEventListener("mouseenter", () => {
        if (!modeNavPinned) {
          b.classList.add("text-cyber-cyan");
        }
      });
      b.addEventListener("mouseleave", () => {
        if (!modeNavPinned && b.dataset.mode !== mode) {
          b.classList.remove("text-cyber-cyan");
        }
      });
    });
    (function setupInspectorResize() {
      const panel = document.getElementById("inspectorPanel");
      const handle = document.getElementById("inspectorResizeHandle");
      if (!panel || !handle) return;
      const KEY = "mvb-inspector-width";
      const MIN = 176;
      const MAX = () => Math.min(Math.floor(window.innerWidth * 0.4), 448);
      function applyWidth(px) {
        const w = Math.max(MIN, Math.min(MAX(), Math.round(px)));
        panel.style.width = w + "px";
        panel.style.minWidth = w + "px";
        panel.style.maxWidth = w + "px";
        return w;
      }
      try {
        const saved = parseInt(localStorage.getItem(KEY) || "", 10);
        if (saved && saved >= MIN) applyWidth(saved);
      } catch (_) {
      }
      let dragging = false;
      let startX = 0;
      let startW = 0;
      handle.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        dragging = true;
        startX = e.clientX;
        startW = panel.getBoundingClientRect().width;
        document.body.classList.add("inspector-resizing");
        try {
          handle.setPointerCapture(e.pointerId);
        } catch (_) {
        }
        e.preventDefault();
      });
      handle.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        applyWidth(startW + (startX - e.clientX));
      });
      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        document.body.classList.remove("inspector-resizing");
        try {
          handle.releasePointerCapture(e.pointerId);
        } catch (_) {
        }
        const w = panel.getBoundingClientRect().width;
        try {
          localStorage.setItem(KEY, String(Math.round(w)));
        } catch (_) {
        }
        requestAnimationFrame(() => applyPhoneCanvasSize2(device()));
      }
      handle.addEventListener("pointerup", endDrag);
      handle.addEventListener("pointercancel", endDrag);
      window.addEventListener("resize", () => {
        const cur = panel.getBoundingClientRect().width;
        if (cur > MAX()) applyWidth(MAX());
      });
    })();
    document.getElementById("btnLoad").addEventListener("click", () => loadPreview(true));
    document.getElementById("btnReload").addEventListener("click", () => {
      if (!loaded) {
        loadPreview(true);
        return;
      }
      if (IS_EXTENSION) {
        if (currentProxyUrl) frame.src = withCacheBust(currentProxyUrl);
        else if (frame.src) frame.src = frame.src;
        if (pipOpen) syncPipContent();
        notify("\u5DF2\u5237\u65B0\u624B\u673A\u5185\u9884\u89C8");
        return;
      }
      frame.srcdoc = buildDemoSrc();
      if (pipOpen) syncPipContent();
      notify("\u5DF2\u5237\u65B0\u624B\u673A\u5185\u9884\u89C8");
    });
    document.getElementById("btnRetry3d").addEventListener("click", () => {
      const baseScreen = (phoneFrame.getAttribute("src") || phoneFrame.src || "").split("?")[0];
      phoneFrame.src = baseScreen + "?t=" + Date.now();
      phoneOffline.classList.add("hidden");
    });
    phoneFrame.addEventListener("error", () => phoneOffline.classList.remove("hidden"));
    phoneFrame.addEventListener("load", () => phoneOffline.classList.add("hidden"));
    document.getElementById("btnCommit").addEventListener("click", () => {
      const sel = $id("sel").value;
      if (!sel) {
        notify("\u8BF7\u5148\u9009\u4E2D\u5143\u7D20");
        return;
      }
      const fields = {
        sel,
        text: $id("text").value,
        color: $id("color").value,
        fontSize: $id("fontSize").value,
        fontWeight: $id("fontWeight").value,
        width: $id("width").value,
        height: $id("height").value,
        display: $id("display").value,
        borderRadius: $id("borderRadius").value,
        margin: $id("margin").value,
        padding: $id("padding").value,
        src: $id("src").value
      };
      const { edit, merged } = upsertPending(fields);
      if (IS_EXTENSION) {
        const prevText = liveSelection && liveSelection.text || "";
        if (fields.text !== "" && fields.text !== prevText) {
          sendHostToFrame2("apply_text", { value: fields.text });
        }
        if (fields.color) sendHostToFrame2("apply_style", { prop: "color", value: fields.color });
        if (fields.fontSize) sendHostToFrame2("apply_style", { prop: "font-size", value: fields.fontSize });
        if (fields.fontWeight) sendHostToFrame2("apply_style", { prop: "font-weight", value: fields.fontWeight });
        if (fields.width) sendHostToFrame2("apply_style", { prop: "width", value: fields.width });
        if (fields.height) sendHostToFrame2("apply_style", { prop: "height", value: fields.height });
        if (fields.display) sendHostToFrame2("apply_style", { prop: "display", value: fields.display });
        if (fields.borderRadius) sendHostToFrame2("apply_style", { prop: "border-radius", value: fields.borderRadius });
        if (fields.margin) sendHostToFrame2("apply_style", { prop: "margin", value: fields.margin });
        if (fields.padding) sendHostToFrame2("apply_style", { prop: "padding", value: fields.padding });
        if (fields.src) sendHostToFrame2("apply_attr", { name: "src", value: fields.src });
      } else {
        postToFrame({ type: "inspect-apply", ...fields, id: edit.id });
      }
      document.getElementById("inspectHint").textContent = (merged ? "\u5DF2\u5408\u5E76 pending \xB7 " : "\u5DF2\u5199\u5165\u9884\u89C8\u5E76\u5165 pending \xB7 ") + edit.id;
      notify(merged ? "\u540C\u9009\u62E9\u5668\u5DF2\u5408\u5E76 \xB7 pending \u4ECD\u4E3A " + pending.length : "\u5DF2\u5199\u5165\u9884\u89C8 \xB7 pending +1");
    });
    document.getElementById("btnClearSel").addEventListener("click", () => clearSelection(true));
    document.getElementById("colorPicker").addEventListener("input", (e) => {
      $id("color").value = e.target.value;
    });
    document.getElementById("color").addEventListener("change", (e) => {
      syncColorPicker(e.target.value);
    });
    document.getElementById("btnApply").addEventListener("click", () => {
      void applyToCode();
    });
    pendingBadge.addEventListener("click", () => setMode("pending"));
    document.getElementById("btnCopyPrompt").addEventListener("click", async () => {
      if (!pending.length) {
        notify("\u961F\u5217\u4E3A\u7A7A\uFF0C\u65E0\u9700\u590D\u5236");
        return;
      }
      const ok = await copyText(buildApplyPrompt());
      notify(ok ? "MCP \u63D0\u793A\u5DF2\u590D\u5236" : "\u590D\u5236\u5931\u8D25");
    });
    document.getElementById("btnResetSettings").addEventListener("click", () => {
      settings = Object.assign({}, DEFAULT_SETTINGS);
      persistSettings(settings);
      applySettings();
      if (mode === "settings") renderModeList();
      notify("\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E");
    });
    const btnRotate = document.getElementById("btnRotate");
    if (btnRotate) {
      btnRotate.addEventListener("click", () => {
        const newLandscape = toggleLandscape();
        applyPhoneCanvasSize2(device());
        btnRotate.classList.toggle("text-cyber-cyan", newLandscape);
        btnRotate.classList.toggle("border-cyber-cyan/50", newLandscape);
        if (pipOpen) pipMgr.handleDeviceChange();
        if (IS_EXTENSION && loaded) {
          VSCODE_API.postMessage({ type: "orientation_change", landscape: newLandscape });
        } else if (loaded) {
          loadPreview(false);
        }
        notify(newLandscape ? "\u5DF2\u5207\u6362\u4E3A\u6A2A\u5C4F \xB7 \u89C6\u53E3\u5DF2\u6309\u957F\u8FB9\u91CD\u8F7D" : "\u5DF2\u5207\u6362\u4E3A\u7AD6\u5C4F \xB7 \u89C6\u53E3\u5DF2\u91CD\u8F7D");
      });
    }
    document.getElementById("btnPip").addEventListener("click", () => {
      if (pipOpen && !pipDetachMode) closePip();
      else openPip();
    });
    const btnInteractive = document.getElementById("btnInteractive");
    if (btnInteractive) {
      btnInteractive.classList.toggle("text-cyber-cyan", settings.interactiveMode);
      btnInteractive.classList.toggle("border-cyber-cyan/50", settings.interactiveMode);
      setInteractiveMode(settings.interactiveMode);
      btnInteractive.addEventListener("click", () => {
        const next = !settings.interactiveMode;
        settings.interactiveMode = next;
        persistSettings(settings);
        setInteractiveMode(next);
        applyPhoneCanvasSize2(device());
        if (frame) {
          frame.style.pointerEvents = next || mode === "inspect" ? "auto" : "none";
          frame.classList.toggle("pointer-events-none", !(next || mode === "inspect"));
        }
        btnInteractive.classList.toggle("text-cyber-cyan", next);
        btnInteractive.classList.toggle("border-cyber-cyan/50", next);
        notify(next ? "\u53EF\u4EA4\u4E92\u6A21\u5F0F \xB7 \u5F00\uFF08\u6EDA\u8F6E\u6EDA\u52A8\u9875\u9762\uFF0C\u8FB9\u7F18\u53EF\u7F29\u653E\u753B\u5E03\uFF09" : "\u53EF\u4EA4\u4E92\u6A21\u5F0F \xB7 \u5173");
      });
    }
    const btnDpr = document.getElementById("btnDpr");
    if (btnDpr) {
      btnDpr.classList.toggle("text-cyber-cyan", settings.dprSimulation);
      btnDpr.classList.toggle("border-cyber-cyan/50", settings.dprSimulation);
      setDprSimulation(settings.dprSimulation);
      btnDpr.addEventListener("click", () => {
        const next = !settings.dprSimulation;
        settings.dprSimulation = next;
        persistSettings(settings);
        setDprSimulation(next);
        applyPhoneCanvasSize2(device());
        btnDpr.classList.toggle("text-cyber-cyan", next);
        btnDpr.classList.toggle("border-cyber-cyan/50", next);
        notify(next ? "DPR \u9AD8\u5206\u8FA8\u7387 \xB7 \u5F00" : "DPR \u9AD8\u5206\u8FA8\u7387 \xB7 \u5173");
      });
    }
    const btnTouch = document.getElementById("btnTouch");
    if (btnTouch) {
      btnTouch.classList.toggle("text-cyber-cyan", settings.touchSimulation);
      btnTouch.classList.toggle("border-cyber-cyan/50", settings.touchSimulation);
      btnTouch.addEventListener("click", () => {
        const next = !settings.touchSimulation;
        settings.touchSimulation = next;
        if (next && !settings.interactiveMode) {
          settings.interactiveMode = true;
          setInteractiveMode(true);
          const btnInteractive2 = document.getElementById("btnInteractive");
          if (btnInteractive2) {
            btnInteractive2.classList.toggle("text-cyber-cyan", true);
            btnInteractive2.classList.toggle("border-cyber-cyan/50", true);
          }
        }
        persistSettings(settings);
        btnTouch.classList.toggle("text-cyber-cyan", next);
        btnTouch.classList.toggle("border-cyber-cyan/50", next);
        syncTouchSimulationToFrame();
        notify(next ? "\u89E6\u63A7\u6A21\u62DF \xB7 \u5F00\uFF08\u5DF2\u8054\u52A8\u53EF\u4EA4\u4E92\uFF09" : "\u89E6\u63A7\u6A21\u62DF \xB7 \u5173");
      });
    }
    const btnNotch = document.getElementById("btnNotch");
    if (btnNotch) {
      btnNotch.classList.toggle("text-cyber-cyan", settings.showNotch);
      btnNotch.classList.toggle("border-cyber-cyan/50", settings.showNotch);
      setShowNotch(settings.showNotch);
      btnNotch.addEventListener("click", () => {
        const next = !settings.showNotch;
        settings.showNotch = next;
        persistSettings(settings);
        setShowNotch(next);
        applyPhoneCanvasSize2(device());
        btnNotch.classList.toggle("text-cyber-cyan", next);
        btnNotch.classList.toggle("border-cyber-cyan/50", next);
        notify(next ? "\u7075\u52A8\u5C9B \xB7 \u663E\u793A" : "\u7075\u52A8\u5C9B \xB7 \u9690\u85CF");
      });
    }
    function supportsDocPip() {
      return pipMgr.supportsDocPip();
    }
    function isIdeEmbeddedBrowser() {
      return pipMgr.isIdeEmbeddedBrowser();
    }
    function canDetachExternally() {
      return pipMgr.canDetachExternally();
    }
    function hostPipWindow() {
      return pipMgr.hostPipWindow();
    }
    function pipRoots() {
      return pipMgr.pipRoots();
    }
    function pipEl(id) {
      return pipMgr.pipEl(id);
    }
    function updatePipToolsUi() {
      pipMgr.updatePipToolsUi();
    }
    function pipPhoneGeometry() {
      return pipMgr.pipPhoneGeometry();
    }
    function pipBodyBox(win) {
      return pipMgr.pipBodyBox(win);
    }
    function mainStageDisplayScale() {
      return pipMgr.mainStageDisplayScale();
    }
    function pipFitScaleForWin(win, g) {
      return pipMgr.pipFitScaleForWin(win, g);
    }
    function pipResolveDisplayScale(win, g, refit) {
      return pipMgr.pipResolveDisplayScale(win, g, refit);
    }
    function measurePipShellSize() {
      return pipMgr.measurePipShellSize();
    }
    function layoutPipPhoneIn(win, opts) {
      pipMgr.layoutPipPhoneIn(win, opts);
    }
    function layoutPipPhone(opts) {
      pipMgr.layoutPipPhone(opts);
    }
    function syncPipContent() {
      pipMgr.syncPipContent();
    }
    function expandPipWindowForTools(opening) {
      pipMgr.expandPipWindowForTools(opening);
    }
    function bindPipDocClicks(doc) {
      pipMgr.bindPipDocClicks(doc);
    }
    function handlePipButtonClick(e) {
      pipMgr.handlePipButtonClick(e);
    }
    function parkHostPip(on) {
      pipMgr.parkHostPip(on);
    }
    function estimateViewportScreenOrigin() {
      return pipMgr.estimateViewportScreenOrigin();
    }
    function captureHostPipScreenBox() {
      return pipMgr.captureHostPipScreenBox();
    }
    function placePipWindowVisible(win, opts) {
      pipMgr.placePipWindowVisible(win, opts);
    }
    function openPip() {
      pipMgr.openPip();
    }
    function closePip() {
      pipMgr.closePip();
    }
    function detachPipPin() {
      return pipMgr.detachPipPin();
    }
    function attachPipUnpin() {
      return pipMgr.attachPipUnpin();
    }
    function observePipWindowResize(win) {
      pipMgr.observePipWindowResize(win);
    }
    function setPipToolsOpen(on) {
      pipMgr.setPipToolsOpen(on);
    }
    pipMgr.setupPipDrag();
    pipMgr.setupPipResize();
    bindPipDocClicks(document);
    deviceSelect.addEventListener("change", () => {
      pipMgr.handleDeviceChange();
    });
    window.addEventListener("resize", () => {
      pipMgr.handleWindowResize();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && pipOpen) closePip();
    });
    window.addEventListener("message", (e) => {
      const msg = e.data;
      if (!msg) return;
      if (msg.source === "mvb-picker") {
        if (msg.type === "selection_change" && msg.payload) {
          liveSelection = msg.payload;
          applySelection({
            sel: msg.payload.selector || "",
            text: msg.payload.text || "",
            color: msg.payload.styles && msg.payload.styles.color || "",
            fontSize: msg.payload.styles && msg.payload.styles.fontSize || "",
            fontWeight: msg.payload.styles && msg.payload.styles.fontWeight || "",
            width: msg.payload.styles && msg.payload.styles.width || "",
            height: msg.payload.styles && msg.payload.styles.height || "",
            display: msg.payload.styles && msg.payload.styles.display || "",
            borderRadius: msg.payload.styles && msg.payload.styles.borderRadius || "",
            margin: msg.payload.styles && msg.payload.styles.margin || "",
            padding: msg.payload.styles && msg.payload.styles.padding || "",
            src: msg.payload.src || ""
          }, false);
          if (IS_EXTENSION) {
            VSCODE_API.postMessage({ type: "selection_change", payload: msg.payload });
          }
          notify("\u5DF2\u9009\u4E2D " + (msg.payload.selector || ""));
          return;
        }
        if (msg.type === "text_change" || msg.type === "prop_change" || msg.type === "image_replace") {
          if (IS_EXTENSION) {
            VSCODE_API.postMessage({ type: msg.type, payload: msg.payload });
          }
          return;
        }
        if (msg.type === "dom_snippet") {
          if (IS_EXTENSION) {
            VSCODE_API.postMessage({ type: "dom_snippet", payload: msg.payload });
          }
          return;
        }
        if (msg.type === "picker_ready") {
          const mcp = document.getElementById("mcpPill");
          if (mcp) {
            mcp.textContent = "Picker ON";
            mcp.classList.add("border-emerald-400/50");
          }
          syncTouchSimulationToFrame();
        }
        if (msg.type === "page_height" && msg.payload) {
          const h = Number(msg.payload.height) || 0;
          if (pageHeightTimer) clearTimeout(pageHeightTimer);
          pageHeightTimer = setTimeout(() => applyFullPageScale2(h), 100);
        }
        return;
      }
      if (msg.type === "demo-select") {
        applySelection(msg, false);
        notify("\u5DF2\u9009\u4E2D " + msg.sel);
        return;
      }
      if (msg.type === "inspect-applied") {
        document.getElementById("inspectHint").textContent = "\u9884\u89C8\u5DF2\u66F4\u65B0 \xB7 " + (msg.sel || "");
        return;
      }
      if (!IS_EXTENSION) return;
      if (msg.type === "pip_detach_done") {
        pipDetachMode = "host";
        parkHostPip(true);
        updatePipToolsUi();
        notify("\u5DF2\u7F6E\u9876\u5230\u72EC\u7ACB\u7A97\u53E3 \xB7 \u53EF\u62D6\u79BB\u4E3B\u7F16\u8F91\u533A\uFF08\u4E0D\u6253\u5F00\u7CFB\u7EDF\u6D4F\u89C8\u5668\uFF09");
        return;
      }
      if (msg.type === "pip_attach_done") {
        pipDetachMode = null;
        pipExternalWin = null;
        parkHostPip(false);
        const host = hostPipWindow();
        if (pipOpen && host) {
          host.classList.remove("pip-host-parked");
          layoutPipPhoneIn(host);
        }
        updatePipToolsUi();
        notify("\u5DF2\u6536\u56DE\u72EC\u7ACB\u60AC\u6D6E\u7A97");
        return;
      }
      if (msg.type === "configure") {
        applyConfigure(msg);
        return;
      }
      if (msg.type === "set_device") {
        deviceId = String(msg.deviceId || deviceId);
        syncDeviceChrome();
        return;
      }
      if (msg.type === "reload") {
        if (currentProxyUrl) frame.src = withCacheBust(currentProxyUrl);
        else if (frame.src) frame.src = frame.src;
        if (pipOpen) syncPipContent();
        return;
      }
      if (msg.type === "apply_progress") {
        notify(String(msg.message || msg.phase || "\u5E94\u7528\u4E2D\u2026"));
        return;
      }
      if (msg.type === "pending_sync") {
        const hostEdits = Array.isArray(msg.edits) ? msg.edits : [];
        pending = hostEdits.map((he) => {
          const ops = Array.isArray(he.ops) ? he.ops : [];
          const textOp = [...ops].reverse().find((o) => o && o.type === "text");
          const colorOp = [...ops].reverse().find((o) => o && o.type === "style" && o.prop === "color");
          const fontOp = [...ops].reverse().find((o) => o && o.type === "style" && (o.prop === "font-size" || o.prop === "fontSize"));
          const marginOp = [...ops].reverse().find((o) => o && o.type === "style" && o.prop === "margin");
          const paddingOp = [...ops].reverse().find((o) => o && o.type === "style" && o.prop === "padding");
          const srcOp = [...ops].reverse().find((o) => o && o.type === "attr" && o.name === "src");
          return {
            id: he.id,
            nodeId: he.nodeId || he.selector,
            sel: he.selector || "",
            text: textOp ? textOp.value : "",
            color: colorOp ? colorOp.value : "",
            fontSize: fontOp ? fontOp.value : "",
            margin: marginOp ? marginOp.value : "",
            padding: paddingOp ? paddingOp.value : "",
            src: srcOp ? srcOp.value : "",
            ops,
            createdAt: he.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            sourceHint: he.sourceHint || { component: "demo" }
          };
        });
        if (selectedPendingId && !pending.some((p) => p.id === selectedPendingId)) {
          selectedPendingId = "";
        }
        refreshPendingUi();
        return;
      }
      if (msg.type === "highlight") {
        sendHostToFrame2("highlight", { selector: msg.selector });
        return;
      }
      if (msg.type === "dom_snippet") {
        sendHostToFrame2("dom_snippet", { selector: msg.selector });
      }
    });
    syncDeviceChrome();
    applySettings();
    setMode("preview");
    updatePendingBadge();
    $id("btnCommit").disabled = true;
    loaded = false;
    window.addEventListener("resize", () => applyPhoneCanvasSize2(device()));
    requestAnimationFrame(() => {
      applyPhoneCanvasSize2(device());
      document.body.classList.remove("js-pre-init");
    });
    setTimeout(() => applyPhoneCanvasSize2(device()), 80);
    setTimeout(() => applyPhoneCanvasSize2(device()), 400);
    if (IS_EXTENSION) {
      const mcp = document.getElementById("mcpPill");
      if (mcp) mcp.textContent = "MCP \u2026";
      VSCODE_API.postMessage({ type: "ready" });
    }
    (function setupPhoneZoom() {
      const stage = document.getElementById("phoneStage");
      const hint = document.getElementById("phoneScaleHint");
      const MIN = 0.4;
      const MAX = 2.4;
      function setScale(next) {
        setUserPhoneZoom(Math.round(Math.min(MAX, Math.max(MIN, next)) * 100) / 100);
        applyPhoneCanvasSize2(device());
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
      document.addEventListener("wheel", (e) => {
        const screenEl = document.getElementById("screen");
        let overScreen = false;
        if (screenEl) {
          const sr = screenEl.getBoundingClientRect();
          overScreen = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;
        }
        if (overScreen && (settings.interactiveMode || mode === "inspect")) {
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
          }
          return;
        }
        if (!settings.wheelZoom) return;
        if (!isOverStage(e.clientX, e.clientY)) return;
        if (overScreen) return;
        e.preventDefault();
        e.stopPropagation();
        zoomByDelta(e.deltaY || e.deltaX);
      }, { passive: false, capture: true });
      document.getElementById("btnZoomIn").addEventListener("click", () => setScale(userPhoneZoom + 0.1));
      document.getElementById("btnZoomOut").addEventListener("click", () => setScale(userPhoneZoom - 0.1));
      document.getElementById("btnZoomReset").addEventListener("click", () => {
        setScale(1);
        notify("\u5DF2\u91CD\u7F6E\u4E3A\u821E\u53F0\u9002\u914D");
      });
      stage.addEventListener("dblclick", (e) => {
        if (!settings.dblclickReset) return;
        if (e.target.closest("button")) return;
        setScale(1);
        notify("\u5DF2\u91CD\u7F6E\u4E3A\u821E\u53F0\u9002\u914D");
      });
      window.addEventListener("message", (e) => {
        const msg = e.data;
        if (msg && msg.type === "phone-zoom") {
          if (!settings.wheelZoom || settings.interactiveMode || mode === "inspect") return;
          zoomByDelta(msg.deltaY || 0);
        }
      });
      if (hint) hint.textContent = "\u2014";
    })();
  }

  // src/webview/main.ts
  boot();
})();
//# sourceMappingURL=app.js.map
