const __defProp = Object.defineProperty;
const __name = (target, value) => __defProp(target, "name", { value, configurable: true });




// ../../shared/settings-ui/tailwind-palette.js
var TW_SHADES = Object.freeze([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
var TW_MID_INDEX = 5;
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

// settings.js
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

// styles.js
var ROOT_CLASS = "plg-cursor-smith";
var BODY_ACTIVE_CLASS = "cs-active";
var BODY_HIDE_NATIVE_CLASS = "cs-hide-native";
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
 the render loop picked \u2014 and because this element carries mix-blend-mode,
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


export {
  DEFAULTS,
  SCHEMA_VERSION,
  CANVAS_EFFECT_KEYS,
  needsCanvas,
  STRUCTURAL,
  LOOK_KEYS,
  NUM_SPECS,
  ENUMS,
  HEX_KEYS,
  normalizeSettings,
  normalizePresetSnapshot,
  normalizePresets,
  pickLook,
  randomizeLook,
  presetToCode,
  codeToPreset,
  BUILTIN_PRESETS,
  STATIC_CSS,
  ROOT_CLASS,
  BODY_ACTIVE_CLASS,
  BODY_HIDE_NATIVE_CLASS,
  WRAP_CLASS,
  CANVAS_CLASS,
  TORCH_CLASS,
  normalizeHex,
};
