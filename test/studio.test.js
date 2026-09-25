import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CANVAS_EFFECT_KEYS, DEFAULTS } from "../src/cursor-smith.js";
import { createPreviewComponent } from "../src/settings.js";
import { renderStudio, STUDIO_CSS } from "../src/studio.js";

function walk(el, fn) {
  fn(el);
  for (const child of el.children || []) walk(child, fn);
}

// Class selectors only, comma separated: enough for the shield.
function closestIn(node, sel) {
  const classes = sel.split(",").map((part) => part.trim().replace(/^\./, ""));
  for (let n = node; n; n = n.parentNode) {
    const own = String(n.className || "").split(/\s+/);
    if (classes.some((cls) => own.includes(cls))) return n;
  }
  return null;
}

function listenerBag() {
  const listeners = [];
  return {
    _listeners: listeners,
    addEventListener(type, fn, capture) { listeners.push({ type, fn, capture: !!capture }); },
    removeEventListener(type, fn, capture) {
      const idx = listeners.findIndex((l) => l.type === type && l.fn === fn && l.capture === !!capture);
      if (idx >= 0) listeners.splice(idx, 1);
    },
  };
}

// DOM order: window and document capture, the element's ancestors, the
// target, then bubble back up. stopPropagation ends it after the current node.
function dispatch(win, page, target, type, key) {
  const path = [win, page];
  const ancestors = [];
  for (let n = target.parentNode; n; n = n.parentNode) ancestors.unshift(n);
  path.push(...ancestors);
  let stopped = false;
  const ev = {
    type,
    key,
    target,
    defaultPrevented: false,
    stopPropagation() { stopped = true; },
    preventDefault() { this.defaultPrevented = true; },
  };
  const run = (node, phase) => {
    for (const l of [...(node._listeners || [])]) {
      if (l.type !== type) continue;
      if (phase === "capture" && !l.capture) continue;
      if (phase === "bubble" && l.capture) continue;
      l.fn(ev);
    }
  };
  for (const node of path) {
    if (stopped) return ev;
    run(node, "capture");
  }
  if (!stopped) run(target, "target");
  for (const node of path.reverse()) {
    if (stopped) return ev;
    run(node, "bubble");
  }
  return ev;
}

function createFakeDoc() {
  const nodes = [];
  function createTextNode(text) {
    return { nodeType: 3, textContent: String(text), children: [] };
  }
  function createElement(tag) {
    const bag = listenerBag();
    const children = [];
    const el = {
      ...bag,
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
      closest(sel) { return closestIn(this, sel); },
      focus() { doc.activeElement = this; },
      setSelectionRange(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
      },
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
        for (const l of [...bag._listeners]) {
          if (l.type === type) l.fn({ target: target || this });
        }
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

function findInput(root, type) {
  let found = null;
  walk(root, (node) => {
    if (!found && node.tagName === "INPUT" && node.attributes.type === type) found = node;
  });
  return found;
}

test("the preview stops a key from bubbling to Roam and still receives it", () => {
  withFakeDoc((doc) => {
    const ctl = makeCtl({ ...DEFAULTS });
    let rerenders = 0;
    ctl.rerender = () => { rerenders += 1; };
    const root = doc.createElement("div");
    root.className = "cs-studio";
    renderStudio(root, ctl);
    const demo = root.querySelector(".cs-demo");
    const win = listenerBag();
    const page = listenerBag();
    const capture = [];
    const bubble = [];
    const onField = [];
    page.addEventListener("keydown", (ev) => capture.push(ev.key), true);
    page.addEventListener("keydown", (ev) => bubble.push(ev.key), false);
    demo.addEventListener("keydown", (ev) => onField.push(ev.key));

    const ev = dispatch(win, page, demo, "keydown", "a");
    assert.deepEqual(onField, ["a"], "the textarea receives the key");
    assert.deepEqual(capture, ["a"], "a window shield must not swallow the key");
    assert.deepEqual(bubble, [], "Roam's bubble listener does not also handle it");
    assert.equal(ev.defaultPrevented, false);

    dispatch(win, page, demo, "keydown", "Escape");
    assert.deepEqual(bubble, ["Escape"], "Escape still bubbles so the Studio can close");

    for (const type of ["keydown", "keypress", "beforeinput", "input", "keyup"]) {
      dispatch(win, page, demo, type, "d");
    }
    assert.equal(rerenders, 0, "typing never rerenders");
    assert.equal(root.querySelector(".cs-demo"), demo, "typing never replaces the textarea");
  });
});

test("the Studio textarea stops keydown from bubbling and lets beforeinput through", () => {
  withFakeDoc((doc) => {
    const root = doc.createElement("div");
    root.className = "cs-studio";
    renderStudio(root, makeCtl({ ...DEFAULTS }));
    const demo = root.querySelector(".cs-demo");
    const win = listenerBag();
    const page = listenerBag();
    const bubbled = [];
    page.addEventListener("keydown", (ev) => bubbled.push(ev.type), false);
    page.addEventListener("beforeinput", (ev) => bubbled.push(ev.type), false);
    const key = dispatch(win, page, demo, "keydown", "a");
    const before = dispatch(win, page, demo, "beforeinput", "a");
    assert.equal(key.defaultPrevented, false);
    assert.equal(before.defaultPrevented, false);
    assert.deepEqual(bubbled, ["beforeinput"], "beforeinput must reach the document so the character inserts");
  });
});

test("the Depot preview .cs-demo is covered by the same shield while it is mounted", () => {
  const fakeReact = { createElement: (tag, props, ...children) => ({ tag, props, children }) };
  const textarea = createPreviewComponent(fakeReact)().children[0];
  assert.equal(textarea.tag, "textarea");
  assert.equal(typeof textarea.props.ref, "function");

  const win = listenerBag();
  const page = listenerBag();
  const dialog = { ...listenerBag(), className: "bp3-dialog", parentNode: null };
  const el = {
    ...listenerBag(),
    className: textarea.props.className,
    parentNode: dialog,
    ownerDocument: { defaultView: win },
    closest(sel) { return closestIn(this, sel); },
  };
  const capture = [];
  const bubble = [];
  page.addEventListener("keydown", (ev) => capture.push(ev.key), true);
  page.addEventListener("keydown", (ev) => bubble.push(ev.key), false);

  textarea.props.ref(el);
  const ev = dispatch(win, page, el, "keydown", "a");
  assert.deepEqual(capture, ["a"], "the key still reaches the field");
  assert.deepEqual(bubble, [], "Roam's bubble listener does not also handle it");
  assert.equal(ev.defaultPrevented, false);

  textarea.props.ref(null);
  assert.equal(el._listeners.length, 0, "unmount removes the field listeners");
  dispatch(win, page, el, "keydown", "b");
  assert.deepEqual(bubble, ["b"]);
});

test("text and caret in the preview survive a toggle that rerenders", () => {
  withFakeDoc((doc) => {
    const ctl = makeCtl({ ...DEFAULTS, gradientEnabled: false });
    const root = doc.createElement("div");
    ctl.rerender = () => renderStudio(root, ctl);
    renderStudio(root, ctl);
    const demo = root.querySelector(".cs-demo");
    demo.value = "hello";
    demo.focus();
    demo.setSelectionRange(2, 4);

    let gradient = null;
    walk(root, (node) => {
      if (node.tagName === "LABEL" && node.children.some((c) => c.textContent === "Gradient")) {
        gradient = node.children.find((c) => c.tagName === "INPUT");
      }
    });
    gradient.checked = true;
    gradient._fire("change", gradient);

    const next = root.querySelector(".cs-demo");
    assert.notEqual(next, demo, "the toggle rerendered");
    assert.equal(next.value, "hello");
    assert.equal(doc.activeElement, next);
    assert.deepEqual([next.selectionStart, next.selectionEnd], [2, 4]);
  });
});
