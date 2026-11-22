import { items as builtinItems } from '../data/catalog.js';
import { rawMeals } from '../data/meals.js';
import { buildMeals, mergeSeed, defaultSettings } from '../core/seed.js';
import { applyChanges, invertChanges } from '../core/changes.js';
import { openDB, loadAll, idbAdapter, memoryAdapter } from '../store/db.js';
import { openSheet, closeSheet, renderSheet, sheetOpen, toast, hideToast } from './components.js';
import { demoState } from './demo.js';
import * as today from './today.js';
import * as cook from './cook.js';
import * as stock from './stock.js';
import * as shop from './shop.js';
import * as settings from './settings.js';
import * as plus from './plus.js';

const screens = { today, cook, stock, shop, settings };
const view = document.getElementById('view');

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ctx = {
  state: null,
  adapter: memoryAdapter,
  ui: { steps: {} },
  now: () => Date.now(),
  newId,
  get itemsById() { return Object.fromEntries(ctx.state.items.map(i => [i.id, i])); },
  route: () => (location.hash.slice(1) in screens ? location.hash.slice(1) : 'today'),
  go: name => { location.hash = name; },
  render,
  openSheet: fn => openSheet(fn, ctx),
  closeSheet,
  toast,
  run,
};

// Every state change goes through here: compute, save, re-render, offer undo.
async function run(command, args, message) {
  const before = ctx.state;
  let changes;
  try { changes = command(before, args, ctx.now(), newId); } catch (e) { toast(e.message); return false; }
  const inverse = invertChanges(before, changes);
  ctx.state = applyChanges(before, changes);
  try { await ctx.adapter.commit(changes); } catch (e) {
    console.error(e);
    ctx.state = before;
    render();
    toast("Couldn't save. Your last change was not stored.");
    return false;
  }
  render();
  if (message) {
    toast(message, async () => {
      ctx.state = applyChanges(ctx.state, inverse);
      try { await ctx.adapter.commit(inverse); } catch { toast("Couldn't undo."); }
      hideToast();
      render();
    });
  }
  return true;
}

function render() {
  const name = ctx.route();
  const active = document.activeElement;
  const focusId = active && active.id && active !== document.body ? active.id : null;
  const caret = focusId && 'selectionStart' in active ? active.selectionStart : null;
  const scroll = window.scrollY;

  view.innerHTML = screens[name].view(ctx);
  document.querySelectorAll('.tabbar a').forEach(a =>
    a.dataset.tab === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));

  renderSheet(ctx);
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) { el.focus({ preventScroll: true }); if (caret != null) try { el.setSelectionRange(caret, caret); } catch { /* not a text input */ } }
  }
  window.scrollTo(0, scroll);
}

// ── event delegation: data-act (click), data-input (input), data-change (change) ──
const actions = {
  'sheet.close': () => closeSheet(),
  'toast.undo': () => toast.undo && toast.undo(),
  step: el => {
    const k = el.dataset.key;
    const v = Math.max(+el.dataset.min || 0, Math.round(((ctx.ui.steps[k] ?? 0) + +el.dataset.delta) * 100) / 100);
    ctx.ui.steps[k] = v;
    renderSheet(ctx);
  },
  stepset: el => {
    const v = parseFloat(el.value);
    if (!Number.isNaN(v) && v >= 0) ctx.ui.steps[el.dataset.key] = v;
  },
};
for (const [prefix, mod] of Object.entries({ today, cook, stock, shop, settings, plus })) {
  for (const [k, fn] of Object.entries(mod.actions || {})) actions[`${prefix}.${k}`] = fn;
}

function dispatch(attr) {
  return e => {
    const el = e.target.closest(`[${attr}]`);
    if (!el) return;
    const fn = actions[el.getAttribute(attr)];
    if (!fn) return console.warn('no action', el.getAttribute(attr));
    if (attr === 'data-act' && el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    fn(el, ctx, e);
  };
}
document.addEventListener('click', dispatch('data-act'));
document.addEventListener('input', dispatch('data-input'));
document.addEventListener('change', dispatch('data-change'));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen()) closeSheet(); });
window.addEventListener('hashchange', () => { closeSheet(); window.scrollTo(0, 0); render(); });
cook.installSwipe(view, ctx);

async function boot() {
  const meals = buildMeals(rawMeals, builtinItems);
  if (new URLSearchParams(location.search).has('demo')) {
    ctx.state = demoState(builtinItems, meals, ctx.now());
    render();
    return;
  }
  try {
    const db = await openDB();
    const loaded = await loadAll(db);
    ctx.adapter = idbAdapter(db);
    const state = {
      items: mergeSeed(loaded.items, builtinItems),
      meals: mergeSeed(loaded.meals, meals),
      purchases: loaded.purchases,
      history: loaded.history,
      settings: { ...defaultSettings(), ...(loaded.settings || {}) },
    };
    await ctx.adapter.commit({ put: { items: state.items, meals: state.meals, settings: [state.settings] } });
    ctx.state = state;
    navigator.storage?.persist?.().catch(() => {});
  } catch (e) {
    console.error(e);
    ctx.state = { items: builtinItems, meals, purchases: [], history: [], settings: defaultSettings() };
    setTimeout(() => toast("Storage isn't available here, so nothing will be saved."), 300);
  }
  render();
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

boot();

// Exposed for the ＋ button in the tab bar.
actions['plus.open'] = (el, c) => plus.open(c);
