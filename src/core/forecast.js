import { DAY, daysSince } from './dates.js';

const WINDOW_DAYS = 30;
const MIN_EVENTS = 2;
const MIN_SPAN_DAYS = 7;

function consumed(h) {
  if (h.type === 'used') return h.qty || 0;
  if (h.type === 'adjusted' && h.qty < 0) return -h.qty;
  return 0;
}

// Average amount used per day over the last 30 days, or null if there isn't
// enough history to trust it yet.
export function usageRate(history, itemId, now) {
  const events = history.filter(h => h.itemId === itemId && h.at > now - WINDOW_DAYS * DAY && consumed(h) > 0);
  if (events.length < MIN_EVENTS) return null;
  const earliest = Math.min(...events.map(h => h.at));
  const covered = Math.min(WINDOW_DAYS, daysSince(earliest, now));
  if (covered < MIN_SPAN_DAYS) return null;
  const total = events.reduce((s, h) => s + consumed(h), 0);
  return Math.round((total / covered) * 1000) / 1000;
}

export function daysToRunOut(stock, rate) {
  return rate ? stock / rate : null;
}
