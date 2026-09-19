import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BUILTIN_PRESETS,
  CANVAS_EFFECT_KEYS,
  DEFAULTS,
  LOOK_KEYS,
  SCHEMA_VERSION,
  STRUCTURAL,
  codeToPreset,
  needsCanvas,
  nextSchedule,
  normalizePresetSnapshot,
  normalizeSettings,
  pickLook,
  presetToCode,
} from "../src/cursor-smith.js";

test("hideNativeCaret defaults to true", () => {
  assert.equal(DEFAULTS.hideNativeCaret, true);
});

test("needsCanvas is false for Fast defaults and true for each canvas effect", () => {
  assert.equal(DEFAULTS.smear, false);
  assert.equal(DEFAULTS.popLetters, false);
  assert.equal(DEFAULTS.flameTrail, false);
  assert.equal(DEFAULTS.schemaVersion, SCHEMA_VERSION);
  assert.equal(needsCanvas(DEFAULTS), false);
  assert.equal(needsCanvas(BUILTIN_PRESETS.Fast), false);
  assert.equal(Object.keys(BUILTIN_PRESETS)[0], "Fast");
  assert.equal(needsCanvas({ ...DEFAULTS, ...BUILTIN_PRESETS["Jell-O"] }), true);
  for (const key of CANVAS_EFFECT_KEYS) {
    assert.equal(needsCanvas({ [key]: true }), true, key);
  }
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

test("built extension.css hides Roam block carets and not Thymer listview", async () => {
  const css = await readFile(new URL("../extension.css", import.meta.url), "utf8");
  assert.match(css, /rm-block__input/);
  assert.match(css, /block-input-/);
  assert.doesNotMatch(css, /listview-caret/);
  assert.doesNotMatch(css, /textarea\s*\{[^}]*caret-color/s);
});

test("extension.css uses opaque panel chrome and hides Svy caret overlay", async () => {
  const css = await readFile(new URL("../src/extension.css", import.meta.url), "utf8");
  assert.match(css, /\.cs-panel\.cs-panel[\s\S]*background:\s*Canvas/);
  assert.match(css, /svy-caret-overlay-ui/);
  assert.match(css, /\.cs-panel-overlay[\s\S]*z-index:\s*10000/);
});

test("renderPanel omits akaready and buymeacoffee chrome", async () => {
  const src = await readFile(new URL("../src/cursor-smith.js", import.meta.url), "utf8");
  const start = src.indexOf("function renderPanel");
  const end = src.indexOf("__name(renderPanel", start);
  const block = src.slice(start, end);
  assert.doesNotMatch(block, /feedback:/);
  assert.doesNotMatch(block, /akaready/);
  assert.doesNotMatch(block, /buymeacoffee/);
  assert.doesNotMatch(block, /scope:\s*ctl\.scopeArgs/);
  assert.match(block, /Hide Roam's native caret/);
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

test("cursor-smith.js reads the measurer and parks idle (no 100ms heartbeat)", async () => {
  const src = await readFile(new URL("../src/cursor-smith.js", import.meta.url), "utf8");
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
