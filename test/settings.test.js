import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULTS } from "../src/cursor-smith.js";
import {
  MIRROR,
  buildDepotPanel,
  createPreviewComponent,
  mirrorToDepot,
  projectToDepot,
  readSvyBeamColors,
} from "../src/settings.js";

const DEPOT_IDS = [
  "cs-enabled",
  "cs-preset",
  "cs-shape",
  "cs-color-light",
  "cs-color-dark",
  "cs-width",
  "cs-glow",
  "cs-blink",
  "cs-show-char",
  "cs-hide-native",
  "cs-hide-blur",
  "cs-match-svy",
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
  assert.equal(withReact.settings.length, 17);

  const withoutReact = buildDepotPanel({ React: null });
  assert.equal(withoutReact.settings.length, 16);
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

test("readSvyBeamColors reads Svy theme CSS variables", () => {
  const root = {};
  const goodStyle = {
    getPropertyValue: (prop) => {
      if (prop === "--svy-beam-caret-light") return "#00695e";
      if (prop === "--svy-beam-caret-dark") return "#48d0c0";
      return "";
    },
  };
  const emptyStyle = {
    getPropertyValue: () => "",
  };

  assert.deepEqual(
    readSvyBeamColors(() => goodStyle, root),
    { colorLight: "#00695e", colorDark: "#48d0c0" },
  );
  assert.equal(readSvyBeamColors(() => emptyStyle, root), null);
});
