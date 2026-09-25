import { createLifecycle } from "./lifecycle.js";
import { openRoamCaretSettings } from "./open-settings.js";
import {
  MIRROR,
  SAVED_STYLES_ID,
  SAVED_STYLES_PROMPT,
  STYLE_NAME_ID,
  buildDepotPanel,
  loadOptions,
  mirrorToDepot,
  persistOptions,
} from "./settings.js";
import { createCaretMeasurer } from "./caret-measure.js";
import { installLiteCaret, installNativeCaret, isPlainLine } from "./caret-lite.js";
import {
  BODY_ACTIVE_CLASS,
  BODY_HIDE_NATIVE_CLASS,
  BUILTIN_PRESETS,
  DEFAULTS,
  MAX_PRESETS,
  codeToPreset,
  needsCanvas,
  normalizePresetSnapshot,
  normalizeSettings,
  pickLook,
  presetToCode,
  randomizeLook,
} from "./cursor-smith.js";
import { renderStudio, STUDIO_CSS } from "./studio.js";

export const VERSION = "0.6.2";
const CANVAS_Z_INDEX = 40; // PROVISIONAL
const VERSION_FLAG = "__ROAM_CURSOR_SMITH_VERSION";
const DIAG_FLAG = "__ROAM_CARET_DIAG";
const DIAG_RING = 20;
const HEX6 = /^#[0-9a-fA-F]{6}$/;
const MAX_PRESET_NAME = 48;

let activeLifecycle = null;
let runtime = null;
let engineModule = null;
let engineLoadPromise = null;

async function loadCursorEngine() {
  if (engineModule) return engineModule;
  if (!engineLoadPromise) {
    engineLoadPromise = import("./cursor-engine.js")
      .then((mod) => {
        engineModule = mod;
        return mod;
      })
      .catch((err) => {
        console.error("[roam-caret] failed to load canvas engine:", err);
        engineLoadPromise = null;
        return null;
      });
  }
  return engineLoadPromise;
}

function isMobileHost(extensionAPI) {
  try {
    if (globalThis.roamAlphaAPI?.platform?.isMobile) return true;
  } catch {
  }
  try {
    if (extensionAPI?.platform?.isMobile) return true;
  } catch {
  }
  return false;
}

function canStartLite() {
  return typeof document !== "undefined"
    && !!document.body
    && typeof document.createElement === "function";
}

function canStartEngine() {
  return canStartLite()
    && typeof requestAnimationFrame === "function";
}

function lookKey(snap) {
  return JSON.stringify(pickLook(snap));
}

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

// "Custom" is the Look menu's own entry, "Current" was the old share name,
// and a built-in name always loads the built-in look.
function isReservedName(name) {
  return name === "Custom" || name === "Current" || hasOwn(BUILTIN_PRESETS, name);
}

// A share code keeps its name unless that name already means a different
// look here; then it gets the first free "Name 2", "Name 3", ...
export function uniquePresetName(name, snap, presets = {}) {
  const key = lookKey(snap);
  const free = (candidate) => {
    if (candidate === "Custom" || hasOwn(BUILTIN_PRESETS, candidate)) return false;
    return !hasOwn(presets, candidate) || lookKey(presets[candidate]) === key;
  };
  const base = String(name || "").trim().slice(0, MAX_PRESET_NAME) || "Imported preset";
  if (free(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const suffix = ` ${i}`;
    const candidate = `${base.slice(0, MAX_PRESET_NAME - suffix.length).trimEnd()}${suffix}`;
    if (free(candidate)) return candidate;
  }
  return base;
}

function copyToClipboard(text) {
  try {
    const clip = globalThis.navigator?.clipboard;
    if (clip && typeof clip.writeText === "function") {
      void clip.writeText(text);
      return;
    }
  } catch {
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  } catch {
  }
}

class CursorSmithRuntime {
  constructor({ extensionAPI, lifecycle, mobile }) {
    this.extensionAPI = extensionAPI;
    this.lifecycle = lifecycle;
    this.mobile = mobile;
    this._settings = normalizeSettings(loadOptions(extensionAPI) ?? {});
    this._engine = null;
    this._lite = null;
    this._native = null;
    this._measurer = null;
    this._diag = null;
    this._mode = null;
    this._pumpInstalled = false;
    this._pumpListeners = [];
    this._measureCount = 0;
    this._overlay = null;
    this._panelEl = null;
    this._panelStyle = null;
    this._toastEl = null;
    this._fatalNotice = false;
    this._depotPanelReady = false;
    this._suspended = false;
    this._escapeBound = false;
    this._onEscapeKey = (ev) => this.onEscape(ev);
    this.pendingPresetName = "";
    this.lifecycle.add(() => this.teardown());
  }

  teardown() {
    this.closeSettings();
    this._unbindStudioKeys();
    this._removePanelStyle();
    this.stopLite();
    this.stopNative();
    this.stopEngine();
    this.stopMeasurer();
    this.clearDiag();
    this.clearBodyClasses();
    try {
      delete globalThis[VERSION_FLAG];
    } catch {
      try {
        globalThis[VERSION_FLAG] = undefined;
      } catch {
      }
    }
  }

  clearBodyClasses() {
    try {
      document.body?.classList?.remove(BODY_ACTIVE_CLASS, BODY_HIDE_NATIVE_CLASS);
    } catch {
    }
  }

  applyBodyClasses() {
    const live = (!!this._engine || !!this._lite || !!this._native)
      && !!this._settings.enabled && !this.mobile;
    try {
      document.body?.classList?.toggle(BODY_ACTIVE_CLASS, live);
      document.body?.classList?.toggle(
        BODY_HIDE_NATIVE_CLASS,
        live && !!this._settings.hideNativeCaret && !this._native,
      );
    } catch {
    }
  }

  ensureDiag() {
    if (this._diag) return this._diag;
    const runtime = this;
    this._diag = {
      measureCount: 0,
      measures: [],
      // Bench kill switch: detaches every listener, observer, frame and the
      // blink, and hides the caret. Nothing is persisted or written.
      suspend: () => runtime.suspend(),
      resume: () => runtime.resume(),
      get suspended() {
        return runtime._suspended;
      },
    };
    try {
      ((typeof document !== "undefined" && document.defaultView) || globalThis)[DIAG_FLAG] = this._diag;
    } catch {
    }
    return this._diag;
  }

  // Milliseconds for one whole caret update: measure plus every style write.
  recordTiming(ms) {
    const diag = this.ensureDiag();
    diag.measures.push(ms);
    if (diag.measures.length > DIAG_RING) diag.measures.shift();
  }

  clearDiag() {
    this._diag = null;
    try {
      const win = (typeof document !== "undefined" && document.defaultView) || globalThis;
      delete win[DIAG_FLAG];
    } catch {
    }
  }

  ensureMeasurer() {
    if (this._measurer || typeof document === "undefined") return;
    try {
      this._measurer = createCaretMeasurer({
        doc: document,
        win: document.defaultView || globalThis,
        lifecycle: this.lifecycle,
      });
      const inner = this._measurer.measure.bind(this._measurer);
      const diag = this.ensureDiag();
      this._measurer.measure = (el) => {
        this._measureCount += 1;
        diag.measureCount += 1;
        return inner(el);
      };
    } catch (err) {
      console.error("[roam-caret] measurer failed to start:", err);
      this._measurer = null;
    }
  }

  stopMeasurer() {
    try {
      this._measurer?.dispose();
    } catch {
    }
    this._measurer = null;
  }

  _bindPumpListener(target, type, fn, capture) {
    target.addEventListener(type, fn, capture);
    this._pumpListeners.push({ target, type, fn, capture: !!capture });
  }

  ensurePump() {
    if (this._pumpInstalled || typeof document === "undefined") return;
    const now = globalThis.performance?.now?.bind(globalThis.performance);
    const pump = () => {
      try {
        const el = document.activeElement;
        if (!this._measurer || !el) return;
        const start = now ? now() : null;
        this._measurer.measure(el);
        if (start != null) this.recordTiming(now() - start);
      } catch {
      }
    };
    this._pumpInstalled = true;
    this._bindPumpListener(document, "focusin", pump, true);
    this._bindPumpListener(document, "input", pump, true);
    this._bindPumpListener(document, "selectionchange", pump, false);
    this._bindPumpListener(document, "keyup", pump, true);
    const win = document.defaultView || globalThis;
    if (typeof win?.addEventListener === "function") {
      this._bindPumpListener(win, "scroll", pump, true);
      this._bindPumpListener(win, "resize", pump, false);
    }
  }

  stopPump() {
    if (!this._pumpInstalled) return;
    for (const { target, type, fn, capture } of this._pumpListeners) {
      try {
        target.removeEventListener(type, fn, capture);
      } catch {
      }
    }
    this._pumpListeners = [];
    this._pumpInstalled = false;
  }

  startLite() {
    if (this.mobile || !this._settings.enabled || this._lite || !canStartLite()) return;
    this.ensureMeasurer();
    if (!this._measurer) return;
    try {
      this._lite = installLiteCaret({
        doc: document,
        win: document.defaultView || globalThis,
        measurer: this._measurer,
        lifecycle: this.lifecycle,
        getSettings: () => this._settings,
        recordTiming: (ms) => this.recordTiming(ms),
      });
      this._lite.refresh();
      this.applyBodyClasses();
    } catch (err) {
      console.error("[roam-caret] lite caret failed to start:", err);
      this.stopLite();
    }
  }

  stopLite() {
    if (!this._lite) {
      this.applyBodyClasses();
      return;
    }
    try {
      this._lite.dispose();
    } catch {
    }
    this._lite = null;
    this.applyBodyClasses();
  }

  startNative() {
    if (this.mobile || !this._settings.enabled || this._native || !canStartLite()) return;
    try {
      this._native = installNativeCaret({
        doc: document,
        win: document.defaultView || globalThis,
        getSettings: () => this._settings,
      });
    } catch (err) {
      console.error("[roam-caret] native caret failed to start:", err);
      this._native = null;
    }
    this.applyBodyClasses();
  }

  stopNative() {
    if (this._native) {
      try {
        this._native.dispose();
      } catch {
      }
      this._native = null;
    }
    this.applyBodyClasses();
  }

  async startEngine() {
    if (this.mobile || !this._settings.enabled || this._engine || !canStartEngine()) return !!this._engine;
    if (!needsCanvas(this._settings)) return false;
    const ticket = (this._engineTicket = (this._engineTicket || 0) + 1);
    this.ensureMeasurer();
    this.ensurePump();
    try {
      const mod = await loadCursorEngine();
      if (ticket !== this._engineTicket || !needsCanvas(this._settings) || this._engine) return false;
      if (!mod?.CursorEngine) return false;
      this._engine = new mod.CursorEngine({
        settings: this._settings,
        doc: document,
        zIndex: CANVAS_Z_INDEX,
        measurer: this._measurer,
        onFatal: (err) => this.engineFailed(err),
      });
      this._engine.start();
      this.applyBodyClasses();
      return true;
    } catch (err) {
      console.error("[roam-caret] engine failed to start:", err);
      this.stopEngine();
      return false;
    }
  }

  stopEngine() {
    this._engineTicket = (this._engineTicket || 0) + 1;
    if (this._engine) {
      try {
        this._engine.stop();
      } catch {
      }
      this._engine = null;
    }
    this.stopPump();
    this.applyBodyClasses();
  }

  engineFailed(err) {
    console.error("[roam-caret] engine stopped after repeated frame errors:", err);
    this.stopEngine();
    this.clearBodyClasses();
    if (this._fatalNotice) return;
    this._fatalNotice = true;
    const palette = this.extensionAPI?.ui?.commandPalette;
    if (palette) {
      void this.lifecycle.command(palette, {
        label: "Roam Caret: engine stopped (see console)",
        callback: () => this.openSettings(),
      }).catch((error) => console.error(error));
    }
  }

  suspend() {
    if (this._suspended) return false;
    this._suspended = true;
    this.stopLite();
    this.stopNative();
    this.stopEngine();
    this.stopMeasurer();
    this._unbindStudioKeys();
    this.applyBodyClasses();
    return true;
  }

  resume() {
    if (!this._suspended) return false;
    this._suspended = false;
    if (this._overlay?.isConnected) this._bindStudioKeys();
    this.applySettings();
    return true;
  }

  applySettings() {
    if (this._suspended) return;
    if (this.mobile || !this._settings.enabled) {
      this.stopLite();
      this.stopNative();
      this.stopEngine();
      this._mode = "off";
      return;
    }
    let nextMode = "lite";
    if (needsCanvas(this._settings)) nextMode = "canvas";
    else if (isPlainLine(this._settings)) nextMode = "native";
    const wasCanvas = this._mode === "canvas";
    if (this._mode && this._mode !== "off" && wasCanvas !== (nextMode === "canvas")) {
      this.toast(nextMode === "canvas" ? "Canvas mode: effects on" : "Lite mode");
    }
    this._mode = nextMode;
    if (nextMode === "canvas") {
      this.stopLite();
      this.stopNative();
      if (!this._engine) {
        this._engineStart = this.startEngine().then((ok) => {
          if (!ok && needsCanvas(this._settings) && !this._engine) {
            this._mode = "lite";
            this.startLite();
          }
          this.applyBodyClasses();
          return ok;
        });
      } else {
        this._engine.setSettings(this._settings);
      }
    } else if (nextMode === "native") {
      this.stopEngine();
      this.stopLite();
      this.stopMeasurer();
      if (!this._native) this.startNative();
      else this._native.refresh();
    } else {
      this.stopEngine();
      this.stopNative();
      if (!this._lite) this.startLite();
      else this._lite.refresh();
    }
    this.applyBodyClasses();
  }

  _depotIdsForPatch(patch) {
    const ids = [];
    for (const [depotId, blobKey] of Object.entries(MIRROR)) {
      if (Object.prototype.hasOwnProperty.call(patch, blobKey)) ids.push(depotId);
    }
    return ids;
  }

  depotPanelConfig() {
    return buildDepotPanel({
      settings: this._settings,
      builtinNames: Object.keys(BUILTIN_PRESETS),
      userNames: Object.keys(this._settings.presets || {}),
      React: globalThis.window?.React || globalThis.React,
      handlers: {
        onChange: (id, raw) => this.setFromDepot(id, raw),
        onSaveStyle: () => this.saveStyle(),
        onCopyCode: () => this.copyShareCode(),
        onImport: () => this.importShareCode(),
        onStudio: () => this.openSettings(),
      },
    });
  }

  async rebuildPanel() {
    await mirrorToDepot(this.extensionAPI, this._settings);
    if (!this._depotPanelReady) return;
    await this.lifecycle.settingsPanel(this.extensionAPI, this.depotPanelConfig());
  }

  async setFromDepot(id, raw) {
    if (id === "cs-import-code") {
      await this.extensionAPI.settings.set("cs-import-code", raw);
      return;
    }
    // Typing a name stores it and nothing else: a rebuild would drop focus.
    if (id === STYLE_NAME_ID) {
      await this.extensionAPI.settings.set(STYLE_NAME_ID, String(raw ?? ""));
      return;
    }
    if (id === SAVED_STYLES_ID) {
      const name = String(raw ?? "");
      await this.extensionAPI.settings.set(SAVED_STYLES_ID, SAVED_STYLES_PROMPT);
      const snap = hasOwn(this._settings.presets, name) ? this._settings.presets[name] : null;
      if (snap) this._set({ ...pickLook(snap), activePreset: name });
      return;
    }
    if (!(id in MIRROR)) return;

    const blobKey = MIRROR[id];

    if (id === "cs-preset") {
      if (raw === "Custom") {
        this._set({ activePreset: "" });
      } else {
        const snap = BUILTIN_PRESETS[raw] ?? this._settings.presets?.[raw];
        if (snap) this._set({ ...pickLook(snap), activePreset: raw });
      }
      return;
    }

    if (id === "cs-color-light" || id === "cs-color-dark") {
      raw = String(raw ?? "").trim();
      if (!HEX6.test(raw)) return;
    }

    const patch = id === "cs-width" ? { [blobKey]: Number(raw) } : { [blobKey]: raw };
    this._set(patch);
    await mirrorToDepot(this.extensionAPI, this._settings, [id]);
  }

  styleName() {
    return String(this.extensionAPI.settings.get(STYLE_NAME_ID) ?? "").trim().slice(0, MAX_PRESET_NAME);
  }

  _setStyleName(name) {
    if (this.extensionAPI.settings.get(STYLE_NAME_ID) === name) return null;
    return this.extensionAPI.settings.set(STYLE_NAME_ID, name);
  }

  // A named look shares its name; a Custom look shares Style name, else its shape.
  shareName() {
    if (this._settings.activePreset) return this._settings.activePreset;
    const typed = this.styleName();
    if (typed && typed !== "Custom" && typed !== "Current") return typed;
    return this._settings.cursorStyle || "Box";
  }

  // Saves the current look under Style name (empty: the shape). An existing
  // saved style of that name is overwritten; built-in names are refused.
  async saveStyle() {
    const name = this.styleName() || this._settings.cursorStyle || "Box";
    if (isReservedName(name)) {
      this.toast(`"${name}" is already a Roam Caret look. Pick another style name.`);
      return null;
    }
    const presets = this._settings.presets || {};
    if (!hasOwn(presets, name) && Object.keys(presets).length >= MAX_PRESETS) {
      this.toast(`Roam Caret keeps ${MAX_PRESETS} saved styles. Save over an existing name.`);
      return null;
    }
    await this._setStyleName(name);
    this._set({ activePreset: name, presets: { ...presets, [name]: pickLook(this._settings) } });
    this.toast(`Saved "${name}".`);
    return name;
  }

  copyShareCode() {
    const code = presetToCode(this.shareName(), pickLook(this._settings));
    copyToClipboard(code);
    this.toast("Share code copied.");
    return code;
  }

  async importShareCode() {
    const code = this.extensionAPI.settings.get("cs-import-code");
    const decoded = codeToPreset(code);
    if (!decoded) {
      this.toast("Could not import that code");
      return;
    }
    const { snap } = decoded;
    const builtin = BUILTIN_PRESETS[decoded.name];
    if (builtin && lookKey(builtin) === lookKey(snap)) {
      await this._setStyleName(decoded.name);
      this._set({ ...snap, activePreset: decoded.name });
    } else {
      const name = uniquePresetName(decoded.name, snap, this._settings.presets);
      const presets = { ...(this._settings.presets || {}), [name]: snap };
      await this._setStyleName(name);
      this._set({ ...snap, activePreset: name, presets });
    }
    await this.extensionAPI.settings.set("cs-import-code", "");
    this.toast(`Imported "${this._settings.activePreset}".`);
  }

  _matchesActivePreset(settings) {
    const name = settings.activePreset;
    const snap = BUILTIN_PRESETS[name] ?? settings.presets?.[name];
    return !!snap && lookKey(snap) === lookKey(settings);
  }

  _set(patch) {
    this._settings = normalizeSettings({ ...this._settings, ...patch });
    const depotIds = this._depotIdsForPatch(patch);
    // Editing the look by hand turns a named preset into Custom.
    if (
      this._settings.activePreset
      && !hasOwn(patch, "activePreset")
      && !this._matchesActivePreset(this._settings)
    ) {
      this._settings.activePreset = "";
      if (!depotIds.includes("cs-preset")) depotIds.push("cs-preset");
    }
    // Picking a named look puts its name in Style name, so Save updates it.
    if (hasOwn(patch, "activePreset") && this._settings.activePreset) {
      void this._setStyleName(this._settings.activePreset);
    }
    void persistOptions(this.extensionAPI, this._settings);
    this.applySettings();
    if (depotIds.length) void mirrorToDepot(this.extensionAPI, this._settings, depotIds);
    if (this._depotPanelReady) void this.rebuildPanel();
  }

  _setLive(patch) {
    this._settings = { ...this._settings, ...patch };
    this.applySettings();
  }

  toast(message) {
    console.info("[roam-caret]", message);
    if (this._toastEl) this._toastEl.textContent = message;
  }

  _injectPanelStyle() {
    if (this._panelStyle?.isConnected) return;
    if (typeof document === "undefined" || !document.createElement) return;
    if (!this._panelStyle) {
      const style = document.createElement("style");
      style.setAttribute("data-cursor-smith", "studio");
      style.textContent = STUDIO_CSS;
      this._panelStyle = style;
    }
    try {
      (document.head || document.body).append(this._panelStyle);
    } catch {
    }
  }

  _removePanelStyle() {
    try {
      if (this._panelStyle?.isConnected) this._panelStyle.remove();
    } catch {
    }
    this._panelStyle = null;
  }

  openSettings() {
    if (this._overlay?.isConnected) return;
    if (typeof document === "undefined" || !document.body || !document.createElement) return;
    this._injectPanelStyle();
    const overlay = document.createElement("div");
    overlay.className = "cs-studio-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Roam Caret studio");
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) this.closeSettings();
    });
    const panelRoot = document.createElement("div");
    panelRoot.className = "cs-studio";
    const toastEl = document.createElement("div");
    toastEl.className = "cs-toast";
    overlay.append(panelRoot, toastEl);
    document.body.append(overlay);
    document.body.classList.add("cs-studio-open");
    if (this._lite?.overlay) this._lite.overlay.style.display = "none";
    this._overlay = overlay;
    this._panelEl = panelRoot;
    this._toastEl = toastEl;
    if (!this._suspended) this._bindStudioKeys();
    this.renderPanel();
  }

  // Escape and the preview key shield are bound only while the Studio is
  // open: no keydown listener on the typing path.
  _bindStudioKeys() {
    if (this._escapeBound || typeof document === "undefined") return;
    document.addEventListener("keydown", this._onEscapeKey, true);
    this._escapeBound = true;
  }

  _unbindStudioKeys() {
    if (!this._escapeBound) return;
    this._escapeBound = false;
    try {
      document.removeEventListener("keydown", this._onEscapeKey, true);
    } catch {
    }
  }

  closeSettings() {
    try { document.body?.classList?.remove("cs-studio-open"); } catch { /* already gone */ }
    this._unbindStudioKeys();
    try {
      this._overlay?.remove();
    } catch {
    }
    this._overlay = null;
    this._panelEl = null;
    this._toastEl = null;
    this._removePanelStyle();
  }

  onEscape(ev) {
    if (ev.key === "Escape" && this._overlay?.isConnected) {
      ev.stopPropagation();
      this.closeSettings();
    }
  }

  renderPanel() {
    if (!this._panelEl) return;
    const plugin = this;
    try {
      renderStudio(this._panelEl, {
        version: VERSION,
        conf: {
          repository: "https://github.com/Svyk/roam-caret",
        },
        settings: this._settings,
        disabled: !this._settings.enabled,
        set: (patch) => this._set(patch),
        setLive: (patch) => this._setLive(patch),
        rerender: () => this.renderPanel(),
        randomize: () => this.randomize(),
        resetLook: () => this.resetLook(),
        toggleDisabled: (nextOn) => {
          this._set({ enabled: !!nextOn });
          this.renderPanel();
        },
        toast: (msg) => this.toast(msg),
        copyToClipboard,
        get pendingPresetName() {
          return plugin.pendingPresetName;
        },
        set pendingPresetName(v) {
          plugin.pendingPresetName = v;
        },
      });
    } catch (err) {
      console.error("[roam-caret] settings panel failed:", err);
    }
  }

  randomize() {
    this._set({ ...randomizeLook(), activePreset: "" });
    this.renderPanel();
    this.toast("Rolled a new look.");
  }

  resetLook() {
    this._set({ ...normalizePresetSnapshot(DEFAULTS), activePreset: "" });
    this.renderPanel();
    this.toast("Reset to defaults.");
  }

  toggleEnabled() {
    const next = !this._settings.enabled;
    this._set({ enabled: next });
    this.renderPanel();
    this.toast(next ? "Roam Caret on." : "Roam Caret off.");
  }

  cyclePreset() {
    const presets = this._settings.presets || {};
    const names = Object.keys(presets);
    if (!names.length) {
      this.toast("No presets saved yet.");
      return;
    }
    const idx = names.indexOf(this._settings.activePreset);
    const next = names[(idx + 1) % names.length];
    this._set({ ...pickLook(presets[next]), activePreset: next });
    this.renderPanel();
    this.toast(`Preset: ${next}`);
  }

  diagnoseCaret(ms = 5000) {
    this._measureCount = 0;
    const describe = (el2) => {
      if (!el2 || typeof el2.getBoundingClientRect !== "function") return null;
      const r = el2.getBoundingClientRect();
      let cs = {};
      try {
        cs = getComputedStyle(el2);
      } catch {
      }
      return {
        tag: el2.tagName,
        cls: el2.className,
        id: el2.id,
        rect: {
          x: Math.round(r.left),
          y: Math.round(r.top),
          w: Math.round(r.width),
          h: Math.round(r.height),
        },
        css: {
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
        },
      };
    };
    const log = [];
    const sample = (reason) => {
      const active = document.activeElement;
      const textarea = active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")
        ? active
        : null;
      log.push({
        reason,
        t: Math.round(performance.now()),
        measureCount: this._measureCount,
        active: active ? describe(active) : null,
        textarea: textarea ? {
          id: textarea.id,
          cls: textarea.className,
          selectionStart: textarea.selectionStart,
          selectionEnd: textarea.selectionEnd,
        } : null,
        mode: this._mode,
        parked: this._engine ? !!this._engine._parked : null,
        latest: this._measurer?.latest?.() || null,
        engine: this._engine ? {
          gear: this._engine._canvasGear,
          source: this._engine._caretSource,
          hasCaret: !!this._engine.lastActive,
        } : null,
      });
    };
    sample("start");
    const mo = typeof MutationObserver === "function"
      ? new MutationObserver(() => {
        if (log.length < 60) sample("mutation");
      })
      : null;
    try {
      mo?.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
        childList: true,
      });
    } catch {
    }
    const onKey = () => {
      if (log.length < 60) sample("keydown");
    };
    window.addEventListener("keydown", onKey, true);
    this.toast(`Diagnosing for ${ms / 1000}s — click into a block and type.`);
    this.lifecycle.timeout(() => {
      try {
        mo?.disconnect();
      } catch {
      }
      window.removeEventListener("keydown", onKey, true);
      sample("end");
      const text = JSON.stringify(log, null, 2);
      console.log("[roam-caret] caret diagnostic\n" + text);
      copyToClipboard(text);
      this.toast(`Caret diagnostic: ${log.length} samples, copied to clipboard.`);
    }, ms);
  }
}

export async function onload({ extensionAPI, extension }) {
  if (!extensionAPI) throw new TypeError("Roam did not provide extensionAPI");
  if (activeLifecycle) await activeLifecycle.dispose();

  const lifecycle = createLifecycle();
  activeLifecycle = lifecycle;
  const mobile = isMobileHost(extensionAPI);
  try {
    globalThis[VERSION_FLAG] = VERSION;
    runtime = new CursorSmithRuntime({ extensionAPI, lifecycle, mobile });
    runtime.ensureDiag();
    await mirrorToDepot(extensionAPI, runtime._settings);
    await lifecycle.settingsPanel(extensionAPI, runtime.depotPanelConfig());
    runtime._depotPanelReady = true;

    const palette = extensionAPI.ui.commandPalette;
    await lifecycle.command(palette, {
      label: "Roam Caret: Open settings",
      callback: async () => {
        const ok = await openRoamCaretSettings();
        if (!ok) runtime.toast("Open Roam Depot, then choose Roam Caret under Extension Settings.");
      },
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Studio",
      callback: () => runtime.openSettings(),
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Toggle on/off",
      callback: () => runtime.toggleEnabled(),
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Random look",
      callback: () => runtime.randomize(),
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Cycle preset",
      callback: () => runtime.cyclePreset(),
    });
    await lifecycle.command(palette, {
      label: "Roam Caret: Diagnose caret (5s)",
      callback: () => runtime.diagnoseCaret(),
    });
    if (!mobile) runtime.applySettings();
    console.info(`[roam-caret] Loaded v${extension?.version || VERSION}`);
  } catch (error) {
    if (activeLifecycle === lifecycle) activeLifecycle = null;
    runtime = null;
    await lifecycle.dispose().catch((cleanupError) => console.error(cleanupError));
    throw error;
  }

  return async () => {
    if (activeLifecycle === lifecycle) activeLifecycle = null;
    runtime = null;
    await lifecycle.dispose();
  };
}

export async function onunload() {
  const lifecycle = activeLifecycle;
  activeLifecycle = null;
  runtime = null;
  if (lifecycle) await lifecycle.dispose();
  try {
    delete globalThis[VERSION_FLAG];
  } catch {
  }
  try {
    document.body?.classList?.remove(BODY_ACTIVE_CLASS, BODY_HIDE_NATIVE_CLASS);
  } catch {
  }
  console.info("[roam-caret] Unloaded");
}

export function getRuntime() {
  return runtime;
}

export default { onload, onunload, getRuntime };
