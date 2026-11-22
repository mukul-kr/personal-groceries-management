import * as cmd from '../core/commands.js';
import { esc, qty, stepper } from './components.js';

const PERISHABLE = new Set(['keeps', 'fresh', 'frozen']);

// Tiles: perishables and anything you've bought twice or more, most-bought first.
// Long-lasting pantry items (salt, masalas, dals) are a search away.
function tileItems(state) {
  const count = {};
  for (const h of state.history) if (h.type === 'bought') count[h.itemId] = (count[h.itemId] || 0) + 1;
  const order = new Map(state.items.map((i, n) => [i.id, n]));
  return state.items
    .filter(i => PERISHABLE.has(i.cat) || (count[i.id] || 0) >= 2)
    .sort((a, b) => (count[b.id] || 0) - (count[a.id] || 0) || (a.source === b.source ? 0 : a.source === 'store' ? -1 : 1) || order.get(a.id) - order.get(b.id))
    .slice(0, 30);
}

function tile(item, ui) {
  const packs = ui.sel[item.id] || 0;
  return `<button class="tile ${packs ? 'on' : ''}" data-act="plus.tap" data-id="${esc(item.id)}" aria-pressed="${packs > 0}">
    ${packs > 1 ? `<span class="count">×${packs}</span>` : ''}
    <b>${esc(item.name.replace(/ \(.*\)$/, ''))}</b><span>${esc(qty(item.usualPack, item))}</span></button>`;
}

function sheet(ctx) {
  const ui = ctx.ui.plus;
  const q = ui.q.trim().toLowerCase();
  const pool = q ? ctx.state.items.filter(i => i.name.toLowerCase().includes(q)) : tileItems(ctx.state);
  const store = pool.filter(i => i.source === 'store');
  const online = pool.filter(i => i.source === 'online');
  const chosen = Object.keys(ui.sel).filter(id => ui.sel[id] > 0).map(id => ctx.itemsById[id]);
  for (const item of chosen) {
    const key = `plus:${item.id}`;
    if (ctx.ui.steps[key] == null || ui.packsSeen[item.id] !== ui.sel[item.id]) {
      ctx.ui.steps[key] = item.usualPack * ui.sel[item.id];
      ui.packsSeen[item.id] = ui.sel[item.id];
    }
  }
  const group = (title, xs) => xs.length ? `<div class="sec">${title}</div><div class="tiles">${xs.map(i => tile(i, ui)).join('')}</div>` : '';

  return `<div class="head"><h3>I bought…</h3><span class="muted small">Usual amounts</span></div>
    <input class="search" id="plus-q" type="search" placeholder="Search any item" value="${esc(ui.q)}" data-input="plus.search" autocomplete="off">
    ${group('Store run', store)}${group(q ? 'Online' : 'Usually online', online)}
    ${!store.length && !online.length ? '<div class="empty">No item matches.</div>' : ''}
    ${chosen.length && ui.showAmounts ? `<div class="sec">Amounts</div><div class="list">${chosen.map(i =>
      `<div class="row"><span class="grow">${esc(i.name)}</span>${stepper(`plus:${i.id}`, ctx.ui.steps[`plus:${i.id}`], i)}</div>`).join('')}</div>` : ''}
    <div class="foot btns">
      ${chosen.length ? `<button class="btn" data-act="plus.amounts">${ui.showAmounts ? 'Hide amounts' : 'Change amounts'}</button>` : ''}
      <button class="btn primary" data-act="plus.add" ${chosen.length ? '' : 'disabled'}>${chosen.length ? `Add ${chosen.length} item${chosen.length > 1 ? 's' : ''}` : 'Tap what you bought'}</button>
    </div>`;
}

export function open(ctx, preselect = []) {
  ctx.ui.plus = { sel: Object.fromEntries(preselect.map(id => [id, 1])), packsSeen: {}, q: '', showAmounts: false };
  ctx.ui.steps = {};
  ctx.openSheet(sheet);
}

export const actions = {
  tap: (el, ctx) => {
    const s = ctx.ui.plus.sel;
    s[el.dataset.id] = ((s[el.dataset.id] || 0) + 1) % 4;
    ctx.render();
  },
  search: (el, ctx) => { ctx.ui.plus.q = el.value; ctx.render(); },
  amounts: (el, ctx) => { ctx.ui.plus.showAmounts = !ctx.ui.plus.showAmounts; ctx.render(); },
  add: async (el, ctx) => {
    const lines = Object.keys(ctx.ui.plus.sel).filter(id => ctx.ui.plus.sel[id] > 0)
      .map(id => ({ itemId: id, qty: ctx.ui.steps[`plus:${id}`] })).filter(l => l.qty > 0);
    const names = lines.map(l => ctx.itemsById[l.itemId].name.replace(/ \(.*\)$/, '').toLowerCase());
    ctx.closeSheet();
    await ctx.run(cmd.buy, { lines }, `Added ${names.length > 3 ? `${names.length} items` : names.join(', ')}`);
  },
};
