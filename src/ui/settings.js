import { daysSince } from '../core/dates.js';
import { makeBackup, parseBackup } from '../core/backup.js';
import * as cmd from '../core/commands.js';
import { categories } from '../data/catalog.js';
import { esc, qty } from './components.js';
import { APPS, enabledApps } from './shop.js';

export function view(ctx) {
  const ui = (ctx.ui.settings ||= { q: '' });
  const s = ctx.state.settings;
  const now = ctx.now();
  const last = s.lastBackupAt ? `Last backup ${Math.floor(daysSince(s.lastBackupAt, now))} days ago` : 'Never backed up';
  const q = ui.q.trim().toLowerCase();
  const items = ctx.state.items.filter(i => !q || i.name.toLowerCase().includes(q));
  return `<div class="head"><h1>Settings</h1><a class="btn sm" href="#today">Done</a></div>
    <div class="sec">Backup</div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div class="muted small">Everything lives on this phone. Save a backup to Files or iCloud Drive now and then. ${esc(last)}.</div>
      <div class="btns"><button class="btn primary" data-act="settings.export">Export backup</button>
        <label class="btn" for="import-file">Import backup</label></div>
      <input id="import-file" type="file" accept="application/json,.json" data-change="settings.import" hidden>
    </div>
    <div class="sec">Shopping</div>
    <div class="card"><label class="field">Warn me before running out<select id="warn" data-change="settings.warn">
        ${[1, 2, 3, 4, 5, 7].map(n => `<option value="${n}" ${s.warnDays === n ? 'selected' : ''}>${n} day${n > 1 ? 's' : ''}</option>`).join('')}</select></label></div>
    <div class="sec">Apps you order from</div>
    <div class="list">${Object.entries(APPS).map(([k, a]) => {
      const on = enabledApps(s).includes(k);
      return `<button class="row" data-act="settings.app" data-k="${k}" aria-pressed="${on}">
        <span class="check ${on ? 'on' : ''}" aria-hidden="true">${on ? '✓' : ''}</span><span class="grow">${a.name}</span></button>`;
    }).join('')}</div>
    <div class="muted small" style="margin-top:-6px">Shop's “Find” button lists these, so you can compare prices.</div>
    <div class="sec">Items</div>
    <input class="search" id="settings-q" type="search" placeholder="Search items" value="${esc(ui.q)}" data-input="settings.search" autocomplete="off">
    <div class="list">${items.map(i => `<button class="row" data-act="settings.editItem" data-id="${esc(i.id)}">
      <span class="grow">${esc(i.name)}${i.edited ? ' <span class="pill grey">edited</span>' : ''}
        <div class="sub">${esc(qty(i.usualPack, i))} · ${i.source === 'store' ? 'store' : 'online'} · ${esc(categories[i.cat])}</div></span><span class="chev">›</span></button>`).join('')}</div>
    <div class="muted small" style="text-align:center">Solo Kitchen · data stays on this device</div>`;
}

function itemSheet(ctx) {
  const i = ctx.itemsById[ctx.ui.editId];
  const unit = i.unit === 'pcs' ? 'pieces' : i.unit;
  const num = (id, label, value, allowEmpty) => `<label class="field">${label}
    <input id="ed-${id}" inputmode="decimal" value="${value ?? ''}" placeholder="${allowEmpty ? 'not freezable' : ''}"></label>`;
  return `<h3>${esc(i.name)}</h3>
    <div class="grid2">
      ${num('usual', `Usual pack (${unit})`, i.usualPack)}
      ${num('low', `Running low at (${unit})`, i.lowAt)}
      ${num('meal', `One meal uses (${unit})`, i.mealUse)}
      <label class="field">Bought from<select id="ed-source"><option value="online" ${i.source === 'online' ? 'selected' : ''}>Online</option>
        <option value="store" ${i.source === 'store' ? 'selected' : ''}>Store</option></select></label>
    </div>
    <div class="sec">Keeps for (days)</div>
    <div class="grid2">
      ${num('fresh', 'As bought', i.shelf.fresh)}
      ${num('opened', 'Once opened', i.shelf.opened)}
      ${num('frozen', 'In the freezer', i.shelf.frozen, true)}
      <label class="field">Cooking takes it from stock<select id="ed-deduct"><option value="1" ${i.deduct ? 'selected' : ''}>Yes</option>
        <option value="0" ${i.deduct ? '' : 'selected'}>No (masalas etc.)</option></select></label>
    </div>
    <div class="muted small" id="ed-error" role="alert"></div>
    <div class="foot btns"><button class="btn" data-act="sheet.close">Cancel</button><button class="btn primary" data-act="settings.saveItem">Save</button></div>`;
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

export const actions = {
  search: (el, ctx) => { ctx.ui.settings.q = el.value; ctx.render(); },
  warn: (el, ctx) => ctx.run(cmd.setSettings, { warnDays: +el.value }, null),
  app: (el, ctx) => {
    const on = enabledApps(ctx.state.settings);
    const k = el.dataset.k;
    const next = on.includes(k) ? on.filter(x => x !== k) : Object.keys(APPS).filter(x => x === k || on.includes(x));
    if (!next.length) return ctx.toast('Keep at least one app.');
    ctx.run(cmd.setSettings, { shopApps: next }, null);
  },
  editItem: (el, ctx) => { ctx.ui.editId = el.dataset.id; ctx.openSheet(itemSheet); },
  saveItem: (el, ctx) => {
    const i = ctx.itemsById[ctx.ui.editId];
    const v = id => document.getElementById(`ed-${id}`).value.trim();
    const n = id => (v(id) === '' ? null : Number(v(id)));
    const err = msg => { document.getElementById('ed-error').textContent = msg; };
    const item = { ...i, usualPack: n('usual'), lowAt: n('low') ?? 0, mealUse: n('meal'), source: v('source'), deduct: v('deduct') === '1',
      shelf: { fresh: n('fresh'), opened: n('opened'), frozen: n('frozen') } };
    if (!(item.usualPack > 0)) return err('Usual pack must be more than 0.');
    if (!(item.mealUse > 0)) return err('“One meal uses” must be more than 0.');
    if (!(item.shelf.fresh > 0)) return err('“As bought” must be at least 1 day.');
    if ([item.lowAt, item.shelf.opened ?? 0, item.shelf.frozen ?? 0].some(x => Number.isNaN(x) || x < 0)) return err('Use numbers of 0 or more.');
    ctx.closeSheet();
    ctx.run(cmd.saveItem, { item }, `${i.name} saved`);
  },
  export: async (el, ctx) => {
    const now = ctx.now();
    const text = JSON.stringify(makeBackup(ctx.state, now));
    const name = `solo-kitchen-${new Date(now).toISOString().slice(0, 10)}.json`;
    const file = new File([text], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Solo Kitchen backup' });
      else download(name, text);
    } catch (e) {
      if (e.name === 'AbortError') return; // user closed the share sheet
      download(name, text);
    }
    await ctx.run(cmd.setSettings, { lastBackupAt: now }, null);
    ctx.toast('Backup saved');
  },
  import: async (el, ctx) => {
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    const r = parseBackup(await file.text());
    if (!r.ok) return ctx.toast(r.error);
    ctx.ui.pendingImport = r.data;
    const inStock = r.data.purchases.filter(p => p.qty > 0).length;
    ctx.openSheet(() => `<h3>Replace this phone's data?</h3>
      <div class="muted">The backup has ${inStock} item${inStock === 1 ? '' : 's'} in stock and ${r.data.history.length} history entries.
        Everything currently on this phone will be replaced. This can't be undone.</div>
      <div class="foot btns"><button class="btn" data-act="sheet.close">Cancel</button><button class="btn primary" data-act="settings.confirmImport">Replace</button></div>`);
  },
  confirmImport: async (el, ctx) => {
    const data = ctx.ui.pendingImport;
    ctx.ui.pendingImport = null;
    ctx.closeSheet();
    try { await ctx.adapter.replaceAll(data); } catch { return ctx.toast("Couldn't import. Nothing was changed."); }
    ctx.state = data;
    ctx.render();
    ctx.toast('Backup restored');
  },
};
