/* Roam Caret v0.4.1 | MIT | generated; edit src/ */

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
  "thunderstrike"
]);
function needsCanvas(settings) {
  if (!settings) return false;
  for (const key of CANVAS_EFFECT_KEYS) {
    if (settings[key] === true) return true;
  }
  return false;
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
  if (!Object.prototype.hasOwnProperty.call(out.presets, out.activePreset)) out.activePreset = "";
  return out;
}
__name(normalizeSettings, "normalizeSettings");
function presetToCode(name, snap) {
  const payload = JSON.stringify(Object.assign({ __name: name }, snap));
  return btoa(unescape(encodeURIComponent(payload))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(presetToCode, "presetToCode");
function codeToPreset(code) {
  try {
    if (typeof code !== "string") return null;
    const trimmed = code.trim();
    if (!trimmed || trimmed.length > MAX_CODE) return null;
    const b64 = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const obj = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!obj || typeof obj !== "object") return null;
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

// src/cursor-engine.js
var __defProp2 = Object.defineProperty;
var __name2 = (target, value) => __defProp2(target, "name", { value, configurable: true });
function isTextCaretHost(el2) {
  if (!el2) return false;
  if (el2.isContentEditable) return true;
  const tag = el2.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = (el2.type || "text").toLowerCase();
    return type === "text" || type === "search" || type === "url" || type === "tel" || type === "email" || type === "number";
  }
  return false;
}
__name2(isTextCaretHost, "isTextCaretHost");
function isDesktopAppDoc(doc) {
  try {
    if (doc.body && doc.body.classList.contains("is-desktop-app")) return true;
    const win = doc.defaultView || window;
    return /electron/i.test(String(win.navigator && win.navigator.userAgent || ""));
  } catch {
    return false;
  }
}
__name2(isDesktopAppDoc, "isDesktopAppDoc");
function caretCoords(e) {
  if (!e.measurer?.latest) return null;
  const rect = e.measurer.latest();
  if (!rect) return null;
  const h = rect.height;
  const charWidth = rect.width;
  return {
    x: rect.x,
    top: rect.y,
    bottom: rect.y + h,
    h,
    w: (() => {
      const style = e.styleFor("cursorStyle");
      return style === "Line" || style === "Beam" ? e.styleFor("caretWidthPx") : charWidth;
    })(),
    actualCharWidth: charWidth,
    char: rect.glyph || "",
    textColor: rect.color || "#ffffff",
    fontSize: parseFloat(rect.fontSize) || 14,
    fontFamily: rect.fontFamily || "inherit",
    focused: true
  };
}
__name2(caretCoords, "caretCoords");
function releaseHostCaret(e) {
  const el2 = e._hostCaretEl;
  if (!el2) return;
  e._hostCaretEl = null;
  try {
    if (el2.style.getPropertyValue("caret-color") !== "transparent") return;
    const prev = e._hostCaretPrev;
    if (prev) el2.style.setProperty("caret-color", prev.value, prev.priority);
    else el2.style.removeProperty("caret-color");
  } catch {
  }
  e._hostCaretPrev = null;
}
__name2(releaseHostCaret, "releaseHostCaret");
function syncHostCaret(e, host) {
  let target = null;
  if (host && e._caretSource === "generic" && e.lastActive && isTextCaretHost(host)) {
    const type = host.tagName === "INPUT" ? String(host.type || "").toLowerCase() : "";
    const isCmdpal = !!host.closest?.(".cmdpal--dialog, .rm-command-palette, .bp3-dialog, .rm-find-or-create-wrapper");
    if (type !== "password" && !isCmdpal) target = host;
  }
  if (target === e._hostCaretEl) return;
  releaseHostCaret(e);
  if (!target) return;
  try {
    const st = target.style;
    const value = st.getPropertyValue("caret-color");
    e._hostCaretPrev = value ? { value, priority: st.getPropertyPriority("caret-color") } : null;
    st.setProperty("caret-color", "transparent");
    e._hostCaretEl = target;
  } catch {
    e._hostCaretEl = null;
    e._hostCaretPrev = null;
  }
}
__name2(syncHostCaret, "syncHostCaret");
function hexToRgba(hex, alpha) {
  let h2 = (hex || "#39ff14").replace("#", "");
  if (h2.length === 3) h2 = h2.split("").map((c) => c + c).join("");
  const int = parseInt(h2, 16) || 0;
  return `rgba(${int >> 16 & 255}, ${int >> 8 & 255}, ${int & 255}, ${alpha})`;
}
__name2(hexToRgba, "hexToRgba");
function hexToRgb2(hex) {
  let h2 = (hex || "#ff963c").replace("#", "");
  if (h2.length === 3) h2 = h2.split("").map((c) => c + c).join("");
  const n = parseInt(h2, 16) || 0;
  return `${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}`;
}
__name2(hexToRgb2, "hexToRgb");
function hexToRgbTuple(hex) {
  let h2 = (hex || "#ffffff").replace("#", "");
  if (h2.length === 3) h2 = h2.split("").map((c) => c + c).join("");
  const int = parseInt(h2, 16) || 0;
  return [int >> 16 & 255, int >> 8 & 255, int & 255];
}
__name2(hexToRgbTuple, "hexToRgbTuple");
function lighten(c, f) {
  return Math.round(c + (255 - c) * f);
}
__name2(lighten, "lighten");
function hslToRgbString(h2, s, l) {
  const hue = (h2 % 360 + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(hue / 60 % 2 - 1));
  const m = l - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hue < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (hue < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (hue < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (hue < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (hue < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }
  return `rgb(${Math.round((r1 + m) * 255)}, ${Math.round((g1 + m) * 255)}, ${Math.round((b1 + m) * 255)})`;
}
__name2(hslToRgbString, "hslToRgbString");
function invertColor(colorStr) {
  const nums = (colorStr || "").match(/[\d.]+/g);
  if (!nums || nums.length < 3) return "#000000";
  const [r, g, b] = nums.map(Number);
  return `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
}
__name2(invertColor, "invertColor");
function shiftHue(hex, degrees) {
  if (!degrees) return hex;
  const [r, g, b] = hexToRgbTuple(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return hex;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h2;
  if (max === r) h2 = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h2 = ((b - r) / d + 2) / 6;
  else h2 = ((r - g) / d + 4) / 6;
  return hslToHex((h2 * 360 + degrees) % 360, s, l);
}
__name2(shiftHue, "shiftHue");
function hslToHex(h2, s, l) {
  const str = hslToRgbString(h2, s, l);
  const [r, g, b] = (str.match(/\d+/g) || ["0", "0", "0"]).map(Number);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
__name2(hslToHex, "hslToHex");
function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}
__name2(easeInOutSine, "easeInOutSine");
function blinkAlphaAt(nowMs, speed, onOffBalance = 0.5) {
  if (speed <= 0) return 1;
  const period = 2500 / speed;
  const phase = nowMs % period / period;
  const fade = 0.15;
  const balance = Math.max(0.1, Math.min(0.9, onOffBalance));
  const hold = 1 - fade * 2;
  const p1 = hold * balance;
  const p2 = p1 + fade;
  const p3 = p2 + hold * (1 - balance);
  if (phase < p1) return 1;
  if (phase < p2) return 1 - easeInOutSine((phase - p1) / fade);
  if (phase < p3) return 0;
  return easeInOutSine((phase - p3) / fade);
}
__name2(blinkAlphaAt, "blinkAlphaAt");
function heatColor(heat, baseHex) {
  const h2 = Math.max(0, Math.min(1, heat));
  const [br, bg, bb] = hexToRgbTuple(baseHex);
  const luma = 0.299 * br + 0.587 * bg + 0.114 * bb;
  const desatMix = 0.7;
  const dim = 0.55;
  const coldR = ((1 - desatMix) * br + desatMix * luma) * dim;
  const coldG = ((1 - desatMix) * bg + desatMix * luma) * dim;
  const coldB = ((1 - desatMix) * bb + desatMix * luma) * dim;
  const warm = [255, 140, 40];
  const hot = [255, 70, 30];
  const white = [255, 240, 200];
  let r;
  let g;
  let b;
  if (h2 < 0.5) {
    const t = h2 / 0.5;
    const e = easeInOutSine(t);
    r = coldR + (warm[0] - coldR) * e;
    g = coldG + (warm[1] - coldG) * e;
    b = coldB + (warm[2] - coldB) * e;
    const nudge = 1 - Math.abs(t - 0.5) * 2;
    r = r * (1 - 0.25 * nudge) + br * 0.25 * nudge;
    g = g * (1 - 0.25 * nudge) + bg * 0.25 * nudge;
    b = b * (1 - 0.25 * nudge) + bb * 0.25 * nudge;
  } else if (h2 < 0.85) {
    const t = (h2 - 0.5) / 0.35;
    r = warm[0] + (hot[0] - warm[0]) * t;
    g = warm[1] + (hot[1] - warm[1]) * t;
    b = warm[2] + (hot[2] - warm[2]) * t;
  } else {
    const t = (h2 - 0.85) / 0.15;
    r = hot[0] + (white[0] - hot[0]) * t;
    g = hot[1] + (white[1] - hot[1]) * t;
    b = hot[2] + (white[2] - hot[2]) * t;
  }
  return `#${(1 << 24 | Math.round(r) << 16 | Math.round(g) << 8 | Math.round(b)).toString(16).slice(1)}`;
}
__name2(heatColor, "heatColor");
var THUNDER_LIFE_MS = 280;
var THUNDER_MAX_ANGLE = 0.95;
var THUNDER_MIN_REACH = 150;
var THUNDER_PASSES = 5;
var THUNDER_MAX_LIVE = 3;
var THUNDER_PALETTE = [
  [110, 165, 255],
  // blue
  [175, 120, 255],
  // purple
  [255, 95, 115],
  // red
  [255, 216, 120],
  // yellow
  [255, 255, 255]
  // white
];
var THUNDER_BANDS = 14;
function thunderRamp() {
  const pool = THUNDER_PALETTE.slice();
  const n = 2 + (Math.random() < 0.55 ? 1 : 0);
  const stops = [];
  for (let i = 0; i < n; i++) stops.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return stops;
}
__name2(thunderRamp, "thunderRamp");
function thunderColorAt(stops, t) {
  if (stops.length === 1) return stops[0];
  const p = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  const f = p - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f)
  ];
}
__name2(thunderColorAt, "thunderColorAt");
function spawnLetterParticle(e, char, anchor) {
  if (!char || !char.trim() || !anchor) return;
  let color = e.getActiveColor() || anchor.textColor;
  if (e.styleFor("popRainbow")) {
    color = hslToRgbString(e._popRainbowHue || 0, 0.85, 0.6);
    e._popRainbowHue = ((e._popRainbowHue || 0) + 33) % 360;
  }
  e.particles.push({
    char,
    x: anchor.x + (anchor.w || anchor.actualCharWidth) / 2,
    y: anchor.top,
    vx: (Math.random() - 0.5) * 120,
    vy: -150 - Math.random() * 130,
    rotation: (Math.random() - 0.5) * 4,
    alpha: 1,
    fontSize: anchor.fontSize,
    fontFamily: anchor.fontFamily,
    color,
    start: performance.now()
  });
}
__name2(spawnLetterParticle, "spawnLetterParticle");
function spawnFlamePixels(e, anchor, disintegrate = false) {
  if (!e.settings.flameTrail || !anchor) return;
  const count = disintegrate ? Math.floor(10 + Math.random() * 8) : Math.floor(6 + Math.random() * 6);
  let [r, g, b] = hexToRgbTuple(e.getActiveColor() || "#39ff14");
  if (disintegrate) {
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
  }
  const anchorW = anchor.w || anchor.actualCharWidth || 8;
  const cx = anchor.x + anchorW / 2;
  const cy = anchor.top + anchor.h / 2;
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    const pX = anchor.x + Math.random() * anchorW;
    const pY = anchor.top + Math.random() * anchor.h;
    const varR = Math.max(0, Math.min(255, r + Math.floor((Math.random() - 0.5) * 70)));
    const varG = Math.max(0, Math.min(255, g + Math.floor((Math.random() - 0.5) * 70)));
    const varB = Math.max(0, Math.min(255, b + Math.floor((Math.random() - 0.5) * 70)));
    let vx;
    let vy;
    if (disintegrate) {
      const dx = pX - cx;
      const dy = pY - cy;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 30 + Math.random() * 25;
      vx = dx / len * speed;
      vy = dy / len * speed - 10;
    } else {
      vx = (Math.random() - 0.5) * 20;
      vy = 0;
    }
    e.flamePixels.push({
      x: pX,
      y: pY,
      vx,
      vy,
      size: 2.5 + Math.random() * 3,
      color: `rgb(${varR}, ${varG}, ${varB})`,
      r: varR,
      g: varG,
      b: varB,
      alpha: 1,
      start: now
    });
  }
}
__name2(spawnFlamePixels, "spawnFlamePixels");
function maybeSpawnSpeedDemonSparks(e) {
  if (e.heat < 0.4) return;
  if (e.flamePixels.length > 120) return;
  const now = performance.now();
  const gap = 70 - 55 * e.heat;
  if (now - (e._lastSparkT || 0) < gap) return;
  e._lastSparkT = now;
  const active = e.animActive;
  if (!active) return;
  const anchorW = active.w || active.actualCharWidth || 8;
  const baseCount = 1 + Math.floor(e.heat * 3);
  const qty = Math.max(0, e.styleFor("speedDemonSparkQuantity") ?? 1);
  const count = Math.round(baseCount * qty);
  const [hr, hg, hb] = hexToRgbTuple(heatColor(Math.min(1, e.heat + 0.1), e.getBaseColor()));
  for (let i = 0; i < count; i++) {
    const pX = active.x + Math.random() * anchorW;
    const pY = active.top + Math.random() * (active.h * 0.4);
    const varR = Math.max(0, Math.min(255, hr + Math.floor((Math.random() - 0.5) * 40)));
    const varG = Math.max(0, Math.min(255, hg + Math.floor((Math.random() - 0.5) * 30)));
    const varB = Math.max(0, Math.min(255, hb + Math.floor((Math.random() - 0.5) * 20)));
    e.flamePixels.push({
      x: pX,
      y: pY,
      vx: (Math.random() - 0.5) * 12,
      vy: -20 - Math.random() * 30 - e.heat * 20,
      size: 1.5 + Math.random() * 2,
      color: `rgb(${varR}, ${varG}, ${varB})`,
      // Cached channels: the comet tail needs r/g/b at custom alphas every
      // frame, and re-parsing the formatted string per spark per frame is
      // needless when we have the numbers right here.
      r: varR,
      g: varG,
      b: varB,
      alpha: 1,
      start: now,
      // Marks this as a Speed Demon spark rather than a pixel-trail
      // particle sharing the same pool, so only these grow a tail.
      spark: true
    });
  }
}
__name2(maybeSpawnSpeedDemonSparks, "maybeSpawnSpeedDemonSparks");
function maybeSpawnComboShower(e) {
  const s = e.settings;
  if (!s.comboEnabled || !s.comboShower) return;
  if (!e.animActive) return;
  if ((e.comboLevel || 0) < 0.5) return;
  if (e.flamePixels.length > 140) return;
  const now = performance.now();
  const gap = 120 - 70 * e.comboLevel;
  if (now - (e._lastComboSparkT || 0) < gap) return;
  e._lastComboSparkT = now;
  const active = e.animActive;
  const w = active.w || active.actualCharWidth || 8;
  const [sr, sg, sb] = e.sampleRamp(Math.random());
  const count = 1 + Math.floor(e.comboLevel * 3);
  for (let i = 0; i < count; i++) {
    const dir = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 55 * e.comboLevel;
    e.flamePixels.push({
      x: active.x + Math.random() * w,
      y: active.top + Math.random() * active.h,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed - 15,
      size: 1.5 + Math.random() * 2.5,
      color: `rgb(${Math.round(sr)}, ${Math.round(sg)}, ${Math.round(sb)})`,
      r: Math.round(sr),
      g: Math.round(sg),
      b: Math.round(sb),
      alpha: 1,
      start: now
    });
  }
}
__name2(maybeSpawnComboShower, "maybeSpawnComboShower");
function stardustArmed(e) {
  const s = e.settings;
  if (!s.stardustEnabled) return false;
  if (!e.animActive) return false;
  if (s.stardustAlwaysOn) return true;
  const idleFor = performance.now() - (e._lastActivityT || 0);
  return idleFor >= Math.max(0, s.stardustDelayMs ?? 2e3);
}
__name2(stardustArmed, "stardustArmed");
function maybeSpawnStardust(e) {
  if (!stardustArmed(e)) return;
  if (e.stardust.length >= 60) return;
  const now = performance.now();
  const rate = Math.max(0.1, e.settings.stardustRate ?? 1);
  if (now - (e._lastStardustT || 0) < 320 / rate) return;
  e._lastStardustT = now;
  const active = e.animActive;
  const anchorW = active.w || active.actualCharWidth || 8;
  const [sr, sg, sb] = e.sampleRamp(Math.random());
  const vary = /* @__PURE__ */ __name2((c) => Math.max(0, Math.min(255, Math.round(c + (Math.random() - 0.5) * 50))), "vary");
  const orbit = !!e.settings.stardustOrbit;
  const meanRadius = Math.max(6, e.settings.stardustOrbitRadius ?? 22);
  e.stardust.push({
    // Across the caret's width, biased to its upper half, so motes read as
    // coming off the cursor rather than out of the line below it.
    x: active.x + Math.random() * anchorW,
    y: active.top + Math.random() * active.h * 0.6,
    vy: -8 - Math.random() * 14,
    sway: 2 + Math.random() * 5,
    swaySpeed: 0.6 + Math.random() * 0.9,
    phase: Math.random() * Math.PI * 2,
    twinkleSpeed: 2 + Math.random() * 3,
    size: 1 + Math.random() * 1.5,
    life: 2.2 + Math.random() * 2.2,
    color: `rgb(${vary(sr)}, ${vary(sg)}, ${vary(sb)})`,
    start: now,
    orbit,
    // Anchor refreshed from the live caret each frame so the swarm follows.
    // Seeded here so a mote outliving its caret keeps circling the last
    // known spot instead of jumping to the origin.
    ax: active.x + anchorW / 2,
    ay: active.top + active.h / 2,
    radius: meanRadius * (0.55 + Math.random() * 0.75),
    // Slower the wider the orbit, so the swarm isn't a rigid disc rotating
    // as one piece. Unhurried on purpose — fast reads as agitated.
    angSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.32 + Math.random() * 0.55) * (22 / meanRadius),
    wobbleSpeed: 0.5 + Math.random() * 1.2,
    // Flattened orbits read as perspective rather than flat rings.
    squash: 0.45 + Math.random() * 0.4
  });
}
__name2(maybeSpawnStardust, "maybeSpawnStardust");
function boltPath(x0, y0, x1, y1, jitter) {
  let pts = [{ x: x0, y: y0 }, { x: x1, y: y1 }];
  let amp = jitter;
  for (let pass = 0; pass < THUNDER_PASSES; pass++) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = (Math.random() - 0.5) * 2 * amp;
      next.push({ x: (a.x + b.x) / 2 + -dy / len * off, y: (a.y + b.y) / 2 + dx / len * off });
      next.push(b);
    }
    pts = next;
    amp *= 0.55;
  }
  return pts;
}
__name2(boltPath, "boltPath");
function pixelateBolt(pts, cell, seen, t0, t1) {
  const out = [];
  const segs = pts.length - 1;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / (cell * 0.7)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const gx = Math.round((a.x + (b.x - a.x) * t) / cell) * cell;
      const gy = Math.round((a.y + (b.y - a.y) * t) / cell) * cell;
      const key = gx + "," + gy;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ x: gx, y: gy, t: t0 + (i - 1 + t) / segs * (t1 - t0) });
    }
  }
  return out;
}
__name2(pixelateBolt, "pixelateBolt");
function spawnThunderbolt(e, target) {
  if (!e.settings.flameTrail || !e.settings.thunderstrike) return;
  if (!target) return;
  while (e.thunderbolts.length >= THUNDER_MAX_LIVE) e.thunderbolts.shift();
  const w = target.w || target.actualCharWidth || 8;
  const tx = target.x + w / 2;
  const ty = target.top;
  const angle = (Math.random() - 0.5) * 2 * THUNDER_MAX_ANGLE;
  const clipTop = e._clipTop ?? 0;
  const rise = Math.max(THUNDER_MIN_REACH, ty - clipTop + 80);
  const reach = rise / Math.max(0.35, Math.cos(angle));
  const ox = tx + Math.sin(angle) * reach;
  const oy = ty - Math.cos(angle) * reach;
  const cell = Math.max(1, Math.round(e.settings.thunderstrikeSize ?? 2));
  const jitter = reach * 0.09;
  const seen = /* @__PURE__ */ new Set();
  const main = boltPath(ox, oy, tx, ty, jitter);
  let cells = pixelateBolt(main, cell, seen, 0, 1);
  const forks = (Math.random() < 0.75 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
  for (let f = 0; f < forks; f++) {
    const ft = 0.15 + Math.random() * 0.4;
    const at = main[Math.floor(main.length * ft)];
    if (!at) continue;
    const side = Math.random() < 0.5 ? -1 : 1;
    const spread = Math.max(-1.1, Math.min(1.1, angle + side * (0.45 + Math.random() * 0.55)));
    const len = reach * (0.15 + Math.random() * 0.18);
    cells = cells.concat(pixelateBolt(
      boltPath(at.x, at.y, at.x + Math.sin(spread) * len, at.y + Math.cos(spread) * len, len * 0.16),
      cell,
      seen,
      ft,
      Math.min(1, ft + 0.3)
    ));
  }
  cells = cells.filter((c) => c.y >= clipTop - cell);
  if (!cells.length) return;
  const ramp = thunderRamp();
  const bands = [];
  for (let i = 0; i < THUNDER_BANDS; i++) {
    const [br, bg, bb] = thunderColorAt(ramp, i / (THUNDER_BANDS - 1));
    bands.push({
      r: br,
      g: bg,
      b: bb,
      cr: lighten(br, 0.45),
      cg: lighten(bg, 0.45),
      cb: lighten(bb, 0.45),
      /** @type {any[]} */
      cells: []
    });
  }
  for (const c of cells) {
    const i = Math.max(0, Math.min(THUNDER_BANDS - 1, Math.round(c.t * (THUNDER_BANDS - 1))));
    bands[i].cells.push(c);
  }
  const usedBands = bands.filter((x) => x.cells.length > 0);
  const [er, eg, eb] = thunderColorAt(ramp, 1);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of cells) {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.x > maxX) maxX = c.x;
    if (c.y > maxY) maxY = c.y;
  }
  const now = performance.now();
  e.thunderbolts.push({
    bands: usedBands,
    cell,
    tx,
    ty,
    minX,
    minY,
    maxX,
    maxY,
    // Sized off the caret, not the block size: at the finest setting a flash
    // a few blocks wide would be invisible, and the strike has to be seen
    // to land.
    flash: Math.max(cell * 2, (target.h || 16) * 0.4),
    er,
    eg,
    eb,
    // Real lightning is several discharges down one channel, so the bolt
    // steps between discrete brightness levels instead of fading smoothly.
    // Rolled at spawn — a per-frame random would beat against the frame rate
    // and turn a strobe into mush. Step 0 is forced full (the strike is the
    // brightest moment) and the floor is high, so it reads as a shimmer down
    // the channel rather than the bolt switching on and off.
    flicker: Array.from({ length: 8 }, (_, i) => i === 0 ? 1 : 0.6 + Math.random() * 0.4),
    start: now
  });
  const sparks = 3 + Math.floor(Math.random() * 3);
  const sparkColor = `rgb(${lighten(er, 0.45)}, ${lighten(eg, 0.45)}, ${lighten(eb, 0.45)})`;
  for (let i = 0; i < sparks; i++) {
    const dir = (Math.random() - 0.5) * Math.PI;
    const speed = 30 + Math.random() * 45;
    e.flamePixels.push({
      x: tx + (Math.random() - 0.5) * w,
      y: ty + Math.random() * (target.h || 16) * 0.4,
      vx: Math.sin(dir) * speed,
      vy: -Math.abs(Math.cos(dir)) * speed * 0.8,
      size: Math.max(1, cell * (0.5 + Math.random() * 0.5)),
      color: sparkColor,
      r: lighten(er, 0.45),
      g: lighten(eg, 0.45),
      b: lighten(eb, 0.45),
      alpha: 1,
      start: now
    });
  }
}
__name2(spawnThunderbolt, "spawnThunderbolt");
function drawThunderbolts(e) {
  if (!e.thunderbolts.length) return;
  const ctx = e.ctx;
  const now = performance.now();
  const opacity = Math.max(0, Math.min(1, e.settings.cursorOpacity ?? 1));
  const strength = Math.max(0.1, Math.min(1, e.settings.thunderstrikeStrength ?? 0.5));
  const halo = !!e.settings.glow;
  e.thunderbolts = e.thunderbolts.filter((b) => {
    const t = (now - b.start) / THUNDER_LIFE_MS;
    if (t >= 1) return false;
    const fade = t < 0.12 ? 1 : 1 - (t - 0.12) / 0.88;
    const step = Math.min(b.flicker.length - 1, Math.floor(t * b.flicker.length));
    const alpha = Math.max(0, fade * b.flicker[step] * opacity * strength);
    if (alpha <= 0.02) return true;
    const cell = b.cell;
    ctx.save();
    if (halo) {
      const pad2 = Math.max(1, cell * 0.75);
      for (const band of b.bands) {
        ctx.fillStyle = `rgba(${band.r}, ${band.g}, ${band.b}, ${alpha * 0.16})`;
        for (const c of band.cells) ctx.fillRect(c.x - pad2, c.y - pad2, cell + pad2 * 2, cell + pad2 * 2);
      }
    }
    for (const band of b.bands) {
      ctx.fillStyle = `rgba(${band.cr}, ${band.cg}, ${band.cb}, ${alpha})`;
      for (const c of band.cells) ctx.fillRect(c.x, c.y, cell, cell);
    }
    const flash = 1 - Math.min(1, t / 0.4);
    if (flash > 0) {
      const size = b.flash * (0.5 + flash);
      ctx.fillStyle = `rgba(${lighten(b.er, 0.45)}, ${lighten(b.eg, 0.45)}, ${lighten(b.eb, 0.45)}, ${alpha * flash * 0.4})`;
      ctx.fillRect(b.tx - size / 2, b.ty - size / 2, size, size);
    }
    ctx.restore();
    const pad = Math.max(8, cell * 3) + b.flash;
    e.markDirty(b.minX - pad, b.minY - pad, b.maxX - b.minX + cell + pad * 2, b.maxY - b.minY + cell + pad * 2);
    return true;
  });
}
__name2(drawThunderbolts, "drawThunderbolts");
function drawLetterParticles(e) {
  const ctx = e.ctx;
  const now = performance.now();
  e.particles = e.particles.filter((p) => {
    const elapsed = (now - p.start) / 1e3;
    if (elapsed > 0.45) return false;
    p.alpha = 1 - elapsed / 0.45;
    const curX = p.x + p.vx * elapsed;
    const curY = p.y + p.vy * elapsed + 0.5 * 320 * elapsed * elapsed;
    const curRot = p.rotation * elapsed * 5;
    const ext = (p.fontSize || 16) * 1.4;
    e.markDirty(curX - ext, curY - ext, ext * 2, ext * 2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.font = `bold ${p.fontSize * 0.9}px ${p.fontFamily}`;
    ctx.translate(curX, curY);
    ctx.rotate(curRot);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.char, 0, 0);
    ctx.restore();
    return true;
  });
}
__name2(drawLetterParticles, "drawLetterParticles");
function drawFlamePixels(e) {
  const ctx = e.ctx;
  const now = performance.now();
  const trailAmt = Math.max(0, e.styleFor("speedDemonSparkTrail") || 0);
  e.flamePixels = e.flamePixels.filter((p) => {
    const elapsed = (now - p.start) / 1e3;
    if (elapsed > 0.4) return false;
    p.alpha = 1 - Math.pow(elapsed / 0.4, 2);
    const curX = p.x + p.vx * elapsed;
    const curY = p.y + p.vy * elapsed;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    if (p.spark && trailAmt > 0) {
      const speed = Math.hypot(p.vx, p.vy) || 1;
      const tailLen = trailAmt * (0.5 + Math.min(1, speed / 45) * 0.5);
      const tailX = curX - p.vx / speed * tailLen;
      const tailY = curY - p.vy / speed * tailLen;
      const lw = Math.max(1, p.size * 0.85);
      e.markDirty(
        Math.min(curX, tailX) - lw,
        Math.min(curY, tailY) - lw,
        Math.abs(tailX - curX) + lw * 2,
        Math.abs(tailY - curY) + lw * 2
      );
      const grad = ctx.createLinearGradient(curX, curY, tailX, tailY);
      grad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, 0.9)`);
      grad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }
    ctx.fillStyle = p.color;
    ctx.fillRect(curX, curY, p.size, p.size);
    e.markDirty(curX - 1, curY - 1, (p.size || 1) + 2, (p.size || 1) + 2);
    ctx.restore();
    return true;
  });
}
__name2(drawFlamePixels, "drawFlamePixels");
function paintMote(e, p, x, y, alpha) {
  const ctx = e.ctx;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.fillRect(x, y, p.size, p.size);
  ctx.restore();
  e.markDirty(x - 1, y - 1, p.size + 2, p.size + 2);
  return true;
}
__name2(paintMote, "paintMote");
function drawStardust(e) {
  if (!e.stardust.length) return;
  const now = performance.now();
  const opacity = Math.max(0, Math.min(1, e.settings.cursorOpacity ?? 1));
  e.stardust = e.stardust.filter((p) => {
    const elapsed = (now - p.start) / 1e3;
    if (elapsed > p.life) return false;
    const t = elapsed / p.life;
    const envelope = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
    const twinkle = 0.72 + 0.28 * Math.sin(elapsed * p.twinkleSpeed + p.phase);
    const alpha = Math.max(0, envelope * twinkle * opacity);
    if (alpha <= 0.01) return true;
    if (p.orbit) {
      const anchor = e.animActive;
      if (anchor) {
        p.ax = anchor.x + (anchor.w || anchor.actualCharWidth || 8) / 2;
        p.ay = anchor.top + anchor.h / 2;
      }
      const ang = p.phase + elapsed * p.angSpeed;
      const r = p.radius * (1 + Math.sin(elapsed * p.wobbleSpeed + p.phase) * 0.15);
      return paintMote(e, p, p.ax + Math.cos(ang) * r, p.ay + Math.sin(ang) * r * p.squash, alpha);
    }
    return paintMote(
      e,
      p,
      p.x + Math.sin(elapsed * p.swaySpeed + p.phase) * p.sway,
      p.y + p.vy * elapsed,
      alpha
    );
  });
}
__name2(drawStardust, "drawStardust");
var DIRTY_RECT_CLEAR = true;
function gradientStops(e) {
  const s = e.settings;
  const n = Math.max(2, Math.min(4, Math.round(s.gradientCount || 2)));
  const prefix = e.isDarkTheme() ? "gradientDark" : "gradientLight";
  const out = [];
  for (let i = 1; i <= n; i++) {
    let hex = s[prefix + i];
    if (s.speedDemon && e.heat > 0) hex = e.heatColorFor(e.heat, hex);
    out.push(hex);
  }
  return out;
}
__name2(gradientStops, "gradientStops");
function sampleRamp(e, pos, cyclic = false) {
  if (!e.settings.gradientEnabled) return hexToRgbTuple(e.getActiveColor() || "#39ff14");
  const stops = gradientStops(e);
  const lerp = /* @__PURE__ */ __name2((a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], "lerp");
  if (cyclic) {
    const wrapped = (pos % 1 + 1) % 1;
    const p2 = wrapped * stops.length;
    const i2 = Math.floor(p2) % stops.length;
    const j = (i2 + 1) % stops.length;
    return lerp(hexToRgbTuple(stops[i2]), hexToRgbTuple(stops[j]), p2 - Math.floor(p2));
  }
  const p = Math.max(0, Math.min(1, pos)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  return lerp(hexToRgbTuple(stops[i]), hexToRgbTuple(stops[i + 1]), p - i);
}
__name2(sampleRamp, "sampleRamp");
function createCursorGradient(e, x, y, w, h2, alpha) {
  const ctx = e.ctx;
  const stops = gradientStops(e);
  const horizontal = w > h2;
  const span = horizontal ? w : h2;
  if (!(span > 0)) return hexToRgba(stops[0], alpha);
  const grad = horizontal ? ctx.createLinearGradient(x, y, x + w, y) : ctx.createLinearGradient(x, y, x, y + h2);
  for (let i = 0; i < stops.length; i++) {
    const [r, g, b] = hexToRgbTuple(stops[i]);
    grad.addColorStop(i / (stops.length - 1), `rgba(${r}, ${g}, ${b}, ${alpha})`);
  }
  return grad;
}
__name2(createCursorGradient, "createCursorGradient");
function cursorPaint(e, x, y, w, h2, color, alpha) {
  if (!e.settings.gradientEnabled) return hexToRgba(color, alpha);
  return createCursorGradient(e, x, y, w, h2, alpha);
}
__name2(cursorPaint, "cursorPaint");
function createEnergyGradient(e, x, y, w, h2, baseColor, alpha) {
  const ctx = e.ctx;
  const speed = e.settings.energySpeed ?? 1;
  const t = performance.now() / 1e3 * speed;
  const base = hexToRgbTuple(baseColor);
  const rampOn = !!e.settings.gradientEnabled;
  const aurora = rampOn && !!e.settings.energyAurora;
  const grad = ctx.createLinearGradient(x + w / 2, y + h2, x + w / 2, y);
  const stops = aurora ? 20 : rampOn ? 12 : 6;
  for (let i = 0; i <= stops; i++) {
    const pos = i / stops;
    const pulse = 0.5 + 0.5 * Math.sin((pos - t * 0.6) * Math.PI * 2);
    let bs;
    if (aurora) {
      const warp = Math.sin(pos * 3.1 + t * 0.85) * 0.26 + Math.sin(pos * 5.7 - t * 0.55) * 0.14 + Math.sin(pos * 1.3 + t * 1.25) * 0.2;
      const near = sampleRamp(e, pos - t * 0.3 + warp, true);
      const far = sampleRamp(e, pos * 0.45 + t * 0.17 + 0.37, true);
      const mix = (0.5 + 0.5 * Math.sin(pos * 2.3 + t * 0.7)) * 0.6;
      bs = [
        near[0] + (far[0] - near[0]) * mix,
        near[1] + (far[1] - near[1]) * mix,
        near[2] + (far[2] - near[2]) * mix
      ];
    } else {
      bs = rampOn ? sampleRamp(e, pos - t * 0.35, true) : base;
    }
    let r = bs[0];
    let g = bs[1];
    let b = bs[2];
    const punch = aurora ? 0.45 : 1;
    if (pulse > 0.5) {
      const k = (pulse - 0.5) * 2 * punch;
      r += (255 - r) * k * 0.55;
      g += (255 - g) * k * 0.55;
      b += (255 - b) * k * 0.55;
    } else {
      const k = (0.5 - pulse) * 2 * punch;
      r -= r * k * 0.45;
      g -= g * k * 0.45;
      b -= b * k * 0.45;
    }
    if (!rampOn) {
      const shift = 14;
      r += Math.sin(t * 0.7 + pos * 6) * shift;
      g += Math.sin(t * 0.7 + pos * 6 + 2.1) * shift;
      b += Math.sin(t * 0.7 + pos * 6 + 4.2) * shift;
    }
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    grad.addColorStop(pos, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  }
  return grad;
}
__name2(createEnergyGradient, "createEnergyGradient");
function blinkPhase(e, now) {
  if (!e.settings.blinkingEnabled) return 1;
  let holdMs = 0;
  if (e.settings.smoothEnabled && e.settings.smoothStopBlinking) holdMs = 450;
  const delayMs = Math.max(0, e.settings.blinkDelayMs ?? 0);
  if (delayMs > holdMs) holdMs = delayMs;
  if (holdMs > 0 && now - e.lastMoveTime < holdMs) return 1;
  return blinkAlphaAt(now, Math.max(0, e.settings.blinkSpeed), e.settings.blinkOnOffBalance ?? 0.5);
}
__name2(blinkPhase, "blinkPhase");
function blinkAlpha(e, now) {
  if (e.settings.blinkBreathing) return 1;
  return blinkPhase(e, now);
}
__name2(blinkAlpha, "blinkAlpha");
function breathScale(e, now) {
  if (!e.settings.blinkingEnabled || !e.settings.blinkBreathing) return 1;
  const depth = Math.max(0, Math.min(0.9, e.settings.blinkBreathDepth ?? 0.2));
  return 1 - depth * (1 - blinkPhase(e, now));
}
__name2(breathScale, "breathScale");
function underlineThickness(e, lineHeight) {
  const h2 = Math.max(1, Math.round(lineHeight || 0));
  const px = e.settings.underlineWidthPx || 0;
  if (px > 0) return Math.max(1, Math.min(Math.round(px), h2));
  return Math.max(2, Math.round(h2 * 0.15));
}
__name2(underlineThickness, "underlineThickness");
function forEachTrailPoint(e, cb) {
  if (!e.settings.crtEffect) return;
  const now = performance.now();
  const fade = Math.max(50, e.settings.trailFadeMs);
  for (const p of e.trail) {
    const age = (now - p.t) / fade;
    const alpha = Math.max(0, 1 - age) * 0.55;
    if (alpha > 0.02) {
      e.markDirty(p.x - 14, p.y - 14, p.w + 28, p.h + 28);
      cb(p, alpha);
    }
  }
}
__name2(forEachTrailPoint, "forEachTrailPoint");
function fillCursorShape(e, ctx, rx, ry, rw, rh) {
  const corners = e.smearCorners() || {
    tl: { x: rx, y: ry },
    tr: { x: rx + rw, y: ry },
    br: { x: rx + rw, y: ry + rh },
    bl: { x: rx, y: ry + rh }
  };
  ctx.beginPath();
  ctx.moveTo(corners.tl.x, corners.tl.y);
  ctx.lineTo(corners.tr.x, corners.tr.y);
  ctx.lineTo(corners.br.x, corners.br.y);
  ctx.lineTo(corners.bl.x, corners.bl.y);
  ctx.closePath();
  ctx.fill();
}
__name2(fillCursorShape, "fillCursorShape");
function drawLineCaret(e, isUnderline) {
  const ctx = e.ctx;
  const settings = e.settings;
  const active = e.animActive;
  const now = performance.now();
  const trailColor = e.getActiveColor();
  const opacity = Math.max(0, Math.min(1, settings.cursorOpacity ?? 1)) * e.idleAlpha();
  forEachTrailPoint(e, (p, alpha2) => {
    if (isUnderline) {
      const uThickness = underlineThickness(e, p.h);
      const ty = p.y + p.h - uThickness;
      ctx.fillStyle = cursorPaint(e, p.x, ty, p.w, uThickness, trailColor, alpha2 * opacity);
      ctx.fillRect(p.x, ty, p.w, uThickness);
    } else {
      ctx.fillStyle = cursorPaint(e, p.x, p.y, p.w, p.h, trailColor, alpha2 * opacity);
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  });
  if (!active) return;
  const alpha = blinkAlpha(e, now);
  const color = e.getActiveColor() || active.textColor || "#ffffff";
  ctx.save();
  if ((settings.crtEffect || comboGlow(e) > 0) && settings.glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = (8 + comboGlow(e) * 14) * alpha;
  }
  let rx;
  let ry;
  let rw;
  let rh;
  if (isUnderline) {
    const uThickness = underlineThickness(e, active.h);
    rx = active.x;
    ry = active.top + active.h - uThickness;
    rw = active.actualCharWidth;
    rh = uThickness;
  } else {
    rx = active.x;
    ry = active.top;
    rw = active.w;
    rh = active.h;
  }
  ctx.fillStyle = settings.energyEffect ? createEnergyGradient(e, rx, ry, rw, rh, color, 0.9 * alpha * opacity) : cursorPaint(e, rx, ry, rw, rh, color, 0.9 * alpha * opacity);
  fillCursorShape(e, ctx, rx, ry, rw, rh);
  if (!isUnderline && settings.lineSerifs) {
    const stem = rw;
    const serifThickness = Math.max(1, Math.round(stem * 0.9));
    const charW = active.actualCharWidth;
    const rawSpan = charW && charW > 0 ? charW : stem * 7;
    const serifSpan = Math.max(stem * 3, Math.min(rawSpan, stem * 10));
    const serifX = active.x + stem / 2 - serifSpan / 2;
    ctx.fillRect(serifX, active.top, serifSpan, serifThickness);
    ctx.fillRect(serifX, active.top + active.h - serifThickness, serifSpan, serifThickness);
  }
  ctx.restore();
}
__name2(drawLineCaret, "drawLineCaret");
var BEAM_RADIUS = 3;
function beamRect(x, top, lineH, caretW) {
  const rw = caretW ?? 3;
  const rh = Math.max(2, lineH * 0.82);
  return {
    rx: x - rw / 2,
    ry: top + (lineH - rh) / 2,
    rw,
    rh
  };
}
__name2(beamRect, "beamRect");
function fillBeamShape(ctx, rx, ry, rw, rh) {
  const r = BEAM_RADIUS;
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(rx, ry, rw, rh, r);
  } else {
    const rad = Math.min(r, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(rx + rad, ry);
    ctx.lineTo(rx + rw - rad, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
    ctx.lineTo(rx + rw, ry + rh - rad);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
    ctx.lineTo(rx + rad, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
    ctx.lineTo(rx, ry + rad);
    ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
    ctx.closePath();
  }
  ctx.fill();
}
__name2(fillBeamShape, "fillBeamShape");
function drawBeamCaret(e) {
  const ctx = e.ctx;
  const settings = e.settings;
  const active = e.animActive;
  const now = performance.now();
  const trailColor = e.getActiveColor();
  const opacity = Math.max(0, Math.min(1, settings.cursorOpacity ?? 1)) * e.idleAlpha();
  const caretW = e.styleFor("caretWidthPx") ?? 3;
  forEachTrailPoint(e, (p, alpha2) => {
    const { rx: rx2, ry: ry2, rw: rw2, rh: rh2 } = beamRect(p.x, p.y, p.h, p.w || caretW);
    ctx.fillStyle = cursorPaint(e, rx2, ry2, rw2, rh2, trailColor, alpha2 * opacity);
    fillBeamShape(ctx, rx2, ry2, rw2, rh2);
  });
  if (!active) return;
  const alpha = blinkAlpha(e, now);
  const color = e.getActiveColor() || active.textColor || "#ffffff";
  ctx.save();
  if ((settings.crtEffect || comboGlow(e) > 0) && settings.glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = (8 + comboGlow(e) * 14) * alpha;
  }
  const { rx, ry, rw, rh } = beamRect(active.x, active.top, active.h, caretW);
  ctx.fillStyle = settings.energyEffect ? createEnergyGradient(e, rx, ry, rw, rh, color, 0.9 * alpha * opacity) : cursorPaint(e, rx, ry, rw, rh, color, 0.9 * alpha * opacity);
  fillBeamShape(ctx, rx, ry, rw, rh);
  ctx.restore();
}
__name2(drawBeamCaret, "drawBeamCaret");
function drawBoxCaret(e) {
  const ctx = e.ctx;
  const settings = e.settings;
  const now = performance.now();
  const color = e.getActiveColor();
  const opacity = Math.max(0, Math.min(1, settings.cursorOpacity ?? 1)) * e.idleAlpha();
  const hollow = e.styleFor("boxHollow");
  const strokeW = hollow ? Math.max(1, Math.min(8, settings.boxHollowWidth || 2)) : 0;
  forEachTrailPoint(e, (p, alpha2) => {
    if (hollow) {
      ctx.strokeStyle = cursorPaint(e, p.x, p.y, p.w, p.h, color, alpha2 * opacity);
      ctx.lineWidth = strokeW;
      const inset = strokeW / 2;
      ctx.strokeRect(p.x + inset, p.y + inset, Math.max(0, p.w - strokeW), Math.max(0, p.h - strokeW));
    } else {
      ctx.fillStyle = cursorPaint(e, p.x, p.y, p.w, p.h, color, alpha2 * opacity);
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  });
  const active = e.animActive;
  if (!active) return;
  if (active.w < 3 && active.h < 8) return;
  const alpha = blinkAlpha(e, now);
  const renderW = active.w;
  ctx.save();
  if ((settings.crtEffect || comboGlow(e) > 0) && settings.glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = (10 + comboGlow(e) * 16) * alpha;
  }
  const paintStyle = settings.energyEffect ? createEnergyGradient(e, active.x, active.top, renderW, active.h, color, 0.9 * alpha * opacity) : cursorPaint(e, active.x, active.top, renderW, active.h, color, 0.9 * alpha * opacity);
  if (hollow) {
    const corners = e.smearCorners() || {
      tl: { x: active.x, y: active.top },
      tr: { x: active.x + renderW, y: active.top },
      br: { x: active.x + renderW, y: active.top + active.h },
      bl: { x: active.x, y: active.top + active.h }
    };
    ctx.strokeStyle = paintStyle;
    ctx.lineWidth = strokeW;
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(corners.tl.x, corners.tl.y);
    ctx.lineTo(corners.tr.x, corners.tr.y);
    ctx.lineTo(corners.br.x, corners.br.y);
    ctx.lineTo(corners.bl.x, corners.bl.y);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.fillStyle = paintStyle;
    fillCursorShape(e, ctx, active.x, active.top, renderW, active.h);
  }
  ctx.restore();
  const displayChar = e.pending ? e.pending.holdChar : active.holdChar || active.char;
  if (!hollow && settings.showChar && displayChar) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.3 + alpha * 0.7);
    ctx.fillStyle = invertColor(active.textColor);
    ctx.font = `${active.fontSize}px ${active.fontFamily}`;
    const metrics = ctx.measureText(displayChar);
    const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? active.fontSize * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? active.fontSize * 0.2;
    const leading = active.h - (ascent + descent);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(displayChar, active.x + renderW / 2, active.top + ascent + leading / 2);
    ctx.restore();
  }
}
__name2(drawBoxCaret, "drawBoxCaret");
function comboGlow(e) {
  if (!e.settings.comboEnabled || !e.settings.comboGlow) return 0;
  return e.comboLevel || 0;
}
__name2(comboGlow, "comboGlow");
function drawGhost(e) {
  const g = e._ghost;
  if (!e.settings.ghostEnabled || !g) return;
  if (Math.abs(g.x - e.animActive.x) < 0.5 && Math.abs(g.top - e.animActive.top) < 0.5) return;
  const ctx = e.ctx;
  const alpha = Math.max(0, Math.min(1, e.settings.ghostOpacity ?? 0.3)) * e.idleAlpha();
  if (alpha <= 0.01) return;
  const isUnderline = e.styleFor("cursorStyle") === "Underline";
  const h2 = isUnderline ? underlineThickness(e, g.h) : g.h;
  const y = isUnderline ? g.top + g.h - h2 : g.top;
  const w = isUnderline ? e.animActive.actualCharWidth || g.w : g.w;
  ctx.save();
  ctx.fillStyle = hexToRgba(e.getActiveColor() || "#39ff14", alpha);
  ctx.fillRect(g.x, y, w, h2);
  ctx.restore();
  e.markDirty(g.x - 4, y - 4, w + 8, h2 + 8);
}
__name2(drawGhost, "drawGhost");
function draw(e) {
  const ctx = e.ctx;
  if (!ctx || !e.canvas) return;
  const win = e.canvas.ownerDocument.defaultView || window;
  const vw = win.innerWidth;
  const vh = win.innerHeight;
  if (!DIRTY_RECT_CLEAR || e._dirtyFull) {
    ctx.clearRect(0, 0, vw, vh);
    e._dirtyFull = false;
  } else if (e._dirtyPrev) {
    const p = e._dirtyPrev;
    ctx.clearRect(p.x, p.y, p.w, p.h);
  }
  e._dirty = null;
  const shake = e.shakeOffset();
  if (shake) {
    ctx.save();
    ctx.translate(shake.x, shake.y);
    e._dirtyFull = true;
  }
  drawGhost(e);
  drawLetterParticles(e);
  drawStardust(e);
  drawFlamePixels(e);
  drawThunderbolts(e);
  const a = e.animActive;
  if (a) {
    let x0 = a.x;
    let y0 = a.top;
    let x1 = a.x + Math.max(a.w || 0, a.actualCharWidth || 0);
    let y1 = a.top + (a.h || 0);
    const q = e.smearQuad;
    if (q) {
      for (const k in q) {
        if (q[k].x < x0) x0 = q[k].x;
        if (q[k].y < y0) y0 = q[k].y;
        if (q[k].x > x1) x1 = q[k].x;
        if (q[k].y > y1) y1 = q[k].y;
      }
    }
    const pad = 24 + Math.max(0, e.settings.caretWidthPx || 0);
    e.markDirty(x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2);
  }
  const breath = a ? breathScale(e, performance.now()) : 1;
  const breathing = breath < 0.999;
  if (breathing) {
    const cx = a.x + Math.max(a.w || 0, a.actualCharWidth || 0) / 2;
    const cy = a.top + (a.h || 0) / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(breath, breath);
    ctx.translate(-cx, -cy);
  }
  switch (e.styleFor("cursorStyle")) {
    case "Line":
      drawLineCaret(e, false);
      break;
    case "Underline":
      drawLineCaret(e, true);
      break;
    case "Beam":
      drawBeamCaret(e);
      break;
    default:
      drawBoxCaret(e);
      break;
  }
  if (breathing) ctx.restore();
  if (shake) ctx.restore();
  const d = e._dirty;
  if (!d) {
    e._dirtyPrev = null;
    return;
  }
  const cx0 = Math.max(0, Math.floor(d.x0) - 2);
  const cy0 = Math.max(0, Math.floor(d.y0) - 2);
  const cx1 = Math.min(vw, Math.ceil(d.x1) + 2);
  const cy1 = Math.min(vh, Math.ceil(d.y1) + 2);
  e._dirtyPrev = cx1 > cx0 && cy1 > cy0 ? { x: cx0, y: cy0, w: cx1 - cx0, h: cy1 - cy0 } : null;
}
__name2(draw, "draw");
function ensureCanvas(e) {
  const doc = e._doc || document;
  if (e.canvasWrapper && e.canvasWrapper.isConnected) return;
  const wrap = doc.createElement("div");
  wrap.className = WRAP_CLASS;
  wrap.style.zIndex = String(e.zIndex || 40);
  const host = doc.body;
  host.appendChild(wrap);
  const canvas = doc.createElement("canvas");
  canvas.className = CANVAS_CLASS;
  wrap.appendChild(canvas);
  e.canvasWrapper = wrap;
  e.canvas = canvas;
  e.ctx = canvas.getContext("2d");
  e._lastWrapperRect = "";
  resizeCanvas(e);
}
__name2(ensureCanvas, "ensureCanvas");
function destroyCanvas(e) {
  try {
    e.canvasWrapper?.remove();
  } catch {
  }
  e.canvasWrapper = null;
  e.canvas = null;
  e.ctx = null;
  e._lastWrapperRect = "";
}
__name2(destroyCanvas, "destroyCanvas");
function resizeCanvas(e) {
  if (!e.canvas || !e.ctx) return;
  const win = e.canvas.ownerDocument.defaultView || window;
  const dpr = win.devicePixelRatio || 1;
  const w = win.innerWidth;
  const h2 = win.innerHeight;
  e.canvas.style.width = w + "px";
  e.canvas.style.height = h2 + "px";
  e.canvas.width = Math.max(1, Math.round(w * dpr));
  e.canvas.height = Math.max(1, Math.round(h2 * dpr));
  e.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  e._dirty = null;
  e._dirtyPrev = null;
  e._dirtyFull = false;
}
__name2(resizeCanvas, "resizeCanvas");
function applyClipRect(e, r) {
  const wrap = e.canvasWrapper;
  if (!wrap || !r) return;
  const sig = `${Math.round(r.top)}|${Math.round(r.left)}|${Math.round(r.width)}|${Math.round(r.height)}`;
  if (sig === e._lastWrapperRect) return;
  e._lastWrapperRect = sig;
  wrap.style.top = r.top + "px";
  wrap.style.left = r.left + "px";
  wrap.style.width = Math.max(0, r.width) + "px";
  wrap.style.height = Math.max(0, r.height) + "px";
  if (e.canvas) {
    e.canvas.style.left = -r.left + "px";
    e.canvas.style.top = -r.top + "px";
  }
}
__name2(applyClipRect, "applyClipRect");
function isVisiblyRendered(el2) {
  if (!el2) return false;
  const win = el2.ownerDocument.defaultView || window;
  const cs = win.getComputedStyle(el2);
  if (cs.display === "none" || cs.visibility === "hidden") return false;
  if (parseFloat(cs.opacity) <= 0.01) return false;
  return true;
}
__name2(isVisiblyRendered, "isVisiblyRendered");
function chromeInsets(e, doc) {
  const now = Date.now();
  const c = e._chromeCache;
  if (c && c.doc === doc && now - c.t < 500) return c;
  const win = doc.defaultView || window;
  let top = 0;
  let bottom = win.innerHeight;
  const tb = doc.querySelector(".rm-topbar");
  if (tb) {
    const b = tb.getBoundingClientRect();
    if (b.height > 0 && b.top <= b.height) top = Math.max(top, b.bottom);
  }
  e._chromeCache = { doc, t: now, top, bottom };
  return e._chromeCache;
}
__name2(chromeInsets, "chromeInsets");
function getFullViewportRect(e, doc) {
  const win = doc.defaultView || window;
  const { top, bottom } = chromeInsets(e, doc);
  if (bottom <= top) return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
  return { top, bottom, left: 0, right: win.innerWidth, width: win.innerWidth, height: bottom - top };
}
__name2(getFullViewportRect, "getFullViewportRect");
function resolveClipChain(el2) {
  const chain = [];
  try {
    const doc = el2.ownerDocument;
    const win = doc.defaultView || window;
    let curPos = win.getComputedStyle(el2).position;
    if (curPos === "fixed") return chain;
    let node = el2.parentElement;
    let guard = 0;
    while (node && node !== doc.body && node !== doc.documentElement && guard++ < 24) {
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
__name2(resolveClipChain, "resolveClipChain");
function getCaretClipRect(e, doc) {
  const active = doc && doc.activeElement;
  if (!active || active === doc.body) return null;
  if (e._clipChainFor !== active) {
    e._clipChainFor = active;
    e._clipChain = resolveClipChain(active);
  }
  const chain = e._clipChain;
  if (!chain || !chain.length) return null;
  const win = doc.defaultView || window;
  const { top: chromeTop, bottom: chromeBottom } = chromeInsets(e, doc);
  let top = chromeTop;
  let left = 0;
  let bottom = chromeBottom;
  let right = win.innerWidth;
  for (const el2 of chain) {
    if (!el2.isConnected) {
      e._clipChainFor = null;
      return null;
    }
    const b = el2.getBoundingClientRect();
    if (b.top > top) top = b.top;
    if (b.left > left) left = b.left;
    if (b.bottom < bottom) bottom = b.bottom;
    if (b.right < right) right = b.right;
  }
  if (bottom <= top || right <= left) return null;
  return { top, bottom, left, right, width: right - left, height: bottom - top };
}
__name2(getCaretClipRect, "getCaretClipRect");
function currentClipRect(e, _fromThymerCaret) {
  const doc = e._doc || document;
  return getCaretClipRect(e, doc) || getFullViewportRect(e, doc);
}
__name2(currentClipRect, "currentClipRect");
function installWakeListeners(e) {
  const doc = e._doc || document;
  const win = doc.defaultView || window;
  const onActivity = /* @__PURE__ */ __name2(() => e.markActivity(), "onActivity");
  const onMouseMove = /* @__PURE__ */ __name2((ev) => {
    e.mouseX = ev.clientX;
    e.mouseY = ev.clientY;
    e.lastMouseMove = Date.now();
    e.wakeTorch();
  }, "onMouseMove");
  const onKeyDown = /* @__PURE__ */ __name2((ev) => {
    e.markActivity();
    if (ev.key === "Backspace" || ev.key === "Delete") {
      e._deletePending = performance.now();
      e.kickShake();
    }
    if (ev.key === "Enter") e._enterPending = performance.now();
    const isPasswordField = String(document.activeElement?.type || "").toLowerCase() === "password";
    if (typeof ev.key === "string" && ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !isPasswordField) {
      e._lastPrintableKey = ev.key;
    }
    const k = ev.key;
    const isTyping = !ev.isComposing && !ev.repeat && (typeof k === "string" && k.length === 1 || k === "Backspace" || k === "Enter" || k === " " || k === "Spacebar" || k === "Tab");
    if (isTyping) {
      if (e.settings.speedDemon) {
        e.heat = Math.min(1, e.heat + 0.09 * (e.settings.speedDemonSensitivity ?? 1));
      }
      e.bumpCombo();
      playKeyClick(e);
    }
  }, "onKeyDown");
  const onResize = /* @__PURE__ */ __name2(() => {
    e._chromeCache = null;
    e._lastWrapperRect = "";
    e._lastOverlayRect = "";
    resizeCanvas(e);
    e.markActivity();
  }, "onResize");
  const bound = [];
  const on = /* @__PURE__ */ __name2((target, type, fn, opts) => {
    if (!target) return;
    target.addEventListener(type, fn, opts);
    bound.push([target, type, fn, opts]);
  }, "on");
  const cap = { capture: true };
  const capPassive = { capture: true, passive: true };
  on(win, "keydown", onKeyDown, cap);
  on(win, "keyup", onActivity, capPassive);
  on(win, "pointerdown", onActivity, capPassive);
  on(win, "pointerup", onActivity, capPassive);
  on(win, "mouseup", onActivity, capPassive);
  on(win, "focusin", onActivity, capPassive);
  on(win, "focusout", onActivity, capPassive);
  on(win, "wheel", onActivity, capPassive);
  on(win, "scroll", onActivity, capPassive);
  on(win, "mousemove", onMouseMove, capPassive);
  on(win, "resize", onResize);
  on(win, "focus", onActivity);
  on(win, "blur", onActivity);
  on(doc, "selectionchange", onActivity);
  on(win.visualViewport, "resize", onActivity, { passive: true });
  on(win.visualViewport, "scroll", onActivity, { passive: true });
  return () => {
    for (const [target, type, fn, opts] of bound) {
      try {
        target.removeEventListener(type, fn, opts);
      } catch {
      }
    }
  };
}
__name2(installWakeListeners, "installWakeListeners");
function playKeyClick(e) {
  const s = e.settings;
  if (!s.soundEnabled) return;
  try {
    if (!e._audio) {
      const Ctor = (
        /** @type {any} */
        window.AudioContext || /** @type {any} */
        window.webkitAudioContext
      );
      if (!Ctor) return;
      e._audio = new Ctor();
    }
    const ctx = e._audio;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const vol = Math.max(0, Math.min(1, s.soundVolume ?? 0.15));
    const vary = 1 + (Math.random() - 0.5) * 2 * Math.max(0, Math.min(1, s.soundVariation ?? 0.25));
    const pitch = Math.max(0.2, (s.soundPitch ?? 1) * vary);
    const len = Math.floor(ctx.sampleRate * 0.02);
    if (!e._noiseBuf || e._noiseBuf.length !== len) {
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      e._noiseBuf = buf;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = e._noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200 * pitch;
    bp.Q.value = 0.8;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.8, now);
    ng.gain.exponentialRampToValueAtTime(1e-4, now + 0.03);
    noise.connect(bp).connect(ng).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.04);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(90 * pitch, now + 0.03);
    const og = ctx.createGain();
    og.gain.setValueAtTime(vol * 0.35, now);
    og.gain.exponentialRampToValueAtTime(1e-4, now + 0.05);
    osc.connect(og).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
  }
}
__name2(playKeyClick, "playKeyClick");
function closeAudio(e) {
  try {
    void e._audio?.close();
  } catch {
  }
  e._audio = null;
  e._noiseBuf = null;
}
__name2(closeAudio, "closeAudio");
function ensureTorchOverlay(e) {
  const doc = e._doc || document;
  if (e.overlay && e.overlay.isConnected) return e.overlay;
  const el2 = doc.createElement("div");
  el2.className = TORCH_CLASS;
  el2.style.zIndex = String((e.zIndex || 40) - 1);
  const host = doc.body;
  host.appendChild(el2);
  e.overlay = el2;
  e._lastOverlayRect = "";
  return el2;
}
__name2(ensureTorchOverlay, "ensureTorchOverlay");
function destroyTorchOverlay(e) {
  try {
    e.overlay?.remove();
  } catch {
  }
  e.overlay = null;
  e._lastOverlayRect = "";
}
__name2(destroyTorchOverlay, "destroyTorchOverlay");
var TORCH_PULSE_FRAME_MS = 33;
function applyOverlayStyle(e) {
  if (!e.overlay) return;
  const s = e.settings;
  e.overlay.style.setProperty("--torch-darkness", String(s.overlayDarkness));
  e.overlay.style.setProperty("--torch-intensity", String(s.overlayIntensity));
  e.overlay.style.setProperty("--torch-warm", hexToRgb2(s.overlayColor));
}
__name2(applyOverlayStyle, "applyOverlayStyle");
function updateOverlayTarget(e) {
  const mode = e.settings.overlayFollowMode;
  const caret = caretCoords(e);
  if (caret) {
    if (!e.lastCaret || caret.x !== e.lastCaret.x || caret.top !== e.lastCaret.top) {
      e.lastCaretMove = Date.now();
    }
    e.lastCaret = caret;
  }
  const useMouse = mode === "mouse" || mode === "auto" && (Date.now() - e.lastMouseMove < 800 || !e.lastCaret);
  if (useMouse) {
    e.tx = e.mouseX;
    e.ty = e.mouseY;
  } else if (e.lastCaret) {
    e.tx = e.lastCaret.x;
    e.ty = (e.lastCaret.top + e.lastCaret.bottom) / 2;
  }
}
__name2(updateOverlayTarget, "updateOverlayTarget");
function startTorch(e) {
  if (e.torchEngineActive) return;
  e.torchEngineActive = true;
  const win = (e._doc || document).defaultView || window;
  e.x = e.tx = win.innerWidth / 2;
  e.y = e.ty = win.innerHeight / 2;
  const schedule = /* @__PURE__ */ __name2(() => {
    if (!e.torchEngineActive) return;
    if (e._torchGear === "hot") {
      e.torchRaf = requestAnimationFrame(tick);
      return;
    }
    const delay = e._torchGear === "pulse" ? TORCH_PULSE_FRAME_MS : 150;
    e._torchIdleT = win.setTimeout(() => {
      e._torchIdleT = 0;
      if (e.torchEngineActive) e.torchRaf = requestAnimationFrame(tick);
    }, delay);
  }, "schedule");
  const tick = /* @__PURE__ */ __name2(() => {
    if (!e.torchEngineActive) return;
    e._torchGear = "idle";
    try {
      if (!e.settings.torchEffect) {
        if (e.overlay) e.overlay.classList.add("cs-torch-hidden");
      } else {
        const overlay = ensureTorchOverlay(e);
        if (overlay) {
          const sig = [
            e.settings.overlayDarkness,
            e.settings.overlayIntensity,
            e.settings.overlayColor
          ].join("|");
          if (sig !== e._overlaySig) {
            e._overlaySig = sig;
            applyOverlayStyle(e);
          }
          updateOverlayTarget(e);
          const lerp = e.settings.overlaySpeed;
          e.x += (e.tx - e.x) * lerp;
          e.y += (e.ty - e.y) * lerp;
          const settled = Math.abs(e.tx - e.x) < 0.25 && Math.abs(e.ty - e.y) < 0.25;
          if (!settled) e._torchGear = "hot";
          else {
            e.x = e.tx;
            e.y = e.ty;
          }
          const doc = e._doc || document;
          const rect = getCaretClipRect(e, doc) || getFullViewportRect(e, doc);
          const top = Math.round(rect.top);
          const left = Math.round(rect.left);
          const key = `${top},${left},${Math.round(rect.width)},${Math.round(rect.height)}`;
          if (key !== e._lastOverlayRect) {
            e._lastOverlayRect = key;
            overlay.style.top = top + "px";
            overlay.style.left = left + "px";
            overlay.style.width = Math.round(rect.width) + "px";
            overlay.style.height = Math.round(rect.height) + "px";
          }
          const hideForModal = false;
          const pulse = !hideForModal && !!e.settings.overlayBlinkSync && !!e.settings.blinkingEnabled;
          let radius = e.settings.overlayRadius;
          if (pulse) {
            const depth = Math.max(0, Math.min(1, e.settings.overlayBlinkDepth ?? 0.25));
            radius *= 1 - depth * (1 - blinkPhase(e, performance.now()));
            if (e._torchGear === "idle") e._torchGear = "pulse";
          }
          const rKey = Math.max(1, Math.round(radius));
          if (rKey !== e._lastTorchRadius) {
            e._lastTorchRadius = rKey;
            overlay.style.setProperty("--torch-radius", rKey + "px");
          }
          const posKey = (e.x - left).toFixed(1) + "," + (e.y - top).toFixed(1);
          if (posKey !== e._lastTorchPos) {
            e._lastTorchPos = posKey;
            overlay.style.setProperty("--torch-x", (e.x - left).toFixed(1) + "px");
            overlay.style.setProperty("--torch-y", (e.y - top).toFixed(1) + "px");
          }
          overlay.classList.toggle("cs-torch-hidden", hideForModal);
        }
      }
    } catch (err) {
      if (!e._torchErrorLogged) {
        e._torchErrorLogged = true;
        console.error("[cursor-smith] torch tick error (loop kept alive):", err);
      }
    }
    schedule();
  }, "tick");
  e._torchTick = tick;
  e._torchGear = "hot";
  e.torchRaf = requestAnimationFrame(tick);
}
__name2(startTorch, "startTorch");
function stopTorch(e) {
  e.torchEngineActive = false;
  if (e.torchRaf) {
    cancelAnimationFrame(e.torchRaf);
    e.torchRaf = 0;
  }
  if (e._torchIdleT) {
    clearTimeout(e._torchIdleT);
    e._torchIdleT = 0;
  }
  e._torchTick = null;
  e._overlaySig = null;
  e._lastTorchRadius = null;
  e._lastTorchPos = null;
  destroyTorchOverlay(e);
}
__name2(stopTorch, "stopTorch");
var SMEAR_LEAD_BOOST_CAP = 6;
var TAPER_FULL_LAG = 14;
var ENERGY_FRAME_MS = 33;
function nextSchedule(gear = "hot") {
  switch (gear) {
    case "warm":
      return { type: "timeout", ms: 33 };
    case "energy":
      return { type: "timeout", ms: ENERGY_FRAME_MS };
    case "idle":
      return { type: "park" };
    case "hot":
    default:
      return { type: "raf" };
  }
}
__name2(nextSchedule, "nextSchedule");
var ROW_TYPE_STEP = { text: 0, heading: 1, task: -1, code: 2, quote: -2, list: 0.5 };
var COMBO_IDLE_MS = 1200;
var _a;
var CursorEngine = (_a = class {
  /**
   * @param {{settings: Record<string, any>, doc?: Document, zIndex?: number,
   *          measurer?: { latest: () => any, subscribe?: (fn: Function) => Function },
   *          onFatal?: (err: any) => void}} opts
   */
  constructor(opts) {
    this.settings = opts.settings;
    this._doc = opts.doc || document;
    this.zIndex = opts.zIndex ?? 40;
    this.measurer = opts.measurer || null;
    this._onFatal = opts.onFatal || null;
    this.canvasWrapper = null;
    this.canvas = null;
    this.ctx = null;
    this.overlay = null;
    this.active = false;
    this.torchEngineActive = false;
    this.trail = [];
    this.particles = [];
    this.flamePixels = [];
    this.thunderbolts = [];
    this.stardust = [];
    this.lastActive = null;
    this.animActive = null;
    this.pending = null;
    this.smearQuad = null;
    this.smearShape = null;
    this.smearCenterPrev = null;
    this._smearDir = null;
    this._taperBuf = null;
    this.heat = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.lastMouseMove = 0;
    this.lastMoveTime = 0;
    this.lastCaret = null;
    this.lastCaretMove = 0;
    this.typingSpeedMod = 1;
    this.x = 0;
    this.y = 0;
    this.tx = 0;
    this.ty = 0;
    this._drawSig = null;
    this._dirty = null;
    this._dirtyPrev = null;
    this._dirtyFull = true;
    this._canvasGear = "hot";
    this._torchGear = "idle";
    this._canvasTick = null;
    this._torchTick = null;
    this.canvasRaf = 0;
    this.torchRaf = 0;
    this._canvasIdleT = 0;
    this._torchIdleT = 0;
    this._lastWrapperRect = "";
    this._lastOverlayRect = "";
    this._overlaySig = null;
    this._lastTorchRadius = null;
    this._lastTorchPos = null;
    this._clipTop = 0;
    this._parked = false;
    this._clipChainFor = null;
    this._clipChain = [];
    this._chromeCache = null;
    this._modalOpen = false;
    this._caretSource = "generic";
    this._rowType = "text";
    this._selectionActive = false;
    this._ghost = null;
    this.combo = 0;
    this._comboLastT = 0;
    this.comboLevel = 0;
    this._shakeUntil = 0;
    this._ghostMoving = false;
    this._lastComboSparkT = 0;
    this._audio = null;
    this._noiseBuf = null;
    this._popRainbowHue = 0;
    this._tickErrors = 0;
    this._lastPrintableKey = "";
    this._deletePending = 0;
    this._enterPending = 0;
    this._lastActivityT = 0;
    this._lastHotFrameT = 0;
    this._lastSparkT = 0;
    this._lastStardustT = 0;
    this._smearDtT = 0;
    this._smoothLastT = 0;
    this._catchUpBoost = 1;
    this._smoothMoving = false;
    this._smearMoving = false;
    this.smearQuadLastMoveT = 0;
    this._suspendCleared = false;
    this._tickErrorLogged = false;
    this._torchErrorLogged = false;
    this._detach = [];
  }
  /* ---- settings access ------------------------------------------------ */
  /** @param {string} key @returns {any} */
  styleFor(key) {
    return this.settings[key];
  }
  /** @param {Record<string, any>} settings */
  setSettings(settings) {
    this.settings = settings;
    this._drawSig = null;
    this.markActivity();
    this.syncTorch();
  }
  isDarkTheme() {
    const doc = this.canvas ? this.canvas.ownerDocument : this._doc || document;
    const root = doc.documentElement;
    const body = doc.body;
    if (root.classList.contains("bp3-dark")) return true;
    if (body.classList.contains("bt-theme-dark")) return true;
    try {
      const win = doc.defaultView || window;
      const prefersDark = !!(win.matchMedia && win.matchMedia("(prefers-color-scheme: dark)").matches);
      if (prefersDark && !root.classList.contains("bp3-light")) return true;
    } catch {
    }
    return false;
  }
  /** @param {number} heat @param {string} baseHex */
  heatColorFor(heat, baseHex) {
    return heatColor(heat, baseHex);
  }
  /**
   * The flat colour every effect that isn't the cursor body falls back to:
   * the CRT halo, pixel-trail particles, popping letters. With Gradient on
   * that is the ramp's first stop, so those effects stay in the same family
   * as the cursor instead of painting in a colour it no longer uses.
   */
  getBaseColor() {
    const dark = this.isDarkTheme();
    if (this.settings.selectionColorEnabled && this._selectionActive) {
      return dark ? this.settings.selectionColorDark : this.settings.selectionColorLight;
    }
    const base = this.settings.gradientEnabled ? gradientStops(this)[0] : dark ? this.settings.colorDark : this.settings.colorLight;
    if (!this.settings.rowTypeTint) return base;
    const amount = this.settings.rowTypeTintAmount || 0;
    const step = ROW_TYPE_STEP[this._rowType || "text"] || 0;
    return step ? shiftHue(base, amount * step) : base;
  }
  /**
   * Whether a non-collapsed selection exists. Cached per frame: this runs
   * inside the colour path, which several primitives call per draw.
   */
  refreshSelectionState() {
    if (!this.settings.selectionColorEnabled) {
      this._selectionActive = false;
      return;
    }
    const doc = this._doc || document;
    let active = false;
    try {
      const sel = (doc.defaultView || window).getSelection();
      active = !!(sel && !sel.isCollapsed && String(sel).length > 0);
    } catch {
    }
    this._selectionActive = active;
  }
  getActiveColor() {
    const base = this.getBaseColor();
    if (!this.settings.speedDemon) return base;
    return heatColor(this.heat, base);
  }
  /** @param {number} pos @param {boolean} [cyclic] */
  sampleRamp(pos, cyclic = false) {
    return sampleRamp(this, pos, cyclic);
  }
  /* ---- damage tracking ------------------------------------------------ */
  /** @param {number} x @param {number} y @param {number} w @param {number} h */
  markDirty(x, y, w, h2) {
    const d = this._dirty;
    if (!d) {
      this._dirty = { x0: x, y0: y, x1: x + w, y1: y + h2 };
      return;
    }
    if (x < d.x0) d.x0 = x;
    if (y < d.y0) d.y0 = y;
    if (x + w > d.x1) d.x1 = x + w;
    if (y + h2 > d.y1) d.y1 = y + h2;
  }
  /* ---- wake ------------------------------------------------------------ */
  markActivity() {
    this._lastActivityT = performance.now();
    if (this._canvasIdleT) {
      clearTimeout(this._canvasIdleT);
      this._canvasIdleT = 0;
      if (this.active && this._canvasTick) this.canvasRaf = requestAnimationFrame(this._canvasTick);
    }
    if (this._parked) {
      this._parked = false;
      if (this.active && this._canvasTick) this.canvasRaf = requestAnimationFrame(this._canvasTick);
    }
    this.wakeTorch();
  }
  /** Torch-only wake: pointer movement retargets the spotlight but must not
   *  spin the cursor canvas up to full rate. */
  wakeTorch() {
    if (this._torchIdleT) {
      clearTimeout(this._torchIdleT);
      this._torchIdleT = 0;
      if (this.torchEngineActive && this._torchTick) this.torchRaf = requestAnimationFrame(this._torchTick);
    }
  }
  /**
   * True when the OS-level window owning our canvas is the focused one.
   *
   * Probed per frame rather than cached from a blur listener: hasFocus() reads
   * a flag and forces no layout, so it costs nothing, and it cannot get stuck
   * out of sync if a focus event is ever missed. The focus/blur listeners only
   * wake the loop so the change is picked up on the next frame rather than
   * staying parked until the next activity.
   */
  windowFocused() {
    if (!this.settings.hideOnWindowBlur) return true;
    try {
      const doc = this.canvas && this.canvas.ownerDocument || this._doc;
      if (doc.hidden || doc.visibilityState === "hidden") return false;
      if (isDesktopAppDoc(doc)) return true;
      return doc.hasFocus();
    } catch {
      return true;
    }
  }
  /* ---- caret tracking -------------------------------------------------- */
  updateActivePoint() {
    const caret = caretCoords(this);
    if (!caret || !caret.focused) {
      this.lastActive = null;
      this.pending = null;
      return;
    }
    if (!this.lastActive) {
      this.lastActive = caret;
      this.pending = null;
      return;
    }
    const moved = Math.abs(this.lastActive.x - caret.x) > 0.5 || Math.abs(this.lastActive.top - caret.top) > 0.5;
    if (!moved) {
      if (!this.pending) this.lastActive = caret;
      return;
    }
    if (caret.pos !== null && caret.pos === this.lastActive.pos) {
      const dx = caret.x - this.lastActive.x;
      const dy = caret.top - this.lastActive.top;
      this.lastActive = caret;
      if (this.animActive && (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01)) {
        this.animActive.x += dx;
        this.animActive.top += dy;
        this.animActive.w = caret.w;
        this.animActive.h = caret.h;
        if (this.smearQuad) {
          for (const key in this.smearQuad) {
            this.smearQuad[key].x += dx;
            this.smearQuad[key].y += dy;
          }
          if (this.smearShape && this.smearShape !== this.smearQuad) {
            for (const key in this.smearShape) {
              this.smearShape[key].x += dx;
              this.smearShape[key].y += dy;
            }
          }
          if (this.smearCenterPrev) {
            this.smearCenterPrev.x += dx;
            this.smearCenterPrev.y += dy;
          }
        }
        for (const p of this.trail) {
          p.x += dx;
          p.y += dy;
        }
      }
      return;
    }
    const delay = Math.max(0, Math.round(this.settings.moveDelayMs));
    if (delay <= 0) {
      const holdChar = this.resolveHoldChar();
      this.commitMove(caret);
      if (holdChar && this.lastActive) this.lastActive.holdChar = holdChar;
      return;
    }
    const targetChanged = !this.pending || this.pending.caret.x !== caret.x || this.pending.caret.top !== caret.top;
    if (targetChanged) {
      this.pending = { caret, since: performance.now(), holdChar: this.resolveHoldChar() };
    } else if (performance.now() - this.pending.since >= delay) {
      this.commitMove(this.pending.caret);
    }
  }
  /**
   * The character just typed, which the box keeps showing while the caret
   * moves past it — and which spawns the popping letter.
   *
   * Upstream read this from its editor's document model. Thymer exposes no
   * document model to a plugin, so the keydown handler stashes the last
   * printable key instead and this consumes it.
   */
  resolveHoldChar() {
    const key = this._lastPrintableKey;
    this._lastPrintableKey = "";
    if (key && key !== "\n" && key.trim()) {
      if (this.settings.popLetters && this.lastActive) {
        spawnLetterParticle(this, key, this.lastActive);
      }
      return key;
    }
    return this.lastActive ? this.lastActive.char : "";
  }
  /**
   * Did this move cross to a different visual line?
   *
   * Threshold is a fraction of the line height rather than a fixed pixel count,
   * so it holds for headings and code rows as well as body text — and it is
   * below a full line so a soft-wrap, which lands on the next row exactly like
   * a pressed Enter, is caught too.
   * @param {any} from @param {any} to @returns {boolean}
   */
  isLineChange(from, to) {
    if (!from || !to) return false;
    const lh = Math.max(8, to.h || from.h || 16);
    return Math.abs(to.top - from.top) > lh * 0.6;
  }
  /**
   * Collapse every position-interpolating effect onto a new location.
   *
   * Motion effects all assume the caret travels along a line. A line break
   * breaks that assumption badly: the smear quad stretches from the end of one
   * row to the start of the next, painting a diagonal band straight through
   * the text between them, and the ghost drags the same path a beat later. It
   * reads as a glitch rather than as motion.
   *
   * So on a line change they are snapped rather than interpolated. Particles
   * are deliberately NOT touched — a burst left behind at the old position is
   * exactly right; it marks where you were.
   * @param {any} caret
   */
  snapMotionTo(caret) {
    if (!caret) return;
    if (this.animActive) {
      this.animActive.x = caret.x;
      this.animActive.top = caret.top;
      this.animActive.w = caret.w;
      this.animActive.h = caret.h;
    }
    this.smearQuad = null;
    this.smearShape = null;
    this.smearCenterPrev = null;
    this._smearDir = null;
    this._smearMoving = false;
    if (this._ghost) {
      this._ghost.x = caret.x;
      this._ghost.top = caret.top;
    }
    this._ghostMoving = false;
  }
  /** @param {any} caret */
  commitMove(caret) {
    this.pushTrail(this.lastActive);
    if (this.lastActive) {
      const now = performance.now();
      const disintegrate = this.settings.backspaceDisintegrate && this._deletePending && now - this._deletePending < 250;
      spawnFlamePixels(this, this.lastActive, !!disintegrate);
      this._deletePending = 0;
      if (this._enterPending && now - this._enterPending < 250) spawnThunderbolt(this, caret);
    }
    this._enterPending = 0;
    const crossedLine = this.settings.snapOnNewline && this.isLineChange(this.lastActive, caret);
    this.lastActive = caret;
    this.pending = null;
    this.lastMoveTime = performance.now();
    if (crossedLine) this.snapMotionTo(caret);
  }
  /** @param {any} point */
  pushTrail(point) {
    if (!point) return;
    this.trail.push({ x: point.x, y: point.top, w: point.w, h: point.h, t: performance.now() });
    const max = Math.max(0, Math.round(this.settings.trailLength));
    while (this.trail.length > max) this.trail.shift();
  }
  /**
   * Age out expired trail points.
   *
   * Deliberately in the update phase and deliberately NOT gated on crtEffect.
   * pushTrail runs on every caret move regardless of that setting, so with the
   * trail effect off — the default — the array would fill to trailLength and
   * never be pruned by age, only evicted by newer entries. `trail.length > 0`
   * then held `animating` true permanently, latching the hot gear on a
   * completely idle editor.
   */
  pruneTrail() {
    if (!this.trail.length) return;
    const now = performance.now();
    const fade = Math.max(50, this.settings.trailFadeMs);
    this.trail = this.trail.filter((p) => now - p.t < fade);
  }
  /* ---- smooth movement ------------------------------------------------- */
  updateSmoothCursor() {
    if (!this.lastActive) {
      this.animActive = null;
      this._smoothMoving = false;
      this._smoothLastT = 0;
      this._catchUpBoost = 1;
      return;
    }
    if (!this.settings.smoothEnabled) {
      this.animActive = { ...this.lastActive };
      this._smoothMoving = false;
      this._catchUpBoost = 1;
      return;
    }
    if (!this.animActive) {
      this.animActive = { ...this.lastActive };
      this._smoothMoving = false;
    }
    const now = performance.now();
    let dt = (now - (this._smoothLastT || now)) / 1e3;
    this._smoothLastT = now;
    dt = Math.max(1e-3, Math.min(dt, 0.05));
    let targetSpeed = this.settings.catchUpSpeed;
    let typingBoost = 1;
    if (this.settings.smoothAdaptive) {
      const timeSinceMove = now - this.lastMoveTime;
      const maxMod = this.settings.maxCatchUpSpeed / Math.max(0.01, this.settings.catchUpSpeed);
      if (timeSinceMove < 150) {
        this.typingSpeedMod = Math.min(this.typingSpeedMod + (maxMod - 1) * 8 * dt, maxMod);
      } else {
        this.typingSpeedMod = Math.max(this.typingSpeedMod - (maxMod - 1) * 2 * dt, 1);
      }
      targetSpeed = Math.min(this.settings.maxCatchUpSpeed, targetSpeed * this.typingSpeedMod);
      if (timeSinceMove < 150) {
        const cw = Math.max(4, this.lastActive.actualCharWidth || 8);
        const dist = Math.hypot(
          this.lastActive.x - this.animActive.x,
          this.lastActive.top - this.animActive.top
        );
        typingBoost = 1 + Math.min(3, Math.max(0, dist / cw - 1));
      }
    }
    const RATE_SCALE = 40;
    const rate = Math.max(0.5, targetSpeed * (1 - this.settings.smoothness) * RATE_SCALE * typingBoost);
    this._catchUpBoost = targetSpeed / Math.max(0.01, this.settings.catchUpSpeed) * typingBoost;
    const lerpFactor = 1 - Math.exp(-rate * dt);
    this.animActive.x += (this.lastActive.x - this.animActive.x) * lerpFactor;
    this.animActive.top += (this.lastActive.top - this.animActive.top) * lerpFactor;
    this.animActive.w += (this.lastActive.w - this.animActive.w) * lerpFactor;
    this.animActive.h += (this.lastActive.h - this.animActive.h) * lerpFactor;
    const arrived = Math.abs(this.lastActive.x - this.animActive.x) < 0.25 && Math.abs(this.lastActive.top - this.animActive.top) < 0.25;
    if (arrived) {
      this.animActive.x = this.lastActive.x;
      this.animActive.top = this.lastActive.top;
      this.animActive.w = this.lastActive.w;
      this.animActive.h = this.lastActive.h;
    }
    this._smoothMoving = !arrived;
    this.animActive.textColor = this.lastActive.textColor;
    this.animActive.char = this.lastActive.char;
    this.animActive.holdChar = this.lastActive.holdChar;
    this.animActive.actualCharWidth = this.lastActive.actualCharWidth;
    this.animActive.fontFamily = this.lastActive.fontFamily;
    this.animActive.fontSize = this.lastActive.fontSize;
  }
  /* ---- motion smear ---------------------------------------------------- */
  getActiveRect() {
    const active = this.animActive;
    if (!active) return null;
    if (this.styleFor("cursorStyle") === "Underline") {
      const uThickness = underlineThickness(this, active.h);
      return {
        x: active.x,
        y: active.top + active.h - uThickness,
        w: active.actualCharWidth,
        h: uThickness
      };
    }
    return { x: active.x, y: active.top, w: active.w, h: active.h };
  }
  updateSmearQuad() {
    const now = performance.now();
    if (!this._smearDtT) this._smearDtT = now;
    let dt = (now - this._smearDtT) / 1e3;
    this._smearDtT = now;
    dt = Math.min(dt, 0.05);
    const settings = this.settings;
    const rect = settings.smear ? this.getActiveRect() : null;
    if (!rect) {
      this.smearQuad = null;
      this.smearShape = null;
      this.smearCenterPrev = null;
      this._smearMoving = false;
      return;
    }
    const targets = {
      tl: { x: rect.x, y: rect.y },
      tr: { x: rect.x + rect.w, y: rect.y },
      br: { x: rect.x + rect.w, y: rect.y + rect.h },
      bl: { x: rect.x, y: rect.y + rect.h }
    };
    if (!this.smearQuad) {
      this.smearQuad = {};
      for (const key in targets) {
        this.smearQuad[key] = { x: targets[key].x, y: targets[key].y, vx: 0, vy: 0 };
      }
      this.smearCenterPrev = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
      this.smearShape = this.smearQuad;
      this._smearMoving = false;
      return;
    }
    const center = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    let dirX = 0;
    let dirY = 0;
    if (this.smearCenterPrev) {
      dirX = center.x - this.smearCenterPrev.x;
      dirY = center.y - this.smearCenterPrev.y;
    }
    const dirLen = Math.hypot(dirX, dirY);
    if (dirLen > 0.01) {
      dirX /= dirLen;
      dirY /= dirLen;
      this._smearDir = { x: dirX, y: dirY };
    }
    this.smearCenterPrev = center;
    const leadBoost = settings.smoothEnabled ? Math.max(1, Math.min(SMEAR_LEAD_BOOST_CAP, this._catchUpBoost || 1)) : 1;
    const freqLead = (2 + Math.max(0, Math.min(1, settings.smearStiffness)) * 38) * leadBoost;
    const freqTrail = 2 + Math.max(0, Math.min(1, settings.smearTrailingStiffness)) * 38;
    const dampingRatio = 0.15 + Math.max(0, Math.min(1, settings.smearDamping)) * 1.15;
    const MAX_STEP = 1 / 240;
    const steps = Math.max(1, Math.min(16, Math.ceil(dt / MAX_STEP)));
    const h2 = dt / steps;
    let moving = false;
    for (const key in targets) {
      const c = this.smearQuad[key];
      const t = targets[key];
      const offX = t.x - center.x;
      const offY = t.y - center.y;
      const offLen = Math.hypot(offX, offY) || 1;
      const align = dirLen > 0.01 ? offX / offLen * dirX + offY / offLen * dirY : 0;
      const freq = align >= 0 ? freqLead : freqTrail;
      const k = freq * freq;
      const damp = 2 * dampingRatio * freq;
      for (let s = 0; s < steps; s++) {
        const ax = k * (t.x - c.x) - damp * c.vx;
        const ay = k * (t.y - c.y) - damp * c.vy;
        c.vx += ax * h2;
        c.vy += ay * h2;
        c.x += c.vx * h2;
        c.y += c.vy * h2;
      }
      if (!isFinite(c.x) || !isFinite(c.y) || !isFinite(c.vx) || !isFinite(c.vy)) {
        c.x = t.x;
        c.y = t.y;
        c.vx = 0;
        c.vy = 0;
      }
      if (Math.abs(c.x - t.x) > 0.5 || Math.abs(c.y - t.y) > 0.5 || Math.abs(c.vx) > 0.1 || Math.abs(c.vy) > 0.1) moving = true;
    }
    this._smearMoving = moving;
    this.applySmearTaper(targets, center);
    if (moving) {
      this.smearQuadLastMoveT = now;
    } else {
      for (const key in targets) {
        const c = this.smearQuad[key];
        c.x = targets[key].x;
        c.y = targets[key].y;
        c.vx = 0;
        c.vy = 0;
      }
    }
  }
  /**
   * Derive the corners to PAINT from the corners the spring is holding.
   *
   * The result is deliberately NOT written back into smearQuad. That object is
   * the spring's state, integrated forward from its own previous position: a
   * tapered corner stored there would become the position the next frame
   * springs from, so the corners would chase the narrowed shape and the taper
   * would eat the very lag it is drawn from.
   * @param {CornerTargets} targets @param {{x:number,y:number}} center
   */
  applySmearTaper(targets, center) {
    const q = this.smearQuad;
    const amount = Math.max(0, Math.min(1, this.settings.smearTaperAmount ?? 0.7));
    const dir = this._smearDir;
    if (!q || !this.settings.smearTaper || amount <= 0 || !dir) {
      this.smearShape = q;
      return;
    }
    let maxLag = 0;
    const lag = {};
    for (const k in targets) {
      const l = Math.hypot(q[k].x - targets[k].x, q[k].y - targets[k].y);
      lag[k] = l;
      if (l > maxLag) maxLag = l;
    }
    const reach = Math.min(1, maxLag / TAPER_FULL_LAG);
    if (reach <= 1e-3) {
      this.smearShape = q;
      return;
    }
    if (!this._taperBuf) {
      this._taperBuf = { tl: { x: 0, y: 0 }, tr: { x: 0, y: 0 }, br: { x: 0, y: 0 }, bl: { x: 0, y: 0 } };
    }
    const out = this._taperBuf;
    for (const k in targets) {
      const c = q[k];
      const ox = c.x - center.x;
      const oy = c.y - center.y;
      const along = ox * dir.x + oy * dir.y;
      const w = lag[k] / maxLag * reach * amount;
      out[k].x = c.x - (ox - along * dir.x) * w;
      out[k].y = c.y - (oy - along * dir.y) * w;
    }
    this.smearShape = out;
  }
  /**
   * The ghost: a second cursor lagging behind the real one.
   *
   * Its own lerp rather than a reuse of the smooth-movement one, because it
   * must lag even when Smooth Movement is OFF — that is the entire effect. It
   * deliberately does not feed the smear spring or the trail; it is decoration
   * that follows, not a second caret.
   */
  updateGhost() {
    if (!this.settings.ghostEnabled || !this.animActive) {
      this._ghost = null;
      this._ghostMoving = false;
      return;
    }
    const target = this.animActive;
    if (!this._ghost) {
      this._ghost = { x: target.x, top: target.top, w: target.w, h: target.h };
      this._ghostMoving = false;
      return;
    }
    const k = Math.max(0.01, Math.min(0.9, this.settings.ghostLag || 0.08));
    const g = this._ghost;
    g.x += (target.x - g.x) * k;
    g.top += (target.top - g.top) * k;
    g.w = target.w;
    g.h = target.h;
    const arrived = Math.abs(target.x - g.x) < 0.25 && Math.abs(target.top - g.top) < 0.25;
    if (arrived) {
      g.x = target.x;
      g.top = target.top;
    }
    this._ghostMoving = !arrived;
  }
  /**
   * True only while the idle fade is mid-transition.
   *
   * Deliberately not "is idle" — that would be true forever once you stopped
   * typing, pinning the loop off its idle gear for as long as the window sat
   * untouched, which is the exact opposite of what an idle effect should cost.
   * @returns {boolean}
   */
  _idleRamping() {
    if (!this.settings.idleFadeEnabled || !this.lastActive) return false;
    const delay = Math.max(0, this.settings.idleFadeDelayMs ?? 4e3);
    const idleFor = performance.now() - (this._lastActivityT || 0);
    return idleFor > delay - 120 && idleFor < delay + 1200;
  }
  /**
   * Typing streak. Distinct from Speed Demon's heat: heat measures how FAST
   * you are going and cools continuously, whereas a combo counts how MANY
   * keystrokes you have chained and resets hard the moment you pause.
   */
  updateCombo() {
    if (!this.settings.comboEnabled) {
      this.combo = 0;
      this.comboLevel = 0;
      return;
    }
    if (this.combo && performance.now() - this._comboLastT > COMBO_IDLE_MS) this.combo = 0;
    const threshold = Math.max(1, this.settings.comboThreshold || 25);
    this.comboLevel = Math.max(0, Math.min(1, this.combo / threshold));
  }
  /** Called from the keydown handler for every character that counts as typing. */
  bumpCombo() {
    if (!this.settings.comboEnabled) return;
    this.combo += 1;
    this._comboLastT = performance.now();
  }
  /** Kick off a screen shake. Called on Backspace/Delete. */
  kickShake() {
    if (!this.settings.shakeEnabled) return;
    this._shakeUntil = performance.now() + Math.max(60, this.settings.shakeDurationMs || 180);
  }
  /**
   * Current shake offset, decaying to nothing over the configured duration.
   * @returns {{x: number, y: number} | null}
   */
  shakeOffset() {
    if (!this.settings.shakeEnabled) return null;
    const now = performance.now();
    if (now >= this._shakeUntil) return null;
    const dur = Math.max(60, this.settings.shakeDurationMs || 180);
    const remaining = (this._shakeUntil - now) / dur;
    const amp = (this.settings.shakeStrength || 3) * remaining;
    return { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp };
  }
  /**
   * Extra opacity multiplier once the caret has sat untouched.
   *
   * Eased rather than switched so the cursor settles instead of blinking out,
   * and floored at the user's value rather than 0 — a caret that vanishes
   * completely is indistinguishable from a broken plugin.
   * @returns {number}
   */
  idleAlpha() {
    if (!this.settings.idleFadeEnabled) return 1;
    const delay = Math.max(0, this.settings.idleFadeDelayMs ?? 4e3);
    const idleFor = performance.now() - (this._lastActivityT || 0);
    if (idleFor <= delay) return 1;
    const to = Math.max(0, Math.min(0.9, this.settings.idleFadeTo ?? 0.25));
    const t = Math.min(1, (idleFor - delay) / 1e3);
    return 1 - (1 - to) * t;
  }
  /** Corners to paint through, or null when Motion Smear is off. */
  smearCorners() {
    if (!this.settings.smear) return null;
    return this.smearShape || this.smearQuad;
  }
  /* ---- lifecycle ------------------------------------------------------- */
  start() {
    if (this.active) return;
    this.active = true;
    this.trail = [];
    this.particles = [];
    this.flamePixels = [];
    this.thunderbolts = [];
    this.stardust = [];
    this.lastActive = null;
    this.animActive = null;
    this.pending = null;
    this.smearQuad = null;
    this.smearShape = null;
    this.smearCenterPrev = null;
    this._smearDir = null;
    this._smearMoving = false;
    this._smearDtT = 0;
    this._smoothMoving = false;
    this._catchUpBoost = 1;
    this.typingSpeedMod = 1;
    this.heat = 0;
    this._suspendCleared = false;
    this._drawSig = null;
    this._dirty = null;
    this._dirtyPrev = null;
    this._dirtyFull = true;
    this._tickErrors = 0;
    this._parked = false;
    ensureCanvas(this);
    this._detach.push(installWakeListeners(this));
    if (this.measurer?.subscribe) this._detach.push(this.measurer.subscribe(() => this.markActivity()));
    const schedule = /* @__PURE__ */ __name2(() => {
      if (!this.active) return;
      const plan = nextSchedule(this._canvasGear || "hot");
      if (plan.type === "park") {
        this._parked = true;
        return;
      }
      this._parked = false;
      if (plan.type === "raf") {
        this.canvasRaf = requestAnimationFrame(tick);
        return;
      }
      this._canvasIdleT = setTimeout(() => {
        this._canvasIdleT = 0;
        if (this.active) this.canvasRaf = requestAnimationFrame(tick);
      }, plan.ms);
    }, "schedule");
    const tick = /* @__PURE__ */ __name2(() => {
      if (!this.active) return;
      if ((this._canvasGear || "hot") === "hot") {
        const n = performance.now();
        if (n - (this._lastHotFrameT || 0) < 14) {
          this.canvasRaf = requestAnimationFrame(tick);
          return;
        }
        this._lastHotFrameT = n;
      }
      try {
        this.frame();
        this._tickErrors = 0;
      } catch (err) {
        if (!this._tickErrorLogged) {
          this._tickErrorLogged = true;
          console.error("[cursor-smith] canvas tick error (loop kept alive):", err);
        }
        if (++this._tickErrors >= 5 && this._onFatal) {
          const onFatal = this._onFatal;
          this._onFatal = null;
          onFatal(err);
          return;
        }
      }
      schedule();
    }, "tick");
    this._canvasTick = tick;
    this._canvasGear = "hot";
    this.canvasRaf = requestAnimationFrame(tick);
    this.syncTorch();
  }
  /** One frame of update + conditional draw. */
  frame() {
    const focused = this.windowFocused();
    if (!focused) {
      releaseHostCaret(this);
      if (this.ctx && this.canvas && !this._suspendCleared) {
        const win = this.canvas.ownerDocument.defaultView || window;
        this.ctx.clearRect(0, 0, win.innerWidth, win.innerHeight);
        this._suspendCleared = true;
        this._dirtyPrev = null;
        this._drawSig = null;
      }
      this._canvasGear = "idle";
      return;
    }
    this._suspendCleared = false;
    ensureCanvas(this);
    const r = currentClipRect(this, this._caretSource === "thymer");
    if (r) {
      const prev = this._lastWrapperRect;
      this._clipTop = Math.round(r.top);
      applyClipRect(this, r);
      if (prev !== this._lastWrapperRect) this._dirtyFull = true;
    }
    this.refreshSelectionState();
    this.updateActivePoint();
    syncHostCaret(this, (this.canvas && this.canvas.ownerDocument || this._doc || document).activeElement);
    this._rowType = this.lastActive && this.lastActive.rowType || "text";
    this.updateSmoothCursor();
    this.updateGhost();
    this.updateCombo();
    this.updateSmearQuad();
    this.pruneTrail();
    if (this.heat > 0) {
      this.heat *= 0.985;
      if (this.heat < 1e-3) this.heat = 0;
    }
    if (this.settings.speedDemon && this.settings.speedDemonSparks && this.animActive) {
      maybeSpawnSpeedDemonSparks(this);
    }
    maybeSpawnStardust(this);
    maybeSpawnComboShower(this);
    this.decideGear();
  }
  /** Pick this frame's gear and decide whether the draw can be skipped. */
  decideGear() {
    const nowT = performance.now();
    const eff = this.settings;
    const animating = !!this._smoothMoving || !!this.pending || // A shake is a short, fast decay — it needs every frame it can get.
    !!this.shakeOffset() || // The ghost keeps easing after the caret has stopped, so the caret
    // settling is not enough to let the loop park.
    !!this._ghostMoving || this.trail.length > 0 || this.particles.length > 0 || this.flamePixels.length > 0 || this.thunderbolts.length > 0 || this.heat > 0 || !!this._smearMoving;
    const energyShimmer = !!eff.energyEffect && !!this.lastActive;
    const idleRamping = this._idleRamping();
    const recentInput = nowT - (this._lastActivityT || 0) < 1200;
    let blinkFading = false;
    let blinkBucket = 1;
    if (eff.blinkingEnabled && this.lastActive) {
      const a = blinkPhase(this, nowT);
      blinkFading = a > 0.02 && a < 0.98;
      blinkBucket = a >= 0.5 ? 1 : 0;
    }
    const stardustLive = this.stardust.length > 0;
    const stardustActive = stardustLive || stardustArmed(this);
    this._canvasGear = animating || recentInput ? "hot" : blinkFading || stardustActive || idleRamping ? "warm" : energyShimmer ? "energy" : "idle";
    const staticFrame = !animating && !blinkFading && !energyShimmer && !stardustLive && !idleRamping;
    let doDraw = true;
    if (staticFrame) {
      const la = this.lastActive;
      const sig = [
        blinkBucket,
        this.isDarkTheme(),
        la ? `${Math.round(la.x * 2)},${Math.round(la.top * 2)},${Math.round(la.w * 2)},${Math.round(la.h * 2)},${la.char || ""}` : "none",
        eff.cursorStyle,
        eff.colorDark,
        eff.colorLight,
        eff.caretWidthPx,
        eff.cursorOpacity,
        eff.crtEffect,
        eff.glow,
        eff.showChar,
        eff.boxHollow,
        eff.boxHollowWidth,
        eff.lineSerifs,
        eff.underlineWidthPx,
        eff.blinkBreathing,
        eff.blinkBreathDepth,
        // Each of these changes painted pixels on a SETTLED cursor, so
        // omitting one makes editing it appear to do nothing until the
        // next keystroke wakes the loop.
        eff.rowTypeTint,
        eff.rowTypeTintAmount,
        this._rowType,
        eff.selectionColorEnabled,
        this._selectionActive,
        eff.idleFadeEnabled,
        Math.round(this.idleAlpha() * 20),
        eff.comboEnabled,
        eff.comboGlow,
        Math.round((this.comboLevel || 0) * 10),
        eff.ghostEnabled,
        eff.gradientEnabled,
        eff.gradientCount,
        eff.gradientDark1,
        eff.gradientDark2,
        eff.gradientDark3,
        eff.gradientDark4,
        eff.gradientLight1,
        eff.gradientLight2,
        eff.gradientLight3,
        eff.gradientLight4
      ].join("|");
      if (sig === this._drawSig) doDraw = false;
      else this._drawSig = sig;
    } else {
      this._drawSig = null;
    }
    if (this._dirtyFull) doDraw = true;
    if (doDraw) draw(this);
  }
  /** Start or stop the torch loop to match the current settings. */
  syncTorch() {
    if (!this.active) return;
    if (this.settings.torchEffect && !this.torchEngineActive) startTorch(this);
    else if (!this.settings.torchEffect && this.torchEngineActive) stopTorch(this);
  }
  stop() {
    this.active = false;
    this._parked = false;
    if (this.canvasRaf) {
      cancelAnimationFrame(this.canvasRaf);
      this.canvasRaf = 0;
    }
    if (this._canvasIdleT) {
      clearTimeout(this._canvasIdleT);
      this._canvasIdleT = 0;
    }
    this._canvasTick = null;
    stopTorch(this);
    for (const detach of this._detach) {
      try {
        detach();
      } catch {
      }
    }
    this._detach = [];
    closeAudio(this);
    releaseHostCaret(this);
    destroyCanvas(this);
  }
  /** Re-measure after a viewport change. */
  resize() {
    resizeCanvas(this);
  }
}, __name2(_a, "CursorEngine"), _a);
export {
  CursorEngine,
  caretCoords,
  draw,
  drawBeamCaret,
  hexToRgba,
  isTextCaretHost,
  nextSchedule
};
