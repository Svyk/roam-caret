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
