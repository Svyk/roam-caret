import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BUILTIN_PRESETS,
  CANVAS_EFFECT_KEYS,
  DEFAULTS,
  ENUMS,
  LOOK_KEYS,
  SCHEMA_VERSION,
  STRUCTURAL,
  codeToPreset,
  needsCanvas,
  normalizePresetSnapshot,
  normalizeSettings,
  pickLook,
  presetToCode,
} from "../src/cursor-smith.js";
import {
  caretCoords,
  draw,
  drawBeamCaret,
  nextSchedule,
} from "../src/cursor-engine.js";

function makeRecordingCtx() {
  const ops = [];
  const ctx = {
    roundRect(...a) {
      ops.push(["roundRect", a]);
    },
    fill() {
      ops.push(["fill"]);
    },
    save() {
      ops.push(["save"]);
    },
    restore() {
      ops.push(["restore"]);
    },
    beginPath() {
      ops.push(["beginPath"]);
    },
    moveTo(...a) {
      ops.push(["moveTo", a]);
    },
    lineTo(...a) {
      ops.push(["lineTo", a]);
    },
    closePath() {
      ops.push(["closePath"]);
    },
    fillRect(...a) {
      ops.push(["fillRect", a]);
    },
    strokeRect(...a) {
      ops.push(["strokeRect", a]);
    },
    stroke() {
      ops.push(["stroke"]);
    },
    clearRect() {},
    translate() {},
    scale() {},
    set fillStyle(v) {
      ops.push(["fillStyle", v]);
    },
    set strokeStyle(v) {
      ops.push(["strokeStyle", v]);
    },
    set shadowColor(v) {
      ops.push(["shadowColor", v]);
    },
    set shadowBlur(v) {
      ops.push(["shadowBlur", v]);
    },
    set lineWidth(v) {
      ops.push(["lineWidth", v]);
    },
    set lineJoin(v) {
      ops.push(["lineJoin", v]);
    },
    set globalAlpha(v) {
      ops.push(["globalAlpha", v]);
    },
    measureText() {
      return {
        fontBoundingBoxAscent: 10,
        actualBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 2,
        actualBoundingBoxDescent: 2,
      };
    },
    fillText() {
      ops.push(["fillText"]);
    },
  };
  return { ctx, ops };
}

function makeBeamEngineStub(overrides = {}) {
  const settings = {
    ...DEFAULTS,
    cursorStyle: "Beam",
    caretWidthPx: 3,
    glow: false,
    smear: true,
    crtEffect: false,
    energyEffect: false,
    blinkBreathing: true,
    blinkingEnabled: false,
    showChar: false,
    ...overrides.settings,
  };
  const { ctx, ops } = makeRecordingCtx();
  const engine = {
    ctx,
    settings,
    animActive: {
      x: 100,
      top: 50,
      w: 8,
      h: 20,
      actualCharWidth: 8,
      textColor: "#ffffff",
      ...overrides.animActive,
    },
    trail: overrides.trail || [],
    pending: null,
    comboLevel: 0,
    lastMoveTime: 0,
    styleFor(key) {
      return settings[key];
    },
    getActiveColor: () => "#39ff14",
    idleAlpha: () => 1,
    markDirty: () => {},
    smearCorners: () => null,
    ...overrides.engine,
  };
  return { engine, ops };
}

function makeDrawEngine(cursorStyle) {
  const settings = {
    ...DEFAULTS,
    cursorStyle,
    caretWidthPx: 3,
    glow: false,
    smear: false,
    crtEffect: false,
    energyEffect: false,
    blinkBreathing: true,
    blinkingEnabled: false,
    showChar: false,
    boxHollow: false,
    lineSerifs: false,
    ghostEnabled: false,
  };
  const { ctx, ops } = makeRecordingCtx();
  return {
    ctx,
    canvas: { ownerDocument: { defaultView: { innerWidth: 800, innerHeight: 600 } } },
    settings,
    animActive: { x: 100, top: 50, w: 3, h: 20, actualCharWidth: 8, char: "a", textColor: "#fff", fontSize: 14, fontFamily: "mono" },
    trail: [],
    particles: [],
    flamePixels: [],
    thunderbolts: [],
    stardust: [],
    pending: null,
    smearQuad: null,
    comboLevel: 0,
    lastMoveTime: 0,
    _dirtyFull: false,
    _dirtyPrev: null,
    _dirty: { x0: 0, y0: 0, x1: 200, y1: 100 },
    _ghost: null,
    styleFor(key) {
      return settings[key];
    },
    getActiveColor: () => "#39ff14",
    idleAlpha: () => 1,
    markDirty() {},
    smearCorners: () => null,
    shakeOffset: () => null,
    ops,
  };
}

test("hideNativeCaret defaults to true", () => {
  assert.equal(DEFAULTS.hideNativeCaret, true);
});

test("ENUMS.cursorStyle includes Beam and normalizeSettings keeps it", () => {
  assert.ok(ENUMS.cursorStyle.includes("Beam"));
  const normalized = normalizeSettings({ cursorStyle: "Beam" });
  assert.equal(normalized.cursorStyle, "Beam");
});

test("src omits Needs the CRT glow copy", async () => {
  const src = await readFile(new URL("../src/cursor-smith.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /Needs the CRT/);
});

test("needsCanvas is false for Fast defaults and true for each canvas effect", () => {
  assert.equal(DEFAULTS.smear, false);
  assert.equal(DEFAULTS.popLetters, false);
  assert.equal(DEFAULTS.flameTrail, false);
  assert.equal(DEFAULTS.schemaVersion, SCHEMA_VERSION);
  assert.equal(needsCanvas(DEFAULTS), false);
  assert.equal(needsCanvas(BUILTIN_PRESETS.Fast), false);
  assert.equal(Object.keys(BUILTIN_PRESETS)[0], "Fast");
  assert.equal(needsCanvas({ ...DEFAULTS, ...BUILTIN_PRESETS.Fast }), false);
  assert.equal(needsCanvas({ ...DEFAULTS, ...BUILTIN_PRESETS["Jell-O"] }), true);
  for (const key of CANVAS_EFFECT_KEYS) {
    assert.equal(needsCanvas({ cursorStyle: "Line", [key]: true }), true, key);
  }
});

test("canvas-only Studio controls load the engine; lite-only looks do not", () => {
  for (const key of ["gradientEnabled", "lineSerifs", "idleFadeEnabled", "soundEnabled", "blinkBreathing", "selectionColorEnabled", "rowTypeTint"]) {
    assert.ok(CANVAS_EFFECT_KEYS.includes(key), key);
  }
  assert.equal(needsCanvas({ ...DEFAULTS, cursorStyle: "Line", lineSerifs: true }), true);
  assert.equal(needsCanvas({ ...DEFAULTS, cursorStyle: "Box", lineSerifs: true }), false, "serifs only draw on Line");
  assert.equal(needsCanvas({ ...DEFAULTS, blinkingEnabled: false, blinkBreathing: true }), false);
  assert.equal(needsCanvas({ ...DEFAULTS, moveDelayMs: 120 }), true);
  assert.equal(needsCanvas({ ...DEFAULTS, cursorOpacity: 0.5, blinkSpeed: 3 }), false, "lite handles opacity and blink speed");
});

test("normalizeSettings keeps a built-in preset name as activePreset", () => {
  for (const name of Object.keys(BUILTIN_PRESETS)) {
    const s = normalizeSettings({ ...pickLook(BUILTIN_PRESETS[name]), activePreset: name, schemaVersion: 2 });
    assert.equal(s.activePreset, name);
  }
  assert.equal(normalizeSettings({ activePreset: "Nope", schemaVersion: 2 }).activePreset, "");
});

test("normalizeSettings migrates unversioned 0.1.x blobs once", () => {
  const migrated = normalizeSettings({ smear: true, popLetters: true, flameTrail: true, activePreset: "Jell-O" });
  assert.equal(migrated.smear, false);
  assert.equal(migrated.popLetters, false);
  assert.equal(migrated.flameTrail, false);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.activePreset, "");
  const kept = normalizeSettings({ smear: true, schemaVersion: 2 });
  assert.equal(kept.smear, true);
  assert.equal(kept.schemaVersion, 2);
});

test("pickLook / normalizePresetSnapshot omit structural keys", () => {
  const snap = pickLook({
    ...DEFAULTS,
    enabled: false,
    hideNativeCaret: false,
    colorDark: "#ff00aa",
  });
  for (const key of STRUCTURAL) {
    assert.equal(Object.hasOwn(snap, key), false, key);
  }
  assert.ok(LOOK_KEYS.includes("colorDark"));
  assert.equal(snap.colorDark, "#ff00aa");
  const fromDefaults = normalizePresetSnapshot(DEFAULTS);
  for (const key of STRUCTURAL) {
    assert.equal(Object.hasOwn(fromDefaults, key), false, key);
  }
});

test("presetToCode / codeToPreset roundtrip look keys", () => {
  const look = pickLook({ ...DEFAULTS, colorDark: "#112233", glow: false });
  const code = presetToCode("Roundtrip", look);
  const decoded = codeToPreset(code);
  assert.ok(decoded);
  assert.equal(decoded.name, "Roundtrip");
  for (const key of LOOK_KEYS) {
    assert.equal(decoded.snap[key], look[key], key);
  }
  for (const key of STRUCTURAL) {
    assert.equal(Object.hasOwn(decoded.snap, key), false, key);
  }
});

test("codeToPreset rejects junk and oversize payloads", () => {
  assert.equal(codeToPreset("not-valid-base64!!!"), null);
  assert.equal(codeToPreset(""), null);
  assert.equal(codeToPreset("a".repeat(20001)), null);
});

test("extension.css hides Roam block carets and not Thymer listview", async () => {
  const css = await readFile(new URL("../src/extension.css", import.meta.url), "utf8");
  assert.match(css, /rm-block__input/);
  assert.match(css, /block-input-/);
  assert.doesNotMatch(css, /listview-caret/);
  assert.doesNotMatch(css, /textarea\s*\{[^}]*caret-color/s);
});

test("extension.css hides Svy caret overlay", async () => {
  const css = await readFile(new URL("../src/extension.css", import.meta.url), "utf8");
  assert.match(css, /svy-caret-overlay-ui/);
});

test("renderPanel omits akaready and buymeacoffee chrome", async () => {
  const src = await readFile(new URL("../src/cursor-smith.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /function renderPanel/);
});

test("cursor-smith.js omits Thymer host machinery", async () => {
  const src = await readFile(new URL("../src/cursor-smith.js", import.meta.url), "utf8");
  const forbidden = [
    "listview-caret",
    "__csDebug",
    "thymerCaretCoords",
    "FOCUSED_PANEL_SEL",
    "installCaretObserver",
    "installModalObserver",
    "g_range",
    "text-selection-self",
  ];
  for (const needle of forbidden) {
    assert.doesNotMatch(src, new RegExp(needle), needle);
  }
});

test("nextSchedule parks idle and keeps hot on rAF", () => {
  assert.equal(nextSchedule("idle").type, "park");
  assert.equal(nextSchedule("hot").type, "raf");
  assert.equal(nextSchedule("warm").ms, 33);
  assert.equal(nextSchedule("energy").type, "timeout");
  assert.equal(nextSchedule().type, "raf");
});

test("caretCoords uses caretWidthPx for Beam", () => {
  const e = {
    measurer: {
      latest: () => ({
        x: 100,
        y: 50,
        width: 8,
        height: 20,
        glyph: "",
        color: "#fff",
        fontSize: "14",
        fontFamily: "mono",
      }),
    },
    styleFor(key) {
      const values = { cursorStyle: "Beam", caretWidthPx: 3 };
      return values[key];
    },
  };
  const coords = caretCoords(e);
  assert.equal(coords.w, 3);
});

test("drawBeamCaret paints a centered rounded beam", () => {
  const { engine, ops } = makeBeamEngineStub();
  drawBeamCaret(engine);
  const round = ops.find((op) => op[0] === "roundRect");
  assert.ok(round);
  const [rx, ry, rw, rh, radius] = round[1];
  assert.equal(rw, 3);
  assert.equal(rh, 16.4);
  assert.equal(radius, 3);
  assert.equal(rx, 98.5);
  assert.equal(ry, 51.8);
  assert.ok(ops.some((op) => op[0] === "fill"));
});

test("draw routes Line, Underline, and Box without changing their canvas ops", () => {
  const snapshots = {};
  for (const style of ["Line", "Underline", "Box"]) {
    const e = makeDrawEngine(style);
    draw(e);
    snapshots[style] = e.ops.map((op) => op[0]);
  }
  const caretPath = ["save", "fillStyle", "beginPath", "moveTo", "lineTo", "lineTo", "lineTo", "closePath", "fill", "restore"];
  assert.deepEqual(snapshots.Line, caretPath);
  assert.deepEqual(snapshots.Underline, caretPath);
  assert.deepEqual(snapshots.Box, caretPath);
});

test("draw routes Beam to roundRect and not Box fillRect path", () => {
  const e = makeDrawEngine("Beam");
  draw(e);
  const names = e.ops.map((op) => op[0]);
  assert.ok(names.includes("roundRect"));
  assert.ok(names.includes("fill"));
  assert.equal(names.filter((name) => name === "fillRect").length, 0);
});

test("cursor-engine.js reads the measurer and parks idle (no 100ms heartbeat)", async () => {
  const src = await readFile(new URL("../src/cursor-engine.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /formFieldCaretCoords/);
  assert.doesNotMatch(src, /genericCaretCoords/);
  assert.doesNotMatch(src, /100ms heartbeat/);
  assert.doesNotMatch(src, /gear === "idle"/);
  assert.doesNotMatch(src, /ENERGY_FRAME_MS : 100/);
  const start = src.indexOf("function nextSchedule");
  const end = src.indexOf("function", start + "function nextSchedule".length);
  const block = src.slice(start, end);
  assert.match(block, /"idle"/);
  assert.match(block, /type:\s*"park"/);
  const frameStart = src.indexOf("frame() {");
  const frameEnd = src.indexOf("decideGear() {", frameStart);
  const frameBody = src.slice(frameStart, frameEnd);
  assert.doesNotMatch(frameBody, /getComputedStyle/);
  assert.doesNotMatch(frameBody, /formFieldCaretCoords/);
  assert.doesNotMatch(frameBody, /genericCaretCoords/);
});
