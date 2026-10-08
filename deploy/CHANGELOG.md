# Changelog

All notable changes to this project follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- The caret drifted below its line in multi-line text at any font size where `1.5em` is not the field's line-height (a Plexus card zoomed to 69% put it about one line fraction low per wrapped line). A theme rule `div { line-height: 1.5em }` sized the mirror's inner blocks; they now inherit the mirror's font and line-height explicitly.

## [0.6.7] - 2026-10-06

### Fixed
- Inside a zoomed Plexus card the box shows the character after the caret, or nothing at the end of a line, instead of a ghost letter.
- The caret height follows the board's zoom (a page card scales with the board; a counter-scaled note editor stays at 1), so it no longer stands a full line taller than the text when zoomed out.
- A caret at the end of a full line stays on that line instead of dropping to an empty row below.

### Changed
- The caret hides while the board pans or zooms and paints once when it stops; the first focus in a card pulses it briefly so you can see where it landed.

## [0.6.6] - 2026-10-06

### Added
- The caret draws inside Plexus Diagram cards: it is measured in the card's own size and scaled to the board's zoom (at least one device pixel wide), clipped to a scrolling page card, and re-placed on the `plexus-diagram:camera` event.

### Fixed
- A field the caret skips (Roam Grid) keeps the browser caret visible; before, inside a Plexus card the browser caret was hidden and nothing was drawn.

## [0.6.5] - 2026-09-28

### Fixed
- Canvas effects load when installed from Roam Depot. The engine was a second file loaded by a relative import, which Depot cannot serve. It is now inside `extension.js` and still starts only when an effect needs it.
- Canvas effects fire again. Every caret move was treated as the field moving, so trail, flame, thunderstrike, pop letters, move delay, typing blink-hold and newline snap never ran, and Smooth jumped instead of easing.
- The canvas caret keeps blinking when idle. After about a second without input the loop stopped during a blink hold, leaving the caret stuck invisible or solid.
- Unloading or suspending Roam Caret while the canvas engine was still loading no longer brings the lite caret back with no way to remove it.
- A field under a Roam dialog or the command palette no longer draws its caret on top of it.
- Typing with an input method (Japanese, Chinese, Korean, dead-key accents) shows the caret during composition.
- Number and email fields keep the browser's own caret; the custom one could not follow their cursor.
- The Settings preview keeps a caret while Roam Caret is disabled.
- In canvas mode, **Hide Roam's caret** off now leaves Roam's caret visible.

### Changed
- The hidden lite caret stops its blink animation, so reading costs no idle frames.
- Canvas mode measures once per frame while typing instead of on every input, selection and key event.
- Drag-selecting text no longer keeps the position follow running.
- README: install from Roam Depot, a settings table, and the Studio effects list.

## [0.6.4] - 2026-09-28

### Fixed
- The caret no longer stays behind when the field it sits in moves without changing size. The command palette zooms in from half scale, so the caret was measured once at the small first frame and left floating over the list while the field's own caret stayed hidden. A dragged or reflowing Chief of Staff panel, or a hotkey such as Alt-J that shifts the page, did the same. After focus, a palette or panel mount, a transition or animation on the field or a parent, a modifier hotkey, Enter, Escape or a pointer drag, the caret now reads the field's box once per frame until it holds still for four frames, one second at most. Plain typing adds no frame.

## [0.6.3] - 2026-09-24

### Fixed
- The Studio takes typing when you open it from Roam Depot. Roam's Settings dialog pulled focus back into itself one frame after the Studio preview got it, so keys went to the dialog. Focus inside the Studio now stops before that check, and closing the Studio puts focus back on the Open button.
- Opening Roam Depot no longer draws the custom caret in its fields. Roam focuses the first text field in Settings when it opens, and the caret drew there. In Roam Depot and the Studio only the preview draws the custom caret. Name, number and colour fields keep the browser caret. A block still focused under the Studio or the Settings dialog draws nothing.
- The preview caret shows only when it sits wholly inside the preview box. In canvas mode the caret and its effects are clipped to that box.
- Canvas mode stops drawing the last caret when focus leaves a text field.
- Both previews stop their key and input events at the field, as Chief of Staff's composer does. If a listener that runs first cancels a key, the preview types the character itself.

### Changed
- **Styles** sits directly under **Look**, always lists saved and imported styles, and shows the current one. **Save as** puts the name field and **Save** on one row. Save adds the name to Styles and makes it the current look. Copy shares that name. Import adds the code's name to Styles and selects it.
- Each keystroke costs one style recalc less. The measure used to replace the letter under the caret with a new text node every time. It now edits that node in place, as it already did for the line. The glow shadow string is built once per colour, not on every key.

Bench on Readwisenotes (live 0.6.2, before this release), per key against Roam Caret detached: layouts +1.00, style recalcs +1.59, script +2.62 ms at 120 ms; +0.96, +0.87, +2.45 ms at 30 ms. A profiled run put all Roam Caret code at 0.115 ms per key of self time, no function above 0.04 ms. The rest of the script gap is the one allowed forced layout and noise: it moved from +2.6 to +5.6 ms between identical runs. In Roam's own Chromium, a new text node per measure costs one style recalc and an in-place edit costs none. So this release should drop the recalc gap by one. That is not re-benched until it is live.

## [0.6.2] - 2026-09-24

### Fixed
- Studio preview accepts typing. The key is no longer stopped before it reaches the box.
- Opening Studio hides the page caret, so it does not sit on top of the panel. Studio controls keep the browser caret. The preview still uses the custom one.

## [0.6.1] - 2026-09-24

### Fixed
- Typing in the Studio preview and in the preview on the Roam Caret tab works. Roam's key handler no longer swallows the keys. Escape still closes the Studio.
- **Style name**, **Save style** and, when Look is Custom, **Saved styles** now sit directly under **Look** on the Roam Caret tab, above Shape and the colours.

## [0.6.0] - 2026-09-24

### Changed
- The caret measures once per frame, after the key, not inside the input event. Typing, selection, and scroll in the same frame share that one measure.
- Whether the command palette is open is checked on focus, not by watching every DOM change on the page.
- Long blocks lay out only the current paragraph. Earlier paragraphs are cached until the width or the font changes.
- **Style name** and **Save style** store a look under a name. **Look** lists it. When Look is Custom, **Saved styles** appears so you can load one. A copied share code is that name plus the look. Importing the README example adds **Teal**.
- Selected text in the focused field uses the caret colour. The colour is set when the field is focused, not on each key.

### Fixed
- Diagnose can suspend and resume the caret for a bench without writing settings or the graph.

Live before/after key timings were not re-run. The Roam window was not idle.

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
