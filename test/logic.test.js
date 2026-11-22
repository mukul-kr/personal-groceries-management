const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../logic.js');
const DATA = require('../data.js');

const ING = [
  { id: 'salt', cat: 'basics' },
  { id: 'eggs', cat: 'fresh' },
  { id: 'onion', cat: 'fresh' },
  { id: 'roti', cat: 'frozen' },
  { id: 'paneer', cat: 'fresh' },
  { id: 'cheese', cat: 'fridge' },
];
const REC = [
  { id: 'bhurji', needs: ['eggs', 'onion', 'salt'], optional: ['cheese'] },
  { id: 'roll', needs: ['eggs', 'roti'], optional: [] },
  { id: 'paneer_roll', needs: ['paneer', 'roti'], optional: [] },
  { id: 'boiled', needs: ['eggs'], optional: [] },
];

test('missingFor lists only required ingredients you lack', () => {
  const have = new Set(['salt', 'eggs']);
  assert.deepEqual(L.missingFor(REC[0], have), ['onion']);
  assert.deepEqual(L.missingFor(REC[3], have), []);
});

test('cookable returns recipes with nothing missing; optional ignored', () => {
  const have = new Set(['salt', 'eggs', 'onion']);
  assert.deepEqual(L.cookable(REC, have).map(r => r.id), ['bhurji', 'boiled']);
});

test('almost returns recipes missing between 1 and n items', () => {
  const have = new Set(['salt', 'eggs', 'onion']);
  assert.deepEqual(L.almost(REC, have, 1).map(r => r.id), ['roll']);
  assert.deepEqual(L.almost(REC, have, 2).map(r => r.id).sort(), ['paneer_roll', 'roll']);
});

test('unlockScores ranks missing ingredients by meals they unlock alone', () => {
  const have = new Set(['salt', 'eggs', 'onion']);
  const scores = L.unlockScores(REC, ING, have);
  const roti = scores.find(s => s.id === 'roti');
  assert.equal(roti.unlocks, 1);      // roll
  assert.equal(roti.usedIn, 2);       // roll + paneer_roll
  assert.equal(scores[0].id, 'roti'); // highest first
  assert.ok(!scores.some(s => s.id === 'eggs'), 'owned items are excluded');
  const cheese = scores.find(s => s.id === 'cheese');
  assert.equal(cheese.unlocks, 0);
  assert.equal(cheese.usedIn, 1);     // optional use still counts as "used in"
});

test('shoppingList merges missing items of chosen recipes without duplicates', () => {
  const have = new Set(['salt']);
  const list = L.shoppingList([REC[0], REC[1]], have);
  assert.deepEqual(list.sort(), ['eggs', 'onion', 'roti']);
});

test('validateData flags unknown ingredient ids and duplicate ids', () => {
  const bad = L.validateData(ING, [
    ...REC,
    { id: 'x', needs: ['ghost'], optional: ['phantom'] },
    { id: 'x', needs: ['eggs'], optional: [] },
  ]);
  assert.ok(bad.some(e => e.includes('ghost')));
  assert.ok(bad.some(e => e.includes('phantom')));
  assert.ok(bad.some(e => e.includes('duplicate') && e.includes('x')));
  assert.deepEqual(L.validateData(ING, REC), []);
});

test('the real data file is valid and large enough to rotate', () => {
  assert.deepEqual(L.validateData(DATA.ingredients, DATA.recipes), []);
  assert.ok(DATA.recipes.length >= 100, `only ${DATA.recipes.length} recipes`);
  for (const r of DATA.recipes) {
    assert.ok(r.name && r.time && r.how, `${r.id} needs name, time, how`);
    assert.ok(r.needs.length > 0, `${r.id} needs at least one ingredient`);
  }
  for (const i of DATA.ingredients) {
    assert.ok(DATA.categories[i.cat], `${i.id} has unknown category ${i.cat}`);
  }
  for (const id of DATA.starter) {
    assert.ok(DATA.ingredients.some(i => i.id === id), `starter has unknown ${id}`);
  }
});
