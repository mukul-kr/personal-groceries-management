import { daysSince } from '../core/dates.js';
import { cookStatus } from '../core/stock.js';
import { rankMeals } from '../core/rank.js';
import * as cmd from '../core/commands.js';
import { esc } from './components.js';
import { openMeal, mealActions } from './meal.js';
import { FILTERS } from './today.js';

const SEGS = [['can', 'Can cook'], ['need1', 'Need 1'], ['all', 'All']];

function rows(ctx) {
  const ui = ctx.ui.cook;
  const now = ctx.now();
  const { state } = ctx;
  const items = ctx.itemsById;
  const skipped = new Set(state.settings.skipped || []);
  const ranked = rankMeals(state, now);
  const rankIndex = new Map(ranked.map((r, i) => [r.meal.id, r]));
  const q = ui.q.trim().toLowerCase();
  const active = FILTERS.filter(([k]) => ui.f.has(k));
  const timeF = active.filter(([k]) => k.startsWith('t'));
  const otherF = active.filter(([k]) => !k.startsWith('t'));
  const lastCooked = id => state.history.filter(h => h.type === 'cooked' && h.mealId === id).reduce((t, h) => Math.max(t, h.at), -Infinity);

  const all = state.meals.map(meal => {
    const status = rankIndex.get(meal.id)?.status || cookStatus(meal, items, state.purchases, now);
    return { meal, status, ranked: rankIndex.get(meal.id) };
  }).filter(({ meal }) =>
    (ui.showSkipped ? skipped.has(meal.id) : !skipped.has(meal.id)) &&
    timeF.every(([, , fn]) => fn(meal)) && (!otherF.length || otherF.some(([, , fn]) => fn(meal))) &&
    (!q || (meal.name + ' ' + meal.ingredients.map(i => items[i.itemId]?.name || '').join(' ')).toLowerCase().includes(q)));

  const counts = { can: all.filter(x => x.status.cookable).length, need1: all.filter(x => x.status.missing.length === 1).length, all: all.length };
  let list;
  if (ui.showSkipped || ui.seg === 'all') {
    list = [...all.filter(x => x.ranked).sort((a, b) => ranked.indexOf(a.ranked) - ranked.indexOf(b.ranked)),
      ...all.filter(x => !x.ranked).sort((a, b) => a.status.missing.length - b.status.missing.length || a.meal.name.localeCompare(b.meal.name))];
  } else if (ui.seg === 'can') {
    list = all.filter(x => x.ranked).sort((a, b) => ranked.indexOf(a.ranked) - ranked.indexOf(b.ranked));
  } else {
    list = all.filter(x => x.status.missing.length === 1).sort((a, b) => a.meal.minutes - b.meal.minutes);
  }

  const context = ({ meal, status, ranked: r }) => {
    if (status.missing.length) return `Need: ${status.missing.map(m => items[m.itemId]?.name.toLowerCase()).join(', ')}`;
    const bits = [];
    if (r?.reasons.length) bits.push(...r.reasons.filter(x => !x.startsWith('Cooked') && x !== 'Planned'));
    const ago = daysSince(lastCooked(meal.id), now);
    if (Number.isFinite(ago)) bits.push(ago < 1 ? 'cooked today' : `cooked ${Math.floor(ago)} day${Math.floor(ago) === 1 ? '' : 's'} ago`);
    if (status.needsThaw) bits.push('thaw first');
    return bits.join(' · ') || 'Ready';
  };
  const planned = new Set(state.settings.planned || []);
  return { counts, html: list.map(x => `<div class="meal" data-id="${esc(x.meal.id)}">
      <div class="under"><span class="l">${planned.has(x.meal.id) ? 'Unplan' : 'Plan'}</span><span class="r">${skipped.has(x.meal.id) ? 'Bring back' : 'Not for me'}</span></div>
      <button class="slide row" data-act="cook.open" data-id="${esc(x.meal.id)}">
        <span class="grow"><span class="title">${esc(x.meal.name)}</span>${planned.has(x.meal.id) ? ' <span class="pill green">plan</span>' : ''}
          <div class="sub">${esc(context(x))}</div></span>
        <span class="muted small">${x.meal.minutes} m</span></button></div>`).join('') };
}

export function view(ctx) {
  const ui = (ctx.ui.cook ||= {});
  Object.assign(ui, { seg: ui.seg || 'can', q: ui.q || '', f: ui.f || new Set(), showSkipped: !!ui.showSkipped });
  const { counts, html } = rows(ctx);
  const nSkipped = (ctx.state.settings.skipped || []).length;
  return `<div class="head"><h1>Cook</h1></div>
    <input class="search" id="cook-q" type="search" placeholder="Meal or ingredient" value="${esc(ui.q)}" data-input="cook.search" autocomplete="off">
    ${ui.showSkipped ? '' : `<div class="seg" role="group" aria-label="Show">${SEGS.map(([k, label]) =>
      `<button data-act="cook.seg" data-v="${k}" aria-pressed="${ui.seg === k}">${label} · ${counts[k]}</button>`).join('')}</div>`}
    <div class="chips">${FILTERS.map(([k, label]) => `<button class="chip" data-act="cook.filter" data-k="${k}" aria-pressed="${ui.f.has(k)}">${label}</button>`).join('')}
      ${nSkipped || ui.showSkipped ? `<button class="chip" data-act="cook.skipped" aria-pressed="${ui.showSkipped}">Not for me · ${nSkipped}</button>` : ''}</div>
    ${html ? `<div class="list">${html}</div><div class="muted small" style="text-align:center">Swipe right to plan, left for “not for me”</div>`
      : `<div class="empty">${ui.seg === 'can' && !ui.showSkipped ? 'Nothing cookable with these filters. Try “Need 1”.' : 'No meals match.'}</div>`}`;
}

function toggle(list, id) { return list.includes(id) ? list.filter(x => x !== id) : [...list, id]; }
function togglePlan(ctx, id) {
  const on = !(ctx.state.settings.planned || []).includes(id);
  ctx.run(cmd.setSettings, { planned: toggle(ctx.state.settings.planned || [], id) }, on ? 'Added to plan' : 'Removed from plan');
}
function toggleSkip(ctx, id) {
  const on = !(ctx.state.settings.skipped || []).includes(id);
  ctx.run(cmd.setSettings, { skipped: toggle(ctx.state.settings.skipped || [], id) }, on ? 'Hidden. Find it under “Not for me”' : 'Brought back');
}

let suppressClick = false;
export const actions = {
  open: (el, ctx) => { if (!suppressClick) openMeal(ctx, el.dataset.id); },
  search: (el, ctx) => { ctx.ui.cook.q = el.value; ctx.render(); },
  seg: (el, ctx) => { ctx.ui.cook.seg = el.dataset.v; ctx.render(); },
  filter: (el, ctx) => { const f = ctx.ui.cook.f; f.has(el.dataset.k) ? f.delete(el.dataset.k) : f.add(el.dataset.k); ctx.render(); },
  skipped: (el, ctx) => { ctx.ui.cook.showSkipped = !ctx.ui.cook.showSkipped; ctx.render(); },
  plan: (el, ctx) => togglePlan(ctx, el.dataset.id),
  skip: (el, ctx) => toggleSkip(ctx, el.dataset.id),
  ...mealActions,
};

// Swipe a meal row: right = plan, left = not for me.
export function installSwipe(root, ctx) {
  let start = null;
  root.addEventListener('pointerdown', e => {
    const slide = e.target.closest('.meal .slide');
    if (!slide) return;
    start = { x: e.clientX, y: e.clientY, slide, id: slide.closest('.meal').dataset.id, dx: 0, locked: null };
  });
  root.addEventListener('pointermove', e => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (start.locked == null && Math.abs(dx) + Math.abs(dy) > 8) start.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (start.locked !== 'x') return;
    start.dx = Math.max(-120, Math.min(120, dx));
    start.slide.style.transform = `translateX(${start.dx}px)`;
  });
  const end = () => {
    if (!start) return;
    const { dx, slide, id, locked } = start;
    start = null;
    slide.style.transform = '';
    if (locked !== 'x') return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 50);
    if (dx > 80) togglePlan(ctx, id);
    else if (dx < -80) toggleSkip(ctx, id);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}
