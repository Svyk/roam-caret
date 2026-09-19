# Cursor Smith for Roam

Canvas-rendered text cursor for Roam Research. MIT port of [Cursor-Smith](https://github.com/Sadsnake1/cursor-smith) via the [Thymer Cursor Smith](https://github.com/Svyk/thymer-cursor-smith) plugin.

v0.2.0 draws a CSS overlay by default (no canvas loop). The canvas engine starts only when an effect that needs it is on (smear, particles, torch, smooth, and the other `needsCanvas` flags). Saved 0.1.x options migrate once: smear / pop-letters / flame-trail turn off. Roam Grid and Plexus diagram textareas (`.rg-root`, `.pxd-root`) keep the native caret.

## Install

In Roam: **Settings → Roam Depot → Developer mode → Developer Extensions → URL**. Enter:

`https://svyk.github.io/roam-cursor-smith`

Include `https://`. Do not append `/extension.js`. Confirm `/README.md` and `/extension.js` both resolve publicly.

Developer extensions are per client, not graph-synced. Reload with `Ctrl-D` then `Ctrl-R`.

## Commands

- Cursor Smith: Settings
- Cursor Smith: Toggle on/off
- Cursor Smith: Random look
- Cursor Smith: Cycle preset
- Cursor Smith: Diagnose caret (5s)

## License

[MIT](LICENSE). Upstream Cursor-Smith by Sadsnake1; Thymer port by akaready / Svyk; Roam port by Svyatoslav Kleshchev.
