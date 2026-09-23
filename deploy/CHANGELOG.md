# Changelog

All notable changes to this project follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
