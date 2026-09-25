import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULTS } from "../src/cursor-smith.js";
import {
  MIRROR,
  SAVED_STYLES_ID,
  SAVED_STYLES_PROMPT,
  STYLE_NAME_ID,
  buildDepotPanel,
  createPreviewComponent,
  mirrorToDepot,
  projectToDepot,
} from "../src/settings.js";

const DEPOT_IDS = [
  "cs-enabled",
  "cs-preset",
  "cs-saved-styles",
  "cs-save-style",
  "cs-shape",
  "cs-color-light",
  "cs-color-dark",
  "cs-width",
  "cs-glow",
  "cs-blink",
  "cs-show-char",
  "cs-hide-native",
  "cs-hide-blur",
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
  assert.equal(withReact.settings.length, 18);

  // Without React: no preview, and Name and Save are two plain rows.
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
  const save = buildDepotPanel({ React: null }).settings.find((row) => row.id === "cs-save-style");
  assert.equal(save.name, "Save style");
  assert.equal(save.action.content, "Save");
  assert.equal(copy.action.content, "Copy");
  assert.equal(importBtn.action.content, "Import");
  assert.equal(studio.action.content, "Open");
});

test("Styles lists every saved style whatever Look is", () => {
  const presets = { Teal: {}, Night: {} };
  for (const activePreset of ["", "Fast", "Teal"]) {
    for (const React of [null, fakeReact]) {
      const panel = buildDepotPanel({ settings: { activePreset, presets }, React });
      const row = panel.settings.find((r) => r.id === SAVED_STYLES_ID);
      assert.ok(row, `Styles is listed with Look ${activePreset || "Custom"}`);
      assert.equal(row.name, "Styles");
      assert.equal(row.action.type, "select");
      assert.deepEqual(row.action.items, [SAVED_STYLES_PROMPT, "Teal", "Night"]);
    }
  }
});

test("Styles, then Name and Save, sit directly under Look", () => {
  const afterLook = (React) => {
    const ids = buildDepotPanel({ settings: { activePreset: "Fast", presets: { Teal: {} } }, React })
      .settings.map((row) => row.id);
    const look = ids.indexOf("cs-preset");
    assert.equal(look, 1);
    return ids.slice(look + 1, ids.indexOf("cs-shape"));
  };
  assert.deepEqual(afterLook(fakeReact), [SAVED_STYLES_ID, "cs-save-style"]);
  assert.deepEqual(afterLook(null), [SAVED_STYLES_ID, STYLE_NAME_ID, "cs-save-style"]);
});

test("the Save row puts the name field and the Save button side by side", () => {
  const typed = [];
  const saved = [];
  const panel = buildDepotPanel({
    settings: { cursorStyle: "Beam" },
    styleName: "Teal",
    React: fakeReact,
    handlers: {
      onChange: (id, value) => typed.push([id, value]),
      onSaveStyle: (name) => saved.push(name),
    },
  });
  const row = panel.settings.find((r) => r.id === "cs-save-style");
  assert.equal(row.name, "Save as");
  assert.equal(row.action.type, "reactComponent");
  const tree = row.action.component();
  assert.equal(tree.props.className, "cs-save-style");
  const [input, button] = tree.children;
  assert.equal(input.tag, "input");
  assert.equal(input.props.defaultValue, "Teal", "shows the current style name");
  assert.equal(input.props.placeholder, "Beam", "an empty name saves under the shape");
  assert.equal(button.tag, "button");
  assert.deepEqual(button.children, ["Save"]);

  input.props.onChange({ target: { value: "Ocean" } });
  assert.deepEqual(typed, [[STYLE_NAME_ID, "Ocean"]]);
  input.props.ref({ value: "Ocean" });
  button.props.onClick();
  assert.deepEqual(saved, ["Ocean"], "Save takes the name in the field");
});

test("the Styles menu shows the active saved style, else its prompt", () => {
  const presets = { Teal: {} };
  assert.equal(projectToDepot({ activePreset: "Teal", presets })[SAVED_STYLES_ID], "Teal");
  assert.equal(projectToDepot({ activePreset: "Fast", presets })[SAVED_STYLES_ID], SAVED_STYLES_PROMPT);
  assert.equal(projectToDepot({ activePreset: "", presets })[SAVED_STYLES_ID], SAVED_STYLES_PROMPT);
});
