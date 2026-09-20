# Roam Caret

Lite CSS caret for Roam Research. Canvas only when an effect needs it. Native settings live under **Settings → Roam Depot → Roam Caret**. Command palette: Open settings / Studio / Toggle / Random look / Cycle preset / Diagnose.

Saved options use a JSON blob (`options`) as source of truth; selected fields mirror to `cs-*` keys for Roam Depot. Roam Grid and Plexus diagram textareas (`.rg-root`, `.pxd-root`) keep the native caret.

## Install and update

Standing path is GitHub Pages. In Roam: **Settings → Roam Depot → Developer mode → Developer Extensions → URL**. Enter:

`https://svyk.github.io/roam-cursor-smith`

Include `https://`. Do not append `/extension.js`. Confirm `/README.md` and `/extension.js` both resolve publicly.

Developer extensions are per client, not graph-synced. After a push to `main`, wait for Pages, then `Ctrl-D` then `Ctrl-R`. If `window.__ROAM_CURSOR_SMITH_VERSION` stays old, remove that exact URL entry and re-add it. Do not graph-hard-reload.

## Builtin Svy look

**Svy** preset: **Beam** shape, `#00695e` light / `#48d0c0` dark, 3px width, glow on, no blink. **Match Svy Theme colors** (Depot toggle) reads `--svy-beam-caret-light` and `--svy-beam-caret-dark` from the active theme.

## Share code (Svy)

```
eyJfX25hbWUiOiJTdnkiLCJjdXJzb3JTdHlsZSI6IkJlYW0iLCJjb2xvckRhcmsiOiIjNDhkMGMwIiwiY29sb3JMaWdodCI6IiMwMDY5NWUiLCJncmFkaWVudEVuYWJsZWQiOmZhbHNlLCJncmFkaWVudENvdW50IjoyLCJncmFkaWVudERhcmsxIjoiIzM5ZmYxNCIsImdyYWRpZW50RGFyazIiOiIjMDBkNGZmIiwiZ3JhZGllbnREYXJrMyI6IiNiMTRhZmYiLCJncmFkaWVudERhcms0IjoiI2ZmMmU4OCIsImdyYWRpZW50TGlnaHQxIjoiIzFmOGEzYiIsImdyYWRpZW50TGlnaHQyIjoiIzAwNzdiNiIsImdyYWRpZW50TGlnaHQzIjoiIzcwMjhjOCIsImdyYWRpZW50TGlnaHQ0IjoiI2MyMTg1YiIsImNhcmV0V2lkdGhQeCI6MywiY3Vyc29yT3BhY2l0eSI6MSwiZ2xvdyI6dHJ1ZSwic2hvd0NoYXIiOmZhbHNlLCJsaW5lU2VyaWZzIjpmYWxzZSwidW5kZXJsaW5lV2lkdGhQeCI6MCwiYm94SG9sbG93IjpmYWxzZSwiYm94SG9sbG93V2lkdGgiOjIsImJsaW5raW5nRW5hYmxlZCI6ZmFsc2UsImJsaW5rU3BlZWQiOjEuMiwiYmxpbmtPbk9mZkJhbGFuY2UiOjAuNSwiYmxpbmtEZWxheU1zIjowLCJibGlua0JyZWF0aGluZyI6ZmFsc2UsImJsaW5rQnJlYXRoRGVwdGgiOjAuMiwic21vb3RoRW5hYmxlZCI6ZmFsc2UsInNtb290aFN0b3BCbGlua2luZyI6dHJ1ZSwic21vb3RobmVzcyI6MC4xNSwiY2F0Y2hVcFNwZWVkIjowLjU1LCJtYXhDYXRjaFVwU3BlZWQiOjAuODUsInNtb290aEFkYXB0aXZlIjp0cnVlLCJzbmFwT25OZXdsaW5lIjp0cnVlLCJtb3ZlRGVsYXlNcyI6MCwic21lYXIiOmZhbHNlLCJzbWVhclN0aWZmbmVzcyI6MC42LCJzbWVhclRyYWlsaW5nU3RpZmZuZXNzIjowLjQsInNtZWFyRGFtcGluZyI6MC44LCJzbWVhclRhcGVyIjpmYWxzZSwic21lYXJUYXBlckFtb3VudCI6MC43LCJwb3BMZXR0ZXJzIjpmYWxzZSwicG9wUmFpbmJvdyI6ZmFsc2UsImZsYW1lVHJhaWwiOmZhbHNlLCJiYWNrc3BhY2VEaXNpbnRlZ3JhdGUiOmZhbHNlLCJ0aHVuZGVyc3RyaWtlIjpmYWxzZSwidGh1bmRlcnN0cmlrZVNpemUiOjIsInRodW5kZXJzdHJpa2VTdHJlbmd0aCI6MC41LCJzdGFyZHVzdEVuYWJsZWQiOmZhbHNlLCJzdGFyZHVzdEFsd2F5c09uIjpmYWxzZSwic3RhcmR1c3REZWxheU1zIjoyMDAwLCJzdGFyZHVzdFJhdGUiOjEsInN0YXJkdXN0T3JiaXQiOmZhbHNlLCJzdGFyZHVzdE9yYml0UmFkaXVzIjoyMiwic3BlZWREZW1vbiI6ZmFsc2UsInNwZWVkRGVtb25TcGFya3MiOnRydWUsInNwZWVkRGVtb25TZW5zaXRpdml0eSI6MSwic3BlZWREZW1vblNwYXJrUXVhbnRpdHkiOjEsInNwZWVkRGVtb25TcGFya1RyYWlsIjowLCJlbmVyZ3lFZmZlY3QiOmZhbHNlLCJlbmVyZ3lTcGVlZCI6MSwiZW5lcmd5QXVyb3JhIjpmYWxzZSwiY3J0RWZmZWN0IjpmYWxzZSwidHJhaWxMZW5ndGgiOjEwLCJ0cmFpbEZhZGVNcyI6NDUwLCJ0b3JjaEVmZmVjdCI6ZmFsc2UsIm92ZXJsYXlGb2xsb3dNb2RlIjoiY2FyZXQiLCJvdmVybGF5UmFkaXVzIjoyNTAsIm92ZXJsYXlEYXJrbmVzcyI6MC43LCJvdmVybGF5SW50ZW5zaXR5IjowLjEsIm92ZXJsYXlDb2xvciI6IiNmZjk2M2MiLCJvdmVybGF5RmxpY2tlciI6ZmFsc2UsIm92ZXJsYXlCbGlua1N5bmMiOmZhbHNlLCJvdmVybGF5QmxpbmtEZXB0aCI6MC4yNSwib3ZlcmxheVNwZWVkIjowLjIyLCJpZGxlRmFkZUVuYWJsZWQiOmZhbHNlLCJpZGxlRmFkZURlbGF5TXMiOjQwMDAsImlkbGVGYWRlVG8iOjAuMjUsImlkbGVEcmlmdCI6ZmFsc2UsInNlbGVjdGlvbkNvbG9yRW5hYmxlZCI6ZmFsc2UsInNlbGVjdGlvbkNvbG9yRGFyayI6IiNmZmQxNjYiLCJzZWxlY3Rpb25Db2xvckxpZ2h0IjoiI2IwNmYwMCIsInJvd1R5cGVUaW50IjpmYWxzZSwicm93VHlwZVRpbnRBbW91bnQiOjQ1LCJnaG9zdEVuYWJsZWQiOmZhbHNlLCJnaG9zdE9wYWNpdHkiOjAuMywiZ2hvc3RMYWciOjAuMDgsImNvbWJvRW5hYmxlZCI6ZmFsc2UsImNvbWJvVGhyZXNob2xkIjoyNSwiY29tYm9HbG93Ijp0cnVlLCJjb21ib1Nob3dlciI6dHJ1ZSwic2hha2VFbmFibGVkIjpmYWxzZSwic2hha2VTdHJlbmd0aCI6Mywic2hha2VEdXJhdGlvbk1zIjoxODAsInNvdW5kRW5hYmxlZCI6ZmFsc2UsInNvdW5kVm9sdW1lIjowLjE1LCJzb3VuZFBpdGNoIjoxLCJzb3VuZFZhcmlhdGlvbiI6MC4yNX0
```

Import via **Share code to import** in Depot settings or **Roam Caret: Studio**.

## Commands

- Roam Caret: Open settings
- Roam Caret: Studio
- Roam Caret: Toggle on/off
- Roam Caret: Random look
- Roam Caret: Cycle preset
- Roam Caret: Diagnose caret (5s)

## License

[MIT](LICENSE).

Derived from Cursor-Smith (MIT) by Sadsnake1.
