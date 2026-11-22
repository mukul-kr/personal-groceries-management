# Solo Kitchen PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the home-screen pantry app described in `docs/superpowers/specs/2026-11-22-solo-kitchen-pwa-design.md`.

**Architecture:**
- Pure ES-module core (`src/core/`). All decisions and every state change are computed there as plain data, with `now` and `newId` injected.
- A thin IndexedDB layer (`src/store/db.js`) applies change sets atomically.
- Vanilla UI modules (`src/ui/`) render from an in-memory copy of the data and call core commands.
- Undo is the inverse change set.

**Tech Stack:**
- Plain JavaScript ES modules, IndexedDB, Service Worker, Web App Manifest.
- `node --test` (Node 22) for the core.
- Headless Chrome screenshots for the UI.
- No dependencies and no build step.

## Global Constraints

- **No framework, no npm dependencies, no build step.** `package.json` only sets `"type": "module"` and the test script.
- **All data stays on the device** (IndexedDB). No network calls except quick-commerce search links the user taps.
- **Time:** epoch milliseconds. `DAY = 86_400_000`. Core functions never call `Date.now()`; they take `now`.
- **Units:** `'g' | 'ml' | 'pcs'`, stored as plain numbers.
- **Deduction order:** soonest `expiresAt` first.
- **Ranking:** `Σ max(0, 5 − daysLeft)` (optional ingredient ×0.5), +2 if planned, −3 if cooked <2 days ago, −1 if cooked <5 days ago. Tie-break: minutes, then name.
- **Usage rate:** applies only with ≥2 consumption events spanning ≥7 days. Window 30 days.
- **Shopping triggers:** `daysToRunOut ≤ warnDays` (default 3) / `stock ≤ lowAt` / planned meal missing it / manual add.
- **Freeze prompt:** `shelf.fresh ≤ 2`, `shelf.frozen != null`, `qty > mealUse`, not dismissed.
- **Undo toast:** 6 seconds.
- **Commits:** authored as `mukul-kr <mukul0000kumar@gmail.com>` (repo-local config already set); push to `origin main`.
- **Copy:** plain, user-side wording ("Update stock", "Threw away"). No emoji as markers.
- **Phone layout:** iPhone 17 width 402 px. Safe-area insets. Touch targets ≥44 px. Light and dark themes.

## File map

| File | Responsibility |
|---|---|
| `package.json` | `{"type":"module","scripts":{"test":"node --test"}}` |
| `src/core/dates.js` | `DAY`, `daysLeft`, `daysSince`, `formatDaysLeft` |
| `src/core/units.js` | `formatQty(qty, unit)` |
| `src/core/expiry.js` | expiry on buy / open / freeze / thaw, `isExpired` |
| `src/core/stock.js` | live batches, totals, `planDeduction`, `cookStatus` |
| `src/core/rank.js` | `rankMeals` with reasons |
| `src/core/forecast.js` | `usageRate`, `daysToRunOut` |
| `src/core/shopping.js` | `buildShoppingList`, `bestNextBuys`, `freezeSuggestions` |
| `src/core/changes.js` | change-set shape, `applyChanges` (in memory), `invertChanges` |
| `src/core/commands.js` | `buy`, `cook`, `adjust`, `open`, `freeze`, `thaw`, `useUp`, `throwAway`, `dismissFreeze` → change sets |
| `src/core/seed.js` | `buildMeals(raw, items)`, `mergeSeed(existing, builtin)` |
| `src/core/backup.js` | `makeBackup`, `parseBackup` |
| `src/data/catalog.js` | 74 items with full fields |
| `src/data/meals.js` | 118 raw meals (needs/optional/amount overrides) |
| `src/store/db.js` | IndexedDB open/migrate, `loadAll`, `commit(changes)`, `replaceAll(data)` |
| `src/ui/*.js` | app shell, router, screens, components |
| `index.html`, `styles.css`, `manifest.webmanifest`, `icons/`, `sw.js` | shell, styles, installability, offline |
| `test/*.test.js` | one per core module + `data.test.js` |

## Shared data shapes (all tasks use these exact names)

```js
// Item
{ id, name, cat, unit: 'g'|'ml'|'pcs', usualPack: number, source: 'online'|'store',
  shelf: { fresh: days, opened: days|null, frozen: days|null }, lowAt: number,
  deduct: boolean, mealUse: number, edited?: boolean, note?: string }
// Purchase
{ id, itemId, qty, boughtAt, expiresAt, state: 'sealed'|'opened'|'frozen', freezeDismissed?: boolean }
// Meal (built)
{ id, name, minutes, protein, tags: string[], steps: string[],
  ingredients: [{ itemId, qty, optional }], edited?: boolean }
// History
{ id, at, type: 'bought'|'cooked'|'used'|'wasted'|'adjusted'|'froze'|'opened'|'thawed',
  itemId?, mealId?, qty?, purchaseId? }
// Settings (single record, id 'settings')
{ id: 'settings', planned: [], skipped: [], manualShop: [], warnDays: 3,
  searchProvider: 'blinkit', lastBackupAt: null, schemaVersion: 1 }
// State (in memory)
{ items: Item[], purchases: Purchase[], meals: Meal[], history: History[], settings }
// Change set
{ put: { items?: [], purchases?: [], meals?: [], history?: [], settings?: [] },
  del: { purchases?: [id], history?: [id], ... } }
```

---

### Task 1: Project scaffold, dates, units, expiry

**Files:** create `package.json`, `src/core/dates.js`, `src/core/units.js`, `src/core/expiry.js`, `test/dates-units.test.js`, `test/expiry.test.js`. Remove the old `test/logic.test.js` once Task 4 supersedes it (kept until then).

**Produces:**
- `DAY`
- `daysLeft(expiresAt, now) → integer` (ceil of the remaining days; 0 or less means expired)
- `daysSince(at, now) → number`
- `formatDaysLeft(n) → 'expired'|'today'|'tomorrow'|'N days'|'N wks'|'months'`
- `formatQty(qty, unit) → string`
- `expiryOnBuy(item, boughtAt)`
- `applyOpen(p, item, now)`
- `applyFreeze(p, item, now)`, which throws `Error('cannot freeze <id>')` when `shelf.frozen` is null
- `applyThaw(p, now)`, which sets state 'opened' and expiry to now + 1 day
- `isExpired(p, now)`

- [ ] **Step 1: Failing tests.**
  - `daysLeft(now + 1.2*DAY, now) === 2`
  - `daysLeft(now + 0.5*DAY, now) === 1`
  - `daysLeft(now - 1, now) <= 0`
  - `formatDaysLeft`: 0 → 'today', 1 → 'tomorrow', 5 → '5 days', 20 → '3 wks', 90 → 'months', -1 → 'expired'
  - `formatQty`: (1200,'g') → '1.2 kg', (200,'g') → '200 g', (1000,'ml') → '1 L', (3,'pcs') → '3', (2.5,'pcs') → '2.5'
  - `expiryOnBuy({shelf:{fresh:5}}, t) === t + 5*DAY`
  - `applyOpen`: a sealed puree (expires t+365d, opened 5) opened at t+10d expires at t+15d. A paneer expiring tomorrow keeps tomorrow.
  - `applyFreeze` sets state 'frozen' and expiry now + frozen days; throws for `frozen:null`.
  - `applyThaw` gives state 'opened', expiry now + DAY.
  - `isExpired` is true when `expiresAt <= now`.
- [ ] **Step 2:** `node --test` should FAIL (modules missing).
- [ ] **Step 3:** Implement the three modules (each about 15–30 lines).
- [ ] **Step 4:** `node --test` should PASS.
- [ ] **Step 5:** Commit `feat(core): dates, units, expiry`.

### Task 2: Stock math and cook status

**Files:** `src/core/stock.js`, `test/stock.test.js`

**Consumes:** `isExpired`, `daysLeft`

**Produces:**
- `liveBatches(purchases, itemId, now) → Purchase[]`: not expired, qty > 0, sorted by `expiresAt` ascending.
- `totalQty(purchases, itemId, now, {includeFrozen=true}={}) → number`
- `planDeduction(purchases, itemId, qty, now) → { takes: [{purchaseId, qty}], short: number }`: takes from soonest expiry first; `short` is the amount not available.
- `cookStatus(meal, itemsById, purchases, now) → { cookable, missing: [{itemId, need, have}], needsThaw, uses: [{itemId, optional, daysLeft}] }`, with these rules:
  - A required ingredient whose item has `deduct:false` needs `total > 0`.
  - A `deduct:true` ingredient needs `total >= qty`.
  - `needsThaw` is true when non-frozen total < qty but total including frozen ≥ qty.
  - `uses` lists required ingredients plus optional ones that are present, each with the `daysLeft` of its first live batch (non-frozen preferred).

- [ ] **Step 1: Failing tests** (fixed `now`, two egg batches expiring in 3d/qty 2 and 20d/qty 12):
  - `planDeduction(..., 'eggs', 3)` gives takes `[{a,2},{b,1}]`, short 0.
  - Asking for 20 gives short 6.
  - An expired batch is ignored.
  - `cookStatus` with salt (deduct:false, qty 1, stock 1) and eggs need 3 with stock 14 → cookable.
  - Eggs need 3, stock 2 → missing `[{eggs, need 3, have 2}]`.
  - Chicken: only a frozen batch of 500 and need 250 → cookable with needsThaw true.
  - An optional item that's absent doesn't block and is not listed in `uses`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(core): stock math and cook status`.

### Task 3: Ranking

**Files:** `src/core/rank.js`, `test/rank.test.js`

**Consumes:** `cookStatus`, `daysSince`, `formatDaysLeft`

**Produces:** `rankMeals(state, now) → [{ meal, status, score, reasons: string[] }]`. Only cookable and non-skipped meals are included, sorted by score descending, then minutes ascending, then name.

Each reason reads like `'Uses paneer (tomorrow)'`. Take the top 2 ingredients by urgency that have a bonus > 0. Add `'Planned'` if planned, and `'Cooked 1 day ago'` when the meal has a repeat penalty.

- [ ] **Step 1: Failing tests:**
  - Paneer expiring tomorrow gives a paneer meal score 4 and outranks an egg meal (eggs in 20d, score 0).
  - An optional ingredient expiring today (bonus 5) adds 2.5.
  - Planned adds +2.
  - Cooked 1 day ago gives −3; cooked 3 days ago gives −1.
  - Skipped meals are excluded.
  - On a tie, the 10-minute meal comes before the 20-minute one.
  - The reasons array contains `'Uses paneer (tomorrow)'`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(core): meal ranking`.

### Task 4: Forecast, shopping, freeze suggestions

**Files:** `src/core/forecast.js`, `src/core/shopping.js`, `test/forecast.test.js`, `test/shopping.test.js`

**Produces:**
- `usageRate(history, itemId, now) → number|null`
  - Consumption counts `'used'` qty plus `|qty|` of `'adjusted'` entries with qty < 0, within the last 30 days.
  - Needs at least 2 events, with the earliest at least 7 days before now. `daysCovered = min(30, daysSince(earliest))`.
- `daysToRunOut(stock, rate) → number|null`
- `buildShoppingList(state, now) → [{ itemId, qty, source, reasons: string[] }]`
  - Reasons: `'out in Nd'`, `'low'`, `'plan'`, `'added'`. Duplicates merge their reasons.
  - `qty` = `item.usualPack`.
- `bestNextBuys(state, now, limit = 3) → [{ itemId, unlocks }]`: items whose single usual pack makes a non-cookable, non-skipped meal cookable. Excludes items already on the list. Only `unlocks > 0`, sorted descending.
- `freezeSuggestions(state, now) → [{ purchaseId, itemId, keepQty, freezeQty }]`

- [ ] **Step 1: Failing tests:**
  - **usageRate:** one event gives null. Two events spanning 5 days gives null. Events 10 and 2 days ago totalling 20 pcs give 2/day. An adjusted −4 counts. A wasted event doesn't count.
  - **daysToRunOut:** (6, 2) → 3; (6, null) → null.
  - **Shopping list:**
    - Eggs with stock 6, rate 2/day, warnDays 3 → listed with 'out in 3d'.
    - Curd at stock ≤ lowAt → 'low'.
    - A planned meal missing rotis → 'plan'.
    - `settings.manualShop` containing 'soy' → 'added'.
    - An item that is both low and planned has one row with two reasons.
  - **bestNextBuys:** the old web-page scenario (roti unlocks the roll) → `[{ itemId: 'roti', unlocks: 1 }]`.
  - **freezeSuggestions:** chicken (fresh 2, frozen 90, mealUse 250) with a 500 g sealed purchase → keep 250 / freeze 250. Dismissed gives none. A frozen purchase gives none.
- [ ] **Step 2–4:** FAIL → implement → PASS. Delete `logic.js` and `test/logic.test.js` (superseded).
- [ ] **Step 5:** Commit `feat(core): forecast, shopping list, freeze suggestions`.

### Task 5: Change sets and commands (with undo)

**Files:** `src/core/changes.js`, `src/core/commands.js`, `test/commands.test.js`

**Produces:**
- `applyChanges(state, changes) → newState`: pure. `put` upserts by id; `del` removes by id; `settings` is a single record.
- `invertChanges(state, changes) → changes`: the inverse computed against the pre-change state.
- Commands. Each takes `(state, args, now, newId)` and returns a change set; `newId()` returns unique strings.
  - `buy(state, { lines: [{itemId, qty}] }, now, newId)`: one purchase per line (`expiresAt = expiryOnBuy`) plus a `bought` history entry. Removes those items from `settings.manualShop`.
  - `cook(state, { mealId, lines: [{itemId, qty}] }, now, newId)`: deducts via `planDeduction` for each `deduct:true` line, writes `used` history per item and one `cooked` entry, and removes the meal from `settings.planned`.
  - `adjust(state, { purchaseId, qty }, now, newId)`: sets qty and writes an `adjusted` entry with `qty: new − old`.
  - `open(state, { purchaseId }, ...)`, `freeze(state, { purchaseId, qty? }, ...)` and `thaw(state, { purchaseId }, ...)`:
    - `freeze` with a qty smaller than the purchase splits it: the original keeps `qty − freezeQty` and a new frozen purchase gets `freezeQty`.
  - `useUp(state, { purchaseId }, ...)` sets qty to 0 and writes `used` with the remaining qty. `throwAway(state, { purchaseId }, ...)` sets qty to 0 and writes `wasted`.
  - `dismissFreeze(state, { purchaseId })` sets `freezeDismissed: true`.

- [ ] **Step 1: Failing tests:**
  - **buy:** eggs 12 → a purchase expiring at now + 21d plus history 'bought'.
  - **cook:** kadai paneer with paneer 100 from batches of 50 (tomorrow) and 200 (5d) → takes 50 then 50. Salt is not deducted. Writes a 'cooked' history entry and drops the meal from planned.
  - **freeze split:** 500 → 250 sealed + 250 frozen.
  - **Undo round trip:** `applyChanges(applyChanges(s, c), invertChanges(s, c))` deep-equals `s` for buy, cook and freeze-split.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(core): commands as change sets with undo`.

### Task 6: Seed, backup, catalog and meal data

**Files:** `src/core/seed.js`, `src/core/backup.js`, `src/data/catalog.js`, `src/data/meals.js`, `test/seed-backup.test.js`, `test/data.test.js`. Delete the old `data.js` (its meals move to `src/data/meals.js`).

**Produces:**
- `buildMeals(rawMeals, items) → Meal[]`
  - Raw meal: `{ id, name, time, needs, optional, tags, protein, how, amounts? }`.
  - `qty = amounts[id] ?? item.mealUse`. `steps` = `how` split after each `. `.
- `mergeSeed(existing, builtin) → array`: adds new ids; replaces built-ins whose existing copy is not `edited`; keeps edited and user-only records.
- `makeBackup(state, now) → object` and `parseBackup(text, schemaVersion) → { ok: true, data } | { ok: false, error }`.
  - Errors in plain words: "This file isn't a Solo Kitchen backup.", "This backup is from a newer version of the app.", "Backup is damaged: purchase p7 refers to an unknown item."
- `catalog.js` exports `items` (74, with `usualPack`, `source`, `shelf`, `lowAt`, `deduct`, `mealUse`), `categories` and `starterStock`.
- `meals.js` exports `rawMeals` (118, from the old `data.js` plus `amounts` overrides where the default `mealUse` is wrong for that dish).

- [ ] **Step 1: Failing tests:**
  - **seed:** an edited item is kept; an unedited one is replaced; a new built-in is added; a user-only item is kept.
  - **backup:** round trip; bad JSON; a newer `schemaVersion`; a dangling `itemId` is rejected.
  - **data:** every meal ingredient id exists; every qty > 0; ≥100 meals; every item has a shelf with `fresh > 0`; `usualPack > 0`; `source` in (online, store); `unit` valid.
- [ ] **Step 2–4:** FAIL → write the data and modules → PASS.
- [ ] **Step 5:** Commit `feat(data): full catalog fields, meal amounts, seed + backup`.

### Task 7: Storage + app shell + Stock + ＋ sheet

**Files:** `src/store/db.js`, `index.html` (replaced), `styles.css`, `src/ui/app.js` (state, commit, undo toast, router), `src/ui/components.js` (sheet, toast, stepper, pill, esc), `src/ui/stock.js`, `src/ui/plus.js`. Delete the old `app.js`.

**db.js API:**
- `open()`
- `loadAll() → state` (seeds on first run via `mergeSeed` + `buildMeals`; requests `navigator.storage.persist()`)
- `commit(changes)`: one readwrite transaction across stores
- `replaceAll(data)`

The DB is named `solo-kitchen`, version 1, with stores `items`, `purchases`, `meals`, `history`, `settings` (keyPath `id`).

**app.js:**
- Holds `state` in memory.
- `run(command, args, label)` computes changes, inverse, `applyChanges`, `db.commit`, re-render, and shows a toast with Undo. On a db error it shows "Couldn't save. Your last change was not stored." and reloads state.
- Routes: `#today #cook #stock #shop #settings`. ＋ opens the sheet over the current route.

**Stock screen:**
- Segments: Goes bad first / Fridge / Pantry / Freezer. Search.
- Sections: This week (≤7d) / Later / Running low.
- Rows merge an item's batches.
- The item sheet has: stepper (adjust), Opened, Freeze/Thaw, Used it all, Threw away, "Use it in" (top 4 meals), and "Your pattern".

**＋ sheet:**
- Search, then tile groups "Store run" and "Usually online".
- Tap cycles 1→2→3→0 packs; long-press opens an exact amount input.
- **Add N items** runs `buy`.

- [ ] **Step 1:** Serve with `python3 -m http.server 8080`.
- [ ] **Step 2:** Verify in headless Chrome at 402 px, in light and dark, via a `?demo` flag. It loads deterministic demo stock and skips IndexedDB, so screenshots are reproducible.
- [ ] **Step 3:** Commit `feat(ui): storage, shell, stock, add sheet`.

### Task 8: Today + Cook + cook flow

**Files:** `src/ui/today.js`, `src/ui/cook.js`, `src/ui/meal.js` (detail + confirm sheet)

**Today:**
- The hero shows `rankMeals` filtered by the chips (≤10 min, ≤20 min, protein, style). "Something else" advances the index; "Let's cook" opens the meal detail. "1 of N".
- **Heads up:**
  - expired batches (Check: Threw away / Still good → adjust expiry +2d via `adjust`-like `extend` command — implemented as `open` with a fresh `expiresAt`; add `extend(state, {purchaseId, days})` to commands with a test)
  - `freezeSuggestions` (Freeze N / Keep all)
  - run-out items ("Eggs run out in ~3 days · On list")
  - a backup nudge after 14 days
- A gear icon goes to Settings.

**Cook:**
- Search, then a segment Can cook / Need 1 / All with counts, then chips.
- Rows show one context line. Swipe left = skip, swipe right = plan (pointer events, 80 px threshold); the detail view has the same actions as buttons.

**Meal detail:** amounts, steps, "Done, I cooked it", then the confirm sheet with steppers (deduct:true only) and "Left after", then **Update stock** runs `cook`.

- [ ] **Step 1:** Add `extend` to commands with a test (expiry + days, history 'adjusted' qty 0) → run tests.
- [ ] **Step 2:** Build the screens, then take screenshots of Today, Cook, the detail page and the confirm sheet at 402 px.
- [ ] **Step 3:** Commit `feat(ui): today, cook, cooking flow`.

### Task 9: Shop

**Files:** `src/ui/shop.js`

- Sections **Order online** and **Pick up from store**, from `buildShoppingList`.
- Reason pills on each row. Online rows get a search link using `settings.searchProvider`:
  - `blinkit` → `https://blinkit.com/s/?q=<name>` (verified 200)
  - `zepto` → `https://www.zeptonow.com/search?query=<name>`
  - `instamart` → `https://www.swiggy.com/instamart/search?query=<name>`
  - The Settings label notes that Zepto and Instamart are unverified.
- Greyed `bestNextBuys` rows ("+N meals"), each with a tap to add to `manualShop`.
- Ticks are kept in UI memory. **Bought N** runs `buy` with usual packs. **Copy list** uses `navigator.clipboard` and falls back to a select-all textarea.
- A "Planned meals" list with remove.

- [ ] **Step 1:** Build, then screenshot.
- [ ] **Step 2:** Commit `feat(ui): shop`.

### Task 10: Settings, backup, PWA, deploy

**Files:** `src/ui/settings.js`, `manifest.webmanifest`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png` (generated with a small Node script drawing on raw PNG, or Chrome headless screenshot of an HTML icon), `sw.js`, `README.md` (updated)

**Settings:**
- Item editor (usual pack, source, lowAt, shelf days, deduct); saving sets `edited: true`.
- Warn days, search provider.
- **Export backup:** the Web Share API with a file when available, else a download link built from a Blob.
- **Import backup:** a file input, then `parseBackup`, then `replaceAll`.
- "Last backup N days ago".

**sw.js:** cache name `solo-kitchen-v<N>`; precache the app files; cache-first; delete old caches on activate.

**index.html:** registers the SW and adds the `apple-mobile-web-app-capable` and status-bar meta tags, plus the manifest link.

**Deploy:** enable GitHub Pages from `main` / root via the API using the Keychain token (`POST /repos/mukul-kr/personal-groceries-management/pages`). Then confirm the live URL returns 200.

- [ ] **Step 1:** Build, then screenshot Settings. `node --test` should be green.
- [ ] **Step 2:** Commit, push, enable Pages, then curl the live URL.
- [ ] **Step 3:** Give the user the URL plus the steps to install it on the phone (Safari → Share → Add to Home Screen).
