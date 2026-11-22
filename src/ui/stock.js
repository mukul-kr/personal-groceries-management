import { DAY } from '../core/dates.js';
import { isExpired } from '../core/expiry.js';
import { totalQty } from '../core/stock.js';
import { usageRate, daysToRunOut } from '../core/forecast.js';
import { buildShoppingList } from '../core/shopping.js';
import { rankMeals } from '../core/rank.js';
import { place } from '../data/catalog.js';
import * as cmd from '../core/commands.js';
import { esc, batchPill, qty, stepper } from './components.js';

const VIEWS = [['soon', 'Soonest'], ['fridge', 'Fridge'], ['pantry', 'Pantry'], ['freezer', 'Freezer']];

// Batches worth showing: in stock, including expired ones you still need to deal with.
const batchesOf = (state, itemId) =>
  state.purchases.filter(p => p.itemId === itemId && p.qty > 0).sort((a, b) => a.expiresAt - b.expiresAt);

function itemRow(item, batches, now) {
  const live = batches.filter(p => !isExpired(p, now));
  const total = (live.length ? live : batches).reduce((s, p) => s + p.qty, 0);
  const first = batches[0];
  const sub = batches.length > 1
    ? batches.map(p => `${qty(p.qty, item)}${p.state === 'frozen' ? ' frozen' : ''}`).join(' + ')
    : (first?.state === 'opened' ? 'opened' : '');
  return `<button class="row" data-act="stock.item" data-id="${esc(item.id)}">
    <span class="grow"><span class="title">${esc(item.name)}</span> <span class="muted">${esc(qty(total, item))}</span>
      ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</span>
    ${first ? batchPill(first, now) : '<span class="pill grey">none</span>'}
  </button>`;
}

export function view(ctx) {
  const { state } = ctx;
  const now = ctx.now();
  const ui = (ctx.ui.stock ||= { view: 'soon', q: '' });
  const q = ui.q.trim().toLowerCase();
  const inStock = state.items
    .map(item => ({ item, batches: batchesOf(state, item.id) }))
    .filter(x => x.batches.length);
  const match = x => !q || x.item.name.toLowerCase().includes(q);

  let body = '';
  if (ui.view === 'soon') {
    const soonest = x => Math.min(...x.batches.map(p => (p.state === 'frozen' ? Infinity : p.expiresAt)));
    const sorted = inStock.filter(match).sort((a, b) => soonest(a) - soonest(b));
    const week = sorted.filter(x => soonest(x) - now <= 7 * DAY);
    const later = sorted.filter(x => soonest(x) - now > 7 * DAY);
    const lowIds = new Set(buildShoppingList(state, now).filter(r => r.reasons.some(x => x === 'low' || x.startsWith('out'))).map(r => r.itemId));
    const low = inStock.filter(x => lowIds.has(x.item.id) && match(x));
    const section = (title, xs) => xs.length ? `<div class="sec">${title}</div><div class="list">${xs.map(x => itemRow(x.item, x.batches, now)).join('')}</div>` : '';
    body = section('This week', week) + section('Later', later) + section('Running low', low);
  } else {
    const xs = inStock.filter(match).filter(x => ui.view === 'freezer'
      ? x.batches.some(p => p.state === 'frozen') || place[x.item.cat] === 'freezer'
      : place[x.item.cat] === ui.view && !x.batches.every(p => p.state === 'frozen'))
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
    body = xs.length ? `<div class="list">${xs.map(x => itemRow(x.item, x.batches, now)).join('')}</div>` : '';
  }
  if (q) {
    const missing = state.items.filter(i => i.name.toLowerCase().includes(q) && !batchesOf(state, i.id).length);
    if (missing.length) body += `<div class="sec">Not in stock</div><div class="list">${missing.map(i => itemRow(i, [], now)).join('')}</div>`;
  }
  if (!body) body = inStock.length
    ? '<div class="empty">Nothing here.</div>'
    : '<div class="empty">Your kitchen is empty.<br>Tap <b>＋</b> to add what you have.</div>';

  return `<div class="head"><h1>Stock</h1></div>
    <div class="seg" role="group" aria-label="View">${VIEWS.map(([k, label]) =>
      `<button data-act="stock.view" data-v="${k}" aria-pressed="${ui.view === k}">${label}</button>`).join('')}</div>
    <input class="search" id="stock-q" type="search" placeholder="Search items" value="${esc(ui.q)}" data-input="stock.search" autocomplete="off">
    ${body}`;
}

// ── item sheet ──
function pattern(state, item, now) {
  const buys = state.history.filter(h => h.type === 'bought' && h.itemId === item.id).map(h => h.at).sort((a, b) => a - b);
  const gaps = buys.slice(1).map((t, i) => (t - buys[i]) / DAY);
  const every = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
  const rate = usageRate(state.history, item.id, now);
  const left = daysToRunOut(totalQty(state.purchases, item.id, now), rate);
  return [
    `Usual pack ${qty(item.usualPack, item)} · ${item.source === 'store' ? 'from the store' : 'online'}`,
    every ? `You buy it about every ${every} days` : null,
    rate ? `You use about ${qty(rate * 7, item)} a week${left != null ? ` · runs out in ~${Math.max(0, Math.round(left))} days` : ''}` : null,
  ].filter(Boolean);
}

function itemSheet(ctx) {
  const { state } = ctx;
  const now = ctx.now();
  const item = ctx.itemsById[ctx.ui.itemId];
  if (!item) return '';
  const batches = batchesOf(state, item.id);
  const uses = rankMeals(state, now).filter(r => r.meal.ingredients.some(i => i.itemId === item.id)).map(r => r.meal);
  const more = state.meals.filter(m => m.ingredients.some(i => i.itemId === item.id) && !uses.includes(m));
  const useIn = [...uses, ...more];

  const batchBlock = p => {
    const key = `b:${p.id}`;
    if (ctx.ui.steps[key] == null) ctx.ui.steps[key] = p.qty;
    const changed = ctx.ui.steps[key] !== p.qty;
    const bought = new Date(p.boughtAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const expired = isExpired(p, now);
    return `<div class="card" style="background:var(--bg);box-shadow:none;border:1px solid var(--line);display:flex;flex-direction:column;gap:10px">
      <div class="head"><span class="muted small">Bought ${esc(bought)}${p.state !== 'sealed' ? ` · ${esc(p.state)}` : ''}</span>${batchPill(p, now)}</div>
      ${expired ? `<div class="small">Past its date. Check it, then throw it away or keep it 2 more days.</div>` : ''}
      <div class="head" style="align-items:center"><span class="muted small">Amount left</span>${stepper(key, ctx.ui.steps[key], item)}</div>
      ${changed ? `<button class="btn primary sm" data-act="stock.save" data-p="${esc(p.id)}">Save amount</button>` : ''}
      <div class="btns">
        ${expired ? `<button class="btn sm" data-act="stock.extend" data-p="${esc(p.id)}">Still good</button>`
          : p.state === 'sealed' && item.shelf.opened != null ? `<button class="btn sm" data-act="stock.opened" data-p="${esc(p.id)}">Opened</button>` : ''}
        ${p.state === 'frozen' ? `<button class="btn sm" data-act="stock.thaw" data-p="${esc(p.id)}">Thaw</button>`
          : item.shelf.frozen != null && !expired ? `<button class="btn sm" data-act="stock.freeze" data-p="${esc(p.id)}">Freeze</button>` : ''}
      </div>
      <div class="btns">
        <button class="btn sm" data-act="stock.used" data-p="${esc(p.id)}">Used it all</button>
        <button class="btn sm danger" data-act="stock.waste" data-p="${esc(p.id)}">Threw away</button>
      </div>
    </div>`;
  };

  return `<div class="head"><h3>${esc(item.name)}</h3></div>
    ${item.note ? `<div class="muted small">${esc(item.note)}</div>` : ''}
    ${batches.length ? batches.map(batchBlock).join('') : `<div class="muted">None in stock.</div>`}
    <button class="btn" data-act="stock.buy">Add ${esc(qty(item.usualPack, item))}</button>
    ${useIn.length ? `<div class="sec">Use it in</div><div class="small">${useIn.slice(0, 6).map(m => esc(m.name)).join(' · ')}${useIn.length > 6 ? ` · +${useIn.length - 6}` : ''}</div>` : ''}
    <div class="sec">Your pattern</div>
    <div class="small muted">${pattern(state, item, now).map(esc).join('<br>')}</div>
    <button class="btn sm" data-act="settings.editItem" data-id="${esc(item.id)}">Edit item details</button>`;
}

export function openItem(ctx, itemId) {
  ctx.ui.itemId = itemId;
  ctx.ui.steps = {};
  ctx.openSheet(itemSheet);
}

const p = el => el.dataset.p;
export const actions = {
  view: (el, ctx) => { ctx.ui.stock.view = el.dataset.v; ctx.render(); },
  search: (el, ctx) => { ctx.ui.stock.q = el.value; ctx.render(); },
  item: (el, ctx) => openItem(ctx, el.dataset.id),
  save: (el, ctx) => ctx.run(cmd.adjust, { purchaseId: p(el), qty: ctx.ui.steps[`b:${p(el)}`] }, 'Amount updated'),
  opened: (el, ctx) => ctx.run(cmd.open, { purchaseId: p(el) }, 'Marked opened'),
  freeze: (el, ctx) => ctx.run(cmd.freeze, { purchaseId: p(el) }, 'Moved to freezer'),
  thaw: (el, ctx) => ctx.run(cmd.thaw, { purchaseId: p(el) }, 'Thawed: use within a day'),
  extend: (el, ctx) => ctx.run(cmd.extend, { purchaseId: p(el), days: 2 }, 'Kept for 2 more days'),
  used: (el, ctx) => { delete ctx.ui.steps[`b:${p(el)}`]; ctx.run(cmd.useUp, { purchaseId: p(el) }, 'Marked used'); },
  waste: (el, ctx) => { delete ctx.ui.steps[`b:${p(el)}`]; ctx.run(cmd.throwAway, { purchaseId: p(el) }, 'Marked thrown away'); },
  buy: (el, ctx) => {
    const item = ctx.itemsById[ctx.ui.itemId];
    ctx.run(cmd.buy, { lines: [{ itemId: item.id, qty: item.usualPack }] }, `Added ${item.name}`);
  },
};

