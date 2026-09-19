import assert from "node:assert/strict";
import test from "node:test";

import extension, { getRuntime } from "../src/extension.js";
import { BODY_ACTIVE_CLASS, BODY_HIDE_NATIVE_CLASS } from "../src/cursor-smith.js";

const COMMANDS = [
  "Cursor Smith: Settings",
  "Cursor Smith: Toggle on/off",
  "Cursor Smith: Random look",
  "Cursor Smith: Cycle preset",
  "Cursor Smith: Diagnose caret (5s)",
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
  function queryPanelStyles() {
    return allElements.filter(
      (el) => el.tagName === "STYLE"
        && el.isConnected
        && el.getAttribute("data-cursor-smith") === "panel",
    );
  }
  const docListeners = [];
  globalThis.document = {
    _created: created,
    body,
    documentElement,
    head,
    get defaultView() { return globalThis.window; },
    createElement,
    querySelector: (sel) => (sel === 'style[data-cursor-smith=panel]' ? queryPanelStyles()[0] : null),
    querySelectorAll: (sel) => (sel === 'style[data-cursor-smith=panel]' ? queryPanelStyles() : []),
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
        create: async (config) => { calls.push(["panel:create", config.tabTitle]); return null; },
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

function panelStyleCount() {
  return document.querySelectorAll('style[data-cursor-smith=panel]').length;
}

test("extension exports the Roam lifecycle contract and survives repeated unload", async () => {
  installMinimalDom();
  assert.equal(typeof extension.onload, "function");
  assert.equal(typeof extension.onunload, "function");

  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: "0.2.0" } });
  assert.equal(typeof cleanup, "function");
  assert.equal(globalThis.__ROAM_CURSOR_SMITH_VERSION, "0.2.0");
  assert.equal(api.calls.filter(([name]) => name === "setting:set").length, 0);
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

test("panel CSS injects only while the settings overlay is open", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();

  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: "0.1.1" } });
  const openSettings = api.commands.get("Cursor Smith: Settings");
  assert.equal(panelStyleCount(), 0);

  await openSettings();
  assert.equal(panelStyleCount(), 1);
  assert.equal(
    document._created.filter((el) => el.dataCursorSmith === "panel").length,
    1,
  );

  document.dispatchKeydown({ key: "Escape", stopPropagation() {} });
  assert.equal(panelStyleCount(), 0);

  await openSettings();
  assert.equal(panelStyleCount(), 1);
  await extension.onunload();
  assert.equal(panelStyleCount(), 0);

  await cleanup();
});

test("default settings start lite and smear switches to canvas", async () => {
  installMinimalDom();
  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: "0.2.0" } });
  const runtime = getRuntime();
  assert.equal(runtime._mode, "lite");
  assert.ok(runtime._lite);
  assert.equal(runtime._engine, null);
  const liteNodes = document.body.children.filter((el) => el.className === "cs-lite-caret");
  assert.equal(liteNodes.length, 1);

  runtime._set({ smear: true });
  assert.equal(runtime._mode, "canvas");
  assert.equal(runtime._lite, null);
  assert.ok(runtime._engine);

  runtime._set({ smear: false });
  assert.equal(runtime._mode, "lite");
  assert.equal(runtime._engine, null);
  assert.ok(runtime._lite);

  await cleanup();
});
