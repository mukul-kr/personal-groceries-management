import { DAY } from './dates.js';

export function expiryOnBuy(item, boughtAt) {
  return boughtAt + item.shelf.fresh * DAY;
}

export function applyOpen(p, item, now) {
  const opened = item.shelf.opened;
  const expiresAt = opened == null ? p.expiresAt : Math.min(p.expiresAt, now + opened * DAY);
  return { ...p, state: 'opened', expiresAt };
}

export function applyFreeze(p, item, now) {
  if (item.shelf.frozen == null) throw new Error(`cannot freeze ${item.id}`);
  return { ...p, state: 'frozen', expiresAt: now + item.shelf.frozen * DAY };
}

export function applyThaw(p, now) {
  return { ...p, state: 'opened', expiresAt: now + DAY };
}

export function isExpired(p, now) {
  return p.expiresAt <= now;
}
