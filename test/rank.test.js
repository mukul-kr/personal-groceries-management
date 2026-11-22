import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY } from '../src/core/dates.js';
import { rankMeals } from '../src/core/rank.js';

const now = Date.UTC(2026, 10, 22, 12);
const item = (id, name) => ({ id, name, deduct: true, mealUse: 1 });
const items = [item('paneer', 'Paneer'), item('eggs', 'Eggs'), item('tomato', 'Tomatoes'), item('roti', 'Frozen rotis')];
const P = (id, itemId, days) => ({ id, itemId, qty: 10, boughtAt: now, expiresAt: now + days * DAY, state: 'sealed' });
const M = (id, minutes, ingredients) => ({ id, name: id, minutes, protein: 'veg', tags: [], ingredients });
const req = itemId => ({ itemId, qty: 1, optional: false });
const opt = itemId => ({ itemId, qty: 1, optional: true });
const settings = { planned: [], skipped: [] };

function state(meals, purchases, extra = {}) {
  return { items, meals, purchases, history: [], settings: { ...settings, ...extra.settings }, ...extra.state };
}

test('ingredient going bad tomorrow lifts a meal above one with fresh stock', () => {
  const ranked = rankMeals(state(
    [M('omelette', 10, [req('eggs')]), M('bhurji', 12, [req('paneer')])],
    [P('p', 'paneer', 1), P('e', 'eggs', 20)]), now);
  assert.deepEqual(ranked.map(r => [r.meal.id, r.score]), [['bhurji', 4], ['omelette', 0]]);
  assert.deepEqual(ranked[0].reasons, ['Uses paneer (tomorrow)']);
});

test('optional ingredients count half', () => {
  const [r] = rankMeals(state([M('roll', 10, [req('roti'), opt('tomato')])], [P('r', 'roti', 60), P('t', 'tomato', 0.5)]), now);
  assert.equal(r.score, 2);  // tomato daysLeft 1 → 4 × 0.5
});

test('planned +2, cooked recently penalised, skipped excluded', () => {
  const meals = [M('a', 10, [req('eggs')]), M('b', 10, [req('eggs')]), M('c', 10, [req('eggs')]), M('d', 10, [req('eggs')])];
  const s = state(meals, [P('e', 'eggs', 20)], {
    settings: { planned: ['a'], skipped: ['d'] },
    state: { history: [
      { id: 'h1', type: 'cooked', mealId: 'b', at: now - 1 * DAY },
      { id: 'h2', type: 'cooked', mealId: 'c', at: now - 3 * DAY },
    ] },
  });
  const ranked = rankMeals(s, now);
  assert.deepEqual(ranked.map(r => [r.meal.id, r.score]), [['a', 2], ['c', -1], ['b', -3]]);
  assert.ok(ranked[0].reasons.includes('Planned'));
  assert.ok(ranked[2].reasons.includes('Cooked 1 day ago'));
});

test('ties go to the quicker meal, then name', () => {
  const ranked = rankMeals(state([M('slow', 20, [req('eggs')]), M('zfast', 10, [req('eggs')]), M('afast', 10, [req('eggs')])], [P('e', 'eggs', 20)]), now);
  assert.deepEqual(ranked.map(r => r.meal.id), ['afast', 'zfast', 'slow']);
});

test('uncookable meals are not ranked', () => {
  assert.equal(rankMeals(state([M('x', 10, [req('paneer')])], []), now).length, 0);
});
