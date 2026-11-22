import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY } from '../src/core/dates.js';
import { applyChanges, invertChanges } from '../src/core/changes.js';
import * as cmd from '../src/core/commands.js';

const now = Date.UTC(2026, 10, 22, 12);
const ids = () => { let n = 0; return () => `n${++n}`; };

const items = [
  { id: 'eggs', unit: 'pcs', deduct: true, mealUse: 2, shelf: { fresh: 21, opened: null, frozen: null } },
  { id: 'paneer', unit: 'g', deduct: true, mealUse: 100, shelf: { fresh: 6, opened: 3, frozen: 60 } },
  { id: 'salt', unit: 'g', deduct: false, mealUse: 2, shelf: { fresh: 999, opened: null, frozen: null } },
  { id: 'chicken', unit: 'g', deduct: true, mealUse: 250, shelf: { fresh: 2, opened: null, frozen: 90 } },
];
const P = (id, itemId, qty, days, state = 'sealed') => ({ id, itemId, qty, boughtAt: now - DAY, expiresAt: now + days * DAY, state });
const base = () => ({
  items,
  meals: [{ id: 'kadai', name: 'Kadai paneer', minutes: 20, ingredients: [
    { itemId: 'paneer', qty: 100, optional: false }, { itemId: 'salt', qty: 2, optional: false }] }],
  purchases: [P('p1', 'paneer', 50, 1), P('p2', 'paneer', 200, 5), P('s1', 'salt', 500, 300), P('c1', 'chicken', 500, 2)],
  history: [],
  settings: { id: 'settings', planned: ['kadai'], skipped: [], manualShop: ['eggs'], warnDays: 3 },
});
const roundTrip = (s, c) => applyChanges(applyChanges(s, c), invertChanges(s, c));

test('buy creates purchases with expiry, logs history, clears manual shop entry', () => {
  const s = base();
  const c = cmd.buy(s, { lines: [{ itemId: 'eggs', qty: 12 }] }, now, ids());
  const next = applyChanges(s, c);
  const egg = next.purchases.find(p => p.itemId === 'eggs');
  assert.deepEqual(egg, { id: 'n1', itemId: 'eggs', qty: 12, boughtAt: now, expiresAt: now + 21 * DAY, state: 'sealed' });
  assert.deepEqual(next.history, [{ id: 'n2', at: now, type: 'bought', itemId: 'eggs', qty: 12, purchaseId: 'n1' }]);
  assert.deepEqual(next.settings.manualShop, []);
  assert.deepEqual(roundTrip(s, c), s);
});

test('cook deducts soonest-expiring first, skips non-deducting items, logs, unplans', () => {
  const s = base();
  const c = cmd.cook(s, { mealId: 'kadai', lines: [{ itemId: 'paneer', qty: 100 }, { itemId: 'salt', qty: 2 }] }, now, ids());
  const next = applyChanges(s, c);
  const q = id => next.purchases.find(p => p.id === id).qty;
  assert.equal(q('p1'), 0);
  assert.equal(q('p2'), 150);
  assert.equal(q('s1'), 500);
  assert.deepEqual(next.history.map(h => [h.type, h.itemId ?? h.mealId, h.qty]), [['used', 'paneer', 100], ['cooked', 'kadai', undefined]]);
  assert.deepEqual(next.settings.planned, []);
  assert.deepEqual(roundTrip(s, c), s);
});

test('freeze with a smaller qty splits the purchase', () => {
  const s = base();
  const c = cmd.freeze(s, { purchaseId: 'c1', qty: 250 }, now, ids());
  const next = applyChanges(s, c);
  const chicken = next.purchases.filter(p => p.itemId === 'chicken');
  assert.deepEqual(chicken.map(p => [p.qty, p.state, (p.expiresAt - now) / DAY]), [[250, 'sealed', 2], [250, 'frozen', 90]]);
  assert.deepEqual(roundTrip(s, c), s);
});

test('freeze whole purchase, then thaw', () => {
  const s = applyChanges(base(), cmd.freeze(base(), { purchaseId: 'c1' }, now, ids()));
  assert.equal(s.purchases.find(p => p.id === 'c1').state, 'frozen');
  const t = applyChanges(s, cmd.thaw(s, { purchaseId: 'c1' }, now, ids()));
  assert.equal(t.purchases.find(p => p.id === 'c1').expiresAt, now + DAY);
});

test('adjust records the delta; useUp and throwAway zero the purchase', () => {
  const s = base();
  const a = applyChanges(s, cmd.adjust(s, { purchaseId: 'p2', qty: 120 }, now, ids()));
  assert.deepEqual(a.history.at(-1), { id: 'n1', at: now, type: 'adjusted', itemId: 'paneer', qty: -80, purchaseId: 'p2' });
  const u = applyChanges(s, cmd.useUp(s, { purchaseId: 'p2' }, now, ids()));
  assert.equal(u.purchases.find(p => p.id === 'p2').qty, 0);
  assert.deepEqual([u.history.at(-1).type, u.history.at(-1).qty], ['used', 200]);
  const w = applyChanges(s, cmd.throwAway(s, { purchaseId: 'p1' }, now, ids()));
  assert.deepEqual([w.history.at(-1).type, w.history.at(-1).qty], ['wasted', 50]);
});

test('open, extend and dismissFreeze', () => {
  const s = base();
  const o = applyChanges(s, cmd.open(s, { purchaseId: 'p2' }, now, ids()));
  assert.equal(o.purchases.find(p => p.id === 'p2').expiresAt, now + 3 * DAY);
  const e = applyChanges(s, cmd.extend(s, { purchaseId: 'p1', days: 2 }, now, ids()));
  assert.equal(e.purchases.find(p => p.id === 'p1').expiresAt, now + 2 * DAY);
  const d = applyChanges(s, cmd.dismissFreeze(s, { purchaseId: 'c1' }, now, ids()));
  assert.equal(d.purchases.find(p => p.id === 'c1').freezeDismissed, true);
});

test('settings updates go through changes too', () => {
  const s = base();
  const c = cmd.setSettings(s, { skipped: ['kadai'] }, now, ids());
  assert.deepEqual(applyChanges(s, c).settings.skipped, ['kadai']);
  assert.deepEqual(roundTrip(s, c), s);
});
