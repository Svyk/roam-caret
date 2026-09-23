import assert from "node:assert/strict";
import test from "node:test";

import { installLiteCaret } from "../src/caret-lite.js";

function makeClassList() {
  const names = new Set();
  return {
    contains: (name) => names.has(name),
    add(...values) {
      for (const name of values) if (name) names.add(name);
    },
    remove(...values) {
      for (const name of values) names.delete(name);
    },
    toggle(name, force) {
      const on = force === undefined ? !names.has(name) : !!force;
      if (on) names.add(name);
      else names.delete(name);
      return on;
    },
  };
}

function createFakeDoc() {
  const listeners = new Map();
  const body = {
    children: [],
    classList: makeClassList(),
    append(node) {
      this.children.push(node);
      node.parentNode = this;
    },
    appendChild(node) {
      this.append(node);
    },
  };
  const documentElement = { classList: makeClassList() };

  function attach(target) {
    target.addEventListener = (type, fn) => {
      listeners.set(type, fn);
    };
    target.removeEventListener = (type, fn) => {
      if (listeners.get(type) === fn) listeners.delete(type);
    };
  }

  function createElement(tag) {
    const classList = makeClassList();
    const el = {
      tagName: String(tag).toUpperCase(),
      style: {},
      children: [],
      parentNode: null,
      textContent: "",
      classList,
      _className: "",
      appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
        return child;
      },
      append(...kids) {
        for (const child of kids) this.appendChild(child);
      },
      remove() {
        const parent = this.parentNode;
        if (!parent?.children) return;
        const index = parent.children.indexOf(this);
        if (index >= 0) parent.children.splice(index, 1);
        this.parentNode = null;
      },
    };
    Object.defineProperty(el, "className", {
      get() {
        return el._className || "";
      },
      set(value) {
        el._className = String(value || "");
        classList.remove("cs-lite-caret", "cs-lite-glyph", "cs-lite-blink");
        for (const name of el._className.split(/\s+/)) {
          if (name) classList.add(name);
        }
      },
    });
    return el;
  }

  const doc = {
    body,
    documentElement,
    activeElement: null,
    createElement,
  };
  const win = {
    matchMedia() {
      return {
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      };
    },
  };
  attach(doc);
  attach(win);
  return { doc, win, body, listeners };
}

function makeTextarea(extras = {}) {
  return {
    tagName: "TEXTAREA",
    value: "hello",
    selectionStart: 0,
    selectionEnd: 0,
    closest: () => null,
    ...extras,
  };
}

function installHarness(rectOverrides = {}, textareaExtras = {}, settingsOverrides = {}) {
  const { doc, win, body, listeners } = createFakeDoc();
  const rect = {
    x: 10,
    y: 20,
    width: 8,
    height: 19,
    visible: true,
    glyph: "h",
    ...rectOverrides,
  };
  const textarea = makeTextarea(textareaExtras);
  doc.activeElement = textarea;
  const measurer = {
    measure(el) {
      this.lastEl = el;
      return rect;
    },
  };
  const getSettings = () => ({
    cursorStyle: "Box",
    colorDark: "#39ff14",
    colorLight: "#333333",
    glow: false,
    showChar: false,
    blinkingEnabled: false,
    caretWidthPx: 2,
    underlineWidthPx: 0,
    boxHollow: false,
    boxHollowWidth: 2,
    ...settingsOverrides,
  });
  const lifecycle = {
    node(node, parent = body) {
      parent.append(node);
      return node;
    },
  };
  const lite = installLiteCaret({ doc, win, measurer, lifecycle, getSettings });
  return { lite, doc, win, body, listeners, textarea, measurer, rect };
}

test("focusin on a TEXTAREA shows overlay and sets translate from measurer", () => {
  const { lite, listeners, textarea } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.match(String(lite.overlay.style.transform), /translate\(10px, 20px\)/);
});

test("input handler updates transform synchronously without rAF or setInterval", () => {
  const { lite, listeners, textarea, rect } = installHarness();
  listeners.get("focusin")({ target: textarea });

  let rafCalls = 0;
  let intervalCalls = 0;
  const origRaf = globalThis.requestAnimationFrame;
  const origInterval = globalThis.setInterval;
  globalThis.requestAnimationFrame = () => {
    rafCalls += 1;
    return 0;
  };
  globalThis.setInterval = () => {
    intervalCalls += 1;
    return 0;
  };

  try {
    rect.x = 30;
    rect.y = 40;
    let appliedInThisTurn = false;
    listeners.get("input")({ target: textarea });
    appliedInThisTurn = String(lite.overlay.style.transform).includes("translate(30px, 40px)");
    assert.equal(appliedInThisTurn, true);
    assert.equal(rafCalls, 0);
    assert.equal(intervalCalls, 0);
  } finally {
    globalThis.requestAnimationFrame = origRaf;
    globalThis.setInterval = origInterval;
  }
});

test("range selection hides overlay", () => {
  const { lite, listeners, textarea } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");

  textarea.selectionStart = 0;
  textarea.selectionEnd = 3;
  listeners.get("selectionchange")({ target: textarea });
  assert.equal(lite.overlay.style.display, "none");
});

test("skipped host hides overlay", () => {
  const { lite, listeners, textarea } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");

  textarea.closest = () => ({ className: "rg-root" });
  listeners.get("input")({ target: textarea });
  assert.equal(lite.overlay.style.display, "none");
});

test("dispose removes overlay from parent", () => {
  const { lite, body, listeners, textarea } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.equal(body.children.includes(lite.overlay), true);

  lite.dispose();
  assert.equal(body.children.includes(lite.overlay), false);
  assert.equal(lite.overlay.parentNode, null);
});

test("Beam geometry centers a pill on the caret x", () => {
  const { lite, listeners, textarea } = installHarness(
    { x: 100, y: 50, width: 8, height: 20 },
    {},
    { cursorStyle: "Beam", caretWidthPx: 3 }
  );
  listeners.get("focusin")({ target: textarea });
  assert.match(String(lite.overlay.style.transform), /translate\(98\.5px, 51\.8px\)/);
  assert.equal(lite.overlay.style.width, "3px");
  assert.equal(lite.overlay.style.height, "16.4px");
  assert.equal(lite.overlay.style.borderRadius, "3px");
});

test("different element with same signature still measures", () => {
  const { listeners, textarea, measurer, doc } = installHarness();
  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };

  listeners.get("input")({ target: textarea });
  assert.equal(measureCalls, 1);

  const other = makeTextarea({ value: "hello", selectionStart: 0, selectionEnd: 0 });
  doc.activeElement = other;
  listeners.get("keyup")({ target: other });
  assert.equal(measureCalls, 2);
});

test("onRefreshEvent skips measure when signature is unchanged after input", () => {
  const { listeners, textarea, measurer } = installHarness();
  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };

  listeners.get("input")({ target: textarea });
  assert.equal(measureCalls, 1);

  listeners.get("keyup")({ target: textarea });
  assert.equal(measureCalls, 1);

  listeners.get("selectionchange")({ target: textarea });
  assert.equal(measureCalls, 1);

  textarea.selectionStart = 3;
  listeners.get("selectionchange")({ target: textarea });
  assert.equal(measureCalls, 2);
});

test("page scroll remasures even when textarea signature is unchanged", () => {
  const { lite, win, listeners, textarea, rect } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.match(String(lite.overlay.style.transform), /translate\(10px, 20px\)/);

  rect.x = 50;
  rect.y = 80;
  let rafCalls = 0;
  win.requestAnimationFrame = (cb) => {
    rafCalls += 1;
    cb();
    return 1;
  };
  listeners.get("scroll")();
  assert.equal(rafCalls, 1, "scroll remeasure must go through rAF on windowRef");
  assert.match(
    String(lite.overlay.style.transform),
    /translate\(50px, 80px\)/,
    "fixed overlay must follow getBoundingClientRect after ancestor/page scroll",
  );
});

test("scroll from an unrelated overflow node does not remeasure", () => {
  const { lite, win, listeners, textarea, measurer, rect } = installHarness();
  listeners.get("focusin")({ target: textarea });

  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };
  win.requestAnimationFrame = (cb) => {
    cb();
    return 1;
  };

  const sidebar = { nodeType: 1, contains: () => false };
  listeners.get("scroll")({ target: sidebar });
  assert.equal(measureCalls, 0, "unrelated overflow scroll must not remeasure");

  rect.x = 60;
  const article = { nodeType: 1, contains: (el) => el === textarea };
  listeners.get("scroll")({ target: article });
  assert.equal(measureCalls, 1, "ancestor scroll must remeasure");
  assert.match(String(lite.overlay.style.transform), /translate\(60px, 20px\)/);
});

test("input ping restarts blink without reading overlay offsetWidth", () => {
  const { lite, listeners, textarea } = installHarness({}, {}, { blinkingEnabled: true });
  let offsetReads = 0;
  Object.defineProperty(lite.overlay, "offsetWidth", {
    configurable: true,
    get() {
      offsetReads += 1;
      return 0;
    },
  });

  listeners.get("focusin")({ target: textarea });
  listeners.get("input")({ target: textarea });
  listeners.get("input")({ target: textarea });

  assert.equal(offsetReads, 0, "input path must not force layout via offsetWidth");
  assert.equal(lite.overlay.classList.contains("cs-lite-blink"), true);
});

test("unchanged overlay style values are not rewritten", () => {
  const { lite, listeners, textarea } = installHarness();
  let transformWrites = 0;
  let stored = "";
  Object.defineProperty(lite.overlay.style, "transform", {
    configurable: true,
    get() {
      return stored;
    },
    set(value) {
      transformWrites += 1;
      stored = value;
    },
  });

  listeners.get("focusin")({ target: textarea });
  assert.equal(transformWrites, 1);

  listeners.get("input")({ target: textarea });
  listeners.get("input")({ target: textarea });
  assert.equal(transformWrites, 1, "identical rect must not rewrite transform");
});

test("IME composition hides the caret and skips measuring until compositionend", () => {
  const { lite, listeners, textarea, measurer } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");

  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };

  listeners.get("compositionstart")({ target: textarea });
  assert.equal(lite.overlay.style.display, "none");

  listeners.get("input")({ target: textarea });
  listeners.get("selectionchange")({ target: textarea });
  assert.equal(measureCalls, 0, "no measuring mid-composition");

  listeners.get("compositionend")({ target: textarea });
  assert.equal(measureCalls, 1);
  assert.notEqual(lite.overlay.style.display, "none");
});

test("window blur hides the caret and focus restores it", () => {
  const { lite, listeners, textarea } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");

  listeners.get("blur")();
  assert.equal(lite.overlay.style.display, "none");

  listeners.get("focus")();
  assert.notEqual(lite.overlay.style.display, "none");
});

test("isDark caches prefers-color-scheme matchMedia at install time", () => {
  const { doc, win, body, listeners } = createFakeDoc();
  let darkMqCalls = 0;
  const baseMatchMedia = win.matchMedia.bind(win);
  win.matchMedia = (query) => {
    if (query === "(prefers-color-scheme: dark)") darkMqCalls += 1;
    return baseMatchMedia(query);
  };

  const textarea = makeTextarea();
  doc.activeElement = textarea;
  const measurer = { measure: () => ({ x: 0, y: 0, width: 2, height: 19, visible: true, glyph: "" }) };
  const lifecycle = { node(node, parent = body) { parent.append(node); } };
  installLiteCaret({
    doc,
    win,
    measurer,
    lifecycle,
    getSettings: () => ({ cursorStyle: "Box", colorLight: "#333", colorDark: "#fff", glow: false, showChar: false, blinkingEnabled: false }),
  });

  assert.equal(darkMqCalls, 1);

  listeners.get("input")({ target: textarea });
  listeners.get("input")({ target: textarea });
  listeners.get("keyup")({ target: textarea });
  assert.equal(darkMqCalls, 1);
});

test("glow uses two rgba layers from hexToRgba", () => {
  const { lite, listeners, textarea } = installHarness(
    {},
    {},
    { glow: true, colorLight: "#00695e", colorDark: "#48d0c0" }
  );
  listeners.get("focusin")({ target: textarea });
  const shadow = String(lite.overlay.style.boxShadow);
  assert.match(shadow, /rgba\(0, 105, 94/);
  assert.equal(shadow.split(",").length >= 2, true);
});
