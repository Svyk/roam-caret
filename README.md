# Roam Caret

Lite CSS caret for Roam Research. Canvas only when an effect needs it. A plain Line (glow and letter off, no effects) colours the browser's own caret and runs no code per keystroke. Native settings live under **Settings → Roam Depot → Roam Caret**. Command palette: Open settings / Studio / Toggle / Random look / Cycle preset / Diagnose.

Saved options use a JSON blob (`options`) as source of truth; selected fields mirror to `cs-*` keys for Roam Depot. Roam Grid and Plexus diagram textareas (`.rg-root`, `.pxd-root`) keep the native caret.

## Install

In Roam: **Settings → Roam Depot → Browse**, search for **Roam Caret**, and install. Settings are under **Settings → Roam Depot → Roam Caret**.

## Settings

| Setting | What it does |
|---|---|
| Enabled | Turns the custom caret on or off. Off restores Roam's own caret. |
| Look | A built-in look, a saved style, or Custom. |
| Styles / Save as | Your saved and imported styles. See [Styles](#styles). |
| Shape | Line, Beam, Box or Underline. |
| Color (light) / Color (dark) | Caret colour for each Roam theme. Dark is used when Roam is dark, not when only the OS is. |
| Width (px) | Line and Beam width. |
| Glow | Soft halo around the caret. |
| Blink | Blink on or off. Speed, balance and delay are in the Studio. |
| Show letter in Box | Draws the letter under a solid Box caret. |
| Hide Roam's caret | Hides the browser caret while the custom one shows. |
| Hide when window unfocused | Hides the caret when Roam is not the focused window. |
| Copy share code / Share code to import / Import | Share a look as a code, or import one. |
| Open Studio | Every option with a live preview. |
| Preview | A field to try the current look. |

The **Studio** adds the canvas effects: smooth movement, smear, trail, flame trail, pop letters, backspace disintegrate, thunderstrike on Enter, stardust, speed sparks, energy, CRT, torch overlay, idle fade, selection colour, row tint, ghost caret, combo, screen shake and typing sounds, plus gradient colours and blink timing. Canvas mode loads only when one of these is on.

## Example share code

A teal Beam with glow and no effects, named Teal. Paste it into **Share code to import** on the Roam Caret tab (or in Studio), then press **Import**. The Look menu then shows Teal, and so does Styles.

```
eyJfX25hbWUiOiJUZWFsIiwiY3Vyc29yU3R5bGUiOiJCZWFtIiwiY29sb3JEYXJrIjoiIzVlZWFkNCIsImNvbG9yTGlnaHQiOiIjMDA2OTVlIiwiZ3JhZGllbnRFbmFibGVkIjpmYWxzZSwiZ3JhZGllbnRDb3VudCI6MiwiZ3JhZGllbnREYXJrMSI6IiMzOWZmMTQiLCJncmFkaWVudERhcmsyIjoiIzAwZDRmZiIsImdyYWRpZW50RGFyazMiOiIjYjE0YWZmIiwiZ3JhZGllbnREYXJrNCI6IiNmZjJlODgiLCJncmFkaWVudExpZ2h0MSI6IiMxZjhhM2IiLCJncmFkaWVudExpZ2h0MiI6IiMwMDc3YjYiLCJncmFkaWVudExpZ2h0MyI6IiM3MDI4YzgiLCJncmFkaWVudExpZ2h0NCI6IiNjMjE4NWIiLCJjYXJldFdpZHRoUHgiOjMsImN1cnNvck9wYWNpdHkiOjEsImdsb3ciOnRydWUsInNob3dDaGFyIjp0cnVlLCJsaW5lU2VyaWZzIjpmYWxzZSwidW5kZXJsaW5lV2lkdGhQeCI6MCwiYm94SG9sbG93IjpmYWxzZSwiYm94SG9sbG93V2lkdGgiOjIsImJsaW5raW5nRW5hYmxlZCI6ZmFsc2UsImJsaW5rU3BlZWQiOjEuMiwiYmxpbmtPbk9mZkJhbGFuY2UiOjAuNSwiYmxpbmtEZWxheU1zIjowLCJibGlua0JyZWF0aGluZyI6ZmFsc2UsImJsaW5rQnJlYXRoRGVwdGgiOjAuMiwic21vb3RoRW5hYmxlZCI6ZmFsc2UsInNtb290aFN0b3BCbGlua2luZyI6dHJ1ZSwic21vb3RobmVzcyI6MC4xNSwiY2F0Y2hVcFNwZWVkIjowLjU1LCJtYXhDYXRjaFVwU3BlZWQiOjAuODUsInNtb290aEFkYXB0aXZlIjp0cnVlLCJzbmFwT25OZXdsaW5lIjp0cnVlLCJtb3ZlRGVsYXlNcyI6MCwic21lYXIiOmZhbHNlLCJzbWVhclN0aWZmbmVzcyI6MC42LCJzbWVhclRyYWlsaW5nU3RpZmZuZXNzIjowLjQsInNtZWFyRGFtcGluZyI6MC44LCJzbWVhclRhcGVyIjpmYWxzZSwic21lYXJUYXBlckFtb3VudCI6MC43LCJwb3BMZXR0ZXJzIjpmYWxzZSwicG9wUmFpbmJvdyI6ZmFsc2UsImZsYW1lVHJhaWwiOmZhbHNlLCJiYWNrc3BhY2VEaXNpbnRlZ3JhdGUiOmZhbHNlLCJ0aHVuZGVyc3RyaWtlIjpmYWxzZSwidGh1bmRlcnN0cmlrZVNpemUiOjIsInRodW5kZXJzdHJpa2VTdHJlbmd0aCI6MC41LCJzdGFyZHVzdEVuYWJsZWQiOmZhbHNlLCJzdGFyZHVzdEFsd2F5c09uIjpmYWxzZSwic3RhcmR1c3REZWxheU1zIjoyMDAwLCJzdGFyZHVzdFJhdGUiOjEsInN0YXJkdXN0T3JiaXQiOmZhbHNlLCJzdGFyZHVzdE9yYml0UmFkaXVzIjoyMiwic3BlZWREZW1vbiI6ZmFsc2UsInNwZWVkRGVtb25TcGFya3MiOnRydWUsInNwZWVkRGVtb25TZW5zaXRpdml0eSI6MSwic3BlZWREZW1vblNwYXJrUXVhbnRpdHkiOjEsInNwZWVkRGVtb25TcGFya1RyYWlsIjowLCJlbmVyZ3lFZmZlY3QiOmZhbHNlLCJlbmVyZ3lTcGVlZCI6MSwiZW5lcmd5QXVyb3JhIjpmYWxzZSwiY3J0RWZmZWN0IjpmYWxzZSwidHJhaWxMZW5ndGgiOjEwLCJ0cmFpbEZhZGVNcyI6NDUwLCJ0b3JjaEVmZmVjdCI6ZmFsc2UsIm92ZXJsYXlGb2xsb3dNb2RlIjoiY2FyZXQiLCJvdmVybGF5UmFkaXVzIjoyNTAsIm92ZXJsYXlEYXJrbmVzcyI6MC43LCJvdmVybGF5SW50ZW5zaXR5IjowLjEsIm92ZXJsYXlDb2xvciI6IiNmZjk2M2MiLCJvdmVybGF5RmxpY2tlciI6ZmFsc2UsIm92ZXJsYXlCbGlua1N5bmMiOmZhbHNlLCJvdmVybGF5QmxpbmtEZXB0aCI6MC4yNSwib3ZlcmxheVNwZWVkIjowLjIyLCJpZGxlRmFkZUVuYWJsZWQiOmZhbHNlLCJpZGxlRmFkZURlbGF5TXMiOjQwMDAsImlkbGVGYWRlVG8iOjAuMjUsImlkbGVEcmlmdCI6ZmFsc2UsInNlbGVjdGlvbkNvbG9yRW5hYmxlZCI6ZmFsc2UsInNlbGVjdGlvbkNvbG9yRGFyayI6IiNmZmQxNjYiLCJzZWxlY3Rpb25Db2xvckxpZ2h0IjoiI2IwNmYwMCIsInJvd1R5cGVUaW50IjpmYWxzZSwicm93VHlwZVRpbnRBbW91bnQiOjQ1LCJnaG9zdEVuYWJsZWQiOmZhbHNlLCJnaG9zdE9wYWNpdHkiOjAuMywiZ2hvc3RMYWciOjAuMDgsImNvbWJvRW5hYmxlZCI6ZmFsc2UsImNvbWJvVGhyZXNob2xkIjoyNSwiY29tYm9HbG93Ijp0cnVlLCJjb21ib1Nob3dlciI6dHJ1ZSwic2hha2VFbmFibGVkIjpmYWxzZSwic2hha2VTdHJlbmd0aCI6Mywic2hha2VEdXJhdGlvbk1zIjoxODAsInNvdW5kRW5hYmxlZCI6ZmFsc2UsInNvdW5kVm9sdW1lIjowLjE1LCJzb3VuZFBpdGNoIjoxLCJzb3VuZFZhcmlhdGlvbiI6MC4yNX0
```

## Styles

Directly under **Look** on the Roam Caret tab:

- **Styles** lists every style you saved or imported, whatever Look is set to, and shows the current one. Pick a style to use it.
- **Save as** is a name field and a **Save** button on one row. Type a name and press **Save**. The look is stored under that name, Styles shows it, and it becomes the current look. An empty name saves under the shape (Beam, Line, Box, Underline). Saving an existing name updates that style. Built-in names, `Custom` and `Current` are refused.

**Copy share code** copies the current style's name and its look, nothing else. **Import** adds the code's name to Styles and selects it.

In Roam Depot and in the Studio only the preview draws the custom caret. Name, number and colour fields there keep the browser caret.

While a caret field has focus, selected text is highlighted in the caret colour.

## Commands

- Roam Caret: Open settings
- Roam Caret: Studio
- Roam Caret: Toggle on/off
- Roam Caret: Random look
- Roam Caret: Cycle preset
- Roam Caret: Diagnose caret (5s)

## License

[MIT](LICENSE).

## Development

`npm ci --ignore-scripts --no-audit --no-fund`, then `npm run check` (build, secret scan, tests, generated-file drift). Source is `src/`; `extension.js` and `extension.css` are generated. To test a build before release, add `https://svyk.github.io/roam-caret` under **Settings → Roam Depot → Developer mode → Developer Extensions → URL** (no `/extension.js`). The running version is `window.__ROAM_CURSOR_SMITH_VERSION`.
