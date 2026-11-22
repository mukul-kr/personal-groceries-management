import { daysLeft, formatDaysLeft } from '../core/dates.js';
import { formatQty } from '../core/units.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function urgencyClass(days) {
  if (days == null) return 'grey';
  if (days <= 1) return 'red';
  if (days <= 3) return 'amber';
  return 'green';
}

export function batchPill(p, now) {
  const d = daysLeft(p.expiresAt, now);
  if (p.state === 'frozen') {
    const month = new Date(p.expiresAt).toLocaleString('en-IN', { month: 'short' });
    return `<span class="pill blue">frozen · ${esc(month)}</span>`;
  }
  return `<span class="pill ${urgencyClass(d)}">${esc(formatDaysLeft(d))}</span>`;
}

export const qty = (n, item) => formatQty(n, item?.unit || 'pcs');

// Step for −/+ buttons: whole pieces, or a sensible chunk of grams/ml.
export function stepFor(item) {
  if (item.unit === 'pcs') return item.mealUse < 1 ? item.mealUse : 1;
  if (item.mealUse >= 100) return 50;
  if (item.mealUse >= 20) return 10;
  return 5;
}

export function stepper(key, value, item, { min = 0 } = {}) {
  return `<div class="stepper">
    <button type="button" data-act="step" data-key="${esc(key)}" data-delta="${-stepFor(item)}" data-min="${min}" aria-label="Less">−</button>
    <input class="search" style="width:84px;text-align:center;padding:6px" inputmode="decimal" data-input="stepset" data-key="${esc(key)}"
      id="step-${esc(key)}" value="${esc(+value.toFixed(2))}" aria-label="Amount in ${esc(item.unit)}">
    <span class="muted small">${item.unit === 'pcs' ? '' : esc(item.unit)}</span>
    <button type="button" data-act="step" data-key="${esc(key)}" data-delta="${stepFor(item)}" data-min="${min}" aria-label="More">+</button>
  </div>`;
}

// ── sheet ──
let sheetFn = null;
export function openSheet(fn, ctx) {
  sheetFn = fn;
  renderSheet(ctx);
}
export function closeSheet() {
  sheetFn = null;
  document.getElementById('sheet-root').innerHTML = '';
}
export function renderSheet(ctx) {
  if (!sheetFn) return;
  const root = document.getElementById('sheet-root');
  const scroll = root.querySelector('.sheet')?.scrollTop || 0;
  root.innerHTML = `<div class="backdrop" data-act="sheet.close"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${sheetFn(ctx)}</div>`;
  root.querySelector('.sheet').scrollTop = scroll;
}
export const sheetOpen = () => sheetFn != null;

// ── toast ──
let toastTimer;
export function toast(message, undo) {
  const el = document.getElementById('toast');
  el.innerHTML = `<span>${esc(message)}</span>${undo ? '<button type="button" data-act="toast.undo">Undo</button>' : ''}`;
  el.hidden = false;
  toast.undo = undo || null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; toast.undo = null; }, 6000);
}
export function hideToast() {
  document.getElementById('toast').hidden = true;
  toast.undo = null;
}
