import assert from "node:assert/strict";
import test from "node:test";

import extension from "../src/extension.js";
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
  const body = { classList, className: "", append() {}, appendChild() {}, remove() {} };
  const documentElement = {
    classList: { contains: () => false, add() {}, remove() {} },
    className: "",
    getAttribute: () => null,
  };
  globalThis.document = {
    body,
    documentElement,
    head: body,
    createElement: () => ({
      className: "",
      style: { setProperty() {}, getPropertyValue: () => "", getPropertyPriority: () => "" },
      setAttribute() {},
      addEventListener() {},
      append() {},
      appendChild() {},
      remove() {},
      textContent: "",
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    activeElement: body,
  };
  if (typeof globalThis.window === "undefined") globalThis.window = globalThis;
}

function fakeExtensionApi() {
  const values = new Map();
  const calls = [];
  return {
    calls,
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
        addCommand: async ({ label }) => { calls.push(["command:add", label]); return null; },
        removeCommand: async ({ label }) => { calls.push(["command:remove", label]); return null; },
      },
    },
  };
}

test("extension exports the Roam lifecycle contract and survives repeated unload", async () => {
  installMinimalDom();
  assert.equal(typeof extension.onload, "function");
  assert.equal(typeof extension.onunload, "function");

  const api = fakeExtensionApi();
  const cleanup = await extension.onload({ extensionAPI: api, extension: { version: "0.1.0" } });
  assert.equal(typeof cleanup, "function");
  assert.equal(globalThis.__ROAM_CURSOR_SMITH_VERSION, "0.1.0");
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
