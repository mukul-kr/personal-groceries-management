// The only file that touches IndexedDB. Everything else works on plain state.
import { STORES } from '../core/changes.js';

const NAME = 'solo-kitchen';
const VERSION = 1;

const req = r => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
const done = tx => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error || new Error('transaction aborted'));
});

export function openDB() {
  const r = indexedDB.open(NAME, VERSION);
  r.onupgradeneeded = () => {
    const db = r.result;
    for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
  };
  return req(r);
}

export async function loadAll(db) {
  const tx = db.transaction(STORES, 'readonly');
  const [items, purchases, meals, history, settings] = await Promise.all(STORES.map(s => req(tx.objectStore(s).getAll())));
  return { items, purchases, meals, history, settings: settings[0] || null };
}

// Apply a change set in one transaction: all of it lands, or none of it.
export async function commit(db, changes) {
  const touched = STORES.filter(s => changes.put?.[s]?.length || changes.del?.[s]?.length);
  if (!touched.length) return;
  const tx = db.transaction(touched, 'readwrite');
  for (const s of touched) {
    const store = tx.objectStore(s);
    for (const rec of changes.put?.[s] || []) store.put(rec);
    for (const id of changes.del?.[s] || []) store.delete(id);
  }
  await done(tx);
}

export async function replaceAll(db, data) {
  const tx = db.transaction(STORES, 'readwrite');
  for (const s of STORES) {
    const store = tx.objectStore(s);
    store.clear();
    const recs = s === 'settings' ? [data.settings] : data[s];
    for (const rec of recs) store.put(rec);
  }
  await done(tx);
}

// Same interface, kept in memory: used for the ?demo preview.
export const memoryAdapter = { commit: async () => {}, replaceAll: async () => {} };

export function idbAdapter(db) {
  return { commit: c => commit(db, c), replaceAll: d => replaceAll(db, d) };
}
