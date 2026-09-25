import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createCaretMeasurer } from "../src/caret-measure.js";
import {
  glyphColorOn,
  installLiteCaret,
  installNativeCaret,
  isPlainLine,
} from "../src/caret-lite.js";
import { isRoamDark } from "../src/theme.js";

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
      _animations: [],
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      animate(keyframes, options) {
        const anim = {
          keyframes,
          options,
          currentTime: 0,
          cancelled: 0,
          played: 0,
          cancel() {
            this.cancelled += 1;
            this.currentTime = null;
          },
          play() {
            this.played += 1;
            this.currentTime = 0;
          },
        };
        this._animations.push(anim);
        return anim;
      },
      getAnimations() {
        throw new Error("getAnimations() forces a style flush; keep the handle instead");
      },
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
    querySelectorCalls: 0,
    querySelector(sel) {
      this.querySelectorCalls += 1;
      if (sel === ".rm-command-palette" && this._commandPalette) return this._commandPalette;
      return null;
    },
  };
  const observers = [];
  const win = {
    prefersDark: false,
    matchMedia(query) {
      return {
        matches: query === "(prefers-color-scheme: dark)" ? win.prefersDark : false,
        addEventListener() {},
        removeEventListener() {},
      };
    },
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.targets = [];
        this.disconnected = false;
        observers.push(this);
      }
      observe(target, options) {
        this.targets.push({ target, options });
      }
      disconnect() {
        this.disconnected = true;
      }
    },
  };
  attach(doc);
  attach(win);
  return { doc, win, body, listeners, observers };
}

// The only childList observer: <body>'s own children, never a subtree.
function paletteObserver(observers) {
  return observers.find((o) => o.targets.some(({ options }) => options?.childList));
}

// A frame queue on the fake window. flush() runs every callback queued so far.
function rafQueue(win) {
  const frames = [];
  let cancelled = 0;
  win.requestAnimationFrame = (fn) => {
    frames.push(fn);
    return frames.length;
  };
  win.cancelAnimationFrame = () => {
    cancelled += 1;
    frames.length = 0;
  };
  return {
    frames,
    get cancelled() {
      return cancelled;
    },
    flush() {
      const run = frames.splice(0);
      for (const fn of run) fn();
      return run.length;
    },
  };
}

function paletteNode() {
  return {
    nodeType: 1,
    classList: { contains: (name) => name === "rm-command-palette" },
  };
}

function makeTextarea(extras = {}) {
  const box = { left: 0, top: 0, right: 600, bottom: 200, width: 600, height: 200 };
  return {
    tagName: "TEXTAREA",
    id: "block-input-test",
    className: "rm-block-input",
    value: "hello",
    selectionStart: 0,
    selectionEnd: 0,
    closest: () => null,
    getBoundingClientRect: () => box,
    ...extras,
  };
}

function makeStyle(initial = {}) {
  const props = new Map(Object.entries(initial).map(([name, value]) => [name, { value, priority: "" }]));
  return {
    setProperty(name, value, priority = "") {
      props.set(name, { value, priority });
    },
    removeProperty(name) {
      props.delete(name);
    },
    getPropertyValue(name) {
      return props.get(name)?.value ?? "";
    },
    getPropertyPriority(name) {
      return props.get(name)?.priority ?? "";
    },
  };
}

// type: null means the attribute is missing, which the browser treats as text.
function makeInput({ type = "text", palette = null, closest = null, ...extras } = {}) {
  const box = { left: 0, top: 0, right: 400, bottom: 30, width: 400, height: 30 };
  return {
    tagName: "INPUT",
    type: type || "text",
    getAttribute: (name) => (name === "type" ? type : null),
    value: "find",
    selectionStart: 4,
    selectionEnd: 4,
    parentElement: palette,
    closest: closest || ((sel) => (palette && sel.includes(".rm-command-palette") ? palette : null)),
    getBoundingClientRect: () => box,
    style: makeStyle(),
    ...extras,
  };
}

function makePalette(doc, portalZ = "1000") {
  const portal = { className: "bp3-portal rm-modal-portal--command-palette", parentElement: doc.body };
  const palette = {
    nodeType: 1,
    className: "rm-command-palette",
    classList: { contains: (name) => name === "rm-command-palette" },
    parentElement: portal,
  };
  const styles = new Map([
    [portal, { position: "absolute", zIndex: portalZ, overflowX: "visible", overflowY: "visible" }],
  ]);
  const computed = (el) => styles.get(el)
    || { position: "static", zIndex: "auto", overflowX: "visible", overflowY: "visible" };
  return { portal, palette, computed };
}

function installHarness(rectOverrides = {}, textareaExtras = {}, settingsOverrides = {}, options = {}) {
  const { doc, win, body, listeners, observers } = createFakeDoc();
  if (options.prefersDark) win.prefersDark = true;
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
      return { ...rect, box: el.getBoundingClientRect() };
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
  const timings = [];
  const lite = installLiteCaret({
    doc,
    win,
    measurer,
    lifecycle,
    getSettings,
    recordTiming: (ms) => timings.push(ms),
  });
  return { lite, doc, win, body, listeners, observers, textarea, measurer, rect, timings };
}

test("focusin on a TEXTAREA shows overlay and sets translate from measurer", () => {
  const { lite, listeners, textarea } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.match(String(lite.overlay.style.transform), /translate\(10px, 20px\)/);
});

test("input marks the frame dirty; one rAF paints the new caret", () => {
  const { lite, win, listeners, textarea, rect, measurer } = installHarness();
  const raf = rafQueue(win);
  listeners.get("focusin")({ target: textarea });
  raf.flush();

  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };
  rect.x = 30;
  rect.y = 40;
  listeners.get("input")({ target: textarea });
  assert.equal(measureCalls, 0, "nothing measured inside the input dispatch");
  assert.match(String(lite.overlay.style.transform), /translate\(10px, 20px\)/);
  assert.equal(raf.frames.length, 1);

  raf.flush();
  assert.equal(measureCalls, 1);
  assert.match(String(lite.overlay.style.transform), /translate\(30px, 40px\)/);
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
  textarea.selectionEnd = 3;
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
  assert.equal(lite.overlay._animations.length, 1);
});

test("blink keeps one Animation and restarts it on input, arrow move, and click", () => {
  const { lite, listeners, textarea } = installHarness({}, {}, { blinkingEnabled: true });
  listeners.get("focusin")({ target: textarea });
  const [anim] = lite.overlay._animations;
  assert.ok(anim);

  anim.currentTime = 700;
  listeners.get("input")({ target: textarea });
  assert.equal(anim.currentTime, 0, "input restarts the blink");

  anim.currentTime = 700;
  textarea.selectionStart = 3;
  textarea.selectionEnd = 3;
  listeners.get("selectionchange")({ target: textarea });
  assert.equal(anim.currentTime, 0, "arrow-key move restarts the blink");

  anim.currentTime = 700;
  listeners.get("mouseup")({ type: "mouseup", target: textarea });
  assert.equal(anim.currentTime, 0, "click restarts the blink even without a move");

  assert.equal(lite.overlay._animations.length, 1, "one Animation handle, reused");
});

test("blink speed, balance and opacity drive the lite caret", () => {
  const { lite, listeners, textarea } = installHarness({}, {}, {
    blinkingEnabled: true,
    blinkSpeed: 2,
    blinkOnOffBalance: 0.6,
    blinkDelayMs: 300,
    cursorOpacity: 0.5,
  });
  listeners.get("focusin")({ target: textarea });
  const [anim] = lite.overlay._animations;
  assert.equal(anim.options.duration, 1250);
  assert.equal(anim.options.delay, 300);
  assert.equal(anim.options.iterations, Infinity);
  assert.equal(anim.keyframes[0].opacity, 0.5);
  assert.equal(anim.keyframes[1].offset, 0.6);
  assert.equal(anim.keyframes[2].opacity, 0);
  assert.equal(lite.overlay.style.opacity, "0.5");
});

test("blink off cancels the one animation instead of creating another", () => {
  let blinking = true;
  const { doc, win, body, listeners } = createFakeDoc();
  const textarea = makeTextarea();
  doc.activeElement = textarea;
  const measurer = { measure: (el) => ({ x: 1, y: 1, width: 8, height: 19, visible: true, glyph: "", box: el.getBoundingClientRect() }) };
  const lite = installLiteCaret({
    doc,
    win,
    measurer,
    lifecycle: { node(node, parent = body) { parent.append(node); } },
    getSettings: () => ({ cursorStyle: "Box", colorLight: "#333333", blinkingEnabled: blinking }),
  });
  listeners.get("focusin")({ target: textarea });
  const [anim] = lite.overlay._animations;
  blinking = false;
  listeners.get("input")({ target: textarea });
  assert.equal(anim.cancelled, 1);
  blinking = true;
  listeners.get("input")({ target: textarea });
  assert.equal(anim.played, 1);
  assert.equal(lite.overlay._animations.length, 1);
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

test("dark OS with Roam in its light theme keeps colorLight", () => {
  const { lite, doc, listeners, textarea } = installHarness({}, {}, {
    colorLight: "#00695e",
    colorDark: "#48d0c0",
  }, { prefersDark: true });
  listeners.get("focusin")({ target: textarea });
  assert.equal(lite.overlay.style.background, "#00695e");

  doc.documentElement.classList.add("bp3-dark");
  listeners.get("input")({ target: textarea });
  assert.equal(lite.overlay.style.background, "#48d0c0");
});

test("isRoamDark reads Roam's own classes only", () => {
  const { doc } = createFakeDoc();
  assert.equal(isRoamDark(doc), false);
  doc.body.classList.add("roam-body");
  assert.equal(isRoamDark(doc), false);
  doc.body.classList.add("dark");
  assert.equal(isRoamDark(doc), true);
  doc.body.classList.remove("roam-body", "dark");
  doc.body.classList.add("rm-dark-theme");
  assert.equal(isRoamDark(doc), true);
  doc.body.classList.remove("rm-dark-theme");
  doc.body.classList.add("bt-theme-dark");
  assert.equal(isRoamDark(doc), true);
});

test("focus on a checkbox, button or select hides overlay and does not measure", () => {
  const { lite, listeners, measurer } = installHarness();
  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };

  for (const target of [
    makeInput({ type: "checkbox" }),
    { tagName: "BUTTON", closest: () => null },
    { tagName: "SELECT", closest: () => null },
  ]) {
    listeners.get("focusin")({ target });
    assert.equal(lite.overlay.style.display, "none", target.type || target.tagName);
  }
  assert.equal(measureCalls, 0);
});

test("settings preview textarea shows the overlay", () => {
  const { lite, listeners, textarea } = installHarness({}, {
    id: "cs-preview",
    className: "cs-demo",
  });
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");
});

test("a Blueprint dialog that is not the command palette keeps the block caret", () => {
  const { lite, doc, listeners, textarea } = installHarness();
  doc._overlayOpen = { className: "bp3-overlay-open" };
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");
});

test("command palette open hides overlay and skips measure", () => {
  const { lite, listeners, observers, textarea, measurer } = installHarness();
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");

  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };

  const palette = paletteNode();
  paletteObserver(observers).callback([{ addedNodes: [palette], removedNodes: [] }]);
  assert.equal(lite.overlay.style.display, "none");
  listeners.get("input")({ target: textarea });
  assert.equal(lite.overlay.style.display, "none");
  assert.equal(measureCalls, 0);
});

test("palette closing remeasures the focused block once", () => {
  const { lite, listeners, observers, textarea, measurer } = installHarness();
  listeners.get("focusin")({ target: textarea });
  const observer = paletteObserver(observers);
  const portal = {
    nodeType: 1,
    classList: { contains: () => false },
    firstElementChild: {},
    querySelector: (sel) => (sel === ".rm-command-palette" ? paletteNode() : null),
  };
  observer.callback([{ addedNodes: [portal], removedNodes: [] }]);
  assert.equal(lite.overlay.style.display, "none", "a palette nested in a portal still counts");

  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };
  observer.callback([{ addedNodes: [], removedNodes: [portal] }]);
  assert.equal(measureCalls, 1);
  assert.notEqual(lite.overlay.style.display, "none", "caret is back without another key");
});

test("unrelated DOM churn does not flip the palette flag", () => {
  const { lite, listeners, observers, textarea } = installHarness();
  listeners.get("focusin")({ target: textarea });
  const text = { nodeType: 3 };
  const div = { nodeType: 1, classList: { contains: () => false }, firstElementChild: null };
  paletteObserver(observers).callback([{ addedNodes: [text, div], removedNodes: [text] }]);
  listeners.get("input")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");
});

test("keystroke path: one textarea box read, no scroll read after paint, no DOM query", () => {
  const { doc, win, body, listeners } = createFakeDoc();
  win.getComputedStyle = () => ({
    boxSizing: "border-box",
    width: "600px",
    fontFamily: "sans-serif",
    fontSize: "16px",
    lineHeight: "19px",
    color: "rgb(51, 51, 51)",
    position: "static",
    overflowX: "visible",
    overflowY: "visible",
  });
  let boxReads = 0;
  let scrollReads = 0;
  let lateScrollReads = 0;
  let painted = false;
  const textarea = makeTextarea({
    offsetWidth: 600,
    offsetHeight: 200,
    getBoundingClientRect() {
      boxReads += 1;
      return { left: 0, top: 0, right: 600, bottom: 200, width: 600, height: 200 };
    },
  });
  for (const prop of ["scrollTop", "scrollLeft"]) {
    Object.defineProperty(textarea, prop, {
      get() {
        scrollReads += 1;
        if (painted) lateScrollReads += 1;
        return 0;
      },
    });
  }
  doc.activeElement = textarea;
  const lifecycle = { node(node, parent = body) { parent.append(node); } };
  const measurer = createCaretMeasurer({ doc, win, lifecycle });
  const lite = installLiteCaret({
    doc,
    win,
    measurer,
    lifecycle,
    getSettings: () => ({ cursorStyle: "Box", colorLight: "#333333", blinkingEnabled: true, showChar: true }),
  });
  let stored = "";
  Object.defineProperty(lite.overlay.style, "transform", {
    configurable: true,
    get: () => stored,
    set(value) {
      stored = value;
      painted = true;
    },
  });
  listeners.get("focusin")({ target: textarea });

  for (let i = 0; i < 3; i += 1) {
    boxReads = 0;
    scrollReads = 0;
    painted = false;
    doc.querySelectorCalls = 0;
    textarea.value += "x";
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
    listeners.get("input")({ target: textarea });
    listeners.get("keyup")({ target: textarea });
    listeners.get("selectionchange")({ target: textarea });
    assert.equal(boxReads, 1, "one getBoundingClientRect on the textarea per key");
    assert.equal(scrollReads, 2, "scrollTop/scrollLeft read once, inside the measure");
    assert.equal(doc.querySelectorCalls, 0, "no palette querySelector per key");
  }
  assert.equal(lateScrollReads, 0, "no scroll read after the overlay write");
  lite.dispose();
  measurer.dispose();
});

test("diag timing covers the whole apply, not just the measure", () => {
  const { listeners, textarea, timings } = installHarness();
  listeners.get("focusin")({ target: textarea });
  listeners.get("input")({ target: textarea });
  assert.equal(timings.length, 2);
  assert.ok(timings.every((ms) => typeof ms === "number" && ms >= 0));
});

test("caret above the clipping scrollport is hidden (top bar case)", () => {
  const clipper = {
    getBoundingClientRect: () => ({ left: 0, top: 100, right: 600, bottom: 500, width: 600, height: 400 }),
  };
  const { lite, doc, win, listeners, textarea, rect } = installHarness({ x: 10, y: 20 }, {
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 600, bottom: 200, width: 600, height: 200 }),
  });
  textarea.parentElement = clipper;
  clipper.parentElement = doc.body;
  win.getComputedStyle = (el) => (el === clipper
    ? { position: "relative", overflowX: "hidden", overflowY: "auto" }
    : { position: "static", overflowX: "visible", overflowY: "visible" });

  listeners.get("focusin")({ target: textarea });
  assert.equal(lite.overlay.style.display, "none", "caret scrolled under the top bar must not paint");

  rect.y = 150;
  listeners.get("input")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");
});

test("Studio demo raises only its own caret above the panel", () => {
  const { lite, doc, listeners, textarea } = installHarness({}, { id: "", className: "cs-demo" });
  listeners.get("focusin")({ target: textarea });
  assert.equal(lite.overlay.style.zIndex, "10003");
  assert.equal(lite.overlay.classList.contains("cs-lite-demo"), true);

  const block = makeTextarea();
  doc.activeElement = block;
  listeners.get("focusin")({ target: block });
  assert.equal(lite.overlay.style.zIndex, "40");
  assert.equal(lite.overlay.classList.contains("cs-lite-demo"), false);
});

test("showChar paints no glyph on Line or Beam", () => {
  for (const cursorStyle of ["Line", "Beam"]) {
    const { lite, listeners, textarea } = installHarness({}, {}, { cursorStyle, showChar: true });
    listeners.get("focusin")({ target: textarea });
    const glyph = lite.overlay.children[0];
    assert.equal(glyph.style.display, "none", cursorStyle);
    assert.equal(glyph.textContent, "", cursorStyle);
  }
});

test("Box letter copies the block font and reads on the caret colour", () => {
  const { lite, listeners, textarea } = installHarness({
    fontFamily: "Inter",
    fontSize: "15px",
    fontWeight: "400",
    fontStyle: "normal",
    lineHeight: "22px",
    color: "rgb(51, 51, 51)",
  }, {}, { cursorStyle: "Box", showChar: true, colorLight: "#00695e" });
  listeners.get("focusin")({ target: textarea });
  const glyph = lite.overlay.children[0];
  assert.equal(glyph.style.display, "block");
  assert.equal(glyph.textContent, "h");
  assert.equal(glyph.style.fontFamily, "Inter");
  assert.equal(glyph.style.fontSize, "15px");
  assert.equal(glyph.style.lineHeight, "22px");
  assert.equal(glyph.style.color, "rgb(204, 204, 204)", "dark text inverts on the teal box");
});

test("Box letter stays off when showChar is off", () => {
  const { lite, listeners, textarea } = installHarness({}, {}, { cursorStyle: "Box", showChar: false });
  listeners.get("focusin")({ target: textarea });
  assert.equal(lite.overlay.children[0].style.display, "none");
});

test("glyphColorOn picks the readable one of text colour and its inverse", () => {
  assert.equal(glyphColorOn("#00695e", "rgb(51, 51, 51)"), "rgb(204, 204, 204)");
  assert.equal(glyphColorOn("#39ff14", "rgb(245, 248, 250)"), "rgb(10, 7, 5)");
  assert.equal(glyphColorOn("#333333", "rgb(51, 51, 51)"), "rgb(204, 204, 204)");
});

test("caret point outside textarea box hides overlay", () => {
  const { lite, listeners, textarea } = installHarness({ x: 500, y: 500 });
  listeners.get("focusin")({ target: textarea });
  assert.equal(lite.overlay.style.display, "none");
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

test("isPlainLine: Line with glow, letter, gradient and effects off", () => {
  const base = { cursorStyle: "Line", glow: false, showChar: false, gradientEnabled: false };
  assert.equal(isPlainLine(base), true);
  assert.equal(isPlainLine({ ...base, glow: true }), false);
  assert.equal(isPlainLine({ ...base, showChar: true }), false);
  assert.equal(isPlainLine({ ...base, gradientEnabled: true }), false);
  assert.equal(isPlainLine({ ...base, smear: true }), false);
  assert.equal(isPlainLine({ ...base, cursorStyle: "Beam" }), false);
});

function makeStyledTextarea(extras = {}) {
  const props = new Map();
  return makeTextarea({
    style: {
      setProperty(name, value, priority) {
        props.set(name, { value, priority });
      },
      removeProperty(name) {
        props.delete(name);
      },
      getPropertyValue(name) {
        return props.get(name)?.value ?? "";
      },
      getPropertyPriority(name) {
        return props.get(name)?.priority ?? "";
      },
    },
    ...extras,
  });
}

test("native Line colours the browser caret and never measures", () => {
  const { doc, win, listeners } = createFakeDoc();
  win.prefersDark = true;
  const textarea = makeStyledTextarea();
  const settings = { cursorStyle: "Line", colorLight: "#00695e", colorDark: "#48d0c0" };
  const native = installNativeCaret({ doc, win, getSettings: () => settings });

  assert.equal(listeners.has("input"), false, "no input listener on the native path");
  assert.equal(listeners.has("selectionchange"), false);
  assert.equal(listeners.has("scroll"), false);
  assert.equal(doc.body.children.length, 0, "no overlay mounted");

  doc.activeElement = textarea;
  listeners.get("focusin")({ target: textarea });
  assert.equal(textarea.style.getPropertyValue("caret-color"), "#00695e");
  assert.equal(textarea.style.getPropertyPriority("caret-color"), "important");

  doc.body.classList.add("rm-dark-theme");
  native.refresh();
  assert.equal(textarea.style.getPropertyValue("caret-color"), "#48d0c0");

  native.dispose();
  assert.equal(textarea.style.getPropertyValue("caret-color"), "");
});

test("native Line paints the Depot preview and applies opacity", () => {
  const { doc, win, listeners } = createFakeDoc();
  const demo = makeStyledTextarea({ id: "", className: "cs-demo" });
  installNativeCaret({ doc, win, getSettings: () => ({ colorLight: "#00695e", cursorOpacity: 0.5 }) });
  listeners.get("focusin")({ target: demo });
  assert.equal(demo.style.getPropertyValue("caret-color"), "rgba(0, 105, 94, 0.5)");
  listeners.get("focusout")({ target: demo });
  assert.equal(demo.style.getPropertyValue("caret-color"), "");
});

test("native Line leaves Roam Grid and password fields alone", () => {
  const { doc, win, listeners } = createFakeDoc();
  const grid = makeStyledTextarea({ closest: () => ({ className: "rg-root" }) });
  const password = makeInput({ type: "password" });
  installNativeCaret({ doc, win, getSettings: () => ({ colorLight: "#00695e" }) });
  listeners.get("focusin")({ target: grid });
  listeners.get("focusin")({ target: password });
  assert.equal(grid.style.getPropertyValue("caret-color"), "");
  assert.equal(password.style.getPropertyValue("caret-color"), "");
});

test("plain Line colours a search input and never measures", () => {
  const { doc, win, listeners } = createFakeDoc();
  let boxReads = 0;
  const { palette } = makePalette(doc);
  const search = makeInput({
    type: "search",
    palette,
    getBoundingClientRect() {
      boxReads += 1;
      return { left: 0, top: 0, right: 400, bottom: 30, width: 400, height: 30 };
    },
  });
  doc._commandPalette = palette;
  const native = installNativeCaret({ doc, win, getSettings: () => ({ colorLight: "#00695e" }) });
  assert.equal(listeners.has("input"), false);
  assert.equal(doc.body.children.length, 0, "no overlay mounted");

  doc.activeElement = search;
  listeners.get("focusin")({ target: search });
  assert.equal(search.style.getPropertyValue("caret-color"), "#00695e");
  listeners.get("focusout")({ target: search });
  assert.equal(search.style.getPropertyValue("caret-color"), "", "cleared when focus leaves");

  listeners.get("focusin")({ target: search });
  native.dispose();
  assert.equal(search.style.getPropertyValue("caret-color"), "", "cleared on unload");
  assert.equal(boxReads, 0, "the native path never reads layout");
});

test("command palette search shows the caret with no document query per key", () => {
  const { lite, doc, listeners, observers, measurer } = installHarness();
  const { palette } = makePalette(doc);
  doc._commandPalette = palette;
  paletteObserver(observers).callback([{ addedNodes: [palette], removedNodes: [] }]);

  const search = makeInput({ type: "search", palette });
  doc.activeElement = search;
  listeners.get("focusin")({ target: search });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.equal(measurer.lastEl, search);

  doc.querySelectorCalls = 0;
  for (let i = 0; i < 3; i += 1) {
    search.value += "x";
    search.selectionStart = search.value.length;
    search.selectionEnd = search.value.length;
    listeners.get("input")({ target: search });
    assert.notEqual(lite.overlay.style.display, "none");
  }
  assert.equal(doc.querySelectorCalls, 0, "no document querySelector per input event");
});

test("the caret sits one above the palette portal z-index and drops back on a block", () => {
  const { lite, doc, win, listeners, observers, textarea } = installHarness();
  const { palette, computed } = makePalette(doc, "1000");
  let computedCalls = 0;
  const countComputed = (el) => {
    computedCalls += 1;
    return computed(el);
  };
  win.getComputedStyle = countComputed;
  doc._commandPalette = palette;
  paletteObserver(observers).callback([{ addedNodes: [palette], removedNodes: [] }]);

  const search = makeInput({ type: "search", palette });
  doc.activeElement = search;
  listeners.get("focusin")({ target: search });
  assert.equal(lite.overlay.style.zIndex, "1001");

  computedCalls = 0;
  listeners.get("input")({ target: search });
  listeners.get("input")({ target: search });
  assert.equal(computedCalls, 0, "the ancestor walk runs on focus, not per key");

  doc._commandPalette = null;
  paletteObserver(observers).callback([{ addedNodes: [], removedNodes: [palette] }]);
  doc.activeElement = textarea;
  listeners.get("focusin")({ target: textarea });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.equal(lite.overlay.style.zIndex, "40");
});

test("a block focused behind the open palette stays hidden", () => {
  const { lite, doc, listeners, observers, textarea, measurer } = installHarness();
  const { palette } = makePalette(doc);
  doc._commandPalette = palette;
  paletteObserver(observers).callback([{ addedNodes: [palette], removedNodes: [] }]);

  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };
  doc.activeElement = textarea;
  listeners.get("focusin")({ target: textarea });
  listeners.get("input")({ target: textarea });
  assert.equal(lite.overlay.style.display, "none");
  assert.equal(measureCalls, 0);
});

test("palette closing with focus lost hides the caret it drew on its field", () => {
  const { lite, doc, listeners, observers } = installHarness();
  const { palette } = makePalette(doc);
  const observer = paletteObserver(observers);
  observer.callback([{ addedNodes: [palette], removedNodes: [] }]);
  const search = makeInput({ type: "search", palette });
  doc.activeElement = search;
  listeners.get("focusin")({ target: search });
  assert.notEqual(lite.overlay.style.display, "none");

  doc.activeElement = doc.body;
  observer.callback([{ addedNodes: [], removedNodes: [palette] }]);
  assert.equal(lite.overlay.style.display, "none");
  assert.equal(search.style.getPropertyValue("caret-color"), "");
});

test("a dialog that unmounts its focused field hides the caret", () => {
  const { lite, doc, listeners, observers } = installHarness();
  const field = makeInput({ isConnected: true });
  doc.activeElement = field;
  listeners.get("focusin")({ target: field });
  assert.notEqual(lite.overlay.style.display, "none");

  field.isConnected = false;
  doc.activeElement = doc.body;
  paletteObserver(observers).callback([{ addedNodes: [], removedNodes: [{ nodeType: 1, classList: { contains: () => false } }] }]);
  assert.equal(lite.overlay.style.display, "none");
});

test("Find or Create shows the overlay; a missing type counts as text", () => {
  const { lite, doc, listeners } = installHarness();
  const find = makeInput({ id: "find-or-create-input", type: null });
  doc.activeElement = find;
  listeners.get("focusin")({ target: find });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.equal(lite.overlay.style.zIndex, "40");
});

test("password fields and Roam Grid inputs still hide", () => {
  const { lite, doc, listeners, measurer } = installHarness();
  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };
  const grid = makeInput({
    closest: (sel) => (sel.includes(".rg-root") ? { className: "rg-root" } : null),
  });
  for (const target of [makeInput({ type: "password" }), grid]) {
    doc.activeElement = target;
    listeners.get("focusin")({ target });
    listeners.get("input")({ target });
    assert.equal(lite.overlay.style.display, "none");
    assert.equal(target.style.getPropertyValue("caret-color"), "");
  }
  assert.equal(measureCalls, 0);
});

test("a zero-size field gets no overlay and keeps its browser caret", () => {
  const { lite, doc, listeners } = installHarness();
  const zero = makeInput({
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  });
  doc.activeElement = zero;
  listeners.get("focusin")({ target: zero });
  assert.equal(lite.overlay.style.display, "none");
  assert.equal(zero.style.getPropertyValue("caret-color"), "");
});

test("the browser caret on a dialog field is hidden only while the overlay shows", () => {
  const { lite, doc, listeners } = installHarness();
  const field = makeInput({ style: makeStyle({ "caret-color": "red" }) });
  doc.activeElement = field;
  listeners.get("focusin")({ target: field });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.equal(field.style.getPropertyValue("caret-color"), "transparent");
  assert.equal(field.style.getPropertyPriority("caret-color"), "important");

  field.selectionEnd = 1;
  field.selectionStart = 0;
  listeners.get("selectionchange")({ target: field });
  assert.equal(lite.overlay.style.display, "none");
  assert.equal(field.style.getPropertyValue("caret-color"), "red", "no overlay, browser caret back");

  field.selectionStart = 4;
  field.selectionEnd = 4;
  listeners.get("selectionchange")({ target: field });
  assert.equal(field.style.getPropertyValue("caret-color"), "transparent");

  doc.activeElement = doc.body;
  listeners.get("focusout")({ target: field, relatedTarget: null });
  assert.equal(field.style.getPropertyValue("caret-color"), "red", "blur restores the previous inline value");

  doc.activeElement = field;
  listeners.get("focusin")({ target: field });
  assert.equal(field.style.getPropertyValue("caret-color"), "transparent");
  lite.dispose();
  assert.equal(field.style.getPropertyValue("caret-color"), "red", "dispose restores it too");
});

test("hide native caret off leaves the dialog field's browser caret alone", () => {
  const { lite, doc, listeners } = installHarness({}, {}, { hideNativeCaret: false });
  const field = makeInput();
  doc.activeElement = field;
  listeners.get("focusin")({ target: field });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.equal(field.style.getPropertyValue("caret-color"), "");
});

// A ResizeObserver that records what it watches; the test delivers entries.
function fakeResizeObserver() {
  const log = { instances: [] };
  log.Class = class {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      this.observed = [];
      this.disconnected = false;
      log.instances.push(this);
    }
    observe(target, options) {
      this.targets.add(target);
      this.observed.push({ target, options });
    }
    unobserve(target) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
      this.disconnected = true;
    }
    fire(target, width, height) {
      if (!this.targets.has(target)) return;
      this.callback([{ target, borderBoxSize: [{ inlineSize: width, blockSize: height }] }], this);
    }
  };
  return log;
}

// Real measurer on the fake document. The mirror marker starts at the padding
// edge and wraps every `perLine` characters, like Chrome's layout would.
function installMeasured(host, computed, settings = {}, { perLine = Infinity, charWidth = 7, win: winExtras = {} } = {}) {
  const { doc, win, body, listeners, observers } = createFakeDoc();
  Object.assign(win, winExtras);
  let styleCalls = 0;
  win.getComputedStyle = (el) => {
    if (el === host) styleCalls += 1;
    return { position: "static", overflowX: "visible", overflowY: "visible", ...computed };
  };
  const lifecycle = { node(node, parent = body) { parent.append(node); } };
  const measurer = createCaretMeasurer({ doc, win, lifecycle });
  const mirror = body.children[0];
  const line = mirror.children[1] || mirror;
  const [prefix, marker] = line.children;
  const at = (value) => Number.parseFloat(value) || 0;
  Object.defineProperty(marker, "offsetLeft", {
    get: () => at(mirror.style.paddingLeft) + (prefix.textContent.length % perLine) * charWidth,
  });
  Object.defineProperty(marker, "offsetTop", {
    get: () => at(mirror.style.paddingTop)
      + Math.floor(prefix.textContent.length / perLine) * at(mirror.style.lineHeight),
  });
  const lite = installLiteCaret({
    doc,
    win,
    measurer,
    lifecycle,
    getSettings: () => ({
      cursorStyle: "Box",
      colorLight: "#333333",
      blinkingEnabled: false,
      showChar: false,
      caretWidthPx: 2,
      ...settings,
    }),
  });
  doc.activeElement = host;
  return { lite, doc, win, listeners, observers, measurer, styleCalls: () => styleCalls };
}

function translateOf(overlay) {
  const match = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(String(overlay.style.transform));
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

const FIND_OR_CREATE_STYLE = {
  boxSizing: "border-box",
  width: "217px",
  paddingTop: "0px",
  paddingRight: "10px",
  paddingBottom: "0px",
  paddingLeft: "30px",
  fontFamily: "sans-serif",
  fontSize: "14px",
  lineHeight: "30px",
  color: "rgb(206, 217, 224)",
};

// The fake host's offset size tracks its box, like layout would.
function trackBox(host, box) {
  Object.defineProperty(host, "offsetWidth", { get: () => box.width });
  Object.defineProperty(host, "offsetHeight", { get: () => box.height });
  return host;
}

function findOrCreateInput(box) {
  return trackBox(makeInput({
    id: "find-or-create-input",
    type: null,
    value: "",
    selectionStart: 0,
    selectionEnd: 0,
    getBoundingClientRect: () => ({ ...box, right: box.left + box.width, bottom: box.top + box.height }),
  }), box);
}

test("Find or Create: the Box is about the font size and the Beam shares its centre", () => {
  for (const cursorStyle of ["Box", "Beam"]) {
    const box = { left: 20, top: 10, width: 570, height: 30 };
    const input = findOrCreateInput(box);
    const { lite, listeners } = installMeasured(input, FIND_OR_CREATE_STYLE, { cursorStyle });
    listeners.get("focusin")({ target: input });
    const at = translateOf(lite.overlay);
    const height = Number.parseFloat(lite.overlay.style.height);
    assert.ok(height < 17, `${cursorStyle} is not a 30px slab (${height}px)`);
    assert.ok(Math.abs(at.y + height / 2 - 25) < 1e-9, `${cursorStyle} centre is the line centre`);
    if (cursorStyle === "Box") assert.equal(at.x, 20 + 30, "after the search icon");
    lite.dispose();
  }
});

test("the Find or Create caret follows the bar as it widens after focus", () => {
  const RO = fakeResizeObserver();
  const box = { left: 348, top: 10, width: 217, height: 30 };
  const input = findOrCreateInput(box);
  const { lite, listeners, styleCalls } = installMeasured(input, FIND_OR_CREATE_STYLE, {}, {
    win: { ResizeObserver: RO.Class },
  });
  const observer = RO.instances[0];

  listeners.get("focusin")({ target: input });
  assert.equal(translateOf(lite.overlay).x, 348 + 30);
  const focusStyleCalls = styleCalls();

  // The first notification reports the box the focus measure already used.
  observer.fire(input, 217, 30);
  assert.equal(styleCalls(), focusStyleCalls, "an unchanged box is not measured again");

  box.left = 20;
  box.width = 570;
  observer.fire(input, 570, 30);
  assert.equal(translateOf(lite.overlay).x, 20 + 30, "caret stays after the icon, not mid-bar");
  assert.equal(styleCalls(), focusStyleCalls + 1, "a new width copies the field style again");
  assert.notEqual(lite.overlay.style.display, "none");
  lite.dispose();
});

test("a Chief of Staff composer that grows after the input handler is measured again at its new box", () => {
  const RO = fakeResizeObserver();
  // textarea[data-chief-chat-input]: 13px font, 21px lines, 8px padding.
  const box = { left: 580, top: 360, width: 160, height: 37 };
  let boxReads = 0;
  const composer = trackBox(makeTextarea({
    value: "thiws is test of ty",
    selectionStart: 19,
    selectionEnd: 19,
    scrollTop: 0,
    scrollLeft: 0,
    getBoundingClientRect() {
      boxReads += 1;
      return { ...box, right: box.left + box.width, bottom: box.top + box.height };
    },
  }), box);
  const { lite, win, listeners, styleCalls } = installMeasured(composer, {
    boxSizing: "border-box",
    width: "160px",
    paddingTop: "8px",
    paddingRight: "8px",
    paddingBottom: "8px",
    paddingLeft: "8px",
    fontFamily: "sans-serif",
    fontSize: "13px",
    lineHeight: "21px",
    color: "rgb(206, 217, 224)",
  }, {}, { perLine: 20, win: { ResizeObserver: RO.Class } });
  const observer = RO.instances[0];
  const raf = rafQueue(win);

  listeners.get("focusin")({ target: composer });
  raf.flush();
  assert.deepEqual(translateOf(lite.overlay), { x: 580 + 8 + 19 * 7, y: 360 + 8 });
  const focusStyleCalls = styleCalls();

  // The frame sees the wrapped text before autosize grows the box: the second
  // line lies under the old box, so the caret drops out.
  composer.value += "fx";
  composer.selectionStart = composer.selectionEnd = composer.value.length;
  boxReads = 0;
  listeners.get("input")({ target: composer });
  assert.equal(boxReads, 0, "no box read inside the input dispatch");
  raf.flush();
  assert.equal(boxReads, 1, "one box read in the frame");
  assert.equal(lite.overlay.style.display, "none");

  // autosizeChatInput: height auto, then scrollHeight px. The panel is pinned
  // at the bottom, so the box grows upward.
  box.top = 339;
  box.height = 58;
  observer.fire(composer, 160, 58);
  assert.equal(raf.frames.length, 0, "the resize callback measures in place, no extra frame");
  assert.equal(boxReads, 2, "one more measure for the new box");
  assert.equal(styleCalls(), focusStyleCalls, "same width: no style copy");
  assert.notEqual(lite.overlay.style.display, "none");
  assert.deepEqual(translateOf(lite.overlay), { x: 580 + 8 + 1 * 7, y: 339 + 8 + 21 });
  lite.dispose();
});

test("the ResizeObserver watches only the focused host and stops on blur and unload", () => {
  const RO = fakeResizeObserver();
  const { doc: doc2, win, body, listeners: l2 } = createFakeDoc();
  win.ResizeObserver = RO.Class;
  const measurer = { measure: (el) => ({ x: 10, y: 20, width: 8, height: 19, visible: true, glyph: "h", box: el.getBoundingClientRect() }) };
  const caret = installLiteCaret({
    doc: doc2,
    win,
    measurer,
    lifecycle: { node(node, parent = body) { parent.append(node); } },
    getSettings: () => ({ cursorStyle: "Box", colorLight: "#333333" }),
  });
  assert.equal(RO.instances.length, 1, "one observer for the whole caret");
  const observer = RO.instances[0];

  const block = makeTextarea();
  doc2.activeElement = block;
  l2.get("focusin")({ target: block });
  assert.deepEqual([...observer.targets], [block]);
  assert.equal(observer.observed[0].options.box, "border-box");

  const field = makeInput();
  doc2.activeElement = field;
  l2.get("focusin")({ target: field });
  assert.deepEqual([...observer.targets], [field], "the block is no longer watched");
  assert.ok(observer.observed.every(({ target }) => target !== doc2.body && target !== doc2.documentElement));

  doc2.activeElement = doc2.body;
  l2.get("focusout")({ target: field, relatedTarget: null });
  assert.equal(observer.targets.size, 0);

  doc2.activeElement = block;
  l2.get("focusin")({ target: block });
  caret.dispose();
  assert.equal(observer.disconnected, true);
});

test("a burst of input events is measured once, in the frame, after the host's handlers", () => {
  const box = { left: 0, top: 100, width: 600, height: 40 };
  const composer = trackBox(makeTextarea({
    scrollTop: 0,
    scrollLeft: 0,
    getBoundingClientRect: () => ({ ...box, right: box.left + box.width, bottom: box.top + box.height }),
  }), box);
  const frames = [];
  const { lite, listeners } = installMeasured(composer, {
    boxSizing: "border-box",
    width: "600px",
    paddingTop: "0px",
    paddingLeft: "0px",
    fontSize: "16px",
    lineHeight: "20px",
  }, {}, {
    win: {
      requestAnimationFrame(fn) {
        frames.push(fn);
        return frames.length;
      },
      cancelAnimationFrame() {},
    },
  });
  listeners.get("focusin")({ target: composer });
  assert.equal(frames.length, 1, "focus schedules the first measure");
  frames.shift()();
  assert.equal(translateOf(lite.overlay).y, 100);

  for (let i = 0; i < 3; i += 1) {
    composer.value += "x";
    composer.selectionStart = composer.selectionEnd = composer.value.length;
    listeners.get("input")({ target: composer });
  }
  assert.equal(frames.length, 1, "one frame per burst, not per key");
  assert.equal(translateOf(lite.overlay).y, 100, "nothing painted inside the dispatch");

  box.top = 80;
  frames.shift()();
  assert.equal(translateOf(lite.overlay).y, 80, "the frame reads the box after the host's handlers");
  lite.dispose();
});

test("no observer the lite caret installs ever watches a subtree", () => {
  const { lite, observers } = installHarness();
  const options = observers.flatMap((o) => o.targets.map(({ options: opts }) => opts || {}));
  assert.ok(options.length > 0);
  assert.equal(options.some((opts) => opts.subtree), false, "no subtree: Roam's block churn must not reach us");
  for (const opts of options) {
    assert.ok(opts.childList || (opts.attributes && opts.attributeFilter?.join() === "class"));
  }
  lite.dispose();
  assert.ok(observers.every((o) => o.disconnected));
});

test("input, keyup and selectionchange read no geometry; five events and one frame give one measure", () => {
  const { doc, win, body, listeners } = createFakeDoc();
  const raf = rafQueue(win);
  const reads = { box: 0, offset: 0, computed: 0 };
  let counting = false;
  win.getComputedStyle = () => {
    if (counting) reads.computed += 1;
    return {
      boxSizing: "border-box",
      width: "600px",
      fontFamily: "sans-serif",
      fontSize: "16px",
      lineHeight: "19px",
      color: "rgb(51, 51, 51)",
      position: "static",
      overflowX: "visible",
      overflowY: "visible",
    };
  };
  const textarea = makeTextarea({
    scrollTop: 0,
    scrollLeft: 0,
    getBoundingClientRect() {
      if (counting) reads.box += 1;
      return { left: 0, top: 0, right: 600, bottom: 200, width: 600, height: 200 };
    },
  });
  const spyOffsets = (node) => {
    for (const prop of ["offsetTop", "offsetLeft", "offsetWidth", "offsetHeight"]) {
      Object.defineProperty(node, prop, {
        configurable: true,
        get() {
          if (counting) reads.offset += 1;
          return prop === "offsetWidth" ? 600 : prop === "offsetHeight" ? 200 : 0;
        },
      });
    }
  };
  spyOffsets(textarea);
  doc.activeElement = textarea;
  const lifecycle = { node(node, parent = body) { parent.append(node); } };
  const measurer = createCaretMeasurer({ doc, win, lifecycle });
  const [prefix, marker, glyphEl] = body.children[0].children[1].children;
  void prefix;
  spyOffsets(marker);
  spyOffsets(glyphEl);
  let measures = 0;
  const baseMeasure = measurer.measure;
  measurer.measure = (el) => {
    measures += 1;
    return baseMeasure(el);
  };
  const lite = installLiteCaret({
    doc,
    win,
    measurer,
    lifecycle,
    getSettings: () => ({ cursorStyle: "Beam", colorLight: "#00695e", blinkingEnabled: true }),
  });
  listeners.get("focusin")({ target: textarea });
  raf.flush();
  assert.equal(measures, 1);

  counting = true;
  for (const type of ["input", "keyup", "selectionchange", "input", "keyup"]) {
    textarea.value += type === "input" ? "x" : "";
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    listeners.get(type)({ type, target: textarea });
  }
  assert.deepEqual(reads, { box: 0, offset: 0, computed: 0 }, "zero geometry or style reads during dispatch");
  assert.equal(measures, 1, "nothing measured yet");
  assert.equal(raf.frames.length, 1, "one frame requested for five events");

  raf.flush();
  assert.equal(measures, 2, "exactly one measure for the burst");
  assert.equal(reads.box, 1, "one host box read in the frame");
  assert.equal(reads.computed, 0, "the style copy is cached per focused host");
  assert.notEqual(lite.overlay.style.display, "none");

  listeners.get("keyup")({ type: "keyup", target: textarea });
  assert.equal(raf.frames.length, 0, "an unchanged caret asks for no frame at all");
  lite.dispose();
  measurer.dispose();
});

test("a host detached without focusout hides on the next measure, no observer involved", () => {
  const { lite, doc, listeners, observers } = installHarness();
  const field = makeInput({ isConnected: true });
  doc.activeElement = field;
  listeners.get("focusin")({ target: field });
  assert.notEqual(lite.overlay.style.display, "none");
  assert.equal(field.style.getPropertyValue("caret-color"), "transparent");

  const callbacks = observers.map((o) => o.callback);
  for (const o of observers) {
    o.callback = () => {
      throw new Error("no observer may run in this test");
    };
  }
  field.isConnected = false;
  listeners.get("focus")();
  assert.equal(lite.overlay.style.display, "none");
  assert.equal(lite.active, null);
  assert.equal(field.style.getPropertyValue("caret-color"), "", "browser caret restored");
  observers.forEach((o, i) => {
    o.callback = callbacks[i];
  });
});

test("palette open and close through focus alone: a caret only in the palette field", () => {
  const { lite, doc, win, listeners, observers, textarea, measurer } = installHarness();
  const raf = rafQueue(win);
  for (const o of observers) {
    o.callback = () => {
      throw new Error("focus changes alone must drive the palette state");
    };
  }
  listeners.get("focusin")({ target: textarea });
  raf.flush();
  assert.notEqual(lite.overlay.style.display, "none");

  const { palette } = makePalette(doc);
  doc._commandPalette = palette;
  const search = makeInput({ type: "search", palette });
  doc.activeElement = search;
  listeners.get("focusout")({ target: textarea, relatedTarget: search });
  listeners.get("focusin")({ target: search });
  raf.flush();
  assert.notEqual(lite.overlay.style.display, "none");
  assert.equal(measurer.lastEl, search);

  let blockMeasures = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    if (el === textarea) blockMeasures += 1;
    return baseMeasure(el);
  };
  doc.activeElement = textarea;
  listeners.get("focusout")({ target: search, relatedTarget: textarea });
  listeners.get("focusin")({ target: textarea });
  raf.flush();
  assert.equal(lite.overlay.style.display, "none", "a block behind the open palette shows none");
  assert.equal(blockMeasures, 0);

  doc._commandPalette = null;
  listeners.get("focusout")({ target: textarea, relatedTarget: null });
  listeners.get("focusin")({ target: textarea });
  raf.flush();
  assert.notEqual(lite.overlay.style.display, "none", "palette gone: the block caret is back");
  assert.equal(blockMeasures, 1);
});

test("the stylesheet passes the bucket check in strict mode", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const script = new URL("../scripts/bucket_check.mjs", import.meta.url);
  const sheet = new URL("../src/extension.css", import.meta.url);
  const { stdout } = await run(process.execPath, [script.pathname, sheet.pathname, "--strict"]);
  assert.match(stdout, /problems: 0/);
  assert.match(stdout, /"universal":0/);
});

test("selection: the focused host gets the caret colour once per focus, none per key", () => {
  const { doc, win, listeners } = createFakeDoc();
  const raf = rafQueue(win);
  const field = makeTextarea({ style: makeStyle(), classList: makeClassList() });
  let writes = 0;
  const setProperty = field.style.setProperty;
  field.style.setProperty = (...args) => {
    if (String(args[0]).startsWith("--cs-")) writes += 1;
    return setProperty(...args);
  };
  doc.activeElement = field;
  const measurer = {
    measure: (el) => ({ x: 1, y: 1, width: 8, height: 19, visible: true, glyph: "", color: "rgb(51, 51, 51)", box: el.getBoundingClientRect() }),
  };
  const lite = installLiteCaret({
    doc,
    win,
    measurer,
    lifecycle: { node(node, parent = doc.body) { parent.append(node); } },
    getSettings: () => ({ cursorStyle: "Beam", colorLight: "#00695e", colorDark: "#5eead4" }),
  });
  listeners.get("focusin")({ target: field });
  assert.equal(field.classList.contains("cs-sel"), false, "nothing written inside focusin");
  raf.flush();
  assert.equal(field.classList.contains("cs-sel"), true);
  assert.equal(field.style.getPropertyValue("--cs-selection"), "#00695e");
  assert.equal(field.style.getPropertyValue("--cs-selection-text"), glyphColorOn("#00695e", "rgb(51, 51, 51)"));
  assert.equal(writes, 2);

  for (let i = 0; i < 4; i += 1) {
    field.value += "x";
    field.selectionStart = field.selectionEnd = field.value.length;
    listeners.get("input")({ target: field });
    raf.flush();
  }
  assert.equal(writes, 2, "no selection write on input");

  field.selectionStart = 0;
  listeners.get("selectionchange")({ target: field });
  raf.flush();
  assert.equal(lite.overlay.style.display, "none", "a range hides the overlay");
  assert.equal(field.classList.contains("cs-sel"), true, "and keeps the selection colour");

  doc.body.classList.add("rm-dark-theme");
  field.selectionStart = field.selectionEnd;
  listeners.get("selectionchange")({ target: field });
  raf.flush();
  assert.equal(field.style.getPropertyValue("--cs-selection"), "#5eead4", "theme switch repaints");

  doc.activeElement = doc.body;
  listeners.get("focusout")({ target: field, relatedTarget: null });
  assert.equal(field.classList.contains("cs-sel"), false, "cleared on blur");
  assert.equal(field.style.getPropertyValue("--cs-selection"), "");
  assert.equal(field.style.getPropertyValue("--cs-selection-text"), "");

  doc.activeElement = field;
  listeners.get("focusin")({ target: field });
  raf.flush();
  assert.equal(field.classList.contains("cs-sel"), true);
  lite.dispose();
  assert.equal(field.classList.contains("cs-sel"), false, "cleared on unload");
  assert.equal(field.style.getPropertyValue("--cs-selection"), "");
});

test("selection: plain Line sets the same properties on focus with no read", () => {
  const { doc, win, listeners } = createFakeDoc();
  let boxReads = 0;
  const field = makeTextarea({
    style: makeStyle(),
    classList: makeClassList(),
    getBoundingClientRect() {
      boxReads += 1;
      return { left: 0, top: 0, right: 600, bottom: 200, width: 600, height: 200 };
    },
  });
  win.getComputedStyle = () => {
    throw new Error("the native path reads no style");
  };
  const native = installNativeCaret({ doc, win, getSettings: () => ({ colorLight: "#00695e" }) });
  doc.activeElement = field;
  listeners.get("focusin")({ target: field });
  assert.equal(field.classList.contains("cs-sel"), true);
  assert.equal(field.style.getPropertyValue("--cs-selection"), "#00695e");
  assert.equal(field.style.getPropertyValue("--cs-selection-text"), "rgb(255, 255, 255)");
  assert.equal(listeners.has("input"), false, "still no key listener");

  listeners.get("focusout")({ target: field });
  assert.equal(field.classList.contains("cs-sel"), false);
  assert.equal(field.style.getPropertyValue("--cs-selection"), "");

  listeners.get("focusin")({ target: field });
  native.dispose();
  assert.equal(field.classList.contains("cs-sel"), false);
  assert.equal(field.style.getPropertyValue("--cs-selection-text"), "");
  assert.equal(boxReads, 0);
});

test("selection CSS: one class-keyed rule, no descendant or universal selector", async () => {
  const css = await readFile(new URL("../src/extension.css", import.meta.url), "utf8");
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/[^{}]*::selection[^{]*\{[^}]*\}/g) || [];
  assert.equal(rules.length, 1);
  const selector = rules[0].slice(0, rules[0].indexOf("{")).trim();
  assert.equal(selector, ".cs-sel::selection");
  assert.match(rules[0], /background:\s*var\(--cs-selection\)/);
  assert.match(rules[0], /color:\s*var\(--cs-selection-text\)/);
});
