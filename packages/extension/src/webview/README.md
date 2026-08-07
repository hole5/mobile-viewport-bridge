# Webview UI source

Design reference only: `ui-preview/ui2`.

| Path | Role |
|------|------|
| `index.html` | Shell markup |
| `styles/main.css` | Panel styles |
| `assets/ui-screen.png` | Phone chrome |
| `bridge.ts` | VS Code messaging |
| `devices.ts` | Device presets |
| `settings.ts` | Preferences |
| `constants.ts` | Mode meta / demo pickables |
| `app/runtime.ts` | UI orchestration |
| `main.ts` | Entry |

`npm run build` emits `media/webview/` — do not treat media as source.
