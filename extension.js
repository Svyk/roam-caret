/* Roam Caret v0.6.0 | MIT | generated; edit src/ */

// src/lifecycle.js
function isPromiseLike(value) {
  return value != null && typeof value.then === "function";
}
async function callSafely(disposer) {
  const result = disposer();
  if (isPromiseLike(result)) await result;
}
function createLifecycle() {
  let disposed = false;
  const disposers = [];
  const add = (disposer) => {
    if (typeof disposer !== "function") throw new TypeError("A disposer must be a function");
    if (disposed) {
      void callSafely(disposer).catch((error) => console.error("[roam-caret] Late cleanup failed", error));
      return disposer;
    }
    disposers.push(disposer);
    return disposer;
  };
  return {
    get disposed() {
      return disposed;
    },
    add,
    async command(commandApi, config) {
      if (!commandApi?.addCommand || !commandApi?.removeCommand) {
        throw new TypeError("A command API with addCommand/removeCommand is required");
      }
      await commandApi.addCommand(config);
      add(() => commandApi.removeCommand({ label: config.label }));
    },
    event(target, type, listener, options) {
      target.addEventListener(type, listener, options);
      add(() => target.removeEventListener(type, listener, options));
      return listener;
    },
    interval(callback, delay, ...args) {
      const id = globalThis.setInterval(callback, delay, ...args);
      add(() => globalThis.clearInterval(id));
      return id;
    },
    timeout(callback, delay, ...args) {
      const id = globalThis.setTimeout(callback, delay, ...args);
      add(() => globalThis.clearTimeout(id));
      return id;
    },
    observer(observer, target, options) {
      observer.observe(target, options);
      add(() => observer.disconnect());
      return observer;
    },
    node(node, parent = globalThis.document?.body) {
      if (!parent) throw new Error("A parent node is required outside the browser");
      parent.append(node);
      add(() => node.remove());
      return node;
    },
    pullWatch(dataApi, pattern, entity, callback) {
      if (!dataApi?.addPullWatch || !dataApi?.removePullWatch) {
        throw new TypeError("A Roam data API with addPullWatch/removePullWatch is required");
      }
      dataApi.addPullWatch(pattern, entity, callback);
      add(() => dataApi.removePullWatch(pattern, entity, callback));
      return callback;
    },
    async settingsPanel(extensionAPI, config) {
      await extensionAPI.settings.panel.create(config);
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      const errors = [];
      for (const disposer of disposers.splice(0).reverse()) {
        try {
          await callSafely(disposer);
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length) throw new AggregateError(errors, "One or more extension cleanups failed");
    }
  };
}

// src/open-settings.js
var SETTINGS_TAB_SELECTOR = '[role="tab"]';
var DEPOT_BUTTON_SELECTOR = ".rm-left-sidebar__roam-depot";
function normalizedText(node) {
  return String(node?.textContent || node?.innerText || "").replace(/\s+/g, " ").trim();
}
function findRoamCaretSettingsTab(documentLike) {
  const tabs = Array.from(documentLike?.querySelectorAll?.(SETTINGS_TAB_SELECTOR) || []);
  const exactDev = tabs.find((tab) => normalizedText(tab) === "Roam Caret (dev)");
  if (exactDev) return exactDev;
  const exactRelease = tabs.find((tab) => normalizedText(tab) === "Roam Caret");
  if (exactRelease) return exactRelease;
  return tabs.find((tab) => /^Roam Caret(?:\s|\(|$)/i.test(normalizedText(tab))) || null;
}
function selectRoamCaretSettingsTab(documentLike) {
  const tab = findRoamCaretSettingsTab(documentLike);
  if (!tab || typeof tab.click !== "function") return false;
  tab.click();
  return true;
}
var defaultWait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
async function openRoamCaretSettings({
  documentLike = typeof document !== "undefined" ? document : null,
  roamAlphaAPI = typeof window !== "undefined" ? window.roamAlphaAPI : null,
  wait = defaultWait,
  attempts = 24,
  intervalMs = 50
} = {}) {
  if (!documentLike) return false;
  if (selectRoamCaretSettingsTab(documentLike)) return true;
  let depotButton = documentLike.querySelector?.(DEPOT_BUTTON_SELECTOR) || null;
  if (!depotButton) {
    try {
      await roamAlphaAPI?.ui?.leftSidebar?.open?.();
    } catch {
    }
    depotButton = documentLike.querySelector?.(DEPOT_BUTTON_SELECTOR) || null;
  }
  if (!depotButton || typeof depotButton.click !== "function") return false;
  depotButton.click();
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (selectRoamCaretSettingsTab(documentLike)) return true;
    await wait(intervalMs);
  }
  return false;
}

// src/cursor-smith.js
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var TW_SHADES = Object.freeze([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
function mirrorShadeIdx(idx) {
  const n = TW_SHADES.length;
  const i = Math.max(0, Math.min(n - 1, Number(idx) || 0));
  return n - 1 - i;
}
__name(mirrorShadeIdx, "mirrorShadeIdx");
var TAILWIND = Object.freeze({
  slate: ["#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"],
  gray: ["#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937", "#111827", "#030712"],
  zinc: ["#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"],
  neutral: ["#fafafa", "#f5f5f5", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626", "#171717", "#0a0a0a"],
  stone: ["#fafaf9", "#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e", "#44403c", "#292524", "#1c1917", "#0c0a09"],
  red: ["#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"],
  orange: ["#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12", "#431407"],
  amber: ["#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f", "#451a03"],
  yellow: ["#fefce8", "#fef9c3", "#fef08a", "#fde047", "#facc15", "#eab308", "#ca8a04", "#a16207", "#854d0e", "#713f12", "#422006"],
  lime: ["#f7fee7", "#ecfccb", "#d9f99d", "#bef264", "#a3e635", "#84cc16", "#65a30d", "#4d7c0f", "#3f6212", "#365314", "#1a2e05"],
  green: ["#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"],
  emerald: ["#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46", "#064e3b", "#022c22"],
  teal: ["#f0fdfa", "#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a", "#042f2e"],
  cyan: ["#ecfeff", "#cffafe", "#a5f3fc", "#67e8f9", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63", "#083344"],
  sky: ["#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e", "#082f49"],
  blue: ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"],
  indigo: ["#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81", "#1e1b4b"],
  violet: ["#f5f3ff", "#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#2e1065"],
  purple: ["#faf5ff", "#f3e8ff", "#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#3b0764"],
  fuchsia: ["#fdf4ff", "#fae8ff", "#f5d0fe", "#f0abfc", "#e879f9", "#d946ef", "#c026d3", "#a21caf", "#86198f", "#701a75", "#4a044e"],
  pink: ["#fdf2f8", "#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899", "#db2777", "#be185d", "#9d174d", "#831843", "#500724"],
  rose: ["#fff1f2", "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337", "#4c0519"]
});
var TW_FAMILIES = Object.freeze(Object.keys(TAILWIND));
function isHex(s) {
  return typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s);
}
__name(isHex, "isHex");
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
__name(hexToRgb, "hexToRgb");
function exactTailwind(hex) {
  if (!isHex(hex)) return null;
  const needle = hex.toLowerCase();
  for (const family of TW_FAMILIES) {
    const i = TAILWIND[family].indexOf(needle);
    if (i >= 0) return { family, shadeIdx: i };
  }
  return null;
}
__name(exactTailwind, "exactTailwind");
function nearestTailwind(hex) {
  if (!isHex(hex)) return null;
  const [r, g, b] = hexToRgb(hex);
  let best = null;
  let bestD = Infinity;
  for (const family of TW_FAMILIES) {
    const shades = TAILWIND[family];
    for (let i = 0; i < shades.length; i += 1) {
      const [cr, cg, cb] = hexToRgb(shades[i]);
      const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { family, shadeIdx: i, hex: shades[i] };
      }
    }
  }
  return best;
}
__name(nearestTailwind, "nearestTailwind");
var DEFAULTS = Object.freeze({
  // --- structural -------------------------------------------------------
  enabled: true,
  cursorStyle: "Box",
  // Line | Box | Underline
  // --- flat color, one per appearance ------------------------------------
  colorDark: "#39ff14",
  colorLight: "#333333",
  // --- gradient ramp (2-4 stops), one ramp per appearance -----------------
  gradientEnabled: false,
  gradientCount: 2,
  gradientDark1: "#39ff14",
  gradientDark2: "#00d4ff",
  gradientDark3: "#b14aff",
  gradientDark4: "#ff2e88",
  gradientLight1: "#1f8a3b",
  gradientLight2: "#0077b6",
  gradientLight3: "#7028c8",
  gradientLight4: "#c2185b",
  // --- appearance --------------------------------------------------------
  caretWidthPx: 2,
  cursorOpacity: 1,
  glow: true,
  showChar: true,
  lineSerifs: false,
  underlineWidthPx: 0,
  // 0 = auto (scale with line height)
  boxHollow: false,
  boxHollowWidth: 2,
  // --- blinking ----------------------------------------------------------
  blinkingEnabled: true,
  blinkSpeed: 1.2,
  blinkOnOffBalance: 0.5,
  blinkDelayMs: 0,
  blinkBreathing: false,
  blinkBreathDepth: 0.2,
  hideNativeCaret: true,
  hideOnWindowBlur: true,
  // --- smooth movement ---------------------------------------------------
  smoothEnabled: false,
  smoothStopBlinking: true,
  smoothness: 0.15,
  catchUpSpeed: 0.55,
  maxCatchUpSpeed: 0.85,
  smoothAdaptive: true,
  snapOnNewline: true,
  moveDelayMs: 0,
  // --- motion smear ------------------------------------------------------
  smear: false,
  smearStiffness: 0.6,
  smearTrailingStiffness: 0.4,
  smearDamping: 0.8,
  smearTaper: false,
  smearTaperAmount: 0.7,
  // --- after effects -----------------------------------------------------
  popLetters: false,
  popRainbow: false,
  flameTrail: false,
  backspaceDisintegrate: false,
  thunderstrike: false,
  thunderstrikeSize: 2,
  thunderstrikeStrength: 0.5,
  stardustEnabled: false,
  stardustAlwaysOn: false,
  stardustDelayMs: 2e3,
  stardustRate: 1,
  stardustOrbit: false,
  stardustOrbitRadius: 22,
  speedDemon: false,
  speedDemonSparks: true,
  speedDemonSensitivity: 1,
  speedDemonSparkQuantity: 1,
  speedDemonSparkTrail: 0,
  energyEffect: false,
  energySpeed: 1,
  energyAurora: false,
  crtEffect: false,
  trailLength: 10,
  trailFadeMs: 450,
  // --- torch spotlight ---------------------------------------------------
  torchEffect: false,
  overlayFollowMode: "caret",
  // caret | mouse | auto
  overlayRadius: 250,
  overlayDarkness: 0.7,
  overlayIntensity: 0.1,
  overlayColor: "#ff963c",
  overlayFlicker: false,
  overlayBlinkSync: false,
  overlayBlinkDepth: 0.25,
  overlaySpeed: 0.22,
  // --- idle behaviour ----------------------------------------------------
  idleFadeEnabled: false,
  idleFadeDelayMs: 4e3,
  idleFadeTo: 0.25,
  idleDrift: false,
  // --- context-aware colour ----------------------------------------------
  selectionColorEnabled: false,
  selectionColorDark: "#ffd166",
  selectionColorLight: "#b06f00",
  rowTypeTint: false,
  rowTypeTintAmount: 45,
  // --- ghost cursor ------------------------------------------------------
  ghostEnabled: false,
  ghostOpacity: 0.3,
  ghostLag: 0.08,
  // --- combo -------------------------------------------------------------
  comboEnabled: false,
  comboThreshold: 25,
  comboGlow: true,
  comboShower: true,
  // --- shake on delete ---------------------------------------------------
  shakeEnabled: false,
  shakeStrength: 3,
  shakeDurationMs: 180,
  // --- typewriter sound --------------------------------------------------
  soundEnabled: false,
  soundVolume: 0.15,
  soundPitch: 1,
  soundVariation: 0.25,
  // --- preset bookkeeping ------------------------------------------------
  activePreset: "",
  schemaVersion: 2
});
var SCHEMA_VERSION = 2;
var CANVAS_EFFECT_KEYS = Object.freeze([
  "smear",
  "popLetters",
  "flameTrail",
  "stardustEnabled",
  "energyEffect",
  "torchEffect",
  "smoothEnabled",
  "crtEffect",
  "ghostEnabled",
  "shakeEnabled",
  "speedDemon",
  "comboEnabled",
  "backspaceDisintegrate",
  "thunderstrike",
  "gradientEnabled",
  "lineSerifs",
  "blinkBreathing",
  "idleFadeEnabled",
  "selectionColorEnabled",
  "rowTypeTint",
  "soundEnabled"
]);
function needsCanvas(settings) {
  if (!settings) return false;
  for (const key of CANVAS_EFFECT_KEYS) {
    if (settings[key] !== true) continue;
    if (key === "lineSerifs" && settings.cursorStyle !== "Line") continue;
    if (key === "blinkBreathing" && settings.blinkingEnabled === false) continue;
    return true;
  }
  return settings.moveDelayMs > 0;
}
__name(needsCanvas, "needsCanvas");
var STRUCTURAL = /* @__PURE__ */ new Set(["enabled", "activePreset", "hideNativeCaret", "hideOnWindowBlur", "schemaVersion"]);
var LOOK_KEYS = Object.freeze(Object.keys(DEFAULTS).filter((k) => !STRUCTURAL.has(k)));
var NUM_SPECS = {
  gradientCount: { min: 2, max: 4, step: 1 },
  caretWidthPx: { min: 1, max: 12, step: 0.5 },
  cursorOpacity: { min: 0.1, max: 1, step: 0.01 },
  underlineWidthPx: { min: 0, max: 12, step: 0.5 },
  boxHollowWidth: { min: 1, max: 8, step: 0.5 },
  blinkSpeed: { min: 0.1, max: 5, step: 0.1 },
  blinkOnOffBalance: { min: 0.1, max: 0.9, step: 0.01 },
  blinkDelayMs: { min: 0, max: 5e3, step: 50 },
  blinkBreathDepth: { min: 0.05, max: 0.5, step: 0.01 },
  smoothness: { min: 0.05, max: 0.3, step: 0.01 },
  catchUpSpeed: { min: 0.3, max: 0.8, step: 0.01 },
  maxCatchUpSpeed: { min: 0.5, max: 1, step: 0.01 },
  moveDelayMs: { min: 0, max: 400, step: 10 },
  smearStiffness: { min: 0.05, max: 1, step: 0.01 },
  smearTrailingStiffness: { min: 0.05, max: 1, step: 0.01 },
  smearDamping: { min: 0.1, max: 1, step: 0.01 },
  smearTaperAmount: { min: 0, max: 1, step: 0.01 },
  thunderstrikeSize: { min: 1, max: 8, step: 1 },
  thunderstrikeStrength: { min: 0.1, max: 1, step: 0.01 },
  stardustDelayMs: { min: 0, max: 1e4, step: 100 },
  stardustRate: { min: 0.2, max: 3, step: 0.1 },
  stardustOrbitRadius: { min: 6, max: 80, step: 1 },
  speedDemonSensitivity: { min: 0.5, max: 2, step: 0.1 },
  speedDemonSparkQuantity: { min: 0, max: 3, step: 0.1 },
  speedDemonSparkTrail: { min: 0, max: 30, step: 1 },
  energySpeed: { min: 0.2, max: 3, step: 0.1 },
  trailLength: { min: 1, max: 40, step: 1 },
  trailFadeMs: { min: 80, max: 2e3, step: 10 },
  overlayRadius: { min: 60, max: 900, step: 10 },
  overlayDarkness: { min: 0, max: 1, step: 0.01 },
  overlayIntensity: { min: 0, max: 1, step: 0.01 },
  overlayBlinkDepth: { min: 0.05, max: 0.6, step: 0.01 },
  overlaySpeed: { min: 0.02, max: 1, step: 0.01 },
  idleFadeDelayMs: { min: 500, max: 3e4, step: 250 },
  idleFadeTo: { min: 0, max: 0.9, step: 0.01 },
  rowTypeTintAmount: { min: 0, max: 180, step: 5 },
  ghostOpacity: { min: 0.05, max: 0.8, step: 0.01 },
  ghostLag: { min: 0.01, max: 0.3, step: 0.01 },
  comboThreshold: { min: 5, max: 100, step: 1 },
  shakeStrength: { min: 0.5, max: 12, step: 0.5 },
  shakeDurationMs: { min: 60, max: 600, step: 10 },
  soundVolume: { min: 0.01, max: 1, step: 0.01 },
  soundPitch: { min: 0.4, max: 2.5, step: 0.05 },
  soundVariation: { min: 0, max: 1, step: 0.01 }
};
var ENUMS = {
  cursorStyle: ["Line", "Box", "Underline", "Beam"],
  overlayFollowMode: ["caret", "mouse", "auto"]
};
var HEX_KEYS = /* @__PURE__ */ new Set([
  "colorDark",
  "colorLight",
  "overlayColor",
  "selectionColorDark",
  "selectionColorLight",
  "gradientDark1",
  "gradientDark2",
  "gradientDark3",
  "gradientDark4",
  "gradientLight1",
  "gradientLight2",
  "gradientLight3",
  "gradientLight4"
]);
var MAX_PRESETS = 60;
var MAX_NAME = 48;
var MAX_CODE = 2e4;
function migrateLegacyKeys(src) {
  if (!src || typeof src !== "object" || Array.isArray(src)) return {};
  const o = (
    /** @type {Record<string, any>} */
    Object.assign({}, src)
  );
  for (let i = 1; i <= 4; i++) {
    const oldKey = "gradientColor" + i;
    const newKey = "gradientDark" + i;
    if (oldKey in o) {
      if (o[newKey] === void 0) o[newKey] = o[oldKey];
      delete o[oldKey];
    }
  }
  if ("idleStardust" in o) {
    if (o.stardustEnabled === void 0) o.stardustEnabled = o.idleStardust;
    delete o.idleStardust;
  }
  return o;
}
__name(migrateLegacyKeys, "migrateLegacyKeys");
function normalizeHex(v, fallback) {
  if (typeof v !== "string") return fallback;
  let h2 = v.trim().toLowerCase();
  if (h2[0] !== "#") h2 = "#" + h2;
  if (/^#[0-9a-f]{3}$/.test(h2)) {
    return "#" + h2[1] + h2[1] + h2[2] + h2[2] + h2[3] + h2[3];
  }
  return /^#[0-9a-f]{6}$/.test(h2) ? h2 : fallback;
}
__name(normalizeHex, "normalizeHex");
function coerce(key, v) {
  const def = (
    /** @type {any} */
    DEFAULTS[key]
  );
  if (typeof def === "boolean") return v === void 0 ? def : v === true;
  if (typeof def === "number") {
    const n = typeof v === "number" ? v : Number.parseFloat(v);
    if (!Number.isFinite(n)) return def;
    const spec = NUM_SPECS[key];
    if (!spec) return Number(n.toFixed(4));
    const stepped = Math.round(n / spec.step) * spec.step;
    return Number(Math.min(spec.max, Math.max(spec.min, stepped)).toFixed(4));
  }
  if (typeof def === "string") {
    if (ENUMS[key]) return ENUMS[key].includes(v) ? v : def;
    if (HEX_KEYS.has(key)) return normalizeHex(v, def);
    return typeof v === "string" ? v.trim().slice(0, MAX_NAME) : def;
  }
  return def;
}
__name(coerce, "coerce");
function normalizePresetSnapshot(raw) {
  const s = migrateLegacyKeys(raw);
  const out = {};
  for (const k of LOOK_KEYS) out[k] = coerce(k, s[k]);
  return out;
}
__name(normalizePresetSnapshot, "normalizePresetSnapshot");
function normalizePresets(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const byClean = /* @__PURE__ */ new Map();
  for (const k of Object.keys(raw)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    const name = String(k).trim().slice(0, MAX_NAME);
    if (!name) continue;
    if (!byClean.has(name)) byClean.set(name, raw[k]);
  }
  const names = Array.from(byClean.keys()).sort().slice(0, MAX_PRESETS);
  for (const name of names) out[name] = normalizePresetSnapshot(byClean.get(name));
  return out;
}
__name(normalizePresets, "normalizePresets");
function normalizeSettings(raw) {
  const s = migrateLegacyKeys(raw);
  const migrating = !Object.prototype.hasOwnProperty.call(s, "schemaVersion");
  const out = {};
  for (const k of Object.keys(DEFAULTS)) out[k] = coerce(k, s[k]);
  out.presets = normalizePresets(s.presets);
  if (migrating) {
    out.smear = false;
    out.popLetters = false;
    out.flameTrail = false;
    const named = BUILTIN_PRESETS[out.activePreset];
    if (named && needsCanvas({ ...DEFAULTS, ...named })) out.activePreset = "";
    out.schemaVersion = SCHEMA_VERSION;
  }
  const known = Object.prototype.hasOwnProperty.call(out.presets, out.activePreset) || Object.prototype.hasOwnProperty.call(BUILTIN_PRESETS, out.activePreset);
  if (!known) out.activePreset = "";
  return out;
}
__name(normalizeSettings, "normalizeSettings");
function presetToCode(name, snap) {
  const payload = { __name: name };
  for (const k of LOOK_KEYS) {
    if (snap && Object.prototype.hasOwnProperty.call(snap, k)) payload[k] = snap[k];
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(presetToCode, "presetToCode");
function codeToPreset(code) {
  try {
    if (typeof code !== "string") return null;
    const trimmed = code.trim();
    if (!trimmed || trimmed.length > MAX_CODE) return null;
    const b64 = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const obj = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    if (Object.prototype.hasOwnProperty.call(obj, "presets")) return null;
    const name = String(obj.__name || "Imported preset").trim().slice(0, MAX_NAME) || "Imported preset";
    return { name, snap: normalizePresetSnapshot(obj) };
  } catch {
    return null;
  }
}
__name(codeToPreset, "codeToPreset");
var BUILTIN_PRESETS = Object.freeze({
  Fast: normalizePresetSnapshot(DEFAULTS),
  "Jell-O": {
    cursorStyle: "Box",
    colorDark: "#31edae",
    colorLight: "#147133",
    glow: true,
    caretWidthPx: 3,
    popLetters: false,
    flameTrail: false,
    backspaceDisintegrate: true,
    blinkingEnabled: false,
    blinkDelayMs: 1200,
    smear: true,
    smearStiffness: 0.65,
    smearTrailingStiffness: 0.15,
    smearDamping: 0.4,
    smoothEnabled: true,
    smoothness: 0.15,
    catchUpSpeed: 0.6,
    maxCatchUpSpeed: 0.9
  },
  "Torch-Crt": {
    cursorStyle: "Line",
    colorDark: "#f3c258",
    colorLight: "#147133",
    crtEffect: true,
    glow: true,
    torchEffect: true,
    caretWidthPx: 3,
    popLetters: false,
    flameTrail: false,
    backspaceDisintegrate: true,
    blinkingEnabled: false,
    blinkDelayMs: 1200,
    smear: false,
    smoothEnabled: true,
    smoothness: 0.15,
    catchUpSpeed: 0.6,
    maxCatchUpSpeed: 0.9
  },
  "mr.Blue": {
    cursorStyle: "Line",
    colorDark: "#3182ed",
    colorLight: "#0077aa",
    glow: true,
    caretWidthPx: 3,
    popLetters: false,
    flameTrail: false,
    backspaceDisintegrate: true,
    blinkingEnabled: true,
    blinkSpeed: 1,
    blinkDelayMs: 1200,
    smear: false,
    smoothEnabled: true,
    smoothness: 0.15,
    catchUpSpeed: 0.6,
    maxCatchUpSpeed: 0.9
  },
  FairyDust: {
    cursorStyle: "Underline",
    colorDark: "#fff6bd",
    colorLight: "#e9cb35",
    glow: true,
    caretWidthPx: 3,
    popLetters: false,
    flameTrail: true,
    backspaceDisintegrate: true,
    energyEffect: true,
    energySpeed: 1.4,
    stardustEnabled: true,
    blinkingEnabled: false,
    blinkDelayMs: 1200,
    smear: true,
    smoothEnabled: true,
    smoothness: 0.15,
    catchUpSpeed: 0.6,
    maxCatchUpSpeed: 0.9
  },
  DarkMatter: {
    cursorStyle: "Box",
    colorDark: "#3ba2e3",
    colorLight: "#e15ff2",
    crtEffect: true,
    glow: true,
    caretWidthPx: 3,
    popLetters: false,
    flameTrail: true,
    backspaceDisintegrate: true,
    speedDemon: true,
    speedDemonSensitivity: 0.5,
    energyEffect: true,
    energySpeed: 1.4,
    trailLength: 3,
    blinkingEnabled: false,
    blinkDelayMs: 1200,
    smear: false,
    smoothEnabled: true,
    smoothness: 0.15,
    catchUpSpeed: 0.6,
    maxCatchUpSpeed: 0.9
  },
  old_Joe: {
    cursorStyle: "Box",
    colorDark: "#c2c2c2",
    colorLight: "#454545",
    glow: true,
    caretWidthPx: 3,
    popLetters: false,
    flameTrail: false,
    backspaceDisintegrate: true,
    blinkingEnabled: false,
    blinkSpeed: 1.5,
    blinkDelayMs: 1200,
    smear: false,
    smearStiffness: 0.65,
    smearTrailingStiffness: 0.15,
    smearDamping: 0.4,
    smoothEnabled: false
  }
});
function pickLook(settings) {
  return normalizePresetSnapshot(settings);
}
__name(pickLook, "pickLook");
function randomizeLook(rand = Math.random) {
  const chance = /* @__PURE__ */ __name((key, bias = 0.3) => rand() < bias, "chance");
  const num = /* @__PURE__ */ __name((key) => {
    const spec = NUM_SPECS[key];
    const def = (
      /** @type {any} */
      DEFAULTS[key]
    );
    if (!spec) return def;
    const steps = Math.floor((spec.max - spec.min) / spec.step);
    return coerce(key, spec.min + Math.floor(rand() * (steps + 1)) * spec.step);
  }, "num");
  const pick = /* @__PURE__ */ __name((list) => list[Math.floor(rand() * list.length)], "pick");
  const hex = /* @__PURE__ */ __name(() => {
    const fam = TW_FAMILY_POOL[Math.floor(rand() * TW_FAMILY_POOL.length)];
    return fam[Math.floor(rand() * fam.length)];
  }, "hex");
  const out = {
    cursorStyle: pick(ENUMS.cursorStyle),
    colorDark: hex(),
    colorLight: hex(),
    caretWidthPx: num("caretWidthPx"),
    cursorOpacity: rand() < 0.7 ? 1 : num("cursorOpacity"),
    glow: chance("glow", 0.6),
    showChar: chance("showChar", 0.5),
    blinkingEnabled: chance("blinkingEnabled", 0.6),
    blinkSpeed: num("blinkSpeed"),
    blinkOnOffBalance: num("blinkOnOffBalance"),
    blinkBreathing: chance("blinkBreathing", 0.25),
    smoothEnabled: chance("smoothEnabled", 0.6),
    smoothness: num("smoothness"),
    catchUpSpeed: num("catchUpSpeed"),
    smear: chance("smear", 0.5),
    smearTaper: chance("smearTaper", 0.3),
    // The loud ones, kept rare so a roll is usually wearable.
    popLetters: chance("popLetters", 0.3),
    popRainbow: chance("popRainbow", 0.15),
    flameTrail: chance("flameTrail", 0.3),
    thunderstrike: chance("thunderstrike", 0.1),
    stardustEnabled: chance("stardustEnabled", 0.2),
    stardustOrbit: chance("stardustOrbit", 0.1),
    speedDemon: chance("speedDemon", 0.2),
    energyEffect: chance("energyEffect", 0.2),
    crtEffect: chance("crtEffect", 0.25),
    torchEffect: chance("torchEffect", 0.08),
    ghostEnabled: chance("ghostEnabled", 0.15),
    comboEnabled: chance("comboEnabled", 0.15),
    shakeEnabled: chance("shakeEnabled", 0.12),
    idleFadeEnabled: chance("idleFadeEnabled", 0.2),
    rowTypeTint: chance("rowTypeTint", 0.15),
    selectionColorEnabled: chance("selectionColorEnabled", 0.15),
    // Never rolled on: it makes noise, and a surprise is not consent.
    soundEnabled: false
  };
  out.gradientEnabled = chance("gradientEnabled", 0.35);
  if (out.gradientEnabled) {
    out.gradientCount = 2 + Math.floor(rand() * 3);
    const fam = TW_FAMILY_POOL[Math.floor(rand() * TW_FAMILY_POOL.length)];
    for (let i = 1; i <= 4; i++) {
      out["gradientDark" + i] = fam[Math.min(fam.length - 1, 3 + i)];
      out["gradientLight" + i] = fam[Math.min(fam.length - 1, 5 + i)];
    }
  }
  return normalizePresetSnapshot(out);
}
__name(randomizeLook, "randomizeLook");
var TW_FAMILY_POOL = buildFamilyPool();
function buildFamilyPool() {
  const pool = [];
  for (const family of Object.keys(TAILWIND)) {
    const ramp = TAILWIND[family];
    if (Array.isArray(ramp) && ramp.length) pool.push(ramp);
  }
  return pool.length ? pool : [["#39ff14", "#00d4ff", "#b14aff", "#ff2e88"]];
}
__name(buildFamilyPool, "buildFamilyPool");
var ROOT_CLASS = "plg-cursor-smith";
var BODY_ACTIVE_CLASS = "cs-active";
var BODY_HIDE_NATIVE_CLASS = "cs-hide-native";
var DEMO_Z_INDEX = 10003;
var WRAP_CLASS = "cs-cursor-wrap";
var CANVAS_CLASS = "cs-cursor-canvas";
var TORCH_CLASS = "cs-torch-overlay";
var STATIC_CSS = `
/* ---- our own layers -------------------------------------------------------
 NO app-region declaration on either of these, ever. Electron composes drag
 regions by unioning elements that declare drag, then SUBTRACTING elements
 that declare no-drag. An element declaring nothing is neutral and ignored
 for hit-testing; declaring none punches a hole in the title bar's drag rect
 and kills window dragging outright. Thymer is frameless, so this matters.
 Clicks pass through via pointer-events, and the wrapper rect is kept off the
 drag surface by the chrome insets in host.js. */
.${WRAP_CLASS} {
	position: fixed;
	overflow: hidden;
	pointer-events: none;
	top: 0; left: 0; width: 0; height: 0;
	z-index: 40; /* PROVISIONAL */
}
.${CANVAS_CLASS} {
	position: absolute;
	top: 0; left: 0;
	pointer-events: none;
}

/* Native hide lives in src/extension.css, scoped to Roam block textareas. */

/* ---- settings preview ------------------------------------------------------
 The demo textarea is a real form control, so the OS I-beam paints regardless
 of the hide-native toggle and the panel showed two carets. The preview exists
 to show Smith, so its native caret goes whenever the engine is live. The
 engine also sets caret-color inline on whatever generic text host it is
 drawing over (see syncHostCaret) — this rule is the zero-JS fallback for the
 one host we own. Deliberately not extended to command-palette / dialog input. */
body.${BODY_ACTIVE_CLASS} .${ROOT_CLASS}-panel .cs-demo {
	caret-color: transparent;
}

/* ---- torch spotlight ------------------------------------------------------
 Sized inline by the torch tick every frame; the values here only cover the
 gap between insertion and the first frame, collapsed so it can never sit
 over the drag surface in that window.

 There is deliberately NO animation property. A CSS animation runs on the
 compositor, outside the rAF frame governor, so it would hold the display at
 full refresh rate the whole time the torch is on regardless of which gear
 the render loop picked — and because this element carries mix-blend-mode,
 every such frame forces a re-composite of the blended layer against its
 backdrop rather than a cheap opacity change. If flicker is wanted, drive
 --torch-intensity from the torch tick so it stays under the governor. */
.${TORCH_CLASS} {
	position: fixed;
	pointer-events: none;
	top: 0; left: 0; width: 0; height: 0;
	z-index: 39; /* PROVISIONAL */
	background: radial-gradient(
		circle var(--torch-radius, 250px) at var(--torch-x, 50%) var(--torch-y, 50%),
		rgba(var(--torch-warm, 255, 150, 60), var(--torch-intensity, 0.1)) 0%,
		rgba(0, 0, 0, var(--torch-darkness, 0.7)) 100%
	);
	mix-blend-mode: multiply;
	opacity: 1;
	transition: opacity 0.2s ease;
}
.${TORCH_CLASS}.cs-torch-hidden {
	opacity: 0 !important;
	display: none !important;
}
`;

// src/settings.js
function hexToRgba(hex, alpha) {
  let h2 = (hex || "#39ff14").replace("#", "");
  if (h2.length === 3) h2 = h2.split("").map((c) => c + c).join("");
  const int = Number.parseInt(h2, 16) || 0;
  return `rgba(${int >> 16 & 255}, ${int >> 8 & 255}, ${int & 255}, ${alpha})`;
}
var OPTIONS_KEY = "options";
var STYLE_NAME_ID = "cs-style-name";
var SAVED_STYLES_ID = "cs-saved-styles";
var SAVED_STYLES_PROMPT = "Pick a saved style";
var MIRROR = Object.freeze({
  "cs-enabled": "enabled",
  "cs-preset": "activePreset",
  "cs-shape": "cursorStyle",
  "cs-color-light": "colorLight",
  "cs-color-dark": "colorDark",
  "cs-width": "caretWidthPx",
  "cs-glow": "glow",
  "cs-blink": "blinkingEnabled",
  "cs-show-char": "showChar",
  "cs-hide-native": "hideNativeCaret",
  "cs-hide-blur": "hideOnWindowBlur"
});
function loadOptions(extensionAPI) {
  const raw = extensionAPI.settings.get(OPTIONS_KEY);
  return raw == null ? null : raw;
}
async function persistOptions(extensionAPI, value) {
  await extensionAPI.settings.set(OPTIONS_KEY, value);
}
function projectToDepot(settings) {
  const out = {};
  for (const [depotId, blobKey] of Object.entries(MIRROR)) {
    const value = settings[blobKey];
    if (depotId === "cs-preset") {
      out[depotId] = settings.activePreset || "Custom";
    } else if (depotId === "cs-width") {
      out[depotId] = String(value);
    } else if (depotId === "cs-color-light" || depotId === "cs-color-dark") {
      out[depotId] = value;
    } else {
      out[depotId] = value;
    }
  }
  return out;
}
async function mirrorToDepot(extensionAPI, settings, keys) {
  const projected = projectToDepot(settings);
  const ids = keys ?? Object.keys(MIRROR);
  let writes = 0;
  for (const id of ids) {
    if (!(id in MIRROR)) continue;
    const value = projected[id];
    if (extensionAPI.settings.get(id) !== value) {
      await extensionAPI.settings.set(id, value);
      writes += 1;
    }
  }
  return writes;
}
function createPreviewComponent(React = globalThis.window?.React) {
  if (typeof React?.createElement !== "function") return null;
  const h2 = React.createElement;
  return function RoamCaretPreview() {
    return h2(
      "div",
      { className: "cs-demo-wrap" },
      h2("textarea", {
        className: "cs-demo",
        rows: 4,
        spellCheck: false,
        autoCorrect: "off",
        autoCapitalize: "off",
        placeholder: "Type here"
      })
    );
  };
}
function buildDepotPanel({
  settings = {},
  builtinNames,
  userNames,
  handlers = {},
  React = globalThis.window?.React
} = {}) {
  const savedNames = userNames || Object.keys(settings.presets || {});
  const presetItems = [
    "Custom",
    ...builtinNames || Object.keys(BUILTIN_PRESETS),
    ...savedNames
  ];
  const onChange = handlers.onChange ?? (() => {
  });
  const savedStylesRow = settings.activePreset ? [] : [{
    id: SAVED_STYLES_ID,
    name: "Saved styles",
    description: savedNames.length ? "Load a style you saved or imported." : "Save or import a style to list it here.",
    action: {
      type: "select",
      items: [SAVED_STYLES_PROMPT, ...savedNames],
      onChange: (event) => onChange(SAVED_STYLES_ID, event.target?.value ?? event)
    }
  }];
  const rows = [
    {
      id: "cs-enabled",
      name: "Enabled",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-enabled", event.target.checked)
      }
    },
    {
      id: "cs-preset",
      name: "Look",
      action: {
        type: "select",
        items: presetItems,
        onChange: (event) => onChange("cs-preset", event.target?.value ?? event)
      }
    },
    ...savedStylesRow,
    {
      id: "cs-shape",
      name: "Shape",
      action: {
        type: "select",
        items: ["Beam", "Line", "Box", "Underline"],
        onChange: (event) => onChange("cs-shape", event.target?.value ?? event)
      }
    },
    {
      id: "cs-color-light",
      name: "Color (light)",
      action: {
        type: "input",
        placeholder: "#00695e",
        onChange: (event) => onChange("cs-color-light", event.target?.value ?? event)
      }
    },
    {
      id: "cs-color-dark",
      name: "Color (dark)",
      action: {
        type: "input",
        placeholder: "#48d0c0",
        onChange: (event) => onChange("cs-color-dark", event.target?.value ?? event)
      }
    },
    {
      id: "cs-width",
      name: "Width (px)",
      description: "Line and Beam. A Line with Glow and Show letter off uses the browser's own 1px caret.",
      action: {
        type: "input",
        placeholder: "3",
        onChange: (event) => onChange("cs-width", event.target?.value ?? event)
      }
    },
    {
      id: "cs-glow",
      name: "Glow",
      description: "Soft halo around the caret.",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-glow", event.target.checked)
      }
    },
    {
      id: "cs-blink",
      name: "Blink",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-blink", event.target.checked)
      }
    },
    {
      id: "cs-show-char",
      name: "Show letter in Box",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-show-char", event.target.checked)
      }
    },
    {
      id: "cs-hide-native",
      name: "Hide Roam's caret",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-hide-native", event.target.checked)
      }
    },
    {
      id: "cs-hide-blur",
      name: "Hide when window unfocused",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-hide-blur", event.target.checked)
      }
    },
    {
      id: STYLE_NAME_ID,
      name: "Style name",
      description: "Used by Save and by the next copied share code. Empty uses the shape.",
      action: {
        type: "input",
        placeholder: "Teal",
        onChange: (event) => onChange(STYLE_NAME_ID, event.target?.value ?? event)
      }
    },
    {
      id: "cs-save-style",
      name: "Save style",
      description: "Saves the current look under Style name and adds it to Look.",
      action: {
        type: "button",
        content: "Save",
        onClick: handlers.onSaveStyle
      }
    },
    {
      id: "cs-copy-code",
      name: "Copy share code",
      action: {
        type: "button",
        content: "Copy",
        onClick: handlers.onCopyCode
      }
    },
    {
      id: "cs-import-code",
      name: "Share code to import",
      action: {
        type: "input",
        onChange: (event) => onChange("cs-import-code", event.target?.value ?? event)
      }
    },
    {
      id: "cs-import",
      name: "Import share code",
      action: {
        type: "button",
        content: "Import",
        onClick: handlers.onImport
      }
    },
    {
      id: "cs-studio",
      name: "Open Studio",
      description: "Every effect, live preview.",
      action: {
        type: "button",
        content: "Open",
        onClick: handlers.onStudio
      }
    }
  ];
  const preview = createPreviewComponent(React);
  if (preview) {
    rows.push({
      id: "cs-preview",
      name: "Preview",
      action: {
        type: "reactComponent",
        component: preview
      }
    });
  }
  return { tabTitle: "Roam Caret", settings: rows };
}

// src/caret-measure.js
var MARKER_CHAR = "​";
var INPUT_LINE_EM = 1.5;
var INPUT_TEXT_EM = 1.2;
var SKIP_HOST_SELECTOR = ".rg-root, .pxd-root";
var MIRROR_PROPERTIES = Object.freeze([
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontVariant",
  "letterSpacing",
  "textTransform",
  "textIndent",
  "lineHeight",
  "tabSize",
  "direction"
]);
function isTextTarget(element) {
  if (!element || !element.tagName) return false;
  if (element.tagName === "TEXTAREA") return true;
  if (element.tagName !== "INPUT") return false;
  const type = (element.getAttribute?.("type") || "text").toLowerCase();
  return ["text", "search", "url", "tel", "email", "number"].includes(type);
}
function isSkippedHost(el) {
  return !!el?.closest?.(SKIP_HOST_SELECTOR);
}
function px(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function projectCaretRect({
  box,
  offsetW,
  offsetH,
  markerLeft,
  markerTop,
  scrollLeft,
  scrollTop,
  borderLeft,
  borderTop,
  padLeft,
  padTop,
  padRight,
  padBottom,
  glyphWidth,
  lineHeightPx,
  hasGlyph,
  glyph
}) {
  const scaleX = offsetW ? box.width / offsetW : 1;
  const scaleY = offsetH ? box.height / offsetH : 1;
  const x = box.left + (borderLeft + markerLeft - scrollLeft) * scaleX;
  const y = box.top + (borderTop + markerTop - scrollTop) * scaleY;
  const width = glyphWidth * scaleX;
  const height = lineHeightPx * scaleY;
  const boxRight = box.right ?? box.left + box.width;
  const boxBottom = box.bottom ?? box.top + box.height;
  const content = {
    left: box.left + (borderLeft + padLeft) * scaleX,
    top: box.top + (borderTop + padTop) * scaleY,
    right: boxRight - (borderLeft + padRight) * scaleX,
    bottom: boxBottom - (borderTop + padBottom) * scaleY
  };
  const visible = x + width > content.left && x < content.right && y + height > content.top && y < content.bottom;
  return {
    x,
    y,
    width,
    height,
    glyph: hasGlyph ? glyph : "",
    visible
  };
}
function readMetrics(computed) {
  const fontSizePx = px(computed.fontSize, 16);
  return {
    borderLeft: px(computed.borderLeftWidth),
    borderTop: px(computed.borderTopWidth),
    borderBottom: px(computed.borderBottomWidth),
    padLeft: px(computed.paddingLeft),
    padTop: px(computed.paddingTop),
    padRight: px(computed.paddingRight),
    padBottom: px(computed.paddingBottom),
    lineHeightPx: px(computed.lineHeight) || fontSizePx * 1.2 || 19,
    fontFamily: computed.fontFamily || "",
    fontSize: computed.fontSize || "",
    fontWeight: computed.fontWeight || "",
    fontStyle: computed.fontStyle || "",
    lineHeight: computed.lineHeight || "",
    color: computed.color || "",
    fontSizePx
  };
}
function caretLine(metrics, offsetH) {
  const lineHeightPx = metrics.lineHeightPx;
  if (!metrics.singleLine) return { top: 0, height: lineHeightPx, css: metrics.lineHeight };
  const contentH = offsetH - metrics.borderTop - metrics.borderBottom - metrics.padTop - metrics.padBottom;
  if (offsetH && Math.abs(lineHeightPx - contentH) <= 1) {
    const height2 = Math.min(lineHeightPx, metrics.fontSizePx * INPUT_TEXT_EM);
    return { top: (lineHeightPx - height2) / 2, height: height2, css: `${height2}px` };
  }
  const height = Math.min(lineHeightPx, metrics.fontSizePx * INPUT_LINE_EM);
  return { top: offsetH ? (contentH - height) / 2 : 0, height, css: `${height}px` };
}
function glyphAt(value, start) {
  const underCaret = value[start] && value[start] !== "\n" ? value[start] : "0";
  const hasGlyph = underCaret !== "0" || value[start] === "0";
  return { underCaret, hasGlyph };
}
function editableText(documentRef, element) {
  const node = typeof documentRef.createTextNode === "function" ? documentRef.createTextNode("") : null;
  const canEdit = typeof node?.replaceData === "function";
  if (canEdit) element.appendChild(node);
  let current = "";
  return (next) => {
    const prev = current;
    if (next === prev) return;
    current = next;
    if (!canEdit) {
      element.textContent = next;
      return;
    }
    let same;
    if (next.length >= prev.length && next.startsWith(prev)) same = prev.length;
    else if (prev.startsWith(next)) same = next.length;
    else {
      same = 0;
      const limit = Math.min(prev.length, next.length);
      while (same < limit && prev.charCodeAt(same) === next.charCodeAt(same)) same += 1;
    }
    node.replaceData(same, prev.length - same, next.slice(same));
  };
}
function createCaretMeasurer({ doc, win, lifecycle } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  const subscribers = /* @__PURE__ */ new Set();
  let cachedEl = null;
  let metrics = null;
  let latestRect = null;
  let markerHeight = "";
  let disposed = false;
  const mirror = documentRef.createElement("div");
  const style = mirror.style;
  style.position = "absolute";
  style.top = "0";
  style.left = "-99999px";
  style.visibility = "hidden";
  style.height = "auto";
  style.whiteSpace = "pre-wrap";
  style.overflowWrap = "break-word";
  style.contain = "layout style";
  mirror.setAttribute("aria-hidden", "true");
  const beforeBlock = documentRef.createElement("div");
  const lineBlock = documentRef.createElement("div");
  const prefixNode = documentRef.createElement("span");
  const marker = documentRef.createElement("span");
  marker.style.display = "inline-block";
  marker.style.width = "0";
  marker.style.verticalAlign = "top";
  marker.textContent = MARKER_CHAR;
  const glyphEl = documentRef.createElement("span");
  lineBlock.appendChild(prefixNode);
  lineBlock.appendChild(marker);
  lineBlock.appendChild(glyphEl);
  mirror.appendChild(beforeBlock);
  mirror.appendChild(lineBlock);
  const setBefore = editableText(documentRef, beforeBlock);
  const setLine = editableText(documentRef, prefixNode);
  let lineIndent = "";
  const parent = documentRef.body || documentRef.documentElement || globalThis.document?.body;
  if (lifecycle) lifecycle.node(mirror, parent);
  else parent.append(mirror);
  const invalidate = () => {
    cachedEl = null;
    metrics = null;
  };
  const themeListeners = [];
  const bindThemeListener = (target, type, fn, options) => {
    target?.addEventListener?.(type, fn, options);
    themeListeners.push({ target, type, fn, options });
  };
  if (windowRef?.addEventListener) {
    bindThemeListener(windowRef, "resize", invalidate);
  }
  const colorSchemeMq = windowRef?.matchMedia?.("(prefers-color-scheme: dark)");
  bindThemeListener(colorSchemeMq, "change", invalidate);
  const visualViewport = windowRef.visualViewport;
  bindThemeListener(visualViewport, "resize", invalidate);
  let themeObserver = null;
  if (typeof MutationObserver === "function") {
    themeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          invalidate();
          return;
        }
      }
    });
    const observeClass = (node) => {
      if (!node) return;
      themeObserver.observe(node, { attributes: true, attributeFilter: ["class"] });
    };
    observeClass(documentRef.documentElement);
    observeClass(documentRef.body);
  }
  const notify = (rect) => {
    for (const fn of subscribers) fn(rect);
  };
  const measure = (el) => {
    if (disposed) return null;
    if (!isTextTarget(el) || isSkippedHost(el)) return null;
    if (el !== cachedEl) {
      const computedStyle = windowRef.getComputedStyle(el);
      const copied = MIRROR_PROPERTIES.map((name) => computedStyle[name]);
      metrics = readMetrics(computedStyle);
      MIRROR_PROPERTIES.forEach((name, index) => {
        style[name] = copied[index];
      });
      metrics.singleLine = el.tagName === "INPUT";
      style.whiteSpace = metrics.singleLine ? "pre" : "pre-wrap";
      cachedEl = el;
    }
    const value = el.value ?? "";
    const start = Math.min(el.selectionStart ?? value.length, value.length);
    const { underCaret, hasGlyph } = glyphAt(value, start);
    const split = !metrics.singleLine && start > 0 ? value.lastIndexOf("\n", start - 1) : -1;
    if (split < 0) {
      setBefore("");
      setLine(value.slice(0, start));
    } else {
      const before = value.slice(0, split);
      setBefore(before === "" || before.endsWith("\n") ? before + MARKER_CHAR : before);
      setLine(value.slice(split + 1, start));
    }
    const indent = split < 0 ? "" : "0px";
    if (indent !== lineIndent) {
      lineIndent = indent;
      lineBlock.style.textIndent = indent;
    }
    const nextMarkerHeight = `${metrics.lineHeightPx}px`;
    if (nextMarkerHeight !== markerHeight) {
      markerHeight = nextMarkerHeight;
      marker.style.height = nextMarkerHeight;
    }
    glyphEl.textContent = underCaret;
    const box = el.getBoundingClientRect();
    const glyphWidth = glyphEl.offsetWidth || metrics.fontSizePx * 0.6 || 8;
    const offsetH = el.offsetHeight || 0;
    const line = caretLine(metrics, offsetH);
    const rect = {
      ...projectCaretRect({
        box,
        offsetW: el.offsetWidth || 0,
        offsetH,
        markerLeft: marker.offsetLeft || 0,
        markerTop: (marker.offsetTop || 0) + line.top,
        scrollLeft: el.scrollLeft || 0,
        scrollTop: el.scrollTop || 0,
        borderLeft: metrics.borderLeft,
        borderTop: metrics.borderTop,
        padLeft: metrics.padLeft,
        padTop: metrics.padTop,
        padRight: metrics.padRight,
        padBottom: metrics.padBottom,
        glyphWidth,
        lineHeightPx: line.height,
        hasGlyph,
        glyph: underCaret
      }),
      fontFamily: metrics.fontFamily,
      fontSize: metrics.fontSize,
      fontWeight: metrics.fontWeight,
      fontStyle: metrics.fontStyle,
      lineHeight: line.css,
      color: metrics.color,
      box,
      el
    };
    latestRect = rect;
    notify(rect);
    return rect;
  };
  return {
    measure,
    latest() {
      return latestRect;
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    isSkippedHost,
    // Drop the cached style so the next measure copies the host's width again.
    invalidate,
    dispose() {
      if (disposed) return;
      disposed = true;
      subscribers.clear();
      cachedEl = null;
      metrics = null;
      latestRect = null;
      for (const { target, type, fn, options } of themeListeners) {
        try {
          target?.removeEventListener?.(type, fn, options);
        } catch {
        }
      }
      themeListeners.length = 0;
      try {
        themeObserver?.disconnect();
      } catch {
      }
      themeObserver = null;
      mirror.remove();
    }
  };
}

// src/theme.js
function isRoamDark(doc) {
  if (doc?.documentElement?.classList?.contains("bp3-dark")) return true;
  const body = doc?.body?.classList;
  if (!body) return false;
  return body.contains("rm-dark-theme") || body.contains("bt-theme-dark") || body.contains("roam-body") && body.contains("dark");
}

// src/caret-lite.js
function isPasswordField(el) {
  if (!el) return false;
  const type = String(el.type || el.getAttribute?.("type") || "").toLowerCase();
  return type === "password";
}
var COMMAND_PALETTE_CLASS = "rm-command-palette";
var COMMAND_PALETTE_SELECTOR = `.${COMMAND_PALETTE_CLASS}`;
var PALETTE_PORTAL_CLASS = "rm-modal-portal--command-palette";
var IN_PALETTE_SELECTOR = `${COMMAND_PALETTE_SELECTOR}, .${PALETTE_PORTAL_CLASS}`;
var CARET_BOX_MARGIN_PX = 8;
var BASE_Z_INDEX = 40;
var DEMO_CLASS = "cs-lite-demo";
var SELECTION_CLASS = "cs-sel";
var SELECTION_BG = "--cs-selection";
var SELECTION_TEXT = "--cs-selection-text";
function isDemo(el) {
  return String(el?.className || "").split(/\s+/).includes("cs-demo");
}
function isCaretHost(el) {
  if (!isTextTarget(el) || isPasswordField(el)) return false;
  return !isSkippedHost(el);
}
function stackingZIndex(el, doc, win) {
  if (typeof win?.getComputedStyle !== "function") return 0;
  let top = 0;
  try {
    let node = el;
    let guard = 0;
    while (node && node !== doc?.body && node !== doc?.documentElement && guard++ < 256) {
      const st = win.getComputedStyle(node);
      if (st.position && st.position !== "static") {
        const z = Number.parseInt(st.zIndex, 10);
        if (z > top) top = z;
      }
      node = node.parentElement;
    }
  } catch {
    return 0;
  }
  return top;
}
function isPlainLine(settings) {
  return !!settings && settings.cursorStyle === "Line" && !settings.glow && !settings.showChar && !settings.gradientEnabled && !needsCanvas(settings);
}
function opacityOf(settings) {
  const value = Number(settings?.cursorOpacity);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}
function containsPalette(node) {
  if (!node || node.nodeType !== 1) return false;
  const classes = node.classList;
  if (classes?.contains(COMMAND_PALETTE_CLASS) || classes?.contains(PALETTE_PORTAL_CLASS)) return true;
  return !!(node.firstElementChild && node.querySelector?.(COMMAND_PALETTE_SELECTOR));
}
function caretOutsideTextarea(rect) {
  const box = rect.box;
  if (!box) return false;
  const right = box.right ?? box.left + box.width;
  const bottom = box.bottom ?? box.top + box.height;
  return rect.x < box.left - CARET_BOX_MARGIN_PX || rect.x > right + CARET_BOX_MARGIN_PX || rect.y < box.top - CARET_BOX_MARGIN_PX || rect.y > bottom + CARET_BOX_MARGIN_PX;
}
function resolveClipChain(el, doc, win) {
  const chain = [];
  if (typeof win?.getComputedStyle !== "function") return chain;
  try {
    let curPos = win.getComputedStyle(el).position;
    if (curPos === "fixed") return chain;
    let node = el.parentElement;
    let guard = 0;
    while (node && node !== doc?.body && node !== doc?.documentElement && guard++ < 24) {
      const st = win.getComputedStyle(node);
      const positioned = st.position !== "static";
      const clips = st.overflowX !== "visible" || st.overflowY !== "visible";
      if (clips && (curPos !== "absolute" || positioned)) chain.push(node);
      if (positioned) {
        if (st.position === "fixed") break;
        curPos = st.position;
      }
      node = node.parentElement;
    }
  } catch {
    return [];
  }
  return chain;
}
function parseRgb(value) {
  const text = String(value || "").trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const int = Number.parseInt(hex[1], 16);
    return [int >> 16 & 255, int >> 8 & 255, int & 255];
  }
  const nums = text.match(/[\d.]+/g);
  if (!/^rgba?\(/i.test(text) || !nums || nums.length < 3) return null;
  return nums.slice(0, 3).map(Number);
}
function luminance([r, g, b]) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function glyphColorOn(boxColor, textColor) {
  const box = parseRgb(boxColor);
  const text = parseRgb(textColor);
  if (!box) return textColor || "";
  if (!text) return luminance(box) > 0.179 ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
  const inverted = text.map((c) => 255 - c);
  const pick = contrast(text, box) >= contrast(inverted, box) ? text : inverted;
  return `rgb(${pick.map((c) => Math.round(c)).join(", ")})`;
}
function hasRangeSelection(el) {
  if (el?.selectionStart == null || el?.selectionEnd == null) return false;
  return el.selectionStart !== el.selectionEnd;
}
function observerClass(win) {
  const MO = win?.MutationObserver || globalThis.MutationObserver;
  return typeof MO === "function" ? MO : null;
}
function resizeObserverClass(win) {
  const RO = win?.ResizeObserver || globalThis.ResizeObserver;
  return typeof RO === "function" ? RO : null;
}
function sameSize(a, b) {
  return Math.abs(a - b) < 0.5;
}
function createSelectionPainter() {
  let host = null;
  let key = "";
  const clear = () => {
    const el = host;
    if (!el) return;
    host = null;
    key = "";
    try {
      el.classList?.remove(SELECTION_CLASS);
      el.style.removeProperty(SELECTION_BG);
      el.style.removeProperty(SELECTION_TEXT);
    } catch {
    }
  };
  const paint = (el, color, textColor = "") => {
    if (!el || !color) {
      clear();
      return;
    }
    const next = `${color}|${textColor}`;
    if (el === host && next === key) return;
    if (host && host !== el) clear();
    try {
      el.style.setProperty(SELECTION_BG, color);
      el.style.setProperty(SELECTION_TEXT, glyphColorOn(color, textColor));
      el.classList?.add(SELECTION_CLASS);
      host = el;
      key = next;
    } catch {
    }
  };
  return {
    paint,
    clear,
    get host() {
      return host;
    }
  };
}
function installNativeCaret({ doc, win, getSettings } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  const painted = /* @__PURE__ */ new Set();
  const selection = createSelectionPainter();
  let disposed = false;
  const colorFor = () => {
    const settings = typeof getSettings === "function" && getSettings() || {};
    const hex = isRoamDark(documentRef) ? settings.colorDark : settings.colorLight;
    if (!hex) return "";
    const opacity = opacityOf(settings);
    return opacity < 1 ? hexToRgba(hex, opacity) : hex;
  };
  const clear = (el) => {
    painted.delete(el);
    if (el === selection.host) selection.clear();
    try {
      el.style.removeProperty("caret-color");
    } catch {
    }
  };
  const paint = (el) => {
    const color = colorFor();
    if (!color) {
      clear(el);
      return;
    }
    try {
      el.style.setProperty("caret-color", color, "important");
      painted.add(el);
    } catch {
    }
    selection.paint(el, color);
  };
  const refresh = () => {
    if (disposed) return;
    const target = documentRef.activeElement;
    for (const el of [...painted]) if (el !== target) clear(el);
    if (target && isCaretHost(target)) paint(target);
  };
  const onFocusIn = (event) => {
    const target = event?.target;
    if (target && isCaretHost(target)) paint(target);
  };
  const onFocusOut = (event) => {
    const target = event?.target;
    if (target && painted.has(target)) clear(target);
  };
  documentRef.addEventListener("focusin", onFocusIn, false);
  documentRef.addEventListener("focusout", onFocusOut, false);
  let themeObserver = null;
  const MO = observerClass(windowRef);
  if (MO) {
    themeObserver = new MO(() => refresh());
    for (const node of [documentRef.documentElement, documentRef.body]) {
      if (node) themeObserver.observe(node, { attributes: true, attributeFilter: ["class"] });
    }
  }
  refresh();
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    documentRef.removeEventListener("focusin", onFocusIn, false);
    documentRef.removeEventListener("focusout", onFocusOut, false);
    try {
      themeObserver?.disconnect();
    } catch {
    }
    themeObserver = null;
    for (const el of [...painted]) clear(el);
    selection.clear();
  };
  return { refresh, dispose };
}
function installLiteCaret({ doc, win, measurer, lifecycle, getSettings, recordTiming } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  let settings = typeof getSettings === "function" ? getSettings() || {} : {};
  let active = null;
  let disposed = false;
  let lastEl = null;
  let lastSig = "";
  let frame = 0;
  let framePing = false;
  const readPaletteOpen = () => !!documentRef.querySelector?.(COMMAND_PALETTE_SELECTOR);
  let paletteOpen = readPaletteOpen();
  const perf = windowRef?.performance || globalThis.performance;
  const now = typeof perf?.now === "function" ? () => perf.now() : null;
  const overlay = documentRef.createElement("div");
  overlay.className = "cs-lite-caret";
  const style = overlay.style;
  style.pointerEvents = "none";
  style.position = "fixed";
  style.top = "0";
  style.left = "0";
  style.zIndex = String(BASE_Z_INDEX);
  style.willChange = "transform";
  style.transformOrigin = "0 0";
  style.display = "none";
  const glyph = documentRef.createElement("span");
  glyph.className = "cs-lite-glyph";
  glyph.style.display = "none";
  glyph.style.textAlign = "center";
  glyph.style.whiteSpace = "pre";
  overlay.appendChild(glyph);
  const parent = documentRef.body || documentRef.documentElement;
  if (lifecycle?.node) lifecycle.node(overlay, parent);
  else parent.append(overlay);
  const motionQuery = windowRef?.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reducedMotion = !!motionQuery?.matches;
  const computeSig = (el) => {
    if (!el) return "";
    return [el.value?.length, el.selectionStart, el.selectionEnd].join("\0");
  };
  const rememberTarget = (el) => {
    lastEl = el;
    lastSig = computeSig(el);
  };
  const readSettings = () => {
    if (typeof getSettings === "function") settings = getSettings() || {};
    return settings;
  };
  const styleCache = {
    display: "none",
    transform: "",
    width: "",
    height: "",
    background: "",
    border: "",
    borderRadius: "",
    boxShadow: "",
    opacity: "",
    zIndex: String(BASE_Z_INDEX)
  };
  const writeStyle = (prop, value) => {
    if (styleCache[prop] === value) return;
    styleCache[prop] = value;
    style[prop] = value;
  };
  const glyphCache = {
    display: "none",
    color: "",
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    fontStyle: "",
    lineHeight: ""
  };
  const writeGlyph = (prop, value) => {
    if (glyphCache[prop] === value) return;
    glyphCache[prop] = value;
    glyph.style[prop] = value;
  };
  let glyphText = "";
  let glyphColorKey = "";
  let glyphColor = "";
  let nativeHiddenEl = null;
  let nativePrev = null;
  const restoreNativeCaret = () => {
    const el = nativeHiddenEl;
    if (!el) return;
    const prev = nativePrev;
    nativeHiddenEl = null;
    nativePrev = null;
    try {
      if (prev) el.style.setProperty("caret-color", prev.value, prev.priority);
      else el.style.removeProperty("caret-color");
    } catch {
    }
  };
  const hideNativeCaret = (el) => {
    const want = settings.hideNativeCaret !== false;
    if (want && el === nativeHiddenEl) return;
    restoreNativeCaret();
    if (!want) return;
    try {
      const st = el.style;
      const value = st.getPropertyValue("caret-color");
      nativePrev = value ? { value, priority: st.getPropertyPriority("caret-color") } : null;
      st.setProperty("caret-color", "transparent", "important");
      nativeHiddenEl = el;
    } catch {
      nativePrev = null;
    }
  };
  const selection = createSelectionPainter();
  const hide = () => {
    writeStyle("display", "none");
    restoreNativeCaret();
  };
  const caretColor = () => isRoamDark(documentRef) ? settings.colorDark || "" : settings.colorLight || "";
  const selectionColor = (color) => {
    const opacity = opacityOf(settings);
    return color && opacity < 1 ? hexToRgba(color, opacity) : color;
  };
  let paletteFor = null;
  let layerInPalette = false;
  const resolvePalette = (el) => {
    if (el === paletteFor) return;
    paletteFor = el;
    layerInPalette = !!el.closest?.(IN_PALETTE_SELECTOR);
  };
  let layerFor = null;
  let layerZ = String(BASE_Z_INDEX);
  const resolveLayer = (el) => {
    if (el === layerFor) return;
    layerFor = el;
    const top = stackingZIndex(el, documentRef, windowRef);
    let z = top >= BASE_Z_INDEX ? top + 1 : BASE_Z_INDEX;
    if (isDemo(el)) z = Math.max(z, DEMO_Z_INDEX);
    layerZ = String(z);
  };
  let demoLayer = false;
  const setLayer = (el) => {
    const demo = isDemo(el);
    if (demo !== demoLayer) {
      demoLayer = demo;
      overlay.classList.toggle(DEMO_CLASS, demo);
    }
    writeStyle("zIndex", layerZ);
  };
  const canAnimate = typeof overlay.animate === "function";
  let blinkAnim = null;
  let blinkOn = false;
  let blinkKey = "";
  let blinkSettings = null;
  const stopBlink = () => {
    if (!blinkOn) return;
    blinkOn = false;
    try {
      blinkAnim?.cancel();
    } catch {
    }
  };
  const syncBlink = (ping) => {
    if (!canAnimate || !settings.blinkingEnabled || reducedMotion) {
      stopBlink();
      return;
    }
    if (settings !== blinkSettings || !blinkAnim) {
      blinkSettings = settings;
      const speed = Math.max(0.1, Number(settings.blinkSpeed) || 1.2);
      const duration = Math.round(2500 / speed);
      const lit = Math.min(0.9, Math.max(0.1, Number(settings.blinkOnOffBalance) || 0.5));
      const delay = Math.max(0, Number(settings.blinkDelayMs) || 0);
      const opacity = opacityOf(settings);
      const key = `${duration}|${lit}|${delay}|${opacity}`;
      if (key !== blinkKey || !blinkAnim) {
        try {
          blinkAnim?.cancel();
        } catch {
        }
        blinkKey = key;
        blinkAnim = overlay.animate(
          [
            { opacity },
            { opacity, offset: lit },
            { opacity: 0, offset: lit },
            { opacity: 0 }
          ],
          { duration, delay, iterations: Infinity }
        );
        blinkOn = true;
        return;
      }
    }
    if (!blinkOn) {
      blinkOn = true;
      blinkAnim.play();
      return;
    }
    if (ping) blinkAnim.currentTime = 0;
  };
  const restartBlink = () => {
    if (blinkOn && blinkAnim) blinkAnim.currentTime = 0;
  };
  let clipFor = null;
  let clipChain = [];
  const outsideClip = (el, rect) => {
    if (el !== clipFor) {
      clipFor = el;
      clipChain = resolveClipChain(el, documentRef, windowRef);
    }
    for (const node of clipChain) {
      if (node.isConnected === false) {
        clipFor = null;
        return false;
      }
      const b = node.getBoundingClientRect();
      if (rect.x < b.left - 1 || rect.x > b.right + 1 || rect.y < b.top - 1 || rect.y + rect.height > b.bottom + 1) {
        return true;
      }
    }
    return false;
  };
  const paintGlyph = (rect, cursorStyle, color, height) => {
    const show = cursorStyle === "Box" && !settings.boxHollow && !!settings.showChar && !!rect.glyph;
    if (!show) {
      writeGlyph("display", "none");
      if (glyphText) {
        glyphText = "";
        glyph.textContent = "";
      }
      return;
    }
    if (rect.glyph !== glyphText) {
      glyphText = rect.glyph;
      glyph.textContent = rect.glyph;
    }
    const colorKey = `${color}|${rect.color || ""}`;
    if (colorKey !== glyphColorKey) {
      glyphColorKey = colorKey;
      glyphColor = glyphColorOn(color, rect.color);
    }
    writeGlyph("display", "block");
    writeGlyph("color", glyphColor);
    writeGlyph("fontFamily", rect.fontFamily || "");
    writeGlyph("fontSize", rect.fontSize || "");
    writeGlyph("fontWeight", rect.fontWeight || "");
    writeGlyph("fontStyle", rect.fontStyle || "");
    writeGlyph(
      "lineHeight",
      rect.lineHeight && rect.lineHeight !== "normal" ? rect.lineHeight : `${height}px`
    );
  };
  const paint = (rect, el, color) => {
    const box = rect?.box;
    if (!rect || !rect.visible || box && !(box.width > 0 && box.height > 0) || caretOutsideTextarea(rect) || outsideClip(el, rect)) {
      hide();
      return false;
    }
    resolveLayer(el);
    const cursorStyle = settings.cursorStyle || "Box";
    let x = rect.x;
    let y = rect.y;
    let width = rect.width;
    let height = rect.height;
    if (cursorStyle === "Line") {
      width = settings.caretWidthPx ?? 2;
      height = rect.height;
      writeStyle("borderRadius", "");
      writeStyle("border", "");
      writeStyle("background", color);
    } else if (cursorStyle === "Underline") {
      const bar = settings.underlineWidthPx || 2;
      width = rect.width;
      height = bar;
      y = rect.y + rect.height - bar;
      writeStyle("borderRadius", "");
      writeStyle("border", "");
      writeStyle("background", color);
    } else if (cursorStyle === "Beam") {
      width = settings.caretWidthPx ?? 3;
      height = Math.max(2, rect.height * 0.82);
      y = rect.y + (rect.height - height) / 2;
      x = rect.x - width / 2;
      writeStyle("borderRadius", "3px");
      writeStyle("border", "");
      writeStyle("background", color);
    } else {
      writeStyle("borderRadius", "1px");
      if (settings.boxHollow) {
        writeStyle("background", "transparent");
        writeStyle("border", `${settings.boxHollowWidth || 2}px solid ${color}`);
      } else {
        writeStyle("border", "");
        writeStyle("background", color);
      }
    }
    const opacity = opacityOf(settings);
    writeStyle("display", "");
    writeStyle("transform", `translate(${x}px, ${y}px)`);
    writeStyle("width", `${width}px`);
    writeStyle("height", `${height}px`);
    writeStyle("opacity", opacity < 1 ? String(opacity) : "");
    writeStyle(
      "boxShadow",
      settings.glow ? `0 0 0 1px ${hexToRgba(color, 0.18)}, 0 0 8px ${hexToRgba(color, 0.3)}` : ""
    );
    setLayer(el);
    paintGlyph(rect, cursorStyle, color, height);
    return true;
  };
  let composing = false;
  let followed = null;
  let followedBox = null;
  let resizeObserver = null;
  const follow = (el) => {
    if (el === followed) return;
    try {
      if (followed) resizeObserver?.unobserve(followed);
      if (el) resizeObserver?.observe(el, { box: "border-box" });
    } catch {
    }
    followed = el;
    followedBox = null;
  };
  const release = () => {
    active = null;
    lastEl = null;
    lastSig = "";
    follow(null);
    hide();
    selection.clear();
  };
  const measureAndApply = (el, ping) => {
    if (disposed) return;
    const t0 = recordTiming && now ? now() : null;
    readSettings();
    if (active && active.isConnected === false) release();
    const target = el || documentRef.activeElement;
    if (!target || target.isConnected === false || !isCaretHost(target)) {
      follow(null);
      hide();
      selection.clear();
      rememberTarget(target);
      return;
    }
    const color = caretColor();
    if (hasRangeSelection(target)) {
      hide();
      const last = measurer.latest?.();
      selection.paint(target, selectionColor(color), last?.el === target ? last.color || "" : "");
      rememberTarget(target);
      return;
    }
    resolvePalette(target);
    if (paletteOpen && !layerInPalette) {
      hide();
      rememberTarget(target);
      return;
    }
    active = target;
    follow(target);
    const rect = measurer.measure(target);
    followedBox = rect?.box || null;
    if (paint(rect, target, color)) {
      syncBlink(ping);
      hideNativeCaret(target);
    }
    selection.paint(target, selectionColor(color), rect?.color || "");
    rememberTarget(target);
    if (t0 != null) recordTiming(now() - t0);
  };
  const flush = () => {
    frame = 0;
    const ping = framePing;
    framePing = false;
    if (disposed || composing) return;
    measureAndApply(documentRef.activeElement, ping);
  };
  const schedule = (ping) => {
    if (disposed) return;
    if (ping) framePing = true;
    if (frame) return;
    if (typeof windowRef.requestAnimationFrame !== "function") {
      flush();
      return;
    }
    frame = windowRef.requestAnimationFrame(flush);
  };
  const cancelFrame = () => {
    if (!frame) return;
    try {
      windowRef.cancelAnimationFrame?.(frame);
    } catch {
    }
    frame = 0;
    framePing = false;
  };
  const onFocusIn = (event) => {
    const target = event?.target;
    layerFor = null;
    paletteFor = null;
    paletteOpen = readPaletteOpen();
    if (!target || !isCaretHost(target)) {
      release();
      return;
    }
    schedule(true);
  };
  const onFocusOut = (event) => {
    const target = event?.target;
    if (target && target === nativeHiddenEl) restoreNativeCaret();
    const next = event?.relatedTarget || documentRef.activeElement;
    if (target && target === selection.host && next !== target) selection.clear();
    if (next && next.isConnected !== false && isCaretHost(next)) return;
    paletteOpen = readPaletteOpen();
    release();
  };
  const onHostResize = (entries) => {
    if (disposed || composing || !followed) return;
    if (followed.isConnected === false) {
      release();
      return;
    }
    let entry = null;
    for (const item of entries || []) if (item?.target === followed) entry = item;
    if (!entry) return;
    const size = entry.borderBoxSize?.[0] || entry.borderBoxSize;
    const box = followedBox;
    const widthSame = !!(size && box) && sameSize(size.inlineSize, box.width);
    if (widthSame && sameSize(size.blockSize, box.height)) return;
    if (!widthSame) measurer.invalidate?.();
    if (documentRef.activeElement !== followed) return;
    measureAndApply(followed, false);
  };
  const RO = resizeObserverClass(windowRef);
  if (RO) {
    try {
      resizeObserver = new RO(onHostResize);
    } catch {
      resizeObserver = null;
    }
  }
  const onInput = () => {
    if (composing) return;
    schedule(true);
  };
  const onCompositionStart = (event) => {
    const target = event?.target || documentRef.activeElement;
    if (!target || !isCaretHost(target) && target !== active) return;
    composing = true;
    hide();
  };
  const onCompositionEnd = () => {
    if (!composing) return;
    composing = false;
    schedule(true);
  };
  const onRefreshEvent = (event) => {
    if (composing) return;
    if (frame) {
      framePing = true;
      return;
    }
    const target = documentRef.activeElement;
    if (target === lastEl && computeSig(target) === lastSig) {
      if (event?.type === "mouseup" && target === active) restartBlink();
      return;
    }
    schedule(true);
  };
  const SCROLL_OPTS = { capture: true, passive: true };
  const PASSIVE_OPTS = { passive: true };
  const onScrollOrResize = (event) => {
    if (disposed) return;
    const target = documentRef.activeElement || active;
    if (!target || !isCaretHost(target)) return;
    if (paletteOpen && !(target === paletteFor && layerInPalette)) return;
    const source = event?.target;
    if (source && typeof source === "object" && typeof source.nodeType === "number" && source !== documentRef) {
      const contains = typeof source.contains === "function" ? source.contains(target) : source === target;
      if (!contains) return;
    }
    schedule(false);
  };
  const onWindowBlur = () => {
    readSettings();
    if (settings.hideOnWindowBlur === false) return;
    hide();
  };
  const onWindowFocus = () => {
    schedule(true);
  };
  const onMotionChange = () => {
    reducedMotion = !!motionQuery?.matches;
    syncBlink(true);
  };
  const refresh = () => {
    cancelFrame();
    measureAndApply(documentRef.activeElement, true);
  };
  let portalObserver = null;
  const MO = observerClass(windowRef);
  if (MO && documentRef.body) {
    portalObserver = new MO((records) => {
      if (disposed) return;
      let changed = false;
      for (const record of records) {
        for (const node of record.removedNodes || []) {
          if (containsPalette(node)) {
            paletteOpen = false;
            changed = true;
          }
        }
        for (const node of record.addedNodes || []) {
          if (containsPalette(node)) {
            paletteOpen = true;
            changed = true;
          }
        }
      }
      if (active && active.isConnected === false) {
        release();
        return;
      }
      if (!changed) return;
      const target = documentRef.activeElement;
      if (!composing && target && isCaretHost(target)) schedule(true);
      else hide();
    });
    portalObserver.observe(documentRef.body, { childList: true });
  }
  const docListeners = [
    ["focusin", onFocusIn, false],
    ["focusout", onFocusOut, false],
    ["input", onInput, true],
    ["compositionstart", onCompositionStart, true],
    ["compositionend", onCompositionEnd, true],
    ["selectionchange", onRefreshEvent, false],
    ["keyup", onRefreshEvent, true],
    ["mouseup", onRefreshEvent, true]
  ];
  for (const [type, fn, capture] of docListeners) {
    documentRef.addEventListener(type, fn, capture);
  }
  windowRef.addEventListener("scroll", onScrollOrResize, SCROLL_OPTS);
  windowRef.addEventListener("resize", onScrollOrResize, PASSIVE_OPTS);
  windowRef.addEventListener("blur", onWindowBlur, PASSIVE_OPTS);
  windowRef.addEventListener("focus", onWindowFocus, PASSIVE_OPTS);
  const visualViewport = windowRef.visualViewport;
  visualViewport?.addEventListener?.("scroll", onScrollOrResize, PASSIVE_OPTS);
  visualViewport?.addEventListener?.("resize", onScrollOrResize, PASSIVE_OPTS);
  motionQuery?.addEventListener?.("change", onMotionChange);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    composing = false;
    cancelFrame();
    try {
      resizeObserver?.disconnect();
    } catch {
    }
    resizeObserver = null;
    followed = null;
    followedBox = null;
    try {
      portalObserver?.disconnect();
    } catch {
    }
    portalObserver = null;
    try {
      blinkAnim?.cancel();
    } catch {
    }
    blinkAnim = null;
    for (const [type, fn, capture] of docListeners) {
      documentRef.removeEventListener(type, fn, capture);
    }
    windowRef.removeEventListener("scroll", onScrollOrResize, SCROLL_OPTS);
    windowRef.removeEventListener("resize", onScrollOrResize, PASSIVE_OPTS);
    windowRef.removeEventListener("blur", onWindowBlur, PASSIVE_OPTS);
    windowRef.removeEventListener("focus", onWindowFocus, PASSIVE_OPTS);
    visualViewport?.removeEventListener?.("scroll", onScrollOrResize, PASSIVE_OPTS);
    visualViewport?.removeEventListener?.("resize", onScrollOrResize, PASSIVE_OPTS);
    motionQuery?.removeEventListener?.("change", onMotionChange);
    restoreNativeCaret();
    selection.clear();
    overlay.remove();
    active = null;
    layerFor = null;
    paletteFor = null;
  };
  return {
    refresh,
    dispose,
    get overlay() {
      return overlay;
    },
    get active() {
      return active;
    }
  };
}

// src/studio.js
var STUDIO_CSS = `.cs-studio-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow:auto;background:rgba(16,22,26,.55);color-scheme:light}
.bp3-dark .cs-studio-overlay,.rm-dark-theme .cs-studio-overlay,.bt-theme-dark .cs-studio-overlay,.roam-body.dark .cs-studio-overlay{color-scheme:dark}
.cs-studio{position:relative;z-index:10001;width:min(560px,100%);max-height:calc(100vh - 48px);overflow:auto;box-sizing:border-box;padding:12px 14px 20px;border:1px solid rgba(127,127,127,.22);border-radius:8px;background:Canvas;color:CanvasText;box-shadow:0 12px 40px rgba(0,0,0,.18)}
.cs-studio-preview{position:sticky;top:0;z-index:1;background:Canvas;padding-bottom:8px}
.cs-demo{display:block;width:100%;box-sizing:border-box;resize:vertical;min-height:68px;padding:8px 10px;border-radius:6px;border:1px solid rgba(127,127,127,.12);background:rgba(127,127,127,.06);color:inherit;font:inherit;line-height:1.5}
.cs-toast{font-size:12px;color:rgba(127,127,127,.8)}
.cs-studio-overlay>.cs-toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:10002;padding:6px 10px;border-radius:6px;background:Canvas;border:1px solid rgba(127,127,127,.22)}
.cs-studio-row{margin:6px 0}
.cs-studio-group{margin:10px 0;padding:10px 12px}
.cs-studio-group h4{margin:0 0 8px;font-size:13px}
.cs-studio-row p{margin:4px 0;font-size:11px;opacity:.65}`;
var RERENDER_KEYS = /* @__PURE__ */ new Set([
  "cursorStyle",
  "gradientEnabled",
  "blinkingEnabled",
  "blinkBreathing",
  "smoothEnabled",
  "smoothAdaptive",
  "smear",
  "smearTaper",
  "popLetters",
  "flameTrail",
  "thunderstrike",
  "stardustEnabled",
  "stardustAlwaysOn",
  "stardustOrbit",
  "speedDemon",
  "speedDemonSparks",
  "energyEffect",
  "crtEffect",
  "selectionColorEnabled",
  "rowTypeTint",
  "idleFadeEnabled",
  "ghostEnabled",
  "comboEnabled",
  "shakeEnabled",
  "soundEnabled",
  "torchEffect",
  "overlayBlinkSync",
  "boxHollow"
]);
var PROP_ATTRS = /* @__PURE__ */ new Set(["value", "checked", "selected"]);
var HEX6 = /^#[0-9a-fA-F]{6}$/;
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else if (k === "onClick" || k === "onChange" || k === "onInput") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (PROP_ATTRS.has(k)) el[k] = v;
      else if (typeof v === "boolean") {
        if (v) el.setAttribute(k, "");
      } else if (v != null) el.setAttribute(k, String(v));
    }
  }
  for (const child of children.flat().filter((c) => c != null)) {
    if (typeof child === "string" || typeof child === "number") el.appendChild(document.createTextNode(String(child)));
    else el.appendChild(child);
  }
  return el;
}
function sub(children) {
  return h("div", { class: "cs-studio-sub", style: "margin-left:18px;margin-top:2px" }, children);
}
function note(text) {
  return h("p", null, text);
}
function row(...kids) {
  return h("div", { class: "cs-studio-row" }, kids);
}
function pct(v) {
  return Math.round(v * 100) + "%";
}
function fmtMul(v) {
  return v.toFixed(1) + "×";
}
function gradientColors(s, hexFn) {
  const n = Math.max(2, Math.min(4, Math.round(s.gradientCount || 2)));
  const out = [];
  for (let i = 1; i <= n; i++) out.push(hexFn("gradientDark" + i, `Dark ${i}`));
  for (let i = 1; i <= n; i++) out.push(hexFn("gradientLight" + i, `Light ${i}`));
  return out;
}
function renderStudio(root, ctl) {
  const s = ctl.settings;
  const check = (key, label, desc) => {
    const input = h("input", {
      type: "checkbox",
      class: "bp3-control-input",
      checked: !!s[key],
      onChange: (e) => {
        ctl.set({ [key]: e.target.checked });
        if (RERENDER_KEYS.has(key)) ctl.rerender();
      }
    });
    const labelEl = h("label", { class: "bp3-control bp3-switch" }, input, h("span", { class: "bp3-control-indicator" }), label);
    if (desc) return row(labelEl, note(desc));
    return row(labelEl);
  };
  const num = (key, label, { min, max, step, unit }) => {
    const input = h("input", {
      type: "number",
      class: "bp3-input",
      value: Number(s[key]),
      min,
      max,
      step,
      onInput: (e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) ctl.setLive({ [key]: v });
      },
      onChange: (e) => ctl.set({ [key]: Number(e.target.value) })
    });
    const bits = [label, input];
    if (unit) bits.push(" " + unit);
    return row(...bits);
  };
  const range = (key, label, { min, max, step, format }) => {
    const input = h("input", {
      type: "range",
      class: "bp3-input",
      value: Number(s[key]),
      min,
      max,
      step,
      onInput: (e) => ctl.setLive({ [key]: Number(e.target.value) }),
      onChange: (e) => ctl.set({ [key]: Number(e.target.value) })
    });
    const val = format ? format(Number(s[key])) : String(s[key]);
    return row(label, " ", val, input);
  };
  const hex = (key, label) => {
    const text = h("input", {
      type: "text",
      class: "bp3-input",
      value: s[key] || "",
      onChange: (e) => {
        const value = String(e.target.value || "").trim();
        if (HEX6.test(value)) ctl.set({ [key]: value });
      }
    });
    const picker = h("input", {
      type: "color",
      value: s[key] || "#000000",
      onChange: (e) => {
        text.value = e.target.value;
        ctl.set({ [key]: e.target.value });
      }
    });
    return row(label, picker, text);
  };
  const select = (key, items) => {
    const sel = h("select", {
      onChange: (e) => {
        ctl.set({ [key]: e.target.value });
        if (RERENDER_KEYS.has(key)) ctl.rerender();
      }
    }, items.map((item) => h("option", { value: item.value, selected: s[key] === item.value }, item.label)));
    return row(h("div", { class: "bp3-html-select" }, sel));
  };
  const group = (title, children) => h("div", { class: "bp3-card cs-studio-group" }, h("h4", { class: "bp3-heading" }, title), ...children.filter(Boolean));
  const button = (label, onClick) => h("button", { type: "button", class: "bp3-button bp3-minimal bp3-small", onClick }, label);
  const prev = root.querySelector(".cs-demo");
  const prevValue = prev ? prev.value : "";
  const prevFocused = !!prev && root.ownerDocument.activeElement === prev;
  const prevStart = prev ? prev.selectionStart : 0;
  const prevEnd = prev ? prev.selectionEnd : 0;
  const demo = h("textarea", {
    class: "cs-demo",
    rows: "3",
    spellcheck: "false",
    "aria-label": "Cursor preview",
    placeholder: "Type here to see your cursor…\nPress Enter for Thunderstrike."
  });
  if (prevValue) demo.value = prevValue;
  const shapeItems = (ENUMS.cursorStyle.includes("Beam") ? ["Beam", "Line", "Box", "Underline"] : ["Line", "Box", "Underline"]).map((v) => ({ value: v, label: v }));
  const caretBody = [
    select("cursorStyle", shapeItems),
    num("caretWidthPx", "Thickness", { min: 1, max: 12, step: 0.5, unit: "px" }),
    range("cursorOpacity", "Opacity", { min: 0.1, max: 1, step: 0.01, format: (v) => pct(v) }),
    check("glow", "Glow", "Soft halo around the caret."),
    s.cursorStyle === "Box" ? check("boxHollow", "Hollow", "Outline only, no fill.") : null,
    s.cursorStyle === "Box" && s.boxHollow ? sub([num("boxHollowWidth", "Outline width", { min: 1, max: 8, step: 0.5, unit: "px" })]) : null,
    s.cursorStyle === "Box" && !s.boxHollow ? check("showChar", "Show the letter inside", "Draws the character under the cursor in inverted colour.") : null,
    s.cursorStyle === "Line" ? check("lineSerifs", "Serifs", "Caps on the stem — the classic I-beam.") : null,
    s.cursorStyle === "Underline" ? num("underlineWidthPx", "Bar thickness", { min: 0, max: 12, step: 0.5, unit: "px" }) : null,
    s.cursorStyle === "Underline" ? note("0 scales the bar with the line height.") : null
  ];
  const colorBody = [
    check("gradientEnabled", "Gradient", "Paint the cursor with a colour ramp instead of one flat colour."),
    ...s.gradientEnabled ? [
      num("gradientCount", "Number of stops", { min: 2, max: 4, step: 1 }),
      note("Set gradient stops by hand below."),
      ...gradientColors(s, hex)
    ] : [
      hex("colorDark", "Dark theme"),
      hex("colorLight", "Light theme")
    ]
  ];
  const blinkBody = [
    check("blinkingEnabled", "Blinking"),
    ...s.blinkingEnabled ? [sub([
      range("blinkSpeed", "Speed", { min: 0.1, max: 5, step: 0.1, format: fmtMul }),
      range("blinkOnOffBalance", "Balance", { min: 0.1, max: 0.9, step: 0.01, format: (v) => pct(v) + " lit" }),
      num("blinkDelayMs", "Delay after typing", { min: 0, max: 5e3, step: 50, unit: "ms" }),
      note("How long the cursor stays fully lit after any move or keystroke before blinking resumes."),
      check("blinkBreathing", "Breathing", "Shrink and swell instead of fading out, so the cursor never disappears."),
      s.blinkBreathing ? sub([range("blinkBreathDepth", "Breath depth", { min: 0.05, max: 0.5, step: 0.01, format: pct })]) : null
    ])] : [],
    check("hideNativeCaret", "Hide Roam's native caret", "Turn this off to see both at once — useful when diagnosing alignment."),
    check("hideOnWindowBlur", "Hide when the window loses focus", "What every other writing app does.")
  ];
  const smoothBody = [
    check("smoothEnabled", "Smooth movement", "The cursor glides between positions instead of jumping."),
    ...s.smoothEnabled ? [sub([
      range("smoothness", "Glide", { min: 0.05, max: 0.3, step: 0.01, format: pct }),
      range("catchUpSpeed", "Catch-up speed", { min: 0.3, max: 0.8, step: 0.01, format: pct }),
      check("smoothAdaptive", "Speed up when typing fast"),
      s.smoothAdaptive ? sub([range("maxCatchUpSpeed", "Max catch-up", { min: 0.5, max: 1, step: 0.01, format: pct })]) : null,
      check("smoothStopBlinking", "Don't blink while typing")
    ])] : [],
    check("snapOnNewline", "Snap across line breaks", "Jump to the new line instead of sweeping diagonally through the text between."),
    num("moveDelayMs", "Movement delay", { min: 0, max: 400, step: 10, unit: "ms" })
  ];
  const smearBody = [
    check("smear", "Motion smear", "The cursor stretches along its line of travel."),
    ...s.smear ? [sub([
      range("smearStiffness", "Stiffness", { min: 0.05, max: 1, step: 0.01, format: pct }),
      range("smearTrailingStiffness", "Trailing stiffness", { min: 0.05, max: 1, step: 0.01, format: pct }),
      range("smearDamping", "Damping", { min: 0.1, max: 1, step: 0.01, format: pct }),
      check("smearTaper", "Tapered trail", "Narrow the trailing end to a point, like a comet tail."),
      s.smearTaper ? sub([range("smearTaperAmount", "Taper amount", { min: 0, max: 1, step: 0.01, format: pct })]) : null
    ])] : []
  ];
  const effectsBody = [
    check("popLetters", "Popping letters", "Typed characters fly off the cursor."),
    s.popLetters ? sub([check("popRainbow", "Rainbow", "Step each letter through the colour wheel.")]) : null,
    check("flameTrail", "Pixel trail", "A burst of fading pixels every time the cursor moves."),
    ...s.flameTrail ? [sub([
      check("backspaceDisintegrate", "Backspace disintegration", "Deleting throws the pixels outward in inverted colours."),
      check("thunderstrike", "Thunderstrike", "Enter calls down a bolt of pixelated lightning onto the new line."),
      ...s.thunderstrike ? [sub([
        num("thunderstrikeSize", "Bolt size", { min: 1, max: 8, step: 1, unit: "px" }),
        range("thunderstrikeStrength", "Strength", { min: 0.1, max: 1, step: 0.01, format: pct })
      ])] : []
    ])] : [],
    check("stardustEnabled", "Stardust", "A slow stream of drifting, fading motes."),
    ...s.stardustEnabled ? [sub([
      check("stardustAlwaysOn", "Always on", "Stream continuously instead of only while idle."),
      s.stardustAlwaysOn ? null : num("stardustDelayMs", "Idle delay", { min: 0, max: 1e4, step: 100, unit: "ms" }),
      range("stardustRate", "Density", { min: 0.2, max: 3, step: 0.1, format: fmtMul }),
      check("stardustOrbit", "Orbit", "Motes circle the cursor like fireflies instead of drifting up."),
      s.stardustOrbit ? sub([num("stardustOrbitRadius", "Orbit radius", { min: 6, max: 80, step: 1, unit: "px" })]) : null
    ])] : [],
    check("speedDemon", "Speed demon", "The cursor heats toward white-hot as you type faster."),
    ...s.speedDemon ? [sub([
      range("speedDemonSensitivity", "Sensitivity", { min: 0.5, max: 2, step: 0.1, format: fmtMul }),
      check("speedDemonSparks", "Fire sparks", "Throw embers off the cursor at high heat."),
      ...s.speedDemonSparks ? [sub([
        range("speedDemonSparkQuantity", "Spark quantity", { min: 0, max: 3, step: 0.1, format: fmtMul }),
        num("speedDemonSparkTrail", "Spark trail", { min: 0, max: 30, step: 1, unit: "px" })
      ])] : []
    ])] : [],
    check("energyEffect", "Energy beam", "A brightness wave travelling along the cursor."),
    ...s.energyEffect ? [sub([
      range("energySpeed", "Beam speed", { min: 0.2, max: 3, step: 0.1, format: fmtMul }),
      s.gradientEnabled ? check("energyAurora", "Aurora", "Warp and cross-mix the gradient instead of scrolling it rigidly.") : note("Turn Gradient on for the Aurora variant.")
    ])] : [],
    check("crtEffect", "CRT effect", "A phosphor trail behind the cursor, and the glow halo."),
    ...s.crtEffect ? [sub([
      num("trailLength", "Trail length", { min: 1, max: 40, step: 1 }),
      num("trailFadeMs", "Trail fade", { min: 80, max: 2e3, step: 10, unit: "ms" })
    ])] : []
  ];
  const contextBody = [
    check("selectionColorEnabled", "Selection colour", "Switch colour while text is selected."),
    ...s.selectionColorEnabled ? [sub([
      hex("selectionColorDark", "Dark theme"),
      hex("selectionColorLight", "Light theme")
    ])] : [],
    check("rowTypeTint", "Tint by row type", "Headings, tasks, code and quotes each shift the cursor's hue."),
    ...s.rowTypeTint ? [sub([
      range("rowTypeTintAmount", "Shift", { min: 0, max: 180, step: 5, format: (v) => v + "°" }),
      note("Plain text keeps your colour; every other row type moves away from it.")
    ])] : []
  ];
  const idleBody = [
    check("idleFadeEnabled", "Fade when idle", "Dim the cursor after you stop typing."),
    ...s.idleFadeEnabled ? [sub([
      num("idleFadeDelayMs", "After", { min: 500, max: 3e4, step: 250, unit: "ms" }),
      range("idleFadeTo", "Fade to", { min: 0, max: 0.9, step: 0.01, format: pct })
    ])] : [],
    check("ghostEnabled", "Ghost cursor", "A second, fainter cursor trailing behind the real one."),
    ...s.ghostEnabled ? [sub([
      range("ghostOpacity", "Ghost opacity", { min: 0.05, max: 0.8, step: 0.01, format: pct }),
      range("ghostLag", "Catch-up", { min: 0.01, max: 0.3, step: 0.01, format: pct })
    ])] : []
  ];
  const feedbackBody = [
    check("comboEnabled", "Combo", "Sustained typing streaks escalate the cursor."),
    ...s.comboEnabled ? [sub([
      num("comboThreshold", "Full combo at", { min: 5, max: 100, step: 1, unit: " keys" }),
      check("comboGlow", "Glow with the streak"),
      check("comboShower", "Throw sparks at high streak"),
      note("A streak resets after about a second without typing.")
    ])] : [],
    check("shakeEnabled", "Shake on delete", "A short kick when you press Backspace or Delete."),
    ...s.shakeEnabled ? [sub([
      range("shakeStrength", "Strength", { min: 0.5, max: 12, step: 0.5, format: (v) => v + "px" }),
      num("shakeDurationMs", "Duration", { min: 60, max: 600, step: 10, unit: "ms" })
    ])] : [],
    check("soundEnabled", "Typewriter sound", "A synthesised click on every keystroke."),
    ...s.soundEnabled ? [sub([
      range("soundVolume", "Volume", { min: 0.01, max: 1, step: 0.01, format: pct }),
      range("soundPitch", "Pitch", { min: 0.4, max: 2.5, step: 0.05, format: (v) => v.toFixed(2) + "×" }),
      range("soundVariation", "Variation", { min: 0, max: 1, step: 0.01, format: pct }),
      note("Never included when you roll a random look — a surprise noise is not consent.")
    ])] : []
  ];
  const torchBody = [
    check("torchEffect", "Torch spotlight", "Darken the panel except for a pool of light around the cursor."),
    ...s.torchEffect ? [sub([
      select("overlayFollowMode", [
        { value: "caret", label: "Follow cursor" },
        { value: "mouse", label: "Follow pointer" },
        { value: "auto", label: "Auto" }
      ]),
      num("overlayRadius", "Light size", { min: 60, max: 900, step: 10, unit: "px" }),
      range("overlayDarkness", "Darkness", { min: 0, max: 1, step: 0.01, format: pct }),
      range("overlayIntensity", "Warmth", { min: 0, max: 1, step: 0.01, format: pct }),
      hex("overlayColor", "Light colour"),
      range("overlaySpeed", "Follow speed", { min: 0.02, max: 1, step: 0.01, format: pct }),
      check("overlayBlinkSync", "Blink sync", "The light breathes with the cursor's blink."),
      s.overlayBlinkSync ? sub([range("overlayBlinkDepth", "Blink depth", { min: 0.05, max: 0.6, step: 0.01, format: pct })]) : null
    ])] : []
  ];
  const resetBody = [
    row(button("Random look", () => ctl.randomize()), button("Reset to defaults", () => ctl.resetLook()))
  ];
  const built = [
    group("Preview", [h("div", { class: "cs-studio-preview" }, demo, note("Nothing typed here is saved."))]),
    group("Caret", caretBody),
    group("Colour", colorBody),
    group("Blinking", blinkBody),
    group("Smooth movement", smoothBody),
    group("Motion smear", smearBody),
    group("After effects", effectsBody),
    group("Context", contextBody),
    group("Idle & ghost", idleBody),
    group("Feedback", feedbackBody),
    group("Torch", torchBody),
    group("Reset", resetBody)
  ];
  if (typeof root.replaceChildren === "function") root.replaceChildren(...built);
  else {
    while (root.firstChild) root.removeChild(root.firstChild);
    for (const child of built) root.appendChild(child);
  }
  if (prevFocused) {
    try {
      demo.focus({ preventScroll: true });
      demo.setSelectionRange(prevStart, prevEnd);
    } catch {
    }
  }
}

// src/extension.js
var VERSION = "0.6.0";
var CANVAS_Z_INDEX = 40;
var VERSION_FLAG = "__ROAM_CURSOR_SMITH_VERSION";
var DIAG_FLAG = "__ROAM_CARET_DIAG";
var DIAG_RING = 20;
var HEX62 = /^#[0-9a-fA-F]{6}$/;
var MAX_PRESET_NAME = 48;
var activeLifecycle = null;
var runtime = null;
var engineModule = null;
var engineLoadPromise = null;
async function loadCursorEngine() {
  if (engineModule) return engineModule;
  if (!engineLoadPromise) {
    engineLoadPromise = import("./engine.js").then((mod) => {
      engineModule = mod;
      return mod;
    }).catch((err) => {
      console.error("[roam-caret] failed to load canvas engine:", err);
      engineLoadPromise = null;
      return null;
    });
  }
  return engineLoadPromise;
}
function isMobileHost(extensionAPI) {
  try {
    if (globalThis.roamAlphaAPI?.platform?.isMobile) return true;
  } catch {
  }
  try {
    if (extensionAPI?.platform?.isMobile) return true;
  } catch {
  }
  return false;
}
function canStartLite() {
  return typeof document !== "undefined" && !!document.body && typeof document.createElement === "function";
}
function canStartEngine() {
  return canStartLite() && typeof requestAnimationFrame === "function";
}
function lookKey(snap) {
  return JSON.stringify(pickLook(snap));
}
function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function isReservedName(name) {
  return name === "Custom" || name === "Current" || hasOwn(BUILTIN_PRESETS, name);
}
function uniquePresetName(name, snap, presets = {}) {
  const key = lookKey(snap);
  const free = (candidate) => {
    if (candidate === "Custom" || hasOwn(BUILTIN_PRESETS, candidate)) return false;
    return !hasOwn(presets, candidate) || lookKey(presets[candidate]) === key;
  };
  const base = String(name || "").trim().slice(0, MAX_PRESET_NAME) || "Imported preset";
  if (free(base)) return base;
  for (let i = 2; i < 1e3; i += 1) {
    const suffix = ` ${i}`;
    const candidate = `${base.slice(0, MAX_PRESET_NAME - suffix.length).trimEnd()}${suffix}`;
    if (free(candidate)) return candidate;
  }
  return base;
}
function copyToClipboard(text) {
  try {
    const clip = globalThis.navigator?.clipboard;
    if (clip && typeof clip.writeText === "function") {
      void clip.writeText(text);
      return;
    }
  } catch {
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  } catch {
  }
}
var CursorSmithRuntime = class {
  constructor({ extensionAPI, lifecycle, mobile }) {
    this.extensionAPI = extensionAPI;
    this.lifecycle = lifecycle;
    this.mobile = mobile;
    this._settings = normalizeSettings(loadOptions(extensionAPI) ?? {});
    this._engine = null;
    this._lite = null;
    this._native = null;
    this._measurer = null;
    this._diag = null;
    this._mode = null;
    this._pumpInstalled = false;
    this._pumpListeners = [];
    this._measureCount = 0;
    this._overlay = null;
    this._panelEl = null;
    this._panelStyle = null;
    this._toastEl = null;
    this._fatalNotice = false;
    this._depotPanelReady = false;
    this._suspended = false;
    this._escapeBound = false;
    this._onEscapeKey = (ev) => this.onEscape(ev);
    this.pendingPresetName = "";
    this.lifecycle.add(() => this.teardown());
  }
  teardown() {
    this.closeSettings();
    this._unbindEscape();
    this._removePanelStyle();
    this.stopLite();
    this.stopNative();
    this.stopEngine();
    this.stopMeasurer();
    this.clearDiag();
    this.clearBodyClasses();
    try {
      delete globalThis[VERSION_FLAG];
    } catch {
      try {
        globalThis[VERSION_FLAG] = void 0;
      } catch {
      }
    }
  }
  clearBodyClasses() {
    try {
      document.body?.classList?.remove(BODY_ACTIVE_CLASS, BODY_HIDE_NATIVE_CLASS);
    } catch {
    }
  }
  applyBodyClasses() {
    const live = (!!this._engine || !!this._lite || !!this._native) && !!this._settings.enabled && !this.mobile;
    try {
      document.body?.classList?.toggle(BODY_ACTIVE_CLASS, live);
      document.body?.classList?.toggle(
        BODY_HIDE_NATIVE_CLASS,
        live && !!this._settings.hideNativeCaret && !this._native
      );
    } catch {
    }
  }
  ensureDiag() {
    if (this._diag) return this._diag;
    const runtime2 = this;
    this._diag = {
      measureCount: 0,
      measures: [],
      // Bench kill switch: detaches every listener, observer, frame and the
      // blink, and hides the caret. Nothing is persisted or written.
      suspend: () => runtime2.suspend(),
      resume: () => runtime2.resume(),
      get suspended() {
        return runtime2._suspended;
      }
    };
    try {
      (typeof document !== "undefined" && document.defaultView || globalThis)[DIAG_FLAG] = this._diag;
    } catch {
    }
    return this._diag;
  }
  // Milliseconds for one whole caret update: measure plus every style write.
  recordTiming(ms) {
    const diag = this.ensureDiag();
    diag.measures.push(ms);
    if (diag.measures.length > DIAG_RING) diag.measures.shift();
  }
  clearDiag() {
    this._diag = null;
    try {
      const win = typeof document !== "undefined" && document.defaultView || globalThis;
      delete win[DIAG_FLAG];
    } catch {
    }
  }
  ensureMeasurer() {
    if (this._measurer || typeof document === "undefined") return;
    try {
      this._measurer = createCaretMeasurer({
        doc: document,
        win: document.defaultView || globalThis,
        lifecycle: this.lifecycle
      });
      const inner = this._measurer.measure.bind(this._measurer);
      const diag = this.ensureDiag();
      this._measurer.measure = (el) => {
        this._measureCount += 1;
        diag.measureCount += 1;
        return inner(el);
      };
    } catch (err) {
      console.error("[roam-caret] measurer failed to start:", err);
      this._measurer = null;
    }
  }
  stopMeasurer() {
    try {
      this._measurer?.dispose();
    } catch {
    }
    this._measurer = null;
  }
  _bindPumpListener(target, type, fn, capture) {
    target.addEventListener(type, fn, capture);
    this._pumpListeners.push({ target, type, fn, capture: !!capture });
  }
  ensurePump() {
    if (this._pumpInstalled || typeof document === "undefined") return;
    const now = globalThis.performance?.now?.bind(globalThis.performance);
    const pump = () => {
      try {
        const el = document.activeElement;
        if (!this._measurer || !el) return;
        const start = now ? now() : null;
        this._measurer.measure(el);
        if (start != null) this.recordTiming(now() - start);
      } catch {
      }
    };
    this._pumpInstalled = true;
    this._bindPumpListener(document, "focusin", pump, true);
    this._bindPumpListener(document, "input", pump, true);
    this._bindPumpListener(document, "selectionchange", pump, false);
    this._bindPumpListener(document, "keyup", pump, true);
    const win = document.defaultView || globalThis;
    if (typeof win?.addEventListener === "function") {
      this._bindPumpListener(win, "scroll", pump, true);
      this._bindPumpListener(win, "resize", pump, false);
    }
  }
  stopPump() {
    if (!this._pumpInstalled) return;
    for (const { target, type, fn, capture } of this._pumpListeners) {
      try {
        target.removeEventListener(type, fn, capture);
      } catch {
      }
    }
    this._pumpListeners = [];
    this._pumpInstalled = false;
  }
  startLite() {
    if (this.mobile || !this._settings.enabled || this._lite || !canStartLite()) return;
    this.ensureMeasurer();
    if (!this._measurer) return;
    try {
      this._lite = installLiteCaret({
        doc: document,
        win: document.defaultView || globalThis,
        measurer: this._measurer,
        lifecycle: this.lifecycle,
        getSettings: () => this._settings,
        recordTiming: (ms) => this.recordTiming(ms)
      });
      this._lite.refresh();
      this.applyBodyClasses();
    } catch (err) {
      console.error("[roam-caret] lite caret failed to start:", err);
      this.stopLite();
    }
  }
  stopLite() {
    if (!this._lite) {
      this.applyBodyClasses();
      return;
    }
    try {
      this._lite.dispose();
    } catch {
    }
    this._lite = null;
    this.applyBodyClasses();
  }
  startNative() {
    if (this.mobile || !this._settings.enabled || this._native || !canStartLite()) return;
    try {
      this._native = installNativeCaret({
        doc: document,
        win: document.defaultView || globalThis,
        getSettings: () => this._settings
      });
    } catch (err) {
      console.error("[roam-caret] native caret failed to start:", err);
      this._native = null;
    }
    this.applyBodyClasses();
  }
  stopNative() {
    if (this._native) {
      try {
        this._native.dispose();
      } catch {
      }
      this._native = null;
    }
    this.applyBodyClasses();
  }
  async startEngine() {
    if (this.mobile || !this._settings.enabled || this._engine || !canStartEngine()) return !!this._engine;
    if (!needsCanvas(this._settings)) return false;
    const ticket = this._engineTicket = (this._engineTicket || 0) + 1;
    this.ensureMeasurer();
    this.ensurePump();
    try {
      const mod = await loadCursorEngine();
      if (ticket !== this._engineTicket || !needsCanvas(this._settings) || this._engine) return false;
      if (!mod?.CursorEngine) return false;
      this._engine = new mod.CursorEngine({
        settings: this._settings,
        doc: document,
        zIndex: CANVAS_Z_INDEX,
        measurer: this._measurer,
        onFatal: (err) => this.engineFailed(err)
      });
      this._engine.start();
      this.applyBodyClasses();
      return true;
    } catch (err) {
      console.error("[roam-caret] engine failed to start:", err);
      this.stopEngine();
      return false;
    }
  }
  stopEngine() {
    this._engineTicket = (this._engineTicket || 0) + 1;
    if (this._engine) {
      try {
        this._engine.stop();
      } catch {
      }
      this._engine = null;
    }
    this.stopPump();
    this.applyBodyClasses();
  }
  engineFailed(err) {
    console.error("[roam-caret] engine stopped after repeated frame errors:", err);
    this.stopEngine();
    this.clearBodyClasses();
    if (this._fatalNotice) return;
    this._fatalNotice = true;
    const palette = this.extensionAPI?.ui?.commandPalette;
    if (palette) {
      void this.lifecycle.command(palette, {
        label: "Roam Caret: engine stopped (see console)",
        callback: () => this.openSettings()
      }).catch((error) => console.error(error));
    }
  }
  suspend() {
    if (this._suspended) return false;
    this._suspended = true;
    this.stopLite();
    this.stopNative();
    this.stopEngine();
    this.stopMeasurer();
    this._unbindEscape();
    this.applyBodyClasses();
    return true;
  }
  resume() {
    if (!this._suspended) return false;
    this._suspended = false;
    if (this._overlay?.isConnected) this._bindEscape();
    this.applySettings();
    return true;
  }
  applySettings() {
    if (this._suspended) return;
    if (this.mobile || !this._settings.enabled) {
      this.stopLite();
      this.stopNative();
      this.stopEngine();
      this._mode = "off";
      return;
    }
    let nextMode = "lite";
    if (needsCanvas(this._settings)) nextMode = "canvas";
    else if (isPlainLine(this._settings)) nextMode = "native";
    const wasCanvas = this._mode === "canvas";
    if (this._mode && this._mode !== "off" && wasCanvas !== (nextMode === "canvas")) {
      this.toast(nextMode === "canvas" ? "Canvas mode: effects on" : "Lite mode");
    }
    this._mode = nextMode;
    if (nextMode === "canvas") {
      this.stopLite();
      this.stopNative();
      if (!this._engine) {
        this._engineStart = this.startEngine().then((ok) => {
          if (!ok && needsCanvas(this._settings) && !this._engine) {
            this._mode = "lite";
            this.startLite();
          }
          this.applyBodyClasses();
          return ok;
        });
      } else {
        this._engine.setSettings(this._settings);
      }
    } else if (nextMode === "native") {
      this.stopEngine();
      this.stopLite();
      this.stopMeasurer();
      if (!this._native) this.startNative();
      else this._native.refresh();
    } else {
      this.stopEngine();
      this.stopNative();
      if (!this._lite) this.startLite();
      else this._lite.refresh();
    }
    this.applyBodyClasses();
  }
  _depotIdsForPatch(patch) {
    const ids = [];
    for (const [depotId, blobKey] of Object.entries(MIRROR)) {
      if (Object.prototype.hasOwnProperty.call(patch, blobKey)) ids.push(depotId);
    }
    return ids;
  }
  depotPanelConfig() {
    return buildDepotPanel({
      settings: this._settings,
      builtinNames: Object.keys(BUILTIN_PRESETS),
      userNames: Object.keys(this._settings.presets || {}),
      React: globalThis.window?.React || globalThis.React,
      handlers: {
        onChange: (id, raw) => this.setFromDepot(id, raw),
        onSaveStyle: () => this.saveStyle(),
        onCopyCode: () => this.copyShareCode(),
        onImport: () => this.importShareCode(),
        onStudio: () => this.openSettings()
      }
    });
  }
  async rebuildPanel() {
    await mirrorToDepot(this.extensionAPI, this._settings);
    if (!this._depotPanelReady) return;
    await this.lifecycle.settingsPanel(this.extensionAPI, this.depotPanelConfig());
  }
  async setFromDepot(id, raw) {
    if (id === "cs-import-code") {
      await this.extensionAPI.settings.set("cs-import-code", raw);
      return;
    }
    if (id === STYLE_NAME_ID) {
      await this.extensionAPI.settings.set(STYLE_NAME_ID, String(raw ?? ""));
      return;
    }
    if (id === SAVED_STYLES_ID) {
      const name = String(raw ?? "");
      await this.extensionAPI.settings.set(SAVED_STYLES_ID, SAVED_STYLES_PROMPT);
      const snap = hasOwn(this._settings.presets, name) ? this._settings.presets[name] : null;
      if (snap) this._set({ ...pickLook(snap), activePreset: name });
      return;
    }
    if (!(id in MIRROR)) return;
    const blobKey = MIRROR[id];
    if (id === "cs-preset") {
      if (raw === "Custom") {
        this._set({ activePreset: "" });
      } else {
        const snap = BUILTIN_PRESETS[raw] ?? this._settings.presets?.[raw];
        if (snap) this._set({ ...pickLook(snap), activePreset: raw });
      }
      return;
    }
    if (id === "cs-color-light" || id === "cs-color-dark") {
      raw = String(raw ?? "").trim();
      if (!HEX62.test(raw)) return;
    }
    const patch = id === "cs-width" ? { [blobKey]: Number(raw) } : { [blobKey]: raw };
    this._set(patch);
    await mirrorToDepot(this.extensionAPI, this._settings, [id]);
  }
  styleName() {
    return String(this.extensionAPI.settings.get(STYLE_NAME_ID) ?? "").trim().slice(0, MAX_PRESET_NAME);
  }
  _setStyleName(name) {
    if (this.extensionAPI.settings.get(STYLE_NAME_ID) === name) return null;
    return this.extensionAPI.settings.set(STYLE_NAME_ID, name);
  }
  // A named look shares its name; a Custom look shares Style name, else its shape.
  shareName() {
    if (this._settings.activePreset) return this._settings.activePreset;
    const typed = this.styleName();
    if (typed && typed !== "Custom" && typed !== "Current") return typed;
    return this._settings.cursorStyle || "Box";
  }
  // Saves the current look under Style name (empty: the shape). An existing
  // saved style of that name is overwritten; built-in names are refused.
  async saveStyle() {
    const name = this.styleName() || this._settings.cursorStyle || "Box";
    if (isReservedName(name)) {
      this.toast(`"${name}" is already a Roam Caret look. Pick another style name.`);
      return null;
    }
    const presets = this._settings.presets || {};
    if (!hasOwn(presets, name) && Object.keys(presets).length >= MAX_PRESETS) {
      this.toast(`Roam Caret keeps ${MAX_PRESETS} saved styles. Save over an existing name.`);
      return null;
    }
    await this._setStyleName(name);
    this._set({ activePreset: name, presets: { ...presets, [name]: pickLook(this._settings) } });
    this.toast(`Saved "${name}".`);
    return name;
  }
  copyShareCode() {
    const code = presetToCode(this.shareName(), pickLook(this._settings));
    copyToClipboard(code);
    this.toast("Share code copied.");
    return code;
  }
  async importShareCode() {
    const code = this.extensionAPI.settings.get("cs-import-code");
    const decoded = codeToPreset(code);
    if (!decoded) {
      this.toast("Could not import that code");
      return;
    }
    const { snap } = decoded;
    const builtin = BUILTIN_PRESETS[decoded.name];
    if (builtin && lookKey(builtin) === lookKey(snap)) {
      await this._setStyleName(decoded.name);
      this._set({ ...snap, activePreset: decoded.name });
    } else {
      const name = uniquePresetName(decoded.name, snap, this._settings.presets);
      const presets = { ...this._settings.presets || {}, [name]: snap };
      await this._setStyleName(name);
      this._set({ ...snap, activePreset: name, presets });
    }
    await this.extensionAPI.settings.set("cs-import-code", "");
    this.toast(`Imported "${this._settings.activePreset}".`);
  }
  _matchesActivePreset(settings) {
    const name = settings.activePreset;
    const snap = BUILTIN_PRESETS[name] ?? settings.presets?.[name];
    return !!snap && lookKey(snap) === lookKey(settings);
  }
  _set(patch) {
    this._settings = normalizeSettings({ ...this._settings, ...patch });
    const depotIds = this._depotIdsForPatch(patch);
    if (this._settings.activePreset && !hasOwn(patch, "activePreset") && !this._matchesActivePreset(this._settings)) {
      this._settings.activePreset = "";
      if (!depotIds.includes("cs-preset")) depotIds.push("cs-preset");
    }
    if (hasOwn(patch, "activePreset") && this._settings.activePreset) {
      void this._setStyleName(this._settings.activePreset);
    }
    void persistOptions(this.extensionAPI, this._settings);
    this.applySettings();
    if (depotIds.length) void mirrorToDepot(this.extensionAPI, this._settings, depotIds);
    if (this._depotPanelReady) void this.rebuildPanel();
  }
  _setLive(patch) {
    this._settings = { ...this._settings, ...patch };
    this.applySettings();
  }
  toast(message) {
    console.info("[roam-caret]", message);
    if (this._toastEl) this._toastEl.textContent = message;
  }
  _injectPanelStyle() {
    if (this._panelStyle?.isConnected) return;
    if (typeof document === "undefined" || !document.createElement) return;
    if (!this._panelStyle) {
      const style = document.createElement("style");
      style.setAttribute("data-cursor-smith", "studio");
      style.textContent = STUDIO_CSS;
      this._panelStyle = style;
    }
    try {
      (document.head || document.body).append(this._panelStyle);
    } catch {
    }
  }
  _removePanelStyle() {
    try {
      if (this._panelStyle?.isConnected) this._panelStyle.remove();
    } catch {
    }
    this._panelStyle = null;
  }
  openSettings() {
    if (this._overlay?.isConnected) return;
    if (typeof document === "undefined" || !document.body || !document.createElement) return;
    this._injectPanelStyle();
    const overlay = document.createElement("div");
    overlay.className = "cs-studio-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Roam Caret studio");
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) this.closeSettings();
    });
    const panelRoot = document.createElement("div");
    panelRoot.className = "cs-studio";
    const toastEl = document.createElement("div");
    toastEl.className = "cs-toast";
    overlay.append(panelRoot, toastEl);
    document.body.append(overlay);
    this._overlay = overlay;
    this._panelEl = panelRoot;
    this._toastEl = toastEl;
    if (!this._suspended) this._bindEscape();
    this.renderPanel();
  }
  // Escape is heard only while the Studio is open: no keydown listener on
  // the typing path.
  _bindEscape() {
    if (this._escapeBound || typeof document === "undefined") return;
    document.addEventListener("keydown", this._onEscapeKey, true);
    this._escapeBound = true;
  }
  _unbindEscape() {
    if (!this._escapeBound) return;
    this._escapeBound = false;
    try {
      document.removeEventListener("keydown", this._onEscapeKey, true);
    } catch {
    }
  }
  closeSettings() {
    this._unbindEscape();
    try {
      this._overlay?.remove();
    } catch {
    }
    this._overlay = null;
    this._panelEl = null;
    this._toastEl = null;
    this._removePanelStyle();
  }
  onEscape(ev) {
    if (ev.key === "Escape" && this._overlay?.isConnected) {
      ev.stopPropagation();
      this.closeSettings();
    }
  }
  renderPanel() {
    if (!this._panelEl) return;
    const plugin = this;
    try {
      renderStudio(this._panelEl, {
        version: VERSION,
        conf: {
          repository: "https://github.com/Svyk/roam-caret"
        },
        settings: this._settings,
        disabled: !this._settings.enabled,
        set: (patch) => this._set(patch),
        setLive: (patch) => this._setLive(patch),
        rerender: () => this.renderPanel(),
        randomize: () => this.randomize(),
        resetLook: () => this.resetLook(),
        toggleDisabled: (nextOn) => {
          this._set({ enabled: !!nextOn });
          this.renderPanel();
        },
        toast: (msg) => this.toast(msg),
        copyToClipboard,
        get pendingPresetName() {
          return plugin.pendingPresetName;
        },
        set pendingPresetName(v) {
          plugin.pendingPresetName = v;
        }
      });
    } catch (err) {
      console.error("[roam-caret] settings panel failed:", err);
    }
  }
  randomize() {
    this._set({ ...randomizeLook(), activePreset: "" });
    this.renderPanel();
    this.toast("Rolled a new look.");
  }
  resetLook() {
    this._set({ ...normalizePresetSnapshot(DEFAULTS), activePreset: "" });
    this.renderPanel();
    this.toast("Reset to defaults.");
  }
  toggleEnabled() {
    const next = !this._settings.enabled;
    this._set({ enabled: next });
    this.renderPanel();
    this.toast(next ? "Roam Caret on." : "Roam Caret off.");
  }
  cyclePreset() {
    const presets = this._settings.presets || {};
    const names = Object.keys(presets);
    if (!names.length) {
      this.toast("No presets saved yet.");
      return;
    }
    const idx = names.indexOf(this._settings.activePreset);
    const next = names[(idx + 1) % names.length];
    this._set({ ...pickLook(presets[next]), activePreset: next });
    this.renderPanel();
    this.toast(`Preset: ${next}`);
  }
  diagnoseCaret(ms = 5e3) {
    this._measureCount = 0;
    const describe = (el2) => {
      if (!el2 || typeof el2.getBoundingClientRect !== "function") return null;
      const r = el2.getBoundingClientRect();
      let cs = {};
      try {
        cs = getComputedStyle(el2);
      } catch {
      }
      return {
        tag: el2.tagName,
        cls: el2.className,
        id: el2.id,
        rect: {
          x: Math.round(r.left),
          y: Math.round(r.top),
          w: Math.round(r.width),
          h: Math.round(r.height)
        },
        css: {
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity
        }
      };
    };
    const log = [];
    const sample = (reason) => {
      const active = document.activeElement;
      const textarea = active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT") ? active : null;
      log.push({
        reason,
        t: Math.round(performance.now()),
        measureCount: this._measureCount,
        active: active ? describe(active) : null,
        textarea: textarea ? {
          id: textarea.id,
          cls: textarea.className,
          selectionStart: textarea.selectionStart,
          selectionEnd: textarea.selectionEnd
        } : null,
        mode: this._mode,
        parked: this._engine ? !!this._engine._parked : null,
        latest: this._measurer?.latest?.() || null,
        engine: this._engine ? {
          gear: this._engine._canvasGear,
          source: this._engine._caretSource,
          hasCaret: !!this._engine.lastActive
        } : null
      });
    };
    sample("start");
    const mo = typeof MutationObserver === "function" ? new MutationObserver(() => {
      if (log.length < 60) sample("mutation");
    }) : null;
    try {
      mo?.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true
      });
    } catch {
    }
    const onKey = () => {
      if (log.length < 60) sample("keydown");
    };
    window.addEventListener("keydown", onKey, true);
    this.toast(`Diagnosing for ${ms / 1e3}s — click into a block and type.`);
    this.lifecycle.timeout(() => {
      try {
        mo?.disconnect();
      } catch {
      }
      window.removeEventListener("keydown", onKey, true);
      sample("end");
      const text = JSON.stringify(log, null, 2);
      console.log("[roam-caret] caret diagnostic\n" + text);
      copyToClipboard(text);
      this.toast(`Caret diagnostic: ${log.length} samples, copied to clipboard.`);
    }, ms);
  }
};
async function onload({ extensionAPI, extension }) {
  if (!extensionAPI) throw new TypeError("Roam did not provide extensionAPI");
  if (activeLifecycle) await activeLifecycle.dispose();
  const lifecycle = createLifecycle();
  activeLifecycle = lifecycle;
  const mobile = isMobileHost(extensionAPI);
  try {
    globalThis[VERSION_FLAG] = VERSION;
    runtime = new CursorSmithRuntime({ extensionAPI, lifecycle, mobile });
    runtime.ensureDiag();
    await mirrorToDepot(extensionAPI, runtime._settings);
    await lifecycle.settingsPanel(extensionAPI, runtime.depotPanelConfig());
    runtime._depotPanelReady = true;
    const palette = extensionAPI.ui.commandPalette;
    await lifecycle.command(palette, {
      label: "Roam Caret: Open settings",
      callback: async () => {
        const ok = await openRoamCaretSettings();
        if (!ok) runtime.toast("Open Roam Depot, then choose Roam Caret under Extension Settings.");
      }
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Studio",
      callback: () => runtime.openSettings()
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Toggle on/off",
      callback: () => runtime.toggleEnabled()
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Random look",
      callback: () => runtime.randomize()
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Cycle preset",
      callback: () => runtime.cyclePreset()
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Diagnose caret (5s)",
      callback: () => runtime.diagnoseCaret()
    });
    if (!mobile) runtime.applySettings();
    console.info(`[roam-caret] Loaded v${extension?.version || VERSION}`);
  } catch (error) {
    if (activeLifecycle === lifecycle) activeLifecycle = null;
    runtime = null;
    await lifecycle.dispose().catch((cleanupError) => console.error(cleanupError));
    throw error;
  }
  return async () => {
    if (activeLifecycle === lifecycle) activeLifecycle = null;
    runtime = null;
    await lifecycle.dispose();
  };
}
async function onunload() {
  const lifecycle = activeLifecycle;
  activeLifecycle = null;
  runtime = null;
  if (lifecycle) await lifecycle.dispose();
  try {
    delete globalThis[VERSION_FLAG];
  } catch {
  }
  try {
    document.body?.classList?.remove(BODY_ACTIVE_CLASS, BODY_HIDE_NATIVE_CLASS);
  } catch {
  }
  console.info("[roam-caret] Unloaded");
}
function getRuntime() {
  return runtime;
}
var extension_default = { onload, onunload, getRuntime };
export {
  VERSION,
  extension_default as default,
  getRuntime,
  onload,
  onunload,
  uniquePresetName
};
