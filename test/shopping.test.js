import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY } from '../src/core/dates.js';
import { usageRate, daysToRunOut } from '../src/core/forecast.js';
import { buildShoppingList, bestNextBuys, freezeSuggestions } from '../src/core/shopping.js';

const now = Date.UTC(2026, 10, 22, 12);
const H = (type, itemId, qty, daysAgo) => ({ id: `${type}${itemId}${daysAgo}`, type, itemId, qty, at: now - daysAgo * DAY });

test('usageRate needs 2+ events spanning 7+ days', () => {
  assert.equal(usageRate([H('used', 'eggs', 3, 2)], 'eggs', now), null);
  assert.equal(usageRate([H('used', 'eggs', 3, 5), H('used', 'eggs', 3, 2)], 'eggs', now), null);
  assert.equal(usageRate([H('used', 'eggs', 12, 10), H('used', 'eggs', 8, 2)], 'eggs', now), 2);
});

test('usageRate counts downward adjustments, ignores waste and other items', () => {
  const h = [H('used', 'eggs', 12, 10), H('adjusted', 'eggs', -4, 3), H('adjusted', 'eggs', 5, 3),
    H('wasted', 'eggs', 6, 2), H('used', 'curd', 100, 2)];
  assert.equal(usageRate(h, 'eggs', now), 1.6);
});

test('usageRate uses a 30-day window', () => {
  const h = [H('used', 'eggs', 100, 45), H('used', 'eggs', 15, 20), H('used', 'eggs', 15, 1)];
  assert.equal(usageRate(h, 'eggs', now), 1.5); // 30 over 20 days covered
});

test('daysToRunOut', () => {
  assert.equal(daysToRunOut(6, 2), 3);
  assert.equal(daysToRunOut(6, null), null);
});

// ── shopping list ──
const item = (id, extra = {}) => ({ id, name: id, unit: 'pcs', usualPack: 1, source: 'online', lowAt: 0, deduct: true, mealUse: 1,
  shelf: { fresh: 30, opened: null, frozen: null }, ...extra });
const P = (id, itemId, qty, days = 30, state = 'sealed') => ({ id, itemId, qty, boughtAt: now, expiresAt: now + days * DAY, state });
const base = () => ({
  items: [item('eggs', { usualPack: 12 }), item('curd', { usualPack: 400, lowAt: 100 }), item('roti', { usualPack: 10, source: 'store' }),
    item('soy'), item('onion')],
  purchases: [P('e', 'eggs', 6), P('c', 'curd', 80), P('o', 'onion', 3)],
  meals: [{ id: 'roll', name: 'roll', minutes: 10, ingredients: [{ itemId: 'roti', qty: 2, optional: false }, { itemId: 'onion', qty: 1, optional: false }] }],
  history: [H('used', 'eggs', 12, 10), H('used', 'eggs', 8, 2)],
  settings: { planned: ['roll'], skipped: [], manualShop: ['soy'], warnDays: 3 },
});

test('buildShoppingList collects reasons with usual packs and sources', () => {
  const list = buildShoppingList(base(), now);
  const by = Object.fromEntries(list.map(l => [l.itemId, l]));
  assert.deepEqual(by.eggs, { itemId: 'eggs', qty: 12, source: 'online', reasons: ['out in 3d'] });
  assert.deepEqual(by.curd.reasons, ['low']);
  assert.deepEqual(by.roti, { itemId: 'roti', qty: 10, source: 'store', reasons: ['plan'] });
  assert.deepEqual(by.soy.reasons, ['added']);
  assert.equal(by.onion, undefined);
});

test('one row per item even with several reasons', () => {
  const s = base();
  s.meals[0].ingredients.push({ itemId: 'curd', qty: 200, optional: false });
  const curd = buildShoppingList(s, now).filter(l => l.itemId === 'curd');
  assert.equal(curd.length, 1);
  assert.deepEqual(curd[0].reasons, ['low', 'plan']);
});

test('bestNextBuys ranks items that unlock meals, skipping ones already listed', () => {
  const s = base();
  s.settings.planned = [];
  s.meals.push({ id: 'chaat', name: 'chaat', minutes: 5, ingredients: [{ itemId: 'onion', qty: 1, optional: false }, { itemId: 'lemon', qty: 1, optional: false }] });
  s.items.push(item('lemon', { usualPack: 4 }));
  assert.deepEqual(bestNextBuys(s, now), [{ itemId: 'lemon', unlocks: 1 }, { itemId: 'roti', unlocks: 1 }]);
  s.settings.manualShop.push('lemon');
  assert.deepEqual(bestNextBuys(s, now), [{ itemId: 'roti', unlocks: 1 }]);
});

test('freezeSuggestions for short-life, freezable items holding more than a meal', () => {
  const chicken = item('chicken', { unit: 'g', mealUse: 250, shelf: { fresh: 2, opened: null, frozen: 90 } });
  const s = { ...base(), items: [chicken], purchases: [P('c1', 'chicken', 500, 2)] };
  assert.deepEqual(freezeSuggestions(s, now), [{ purchaseId: 'c1', itemId: 'chicken', keepQty: 250, freezeQty: 250 }]);
  s.purchases = [{ ...P('c1', 'chicken', 500, 2), freezeDismissed: true }];
  assert.deepEqual(freezeSuggestions(s, now), []);
  s.purchases = [P('c2', 'chicken', 500, 80, 'frozen'), P('c3', 'chicken', 250, 2)];
  assert.deepEqual(freezeSuggestions(s, now), []);
});
