export const DAY = 86_400_000;

// Whole days until expiry, rounded up. 0 or less means expired.
export function daysLeft(expiresAt, now) {
  return Math.ceil((expiresAt - now) / DAY);
}

export function daysSince(at, now) {
  return (now - at) / DAY;
}

export function formatDaysLeft(n) {
  if (n < 0) return 'expired';
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n < 14) return `${n} days`;
  if (n < 60) return `${Math.round(n / 7)} wks`;
  return 'months';
}
