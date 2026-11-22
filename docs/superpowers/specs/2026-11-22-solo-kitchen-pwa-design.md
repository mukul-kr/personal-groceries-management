# Solo Kitchen: home-screen pantry app (design)

Date: 2026-11-22
Status: design approved in brainstorming; awaiting spec review

## Goal

One person cooking alone in India wants to stop thinking about groceries and dinner. The app keeps an exact, local record of what's in the kitchen. It says what to cook next (favouring things about to go bad) and what to buy next. Logging must take one or two taps, because pantry apps die when logging is tedious.

## Constraints

- **Platform:** web app installed to the iPhone 17 home screen from Safari (PWA). No native app, which avoids the 7-day reinstall of free Apple ID signing.
- **Data stays on the phone** (IndexedDB). No account, no server, no cloud sync in v1.
- **Hosting:** GitHub Pages on a public repo (code only, never user data). The repo lives under a separate personal GitHub account, not the one currently logged in on this Mac. At deploy time that account is added with `gh auth login` and the remote points to it. Until then all work stays local.
- **No framework and no build step.** Plain ES modules. Local dev uses `python3 -m http.server`.
- **Buying habits:**
  - Mostly quick commerce (Blinkit, Zepto, Instamart, Amazon Fresh, Flipkart Minutes).
  - Some items come from a local store: chicken for freshness, optionally vegetables.
  - Quantities are mostly the same each time ("usual pack").
- **Cooking setup:** gas stove and a kettle. No blender or oven.

## Out of scope for v1

- Pasting or parsing orders from quick-commerce apps. Tick-off-list plus usual packs covers it. Revisit if odd quantities become common.
- Push notifications. A morning reminder would need a push server; Today screen surfaces urgency on open instead.
- Cloud sync and multiple devices.
- Barcode or receipt scanning, and nutrition data.

## Features

### Screens

Bottom bar: **Today · Cook · ＋ · Stock · Shop**. Settings is reached from a gear icon on Today.

**Today** (opens first; layout "B: one pick")
- A big card with the single best meal to cook now, the reason ("Uses paneer before it goes bad tomorrow"), and **Something else** / **Let's cook**.
- "Something else" moves to the next-ranked meal. The card shows "1 of N".
- Quick filter chips under the card: ≤10 min, protein chips, style chips. Filters re-rank immediately.
- A **Heads up** section with:
  - expired items to check or throw away
  - freeze prompts
  - items running out ("Eggs run out in ~3 days · On list")

**Cook**
- Search by meal or ingredient.
- Segmented control: **Can cook / Need 1 / All**, each with a count.
- Filter chips for time, protein and style.
- Meals are listed in the same ranking order as Today, each with one line of context: what it uses that's going bad, "cooked N days ago", "need: X", or "<item> low after this".
- Swipe left: "not for me" (hidden; restorable from a "Skipped" filter). Swipe right: add to plan.
- Tap a meal to open its detail: amounts, steps, **Done, I cooked it**.

**Cook confirm sheet**
- Opens after "Done". Every tracked ingredient appears with its recipe amount pre-filled and a −/+ stepper.
- Shows "Left after: …".
- **Update stock** deducts the amounts and logs the meal as cooked.

**＋ (I bought…) sheet**
- A search field for any item, then a grid of tiles in two groups, "Store run" and "Usually online". Each tile shows the item's usual pack.
- One tap selects one usual pack, a second tap makes it two, and a long-press lets you type an exact amount.
- **Add N items** creates purchases with auto-computed expiry and shows a toast with **Undo**.

**Stock**
- Default sort is "goes bad first", with sections **This week / Later / Running low**.
- Segmented views: Fridge / Pantry / Freezer. Search.
- Multiple purchases of one item show together ("Eggs 3 + 12 · 6 d / 20 d").
- Tap an item to open its detail sheet:
  - amount stepper
  - **Opened**, **Freeze** / **Thaw**, **Used it all**, **Threw away**
  - "Use it in" meal list
  - "Your pattern" (usual pack, how often you buy it, source)

**Shop**
- Two sections, each with a count: **Order online** and **Pick up from store**.
- Each row: item + usual pack + reason pill (`out in Nd`, `low`, `plan`, `+N meals`).
- Online rows have a search link (Blinkit by default; configurable). The URL format must be verified before shipping; if it can't be verified, drop the link and keep Copy list.
- **Copy list** copies the online section as text.
- **Bought N** moves ticked items into stock at their usual packs, with Undo.

**Settings**
- **Items:** usual pack, source (online/store), running-low level, shelf life overrides, whether a meal deducts it.
- **Meals:** add or edit.
- **Warn me N days ahead:** default 3.
- **Export backup / Import backup.**
- "Last backup N days ago"; Today shows a nudge after 14 days.

### Behaviours

**Expiry**
- Bought: `expiresAt = boughtAt + shelf.fresh`.
- Opened: `min(current, now + shelf.opened)`.
- Frozen: `now + shelf.frozen`.
- Thawed: `now + 1 day`.
- Expired purchases are excluded from stock totals and listed in Today's Heads up as "check or throw away".

**Deduction**
- "I cooked this" and manual use take from the purchase that **expires soonest** first.
- If stock is short, it deducts what exists and tells the user.

**Basics and masalas**
- These have quantities, but meals never deduct them (salt, oil, ghee, turmeric, chilli, jeera, mustard, garam masala, coriander powder, pepper, hing, sugar, and all masalas or sauces marked `deduct: false`).
- The user marks them low manually.

**Cookable**
- Every non-optional, deducting ingredient has enough non-expired stock.
- Non-deducting items only need to be present (any amount > 0).
- If any required stock is frozen, the meal is still cookable but shows "thaw first".

**Ranking** (applies to cookable meals that aren't skipped)

```
score = Σ over used ingredients: max(0, 5 − daysLeft)   (optional present: ×0.5)
      + 2 if planned
      − 3 if cooked in last 2 days, − 1 if cooked in last 5 days
tie-break: fewer minutes first
```

`daysLeft` comes from the soonest-expiring purchase that will be used. Each meal carries its top two reasons as text.

**Usage rate and run-out**
- `rate = amount used in last 30 days / days covered`. Used means cooked, used up, or adjusted down; thrown away does not count.
- The rate only applies with at least 2 usage events spanning 7 or more days. Before that, only the running-low level applies.
- `daysToRunOut = stock / rate`.

**Shopping list**

An item is added when any of these holds:
- `daysToRunOut ≤ warnDays`
- `stock ≤ lowAt`
- a planned meal is missing it
- the user adds it manually

"Best next buy" suggestions (top 3 by meals unlocked, `+N meals`) appear as greyed rows the user can tap to add. Rows are grouped by source.

**Freeze prompt**
- Shown for items with `shelf.fresh ≤ 2` days and `canFreeze`, when a fresh purchase holds more than one meal's typical use.
- It offers to split off the excess as a frozen purchase. "Keep all" dismisses it for that purchase.

**Undo**
- Every stock-changing action (add, bought, cooked, used, threw away, freeze) shows a toast with Undo for 6 seconds.
- Undo reverses the stock change and removes the history entry.

## Data

| Store | Fields |
|---|---|
| `items` | `id, name, unit (g\|ml\|pcs), usualPack, source (online\|store), shelf {fresh, opened, frozen} (days; frozen null = can't freeze), lowAt, deduct (bool), mealUse (typical per meal), edited (bool)` |
| `purchases` | `id, itemId, qty, boughtAt, expiresAt, state (sealed\|opened\|frozen)` |
| `meals` | `id, name, minutes, protein, tags[], steps[], ingredients [{itemId, qty, optional}], edited (bool)` |
| `history` | `id, at, type (bought\|cooked\|used\|wasted\|adjusted\|froze\|opened), itemId?, mealId?, qty?, purchaseId?` |
| `settings` | `planned[], skipped[], warnDays, searchProvider, lastBackupAt, schemaVersion` |

- **Seeding:** the built-in catalog (74 items) and meals (118, with exact amounts) load on first launch. On later versions, new ids are added and built-ins are updated only where `edited` is false.
- **Schema version:** each change ships a migration. The DB never opens with an unknown newer version.
- **Persistence:** `navigator.storage.persist()` is requested on first launch.
- **Backup:** one JSON file `{schemaVersion, exportedAt, items, purchases, meals, history, settings}`. Import validates everything before writing and then replaces all data in a single transaction. If validation fails, it shows the reason and changes nothing.

## Architecture

```
index.html, styles.css, manifest.webmanifest, icons/, sw.js
src/data/   catalog.js, meals.js
src/core/   expiry.js, stock.js, rank.js, forecast.js, shopping.js, seed.js, backup.js   ← pure, injected `now`
src/store/  db.js     ← the only IndexedDB code; thin async API
src/ui/     router.js (hash routes: #today #cook #stock #shop #settings), today.js, cook.js, stock.js, shop.js, plus.js, settings.js, components.js (sheet, toast, stepper, chip)
test/       one node --test file per core module, plus a data validation test
```

- **Core** functions are pure: inputs in, results out, no DOM, no storage, and `now` passed as an argument.
- **UI** reads through `db.js`, calls core, and renders. State changes go through `db.js` and then re-render.
- **Service worker:** caches app files cache-first under a versioned cache name; a new deploy activates on next open.

## Visual design

- Light and dark themes come from the system setting.
- Green accent; red, amber, green and blue pills for urgency and frozen.
- System font. iOS-style bottom sheets and segmented controls.
- Safe-area insets for the iPhone 17 home indicator and Dynamic Island.
- Touch targets at least 44 pt.
- Mockups from brainstorming are in `.superpowers/brainstorm/` (not committed).

## Testing

- **Approach:** TDD for everything in `src/core/`. Tests are written first from the behaviours above, using fixed dates.
- **Core coverage:**
  - expiry transitions
  - soonest-expiry deduction, including short stock
  - cookable rules (frozen, non-deducting items)
  - ranking order and reasons
  - usage rate thresholds
  - shopping list reasons and grouping
  - seed merge that respects `edited`
  - backup round-trip and rejection of bad files
- **Data test:** every meal ingredient exists in the catalog, amounts are positive, and units match.
- **UI checks:**
  - headless Chrome screenshots at iPhone 17 width (402 px) in light and dark
  - a manual run on the phone after deploy: install to home screen, log purchases, cook, export and import

## Build order

Each step is committed and leaves a working tree.

1. Core logic + tests (expiry, stock, rank, forecast, shopping, seed, backup).
2. Catalog fields (usual pack, shelf life, source, deduct, mealUse) + exact amounts for all 118 meals, plus the data test.
3. `db.js` + Stock and ＋ screens. Purchases can be logged from this point.
4. Today + Cook + cook confirm with deduction.
5. Shop.
6. Settings, backup, manifest, service worker, then deploy to GitHub Pages.

The current single-page app (`index.html`, `app.js`, `data.js`, `logic.js`) is replaced by this structure. Its meal data is carried into `src/data/`.
