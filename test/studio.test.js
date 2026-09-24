import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CANVAS_EFFECT_KEYS, DEFAULTS } from "../src/cursor-smith.js";
import { renderStudio, STUDIO_CSS } from "../src/studio.js";

function walk(el, fn) {
  fn(el);
  for (const child of el.children || []) walk(child, fn);
}

function createFakeDoc() {
  const nodes = [];
  function createTextNode(text) {
    return { nodeType: 3, textContent: String(text), children: [] };
  }
  function createElement(tag) {
    const listeners = new Map();
    const children = [];
    const el = {
      tagName: String(tag).toUpperCase(),
      className: "",
      children,
      attributes: {},
      style: { cssText: "", setProperty() {} },
      value: "",
      checked: false,
      selected: false,
      textContent: "",
      firstChild: null,
      parentNode: null,
      ownerDocument: doc,
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name] ?? null; },
      addEventListener(type, fn) { listeners.set(type, fn); },
      removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); },
      appendChild(child) {
        children.push(child);
        child.parentNode = this;
        this.firstChild = children[0] || null;
        return child;
      },
      append(...kids) { for (const kid of kids) this.appendChild(kid); },
      removeChild(child) {
        const idx = children.indexOf(child);
        if (idx >= 0) children.splice(idx, 1);
        child.parentNode = null;
        this.firstChild = children[0] || null;
      },
      replaceChildren(...kids) {
        while (children.length) this.removeChild(children[0]);
        for (const kid of kids) this.appendChild(kid);
      },
      querySelector(sel) {
        let found = null;
        walk(this, (node) => {
          if (found || !node.className) return;
          if (sel === ".cs-demo" && node.className.includes("cs-demo")) found = node;
          if (sel === 'input[type="checkbox"]' && node.tagName === "INPUT" && node.attributes.type === "checkbox") found = node;
        });
        return found;
      },
      querySelectorAll(sel) {
        const out = [];
        walk(this, (node) => {
          if (sel === 'input[type="checkbox"]' && node.tagName === "INPUT" && node.attributes.type === "checkbox") out.push(node);
        });
        return out;
      },
      _fire(type, target) {
        const fn = listeners.get(type);
        if (fn) fn({ target: target || this });
      },
    };
    nodes.push(el);
    return el;
  }
  const doc = {
    activeElement: null,
    createElement,
    createTextNode,
  };
  return { doc, nodes };
}

function withFakeDoc(fn) {
  const prev = globalThis.document;
  const { doc } = createFakeDoc();
  globalThis.document = doc;
  try {
    return fn(doc);
  } finally {
    globalThis.document = prev;
  }
}

function makeCtl(settings = DEFAULTS) {
  const calls = [];
  const ctl = {
    settings,
    set(patch) { calls.push(patch); Object.assign(settings, patch); },
    setLive(patch) { Object.assign(settings, patch); },
    rerender() {},
    randomize() {},
    resetLook() {},
    toast() {},
    copyToClipboard() {},
    _calls: calls,
  };
  return ctl;
}

function collectClassNames(root) {
  const names = [];
  walk(root, (node) => {
    if (node.className) names.push(node.className);
  });
  return names;
}

function htmlOf(root) {
  const parts = [];
  walk(root, (node) => {
    if (node.className) parts.push(node.className);
    if (node.textContent) parts.push(node.textContent);
    if (node.tagName === "INPUT" && node.attributes.type === "checkbox") parts.push("checkbox");
  });
  return parts.join(" ");
}

test("renderStudio with DEFAULTS has no tps- classes", () => {
  withFakeDoc((doc) => {
    const root = doc.createElement("div");
    renderStudio(root, makeCtl());
    for (const cls of collectClassNames(root)) {
      assert.doesNotMatch(cls, /tps-/);
    }
  });
});

test("every CANVAS_EFFECT_KEY has a switch that calls ctl.set", () => {
  withFakeDoc((doc) => {
  for (const key of CANVAS_EFFECT_KEYS) {
    const settings = { ...DEFAULTS, [key]: false };
    if (key === "backspaceDisintegrate" || key === "thunderstrike") settings.flameTrail = true;
    if (key === "lineSerifs") settings.cursorStyle = "Line";
    const ctl = makeCtl(settings);
    const root = doc.createElement("div");
    renderStudio(root, ctl);
    const boxes = root.querySelectorAll('input[type="checkbox"]');
    let matched = false;
    for (const input of boxes) {
      ctl._calls.length = 0;
      input.checked = true;
      input._fire("change", input);
      if (ctl._calls.some((patch) => patch[key] === true)) {
        matched = true;
        break;
      }
    }
    assert.equal(matched, true, `missing switch for ${key}`);
  }
  });
});

test("STUDIO_CSS is compact and free of forbidden strings", () => {
  assert.ok(STUDIO_CSS.length < 1600);
  assert.doesNotMatch(STUDIO_CSS, /SadSnake1/);
  assert.doesNotMatch(STUDIO_CSS, /MIT-licensed/);
  assert.doesNotMatch(STUDIO_CSS, /\.tps-/);
  assert.doesNotMatch(STUDIO_CSS, /color-mix/);
});

test("rendered studio HTML has no forbidden strings", () => {
  withFakeDoc((doc) => {
    const root = doc.createElement("div");
    renderStudio(root, makeCtl());
    const html = htmlOf(root);
    assert.doesNotMatch(html, /SadSnake1/);
    assert.doesNotMatch(html, /MIT-licensed/);
  });
});

test("extension.css has no panel chrome or color-mix", async () => {
  const css = await readFile(new URL("../src/extension.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /color-mix/);
  assert.doesNotMatch(css, /\.tps-/);
  assert.doesNotMatch(css, /\.cs-panel-overlay/);
});

test("a colour text field ignores a partial hex", () => {
  withFakeDoc((doc) => {
    const settings = { ...DEFAULTS };
    const ctl = makeCtl(settings);
    const root = doc.createElement("div");
    renderStudio(root, ctl);
    const texts = [];
    walk(root, (node) => {
      if (node.tagName === "INPUT" && node.attributes.type === "text") texts.push(node);
    });
    assert.ok(texts.length >= 2);
    const field = texts[0];
    field.value = "#3";
    field._fire("change", field);
    assert.equal(ctl._calls.length, 0, "partial hex is not written");
    field.value = "#3a3b3c";
    field._fire("change", field);
    assert.equal(ctl._calls.length, 1);
    assert.equal(Object.values(ctl._calls[0])[0], "#3a3b3c");
  });
});

test("Studio CSS follows Roam's theme, not the OS", () => {
  assert.doesNotMatch(STUDIO_CSS, /color-scheme:light dark/);
  assert.match(STUDIO_CSS, /\.bp3-dark \.cs-studio-overlay/);
});
