import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMeals, mergeSeed, freshState } from '../src/core/seed.js';
import { makeBackup, parseBackup, SCHEMA_VERSION } from '../src/core/backup.js';

const items = [
  { id: 'eggs', mealUse: 2 }, { id: 'onion', mealUse: 1 }, { id: 'cheese', mealUse: 1 },
];

test('buildMeals fills default amounts, applies overrides, splits steps', () => {
  const [m] = buildMeals([{ id: 'b', name: 'Bhurji', time: 12, needs: ['eggs', 'onion'], optional: ['cheese'],
    tags: ['breakfast'], protein: 'egg', how: 'Sauté onion. Scramble 3 eggs in.', amounts: { eggs: 3 } }], items);
  assert.deepEqual(m, {
    id: 'b', name: 'Bhurji', minutes: 12, protein: 'egg', tags: ['breakfast'],
    steps: ['Sauté onion.', 'Scramble 3 eggs in.'],
    ingredients: [{ itemId: 'eggs', qty: 3, optional: false }, { itemId: 'onion', qty: 1, optional: false }, { itemId: 'cheese', qty: 1, optional: true }],
  });
});

test('mergeSeed adds new, updates unedited, keeps edited and user-only', () => {
  const existing = [{ id: 'a', v: 1 }, { id: 'b', v: 1, edited: true }, { id: 'mine', v: 1, edited: true }];
  const builtin = [{ id: 'a', v: 2 }, { id: 'b', v: 2 }, { id: 'c', v: 2 }];
  assert.deepEqual(mergeSeed(existing, builtin), [{ id: 'a', v: 2 }, { id: 'b', v: 1, edited: true }, { id: 'mine', v: 1, edited: true }, { id: 'c', v: 2 }]);
});

test('freshState has settings defaults and no stock', () => {
  const s = freshState(items, []);
  assert.deepEqual(s.purchases, []);
  assert.equal(s.settings.id, 'settings');
  assert.equal(s.settings.warnDays, 3);
  assert.equal(s.settings.schemaVersion, SCHEMA_VERSION);
});

const state = () => ({
  items: [{ id: 'eggs' }], meals: [], history: [],
  purchases: [{ id: 'p1', itemId: 'eggs', qty: 12, boughtAt: 1, expiresAt: 2, state: 'sealed' }],
  settings: { id: 'settings', planned: [], skipped: [], manualShop: [], warnDays: 3, schemaVersion: SCHEMA_VERSION },
});

test('backup round-trips', () => {
  const text = JSON.stringify(makeBackup(state(), 123));
  const r = parseBackup(text);
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, { ...state(), settings: { ...state().settings } });
});

test('parseBackup rejects bad files with plain reasons', () => {
  assert.deepEqual(parseBackup('not json'), { ok: false, error: "This file isn't a Solo Kitchen backup." });
  assert.deepEqual(parseBackup('{"hello":1}'), { ok: false, error: "This file isn't a Solo Kitchen backup." });
  const newer = { ...makeBackup(state(), 1), schemaVersion: SCHEMA_VERSION + 1 };
  assert.deepEqual(parseBackup(JSON.stringify(newer)), { ok: false, error: 'This backup is from a newer version of the app. Update the app first.' });
  const dangling = makeBackup(state(), 1);
  dangling.purchases[0].itemId = 'ghost';
  assert.deepEqual(parseBackup(JSON.stringify(dangling)), { ok: false, error: 'Backup is damaged: purchase p1 refers to an unknown item.' });
});
