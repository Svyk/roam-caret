import { isSkippedHost, isTextTarget } from "./caret-measure.js";
import { hexToRgba } from "./settings.js";

function isPasswordField(el) {
  if (!el) return false;
  const type = String(el.type || el.getAttribute?.("type") || "").toLowerCase();
  return type === "password";
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
    return [el, el.value?.length, el.selectionStart, el.selectionEnd, el.scrollLeft, el.scrollTop].join("\0");
  };

  const readSettings = () => {
    if (typeof getSettings === "function") settings = getSettings() || {};
    return settings;
  };

  const hide = () => {
    overlay.style.display = "none";
  };

  const syncBlink = ({ ping } = {}) => {
    const shouldBlink = !!settings.blinkingEnabled && !reducedMotion;
    if (ping) overlay.classList.remove("cs-lite-blink");
    if (shouldBlink) {
      if (ping) void overlay.offsetWidth;
      overlay.classList.add("cs-lite-blink");
    } else {
      overlay.classList.remove("cs-lite-blink");
    }
  };

  const applyTransform = (rect, el) => {
    if (
      !el ||
      isPasswordField(el) ||
      !isTextTarget(el) ||
      isSkippedHost(el) ||
      hasRangeSelection(el) ||
      !rect ||
      !rect.visible
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
      overlay.style.borderRadius = "";
      overlay.style.border = "";
      overlay.style.background = color;
    } else if (cursorStyle === "Underline") {
      const bar = settings.underlineWidthPx || 2;
      width = rect.width;
      height = bar;
      y = rect.y + rect.height - bar;
      overlay.style.borderRadius = "";
      overlay.style.border = "";
      overlay.style.background = color;
    } else if (cursorStyle === "Beam") {
      width = settings.caretWidthPx ?? 3;
      height = Math.max(2, rect.height * 0.82);
      y = rect.y + (rect.height - height) / 2;
      x = rect.x - width / 2;
      overlay.style.borderRadius = "3px";
      overlay.style.border = "";
      overlay.style.background = color;
    } else {
      overlay.style.borderRadius = "1px";
      if (settings.boxHollow) {
        overlay.style.background = "transparent";
        overlay.style.border = `${settings.boxHollowWidth || 2}px solid ${color}`;
      } else {
        overlay.style.border = "";
        overlay.style.background = color;
      }
    }

    overlay.style.display = "";
    overlay.style.transform = `translate(${x}px, ${y}px)`;
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    overlay.style.boxShadow = settings.glow
      ? `0 0 0 1px ${hexToRgba(color, 0.18)}, 0 0 8px ${hexToRgba(color, 0.3)}`
      : "";

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
    if (!target || isPasswordField(target) || !isTextTarget(target)) {
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
    if (!target || isPasswordField(target) || !isTextTarget(target)) return;
    active = target;
    measureAndApply(target, { ping: true });
    lastSig = computeSig(target);
  };

  const onFocusOut = (event) => {
    const next = event?.relatedTarget || documentRef.activeElement;
    if (next && isTextTarget(next) && !isPasswordField(next)) return;
    active = null;
    hide();
  };

  const onInput = (event) => {
    const target = event?.target || documentRef.activeElement;
    measureAndApply(target, { ping: true });
    lastSig = computeSig(target);
  };

  const onRefreshEvent = () => {
    const target = documentRef.activeElement;
    const sig = computeSig(target);
    if (sig === lastSig) return;
    lastSig = sig;
    measureAndApply(target);
  };

  const remeasureScroll = () => {
    const target = documentRef.activeElement;
    measureAndApply(target);
    lastSig = computeSig(target);
  };

  const onScrollOrResize = () => {
    const raf = windowRef.requestAnimationFrame;
    if (typeof raf !== "function") {
      remeasureScroll();
      return;
    }
    if (scrollRaf) return;
    scrollRaf = raf(() => {
      scrollRaf = 0;
      remeasureScroll();
    });
  };

  const onMotionChange = () => {
    reducedMotion = !!motionQuery?.matches;
    syncBlink();
  };

  const refresh = () => {
    if (disposed) return;
    readSettings();
    const target = documentRef.activeElement;
    if (target && isTextTarget(target) && !isPasswordField(target)) {
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
    ["selectionchange", onRefreshEvent, false],
    ["keyup", onRefreshEvent, true],
    ["mouseup", onRefreshEvent, true],
  ];
  for (const [type, fn, capture] of docListeners) {
    documentRef.addEventListener(type, fn, capture);
  }
  windowRef.addEventListener("scroll", onScrollOrResize, true);
  windowRef.addEventListener("resize", onScrollOrResize);
  const visualViewport = windowRef.visualViewport;
  visualViewport?.addEventListener?.("scroll", onScrollOrResize);
  visualViewport?.addEventListener?.("resize", onScrollOrResize);
  motionQuery?.addEventListener?.("change", onMotionChange);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (scrollRaf) {
      windowRef.cancelAnimationFrame?.(scrollRaf);
      scrollRaf = 0;
    }
    for (const [type, fn, capture] of docListeners) {
      documentRef.removeEventListener(type, fn, capture);
    }
    windowRef.removeEventListener("scroll", onScrollOrResize, true);
    windowRef.removeEventListener("resize", onScrollOrResize);
    visualViewport?.removeEventListener?.("scroll", onScrollOrResize);
    visualViewport?.removeEventListener?.("resize", onScrollOrResize);
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
