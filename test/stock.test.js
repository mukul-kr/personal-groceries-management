import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY } from '../src/core/dates.js';
import { liveBatches, totalQty, planDeduction, cookStatus } from '../src/core/stock.js';

const now = Date.UTC(2026, 10, 22, 12);
const items = {
  eggs: { id: 'eggs', deduct: true, mealUse: 2 },
  salt: { id: 'salt', deduct: false, mealUse: 1 },
  chicken: { id: 'chicken', deduct: true, mealUse: 250 },
  cheese: { id: 'cheese', deduct: true, mealUse: 1 },
  paneer: { id: 'paneer', deduct: true, mealUse: 100 },
};
const P = (id, itemId, qty, days, state = 'sealed') => ({ id, itemId, qty, boughtAt: now - DAY, expiresAt: now + days * DAY, state });
const eggs = [P('b', 'eggs', 12, 20), P('a', 'eggs', 2, 3), P('x', 'eggs', 6, -1)];

test('liveBatches drops expired/empty and sorts by soonest expiry', () => {
  assert.deepEqual(liveBatches([...eggs, P('z', 'eggs', 0, 5)], 'eggs', now).map(p => p.id), ['a', 'b']);
});

test('totalQty sums live batches, optionally excluding frozen', () => {
  const ps = [P('c1', 'chicken', 250, 1), P('c2', 'chicken', 500, 80, 'frozen')];
  assert.equal(totalQty(ps, 'chicken', now), 750);
  assert.equal(totalQty(ps, 'chicken', now, { includeFrozen: false }), 250);
});

test('planDeduction takes soonest expiry first and reports shortfall', () => {
  assert.deepEqual(planDeduction(eggs, 'eggs', 3, now), { takes: [{ purchaseId: 'a', qty: 2 }, { purchaseId: 'b', qty: 1 }], short: 0 });
  assert.equal(planDeduction(eggs, 'eggs', 20, now).short, 6);
});

const meal = (ingredients) => ({ id: 'm', name: 'M', minutes: 10, ingredients });

test('cookStatus: non-deducting items only need to be present', () => {
  const s = cookStatus(meal([{ itemId: 'salt', qty: 1, optional: false }, { itemId: 'eggs', qty: 3, optional: false }]),
    items, [...eggs, P('s', 'salt', 1, 365)], now);
  assert.equal(s.cookable, true);
  assert.deepEqual(s.missing, []);
});

test('cookStatus reports what is short', () => {
  const s = cookStatus(meal([{ itemId: 'eggs', qty: 3, optional: false }]), items, [P('a', 'eggs', 2, 3)], now);
  assert.equal(s.cookable, false);
  assert.deepEqual(s.missing, [{ itemId: 'eggs', need: 3, have: 2 }]);
});

test('cookStatus: frozen stock counts but flags needsThaw', () => {
  const s = cookStatus(meal([{ itemId: 'chicken', qty: 250, optional: false }]), items, [P('c', 'chicken', 500, 80, 'frozen')], now);
  assert.equal(s.cookable, true);
  assert.equal(s.needsThaw, true);
});

test('cookStatus: optional never blocks; uses lists present ones with daysLeft', () => {
  const s = cookStatus(meal([
    { itemId: 'paneer', qty: 100, optional: false },
    { itemId: 'cheese', qty: 1, optional: true },
    { itemId: 'eggs', qty: 1, optional: true },
  ]), items, [P('p', 'paneer', 200, 1), ...eggs], now);
  assert.equal(s.cookable, true);
  assert.deepEqual(s.uses, [
    { itemId: 'paneer', optional: false, daysLeft: 1 },
    { itemId: 'eggs', optional: true, daysLeft: 3 },
  ]);
});
