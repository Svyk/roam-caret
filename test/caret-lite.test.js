import assert from "node:assert/strict";
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

function paletteObserver(observers) {
  return observers.find((o) => o.targets.some(({ options }) => options?.childList && options?.subtree));
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

test("focus on a non-block input hides overlay and does not measure", () => {
  const { lite, listeners, measurer } = installHarness();
  let measureCalls = 0;
  const baseMeasure = measurer.measure.bind(measurer);
  measurer.measure = (el) => {
    measureCalls += 1;
    return baseMeasure(el);
  };

  const input = {
    tagName: "INPUT",
    type: "search",
    getAttribute: () => "search",
    closest: () => null,
  };
  listeners.get("focusin")({ target: input });
  assert.equal(lite.overlay.style.display, "none");
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

test("native Line leaves Roam Grid and search inputs alone", () => {
  const { doc, win, listeners } = createFakeDoc();
  const grid = makeStyledTextarea({ closest: () => ({ className: "rg-root" }) });
  installNativeCaret({ doc, win, getSettings: () => ({ colorLight: "#00695e" }) });
  listeners.get("focusin")({ target: grid });
  assert.equal(grid.style.getPropertyValue("caret-color"), "");
});
