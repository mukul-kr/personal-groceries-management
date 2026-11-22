# Solo Kitchen

A home-screen app for one person cooking in India: what to cook next (using up what's about to go bad), what's in stock, and what to buy. Everything is stored on the phone. There's no account and no server.

Live: https://mukul-kr.github.io/personal-groceries-management/

## Install on iPhone

1. Open the link above in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Open it from the home-screen icon. That copy keeps its own data and works offline.

Back up from **Settings → Export backup** now and then (save to Files or iCloud Drive).

## Develop

```
python3 -m http.server 8080        # then open http://localhost:8080
open "http://localhost:8080/?demo"  # sample kitchen in memory, nothing saved
npm test                            # node --test, no dependencies
```

| Path | What's there |
|---|---|
| `src/core/` | Pure logic: expiry, stock, ranking, forecast, shopping list, commands (as undoable change sets), seed, backup. Fully tested. |
| `src/data/` | `catalog.js` (items: pack size, shelf life, source…) and `meals.js` (118 meals). Edit and run `npm test`. |
| `src/store/db.js` | The only IndexedDB code. |
| `src/ui/` | Screens: today, cook (+ meal), stock, shop, settings, plus (＋ sheet). |
| `sw.js` | Offline cache. **Bump `VERSION` on each deploy.** |
| `docs/superpowers/` | Design spec and implementation plan. |
