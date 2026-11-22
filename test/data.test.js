import test from 'node:test';
import assert from 'node:assert/strict';
import { items, categories, starterStock } from '../src/data/catalog.js';
import { rawMeals } from '../src/data/meals.js';
import { buildMeals } from '../src/core/seed.js';

const byId = Object.fromEntries(items.map(i => [i.id, i]));

test('catalog items are complete and valid', () => {
  assert.equal(new Set(items.map(i => i.id)).size, items.length, 'unique ids');
  for (const i of items) {
    assert.ok(categories[i.cat], `${i.id}: category`);
    assert.ok(['g', 'ml', 'pcs'].includes(i.unit), `${i.id}: unit`);
    assert.ok(i.usualPack > 0, `${i.id}: usualPack`);
    assert.ok(['online', 'store'].includes(i.source), `${i.id}: source`);
    assert.ok(i.shelf && i.shelf.fresh > 0, `${i.id}: shelf.fresh`);
    assert.ok(i.lowAt >= 0, `${i.id}: lowAt`);
    assert.equal(typeof i.deduct, 'boolean', `${i.id}: deduct`);
    assert.ok(i.mealUse > 0, `${i.id}: mealUse`);
  }
  for (const id of starterStock) assert.ok(byId[id], `starter: ${id}`);
});

test('meals reference real items with positive amounts', () => {
  const ids = new Set(rawMeals.map(m => m.id));
  assert.equal(ids.size, rawMeals.length, 'unique meal ids');
  assert.ok(rawMeals.length >= 100, `only ${rawMeals.length} meals`);
  for (const m of buildMeals(rawMeals, items)) {
    assert.ok(m.name && m.minutes > 0 && m.steps.length && m.protein, `${m.id}: fields`);
    for (const ing of m.ingredients) {
      assert.ok(byId[ing.itemId], `${m.id} uses unknown ${ing.itemId}`);
      assert.ok(ing.qty > 0, `${m.id}: ${ing.itemId} qty`);
    }
  }
  for (const m of rawMeals) for (const k of Object.keys(m.amounts || {})) {
    assert.ok([...m.needs, ...m.optional].includes(k), `${m.id}: amount for unused ${k}`);
  }
});
