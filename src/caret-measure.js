const MARKER_CHAR = "\u200b";
const INPUT_LINE_EM = 1.5;
const INPUT_TEXT_EM = 1.2;
// Roam Grid keeps the browser caret. A Plexus board (.pxd-root) is measured:
// its transform is the textarea's border box divided by its layout size.
const SKIP_HOST_SELECTOR = ".rg-root";

// One physical pixel, in CSS px. A scaled caret must not vanish under it.
export function deviceMinPx(devicePixelRatio) {
  const dpr = Number(devicePixelRatio);
  return 1 / (dpr > 0 ? dpr : 1);
}

export function scaledCaretWidth(cssPx, scale, devicePixelRatio) {
  const base = Number(cssPx);
  const factor = Number(scale);
  const width = (Number.isFinite(base) ? base : 0) * (Number.isFinite(factor) && factor > 0 ? factor : 1);
  return Math.max(deviceMinPx(devicePixelRatio), width);
}

// Border-box CSS px over layout px. 1 when the field is not transformed.
export function renderedScale(boxSize, offsetSize) {
  const box = Number(boxSize);
  const offset = Number(offsetSize);
  if (!(box > 0) || !(offset > 0) || !Number.isFinite(box) || !Number.isFinite(offset)) return 1;
  return box / offset;
}

// A Plexus page card lays out in world px under the world's scale(). A note
// editor counter-scales, so the world's scale and the editor's scale(1/zoom)
// cancel and the font is already in screen px. The border-box ratio misses
// that: a textarea often reports the same rect and offset under an ancestor
// transform, and a counter-scaled editor can report 1/zoom.
export function caretScale(boxSize, offsetSize, ancestorScale = 1, ancestorKnown = false) {
  const ratio = renderedScale(boxSize, offsetSize);
  if (!ancestorKnown) return ratio;
  const ancestor = Number(ancestorScale);
  const anc = Number.isFinite(ancestor) && ancestor > 0 ? ancestor : 1;
  if (Math.abs(anc - 1) <= 0.02) return 1;
  return anc;
}

// scale(n) / scale(x, y) as specified, or the 2×2 part of matrix() / matrix3d().
export function parseTransformScale(transform) {
  if (!transform || transform === "none") return null;
  const text = String(transform);
  const matrix = text.match(/matrix\(\s*([eE0-9.+-]+)[,\s]+([eE0-9.+-]+)[,\s]+([eE0-9.+-]+)[,\s]+([eE0-9.+-]+)/);
  const matrix3d = text.match(/matrix3d\(\s*([eE0-9.+-]+)[,\s]+([eE0-9.+-]+)(?:[,\s]+[eE0-9.+-]+){2}[,\s]+([eE0-9.+-]+)[,\s]+([eE0-9.+-]+)/);
  const hit = matrix || matrix3d;
  if (hit) {
    const a = Number(hit[1]);
    const b = Number(hit[2]);
    const c = Number(hit[3]);
    const d = Number(hit[4]);
    if ([a, b, c, d].every(Number.isFinite)) {
      const sx = Math.hypot(a, b);
      const sy = Math.hypot(c, d);
      if (sx > 0 && sy > 0) return { sx, sy };
    }
  }
  let sx = 1;
  let sy = 1;
  let saw = false;
  const re = /scale\(\s*([eE0-9.+-]+)(?:[,\s]+([eE0-9.+-]+))?\s*\)/g;
  let match;
  while ((match = re.exec(text))) {
    const x = Number(match[1]);
    const y = match[2] == null ? x : Number(match[2]);
    if (!(x > 0) || !(y > 0)) continue;
    sx *= x;
    sy *= y;
    saw = true;
  }
  return saw ? { sx, sy } : null;
}

// The letter in the box is the character after the caret. End of text and
// end of line have none: a width probe must not be drawn as a letter.
export function nextCaretGlyph(value, index) {
  const text = value == null ? "" : String(value);
  const at = Number(index);
  const i = Number.isFinite(at) ? Math.max(0, Math.min(at, text.length)) : text.length;
  if (i >= text.length) return { glyph: "", hasGlyph: false, atEndOfLine: true };
  const ch = text[i];
  if (ch === "\n" || ch === "\r") return { glyph: "", hasGlyph: false, atEndOfLine: true };
  return { glyph: ch, hasGlyph: true, atEndOfLine: false };
}

// A zero-width marker at the end of a full line wraps onto a row the textarea
// does not paint. Pull it back to the end of the previous row.
export function endOfLineMarker({
  markerLeft,
  markerTop,
  lineHeight,
  padLeft,
  padTop,
  contentRight,
  atEndOfLine,
  hasLineText,
}) {
  const left = Number(markerLeft) || 0;
  const top = Number(markerTop) || 0;
  const line = Number(lineHeight) || 0;
  const start = Number(padLeft) || 0;
  const top0 = Number(padTop) || 0;
  const right = Number(contentRight);
  if (
    atEndOfLine
    && hasLineText
    && line > 0
    && left <= start + 0.5
    && top >= top0 + line * 0.5
  ) {
    return {
      left: Number.isFinite(right) ? right : left,
      top: Math.max(top0, top - line),
    };
  }
  return { left, top };
}

export const MIRROR_PROPERTIES = Object.freeze([
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontVariant",
  "letterSpacing",
  "textTransform",
  "textIndent",
  "lineHeight",
  "tabSize",
  "direction",
]);

export function isTextTarget(element) {
  if (!element || !element.tagName) return false;
  if (element.tagName === "TEXTAREA") return true;
  if (element.tagName !== "INPUT") return false;
  const type = (element.getAttribute?.("type") || "text").toLowerCase();
  return ["text", "search", "url", "tel"].includes(type);
}

export function isSkippedHost(el) {
  return !!el?.closest?.(SKIP_HOST_SELECTOR);
}

function px(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function projectCaretRect({
  box,
  offsetW,
  offsetH,
  markerLeft,
  markerTop,
  scrollLeft,
  scrollTop,
  borderLeft,
  borderTop,
  padLeft,
  padTop,
  padRight,
  padBottom,
  glyphWidth,
  lineHeightPx,
  hasGlyph,
  glyph,
  devicePixelRatio,
  ancestorScaleX = 1,
  ancestorScaleY = 1,
  ancestorKnown = false,
}) {
  // Ancestor transform (Plexus world scale): the border box is the screen
  // size, offsetWidth/offsetHeight stay layout px. The mirror is layout px.
  // Inside a board, the world's scale (cancelled by a note editor's
  // counter-scale) wins over that ratio.
  const scaleX = caretScale(box.width, offsetW, ancestorScaleX, ancestorKnown);
  const scaleY = caretScale(box.height, offsetH, ancestorScaleY, ancestorKnown);
  const x = box.left + (borderLeft + markerLeft - scrollLeft) * scaleX;
  const y = box.top + (borderTop + markerTop - scrollTop) * scaleY;
  const width = Math.max(deviceMinPx(devicePixelRatio), glyphWidth * scaleX);
  const height = lineHeightPx * scaleY;
  const boxRight = box.right ?? box.left + box.width;
  const boxBottom = box.bottom ?? box.top + box.height;
  const content = {
    left: box.left + (borderLeft + padLeft) * scaleX,
    top: box.top + (borderTop + padTop) * scaleY,
    right: boxRight - (borderLeft + padRight) * scaleX,
    bottom: boxBottom - (borderTop + padBottom) * scaleY,
  };
  const visible =
    x + width > content.left &&
    x < content.right &&
    y + height > content.top &&
    y < content.bottom;
  return {
    x,
    y,
    width,
    height,
    glyph: hasGlyph ? glyph : "",
    visible,
    scaleX,
    scaleY,
  };
}

function readMetrics(computed) {
  const fontSizePx = px(computed.fontSize, 16);
  return {
    borderLeft: px(computed.borderLeftWidth),
    borderRight: px(computed.borderRightWidth),
    borderTop: px(computed.borderTopWidth),
    borderBottom: px(computed.borderBottomWidth),
    padLeft: px(computed.paddingLeft),
    padTop: px(computed.paddingTop),
    padRight: px(computed.paddingRight),
    padBottom: px(computed.paddingBottom),
    lineHeightPx: px(computed.lineHeight) || fontSizePx * 1.2 || 19,
    fontFamily: computed.fontFamily || "",
    fontSize: computed.fontSize || "",
    fontWeight: computed.fontWeight || "",
    fontStyle: computed.fontStyle || "",
    lineHeight: computed.lineHeight || "",
    color: computed.color || "",
    fontSizePx,
  };
}

// Chrome centres an input's one line inside its content box. When the used
// line-height fills that box (Blueprint sets it to the field height), the line
// box is the content box: the caret is a text-high band in its middle. Any
// other input line is capped at 1.5em and centred in the content box.
function caretLine(metrics, offsetH) {
  const lineHeightPx = metrics.lineHeightPx;
  if (!metrics.singleLine) return { top: 0, height: lineHeightPx, css: metrics.lineHeight };
  const contentH = offsetH
    - metrics.borderTop - metrics.borderBottom - metrics.padTop - metrics.padBottom;
  if (offsetH && Math.abs(lineHeightPx - contentH) <= 1) {
    const height = Math.min(lineHeightPx, metrics.fontSizePx * INPUT_TEXT_EM);
    return { top: (lineHeightPx - height) / 2, height, css: `${height}px` };
  }
  const height = Math.min(lineHeightPx, metrics.fontSizePx * INPUT_LINE_EM);
  return { top: offsetH ? (contentH - height) / 2 : 0, height, css: `${height}px` };
}

function inlineProp(el, name) {
  const st = el?.style;
  if (!st) return "";
  if (typeof st.getPropertyValue === "function") {
    const value = st.getPropertyValue(name);
    if (value) return value;
  }
  const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return st[camel] || "";
}

// Inline transforms only: Plexus writes the world and the editor that way.
// No computed style, so a keystroke does not restyle the board.
function plexusScale(el) {
  const world = el?.closest?.(".pxd-world") || null;
  const editor = el?.closest?.(".pxd-item__editor") || null;
  if (!world && !editor) return { sx: 1, sy: 1, known: false };
  let sx = 1;
  let sy = 1;
  for (const node of [editor, world]) {
    const part = parseTransformScale(inlineProp(node, "transform"));
    if (!part) continue;
    sx *= part.sx;
    sy *= part.sy;
  }
  return { sx, sy, known: true };
}

// One Text node per mirror block, edited in place: only the changed tail is
// replaced, so Blink keeps the shaping in front of it.
function editableText(documentRef, element) {
  const node = typeof documentRef.createTextNode === "function" ? documentRef.createTextNode("") : null;
  const canEdit = typeof node?.replaceData === "function";
  if (canEdit) element.appendChild(node);
  let current = "";
  return (next) => {
    const prev = current;
    if (next === prev) return;
    current = next;
    if (!canEdit) {
      element.textContent = next;
      return;
    }
    let same;
    if (next.length >= prev.length && next.startsWith(prev)) same = prev.length;
    else if (prev.startsWith(next)) same = next.length;
    else {
      same = 0;
      const limit = Math.min(prev.length, next.length);
      while (same < limit && prev.charCodeAt(same) === next.charCodeAt(same)) same += 1;
    }
    node.replaceData(same, prev.length - same, next.slice(same));
  };
}

export function createCaretMeasurer({ doc, win, lifecycle } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  const subscribers = new Set();
  let cachedEl = null;
  let cachedFont = "";
  let cachedSize = null;
  let metrics = null;
  let latestRect = null;
  let markerHeight = "";
  let disposed = false;

  const mirror = documentRef.createElement("div");
  const style = mirror.style;
  style.position = "absolute";
  style.top = "0";
  style.left = "-99999px";
  style.visibility = "hidden";
  style.height = "auto";
  style.whiteSpace = "pre-wrap";
  style.overflowWrap = "break-word";
  style.contain = "layout style";
  mirror.setAttribute("aria-hidden", "true");

  // Only the caret's own paragraph is laid out per key. The text before it
  // sits in a block of its own, and Blink reuses that block's last layout
  // while its text and width are unchanged. A 10k-character block cost
  // 1.2 ms per measure when the whole prefix was rewritten.
  const beforeBlock = documentRef.createElement("div");
  const lineBlock = documentRef.createElement("div");
  const prefixNode = documentRef.createElement("span");
  const marker = documentRef.createElement("span");
  marker.style.display = "inline-block";
  marker.style.width = "0";
  marker.style.verticalAlign = "top";
  marker.textContent = MARKER_CHAR;
  const glyphEl = documentRef.createElement("span");
  // Out of flow: a width probe at the end of a full line must not wrap the marker.
  glyphEl.style.position = "absolute";
  glyphEl.style.whiteSpace = "pre";
  glyphEl.style.top = "0";
  glyphEl.style.left = "0";
  lineBlock.appendChild(prefixNode);
  lineBlock.appendChild(marker);
  lineBlock.appendChild(glyphEl);
  mirror.appendChild(beforeBlock);
  mirror.appendChild(lineBlock);
  const setBefore = editableText(documentRef, beforeBlock);
  const setLine = editableText(documentRef, prefixNode);
  // Edited in place too: a new Text node per key cost a style recalc per key.
  const setGlyph = editableText(documentRef, glyphEl);
  let lineIndent = "";

  const parent = documentRef.body || documentRef.documentElement || globalThis.document?.body;
  if (lifecycle) lifecycle.node(mirror, parent);
  else parent.append(mirror);

  const invalidate = () => {
    cachedEl = null;
    cachedFont = "";
    cachedSize = null;
    metrics = null;
  };

  const themeListeners = [];
  const bindThemeListener = (target, type, fn, options) => {
    target?.addEventListener?.(type, fn, options);
    themeListeners.push({ target, type, fn, options });
  };

  if (windowRef?.addEventListener) {
    bindThemeListener(windowRef, "resize", invalidate);
  }

  const colorSchemeMq = windowRef?.matchMedia?.("(prefers-color-scheme: dark)");
  bindThemeListener(colorSchemeMq, "change", invalidate);

  const visualViewport = windowRef.visualViewport;
  bindThemeListener(visualViewport, "resize", invalidate);

  let themeObserver = null;
  if (typeof MutationObserver === "function") {
    themeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          invalidate();
          return;
        }
      }
    });
    const observeClass = (node) => {
      if (!node) return;
      themeObserver.observe(node, { attributes: true, attributeFilter: ["class"] });
    };
    observeClass(documentRef.documentElement);
    observeClass(documentRef.body);
  }

  const notify = (rect) => {
    for (const fn of subscribers) fn(rect);
  };

  // Copy the host's used style onto the mirror. Page cards wrap with
  // overflow-wrap:anywhere; note cards use word-break. Forcing break-word
  // measured a different line than the textarea.
  const applyHostStyle = (el) => {
    const computedStyle = windowRef.getComputedStyle(el);
    const copied = MIRROR_PROPERTIES.map((name) => computedStyle[name]);
    metrics = readMetrics(computedStyle);
    MIRROR_PROPERTIES.forEach((name, index) => {
      style[name] = copied[index];
    });
    if (computedStyle.overflowWrap) style.overflowWrap = computedStyle.overflowWrap;
    if (computedStyle.wordBreak) style.wordBreak = computedStyle.wordBreak;
    metrics.singleLine = el.tagName === "INPUT";
    style.whiteSpace = metrics.singleLine ? "pre" : "pre-wrap";
    cachedEl = el;
  };

  const syncMarkerHeight = () => {
    const nextMarkerHeight = `${metrics.lineHeightPx}px`;
    if (nextMarkerHeight === markerHeight) return;
    markerHeight = nextMarkerHeight;
    marker.style.height = nextMarkerHeight;
  };

  const measure = (el) => {
    if (disposed) return null;
    if (!isTextTarget(el) || isSkippedHost(el)) return null;

    // Inline font and line-height are a style-attribute read, not a layout.
    // A counter-scaled card changes them without changing width.
    const fontStamp = `${inlineProp(el, "font-size")}|${inlineProp(el, "line-height")}`;
    if (el !== cachedEl || fontStamp !== cachedFont) {
      applyHostStyle(el);
      cachedFont = fontStamp;
      cachedSize = null;
    }

    const value = el.value ?? "";
    const start = Math.min(el.selectionStart ?? value.length, value.length);
    const glyphInfo = nextCaretGlyph(value, start);

    const split = !metrics.singleLine && start > 0 ? value.lastIndexOf("\n", start - 1) : -1;
    let linePrefix;
    if (split < 0) {
      setBefore("");
      linePrefix = value.slice(0, start);
      setLine(linePrefix);
    } else {
      const before = value.slice(0, split);
      // An empty last paragraph still takes a line in the textarea.
      setBefore(before === "" || before.endsWith("\n") ? before + MARKER_CHAR : before);
      linePrefix = value.slice(split + 1, start);
      setLine(linePrefix);
    }
    // text-indent belongs to the first line of the whole value only.
    const indent = split < 0 ? "" : "0px";
    if (indent !== lineIndent) {
      lineIndent = indent;
      lineBlock.style.textIndent = indent;
    }
    syncMarkerHeight();
    // The drawn letter is the next character. End of text still needs a
    // width, and that probe must not be painted.
    setGlyph(glyphInfo.hasGlyph ? glyphInfo.glyph : "0");

    const readGeom = () => ({
      box: el.getBoundingClientRect(),
      glyphWidth: glyphEl.offsetWidth || metrics.fontSizePx * 0.6 || 8,
      offsetH: el.offsetHeight || 0,
      offsetW: el.offsetWidth || 0,
      rawLeft: marker.offsetLeft || 0,
      rawTop: marker.offsetTop || 0,
      scrollLeft: el.scrollLeft || 0,
      scrollTop: el.scrollTop || 0,
      lineClient: Number(lineBlock.clientWidth) || 0,
      lineOrigin: Number(lineBlock.offsetLeft) || 0,
    });

    // Cache hit: one layout. A width or height change copies style again
    // and reads the mirror once more, so a resize rewraps in this frame.
    let geom = readGeom();
    // Width rewraps the mirror. Height alone (an autosize composer) does not.
    const sizeStamp = `${Math.round(geom.offsetW)}`;
    if (cachedSize != null && sizeStamp !== cachedSize) {
      applyHostStyle(el);
      cachedFont = fontStamp;
      syncMarkerHeight();
      geom = readGeom();
    }
    cachedSize = `${Math.round(geom.offsetW)}`;

    const contentRight = geom.lineClient > 0
      ? geom.lineOrigin + geom.lineClient
      : geom.offsetW - metrics.borderLeft - metrics.borderRight - metrics.padRight;
    const placed = endOfLineMarker({
      markerLeft: geom.rawLeft,
      markerTop: geom.rawTop,
      lineHeight: metrics.lineHeightPx,
      padLeft: metrics.padLeft,
      padTop: metrics.padTop,
      contentRight,
      atEndOfLine: glyphInfo.atEndOfLine,
      hasLineText: linePrefix.length > 0,
    });
    const line = caretLine(metrics, geom.offsetH);
    const ancestor = plexusScale(el);
    const rect = {
      ...projectCaretRect({
        box: geom.box,
        offsetW: geom.offsetW,
        offsetH: geom.offsetH,
        markerLeft: placed.left,
        markerTop: placed.top + line.top,
        scrollLeft: geom.scrollLeft,
        scrollTop: geom.scrollTop,
        borderLeft: metrics.borderLeft,
        borderTop: metrics.borderTop,
        padLeft: metrics.padLeft,
        padTop: metrics.padTop,
        padRight: metrics.padRight,
        padBottom: metrics.padBottom,
        glyphWidth: geom.glyphWidth,
        lineHeightPx: line.height,
        hasGlyph: glyphInfo.hasGlyph,
        glyph: glyphInfo.glyph,
        devicePixelRatio: windowRef.devicePixelRatio,
        ancestorScaleX: ancestor.sx,
        ancestorScaleY: ancestor.sy,
        ancestorKnown: ancestor.known,
      }),
      fontFamily: metrics.fontFamily,
      fontSize: metrics.fontSize,
      fontWeight: metrics.fontWeight,
      fontStyle: metrics.fontStyle,
      lineHeight: line.css,
      color: metrics.color,
      box: geom.box,
      el,
      pos: start,
    };
    latestRect = rect;
    notify(rect);
    return rect;
  };

  return {
    measure,
    latest() {
      return latestRect;
    },
    // No caret field has focus: the canvas engine stops drawing the last one.
    clear() {
      latestRect = null;
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    isSkippedHost,
    // Drop the cached style so the next measure copies the host's width again.
    invalidate,
    dispose() {
      if (disposed) return;
      disposed = true;
      subscribers.clear();
      cachedEl = null;
      metrics = null;
      latestRect = null;
      for (const { target, type, fn, options } of themeListeners) {
        try {
          target?.removeEventListener?.(type, fn, options);
        } catch {
        }
      }
      themeListeners.length = 0;
      try {
        themeObserver?.disconnect();
      } catch {
      }
      themeObserver = null;
      mirror.remove();
    },
  };
}

export function measureCaretRect(element, doc, win) {
  const measurer = createCaretMeasurer({ doc, win });
  try {
    return measurer.measure(element);
  } finally {
    measurer.dispose();
  }
}
