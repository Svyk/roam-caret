import { ENUMS } from "./cursor-smith.js";

export const STUDIO_CSS = `.cs-studio-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow:auto;background:rgba(16,22,26,.55)}
.cs-studio{position:relative;z-index:10001;width:min(560px,100%);max-height:calc(100vh - 48px);overflow:auto;box-sizing:border-box;padding:12px 14px 20px;border:1px solid rgba(127,127,127,.22);border-radius:8px;background:Canvas;color:CanvasText;color-scheme:light dark;box-shadow:0 12px 40px rgba(0,0,0,.18)}
.cs-studio-preview{position:sticky;top:0;z-index:1;background:Canvas;padding-bottom:8px}
.cs-demo{display:block;width:100%;box-sizing:border-box;resize:vertical;min-height:68px;padding:8px 10px;border-radius:6px;border:1px solid rgba(127,127,127,.12);background:rgba(127,127,127,.06);color:inherit;font:inherit;line-height:1.5}
.cs-toast{font-size:12px;color:rgba(127,127,127,.8)}
.cs-studio-overlay>.cs-toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:10002;padding:6px 10px;border-radius:6px;background:Canvas;border:1px solid rgba(127,127,127,.22)}
.cs-studio-row{margin:6px 0}
.cs-studio-group{margin:10px 0;padding:10px 12px}
.cs-studio-group h4{margin:0 0 8px;font-size:13px}
.cs-studio-row p{margin:4px 0;font-size:11px;opacity:.65}`;

const RERENDER_KEYS = new Set([
  "cursorStyle", "gradientEnabled", "blinkingEnabled", "blinkBreathing",
  "smoothEnabled", "smoothAdaptive", "smear", "smearTaper", "popLetters",
  "flameTrail", "thunderstrike", "stardustEnabled", "stardustAlwaysOn",
  "stardustOrbit", "speedDemon", "speedDemonSparks", "energyEffect", "crtEffect",
  "selectionColorEnabled", "rowTypeTint", "idleFadeEnabled", "ghostEnabled",
  "comboEnabled", "shakeEnabled", "soundEnabled", "torchEffect", "overlayBlinkSync",
  "boxHollow",
]);

const PROP_ATTRS = new Set(["value", "checked", "selected"]);

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else if (k === "onClick" || k === "onChange" || k === "onInput") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (PROP_ATTRS.has(k)) el[k] = v;
      else if (typeof v === "boolean") { if (v) el.setAttribute(k, ""); }
      else if (v != null) el.setAttribute(k, String(v));
    }
  }
  for (const child of children.flat().filter((c) => c != null)) {
    if (typeof child === "string" || typeof child === "number") el.appendChild(document.createTextNode(String(child)));
    else el.appendChild(child);
  }
  return el;
}

function sub(children) {
  return h("div", { class: "cs-studio-sub", style: "margin-left:18px;margin-top:2px" }, children);
}

function note(text) {
  return h("p", null, text);
}

function row(...kids) {
  return h("div", { class: "cs-studio-row" }, kids);
}

function pct(v) { return Math.round(v * 100) + "%"; }
function fmtMul(v) { return v.toFixed(1) + "×"; }

function gradientColors(s, hexFn) {
  const n = Math.max(2, Math.min(4, Math.round(s.gradientCount || 2)));
  const out = [];
  for (let i = 1; i <= n; i++) out.push(hexFn("gradientDark" + i, `Dark ${i}`));
  for (let i = 1; i <= n; i++) out.push(hexFn("gradientLight" + i, `Light ${i}`));
  return out;
}

export function renderStudio(root, ctl) {
  const s = ctl.settings;

  const check = (key, label, desc) => {
    const input = h("input", {
      type: "checkbox",
      class: "bp3-control-input",
      checked: !!s[key],
      onChange: (e) => {
        ctl.set({ [key]: e.target.checked });
        if (RERENDER_KEYS.has(key)) ctl.rerender();
      },
    });
    const labelEl = h("label", { class: "bp3-control bp3-switch" }, input, h("span", { class: "bp3-control-indicator" }), label);
    if (desc) return row(labelEl, note(desc));
    return row(labelEl);
  };

  const num = (key, label, { min, max, step, unit }) => {
    const input = h("input", {
      type: "number",
      class: "bp3-input",
      value: Number(s[key]),
      min, max, step,
      onInput: (e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) ctl.setLive({ [key]: v });
      },
      onChange: (e) => ctl.set({ [key]: Number(e.target.value) }),
    });
    const bits = [label, input];
    if (unit) bits.push(" " + unit);
    return row(...bits);
  };

  const range = (key, label, { min, max, step, format }) => {
    const input = h("input", {
      type: "range",
      class: "bp3-input",
      value: Number(s[key]),
      min, max, step,
      onInput: (e) => ctl.setLive({ [key]: Number(e.target.value) }),
      onChange: (e) => ctl.set({ [key]: Number(e.target.value) }),
    });
    const val = format ? format(Number(s[key])) : String(s[key]);
    return row(label, " ", val, input);
  };

  const hex = (key, label) => {
    const text = h("input", {
      type: "text",
      class: "bp3-input",
      value: s[key] || "",
      onChange: (e) => ctl.set({ [key]: e.target.value }),
    });
    const picker = h("input", {
      type: "color",
      value: s[key] || "#000000",
      onChange: (e) => {
        text.value = e.target.value;
        ctl.set({ [key]: e.target.value });
      },
    });
    return row(label, picker, text);
  };

  const select = (key, items) => {
    const sel = h("select", {
      onChange: (e) => {
        ctl.set({ [key]: e.target.value });
        if (RERENDER_KEYS.has(key)) ctl.rerender();
      },
    }, items.map((item) => h("option", { value: item.value, selected: s[key] === item.value }, item.label)));
    return row(h("div", { class: "bp3-html-select" }, sel));
  };

  const group = (title, children) => h("div", { class: "bp3-card cs-studio-group" }, h("h4", { class: "bp3-heading" }, title), ...children.filter(Boolean));
  const button = (label, onClick) => h("button", { type: "button", class: "bp3-button bp3-minimal bp3-small", onClick }, label);

  const prev = root.querySelector(".cs-demo");
  const prevValue = prev ? prev.value : "";
  const prevFocused = !!prev && root.ownerDocument.activeElement === prev;
  const prevStart = prev ? prev.selectionStart : 0;
  const prevEnd = prev ? prev.selectionEnd : 0;

  const demo = h("textarea", {
    class: "cs-demo",
    rows: "3",
    spellcheck: "false",
    "aria-label": "Cursor preview",
    placeholder: "Type here to see your cursor…\nPress Enter for Thunderstrike.",
  });
  if (prevValue) demo.value = prevValue;

  const shapeItems = (ENUMS.cursorStyle.includes("Beam")
    ? ["Beam", "Line", "Box", "Underline"]
    : ["Line", "Box", "Underline"]
  ).map((v) => ({ value: v, label: v }));

  const caretBody = [
    select("cursorStyle", shapeItems),
    num("caretWidthPx", "Thickness", { min: 1, max: 12, step: 0.5, unit: "px" }),
    range("cursorOpacity", "Opacity", { min: 0.1, max: 1, step: 0.01, format: (v) => pct(v) }),
    check("glow", "Glow", "Soft halo around the caret."),
    s.cursorStyle === "Box" ? check("boxHollow", "Hollow", "Outline only, no fill.") : null,
    s.cursorStyle === "Box" && s.boxHollow ? sub([num("boxHollowWidth", "Outline width", { min: 1, max: 8, step: 0.5, unit: "px" })]) : null,
    s.cursorStyle === "Box" && !s.boxHollow ? check("showChar", "Show the letter inside", "Draws the character under the cursor in inverted colour.") : null,
    s.cursorStyle === "Line" ? check("lineSerifs", "Serifs", "Caps on the stem — the classic I-beam.") : null,
    s.cursorStyle === "Underline" ? num("underlineWidthPx", "Bar thickness", { min: 0, max: 12, step: 0.5, unit: "px" }) : null,
    s.cursorStyle === "Underline" ? note("0 scales the bar with the line height.") : null,
  ];

  const colorBody = [
    check("gradientEnabled", "Gradient", "Paint the cursor with a colour ramp instead of one flat colour."),
    ...(s.gradientEnabled ? [
      num("gradientCount", "Number of stops", { min: 2, max: 4, step: 1 }),
      note("Set gradient stops by hand below."),
      ...gradientColors(s, hex),
    ] : [
      hex("colorDark", "Dark theme"),
      hex("colorLight", "Light theme"),
    ]),
  ];

  const blinkBody = [
    check("blinkingEnabled", "Blinking"),
    ...(s.blinkingEnabled ? [sub([
      range("blinkSpeed", "Speed", { min: 0.1, max: 5, step: 0.1, format: fmtMul }),
      range("blinkOnOffBalance", "Balance", { min: 0.1, max: 0.9, step: 0.01, format: (v) => pct(v) + " lit" }),
      num("blinkDelayMs", "Delay after typing", { min: 0, max: 5000, step: 50, unit: "ms" }),
      note("How long the cursor stays fully lit after any move or keystroke before blinking resumes."),
      check("blinkBreathing", "Breathing", "Shrink and swell instead of fading out, so the cursor never disappears."),
      s.blinkBreathing ? sub([range("blinkBreathDepth", "Breath depth", { min: 0.05, max: 0.5, step: 0.01, format: pct })]) : null,
    ])] : []),
    check("hideNativeCaret", "Hide Roam's native caret", "Turn this off to see both at once — useful when diagnosing alignment."),
    check("hideOnWindowBlur", "Hide when the window loses focus", "What every other writing app does."),
  ];

  const smoothBody = [
    check("smoothEnabled", "Smooth movement", "The cursor glides between positions instead of jumping."),
    ...(s.smoothEnabled ? [sub([
      range("smoothness", "Glide", { min: 0.05, max: 0.3, step: 0.01, format: pct }),
      range("catchUpSpeed", "Catch-up speed", { min: 0.3, max: 0.8, step: 0.01, format: pct }),
      check("smoothAdaptive", "Speed up when typing fast"),
      s.smoothAdaptive ? sub([range("maxCatchUpSpeed", "Max catch-up", { min: 0.5, max: 1, step: 0.01, format: pct })]) : null,
      check("smoothStopBlinking", "Don't blink while typing"),
    ])] : []),
    check("snapOnNewline", "Snap across line breaks", "Jump to the new line instead of sweeping diagonally through the text between."),
    num("moveDelayMs", "Movement delay", { min: 0, max: 400, step: 10, unit: "ms" }),
  ];

  const smearBody = [
    check("smear", "Motion smear", "The cursor stretches along its line of travel."),
    ...(s.smear ? [sub([
      range("smearStiffness", "Stiffness", { min: 0.05, max: 1, step: 0.01, format: pct }),
      range("smearTrailingStiffness", "Trailing stiffness", { min: 0.05, max: 1, step: 0.01, format: pct }),
      range("smearDamping", "Damping", { min: 0.1, max: 1, step: 0.01, format: pct }),
      check("smearTaper", "Tapered trail", "Narrow the trailing end to a point, like a comet tail."),
      s.smearTaper ? sub([range("smearTaperAmount", "Taper amount", { min: 0, max: 1, step: 0.01, format: pct })]) : null,
    ])] : []),
  ];

  const effectsBody = [
    check("popLetters", "Popping letters", "Typed characters fly off the cursor."),
    s.popLetters ? sub([check("popRainbow", "Rainbow", "Step each letter through the colour wheel.")]) : null,
    check("flameTrail", "Pixel trail", "A burst of fading pixels every time the cursor moves."),
    ...(s.flameTrail ? [sub([
      check("backspaceDisintegrate", "Backspace disintegration", "Deleting throws the pixels outward in inverted colours."),
      check("thunderstrike", "Thunderstrike", "Enter calls down a bolt of pixelated lightning onto the new line."),
      ...(s.thunderstrike ? [sub([
        num("thunderstrikeSize", "Bolt size", { min: 1, max: 8, step: 1, unit: "px" }),
        range("thunderstrikeStrength", "Strength", { min: 0.1, max: 1, step: 0.01, format: pct }),
      ])] : []),
    ])] : []),
    check("stardustEnabled", "Stardust", "A slow stream of drifting, fading motes."),
    ...(s.stardustEnabled ? [sub([
      check("stardustAlwaysOn", "Always on", "Stream continuously instead of only while idle."),
      s.stardustAlwaysOn ? null : num("stardustDelayMs", "Idle delay", { min: 0, max: 10000, step: 100, unit: "ms" }),
      range("stardustRate", "Density", { min: 0.2, max: 3, step: 0.1, format: fmtMul }),
      check("stardustOrbit", "Orbit", "Motes circle the cursor like fireflies instead of drifting up."),
      s.stardustOrbit ? sub([num("stardustOrbitRadius", "Orbit radius", { min: 6, max: 80, step: 1, unit: "px" })]) : null,
    ])] : []),
    check("speedDemon", "Speed demon", "The cursor heats toward white-hot as you type faster."),
    ...(s.speedDemon ? [sub([
      range("speedDemonSensitivity", "Sensitivity", { min: 0.5, max: 2, step: 0.1, format: fmtMul }),
      check("speedDemonSparks", "Fire sparks", "Throw embers off the cursor at high heat."),
      ...(s.speedDemonSparks ? [sub([
        range("speedDemonSparkQuantity", "Spark quantity", { min: 0, max: 3, step: 0.1, format: fmtMul }),
        num("speedDemonSparkTrail", "Spark trail", { min: 0, max: 30, step: 1, unit: "px" }),
      ])] : []),
    ])] : []),
    check("energyEffect", "Energy beam", "A brightness wave travelling along the cursor."),
    ...(s.energyEffect ? [sub([
      range("energySpeed", "Beam speed", { min: 0.2, max: 3, step: 0.1, format: fmtMul }),
      s.gradientEnabled ? check("energyAurora", "Aurora", "Warp and cross-mix the gradient instead of scrolling it rigidly.") : note("Turn Gradient on for the Aurora variant."),
    ])] : []),
    check("crtEffect", "CRT effect", "A phosphor trail behind the cursor, and the glow halo."),
    ...(s.crtEffect ? [sub([
      num("trailLength", "Trail length", { min: 1, max: 40, step: 1 }),
      num("trailFadeMs", "Trail fade", { min: 80, max: 2000, step: 10, unit: "ms" }),
    ])] : []),
  ];

  const contextBody = [
    check("selectionColorEnabled", "Selection colour", "Switch colour while text is selected."),
    ...(s.selectionColorEnabled ? [sub([
      hex("selectionColorDark", "Dark theme"),
      hex("selectionColorLight", "Light theme"),
    ])] : []),
    check("rowTypeTint", "Tint by row type", "Headings, tasks, code and quotes each shift the cursor's hue."),
    ...(s.rowTypeTint ? [sub([
      range("rowTypeTintAmount", "Shift", { min: 0, max: 180, step: 5, format: (v) => v + "°" }),
      note("Plain text keeps your colour; every other row type moves away from it."),
    ])] : []),
  ];

  const idleBody = [
    check("idleFadeEnabled", "Fade when idle", "Dim the cursor after you stop typing."),
    ...(s.idleFadeEnabled ? [sub([
      num("idleFadeDelayMs", "After", { min: 500, max: 30000, step: 250, unit: "ms" }),
      range("idleFadeTo", "Fade to", { min: 0, max: 0.9, step: 0.01, format: pct }),
    ])] : []),
    check("ghostEnabled", "Ghost cursor", "A second, fainter cursor trailing behind the real one."),
    ...(s.ghostEnabled ? [sub([
      range("ghostOpacity", "Ghost opacity", { min: 0.05, max: 0.8, step: 0.01, format: pct }),
      range("ghostLag", "Catch-up", { min: 0.01, max: 0.3, step: 0.01, format: pct }),
    ])] : []),
  ];

  const feedbackBody = [
    check("comboEnabled", "Combo", "Sustained typing streaks escalate the cursor."),
    ...(s.comboEnabled ? [sub([
      num("comboThreshold", "Full combo at", { min: 5, max: 100, step: 1, unit: " keys" }),
      check("comboGlow", "Glow with the streak"),
      check("comboShower", "Throw sparks at high streak"),
      note("A streak resets after about a second without typing."),
    ])] : []),
    check("shakeEnabled", "Shake on delete", "A short kick when you press Backspace or Delete."),
    ...(s.shakeEnabled ? [sub([
      range("shakeStrength", "Strength", { min: 0.5, max: 12, step: 0.5, format: (v) => v + "px" }),
      num("shakeDurationMs", "Duration", { min: 60, max: 600, step: 10, unit: "ms" }),
    ])] : []),
    check("soundEnabled", "Typewriter sound", "A synthesised click on every keystroke."),
    ...(s.soundEnabled ? [sub([
      range("soundVolume", "Volume", { min: 0.01, max: 1, step: 0.01, format: pct }),
      range("soundPitch", "Pitch", { min: 0.4, max: 2.5, step: 0.05, format: (v) => v.toFixed(2) + "×" }),
      range("soundVariation", "Variation", { min: 0, max: 1, step: 0.01, format: pct }),
      note("Never included when you roll a random look — a surprise noise is not consent."),
    ])] : []),
  ];

  const torchBody = [
    check("torchEffect", "Torch spotlight", "Darken the panel except for a pool of light around the cursor."),
    ...(s.torchEffect ? [sub([
      select("overlayFollowMode", [
        { value: "caret", label: "Follow cursor" },
        { value: "mouse", label: "Follow pointer" },
        { value: "auto", label: "Auto" },
      ]),
      num("overlayRadius", "Light size", { min: 60, max: 900, step: 10, unit: "px" }),
      range("overlayDarkness", "Darkness", { min: 0, max: 1, step: 0.01, format: pct }),
      range("overlayIntensity", "Warmth", { min: 0, max: 1, step: 0.01, format: pct }),
      hex("overlayColor", "Light colour"),
      range("overlaySpeed", "Follow speed", { min: 0.02, max: 1, step: 0.01, format: pct }),
      check("overlayBlinkSync", "Blink sync", "The light breathes with the cursor's blink."),
      s.overlayBlinkSync ? sub([range("overlayBlinkDepth", "Blink depth", { min: 0.05, max: 0.6, step: 0.01, format: pct })]) : null,
    ])] : []),
  ];

  const resetBody = [
    row(button("Random look", () => ctl.randomize()), button("Reset to defaults", () => ctl.resetLook())),
  ];

  const built = [
    group("Preview", [h("div", { class: "cs-studio-preview" }, demo, note("Nothing typed here is saved."))]),
    group("Caret", caretBody),
    group("Colour", colorBody),
    group("Blinking", blinkBody),
    group("Smooth movement", smoothBody),
    group("Motion smear", smearBody),
    group("After effects", effectsBody),
    group("Context", contextBody),
    group("Idle & ghost", idleBody),
    group("Feedback", feedbackBody),
    group("Torch", torchBody),
    group("Reset", resetBody),
  ];

  if (typeof root.replaceChildren === "function") root.replaceChildren(...built);
  else {
    while (root.firstChild) root.removeChild(root.firstChild);
    for (const child of built) root.appendChild(child);
  }

  if (prevFocused) {
    try {
      demo.focus({ preventScroll: true });
      demo.setSelectionRange(prevStart, prevEnd);
    } catch {
    }
  }
}
