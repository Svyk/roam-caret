import assert from "node:assert/strict";
import test from "node:test";

import {
  caretScale,
  createCaretMeasurer,
  endOfLineMarker,
  isSkippedHost,
  isTextTarget,
  nextCaretGlyph,
  parseTransformScale,
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

test("isSkippedHost skips Roam Grid and measures a Plexus board", () => {
  const grid = {
    closest(sel) {
      return sel === ".rg-root" ? { className: "rg-root" } : null;
    },
  };
  const board = {
    closest(sel) {
      return sel === ".pxd-root" ? { className: "pxd-root" } : null;
    },
  };
  assert.equal(isSkippedHost(grid), true);
  assert.equal(isSkippedHost(board), false);
  assert.equal(isSkippedHost({ closest: () => null }), false);
  assert.equal(isSkippedHost(null), false);
});

test("projectCaretRect scale 0.5 maps the unscaled marker onto the screen box", () => {
  const rect = projectCaretRect(zeros({
    box: { left: 80, top: 40, width: 100, height: 20 },
    offsetW: 200,
    offsetH: 40,
  }));
  assert.equal(rect.x, 85);
  assert.equal(rect.y, 41);
  assert.equal(rect.width, 4);
  assert.equal(rect.height, 9.5);
  assert.equal(rect.scaleX, 0.5);
  assert.equal(rect.scaleY, 0.5);
});

test("projectCaretRect scale 2 maps the unscaled marker onto the screen box", () => {
  const rect = projectCaretRect(zeros({
    box: { left: 40, top: 20, width: 400, height: 80 },
    offsetW: 200,
    offsetH: 40,
  }));
  assert.equal(rect.x, 60);
  assert.equal(rect.y, 24);
  assert.equal(rect.width, 16);
  assert.equal(rect.height, 38);
  assert.equal(rect.scaleX, 2);
  assert.equal(rect.scaleY, 2);
});

test("projectCaretRect keeps the caret at least one device pixel wide", () => {
  const rect = projectCaretRect(zeros({
    box: { left: 10, top: 20, width: 20, height: 4 },
    offsetW: 200,
    offsetH: 40,
    glyphWidth: 2,
    devicePixelRatio: 2,
  }));
  assert.equal(rect.scaleX, 0.1);
  assert.equal(rect.width, 0.5);
  assert.equal(rect.height, 19 * 0.1);
  assert.equal(rect.x, 11);
  assert.equal(rect.y, 20.2);
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

test("a scaled Plexus textarea measures in layout px and paints in screen px", () => {
  const { doc, body } = createFakeDoc();
  const win = {
    getComputedStyle: () => fakeComputed(),
    addEventListener() {},
    removeEventListener() {},
  };
  const measurer = createCaretMeasurer({ doc, win });
  const cases = [
    {
      box: { left: 80, top: 40, width: 100, height: 20, right: 180, bottom: 60 },
      x: 85,
      y: 41,
      width: 4,
      height: 9.5,
      scale: 0.5,
    },
    {
      box: { left: 40, top: 20, width: 400, height: 80, right: 440, bottom: 100 },
      x: 60,
      y: 24,
      width: 16,
      height: 38,
      scale: 2,
    },
  ];
  for (const item of cases) {
    const el = fakeTextEl(doc, { getBoundingClientRect: () => item.box });
    const rect = measurer.measure(el);
    assert.equal(rect.x, item.x, `scale ${item.scale} x`);
    assert.equal(rect.y, item.y, `scale ${item.scale} y`);
    assert.equal(rect.width, item.width, `scale ${item.scale} width`);
    assert.equal(rect.height, item.height, `scale ${item.scale} height`);
    assert.equal(rect.scaleX, item.scale);
    assert.equal(rect.scaleY, item.scale);
    assert.equal(body.children[0].style.width, "200px", "the mirror stays in layout px");
  }
  const grid = fakeTextEl(doc, {
    closest: (sel) => (sel === ".rg-root" ? { className: "rg-root" } : null),
  });
  assert.equal(measurer.measure(grid), null, "a Roam Grid host is not measured");
  measurer.dispose();
});

test("caretScale uses the border-box ratio until a Plexus transform is known", () => {
  assert.equal(caretScale(100, 200, 0.5, false), 0.5);
  assert.equal(caretScale(400, 200), 2);
  // Page card: rect and offset agree, so the ratio is 1. The world scale is the line.
  assert.equal(caretScale(200, 200, 0.54, true), 0.54);
  // Do not multiply the ratio by the ancestor. That paints at zoom squared.
  assert.equal(caretScale(100, 200, 0.5, true), 0.5);
  // Note card: world scale(z) times editor scale(1/z) is 1, and the font is
  // already screen px. A border box that still reports 1/zoom must not win.
  assert.equal(caretScale(370, 200, 1, true), 1);
  assert.equal(caretScale(74, 40, 1.01, true), 1);
});

test("parseTransformScale reads scale() and matrix(), and ignores translate()", () => {
  assert.equal(parseTransformScale("none"), null);
  assert.equal(parseTransformScale("translate(10px, 20px)"), null);
  assert.deepEqual(parseTransformScale("translate(10px, 20px) scale(0.54)"), { sx: 0.54, sy: 0.54 });
  assert.deepEqual(parseTransformScale("scale(2, 0.5)"), { sx: 2, sy: 0.5 });
  assert.deepEqual(parseTransformScale("matrix(0.5, 0, 0, 2, 10, 20)"), { sx: 0.5, sy: 2 });
  const cancelled = parseTransformScale("scale(2)");
  const world = parseTransformScale("scale(0.5)");
  assert.equal(cancelled.sx * world.sx, 1);
});

test("nextCaretGlyph is the character after the caret, and nothing at end of line", () => {
  assert.deepEqual(nextCaretGlyph("awake.", 0), { glyph: "a", hasGlyph: true, atEndOfLine: false });
  assert.deepEqual(nextCaretGlyph("awake.", 6), { glyph: "", hasGlyph: false, atEndOfLine: true });
  assert.deepEqual(nextCaretGlyph("awake.\nnext", 6), { glyph: "", hasGlyph: false, atEndOfLine: true });
  assert.deepEqual(nextCaretGlyph("ab", 1), { glyph: "b", hasGlyph: true, atEndOfLine: false });
  assert.equal(nextCaretGlyph("is", 0).glyph, "i");
});

test("endOfLineMarker pulls a wrapped end back one line and leaves a real line start", () => {
  const wrapped = endOfLineMarker({
    markerLeft: 16,
    markerTop: 19,
    lineHeight: 19,
    padLeft: 16,
    padTop: 0,
    contentRight: 184,
    atEndOfLine: true,
    hasLineText: true,
  });
  assert.deepEqual(wrapped, { left: 184, top: 0 });

  const midLine = endOfLineMarker({
    markerLeft: 16,
    markerTop: 19,
    lineHeight: 19,
    padLeft: 16,
    padTop: 0,
    contentRight: 184,
    atEndOfLine: false,
    hasLineText: true,
  });
  assert.deepEqual(midLine, { left: 16, top: 19 });

  const emptyLine = endOfLineMarker({
    markerLeft: 16,
    markerTop: 19,
    lineHeight: 19,
    padLeft: 16,
    padTop: 0,
    contentRight: 184,
    atEndOfLine: true,
    hasLineText: false,
  });
  assert.deepEqual(emptyLine, { left: 16, top: 19 });
});

test("end of text paints no letter and stays on the last real line", () => {
  const { doc, body } = createFakeDoc();
  const win = {
    getComputedStyle: () => ({
      ...fakeComputed(),
      paddingLeft: "16px",
      paddingRight: "16px",
      overflowWrap: "anywhere",
    }),
    addEventListener() {},
    removeEventListener() {},
  };
  const measurer = createCaretMeasurer({ doc, win });
  const marker = body.children[0].children[1].children[1];
  Object.defineProperty(marker, "offsetLeft", { configurable: true, get: () => 16 });
  Object.defineProperty(marker, "offsetTop", { configurable: true, get: () => 19 });

  const end = fakeTextEl(doc, { value: "awake.", selectionStart: 6 });
  const rect = measurer.measure(end);
  assert.equal(rect.glyph, "");
  assert.equal(rect.x, 100 + (200 - 16), "the caret sits at the end of the line, not the wrapped padding edge");
  assert.equal(rect.y, 50, "a wrapped end marker is pulled up off the phantom line");
  assert.equal(body.children[0].style.overflowWrap, "anywhere");

  const middle = fakeTextEl(doc, { value: "awake.", selectionStart: 2 });
  const mid = measurer.measure(middle);
  assert.equal(mid.glyph, "a");
  assert.equal(mid.x, 100 + 16);
  assert.equal(mid.y, 50 + 19, "a real line start is not pulled back");

  const blank = fakeTextEl(doc, { value: "awake.\n", selectionStart: 7 });
  const next = measurer.measure(blank);
  assert.equal(next.glyph, "");
  assert.equal(next.y, 50 + 19, "an empty line after a newline stays on that line");
  measurer.dispose();
});

test("a Plexus page card scales by the world transform, a note card stays at 1", () => {
  const { doc, body } = createFakeDoc();
  const win = {
    getComputedStyle: () => fakeComputed(),
    addEventListener() {},
    removeEventListener() {},
  };
  const measurer = createCaretMeasurer({ doc, win });
  const field = (editorTransform, worldTransform, box, offsetWidth, offsetHeight) => fakeTextEl(doc, {
    offsetWidth,
    offsetHeight,
    getBoundingClientRect: () => box,
    closest(sel) {
      if (sel === ".pxd-item__editor") return { style: { transform: editorTransform } };
      if (sel === ".pxd-world") return { style: { transform: worldTransform } };
      return null;
    },
  });

  const page = field(
    "",
    "translate(10px, 20px) scale(0.5)",
    { left: 100, top: 50, width: 200, height: 40, right: 300, bottom: 90 },
    200,
    40,
  );
  const pageRect = measurer.measure(page);
  assert.equal(pageRect.scaleX, 0.5);
  assert.equal(pageRect.scaleY, 0.5);
  assert.equal(pageRect.x, 105);
  assert.equal(pageRect.y, 51);
  assert.equal(pageRect.height, 9.5);
  assert.equal(pageRect.width, 4);
  assert.equal(pageRect.glyph, "l");

  const note = field(
    "scale(2)",
    "scale(0.5)",
    { left: 100, top: 50, width: 370, height: 74, right: 470, bottom: 124 },
    200,
    40,
  );
  const noteRect = measurer.measure(note);
  assert.equal(noteRect.scaleX, 1, "counter-scale cancels the world; the ratio must not stretch the caret");
  assert.equal(noteRect.scaleY, 1);
  assert.equal(noteRect.height, 19);
  assert.equal(noteRect.x, 110);
  assert.equal(noteRect.y, 52);
  assert.equal(body.children[0].style.width, "200px");
  measurer.dispose();
});

test("an inline font-size change recopies style without a width change", () => {
  const { doc } = createFakeDoc();
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
  const el = fakeTextEl(doc, { style: { fontSize: "13px", lineHeight: "19.5px" } });
  measurer.measure(el);
  assert.equal(styleCalls, 1);
  el.style.fontSize = "7px";
  measurer.measure(el);
  assert.equal(styleCalls, 2, "counter-scale rewrites the font without resizing the border box");
  el.value = "hello!";
  measurer.measure(el);
  assert.equal(styleCalls, 2, "typing does not recopy style");
  el.offsetWidth = 240;
  measurer.measure(el);
  assert.equal(styleCalls, 3, "a width change recopies style in the same measure");
  measurer.dispose();
});

test("isTextTarget excludes input types without a selection API in Chrome", () => {
  const input = (type) => ({ tagName: "INPUT", getAttribute: () => type });
  for (const type of ["number", "email", "checkbox", "date"]) assert.equal(isTextTarget(input(type)), false, type);
  for (const type of ["text", "search", "url", "tel"]) assert.equal(isTextTarget(input(type)), true, type);
  assert.equal(isTextTarget({ tagName: "TEXTAREA" }), true);
});

test("the mirror's line blocks inherit the field's font and line-height from the mirror", () => {
  const { doc, body } = createFakeDoc();
  const win = { getComputedStyle: () => fakeComputed(), addEventListener() {}, removeEventListener() {} };
  const measurer = createCaretMeasurer({ doc, win });
  const mirror = body.children[0];
  assert.equal(mirror.children.length, 2);
  for (const block of mirror.children) {
    assert.equal(block.style.font, "inherit", "a bare `div { line-height: 1.5em }` rule must not size the mirror's lines");
  }
  measurer.dispose();
});
