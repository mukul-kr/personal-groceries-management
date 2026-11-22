// Every user action is computed here as a change set (see changes.js).
// Signature: (state, args, now, newId) => changes. Nothing is mutated.
import { DAY } from './dates.js';
import { changeSet } from './changes.js';
import { expiryOnBuy, applyOpen, applyFreeze, applyThaw } from './expiry.js';
import { planDeduction } from './stock.js';

const itemOf = (state, id) => state.items.find(i => i.id === id);
const purchaseOf = (state, id) => {
  const p = state.purchases.find(x => x.id === id);
  if (!p) throw new Error(`unknown purchase ${id}`);
  return p;
};
const log = (newId, now, fields) => ({ id: newId(), at: now, ...fields });

export function buy(state, { lines }, now, newId) {
  const c = changeSet();
  for (const { itemId, qty } of lines) {
    const item = itemOf(state, itemId);
    if (!item || !(qty > 0)) continue;
    const p = { id: newId(), itemId, qty, boughtAt: now, expiresAt: expiryOnBuy(item, now), state: 'sealed' };
    c.put('purchases', p);
    c.put('history', log(newId, now, { type: 'bought', itemId, qty, purchaseId: p.id }));
  }
  const bought = new Set(lines.map(l => l.itemId));
  const manualShop = (state.settings.manualShop || []).filter(id => !bought.has(id));
  if (manualShop.length !== (state.settings.manualShop || []).length) c.put('settings', { ...state.settings, manualShop });
  return c.done();
}

export function cook(state, { mealId, lines }, now, newId) {
  const c = changeSet();
  let purchases = state.purchases;
  for (const { itemId, qty } of lines) {
    const item = itemOf(state, itemId);
    if (!item || !item.deduct || !(qty > 0)) continue;
    const { takes } = planDeduction(purchases, itemId, qty, now);
    let used = 0;
    for (const t of takes) {
      const p = purchases.find(x => x.id === t.purchaseId);
      const updated = { ...p, qty: p.qty - t.qty };
      purchases = purchases.map(x => (x.id === p.id ? updated : x));
      c.put('purchases', updated);
      used += t.qty;
    }
    if (used > 0) c.put('history', log(newId, now, { type: 'used', itemId, qty: used }));
  }
  c.put('history', log(newId, now, { type: 'cooked', mealId }));
  if ((state.settings.planned || []).includes(mealId)) {
    c.put('settings', { ...state.settings, planned: state.settings.planned.filter(id => id !== mealId) });
  }
  return c.done();
}

export function adjust(state, { purchaseId, qty }, now, newId) {
  const p = purchaseOf(state, purchaseId);
  return changeSet()
    .put('purchases', { ...p, qty })
    .put('history', log(newId, now, { type: 'adjusted', itemId: p.itemId, qty: qty - p.qty, purchaseId }))
    .done();
}

export function open(state, { purchaseId }, now, newId) {
  const p = purchaseOf(state, purchaseId);
  return changeSet()
    .put('purchases', applyOpen(p, itemOf(state, p.itemId), now))
    .put('history', log(newId, now, { type: 'opened', itemId: p.itemId, purchaseId }))
    .done();
}

// Freeze all of a purchase, or split off `qty` as a new frozen purchase.
export function freeze(state, { purchaseId, qty }, now, newId) {
  const p = purchaseOf(state, purchaseId);
  const item = itemOf(state, p.itemId);
  const c = changeSet();
  if (qty != null && qty < p.qty) {
    const frozen = applyFreeze({ ...p, id: newId(), qty }, item, now);
    c.put('purchases', { ...p, qty: p.qty - qty }).put('purchases', frozen);
  } else {
    c.put('purchases', applyFreeze(p, item, now));
  }
  return c.put('history', log(newId, now, { type: 'froze', itemId: p.itemId, qty: qty ?? p.qty, purchaseId })).done();
}

export function thaw(state, { purchaseId }, now, newId) {
  const p = purchaseOf(state, purchaseId);
  return changeSet()
    .put('purchases', applyThaw(p, now))
    .put('history', log(newId, now, { type: 'thawed', itemId: p.itemId, purchaseId }))
    .done();
}

export function useUp(state, { purchaseId }, now, newId) {
  const p = purchaseOf(state, purchaseId);
  return changeSet()
    .put('purchases', { ...p, qty: 0 })
    .put('history', log(newId, now, { type: 'used', itemId: p.itemId, qty: p.qty, purchaseId }))
    .done();
}

export function throwAway(state, { purchaseId }, now, newId) {
  const p = purchaseOf(state, purchaseId);
  return changeSet()
    .put('purchases', { ...p, qty: 0 })
    .put('history', log(newId, now, { type: 'wasted', itemId: p.itemId, qty: p.qty, purchaseId }))
    .done();
}

// "Still good": push expiry to `days` from now.
export function extend(state, { purchaseId, days }, now, newId) {
  const p = purchaseOf(state, purchaseId);
  return changeSet()
    .put('purchases', { ...p, expiresAt: now + days * DAY })
    .put('history', log(newId, now, { type: 'adjusted', itemId: p.itemId, qty: 0, purchaseId }))
    .done();
}

export function dismissFreeze(state, { purchaseId }) {
  return changeSet().put('purchases', { ...purchaseOf(state, purchaseId), freezeDismissed: true }).done();
}

export function setSettings(state, patch) {
  return changeSet().put('settings', { ...state.settings, ...patch }).done();
}

export function saveItem(state, { item }) {
  return changeSet().put('items', { ...item, edited: true }).done();
}
