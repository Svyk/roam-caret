import { isSkippedHost } from "./caret-measure.js";
import { DEMO_Z_INDEX, needsCanvas } from "./cursor-smith.js";
import { hexToRgba } from "./settings.js";
import { isRoamDark } from "./theme.js";

function isPasswordField(el) {
  if (!el) return false;
  const type = String(el.type || el.getAttribute?.("type") || "").toLowerCase();
  return type === "password";
}

const COMMAND_PALETTE_CLASS = "rm-command-palette";
const COMMAND_PALETTE_SELECTOR = `.${COMMAND_PALETTE_CLASS}`;
const CARET_BOX_MARGIN_PX = 8;
const BASE_Z_INDEX = "40";
const DEMO_CLASS = "cs-lite-demo";

function isDemo(el) {
  return String(el?.className || "").split(/\s+/).includes("cs-demo");
}

export function isCaretHost(el) {
  if (!el || el.tagName !== "TEXTAREA") return false;
  if (isPasswordField(el)) return false;
  if (el.id === "find-or-create-input") return false;
  if (isSkippedHost(el)) return false;
  if (isDemo(el)) return true;
  const id = String(el.id || "");
  const className = String(el.className || "");
  return (
    id.startsWith("block-input-") ||
    className.includes("rm-block-input") ||
    className.includes("rm-block__input")
  );
}

// A plain Line is the browser's own caret, recoloured: no overlay, no mirror,
// no JS on the keystroke path.
export function isPlainLine(settings) {
  return !!settings
    && settings.cursorStyle === "Line"
    && !settings.glow
    && !settings.showChar
    && !settings.gradientEnabled
    && !needsCanvas(settings);
}

function opacityOf(settings) {
  const value = Number(settings?.cursorOpacity);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

function containsPalette(node) {
  if (!node || node.nodeType !== 1) return false;
  if (node.classList?.contains(COMMAND_PALETTE_CLASS)) return true;
  return !!(node.firstElementChild && node.querySelector?.(COMMAND_PALETTE_SELECTOR));
}

function caretOutsideTextarea(rect) {
  const box = rect.box;
  if (!box) return false;
  const right = box.right ?? box.left + box.width;
  const bottom = box.bottom ?? box.top + box.height;
  return (
    rect.x < box.left - CARET_BOX_MARGIN_PX ||
    rect.x > right + CARET_BOX_MARGIN_PX ||
    rect.y < box.top - CARET_BOX_MARGIN_PX ||
    rect.y > bottom + CARET_BOX_MARGIN_PX
  );
}

// Same walk as the canvas engine's resolveClipChain: every overflow ancestor
// that can clip the textarea, stopping at a fixed-position container.
function resolveClipChain(el, doc, win) {
  const chain = [];
  if (typeof win?.getComputedStyle !== "function") return chain;
  try {
    let curPos = win.getComputedStyle(el).position;
    if (curPos === "fixed") return chain;
    let node = el.parentElement;
    let guard = 0;
    while (node && node !== doc?.body && node !== doc?.documentElement && guard++ < 24) {
      const st = win.getComputedStyle(node);
      const positioned = st.position !== "static";
      const clips = st.overflowX !== "visible" || st.overflowY !== "visible";
      if (clips && (curPos !== "absolute" || positioned)) chain.push(node);
      if (positioned) {
        if (st.position === "fixed") break;
        curPos = st.position;
      }
      node = node.parentElement;
    }
  } catch {
    return [];
  }
  return chain;
}

function parseRgb(value) {
  const text = String(value || "").trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const int = Number.parseInt(hex[1], 16);
    return [int >> 16 & 255, int >> 8 & 255, int & 255];
  }
  const nums = text.match(/[\d.]+/g);
  if (!/^rgba?\(/i.test(text) || !nums || nums.length < 3) return null;
  return nums.slice(0, 3).map(Number);
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// The block's text colour or its inverse, whichever reads better on the box.
export function glyphColorOn(boxColor, textColor) {
  const box = parseRgb(boxColor);
  const text = parseRgb(textColor);
  if (!box) return textColor || "";
  if (!text) return luminance(box) > 0.179 ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
  const inverted = text.map((c) => 255 - c);
  const pick = contrast(text, box) >= contrast(inverted, box) ? text : inverted;
  return `rgb(${pick.map((c) => Math.round(c)).join(", ")})`;
}

function hasRangeSelection(el) {
  if (el?.selectionStart == null || el?.selectionEnd == null) return false;
  return el.selectionStart !== el.selectionEnd;
}

function observerClass(win) {
  const MO = win?.MutationObserver || globalThis.MutationObserver;
  return typeof MO === "function" ? MO : null;
}

export function installNativeCaret({ doc, win, getSettings } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  const painted = new Set();
  let disposed = false;

  const colorFor = () => {
    const settings = (typeof getSettings === "function" && getSettings()) || {};
    const hex = isRoamDark(documentRef) ? settings.colorDark : settings.colorLight;
    if (!hex) return "";
    const opacity = opacityOf(settings);
    return opacity < 1 ? hexToRgba(hex, opacity) : hex;
  };

  const clear = (el) => {
    painted.delete(el);
    try {
      el.style.removeProperty("caret-color");
    } catch {
    }
  };

  const paint = (el) => {
    const color = colorFor();
    if (!color) {
      clear(el);
      return;
    }
    try {
      el.style.setProperty("caret-color", color, "important");
      painted.add(el);
    } catch {
    }
  };

  const refresh = () => {
    if (disposed) return;
    const target = documentRef.activeElement;
    for (const el of [...painted]) if (el !== target) clear(el);
    if (target && isCaretHost(target)) paint(target);
  };

  const onFocusIn = (event) => {
    const target = event?.target;
    if (target && isCaretHost(target)) paint(target);
  };

  const onFocusOut = (event) => {
    const target = event?.target;
    if (target && painted.has(target)) clear(target);
  };

  documentRef.addEventListener("focusin", onFocusIn, false);
  documentRef.addEventListener("focusout", onFocusOut, false);

  let themeObserver = null;
  const MO = observerClass(windowRef);
  if (MO) {
    themeObserver = new MO(() => refresh());
    for (const node of [documentRef.documentElement, documentRef.body]) {
      if (node) themeObserver.observe(node, { attributes: true, attributeFilter: ["class"] });
    }
  }

  refresh();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    documentRef.removeEventListener("focusin", onFocusIn, false);
    documentRef.removeEventListener("focusout", onFocusOut, false);
    try {
      themeObserver?.disconnect();
    } catch {
    }
    themeObserver = null;
    for (const el of [...painted]) clear(el);
  };

  return { refresh, dispose };
}

export function installLiteCaret({ doc, win, measurer, lifecycle, getSettings, recordTiming } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  let settings = typeof getSettings === "function" ? getSettings() || {} : {};
  let active = null;
  let disposed = false;
  let lastEl = null;
  let lastSig = "";
  let scrollRaf = 0;
  let paletteOpen = !!documentRef.querySelector?.(COMMAND_PALETTE_SELECTOR);

  const perf = windowRef?.performance || globalThis.performance;
  const now = typeof perf?.now === "function" ? () => perf.now() : null;

  const overlay = documentRef.createElement("div");
  overlay.className = "cs-lite-caret";
  const style = overlay.style;
  style.pointerEvents = "none";
  style.position = "fixed";
  style.top = "0";
  style.left = "0";
  style.zIndex = BASE_Z_INDEX;
  style.willChange = "transform";
  style.transformOrigin = "0 0";
  style.display = "none";

  const glyph = documentRef.createElement("span");
  glyph.className = "cs-lite-glyph";
  glyph.style.display = "none";
  glyph.style.textAlign = "center";
  glyph.style.whiteSpace = "pre";
  overlay.appendChild(glyph);

  const parent = documentRef.body || documentRef.documentElement;
  if (lifecycle?.node) lifecycle.node(overlay, parent);
  else parent.append(overlay);

  const motionQuery = windowRef?.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reducedMotion = !!motionQuery?.matches;

  const computeSig = (el) => {
    if (!el) return "";
    return [el.value?.length, el.selectionStart, el.selectionEnd].join("\0");
  };

  const rememberTarget = (el) => {
    lastEl = el;
    lastSig = computeSig(el);
  };

  const readSettings = () => {
    if (typeof getSettings === "function") settings = getSettings() || {};
    return settings;
  };

  const styleCache = {
    display: "none",
    transform: "",
    width: "",
    height: "",
    background: "",
    border: "",
    borderRadius: "",
    boxShadow: "",
    opacity: "",
    zIndex: BASE_Z_INDEX,
  };
  const writeStyle = (prop, value) => {
    if (styleCache[prop] === value) return;
    styleCache[prop] = value;
    style[prop] = value;
  };

  const glyphCache = {
    display: "none",
    color: "",
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    fontStyle: "",
    lineHeight: "",
  };
  const writeGlyph = (prop, value) => {
    if (glyphCache[prop] === value) return;
    glyphCache[prop] = value;
    glyph.style[prop] = value;
  };
  let glyphText = "";
  let glyphColorKey = "";
  let glyphColor = "";

  const hide = () => {
    writeStyle("display", "none");
  };

  let demoLayer = false;
  const setDemoLayer = (demo) => {
    if (demo === demoLayer) return;
    demoLayer = demo;
    overlay.classList.toggle(DEMO_CLASS, demo);
    writeStyle("zIndex", demo ? String(DEMO_Z_INDEX) : BASE_Z_INDEX);
  };

  // One Animation handle for the blink. Restarting it is a currentTime write:
  // no getAnimations() style flush, no offsetWidth reflow.
  const canAnimate = typeof overlay.animate === "function";
  let blinkAnim = null;
  let blinkOn = false;
  let blinkKey = "";
  let blinkSettings = null;

  const stopBlink = () => {
    if (!blinkOn) return;
    blinkOn = false;
    try {
      blinkAnim?.cancel();
    } catch {
    }
  };

  const syncBlink = (ping) => {
    if (!canAnimate || !settings.blinkingEnabled || reducedMotion) {
      stopBlink();
      return;
    }
    if (settings !== blinkSettings || !blinkAnim) {
      blinkSettings = settings;
      const speed = Math.max(0.1, Number(settings.blinkSpeed) || 1.2);
      const duration = Math.round(2500 / speed);
      const lit = Math.min(0.9, Math.max(0.1, Number(settings.blinkOnOffBalance) || 0.5));
      const delay = Math.max(0, Number(settings.blinkDelayMs) || 0);
      const opacity = opacityOf(settings);
      const key = `${duration}|${lit}|${delay}|${opacity}`;
      if (key !== blinkKey || !blinkAnim) {
        try {
          blinkAnim?.cancel();
        } catch {
        }
        blinkKey = key;
        blinkAnim = overlay.animate(
          [
            { opacity },
            { opacity, offset: lit },
            { opacity: 0, offset: lit },
            { opacity: 0 },
          ],
          { duration, delay, iterations: Infinity },
        );
        blinkOn = true;
        return;
      }
    }
    if (!blinkOn) {
      blinkOn = true;
      blinkAnim.play();
      return;
    }
    if (ping) blinkAnim.currentTime = 0;
  };

  const restartBlink = () => {
    if (blinkOn && blinkAnim) blinkAnim.currentTime = 0;
  };

  let clipFor = null;
  let clipChain = [];
  const outsideClip = (el, rect) => {
    if (el !== clipFor) {
      clipFor = el;
      clipChain = resolveClipChain(el, documentRef, windowRef);
    }
    for (const node of clipChain) {
      if (node.isConnected === false) {
        clipFor = null;
        return false;
      }
      const b = node.getBoundingClientRect();
      if (
        rect.x < b.left - 1 ||
        rect.x > b.right + 1 ||
        rect.y < b.top - 1 ||
        rect.y + rect.height > b.bottom + 1
      ) {
        return true;
      }
    }
    return false;
  };

  const paintGlyph = (rect, cursorStyle, color, height) => {
    const show = cursorStyle === "Box" && !settings.boxHollow && !!settings.showChar && !!rect.glyph;
    if (!show) {
      writeGlyph("display", "none");
      if (glyphText) {
        glyphText = "";
        glyph.textContent = "";
      }
      return;
    }
    if (rect.glyph !== glyphText) {
      glyphText = rect.glyph;
      glyph.textContent = rect.glyph;
    }
    const colorKey = `${color}|${rect.color || ""}`;
    if (colorKey !== glyphColorKey) {
      glyphColorKey = colorKey;
      glyphColor = glyphColorOn(color, rect.color);
    }
    writeGlyph("display", "block");
    writeGlyph("color", glyphColor);
    writeGlyph("fontFamily", rect.fontFamily || "");
    writeGlyph("fontSize", rect.fontSize || "");
    writeGlyph("fontWeight", rect.fontWeight || "");
    writeGlyph("fontStyle", rect.fontStyle || "");
    writeGlyph(
      "lineHeight",
      rect.lineHeight && rect.lineHeight !== "normal" ? rect.lineHeight : `${height}px`,
    );
  };

  // Reads nothing from layout: the measurer already produced the one layout
  // (box included) and the clip rects read against it before any write here.
  const paint = (rect, el) => {
    const box = rect?.box;
    if (
      !rect ||
      !rect.visible ||
      (box && !(box.width > 0 && box.height > 0)) ||
      caretOutsideTextarea(rect) ||
      outsideClip(el, rect)
    ) {
      hide();
      return false;
    }

    const color = isRoamDark(documentRef) ? settings.colorDark || "" : settings.colorLight || "";
    const cursorStyle = settings.cursorStyle || "Box";
    let x = rect.x;
    let y = rect.y;
    let width = rect.width;
    let height = rect.height;

    if (cursorStyle === "Line") {
      width = settings.caretWidthPx ?? 2;
      height = rect.height;
      writeStyle("borderRadius", "");
      writeStyle("border", "");
      writeStyle("background", color);
    } else if (cursorStyle === "Underline") {
      const bar = settings.underlineWidthPx || 2;
      width = rect.width;
      height = bar;
      y = rect.y + rect.height - bar;
      writeStyle("borderRadius", "");
      writeStyle("border", "");
      writeStyle("background", color);
    } else if (cursorStyle === "Beam") {
      width = settings.caretWidthPx ?? 3;
      height = Math.max(2, rect.height * 0.82);
      y = rect.y + (rect.height - height) / 2;
      x = rect.x - width / 2;
      writeStyle("borderRadius", "3px");
      writeStyle("border", "");
      writeStyle("background", color);
    } else {
      writeStyle("borderRadius", "1px");
      if (settings.boxHollow) {
        writeStyle("background", "transparent");
        writeStyle("border", `${settings.boxHollowWidth || 2}px solid ${color}`);
      } else {
        writeStyle("border", "");
        writeStyle("background", color);
      }
    }

    const opacity = opacityOf(settings);
    writeStyle("display", "");
    writeStyle("transform", `translate(${x}px, ${y}px)`);
    writeStyle("width", `${width}px`);
    writeStyle("height", `${height}px`);
    writeStyle("opacity", opacity < 1 ? String(opacity) : "");
    writeStyle(
      "boxShadow",
      settings.glow
        ? `0 0 0 1px ${hexToRgba(color, 0.18)}, 0 0 8px ${hexToRgba(color, 0.3)}`
        : "",
    );
    setDemoLayer(isDemo(el));
    paintGlyph(rect, cursorStyle, color, height);
    return true;
  };

  let composing = false;

  const measureAndApply = (el, ping) => {
    if (disposed) return;
    const t0 = recordTiming && now ? now() : null;
    readSettings();
    const target = el || documentRef.activeElement;
    if (!target || !isCaretHost(target) || paletteOpen || hasRangeSelection(target)) {
      hide();
      rememberTarget(target);
      return;
    }
    active = target;
    const rect = measurer.measure(target);
    if (paint(rect, target)) syncBlink(ping);
    rememberTarget(target);
    if (t0 != null) recordTiming(now() - t0);
  };

  const onFocusIn = (event) => {
    const target = event?.target;
    if (!target || !isCaretHost(target)) {
      active = null;
      lastEl = null;
      lastSig = "";
      hide();
      return;
    }
    measureAndApply(target, true);
  };

  const onFocusOut = (event) => {
    const next = event?.relatedTarget || documentRef.activeElement;
    if (next && isCaretHost(next)) return;
    active = null;
    lastEl = null;
    lastSig = "";
    hide();
  };

  const onInput = (event) => {
    if (composing) return; // never measure mid-composition
    measureAndApply(event?.target || documentRef.activeElement, true);
  };

  const onCompositionStart = (event) => {
    const target = event?.target || documentRef.activeElement;
    if (!target || (!isCaretHost(target) && target !== active)) return;
    composing = true;
    hide();
  };

  const onCompositionEnd = (event) => {
    if (!composing) return;
    composing = false;
    measureAndApply(event?.target || documentRef.activeElement, true);
  };

  // selectionchange / keyup / mouseup. A moved caret (arrow keys, click)
  // remeasures and restarts the blink; an unmoved click only restarts it.
  const onRefreshEvent = (event) => {
    if (composing) return;
    const target = documentRef.activeElement;
    if (target === lastEl && computeSig(target) === lastSig) {
      if (event?.type === "mouseup" && target === active) restartBlink();
      return;
    }
    measureAndApply(target, true);
  };

  const remeasureScroll = () => {
    measureAndApply(documentRef.activeElement, false);
  };

  const SCROLL_OPTS = { capture: true, passive: true };
  const PASSIVE_OPTS = { passive: true };

  const onScrollOrResize = (event) => {
    if (disposed || paletteOpen) return;
    const target = documentRef.activeElement || active;
    if (!target || !isCaretHost(target)) return;
    // Only remeasure when the scrolled surface can move the caret: window,
    // document, visualViewport, or an ancestor of the active textarea.
    // Sidebar / autocomplete / unrelated overflow scrolls are ignored.
    const source = event?.target;
    if (
      source &&
      typeof source === "object" &&
      typeof source.nodeType === "number" &&
      source !== documentRef
    ) {
      const contains =
        typeof source.contains === "function" ? source.contains(target) : source === target;
      if (!contains) return;
    }
    if (typeof windowRef.requestAnimationFrame !== "function") {
      remeasureScroll();
      return;
    }
    if (scrollRaf) return;
    scrollRaf = windowRef.requestAnimationFrame(() => {
      scrollRaf = 0;
      remeasureScroll();
    });
  };

  const onWindowBlur = () => {
    readSettings();
    if (settings.hideOnWindowBlur === false) return;
    hide();
  };

  const onWindowFocus = () => {
    refresh();
  };

  const onMotionChange = () => {
    reducedMotion = !!motionQuery?.matches;
    syncBlink(true);
  };

  const refresh = () => {
    measureAndApply(documentRef.activeElement, true);
  };

  // The palette flag flips only when a node carrying the palette class is
  // added or removed, so the keystroke path reads a boolean, not the DOM.
  let paletteObserver = null;
  const MO = observerClass(windowRef);
  if (MO && documentRef.body) {
    paletteObserver = new MO((records) => {
      let changed = false;
      for (const record of records) {
        for (const node of record.removedNodes || []) {
          if (containsPalette(node)) {
            paletteOpen = false;
            changed = true;
          }
        }
        for (const node of record.addedNodes || []) {
          if (containsPalette(node)) {
            paletteOpen = true;
            changed = true;
          }
        }
      }
      if (!changed || disposed) return;
      if (paletteOpen) {
        hide();
        return;
      }
      const target = documentRef.activeElement;
      if (!composing && target && isCaretHost(target)) measureAndApply(target, true);
    });
    paletteObserver.observe(documentRef.body, { childList: true, subtree: true });
  }

  const docListeners = [
    ["focusin", onFocusIn, false],
    ["focusout", onFocusOut, false],
    ["input", onInput, true],
    ["compositionstart", onCompositionStart, true],
    ["compositionend", onCompositionEnd, true],
    ["selectionchange", onRefreshEvent, false],
    ["keyup", onRefreshEvent, true],
    ["mouseup", onRefreshEvent, true],
  ];
  for (const [type, fn, capture] of docListeners) {
    documentRef.addEventListener(type, fn, capture);
  }
  windowRef.addEventListener("scroll", onScrollOrResize, SCROLL_OPTS);
  windowRef.addEventListener("resize", onScrollOrResize, PASSIVE_OPTS);
  windowRef.addEventListener("blur", onWindowBlur, PASSIVE_OPTS);
  windowRef.addEventListener("focus", onWindowFocus, PASSIVE_OPTS);
  const visualViewport = windowRef.visualViewport;
  visualViewport?.addEventListener?.("scroll", onScrollOrResize, PASSIVE_OPTS);
  visualViewport?.addEventListener?.("resize", onScrollOrResize, PASSIVE_OPTS);
  motionQuery?.addEventListener?.("change", onMotionChange);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    composing = false;
    if (scrollRaf) {
      windowRef.cancelAnimationFrame?.(scrollRaf);
      scrollRaf = 0;
    }
    try {
      paletteObserver?.disconnect();
    } catch {
    }
    paletteObserver = null;
    try {
      blinkAnim?.cancel();
    } catch {
    }
    blinkAnim = null;
    for (const [type, fn, capture] of docListeners) {
      documentRef.removeEventListener(type, fn, capture);
    }
    windowRef.removeEventListener("scroll", onScrollOrResize, SCROLL_OPTS);
    windowRef.removeEventListener("resize", onScrollOrResize, PASSIVE_OPTS);
    windowRef.removeEventListener("blur", onWindowBlur, PASSIVE_OPTS);
    windowRef.removeEventListener("focus", onWindowFocus, PASSIVE_OPTS);
    visualViewport?.removeEventListener?.("scroll", onScrollOrResize, PASSIVE_OPTS);
    visualViewport?.removeEventListener?.("resize", onScrollOrResize, PASSIVE_OPTS);
    motionQuery?.removeEventListener?.("change", onMotionChange);
    overlay.remove();
    active = null;
  };

  return {
    refresh,
    dispose,
    get overlay() {
      return overlay;
    },
    get active() {
      return active;
    },
  };
}
