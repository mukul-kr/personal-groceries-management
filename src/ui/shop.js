import { buildShoppingList, bestNextBuys } from '../core/shopping.js';
import * as cmd from '../core/commands.js';
import { esc, qty } from './components.js';

// Search links for each shopping app. Shown in the order listed here.
export const APPS = {
  blinkit: { name: 'Blinkit', url: q => `https://blinkit.com/s/?q=${encodeURIComponent(q)}` },
  zepto: { name: 'Zepto', url: q => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}` },
  instamart: { name: 'Swiggy Instamart', url: q => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q)}` },
  flipkart: { name: 'Flipkart Minutes', url: q => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}&marketplace=HYPERLOCAL` },
  amazon: { name: 'Amazon Now', url: q => `https://www.amazon.in/tez/browse/search?searchKeyword=${encodeURIComponent(q)}` },
};
export const enabledApps = settings => (settings.shopApps?.length ? settings.shopApps : Object.keys(APPS)).filter(k => APPS[k]);

const REASON = r => {
  if (r.startsWith('out')) return ['amber', `runs out in ${r.match(/\d+/)[0]}d`];
  if (r === 'low') return ['amber', 'low'];
  if (r === 'plan') return ['green', 'for plan'];
  return ['grey', 'added'];
};
const searchName = item => item.name.replace(/\s*\(.*\)$/, '').replace(/^Frozen /, 'frozen ');

export function view(ctx) {
  const ui = (ctx.ui.shop ||= { ticked: new Set(), q: '' });
  const now = ctx.now();
  const { state } = ctx;
  const items = ctx.itemsById;
  const list = buildShoppingList(state, now);
  const onList = new Set(list.map(r => r.itemId));
  for (const id of [...ui.ticked]) if (!onList.has(id)) ui.ticked.delete(id);
  const apps = enabledApps(state.settings);
  const manual = new Set(state.settings.manualShop || []);

  const row = r => {
    const item = items[r.itemId];
    const on = ui.ticked.has(r.itemId);
    return `<div class="row">
      <button class="check ${on ? 'on' : ''}" data-act="shop.tick" data-id="${esc(r.itemId)}" aria-pressed="${on}" aria-label="Got ${esc(item.name)}">${on ? '✓' : ''}</button>
      <span class="grow"><span class="title">${esc(item.name)}</span> <span class="muted small">${esc(qty(r.qty, item))}</span>
        <div>${r.reasons.map(x => { const [c, t] = REASON(x); return `<span class="pill ${c}">${t}</span>`; }).join(' ')}</div></span>
      ${r.source !== 'online' ? '' : apps.length === 1
        ? `<a class="btn sm" href="${esc(APPS[apps[0]].url(searchName(item)))}" target="_blank" rel="noopener">${APPS[apps[0]].name} ↗</a>`
        : `<button class="btn sm" data-act="shop.find" data-id="${esc(r.itemId)}" aria-label="Find ${esc(item.name)} in a shopping app">Find ↗</button>`}
      ${manual.has(r.itemId) && r.reasons.length === 1 ? `<button class="iconbtn" data-act="shop.remove" data-id="${esc(r.itemId)}" aria-label="Remove">×</button>` : ''}
    </div>`;
  };

  const online = list.filter(r => r.source === 'online');
  const store = list.filter(r => r.source === 'store');
  const best = bestNextBuys(state, now);
  const suggestions = best.map(b => `<button class="row dim" data-act="shop.add" data-id="${esc(b.itemId)}">
      <span class="check add" aria-hidden="true">+</span><span class="grow">${esc(items[b.itemId].name)}</span><span class="pill green">+${b.unlocks} meal${b.unlocks > 1 ? 's' : ''}</span></button>`).join('');

  const q = ui.q.trim().toLowerCase();
  const results = q ? state.items.filter(i => i.name.toLowerCase().includes(q) && !onList.has(i.id)).slice(0, 6) : [];
  const planned = (state.settings.planned || []).map(id => state.meals.find(m => m.id === id)).filter(Boolean);
  const nTicked = ui.ticked.size;

  return `<div class="head"><h1>Shop</h1></div>
    <div class="sec">Order online · ${online.length}</div>
    ${online.length || suggestions ? `<div class="list">${online.map(row).join('')}${suggestions}</div>` : '<div class="empty">Nothing to order.</div>'}
    ${online.length ? `<button class="btn" data-act="shop.copy">Copy list</button>` : ''}
    <div class="sec">Pick up from the store · ${store.length}</div>
    ${store.length ? `<div class="list">${store.map(row).join('')}</div>` : '<div class="empty">Nothing to pick up.</div>'}
    <div class="sec">Add something</div>
    <input class="search" id="shop-q" type="search" placeholder="Item name" value="${esc(ui.q)}" data-input="shop.search" autocomplete="off">
    ${results.length ? `<div class="list">${results.map(i => `<button class="row" data-act="shop.add" data-id="${esc(i.id)}"><span class="grow">${esc(i.name)}</span><span class="muted">Add</span></button>`).join('')}</div>` : ''}
    ${planned.length ? `<div class="sec">Planned meals</div><div class="list">${planned.map(m =>
      `<div class="row"><span class="grow">${esc(m.name)}</span><button class="btn sm" data-act="shop.unplan" data-id="${esc(m.id)}">Remove</button></div>`).join('')}</div>` : ''}
    ${nTicked ? `<div style="position:sticky;bottom:calc(84px + env(safe-area-inset-bottom, 0px));z-index:5">
      <button class="btn primary" style="width:100%;box-shadow:0 6px 18px rgba(0,0,0,.18)" data-act="shop.bought">Bought ${nTicked}: add to stock</button></div>` : ''}`;
}

function findSheet(ctx) {
  const item = ctx.itemsById[ctx.ui.findId];
  const q = searchName(item);
  return `<h3>Find ${esc(item.name)}</h3>
    <div class="muted small">Usual pack ${esc(qty(item.usualPack, item))}. Prices differ between apps, so check two and pick the better deal.</div>
    <div class="list">${enabledApps(ctx.state.settings).map(k =>
      `<a class="row" href="${esc(APPS[k].url(q))}" target="_blank" rel="noopener"><span class="grow title">${APPS[k].name}</span><span class="chev">↗</span></a>`).join('')}</div>
    <div class="muted small">Ordered it? Tick it on the list, then tap Bought.</div>`;
}

export const actions = {
  find: (el, ctx) => { ctx.ui.findId = el.dataset.id; ctx.openSheet(findSheet); },
  tick: (el, ctx) => { const t = ctx.ui.shop.ticked; t.has(el.dataset.id) ? t.delete(el.dataset.id) : t.add(el.dataset.id); ctx.render(); },
  search: (el, ctx) => { ctx.ui.shop.q = el.value; ctx.render(); },
  add: (el, ctx) => {
    ctx.ui.shop.q = '';
    const id = el.dataset.id;
    ctx.run(cmd.setSettings, { manualShop: [...new Set([...(ctx.state.settings.manualShop || []), id])] }, `${ctx.itemsById[id].name} added to list`);
  },
  remove: (el, ctx) => ctx.run(cmd.setSettings, { manualShop: (ctx.state.settings.manualShop || []).filter(x => x !== el.dataset.id) }, 'Removed from list'),
  unplan: (el, ctx) => ctx.run(cmd.setSettings, { planned: (ctx.state.settings.planned || []).filter(x => x !== el.dataset.id) }, 'Removed from plan'),
  bought: async (el, ctx) => {
    const items = ctx.itemsById;
    const lines = [...ctx.ui.shop.ticked].map(id => ({ itemId: id, qty: items[id].usualPack }));
    ctx.ui.shop.ticked.clear();
    await ctx.run(cmd.buy, { lines }, `${lines.length} item${lines.length > 1 ? 's' : ''} added to stock`);
  },
  copy: async (el, ctx) => {
    const items = ctx.itemsById;
    const text = buildShoppingList(ctx.state, ctx.now()).filter(r => r.source === 'online')
      .map(r => `- ${items[r.itemId].name} (${qty(r.qty, items[r.itemId])})`).join('\n');
    try { await navigator.clipboard.writeText(text); ctx.toast('List copied'); }
    catch { ctx.openSheet(() => `<h3>Shopping list</h3><textarea class="search" rows="10" readonly onfocus="this.select()">${esc(text)}</textarea>
      <div class="muted small">Select all and copy.</div>`); }
  },
};
