import { isSkippedHost } from "./caret-measure.js";
import { hexToRgba } from "./settings.js";

function isPasswordField(el) {
  if (!el) return false;
  const type = String(el.type || el.getAttribute?.("type") || "").toLowerCase();
  return type === "password";
}

const MODAL_OVERLAY_SELECTORS = ".rm-command-palette, .bp3-overlay-open";
const CARET_BOX_MARGIN_PX = 8;

function isBlockTextarea(el) {
  if (!el || el.tagName !== "TEXTAREA") return false;
  if (isPasswordField(el)) return false;
  if (el.id === "find-or-create-input") return false;
  if (isSkippedHost(el)) return false;
  const id = String(el.id || "");
  const className = String(el.className || "");
  const isRoamBlock =
    id.startsWith("block-input-") ||
    className.includes("rm-block-input") ||
    className.includes("rm-block__input");
  if (!isRoamBlock) return false;
  if (typeof el.getBoundingClientRect === "function") {
    const box = el.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return false;
  }
  return true;
}

function hasModalOverlay(doc) {
  return !!doc?.querySelector?.(MODAL_OVERLAY_SELECTORS);
}

function caretOutsideTextarea(el, rect) {
  if (!rect || typeof el?.getBoundingClientRect !== "function") return false;
  const box = el.getBoundingClientRect();
  const x = rect.x;
  const y = rect.y;
  return (
    x < box.left - CARET_BOX_MARGIN_PX ||
    x > box.right + CARET_BOX_MARGIN_PX ||
    y < box.top - CARET_BOX_MARGIN_PX ||
    y > box.bottom + CARET_BOX_MARGIN_PX
  );
}

function isDark(doc, prefersDarkMq) {
  const root = doc?.documentElement;
  const body = doc?.body;
  if (root?.classList?.contains("bp3-dark")) return true;
  if (body?.classList?.contains("bt-theme-dark")) return true;
  if (body?.classList?.contains("rm-dark-theme")) return true;
  if (body?.classList?.contains("roam-body") && body?.classList?.contains("dark")) return true;
  const prefersDark = !!prefersDarkMq?.matches;
  return prefersDark && !root?.classList?.contains("bp3-light");
}

function hasRangeSelection(el) {
  if (el?.selectionStart == null || el?.selectionEnd == null) return false;
  return el.selectionStart !== el.selectionEnd;
}

export function installLiteCaret({ doc, win, measurer, lifecycle, getSettings } = {}) {
  const documentRef = doc || globalThis.document;
  const windowRef = win || documentRef?.defaultView || globalThis;
  let settings = typeof getSettings === "function" ? getSettings() || {} : {};
  let active = null;
  let disposed = false;
  let lastEl = null;
  let lastSig = "";
  let scrollRaf = 0;

  const overlay = documentRef.createElement("div");
  overlay.className = "cs-lite-caret";
  const style = overlay.style;
  style.pointerEvents = "none";
  style.position = "fixed";
  style.top = "0";
  style.left = "0";
  style.zIndex = "40";
  style.willChange = "transform";
  style.transformOrigin = "0 0";
  style.display = "none";

  const glyph = documentRef.createElement("span");
  glyph.className = "cs-lite-glyph";
  overlay.appendChild(glyph);

  const parent = documentRef.body || documentRef.documentElement;
  if (lifecycle?.node) lifecycle.node(overlay, parent);
  else parent.append(overlay);

  const motionQuery = windowRef?.matchMedia?.("(prefers-reduced-motion: reduce)");
  const prefersDarkMq = windowRef?.matchMedia?.("(prefers-color-scheme: dark)");
  let reducedMotion = !!motionQuery?.matches;

  const computeSig = (el) => {
    if (!el) return "";
    return [el.value?.length, el.selectionStart, el.selectionEnd, el.scrollLeft, el.scrollTop].join("\0");
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
  };
  const writeStyle = (prop, value) => {
    if (styleCache[prop] === value) return;
    styleCache[prop] = value;
    style[prop] = value;
  };

  const hide = () => {
    writeStyle("display", "none");
  };

  const syncBlink = ({ ping } = {}) => {
    const shouldBlink = !!settings.blinkingEnabled && !reducedMotion;
    if (!shouldBlink) {
      overlay.classList.remove("cs-lite-blink");
      return;
    }
    if (ping && overlay.classList.contains("cs-lite-blink")) {
      // Restart the blink without a forced reflow: reset the running CSS
      // animation through WAAPI instead of reading overlay.offsetWidth.
      const animations =
        typeof overlay.getAnimations === "function" ? overlay.getAnimations() : null;
      if (animations) {
        for (const animation of animations) {
          try {
            animation.currentTime = 0;
          } catch {
          }
        }
      }
    }
    overlay.classList.add("cs-lite-blink");
  };

  const applyTransform = (rect, el) => {
    if (
      !el ||
      !isBlockTextarea(el) ||
      hasModalOverlay(documentRef) ||
      hasRangeSelection(el) ||
      !rect ||
      !rect.visible ||
      caretOutsideTextarea(el, rect)
    ) {
      hide();
      return;
    }

    const color = isDark(documentRef, prefersDarkMq)
      ? settings.colorDark || ""
      : settings.colorLight || "";
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

    writeStyle("display", "");
    writeStyle("transform", `translate(${x}px, ${y}px)`);
    writeStyle("width", `${width}px`);
    writeStyle("height", `${height}px`);
    writeStyle(
      "boxShadow",
      settings.glow
        ? `0 0 0 1px ${hexToRgba(color, 0.18)}, 0 0 8px ${hexToRgba(color, 0.3)}`
        : "",
    );

    if (settings.showChar) {
      glyph.textContent = rect.glyph || "";
      glyph.style.display = "block";
    } else {
      glyph.textContent = "";
      glyph.style.display = "none";
    }
  };

  const measureAndApply = (el, { ping } = {}) => {
    if (disposed) return;
    readSettings();
    const target = el || documentRef.activeElement;
    if (!target || !isBlockTextarea(target) || hasModalOverlay(documentRef)) {
      hide();
      return;
    }
    active = target;
    const rect = measurer.measure(target);
    applyTransform(rect, target);
    syncBlink({ ping });
  };

  const onFocusIn = (event) => {
    const target = event?.target;
    if (!target || !isBlockTextarea(target)) {
      active = null;
      lastEl = null;
      lastSig = "";
      hide();
      return;
    }
    active = target;
    measureAndApply(target, { ping: true });
    rememberTarget(target);
  };

  const onFocusOut = (event) => {
    const next = event?.relatedTarget || documentRef.activeElement;
    if (next && isBlockTextarea(next)) return;
    active = null;
    lastEl = null;
    lastSig = "";
    hide();
  };

  let composing = false;

  const onInput = (event) => {
    if (composing) return; // never measure mid-composition
    const target = event?.target || documentRef.activeElement;
    measureAndApply(target, { ping: true });
    rememberTarget(target);
  };

  const onCompositionStart = (event) => {
    const target = event?.target || documentRef.activeElement;
    if (!target || (!isBlockTextarea(target) && target !== active)) return;
    composing = true;
    hide();
  };

  const onCompositionEnd = (event) => {
    if (!composing) return;
    composing = false;
    const target = event?.target || documentRef.activeElement;
    measureAndApply(target, { ping: true });
    rememberTarget(target);
  };

  const onRefreshEvent = () => {
    if (composing) return;
    const target = documentRef.activeElement;
    const sig = computeSig(target);
    if (target === lastEl && sig === lastSig) return;
    rememberTarget(target);
    measureAndApply(target);
  };

  const remeasureScroll = () => {
    const target = documentRef.activeElement;
    measureAndApply(target);
    rememberTarget(target);
  };

  const SCROLL_OPTS = { capture: true, passive: true };
  const PASSIVE_OPTS = { passive: true };

  const onScrollOrResize = (event) => {
    if (disposed) return;
    const target = documentRef.activeElement || active;
    if (!target || !isBlockTextarea(target) || hasModalOverlay(documentRef)) return;
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
    syncBlink();
  };

  const refresh = () => {
    if (disposed) return;
    readSettings();
    const target = documentRef.activeElement;
    if (target && isBlockTextarea(target) && !hasModalOverlay(documentRef)) {
      active = target;
      const rect = measurer.measure(target);
      applyTransform(rect, target);
      syncBlink({ ping: true });
      return;
    }
    hide();
  };

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
