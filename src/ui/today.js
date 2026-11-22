import { DAY, daysSince } from '../core/dates.js';
import { isExpired } from '../core/expiry.js';
import { rankMeals } from '../core/rank.js';
import { buildShoppingList, freezeSuggestions } from '../core/shopping.js';
import * as cmd from '../core/commands.js';
import { esc, qty } from './components.js';
import { openMeal } from './meal.js';
import { starterStock } from '../data/catalog.js';

export const FILTERS = [
  ['t10', '≤ 10 min', m => m.minutes <= 10],
  ['t20', '≤ 20 min', m => m.minutes <= 20],
  ['egg', 'Egg', m => m.protein === 'egg'],
  ['paneer', 'Paneer', m => m.protein === 'paneer'],
  ['chicken', 'Chicken', m => m.protein === 'chicken'],
  ['soya', 'Soya', m => m.protein === 'soya'],
  ['dal', 'Dal', m => m.protein === 'dal' || m.protein === 'beans'],
  ['veg', 'Veg', m => m.protein === 'veg'],
  ['nocook', 'No-cook', m => m.tags.includes('no-cook')],
  ['chinese', 'Chinese', m => m.tags.includes('chinese')],
];

function mealWord(now) {
  const h = new Date(now).getHours();
  if (h >= 5 && h < 11) return 'Breakfast?';
  if (h >= 11 && h < 16) return 'Lunch?';
  if (h >= 16 && h < 23) return 'Dinner?';
  return 'Hungry?';
}

function picks(ctx) {
  const ui = ctx.ui.today;
  const active = FILTERS.filter(([k]) => ui.f.has(k));
  const timeF = active.filter(([k]) => k.startsWith('t'));
  const otherF = active.filter(([k]) => !k.startsWith('t'));
  return rankMeals(ctx.state, ctx.now()).filter(r =>
    timeF.every(([, , fn]) => fn(r.meal)) && (!otherF.length || otherF.some(([, , fn]) => fn(r.meal))));
}

function headsUp(ctx) {
  const { state } = ctx;
  const now = ctx.now();
  const out = [];
  for (const p of state.purchases.filter(p => p.qty > 0 && isExpired(p, now))) {
    const item = ctx.itemsById[p.itemId];
    out.push(`<div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div><b>${esc(item.name)} ${esc(qty(p.qty, item))}</b> <span class="pill red">past its date</span></div>
      <div class="btns"><button class="btn sm danger" data-act="today.waste" data-p="${esc(p.id)}">Threw away</button>
        <button class="btn sm" data-act="today.extend" data-p="${esc(p.id)}">Still good</button></div></div>`);
  }
  for (const s of freezeSuggestions(state, now)) {
    const item = ctx.itemsById[s.itemId];
    const p = state.purchases.find(x => x.id === s.purchaseId);
    out.push(`<div class="card" style="display:flex;flex-direction:column;gap:6px;background:var(--amber-soft)">
      <b>${esc(item.name)} ${esc(qty(p.qty, item))} lasts ${item.shelf.fresh} days fresh</b>
      <div class="small">A meal uses about ${esc(qty(s.keepQty, item))}. Freeze the rest?</div>
      <div class="btns"><button class="btn sm primary" data-act="today.freeze" data-p="${esc(p.id)}" data-q="${s.freezeQty}">Freeze ${esc(qty(s.freezeQty, item))}</button>
        <button class="btn sm" data-act="today.keep" data-p="${esc(p.id)}">Keep all</button></div></div>`);
  }
  const running = buildShoppingList(state, now).filter(r => r.reasons.some(x => x.startsWith('out')));
  for (const r of running) {
    const days = r.reasons.find(x => x.startsWith('out')).match(/\d+/)[0];
    out.push(`<a class="card row" href="#shop" style="text-decoration:none;padding:12px 14px">
      <span class="grow">${esc(ctx.itemsById[r.itemId].name)}<div class="sub">About ${days} day${days === '1' ? '' : 's'} left at your usual pace</div></span><span class="pill green">On list</span></a>`);
  }
  const hasData = state.purchases.length > 0;
  const last = state.settings.lastBackupAt;
  if (hasData && (last == null ? state.history.length > 0 && daysSince(Math.min(...state.history.map(h => h.at)), now) > 14 : now - last > 14 * DAY)) {
    out.push(`<a class="card row" href="#settings" style="text-decoration:none;padding:12px 14px">
      <span class="grow">Back up your kitchen<div class="sub">${last ? `Last backup ${Math.floor(daysSince(last, now))} days ago` : 'Never backed up'}</div></span><span class="chev">›</span></a>`);
  }
  return out;
}

export function view(ctx) {
  const ui = (ctx.ui.today ||= { i: 0, f: new Set() });
  const now = ctx.now();
  const head = `<div class="head"><h1>${mealWord(now)}</h1><a class="iconbtn" href="#settings" aria-label="Settings">⚙︎</a></div>`;

  if (!ctx.state.purchases.some(p => p.qty > 0)) {
    return `${head}<div class="card" style="display:flex;flex-direction:column;gap:10px">
      <b>Your kitchen is empty</b>
      <div class="muted">Tap <b>＋</b> to add what you have. Or start from a typical starter kitchen (rice, dals, masalas, eggs, onions, frozen rotis…) and fix amounts later.</div>
      <button class="btn primary" data-act="today.starter">Add starter kitchen</button></div>`;
  }

  const list = picks(ctx);
  if (ui.i >= list.length) ui.i = 0;
  const r = list[ui.i];
  const hero = r ? `<section class="hero" aria-label="Suggested meal">
      <div class="muted small">${ui.i === 0 ? 'Best pick right now' : 'Next pick'} · ${ui.i + 1} of ${list.length}</div>
      <h2>${esc(r.meal.name)}</h2>
      <div>${r.meal.minutes} min · ${esc(r.meal.protein)}${r.status.needsThaw ? ' · <b>thaw first</b>' : ''}</div>
      <div class="muted small">${esc(r.reasons.join(' · ') || 'Ready with what you have')}</div>
      <div class="btns" style="margin-top:6px">
        <button class="btn" data-act="today.next">Something else</button>
        <button class="btn primary" data-act="today.cook" data-id="${esc(r.meal.id)}">Let's cook</button>
      </div></section>`
    : `<div class="card" style="display:flex;flex-direction:column;gap:10px"><b>Nothing to cook with these filters</b>
      <div class="muted">Clear a filter, or see meals you're one item away from.</div>
      <div class="btns"><button class="btn" data-act="today.clear">Clear filters</button><a class="btn" href="#cook" data-act="today.need1">One item away</a></div></div>`;

  const chips = `<div class="chips">${FILTERS.map(([k, label]) =>
    `<button class="chip" data-act="today.filter" data-k="${k}" aria-pressed="${ui.f.has(k)}">${label}</button>`).join('')}</div>`;
  const heads = headsUp(ctx);
  return `${head}${hero}${chips}${heads.length ? `<div class="sec">Heads up</div>${heads.join('')}` : ''}`;
}

const p = el => el.dataset.p;
export const actions = {
  next: (el, ctx) => { ctx.ui.today.i += 1; ctx.render(); },
  cook: (el, ctx) => openMeal(ctx, el.dataset.id),
  filter: (el, ctx) => {
    const f = ctx.ui.today.f;
    f.has(el.dataset.k) ? f.delete(el.dataset.k) : f.add(el.dataset.k);
    ctx.ui.today.i = 0;
    ctx.render();
  },
  clear: (el, ctx) => { ctx.ui.today.f.clear(); ctx.render(); },
  need1: (el, ctx) => { (ctx.ui.cook ||= {}).seg = 'need1'; },
  waste: (el, ctx) => ctx.run(cmd.throwAway, { purchaseId: p(el) }, 'Marked thrown away'),
  extend: (el, ctx) => ctx.run(cmd.extend, { purchaseId: p(el), days: 2 }, 'Kept for 2 more days'),
  freeze: (el, ctx) => ctx.run(cmd.freeze, { purchaseId: p(el), qty: +el.dataset.q }, 'Moved to freezer'),
  keep: (el, ctx) => ctx.run(cmd.dismissFreeze, { purchaseId: p(el) }, null),
  starter: (el, ctx) => ctx.run(cmd.buy, { lines: starterStock.map(id => ({ itemId: id, qty: ctx.itemsById[id].usualPack })) },
    'Starter kitchen added. Fix amounts in Stock'),
};
