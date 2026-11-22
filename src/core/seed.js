import { SCHEMA_VERSION } from './backup.js';

// Raw meal → built meal. Amount per ingredient: explicit override, else the
// item's typical per-meal use.
export function buildMeals(rawMeals, items) {
  const mealUse = Object.fromEntries(items.map(i => [i.id, i.mealUse]));
  const qty = (m, id) => m.amounts?.[id] ?? mealUse[id];
  return rawMeals.map(m => ({
    id: m.id,
    name: m.name,
    minutes: m.time,
    protein: m.protein,
    tags: m.tags,
    steps: m.how.split(/(?<=\.)\s+/).filter(Boolean),
    ingredients: [
      ...m.needs.map(id => ({ itemId: id, qty: qty(m, id), optional: false })),
      ...m.optional.map(id => ({ itemId: id, qty: qty(m, id), optional: true })),
    ],
  }));
}

// Bring built-in records up to date without touching anything the user edited.
export function mergeSeed(existing, builtin) {
  const byId = new Map(builtin.map(r => [r.id, r]));
  const seen = new Set();
  const out = existing.map(r => {
    seen.add(r.id);
    return !r.edited && byId.has(r.id) ? byId.get(r.id) : r;
  });
  for (const r of builtin) if (!seen.has(r.id)) out.push(r);
  return out;
}

export function defaultSettings() {
  return { id: 'settings', planned: [], skipped: [], manualShop: [], warnDays: 3,
    shopApps: ['blinkit', 'zepto', 'instamart', 'flipkart', 'amazon'], lastBackupAt: null, schemaVersion: SCHEMA_VERSION };
}

export function freshState(items, meals) {
  return { items, meals, purchases: [], history: [], settings: defaultSettings() };
}
