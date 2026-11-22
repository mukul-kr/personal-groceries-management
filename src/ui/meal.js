import { cookStatus, totalQty } from '../core/stock.js';
import * as cmd from '../core/commands.js';
import { esc, qty, stepper } from './components.js';

function detail(ctx) {
  const now = ctx.now();
  const meal = ctx.state.meals.find(m => m.id === ctx.ui.mealId);
  if (!meal) return '';
  const items = ctx.itemsById;
  const status = cookStatus(meal, items, ctx.state.purchases, now);
  const missing = new Set(status.missing.map(m => m.itemId));
  const { planned = [], skipped = [] } = ctx.state.settings;
  const line = ing => {
    const item = items[ing.itemId];
    const have = totalQty(ctx.state.purchases, ing.itemId, now);
    const amount = item.deduct ? qty(ing.qty, item) : 'a little';
    const note = missing.has(ing.itemId) ? `<span class="pill red">${have > 0 ? `have ${esc(qty(have, item))}` : 'need'}</span>` : '';
    return `<div class="kv"><span>${esc(item.name)} ${note}</span><span class="muted">${esc(amount)}</span></div>`;
  };
  const req = meal.ingredients.filter(i => !i.optional);
  const opt = meal.ingredients.filter(i => i.optional);
  return `<h3>${esc(meal.name)}</h3>
    <div class="muted small">${meal.minutes} min · ${esc(meal.protein)}${meal.tags.length ? ' · ' + meal.tags.map(esc).join(', ') : ''}</div>
    ${status.needsThaw ? '<div class="pill blue" style="align-self:flex-start">Thaw first</div>' : ''}
    <div class="sec">You'll use</div><div>${req.map(line).join('')}</div>
    ${opt.length ? `<div class="sec">If you have it</div><div>${opt.map(line).join('')}</div>` : ''}
    <div class="sec">Steps</div><ol class="steps">${meal.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="btns">
      <button class="btn sm" data-act="cook.plan" data-id="${esc(meal.id)}">${planned.includes(meal.id) ? 'Remove from plan' : 'Add to plan'}</button>
      <button class="btn sm" data-act="cook.skip" data-id="${esc(meal.id)}">${skipped.includes(meal.id) ? 'Bring back' : 'Not for me'}</button>
    </div>
    <div class="foot"><button class="btn primary" style="width:100%" data-act="cook.done">${status.cookable ? 'Done, I cooked it' : 'I cooked it anyway'}</button></div>`;
}

function confirm(ctx) {
  const now = ctx.now();
  const meal = ctx.state.meals.find(m => m.id === ctx.ui.mealId);
  const items = ctx.itemsById;
  const lines = meal.ingredients.filter(i => items[i.itemId]?.deduct && (!i.optional || totalQty(ctx.state.purchases, i.itemId, now) > 0));
  for (const l of lines) if (ctx.ui.steps[`c:${l.itemId}`] == null) ctx.ui.steps[`c:${l.itemId}`] = l.optional ? 0 : l.qty;
  const after = lines.map(l => {
    const item = items[l.itemId];
    const left = totalQty(ctx.state.purchases, l.itemId, now) - ctx.ui.steps[`c:${l.itemId}`];
    return `${item.name.toLowerCase()} ${left < 0 ? 'short by ' + qty(-left, item) : qty(left, item)}`;
  });
  return `<h3>Take from stock?</h3>
    <div class="muted small">${esc(meal.name)}. Change anything you used more or less of.</div>
    <div class="list">${lines.map(l => `<div class="row"><span class="grow">${esc(items[l.itemId].name)}${l.optional ? ' <span class="muted small">(optional)</span>' : ''}</span>
      ${stepper(`c:${l.itemId}`, ctx.ui.steps[`c:${l.itemId}`], items[l.itemId])}</div>`).join('')}</div>
    ${after.length ? `<div class="muted small">Left after: ${esc(after.join(', '))}</div>` : '<div class="muted small">Nothing to take from stock.</div>'}
    <div class="foot btns"><button class="btn" data-act="cook.back">Back</button><button class="btn primary" data-act="cook.confirm">Update stock</button></div>`;
}

export function openMeal(ctx, mealId) {
  ctx.ui.mealId = mealId;
  ctx.ui.steps = {};
  ctx.openSheet(detail);
}

export const mealActions = {
  done: (el, ctx) => { ctx.ui.steps = {}; ctx.openSheet(confirm); },
  back: (el, ctx) => ctx.openSheet(detail),
  confirm: async (el, ctx) => {
    const meal = ctx.state.meals.find(m => m.id === ctx.ui.mealId);
    const lines = Object.entries(ctx.ui.steps).filter(([k]) => k.startsWith('c:')).map(([k, v]) => ({ itemId: k.slice(2), qty: v }));
    ctx.closeSheet();
    if (ctx.ui.today) ctx.ui.today.i = 0;
    await ctx.run(cmd.cook, { mealId: meal.id, lines }, `Cooked ${meal.name}. Stock updated`);
  },
};
