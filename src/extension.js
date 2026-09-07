import { createLifecycle } from "./lifecycle.js";
import { loadOptions, persistOptions } from "./settings.js";
import {
  BODY_ACTIVE_CLASS,
  BODY_HIDE_NATIVE_CLASS,
  CursorEngine,
  DEFAULTS,
  PANEL_CSS,
  PANEL_LOCAL_CSS,
  ROOT_CLASS,
  normalizePresetSnapshot,
  normalizeSettings,
  pickLook,
  randomizeLook,
  renderPanel,
} from "./cursor-smith.js";

export const VERSION = "0.1.0";
const CANVAS_Z_INDEX = 40; // PROVISIONAL
const VERSION_FLAG = "__ROAM_CURSOR_SMITH_VERSION";

let activeLifecycle = null;
let runtime = null;

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

function canStartEngine() {
  return typeof document !== "undefined"
    && !!document.body
    && typeof document.createElement === "function"
    && typeof MutationObserver === "function"
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

function injectSheet(lifecycle, cssText) {
  if (typeof document === "undefined" || !document.createElement) return;
  const style = document.createElement("style");
  style.setAttribute("data-cursor-smith", "panel");
  style.textContent = cssText;
  lifecycle.node(style, document.head || document.body);
}

class CursorSmithRuntime {
  constructor({ extensionAPI, lifecycle, mobile }) {
    this.extensionAPI = extensionAPI;
    this.lifecycle = lifecycle;
    this.mobile = mobile;
    this._settings = normalizeSettings(loadOptions(extensionAPI) ?? {});
    this._engine = null;
    this._overlay = null;
    this._panelEl = null;
    this._toastEl = null;
    this._fatalNotice = false;
    this.pendingPresetName = "";
    this.lifecycle.add(() => this.teardown());
  }

  teardown() {
    this.closeSettings();
    this.stopEngine();
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
    const live = !!this._engine && !!this._settings.enabled && !this.mobile;
    try {
      document.body?.classList?.toggle(BODY_ACTIVE_CLASS, live);
      document.body?.classList?.toggle(
        BODY_HIDE_NATIVE_CLASS,
        live && !!this._settings.hideNativeCaret,
      );
    } catch {
    }
  }

  startEngine() {
    if (this.mobile || !this._settings.enabled || this._engine || !canStartEngine()) return;
    try {
      this._engine = new CursorEngine({
        settings: this._settings,
        doc: document,
        zIndex: CANVAS_Z_INDEX,
        onFatal: (err) => this.engineFailed(err),
      });
      this._engine.start();
      this.applyBodyClasses();
    } catch (err) {
      console.error("[cursor-smith] engine failed to start:", err);
      this.stopEngine();
    }
  }

  stopEngine() {
    if (!this._engine) {
      this.applyBodyClasses();
      return;
    }
    try {
      this._engine.stop();
    } catch {
    }
    this._engine = null;
    this.applyBodyClasses();
  }

  engineFailed(err) {
    console.error("[cursor-smith] engine stopped after repeated frame errors:", err);
    this.stopEngine();
    this.clearBodyClasses();
    if (this._fatalNotice) return;
    this._fatalNotice = true;
    const palette = this.extensionAPI?.ui?.commandPalette;
    if (palette) {
      void this.lifecycle.command(palette, {
        label: "Cursor Smith: engine stopped (see console)",
        callback: () => this.openSettings(),
      }).catch((error) => console.error(error));
    }
  }

  applySettings() {
    if (this.mobile || !this._settings.enabled) {
      this.stopEngine();
      return;
    }
    if (!this._engine) this.startEngine();
    else this._engine.setSettings(this._settings);
    this.applyBodyClasses();
  }

  _set(patch) {
    this._settings = normalizeSettings({ ...this._settings, ...patch });
    void persistOptions(this.extensionAPI, this._settings);
    this.applySettings();
  }

  _setLive(patch) {
    this._settings = { ...this._settings, ...patch };
    this.applySettings();
  }

  toast(message) {
    console.info("[cursor-smith]", message);
    if (this._toastEl) this._toastEl.textContent = message;
  }

  openSettings() {
    if (this._overlay?.isConnected) return;
    if (typeof document === "undefined" || !document.body || !document.createElement) return;
    const overlay = document.createElement("div");
    overlay.className = "cs-panel-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Cursor Smith settings");
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) this.closeSettings();
    });
    const panelRoot = document.createElement("div");
    panelRoot.className = `cs-panel ${ROOT_CLASS}-panel`;
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
      renderPanel(this._panelEl, {
        version: VERSION,
        conf: {
          repository: "https://github.com/Svyk/roam-cursor-smith",
        },
        settings: this._settings,
        disabled: !this._settings.enabled,
        data: undefined,
        scopeArgs: () => null,
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
      console.error("[cursor-smith] settings panel failed:", err);
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
    this.toast(next ? "Cursor Smith on." : "Cursor Smith off.");
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

  diagnoseCaret() {
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
        carets: [],
        listviewCarets: [],
        active: active ? describe(active) : null,
        textarea: textarea ? {
          id: textarea.id,
          cls: textarea.className,
          selectionStart: textarea.selectionStart,
          selectionEnd: textarea.selectionEnd,
        } : null,
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
    this.toast("Diagnosing for 5s — click into a block and type.");
    this.lifecycle.timeout(() => {
      try {
        mo?.disconnect();
      } catch {
      }
      window.removeEventListener("keydown", onKey, true);
      sample("end");
      const text = JSON.stringify(log, null, 2);
      console.log("[cursor-smith] caret diagnostic\n" + text);
      copyToClipboard(text);
      this.toast(`Caret diagnostic: ${log.length} samples, copied to clipboard.`);
    }, 5000);
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
    injectSheet(lifecycle, PANEL_CSS + "\n" + PANEL_LOCAL_CSS);
    runtime = new CursorSmithRuntime({ extensionAPI, lifecycle, mobile });
    const palette = extensionAPI.ui.commandPalette;
    await lifecycle.command(palette, {
      label: "Cursor Smith: Settings",
      callback: () => runtime.openSettings(),
    });
    await lifecycle.command(palette, {
      label: "Cursor Smith: Toggle on/off",
      callback: () => runtime.toggleEnabled(),
    });
    await lifecycle.command(palette, {
      label: "Cursor Smith: Random look",
      callback: () => runtime.randomize(),
    });
    await lifecycle.command(palette, {
      label: "Cursor Smith: Cycle preset",
      callback: () => runtime.cyclePreset(),
    });
    await lifecycle.command(palette, {
      label: "Cursor Smith: Diagnose caret (5s)",
      callback: () => runtime.diagnoseCaret(),
    });
    if (typeof document !== "undefined") {
      lifecycle.event(document, "keydown", (ev) => runtime.onEscape(ev), true);
    }
    if (!mobile) runtime.startEngine();
    console.info(`[cursor-smith] Loaded v${extension?.version || VERSION}`);
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
  console.info("[cursor-smith] Unloaded");
}

export default { onload, onunload };
