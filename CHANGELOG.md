# Changelog

All notable changes to this project follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
