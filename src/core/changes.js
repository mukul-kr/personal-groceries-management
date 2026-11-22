// A change set is plain data:
//   { put: { purchases: [record...], settings: [settingsRecord] }, del: { history: [id...] } }
// Stores: items, purchases, meals, history (arrays of records with `id`), settings (one record).

export const STORES = ['items', 'purchases', 'meals', 'history', 'settings'];

const current = (state, store) => (store === 'settings' ? [state.settings] : state[store]);

export function applyChanges(state, changes) {
  const next = { ...state };
  for (const store of STORES) {
    const puts = changes.put?.[store] || [];
    const dels = new Set(changes.del?.[store] || []);
    if (!puts.length && !dels.size) continue;
    if (store === 'settings') {
      if (puts.length) next.settings = puts.at(-1);
      continue;
    }
    const list = state[store].filter(r => !dels.has(r.id));
    const index = new Map(list.map((r, i) => [r.id, i]));
    for (const rec of puts) {
      if (index.has(rec.id)) list[index.get(rec.id)] = rec;
      else { index.set(rec.id, list.length); list.push(rec); }
    }
    next[store] = list;
  }
  return next;
}

// The change set that undoes `changes` when applied after it.
export function invertChanges(state, changes) {
  const inv = { put: {}, del: {} };
  const push = (kind, store, v) => (inv[kind][store] ||= []).push(v);
  for (const store of STORES) {
    const before = new Map(current(state, store).map(r => [r.id, r]));
    for (const rec of changes.put?.[store] || []) {
      if (before.has(rec.id)) push('put', store, before.get(rec.id));
      else push('del', store, rec.id);
    }
    for (const id of changes.del?.[store] || []) {
      if (before.has(id)) push('put', store, before.get(id));
    }
  }
  return inv;
}

// Small builder used by commands.
export function changeSet() {
  const c = { put: {}, del: {} };
  return {
    put(store, rec) { (c.put[store] ||= []).push(rec); return this; },
    del(store, id) { (c.del[store] ||= []).push(id); return this; },
    done: () => c,
  };
}
