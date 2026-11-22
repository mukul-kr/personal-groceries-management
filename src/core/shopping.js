import { totalQty, cookStatus } from './stock.js';
import { usageRate, daysToRunOut } from './forecast.js';

const byId = items => Object.fromEntries(items.map(i => [i.id, i]));

export function buildShoppingList(state, now) {
  const items = byId(state.items);
  const { planned = [], manualShop = [], warnDays = 3 } = state.settings;
  const rows = new Map();
  const add = (itemId, reason) => {
    const item = items[itemId];
    if (!item) return;
    if (!rows.has(itemId)) rows.set(itemId, { itemId, qty: item.usualPack, source: item.source, reasons: [] });
    const r = rows.get(itemId);
    if (!r.reasons.includes(reason)) r.reasons.push(reason);
  };

  for (const item of state.items) {
    const stock = totalQty(state.purchases, item.id, now);
    const left = daysToRunOut(stock, usageRate(state.history, item.id, now));
    const hasHistory = left != null;
    if (hasHistory && left <= warnDays) add(item.id, `out in ${Math.max(0, Math.floor(left))}d`);
    else if (stock <= item.lowAt && (stock > 0 || state.history.some(h => h.itemId === item.id) || item.lowAt > 0)) add(item.id, 'low');
  }
  for (const mealId of planned) {
    const meal = state.meals.find(m => m.id === mealId);
    if (!meal) continue;
    for (const m of cookStatus(meal, items, state.purchases, now).missing) add(m.itemId, 'plan');
  }
  for (const id of manualShop) add(id, 'added');
  return [...rows.values()];
}

// Items whose usual pack alone would make a currently-uncookable meal cookable.
export function bestNextBuys(state, now, limit = 3) {
  const items = byId(state.items);
  const listed = new Set(buildShoppingList(state, now).map(r => r.itemId));
  const skipped = new Set(state.settings.skipped || []);
  const counts = new Map();
  for (const meal of state.meals) {
    if (skipped.has(meal.id)) continue;
    const { missing } = cookStatus(meal, items, state.purchases, now);
    if (missing.length !== 1) continue;
    const [m] = missing;
    const item = items[m.itemId];
    if (!item || listed.has(m.itemId)) continue;
    if (item.deduct && m.have + item.usualPack < m.need) continue;
    counts.set(m.itemId, (counts.get(m.itemId) || 0) + 1);
  }
  return [...counts]
    .map(([itemId, unlocks]) => ({ itemId, unlocks }))
    .sort((a, b) => b.unlocks - a.unlocks || a.itemId.localeCompare(b.itemId))
    .slice(0, limit);
}

export function freezeSuggestions(state, now) {
  const items = byId(state.items);
  return state.purchases
    .filter(p => {
      const item = items[p.itemId];
      return item && p.state !== 'frozen' && !p.freezeDismissed && p.expiresAt > now &&
        item.shelf.fresh <= 2 && item.shelf.frozen != null && p.qty > item.mealUse;
    })
    .map(p => ({ purchaseId: p.id, itemId: p.itemId, keepQty: items[p.itemId].mealUse, freezeQty: p.qty - items[p.itemId].mealUse }));
}
