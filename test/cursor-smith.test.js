import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULTS,
  LOOK_KEYS,
  STRUCTURAL,
  codeToPreset,
  normalizePresetSnapshot,
  pickLook,
  presetToCode,
} from "../src/cursor-smith.js";

test("hideNativeCaret defaults to true", () => {
  assert.equal(DEFAULTS.hideNativeCaret, true);
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
