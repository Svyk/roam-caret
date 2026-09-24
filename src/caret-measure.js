const MARKER_CHAR = "\u200b";
const INPUT_LINE_EM = 1.5;
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

  const prefixNode = documentRef.createElement("span");
  const marker = documentRef.createElement("span");
  marker.style.display = "inline-block";
  marker.style.width = "0";
  marker.style.verticalAlign = "top";
  marker.textContent = MARKER_CHAR;
  const glyphEl = documentRef.createElement("span");
  mirror.appendChild(prefixNode);
  mirror.appendChild(marker);
  mirror.appendChild(glyphEl);

  const parent = documentRef.body || documentRef.documentElement || globalThis.document?.body;
  if (lifecycle) lifecycle.node(mirror, parent);
  else parent.append(mirror);

  const invalidate = () => {
    cachedEl = null;
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

  const measure = (el) => {
    if (disposed) return null;
    if (!isTextTarget(el) || isSkippedHost(el)) return null;

    if (el !== cachedEl) {
      const computedStyle = windowRef.getComputedStyle(el);
      for (const name of MIRROR_PROPERTIES) style[name] = computedStyle[name];
      metrics = readMetrics(computedStyle);
      // A text input is one line that scrolls sideways; a textarea wraps.
      metrics.singleLine = el.tagName === "INPUT";
      style.whiteSpace = metrics.singleLine ? "pre" : "pre-wrap";
      if (metrics.singleLine) {
        // Blueprint inputs set line-height to the field height. Draw a caret
        // as tall as a block line, not as tall as the field.
        const lineHeightPx = Math.min(metrics.lineHeightPx, metrics.fontSizePx * INPUT_LINE_EM);
        metrics.lineHeightPx = lineHeightPx;
        metrics.lineHeight = `${lineHeightPx}px`;
      }
      cachedEl = el;
    }

    const value = el.value ?? "";
    const start = Math.min(el.selectionStart ?? value.length, value.length);
    const { underCaret, hasGlyph } = glyphAt(value, start);

    prefixNode.textContent = value.slice(0, start);
    const nextMarkerHeight = `${metrics.lineHeightPx}px`;
    if (nextMarkerHeight !== markerHeight) {
      markerHeight = nextMarkerHeight;
      marker.style.height = nextMarkerHeight;
    }
    glyphEl.textContent = underCaret;

    // The one forced layout per measure: every geometry read below runs
    // against the layout this call produces, with no writes in between.
    const box = el.getBoundingClientRect();
    const glyphWidth = glyphEl.offsetWidth || metrics.fontSizePx * 0.6 || 8;
    const offsetH = el.offsetHeight || 0;
    // Chrome centres an input's one line inside its content box.
    const lineTop = metrics.singleLine && offsetH
      ? (offsetH - metrics.borderTop - metrics.borderBottom - metrics.padTop - metrics.padBottom
        - metrics.lineHeightPx) / 2
      : 0;
    const rect = {
      ...projectCaretRect({
        box,
        offsetW: el.offsetWidth || 0,
        offsetH,
        markerLeft: marker.offsetLeft || 0,
        markerTop: (marker.offsetTop || 0) + lineTop,
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
      lineHeight: metrics.lineHeight,
      color: metrics.color,
      box,
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
