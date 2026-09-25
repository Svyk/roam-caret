import {
  DEFAULTS,
  BUILTIN_PRESETS,
} from "./cursor-smith.js";

export function hexToRgba(hex, alpha) {
  let h = (hex || "#39ff14").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const int = Number.parseInt(h, 16) || 0;
  return `rgba(${int >> 16 & 255}, ${int >> 8 & 255}, ${int & 255}, ${alpha})`;
}

export const OPTIONS_KEY = "options";

// Depot-only rows: never mirrored from the blob, read only in extension.js.
export const STYLE_NAME_ID = "cs-style-name";
export const SAVED_STYLES_ID = "cs-saved-styles";
// First item of the Saved styles menu, so every real style is a change event.
export const SAVED_STYLES_PROMPT = "Pick a saved style";

// Blob wins on load; cs-* ids are never read except cs-import-code.
export const MIRROR = Object.freeze({
  "cs-enabled": "enabled",
  "cs-preset": "activePreset",
  "cs-shape": "cursorStyle",
  "cs-color-light": "colorLight",
  "cs-color-dark": "colorDark",
  "cs-width": "caretWidthPx",
  "cs-glow": "glow",
  "cs-blink": "blinkingEnabled",
  "cs-show-char": "showChar",
  "cs-hide-native": "hideNativeCaret",
  "cs-hide-blur": "hideOnWindowBlur",
});

export function loadOptions(extensionAPI) {
  const raw = extensionAPI.settings.get(OPTIONS_KEY);
  return raw == null ? null : raw;
}

export async function persistOptions(extensionAPI, value) {
  await extensionAPI.settings.set(OPTIONS_KEY, value);
}

export function projectToDepot(settings) {
  const out = {};
  for (const [depotId, blobKey] of Object.entries(MIRROR)) {
    const value = settings[blobKey];
    if (depotId === "cs-preset") {
      out[depotId] = settings.activePreset || "Custom";
    } else if (depotId === "cs-width") {
      out[depotId] = String(value);
    } else if (depotId === "cs-color-light" || depotId === "cs-color-dark") {
      out[depotId] = value;
    } else {
      out[depotId] = value;
    }
  }
  return out;
}

export async function mirrorToDepot(extensionAPI, settings, keys) {
  const projected = projectToDepot(settings);
  const ids = keys ?? Object.keys(MIRROR);
  let writes = 0;
  for (const id of ids) {
    if (!(id in MIRROR)) continue;
    const value = projected[id];
    if (extensionAPI.settings.get(id) !== value) {
      await extensionAPI.settings.set(id, value);
      writes += 1;
    }
  }
  return writes;
}

export function createPreviewComponent(React = globalThis.window?.React) {
  if (typeof React?.createElement !== "function") return null;
  const h = React.createElement;
  return function RoamCaretPreview() {
    return h("div", { className: "cs-demo-wrap" },
      h("textarea", {
        className: "cs-demo",
        rows: 4,
        spellCheck: false,
        autoCorrect: "off",
        autoCapitalize: "off",
        placeholder: "Type here",
      }),
    );
  };
}

export function buildDepotPanel({
  settings = {},
  builtinNames,
  userNames,
  handlers = {},
  React = globalThis.window?.React,
} = {}) {
  const savedNames = userNames || Object.keys(settings.presets || {});
  const presetItems = [
    "Custom",
    ...(builtinNames || Object.keys(BUILTIN_PRESETS)),
    ...savedNames,
  ];
  const onChange = handlers.onChange ?? (() => {});
  // Roam's panel is a static list: this row exists only while Look is Custom,
  // and the panel is rebuilt whenever Look changes.
  const savedStylesRow = settings.activePreset ? [] : [{
    id: SAVED_STYLES_ID,
    name: "Saved styles",
    description: savedNames.length ? "Load a style you saved or imported." : "Save or import a style to list it here.",
    action: {
      type: "select",
      items: [SAVED_STYLES_PROMPT, ...savedNames],
      onChange: (event) => onChange(SAVED_STYLES_ID, event.target?.value ?? event),
    },
  }];

  const rows = [
    {
      id: "cs-enabled",
      name: "Enabled",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-enabled", event.target.checked),
      },
    },
    {
      id: "cs-preset",
      name: "Look",
      action: {
        type: "select",
        items: presetItems,
        onChange: (event) => onChange("cs-preset", event.target?.value ?? event),
      },
    },
    ...savedStylesRow,
    {
      id: "cs-shape",
      name: "Shape",
      action: {
        type: "select",
        items: ["Beam", "Line", "Box", "Underline"],
        onChange: (event) => onChange("cs-shape", event.target?.value ?? event),
      },
    },
    {
      id: "cs-color-light",
      name: "Color (light)",
      action: {
        type: "input",
        placeholder: "#00695e",
        onChange: (event) => onChange("cs-color-light", event.target?.value ?? event),
      },
    },
    {
      id: "cs-color-dark",
      name: "Color (dark)",
      action: {
        type: "input",
        placeholder: "#48d0c0",
        onChange: (event) => onChange("cs-color-dark", event.target?.value ?? event),
      },
    },
    {
      id: "cs-width",
      name: "Width (px)",
      description: "Line and Beam. A Line with Glow and Show letter off uses the browser's own 1px caret.",
      action: {
        type: "input",
        placeholder: "3",
        onChange: (event) => onChange("cs-width", event.target?.value ?? event),
      },
    },
    {
      id: "cs-glow",
      name: "Glow",
      description: "Soft halo around the caret.",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-glow", event.target.checked),
      },
    },
    {
      id: "cs-blink",
      name: "Blink",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-blink", event.target.checked),
      },
    },
    {
      id: "cs-show-char",
      name: "Show letter in Box",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-show-char", event.target.checked),
      },
    },
    {
      id: "cs-hide-native",
      name: "Hide Roam's caret",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-hide-native", event.target.checked),
      },
    },
    {
      id: "cs-hide-blur",
      name: "Hide when window unfocused",
      action: {
        type: "switch",
        onChange: (event) => onChange("cs-hide-blur", event.target.checked),
      },
    },
    {
      id: STYLE_NAME_ID,
      name: "Style name",
      description: "Used by Save and by the next copied share code. Empty uses the shape.",
      action: {
        type: "input",
        placeholder: "Teal",
        onChange: (event) => onChange(STYLE_NAME_ID, event.target?.value ?? event),
      },
    },
    {
      id: "cs-save-style",
      name: "Save style",
      description: "Saves the current look under Style name and adds it to Look.",
      action: {
        type: "button",
        content: "Save",
        onClick: handlers.onSaveStyle,
      },
    },
    {
      id: "cs-copy-code",
      name: "Copy share code",
      action: {
        type: "button",
        content: "Copy",
        onClick: handlers.onCopyCode,
      },
    },
    {
      id: "cs-import-code",
      name: "Share code to import",
      action: {
        type: "input",
        onChange: (event) => onChange("cs-import-code", event.target?.value ?? event),
      },
    },
    {
      id: "cs-import",
      name: "Import share code",
      action: {
        type: "button",
        content: "Import",
        onClick: handlers.onImport,
      },
    },
    {
      id: "cs-studio",
      name: "Open Studio",
      description: "Every effect, live preview.",
      action: {
        type: "button",
        content: "Open",
        onClick: handlers.onStudio,
      },
    },
  ];

  const preview = createPreviewComponent(React);
  if (preview) {
    rows.push({
      id: "cs-preview",
      name: "Preview",
      action: {
        type: "reactComponent",
        component: preview,
      },
    });
  }

  return { tabTitle: "Roam Caret", settings: rows };
}
