// ?demo: a believable kitchen held in memory only (nothing is saved).
import { DAY } from '../core/dates.js';
import { starterStock } from '../data/catalog.js';
import { freshState } from '../core/seed.js';
import { applyChanges } from '../core/changes.js';
import * as cmd from '../core/commands.js';

export function demoState(items, meals, now) {
  let n = 0;
  const id = () => `demo${++n}`;
  let s = freshState(items, meals);
  const byId = Object.fromEntries(items.map(i => [i.id, i]));
  const buyAt = (ids, daysAgo, qty) => {
    s = applyChanges(s, cmd.buy(s, { lines: ids.map(i => ({ itemId: i, qty: qty ?? byId[i].usualPack })) }, now - daysAgo * DAY, id));
  };

  buyAt(starterStock.filter(i => !['tomato', 'curd', 'eggs', 'bread'].includes(i)), 12);
  buyAt(['tomato'], 5);
  buyAt(['bread'], 2);
  buyAt(['paneer'], 5);            // goes bad tomorrow
  buyAt(['chicken'], 0);           // fresh from the shop today → freeze prompt
  buyAt(['curd'], 3);
  buyAt(['capsicum', 'cheese'], 3);
  buyAt(['eggs'], 11);

  // A couple of weeks of eating eggs → run-out forecast.
  for (const [daysAgo, q] of [[10, 3], [7, 2], [4, 3], [1, 2]]) {
    s = applyChanges(s, cmd.cook(s, { mealId: 'egg_bhurji_roti', lines: [{ itemId: 'eggs', qty: q }] }, now - daysAgo * DAY, id));
  }
  // Masoor running low.
  const masoor = s.purchases.find(p => p.itemId === 'masoor');
  s = applyChanges(s, cmd.adjust(s, { purchaseId: masoor.id, qty: 150 }, now - 2 * DAY, id));
  // Curd opened.
  s = applyChanges(s, cmd.open(s, { purchaseId: s.purchases.find(p => p.itemId === 'curd').id }, now - DAY, id));
  // Extra frozen chicken from last week.
  buyAt(['chicken'], 8, 250);
  const old = s.purchases.filter(p => p.itemId === 'chicken').at(-1);
  s = applyChanges(s, cmd.freeze(s, { purchaseId: old.id }, now - 8 * DAY, id));

  s = applyChanges(s, cmd.setSettings(s, { planned: ['chicken_roll'], lastBackupAt: now - 20 * DAY }, now, id));
  return s;
}
