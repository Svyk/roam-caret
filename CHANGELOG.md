# Changelog

All notable changes to this project follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.2] - 2026-09-24

### Fixed
- Find or Create puts the caret on the text line, after the search icon, instead of a short bar in the middle of the field.
- A field that changes size after the keystroke (Chief of Staff grows its composer) is measured again, so the caret does not stay on the old box.

## [0.5.1] - 2026-09-23

### Changed
- The caret now draws in Roam's own text fields: the command palette search, Find or Create Page, Roam Depot settings inputs and textareas, and any other visible text field in a dialog. Password fields, checkboxes, buttons, selects, Roam Grid and Plexus keep the browser caret.
- The caret sits one layer above the field's highest positioned ancestor, read once when the field gets focus. In the command palette (portal at 1000) it is drawn at 1001, inside the field. A block caret stays at 40.
- While the command palette is open, only its own search field gets a caret. A block still focused behind the dialog shows none.
- The browser caret on a field is hidden only while the overlay shows, and its previous inline value comes back on blur, on unload and on the switch to plain Line. Turning off "Hide Roam's native caret" leaves it visible.
- Plain Line colours the browser caret in the same fields, including the palette search and Depot settings.
- Text inputs are measured as one line that scrolls sideways, centred in the field the way Chrome draws it. The caret in an input is at most 1.5 times the font size tall, so a Blueprint field whose line height equals its height does not stretch it to the full field.

### Fixed
- A dialog that unmounts its focused field no longer leaves a caret behind.

## [0.5.0] - 2026-09-23

Roam Depot prep: speed first, then the fixes from the Opus review.

### Changed
- A plain Line (Line shape, glow off, letter off, no gradient, no canvas effect) now colours the browser's own caret with `caret-color`. No overlay, no mirror, no work per keystroke. The browser draws it about 1px wide.
- The overlay path does one forced layout per keystroke. The textarea box is read once, inside the measure. Scroll offsets are never read after the overlay write. The command-palette check is a flag kept by a MutationObserver, not a `querySelector` per key.
- Blink runs on one Web Animations handle, restarted on input, arrow-key moves and clicks. Blink speed, balance, delay and opacity now work in lite mode. The blink period matches canvas mode (2.5 s divided by speed), so the default lite blink is slower than the old fixed 1.06 s.
- `window.__ROAM_CARET_DIAG.measures` now times the whole caret update, style writes included.
- Gradient, Line serifs, breathing blink, idle fade, selection colour, row tint, typewriter sound and movement delay switch to canvas mode, which draws them. In lite mode they did nothing.

### Fixed
- Show letter no longer draws a second letter on Line or Beam. On Box it uses the block's font and line height. The letter is drawn in the block's text colour or its inverse, whichever is easier to read on the caret colour.
- Light Roam on a dark OS now uses the light caret colour. Lite and canvas mode read the theme from Roam's own classes only (`bp3-dark`, `rm-dark-theme`, `roam-body.dark`, `bt-theme-dark`). The Studio panel follows the same theme.
- The Studio preview shows the caret. Only a caret in a preview textarea is raised above the panel. Block carets stay under the command palette.
- A caret scrolled out of its scroll container, for example under the top bar, is hidden.
- The caret comes back as soon as the command palette closes.
- The Depot Look menu stays on the chosen built-in or imported look. Editing the look by hand switches the menu to Custom.
- A share code is named after the active look, or after the shape for a custom look. If an imported name already belongs to a different look, the import is saved as "Name 2". Importing the same look twice does not duplicate it, and built-in names are never shadowed.
- Colour fields ignore a partial hex while you type instead of resetting to the default green.

## [0.4.2] - 2026-09-22

### Fixed
- The settings preview and Studio demo show the caret again. Depot dialogs no longer hide the block caret. The command palette still uses the browser caret.

## [0.4.1] - 2026-09-22

### Fixed
- Lite overlay stays off the command palette and Find-or-Create; native caret remains there. No beam on the dimmed page behind modal overlays.

## [0.4.0] - 2026-09-22

### Changed
- Speed tune: canvas engine split into lazy-loaded `engine.js`; lite caret dedupes by element identity; mirror style cache drops on theme or zoom change.
- Install URL is `https://svyk.github.io/roam-caret` (repository rename to `roam-caret`). The old `roam-cursor-smith` Pages URL stops working after the GitHub repo rename.

## [0.3.3] - 2026-09-19

### Fixed
- Blink restart no longer reads `offsetWidth` on the input path (no forced reflow per keystroke); the CSS animation resets via WAAPI `currentTime`.
- Scroll/resize remeasure is gated: no-op when disposed or no active text target, and unrelated overflow scrolls (sidebar, autocomplete) are ignored unless the scrolled node is an ancestor of the active textarea. Scroll listeners are `{capture, passive}`.
- Unchanged overlay style values (transform/width/height/background/border/boxShadow) are no longer rewritten on every measure.
- Window blur hides the lite caret when `hideOnWindowBlur` is on; focus restores it.
- IME composition hides the caret and skips measuring until `compositionend`.

### Added
- `window.__ROAM_CARET_DIAG` exposes a ring of the last 20 measure durations in ms.

## [0.3.2] - 2026-09-19

### Fixed
- Lite caret remeasures on page scroll.

## [0.3.1] - 2026-09-19

### Fixed
- Depot preview textarea inherits panel colors (no white UA box on dark theme).
- Native caret hidden in preview; spellcheck disabled.
- Depot buttons show labels (`action.content`) instead of empty squares.

### Changed
- Removed Match Svy Theme row and builtin Svy preset from product UI.
- Example share code in README (name `Example`).
- LICENSE header simplified (MIT only).

## [0.3.0] - 2026-09-19

### Added
- Native Roam Depot tab (Roam Caret) with write-through `cs-*` mirrors; blob `options` stays source of truth.
- Command `Roam Caret: Open settings` (Depot tab) and `Roam Caret: Studio` (Blueprint overlay).
- Lite **Beam** shape and builtin **Svy** preset.
- Match Svy Theme colors (read-only CSS variables).

### Changed
- Product name Roam Caret. Repo / Pages URL unchanged.
- Studio no longer uses Thymer panel chrome.

### Removed
- User-facing port lede. Thymer `tps-*` settings CSS from the boot bundle.

## [0.2.0] - 2026-09-19

### Added

- Lite caret path: event-driven CSS `transform` overlay with no `requestAnimationFrame` when canvas-only effects are off.
- Persistent offscreen caret measurer (`src/caret-measure.js`) shared by lite and canvas.
- Builtin **Fast** preset. `needsCanvas()` chooses lite vs canvas.
- `schemaVersion: 2` migrates 0.1.x saved options so smear / pop-letters / flame-trail default off once.

### Changed

- Default look is still Box + showChar. Smear, pop-letters, and flame-trail now default off.
- Settings panel CSS injects only while the overlay is open.
- Canvas engine reads the measurer cache and parks idle (no 100ms heartbeat).
- Skip `.rg-root` / `.pxd-root` textareas (native caret; Beam zoom pitfall).

### Removed

- Thymer host path: `listview-caret`, `g_range`, body-subtree caret/modal observers, per-frame `window.__csDebug`.

## [0.1.1] - 2026-09-07

### Fixed

- Opaque settings panel and overlay (`Canvas` fill, z-index 10000) so Linked References no longer show through.
- Hide Svy Theme caret overlay while Smith is active (`body.cs-active`).
- Strip upstream Thymer/akaready header chrome from the settings panel.

## [0.1.0] - 2026-09-07

### Added

- Roam Depot port of Cursor Smith: canvas caret, settings overlay, command palette, generic caret path, hide-native default on.
