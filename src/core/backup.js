export const SCHEMA_VERSION = 1;
const KIND = 'solo-kitchen-backup';
const LISTS = ['items', 'purchases', 'meals', 'history'];

export function makeBackup(state, now) {
  return { kind: KIND, schemaVersion: SCHEMA_VERSION, exportedAt: now,
    items: state.items, purchases: state.purchases, meals: state.meals, history: state.history, settings: state.settings };
}

const fail = error => ({ ok: false, error });
const NOT_BACKUP = "This file isn't a Solo Kitchen backup.";

// Validate everything before anything is written.
export function parseBackup(text) {
  let b;
  try { b = JSON.parse(text); } catch { return fail(NOT_BACKUP); }
  if (!b || b.kind !== KIND || typeof b.schemaVersion !== 'number') return fail(NOT_BACKUP);
  if (b.schemaVersion > SCHEMA_VERSION) return fail('This backup is from a newer version of the app. Update the app first.');
  for (const k of LISTS) if (!Array.isArray(b[k])) return fail(`Backup is damaged: ${k} is missing.`);
  if (!b.settings || b.settings.id !== 'settings') return fail('Backup is damaged: settings are missing.');

  const itemIds = new Set(b.items.map(i => i.id));
  for (const p of b.purchases) {
    if (!itemIds.has(p.itemId)) return fail(`Backup is damaged: purchase ${p.id} refers to an unknown item.`);
    if (typeof p.qty !== 'number' || p.qty < 0 || typeof p.expiresAt !== 'number') return fail(`Backup is damaged: purchase ${p.id} is invalid.`);
  }
  for (const m of b.meals) {
    if (!Array.isArray(m.ingredients)) return fail(`Backup is damaged: meal ${m.id} is invalid.`);
  }
  const { items, purchases, meals, history, settings } = b;
  return { ok: true, data: { items, purchases, meals, history, settings } };
}
