const MARKER_CHAR = "\u200b";
const SKIP_HOST_SELECTOR = ".rg-root, .pxd-root";

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
  return ["text", "search", "url", "tel", "email", "number"].includes(type);
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
}) {
  const scaleX = offsetW ? box.width / offsetW : 1;
  const scaleY = offsetH ? box.height / offsetH : 1;
  const x = box.left + (borderLeft + markerLeft - scrollLeft) * scaleX;
  const y = box.top + (borderTop + markerTop - scrollTop) * scaleY;
  const width = glyphWidth * scaleX;
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
  };
}

function readMetrics(computed) {
  const fontSizePx = px(computed.fontSize, 16);
  return {
    borderLeft: px(computed.borderLeftWidth),
    borderTop: px(computed.borderTopWidth),
    padLeft: px(computed.paddingLeft),
    padTop: px(computed.paddingTop),
    padRight: px(computed.paddingRight),
    padBottom: px(computed.paddingBottom),
    lineHeightPx: px(computed.lineHeight) || fontSizePx * 1.2 || 19,
    fontFamily: computed.fontFamily || "",
    fontSize: computed.fontSize || "",
    fontWeight: computed.fontWeight || "",
    fontStyle: computed.fontStyle || "",
    color: computed.color || "",
    fontSizePx,
  };
}

function glyphAt(value, start) {
  const underCaret = value[start] && value[start] !== "\n" ? value[start] : "0";
  const hasGlyph = underCaret !== "0" || value[start] === "0";
  return { underCaret, hasGlyph };
}

export function createCaretMeasurer({ doc, win, lifecycle } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  const subscribers = new Set();
  let cachedEl = null;
  let metrics = null;
  let latestRect = null;
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
  mirror.setAttribute("aria-hidden", "true");

  const parent = documentRef.body || documentRef.documentElement || globalThis.document?.body;
  if (lifecycle) lifecycle.node(mirror, parent);
  else parent.append(mirror);

  const invalidate = () => {
    cachedEl = null;
    metrics = null;
  };

  if (windowRef?.addEventListener) {
    windowRef.addEventListener("resize", invalidate);
  }

  const notify = (rect) => {
    for (const fn of subscribers) fn(rect);
  };

  const measure = (el) => {
    if (disposed) return null;
    if (!isTextTarget(el) || isSkippedHost(el)) return null;

    if (el !== cachedEl) {
      const computedStyle = windowRef.getComputedStyle(el);
      for (const name of MIRROR_PROPERTIES) style[name] = computedStyle[name];
      metrics = readMetrics(computedStyle);
      cachedEl = el;
    }

    const value = el.value ?? "";
    const start = Math.min(el.selectionStart ?? value.length, value.length);
    const { underCaret, hasGlyph } = glyphAt(value, start);

    mirror.textContent = value.slice(0, start);

    const marker = documentRef.createElement("span");
    marker.style.display = "inline-block";
    marker.style.width = "0";
    marker.style.height = `${metrics.lineHeightPx}px`;
    marker.style.verticalAlign = "top";
    marker.textContent = MARKER_CHAR;
    mirror.appendChild(marker);

    const glyphEl = documentRef.createElement("span");
    glyphEl.textContent = underCaret;
    mirror.appendChild(glyphEl);

    const box = el.getBoundingClientRect();
    const glyphWidth = glyphEl.offsetWidth || metrics.fontSizePx * 0.6 || 8;
    const rect = {
      ...projectCaretRect({
        box,
        offsetW: el.offsetWidth || 0,
        offsetH: el.offsetHeight || 0,
        markerLeft: marker.offsetLeft || 0,
        markerTop: marker.offsetTop || 0,
        scrollLeft: el.scrollLeft || 0,
        scrollTop: el.scrollTop || 0,
        borderLeft: metrics.borderLeft,
        borderTop: metrics.borderTop,
        padLeft: metrics.padLeft,
        padTop: metrics.padTop,
        padRight: metrics.padRight,
        padBottom: metrics.padBottom,
        glyphWidth,
        lineHeightPx: metrics.lineHeightPx,
        hasGlyph,
        glyph: underCaret,
      }),
      fontFamily: metrics.fontFamily,
      fontSize: metrics.fontSize,
      fontWeight: metrics.fontWeight,
      fontStyle: metrics.fontStyle,
      color: metrics.color,
      el,
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
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    isSkippedHost,
    dispose() {
      if (disposed) return;
      disposed = true;
      subscribers.clear();
      cachedEl = null;
      metrics = null;
      latestRect = null;
      if (windowRef?.removeEventListener) {
        windowRef.removeEventListener("resize", invalidate);
      }
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
