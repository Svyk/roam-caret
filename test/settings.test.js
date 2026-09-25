import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULTS } from "../src/cursor-smith.js";
import {
  MIRROR,
  SAVED_STYLES_ID,
  SAVED_STYLES_PROMPT,
  buildDepotPanel,
  createPreviewComponent,
  mirrorToDepot,
  projectToDepot,
} from "../src/settings.js";

const DEPOT_IDS = [
  "cs-enabled",
  "cs-preset",
  "cs-saved-styles",
  "cs-shape",
  "cs-color-light",
  "cs-color-dark",
  "cs-width",
  "cs-glow",
  "cs-blink",
  "cs-show-char",
  "cs-hide-native",
  "cs-hide-blur",
  "cs-style-name",
  "cs-save-style",
  "cs-copy-code",
  "cs-import-code",
  "cs-import",
  "cs-studio",
  "cs-preview",
];

const PANEL_ACTION_TYPES = new Set(["switch", "input", "select", "button", "reactComponent"]);

const fakeReact = {
  createElement(tag, props, ...children) {
    return { tag, props, children };
  },
};

test("every MIRROR value is a DEFAULTS key", () => {
  const defaultKeys = Object.keys(DEFAULTS);
  for (const blobKey of Object.values(MIRROR)) {
    assert.ok(defaultKeys.includes(blobKey), `${blobKey} missing from DEFAULTS`);
  }
});

test("buildDepotPanel tab title and row count", () => {
  const withReact = buildDepotPanel({ React: fakeReact });
  assert.equal(withReact.tabTitle, "Roam Caret");
  assert.equal(withReact.settings.length, 19);

  const withoutReact = buildDepotPanel({ React: null });
  assert.equal(withoutReact.settings.length, 18);
});

test("buildDepotPanel row ids and action types", () => {
  const panel = buildDepotPanel({ React: fakeReact });
  assert.deepEqual(panel.settings.map((row) => row.id), DEPOT_IDS);
  for (const row of panel.settings) {
    assert.ok(PANEL_ACTION_TYPES.has(row.action.type), `${row.id} has invalid action type`);
  }
});

test("createPreviewComponent returns null without React.createElement", () => {
  assert.equal(createPreviewComponent(null), null);
  assert.equal(createPreviewComponent({}), null);
});

test("mirrorToDepot writes only changed ids", async () => {
  const settings = {
    ...DEFAULTS,
    activePreset: "",
    caretWidthPx: 3,
  };
  const store = new Map();
  let writes = 0;
  const extensionAPI = {
    settings: {
      get: (id) => store.get(id),
      set: async (id, value) => {
        writes += 1;
        store.set(id, value);
      },
    },
  };

  writes = 0;
  const first = await mirrorToDepot(extensionAPI, settings);
  assert.equal(first, Object.keys(MIRROR).length);
  assert.equal(writes, Object.keys(MIRROR).length);

  writes = 0;
  const second = await mirrorToDepot(extensionAPI, settings);
  assert.equal(second, 0);
  assert.equal(writes, 0);
});

test("loadOptions does not read cs-* depot ids", async () => {
  const source = await readFile(new URL("../src/settings.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /settings\.get\("cs-/);
});

test("depot buttons set action.content labels", () => {
  const panel = buildDepotPanel({ React: fakeReact });
  const copy = panel.settings.find((row) => row.id === "cs-copy-code");
  const importBtn = panel.settings.find((row) => row.id === "cs-import");
  const studio = panel.settings.find((row) => row.id === "cs-studio");
  const save = panel.settings.find((row) => row.id === "cs-save-style");
  assert.equal(save.name, "Save style");
  assert.equal(save.action.content, "Save");
  assert.equal(copy.action.content, "Copy");
  assert.equal(importBtn.action.content, "Import");
  assert.equal(studio.action.content, "Open");
});

test("Custom reveals the Saved styles select, listing every saved style", () => {
  const presets = { Teal: {}, Night: {} };
  const panel = buildDepotPanel({ settings: { activePreset: "", presets }, React: null });
  const ids = panel.settings.map((row) => row.id);
  assert.equal(ids.indexOf(SAVED_STYLES_ID), ids.indexOf("cs-preset") + 1, "right under Look");
  const row = panel.settings.find((r) => r.id === SAVED_STYLES_ID);
  assert.equal(row.name, "Saved styles");
  assert.equal(row.action.type, "select");
  assert.deepEqual(row.action.items, [SAVED_STYLES_PROMPT, "Teal", "Night"]);
  const name = panel.settings.find((r) => r.id === "cs-style-name");
  assert.equal(name.name, "Style name");
  assert.equal(name.action.type, "input");
});

test("a named Look omits the Saved styles row", () => {
  for (const activePreset of ["Fast", "Teal"]) {
    const panel = buildDepotPanel({ settings: { activePreset, presets: { Teal: {} } }, React: null });
    assert.equal(panel.settings.some((row) => row.id === SAVED_STYLES_ID), false, activePreset);
    assert.ok(panel.settings.some((row) => row.id === "cs-style-name"), "Style name stays");
  }
});
