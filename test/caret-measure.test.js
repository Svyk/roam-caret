import assert from "node:assert/strict";
import test from "node:test";

import {
  createCaretMeasurer,
  isSkippedHost,
  projectCaretRect,
} from "../src/caret-measure.js";

const BASE_BOX = { left: 100, top: 50, width: 200, height: 40 };

function zeros(extra = {}) {
  return {
    box: BASE_BOX,
    offsetW: 200,
    offsetH: 40,
    markerLeft: 10,
    markerTop: 2,
    scrollLeft: 0,
    scrollTop: 0,
    borderLeft: 0,
    borderTop: 0,
    padLeft: 0,
    padTop: 0,
    padRight: 0,
    padBottom: 0,
    glyphWidth: 8,
    lineHeightPx: 19,
    hasGlyph: false,
    glyph: "x",
    ...extra,
  };
}

test("projectCaretRect zoom 1 maps marker offsets into viewport space", () => {
  const rect = projectCaretRect(zeros());
  assert.equal(rect.x, 110);
  assert.equal(rect.y, 52);
});

test("projectCaretRect zoom 1.25 scales the marker offset", () => {
  const rect = projectCaretRect(zeros({
    box: { left: 100, top: 50, width: 250, height: 50 },
    offsetW: 200,
    offsetH: 40,
  }));
  assert.equal(rect.x, 100 + 12.5);
});

test("projectCaretRect visible is false when the marker is below the content bottom", () => {
  const rect = projectCaretRect(zeros({ markerTop: 40 }));
  assert.equal(rect.visible, false);
});

test("isSkippedHost uses closest for roam-grid and roam-pixel-drawer roots", () => {
  const skipped = {
    closest(sel) {
      return sel === ".rg-root, .pxd-root" ? { className: "rg-root" } : null;
    },
  };
  const other = { closest: () => null };
  assert.equal(isSkippedHost(skipped), true);
  assert.equal(isSkippedHost(other), false);
  assert.equal(isSkippedHost(null), false);
});

function createFakeDoc() {
  const body = {
    children: [],
    append(node) {
      this.children.push(node);
      node.parentNode = this;
    },
    appendChild(node) {
      this.append(node);
    },
  };
  const doc = {
    body,
    createElement(tag) {
      const el = {
        tagName: String(tag).toUpperCase(),
        style: {},
        children: [],
        attributes: {},
        textContent: "",
        offsetLeft: 10,
        offsetTop: 2,
        offsetWidth: 8,
        parentNode: null,
        setAttribute(name, value) {
          this.attributes[name] = value;
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
          this.removed = true;
          const parent = this.parentNode;
          if (!parent?.children) return;
          const index = parent.children.indexOf(this);
          if (index >= 0) parent.children.splice(index, 1);
        },
      };
      return el;
    },
  };
  return { doc, body };
}

function fakeComputed() {
  return {
    boxSizing: "border-box",
    width: "200px",
    paddingTop: "0px",
    paddingRight: "0px",
    paddingBottom: "0px",
    paddingLeft: "0px",
    borderTopWidth: "0px",
    borderRightWidth: "0px",
    borderBottomWidth: "0px",
    borderLeftWidth: "0px",
    fontFamily: "sans-serif",
    fontSize: "16px",
    fontWeight: "400",
    fontStyle: "normal",
    fontVariant: "normal",
    letterSpacing: "0px",
    textTransform: "none",
    textIndent: "0px",
    lineHeight: "19px",
    tabSize: "4",
    direction: "ltr",
    color: "rgb(0, 0, 0)",
  };
}

function fakeTextEl(doc, extras = {}) {
  return {
    tagName: "TEXTAREA",
    value: "hello",
    selectionStart: 2,
    offsetWidth: 200,
    offsetHeight: 40,
    scrollLeft: 0,
    scrollTop: 0,
    ownerDocument: doc,
    closest: () => null,
    getBoundingClientRect: () => ({ ...BASE_BOX, right: 300, bottom: 90 }),
    ...extras,
  };
}

test("createCaretMeasurer caches computed style per element and dispose removes the mirror", () => {
  const { doc, body } = createFakeDoc();
  let styleCalls = 0;
  const win = {
    getComputedStyle() {
      styleCalls += 1;
      return fakeComputed();
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const measurer = createCaretMeasurer({ doc, win });
  assert.equal(body.children.length, 1);
  assert.equal(body.children[0].style.position, "absolute");
  assert.equal(body.children[0].style.left, "-99999px");
  assert.equal(body.children[0].attributes["aria-hidden"], "true");

  const el = fakeTextEl(doc);
  const first = measurer.measure(el);
  const second = measurer.measure(el);
  assert.equal(styleCalls, 1);
  assert.equal(first.x, 110);
  assert.equal(first.y, 52);
  assert.equal(measurer.latest(), second);

  const other = fakeTextEl(doc, { value: "other" });
  measurer.measure(other);
  assert.equal(styleCalls, 2);

  measurer.dispose();
  assert.equal(body.children.length, 0);
  assert.equal(measurer.measure(el), null);
});

test("createCaretMeasurer reuses marker and glyph nodes after the first measure", () => {
  const { doc, body } = createFakeDoc();
  const win = {
    getComputedStyle() {
      return fakeComputed();
    },
    addEventListener() {},
    removeEventListener() {},
  };
  let createCalls = 0;
  const origCreate = doc.createElement.bind(doc);
  doc.createElement = (tag) => {
    createCalls += 1;
    return origCreate(tag);
  };

  const measurer = createCaretMeasurer({ doc, win });
  const el = fakeTextEl(doc);
  measurer.measure(el);
  const afterFirst = createCalls;

  for (let i = 0; i < 50; i += 1) {
    el.selectionStart = (i % 5) + 1;
    measurer.measure(el);
  }
  assert.equal(createCalls, afterFirst);

  const mirror = body.children[0];
  assert.equal(mirror.children.length, 2);
  assert.equal(mirror.children[1].children.length, 3);

  measurer.dispose();
});

test("the glyph under the caret is edited in place, never a new Text node per key", () => {
  const { doc } = createFakeDoc();
  const texts = [];
  doc.createTextNode = (data) => {
    const node = {
      nodeType: 3,
      data: String(data),
      replaceData(offset, count, value) {
        this.data = this.data.slice(0, offset) + value + this.data.slice(offset + count);
      },
    };
    texts.push(node);
    return node;
  };
  const win = { getComputedStyle: fakeComputed, addEventListener() {}, removeEventListener() {} };
  const measurer = createCaretMeasurer({ doc, win });
  const created = texts.length;
  const glyphText = texts[created - 1];
  const el = fakeTextEl(doc, { value: "", selectionStart: 0 });
  for (const ch of "typing at the end") {
    el.value += ch;
    el.selectionStart = el.value.length;
    measurer.measure(el);
  }
  el.value = "abc";
  el.selectionStart = 1;
  measurer.measure(el);
  assert.equal(texts.length, created, "no Text node is created after setup");
  assert.equal(glyphText.data, "b", "the glyph node now holds the character under the caret");
  measurer.dispose();
});

test("createCaretMeasurer invalidates style cache when documentElement class changes", () => {
  const { doc } = createFakeDoc();
  const documentElement = { className: "" };
  doc.documentElement = documentElement;
  let styleCalls = 0;
  let observerCallback = null;
  const OriginalObserver = globalThis.MutationObserver;
  globalThis.MutationObserver = class {
    constructor(callback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
  const win = {
    getComputedStyle() {
      styleCalls += 1;
      return fakeComputed();
    },
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    visualViewport: { addEventListener() {}, removeEventListener() {} },
  };
  try {
    const measurer = createCaretMeasurer({ doc, win });
    const el = fakeTextEl(doc);
    measurer.measure(el);
    assert.equal(styleCalls, 1);

    observerCallback?.([{ type: "attributes", attributeName: "class" }]);
    measurer.measure(el);
    assert.equal(styleCalls, 2);

    measurer.dispose();
  } finally {
    globalThis.MutationObserver = OriginalObserver;
  }
});

test("a text input measures as one centred line; a textarea still wraps", () => {
  const { doc, body } = createFakeDoc();
  const win = {
    getComputedStyle: () => fakeComputed(),
    addEventListener() {},
    removeEventListener() {},
  };
  const measurer = createCaretMeasurer({ doc, win });
  const mirror = body.children[0];

  const input = fakeTextEl(doc, { tagName: "INPUT", getAttribute: () => "search" });
  const rect = measurer.measure(input);
  assert.equal(mirror.style.whiteSpace, "pre", "an input scrolls sideways, it never wraps");
  assert.equal(rect.x, 110);
  assert.equal(rect.y, 50 + 2 + (40 - 19) / 2, "the 19px line sits in the middle of the 40px box");

  const textarea = fakeTextEl(doc);
  const wrapped = measurer.measure(textarea);
  assert.equal(mirror.style.whiteSpace, "pre-wrap");
  assert.equal(wrapped.y, 52);
  measurer.dispose();
});

test("a padded input whose line-height is the field height keeps the 1.5em cap", () => {
  const { doc } = createFakeDoc();
  const win = {
    getComputedStyle: () => ({
      ...fakeComputed(),
      lineHeight: "40px",
      paddingTop: "6px",
      paddingBottom: "6px",
    }),
    addEventListener() {},
    removeEventListener() {},
  };
  const measurer = createCaretMeasurer({ doc, win });
  const input = fakeTextEl(doc, { tagName: "INPUT", getAttribute: () => null });
  const rect = measurer.measure(input);
  assert.equal(rect.height, 24, "1.5 x the 16px font, not the 40px line");
  assert.equal(rect.lineHeight, "24px", "the Box letter uses the same line");
  assert.equal(rect.y, 50 + 2 + (28 - 24) / 2, "centred in the 28px content box");
  measurer.dispose();
});

// Find or Create Page, read live on 2026-09-24: 30px tall, line-height 30px,
// 14px font, padding 0 10px 0 30px (the 30px is the search icon), no border.
function findOrCreateComputed() {
  return {
    ...fakeComputed(),
    width: "300px",
    fontSize: "14px",
    lineHeight: "30px",
    paddingLeft: "30px",
    paddingRight: "10px",
  };
}

// The mirror lays out like Chrome: the marker starts at the padding edge and
// moves 7px per character in front of it.
function layOutMirror(body) {
  const mirror = body.children[0];
  const line = mirror.children[1] || mirror;
  const [prefix, marker] = line.children;
  const at = (value) => Number.parseFloat(value) || 0;
  Object.defineProperty(marker, "offsetLeft", {
    get: () => at(mirror.style.paddingLeft) + prefix.textContent.length * 7,
  });
  Object.defineProperty(marker, "offsetTop", { get: () => at(mirror.style.paddingTop) });
}

test("Find or Create: an empty field puts the caret after the icon, centred on the 30px line", () => {
  const { doc, body } = createFakeDoc();
  const win = {
    getComputedStyle: () => findOrCreateComputed(),
    addEventListener() {},
    removeEventListener() {},
  };
  const measurer = createCaretMeasurer({ doc, win });
  layOutMirror(body);
  const box = { left: 400, top: 10, width: 300, height: 30, right: 700, bottom: 40 };
  const input = fakeTextEl(doc, {
    tagName: "INPUT",
    getAttribute: () => null,
    value: "",
    selectionStart: 0,
    offsetWidth: 300,
    offsetHeight: 30,
    getBoundingClientRect: () => box,
  });

  const rect = measurer.measure(input);
  assert.equal(rect.x, 400 + 30, "padding-left origin, not the middle of the bar");
  assert.notEqual(rect.x, 400 + 300 / 2);
  assert.ok(Math.abs(rect.y + rect.height / 2 - (10 + 30 / 2)) < 1e-9, "centre of the 30px line");
  assert.ok(rect.height < 30, "not the whole field");
  assert.ok(Math.abs(rect.height - 14 * 1.2) < 1e-9, "about the font size");
  assert.equal(rect.lineHeight, `${rect.height}px`, "the Box letter uses the caret's own line");
  assert.equal(rect.visible, true);

  input.value = "why";
  input.selectionStart = 3;
  const typed = measurer.measure(input);
  assert.equal(typed.x, 400 + 30 + 3 * 7);
  assert.equal(typed.y, rect.y, "typing does not move the caret off the line");
  measurer.dispose();
});
