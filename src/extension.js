import { createLifecycle } from "./lifecycle.js";
import { openRoamCaretSettings } from "./open-settings.js";
import {
  MIRROR,
  buildDepotPanel,
  loadOptions,
  mirrorToDepot,
  persistOptions,
} from "./settings.js";
import { createCaretMeasurer } from "./caret-measure.js";
import { installLiteCaret } from "./caret-lite.js";
import {
  BODY_ACTIVE_CLASS,
  BODY_HIDE_NATIVE_CLASS,
  BUILTIN_PRESETS,
  DEFAULTS,
  codeToPreset,
  needsCanvas,
  normalizePresetSnapshot,
  normalizeSettings,
  pickLook,
  presetToCode,
  randomizeLook,
} from "./cursor-smith.js";
import { renderStudio, STUDIO_CSS } from "./studio.js";

export const VERSION = "0.4.0";
const CANVAS_Z_INDEX = 40; // PROVISIONAL
const VERSION_FLAG = "__ROAM_CURSOR_SMITH_VERSION";

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
    this._measurer = null;
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
    this.pendingPresetName = "";
    this.lifecycle.add(() => this.teardown());
  }

  teardown() {
    this.closeSettings();
    this._removePanelStyle();
    this.stopLite();
    this.stopEngine();
    this.stopMeasurer();
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
    const live = (!!this._engine || !!this._lite) && !!this._settings.enabled && !this.mobile;
    try {
      document.body?.classList?.toggle(BODY_ACTIVE_CLASS, live);
      document.body?.classList?.toggle(
        BODY_HIDE_NATIVE_CLASS,
        live && !!this._settings.hideNativeCaret,
      );
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
      const now = globalThis.performance?.now?.bind(globalThis.performance);
      const diag = { measureCount: 0, measures: [] };
      try {
        (document.defaultView || globalThis).__ROAM_CARET_DIAG = diag;
      } catch {
      }
      this._measurer.measure = (el) => {
        this._measureCount += 1;
        if (!now) return inner(el);
        const start = now();
        const out = inner(el);
        diag.measureCount += 1;
        diag.measures.push(now() - start);
        if (diag.measures.length > 20) diag.measures.shift();
        return out;
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
    try {
      const win = (typeof document !== "undefined" && document.defaultView) || globalThis;
      delete win.__ROAM_CARET_DIAG;
    } catch {
    }
  }

  _bindPumpListener(target, type, fn, capture) {
    target.addEventListener(type, fn, capture);
    this._pumpListeners.push({ target, type, fn, capture: !!capture });
  }

  ensurePump() {
    if (this._pumpInstalled || typeof document === "undefined") return;
    const pump = () => {
      try {
        const el = document.activeElement;
        if (this._measurer && el) this._measurer.measure(el);
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

  async startEngine() {
    if (this.mobile || !this._settings.enabled || this._engine || !canStartEngine()) return true;
    this.ensureMeasurer();
    this.ensurePump();
    try {
      const mod = await loadCursorEngine();
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

  applySettings() {
    if (this.mobile || !this._settings.enabled) {
      this.stopLite();
      this.stopEngine();
      this._mode = "off";
      return;
    }
    const nextMode = needsCanvas(this._settings) ? "canvas" : "lite";
    if (this._mode && this._mode !== nextMode && this._mode !== "off") {
      this.toast(nextMode === "canvas" ? "Canvas mode: effects on" : "Lite mode");
    }
    this._mode = nextMode;
    if (nextMode === "canvas") {
      this.stopLite();
      if (!this._engine) {
        void this.startEngine().then((ok) => {
          if (!ok && needsCanvas(this._settings)) {
            this._mode = "lite";
            this.startLite();
          }
          this.applyBodyClasses();
        });
      } else {
        this._engine.setSettings(this._settings);
      }
    } else {
      this.stopEngine();
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
    if (!(id in MIRROR)) return;

    const blobKey = MIRROR[id];

    if (id === "cs-preset") {
      if (raw === "Custom") {
        this._set({ activePreset: "" });
      } else {
        const snap = BUILTIN_PRESETS[raw] ?? this._settings.presets?.[raw];
        if (snap) {
          this._set({ ...pickLook(snap), activePreset: raw });
          await this.rebuildPanel();
        }
      }
      return;
    }

    const patch = id === "cs-width" ? { [blobKey]: Number(raw) } : { [blobKey]: raw };
    this._set(patch);
    await mirrorToDepot(this.extensionAPI, this._settings, [id]);
  }

  copyShareCode() {
    const code = presetToCode(this._settings.activePreset || "Current", pickLook(this._settings));
    copyToClipboard(code);
    this.toast("Share code copied.");
  }

  async importShareCode() {
    const code = this.extensionAPI.settings.get("cs-import-code");
    const decoded = codeToPreset(code);
    if (!decoded) {
      this.toast("Could not import that code");
      return;
    }
    const { name, snap } = decoded;
    const presets = { ...(this._settings.presets || {}), [name]: snap };
    this._set({ ...snap, activePreset: name, presets });
    await this.extensionAPI.settings.set("cs-import-code", "");
    await this.rebuildPanel();
    this.toast(`Imported "${name}".`);
  }

  _set(patch) {
    this._settings = normalizeSettings({ ...this._settings, ...patch });
    const depotIds = this._depotIdsForPatch(patch);
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
    this._overlay = overlay;
    this._panelEl = panelRoot;
    this._toastEl = toastEl;
    this.renderPanel();
  }

  closeSettings() {
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
    if (typeof document !== "undefined") {
      lifecycle.event(document, "keydown", (ev) => runtime.onEscape(ev), true);
    }
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
