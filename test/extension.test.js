import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import extension, { getRuntime, uniquePresetName, VERSION } from "../src/extension.js";
import {
  BODY_ACTIVE_CLASS,
  BODY_HIDE_NATIVE_CLASS,
  BUILTIN_PRESETS,
  DEFAULTS,
  codeToPreset,
  pickLook,
  presetToCode,
} from "../src/cursor-smith.js";
import { OPTIONS_KEY } from "../src/settings.js";

const COMMANDS = [
  "Roam Caret: Open settings",
  "Roam Caret: Studio",
  "Roam Caret: Toggle on/off",
  "Roam Caret: Random look",
  "Roam Caret: Cycle preset",
  "Roam Caret: Diagnose caret (5s)",
];

function installMinimalDom() {
  if (typeof document !== "undefined") return;
  const allElements = [];
  const created = [];
  const classes = new Set();
  const classList = {
    contains: (name) => classes.has(name),
    add: (...names) => { for (const name of names) classes.add(name); },
    remove: (...names) => { for (const name of names) classes.delete(name); },
    toggle: (name, force) => {
      const on = force === undefined ? !classes.has(name) : !!force;
      if (on) classes.add(name);
      else classes.delete(name);
      return on;
    },
  };
  function makeContainer() {
    return {
      classList,
      className: "",
      children: [],
      isConnected: true,
      append(...kids) {
        for (const child of kids) {
          child.parentNode = this;
          child.isConnected = true;
          this.children.push(child);
        }
      },
      appendChild(child) { this.append(child); },
      remove() {},
    };
  }
  const head = makeContainer();
  const body = makeContainer();
  const documentElement = {
    classList: { contains: () => false, add() {}, remove() {} },
    className: "",
    getAttribute: () => null,
  };
  function createElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      className: "",
      get ownerDocument() { return globalThis.document; },
      style: { setProperty() {}, getPropertyValue: () => "", getPropertyPriority: () => "" },
      getContext: tag.toLowerCase() === "canvas" ? () => ({
        setTransform() {},
        clearRect() {},
        save() {},
        restore() {},
        beginPath() {},
        fill() {},
        stroke() {},
        fillRect() {},
        scale() {},
      }) : undefined,
      attributes: {},
      children: [],
      parentNode: null,
      isConnected: false,
      setAttribute(name, value) {
        this.attributes[name] = value;
        if (name === "data-cursor-smith" && this._createdRecord) {
          this._createdRecord.dataCursorSmith = value;
        }
      },
      getAttribute(name) { return this.attributes[name] ?? null; },
      addEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      append(...kids) {
        for (const child of kids) {
          child.parentNode = this;
          child.isConnected = true;
          this.children.push(child);
        }
      },
      appendChild(child) { this.append(child); },
      remove() {
        if (this.parentNode) {
          this.parentNode.children = this.parentNode.children.filter((c) => c !== this);
        }
        this.isConnected = false;
        this.parentNode = null;
      },
      textContent: "",
    };
    const record = { tagName: el.tagName, dataCursorSmith: null };
    el._createdRecord = record;
    allElements.push(el);
    created.push(record);
    return el;
  }
  function queryStudioStyles() {
    return allElements.filter(
      (el) => el.tagName === "STYLE"
        && el.isConnected
        && el.getAttribute("data-cursor-smith") === "studio",
    );
  }
  const docListeners = [];
  globalThis.document = {
    _created: created,
    _docListeners: docListeners,
    body,
    documentElement,
    head,
    get defaultView() { return globalThis.window; },
    createElement,
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
    querySelector: (sel) => (sel === 'style[data-cursor-smith=studio]' ? queryStudioStyles()[0] : null),
    querySelectorAll: (sel) => (sel === 'style[data-cursor-smith=studio]' ? queryStudioStyles() : []),
    addEventListener(type, fn, capture) { docListeners.push({ type, fn, capture: !!capture }); },
    removeEventListener(type, fn, capture) {
      const idx = docListeners.findIndex(
        (l) => l.type === type && l.fn === fn && l.capture === !!capture,
      );
      if (idx >= 0) docListeners.splice(idx, 1);
    },
    dispatchKeydown(ev) {
      for (const { type, fn, capture } of [...docListeners]) {
        if (type === "keydown") fn(ev, capture);
      }
    },
    activeElement: body,
  };
  if (typeof globalThis.Node === "undefined") {
    function Node() {}
    Node.ELEMENT_NODE = 1;
    Node.TEXT_NODE = 3;
    globalThis.Node = Node;
  }
  globalThis.getComputedStyle = () => new Proxy({ backgroundColor: "transparent" }, {
    get: (target, prop) => (prop in target ? target[prop] : ""),
  });
  if (typeof globalThis.window === "undefined") globalThis.window = globalThis;
  globalThis.window.innerWidth = globalThis.window.innerWidth || 800;
  globalThis.window.innerHeight = globalThis.window.innerHeight || 600;
  globalThis.window.devicePixelRatio = globalThis.window.devicePixelRatio || 1;
  globalThis.window.getComputedStyle = globalThis.getComputedStyle;
  globalThis.window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  globalThis.window.addEventListener = () => {};
  globalThis.window.removeEventListener = () => {};
  globalThis.requestAnimationFrame = (fn) => {
    globalThis.__rafCount = (globalThis.__rafCount || 0) + 1;
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {};
}

function fakeExtensionApi() {
  const values = new Map();
  const calls = [];
  const commands = new Map();
  return {
    calls,
    commands,
    settings: {
      canSet: true,
      get: (key) => values.get(key) ?? null,
      set: async (key, value) => { values.set(key, value); calls.push(["setting:set", key, value]); return null; },
      panel: {
        create: async (config) => { calls.push(["panel:create", config]); return null; },
      },
    },
    ui: {
      commandPalette: {
        addCommand: async ({ label, callback }) => {
          calls.push(["command:add", label]);
          commands.set(label, callback);
          return null;
        },
        removeCommand: async ({ label }) => { calls.push(["command:remove", label]); return null; },
      },
    },
  };
}

function studioStyleCount() {
  return document.querySelectorAll('style[data-cursor-smith=studio]').length;
}

function panelCreates(api) {
  return api.calls.filter(([name]) => name === "panel:create");
}

function docInputListenerCount() {
  return document._docListeners.filter((l) => l.type === "input").length;
}

const EXTENSION_SRC = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../src/extension.js"),
  "utf8",
);

function lastPanelConfig(api) {
  const creates = panelCreates(api);
  return creates.at(-1)?.[1] ?? null;
}

test("extension exports the Roam lifecycle contract and survives repeated unload", async () => {
  installMinimalDom();
  assert.equal(typeof extension.onload, "function");
  assert.equal(typeof extension.onunload, "function");

  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  assert.equal(typeof cleanup, "function");
  assert.equal(globalThis.__ROAM_CURSOR_SMITH_VERSION, VERSION);
  assert.equal(
    api.calls.filter(([name, key]) => name === "setting:set" && key === OPTIONS_KEY).length,
    0,
  );
  assert.ok(
    api.calls.some(([name, key, value]) => name === "setting:set" && key === "cs-enabled" && value === true),
  );
  assert.equal(panelCreates(api).length, 1);
  assert.equal(panelCreates(api)[0][1].tabTitle, "Roam Caret");
  assert.deepEqual(
    api.calls.filter(([name]) => name === "command:add").map(([, label]) => label),
    COMMANDS,
  );

  await cleanup();
  await extension.onunload();
  await extension.onunload();

  assert.equal(globalThis.__ROAM_CURSOR_SMITH_VERSION, undefined);
  assert.equal(document.body.classList.contains(BODY_ACTIVE_CLASS), false);
  assert.equal(document.body.classList.contains(BODY_HIDE_NATIVE_CLASS), false);
  assert.equal(api.calls.filter(([name]) => name === "command:remove").length, COMMANDS.length);
});

test("a second load disposes the previous runtime before registering again", async () => {
  installMinimalDom();
  const firstApi = fakeExtensionApi();
  const secondApi = fakeExtensionApi();

  await extension.onload({ extensionAPI: firstApi, extension: { version: "one" } });
  const cleanup = await extension.onload({ extensionAPI: secondApi, extension: { version: "two" } });

  assert.equal(firstApi.calls.filter(([name]) => name === "command:remove").length, COMMANDS.length);
  assert.equal(secondApi.calls.filter(([name]) => name === "command:add").length, COMMANDS.length);
  await cleanup();
});

test("studio CSS injects only while the settings overlay is open", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();

  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: "0.1.1" } });
  const openStudio = api.commands.get("Roam Caret: Studio");
  assert.equal(studioStyleCount(), 0);

  await openStudio();
  assert.equal(studioStyleCount(), 1);
  assert.equal(
    document._created.filter((el) => el.dataCursorSmith === "studio").length,
    1,
  );

  document.dispatchKeydown({ key: "Escape", stopPropagation() {} });
  assert.equal(studioStyleCount(), 0);

  await openStudio();
  assert.equal(studioStyleCount(), 1);
  await extension.onunload();
  assert.equal(studioStyleCount(), 0);

  await cleanup();
});

test("default settings start lite and smear switches to canvas", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  assert.equal(runtime._mode, "lite");
  assert.ok(runtime._lite);
  assert.equal(runtime._engine, null);
  const liteNodes = document.body.children.filter((el) => el.className === "cs-lite-caret");
  assert.equal(liteNodes.length, 1);

  runtime._set({ smear: true });
  assert.equal(runtime._mode, "canvas");
  await runtime._engineStart;
  assert.equal(runtime._lite, null);
  assert.ok(runtime._engine);

  runtime._set({ smear: false });
  assert.equal(runtime._mode, "lite");
  assert.equal(runtime._engine, null);
  assert.ok(runtime._lite);

  await cleanup();
});

test("pump installs only on canvas and document input listeners stay singular", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();

  assert.equal(runtime._mode, "lite");
  assert.equal(docInputListenerCount(), 1);
  assert.equal(runtime._pumpInstalled, false);

  runtime._set({ smear: true });
  assert.equal(runtime._mode, "canvas");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(docInputListenerCount(), 1);
  assert.equal(runtime._pumpInstalled, true);

  runtime._set({ smear: false });
  assert.equal(runtime._mode, "lite");
  assert.equal(docInputListenerCount(), 1);
  assert.equal(runtime._pumpInstalled, false);

  await cleanup();
  assert.equal(docInputListenerCount(), 0);
});

test("diagnoseCaret exists and diagnostic samples omit listviewCarets", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();

  assert.doesNotMatch(EXTENSION_SRC, /listviewCarets/);
  assert.equal(typeof runtime.diagnoseCaret, "function");

  await cleanup();
});

test("depot panel is created on load and again after cyclePreset", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();

  assert.equal(panelCreates(api).length, 1);

  runtime._set({
    presets: {
      Alpha: pickLook({ ...DEFAULTS, colorLight: "#111111" }),
      Beta: pickLook({ ...DEFAULTS, colorLight: "#222222" }),
    },
    activePreset: "Alpha",
  });
  await new Promise((resolve) => setImmediate(resolve));
  const beforeCycle = panelCreates(api).length;
  runtime.cyclePreset();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(panelCreates(api).length, beforeCycle + 1);

  await cleanup();
});

test("depot glow switch updates runtime settings and cs-glow mirror", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });

  const config = lastPanelConfig(api);
  const glowRow = config.settings.find((row) => row.id === "cs-glow");
  assert.ok(glowRow);
  glowRow.action.onChange({ target: { checked: false } });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(getRuntime()._settings.glow, false);
  assert.equal(api.settings.get("cs-glow"), false);

  await cleanup();
});

test("depot import merges preset and clears cs-import-code", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });

  const code = presetToCode("X", pickLook({ ...DEFAULTS, colorDark: "#112233" }));
  await api.settings.set("cs-import-code", code);

  const config = lastPanelConfig(api);
  const importRow = config.settings.find((row) => row.id === "cs-import");
  await getRuntime().importShareCode();

  assert.ok(getRuntime()._settings.presets.X);
  assert.equal(getRuntime()._settings.activePreset, "X");
  assert.equal(api.settings.get("cs-import-code"), "");

  await cleanup();
});


function settle() {
  return new Promise((resolve) => setImmediate(resolve));
}

function depotRow(api, id) {
  return lastPanelConfig(api).settings.find((row) => row.id === id);
}

function styledBlock() {
  const props = new Map();
  return {
    tagName: "TEXTAREA",
    id: "block-input-native",
    className: "rm-block-input",
    value: "",
    selectionStart: 0,
    selectionEnd: 0,
    closest: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 400, bottom: 40, width: 400, height: 40 }),
    style: {
      setProperty(name, value, priority) { props.set(name, { value, priority }); },
      removeProperty(name) { props.delete(name); },
      getPropertyValue(name) { return props.get(name)?.value ?? ""; },
    },
  };
}

test("plain Line runs native: no overlay, no measurer, a keystroke never measures", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  const block = styledBlock();
  document.activeElement = block;
  try {
    runtime._set({ cursorStyle: "Line", glow: false, showChar: false });
    assert.equal(runtime._mode, "native");
    assert.equal(runtime._lite, null);
    assert.equal(runtime._measurer, null);
    assert.equal(
      document.body.children.filter((el) => el.className === "cs-lite-caret").length,
      0,
    );
    assert.equal(block.style.getPropertyValue("caret-color"), DEFAULTS.colorLight);
    assert.equal(document.body.classList.contains(BODY_ACTIVE_CLASS), true);
    assert.equal(document.body.classList.contains(BODY_HIDE_NATIVE_CLASS), false);

    const before = runtime._measureCount;
    for (const { type, fn } of [...document._docListeners]) {
      if (type === "input" || type === "keyup" || type === "selectionchange") fn({ target: block, type });
    }
    assert.equal(runtime._measureCount, before, "one keystroke must not call measure");

    runtime._set({ glow: true });
    assert.equal(runtime._mode, "lite");
    assert.ok(runtime._lite);
    assert.equal(block.style.getPropertyValue("caret-color"), "", "caret-color removed when the look stops being a plain line");
  } finally {
    document.activeElement = document.body;
    await cleanup();
  }
});

test("native caret-color is removed on unload", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const block = styledBlock();
  document.activeElement = block;
  try {
    getRuntime()._set({ cursorStyle: "Line", glow: false, showChar: false });
    assert.notEqual(block.style.getPropertyValue("caret-color"), "");
  } finally {
    await cleanup();
    document.activeElement = document.body;
  }
  assert.equal(block.style.getPropertyValue("caret-color"), "");
});

test("__ROAM_CARET_DIAG exists on the lite path and is removed on unload", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const diag = globalThis.window.__ROAM_CARET_DIAG;
  assert.ok(diag);
  assert.deepEqual(diag.measures, []);
  await cleanup();
  assert.equal(globalThis.window.__ROAM_CARET_DIAG, undefined);
});

test("Depot Look menu keeps a built-in preset after rebuildPanel", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  try {
    for (const name of ["Fast", "mr.Blue"]) {
      const creates = panelCreates(api).length;
      await depotRow(api, "cs-preset").action.onChange({ target: { value: name } });
      await settle();
      await settle();
      assert.equal(runtime._settings.activePreset, name);
      assert.equal(api.settings.get("cs-preset"), name, `${name} must not snap back to Custom`);
      assert.ok(panelCreates(api).length > creates, "panel was rebuilt");
      assert.ok(depotRow(api, "cs-preset").action.items.includes(name));
    }
  } finally {
    await cleanup();
  }
});

test("Depot Look menu keeps an imported preset after rebuildPanel", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  try {
    await api.settings.set("cs-import-code", presetToCode("Teal", pickLook({ ...DEFAULTS, colorLight: "#00695e" })));
    await runtime.importShareCode();
    await settle();
    await depotRow(api, "cs-preset").action.onChange({ target: { value: "Custom" } });
    await settle();
    assert.equal(api.settings.get("cs-preset"), "Custom");

    await depotRow(api, "cs-preset").action.onChange({ target: { value: "Teal" } });
    await settle();
    await settle();
    assert.equal(runtime._settings.activePreset, "Teal");
    assert.equal(api.settings.get("cs-preset"), "Teal");
    assert.ok(depotRow(api, "cs-preset").action.items.includes("Teal"));
  } finally {
    await cleanup();
  }
});

test("editing the look after picking a preset turns the menu to Custom", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  try {
    await depotRow(api, "cs-preset").action.onChange({ target: { value: "Fast" } });
    await settle();
    await depotRow(api, "cs-shape").action.onChange({ target: { value: "Beam" } });
    await settle();
    await settle();
    assert.equal(runtime._settings.activePreset, "");
    assert.equal(api.settings.get("cs-preset"), "Custom");

    runtime._set({ enabled: true });
    await depotRow(api, "cs-preset").action.onChange({ target: { value: "Fast" } });
    await settle();
    runtime._set({ enabled: true });
    assert.equal(runtime._settings.activePreset, "Fast", "structural changes keep the preset");
  } finally {
    await cleanup();
  }
});

test("share code names: the active preset, else the shape", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  try {
    runtime._set({ cursorStyle: "Beam" });
    assert.equal(codeToPreset(runtime.copyShareCode()).name, "Beam");
    runtime._set({ cursorStyle: "Underline" });
    assert.equal(codeToPreset(runtime.copyShareCode()).name, "Underline");

    await depotRow(api, "cs-preset").action.onChange({ target: { value: "Fast" } });
    await settle();
    const decoded = codeToPreset(runtime.copyShareCode());
    assert.equal(decoded.name, "Fast");
    assert.notEqual(decoded.name, "Current");
  } finally {
    await cleanup();
  }
});

test("importing two different custom looks keeps both", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  const lookA = pickLook({ ...DEFAULTS, cursorStyle: "Box", colorDark: "#112233" });
  const lookB = pickLook({ ...DEFAULTS, cursorStyle: "Box", colorDark: "#445566" });
  try {
    await api.settings.set("cs-import-code", presetToCode("Box", lookA));
    await runtime.importShareCode();
    await api.settings.set("cs-import-code", presetToCode("Box", lookB));
    await runtime.importShareCode();
    const presets = runtime._settings.presets;
    assert.equal(presets.Box.colorDark, "#112233");
    assert.equal(presets["Box 2"].colorDark, "#445566");
    assert.equal(runtime._settings.activePreset, "Box 2");

    await api.settings.set("cs-import-code", presetToCode("Box", lookA));
    await runtime.importShareCode();
    assert.equal(runtime._settings.activePreset, "Box", "same look reuses its name");
    assert.equal(Object.keys(runtime._settings.presets).length, 2);

    await api.settings.set("cs-import-code", presetToCode("Fast", pickLook(BUILTIN_PRESETS.Fast)));
    await runtime.importShareCode();
    assert.equal(runtime._settings.activePreset, "Fast");
    assert.equal(Object.prototype.hasOwnProperty.call(runtime._settings.presets, "Fast"), false);

    await api.settings.set("cs-import-code", presetToCode("Fast", lookB));
    await runtime.importShareCode();
    assert.equal(runtime._settings.activePreset, "Fast 2", "a built-in name never gets shadowed");
  } finally {
    await cleanup();
  }
});

test("uniquePresetName never collides with Custom or a built-in", () => {
  const look = pickLook({ ...DEFAULTS, colorDark: "#010203" });
  assert.equal(uniquePresetName("Custom", look, {}), "Custom 2");
  assert.equal(uniquePresetName("Jell-O", look, {}), "Jell-O 2");
  assert.equal(uniquePresetName("x".repeat(60), look, { ["x".repeat(48)]: pickLook(DEFAULTS) }).length, 48);
});

test("Depot colour field ignores a partial hex", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: VERSION } });
  const runtime = getRuntime();
  try {
    const row = depotRow(api, "cs-color-dark");
    await row.action.onChange({ target: { value: "#123456" } });
    assert.equal(runtime._settings.colorDark, "#123456");
    for (const partial of ["#", "#3", "#3a", "#3a3", "#3a3b3"]) {
      await row.action.onChange({ target: { value: partial } });
      assert.equal(runtime._settings.colorDark, "#123456", `${partial} must not be written`);
    }
    await row.action.onChange({ target: { value: "#3a3b3c" } });
    assert.equal(runtime._settings.colorDark, "#3a3b3c");
  } finally {
    await cleanup();
  }
});
