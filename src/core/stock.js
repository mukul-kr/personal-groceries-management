import { daysLeft } from './dates.js';
import { isExpired } from './expiry.js';

export function liveBatches(purchases, itemId, now) {
  return purchases
    .filter(p => p.itemId === itemId && p.qty > 0 && !isExpired(p, now))
    .sort((a, b) => a.expiresAt - b.expiresAt);
}

export function totalQty(purchases, itemId, now, { includeFrozen = true } = {}) {
  return liveBatches(purchases, itemId, now)
    .filter(p => includeFrozen || p.state !== 'frozen')
    .reduce((s, p) => s + p.qty, 0);
}

// Take from the purchase that expires soonest first.
export function planDeduction(purchases, itemId, qty, now) {
  const takes = [];
  let left = qty;
  for (const p of liveBatches(purchases, itemId, now)) {
    if (left <= 0) break;
    const take = Math.min(p.qty, left);
    takes.push({ purchaseId: p.id, qty: take });
    left -= take;
  }
  return { takes, short: Math.max(0, left) };
}

function firstDaysLeft(purchases, itemId, now) {
  const live = liveBatches(purchases, itemId, now);
  const pick = live.find(p => p.state !== 'frozen') || live[0];
  return pick ? daysLeft(pick.expiresAt, now) : null;
}

export function cookStatus(meal, itemsById, purchases, now) {
  const missing = [];
  const uses = [];
  let needsThaw = false;
  for (const ing of meal.ingredients) {
    const item = itemsById[ing.itemId];
    const have = totalQty(purchases, ing.itemId, now);
    const enough = item && item.deduct ? have >= ing.qty : have > 0;
    if (!ing.optional) {
      if (!enough) { missing.push({ itemId: ing.itemId, need: ing.qty, have }); continue; }
      if (item && item.deduct && totalQty(purchases, ing.itemId, now, { includeFrozen: false }) < ing.qty) needsThaw = true;
    }
    if (have > 0) uses.push({ itemId: ing.itemId, optional: !!ing.optional, daysLeft: firstDaysLeft(purchases, ing.itemId, now) });
  }
  return { cookable: missing.length === 0, missing, needsThaw, uses };
}
