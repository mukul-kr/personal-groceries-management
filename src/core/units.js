const trim = n => String(Math.round(n * 10) / 10);

export function formatQty(qty, unit) {
  if (unit === 'g') return qty >= 1000 ? `${trim(qty / 1000)} kg` : `${trim(qty)} g`;
  if (unit === 'ml') return qty >= 1000 ? `${trim(qty / 1000)} L` : `${trim(qty)} ml`;
  return trim(qty);
}
