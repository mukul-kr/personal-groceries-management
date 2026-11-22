(function () {
  const { categories, ingredients, recipes, starter } = window.MEAL_DATA;
  const L = window.MealLogic;
  const byId = Object.fromEntries(ingredients.map(i => [i.id, i]));
  const name = id => (byId[id] ? byId[id].name : id);

  const problems = L.validateData(ingredients, recipes);
  if (problems.length) console.warn('data.js problems:\n' + problems.join('\n'));

  // ── persisted state (this browser only) ──
  const KEY = 'solo-kitchen-v1';
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  }
  const saved = load();
  const state = {
    have: new Set(saved ? saved.have : starter),
    planned: new Set(saved ? saved.planned : []),
    skipped: new Set(saved ? saved.skipped : []),
    tab: ['cook', 'kitchen', 'shop'].includes(location.hash.slice(1)) ? location.hash.slice(1) : (saved && saved.tab) || 'cook',
    f: { status: 'ready', time: 0, proteins: new Set(), tags: new Set(), q: '', showSkipped: false },
  };
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        have: [...state.have], planned: [...state.planned], skipped: [...state.skipped], tab: state.tab,
      }));
    } catch { /* storage blocked: app still works for this session */ }
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const app = document.getElementById('app');
  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort();
  const allProteins = [...new Set(recipes.map(r => r.protein))];
  const usedCount = id => recipes.filter(r => r.needs.includes(id) || r.optional.includes(id)).length;

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 1800);
  }

  // ── COOK ──
  function filtered() {
    const f = state.f, q = f.q.trim().toLowerCase();
    return recipes.filter(r => {
      if (!f.showSkipped && state.skipped.has(r.id)) return false;
      const miss = L.missingFor(r, state.have).length;
      if (f.status === 'ready' && miss !== 0) return false;
      if (f.status === 'one' && miss !== 1) return false;
      if (f.time && r.time > f.time) return false;
      if (f.proteins.size && !f.proteins.has(r.protein)) return false;
      if (f.tags.size && ![...f.tags].every(t => r.tags.includes(t))) return false;
      if (q && !(r.name + ' ' + r.needs.map(name).join(' ')).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function chip(label, pressed, action, value) {
    return `<button class="chip" aria-pressed="${pressed}" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
  }

  function card(r) {
    const miss = L.missingFor(r, state.have);
    const planned = state.planned.has(r.id), skipped = state.skipped.has(r.id);
    const opt = r.optional.filter(id => state.have.has(id));
    return `<article class="card" id="r-${r.id}">
      <h3>${esc(r.name)}</h3>
      <div class="meta"><span class="p">${esc(r.protein)}</span><span>${r.time} min</span>${r.tags.map(t => `<span>· ${esc(t)}</span>`).join('')}</div>
      <div class="status ${miss.length ? 'no' : 'ok'}">${miss.length ? `Need ${miss.length} more` : 'You can cook this now'}</div>
      <div class="ings">${r.needs.filter(id => byId[id] && byId[id].cat !== 'basics' || miss.includes(id))
        .map(id => `<span class="ing ${miss.includes(id) ? 'miss' : ''}">${esc(name(id))}</span>`).join('')}</div>
      ${r.optional.length ? `<div class="opt">Optional: ${r.optional.map(id => opt.includes(id) ? `<b>${esc(name(id))}</b>` : esc(name(id))).join(', ')}</div>` : ''}
      <details><summary>How to make it</summary>${esc(r.how)}</details>
      <div class="actions">
        <button class="btn small ${planned ? 'primary' : ''}" data-action="plan" data-value="${r.id}">${planned ? 'Planned ✓' : 'Add to plan'}</button>
        <button class="btn small" data-action="skip" data-value="${r.id}">${skipped ? 'Bring back' : 'Not for me'}</button>
      </div>
    </article>`;
  }

  function renderCook() {
    const f = state.f;
    const ready = L.cookable(recipes, state.have).filter(r => !state.skipped.has(r.id)).length;
    const one = L.almost(recipes, state.have, 1).filter(r => !state.skipped.has(r.id)).length;
    const list = filtered();
    app.innerHTML = `
      <div class="summary">
        <span><b>${ready}</b>meals you can cook right now</span>
        <span><b>${one}</b>are one item away</span>
        <span><b>${recipes.length}</b>meals in total</span>
      </div>
      <div class="filters">
        <div class="row"><input type="search" id="q" placeholder="Search a meal or ingredient…" value="${esc(f.q)}">
          <button class="btn primary" data-action="surprise">Surprise me</button></div>
        <div class="row"><span class="lbl">Show</span>
          ${chip('Ready now', f.status === 'ready', 'status', 'ready')}
          ${chip('1 item away', f.status === 'one', 'status', 'one')}
          ${chip('Everything', f.status === 'all', 'status', 'all')}
          ${chip(`Skipped (${state.skipped.size})`, f.showSkipped, 'showSkipped', '')}</div>
        <div class="row"><span class="lbl">Time</span>
          ${chip('Any', f.time === 0, 'time', 0)}${chip('≤ 10 min', f.time === 10, 'time', 10)}${chip('≤ 20 min', f.time === 20, 'time', 20)}</div>
        <div class="row"><span class="lbl">Protein</span>${allProteins.map(p => chip(p, f.proteins.has(p), 'protein', p)).join('')}</div>
        <div class="row"><span class="lbl">Style</span>${allTags.map(t => chip(t, f.tags.has(t), 'tag', t)).join('')}</div>
      </div>
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>`
        : `<div class="empty">No meals match these filters.${f.status === 'ready' ? ' Try “1 item away”, or tick more items in My kitchen.' : ''}</div>`}`;
    const q = document.getElementById('q');
    q.addEventListener('input', e => {
      f.q = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const nq = document.getElementById('q'); nq.focus(); nq.setSelectionRange(pos, pos);
    });
  }

  // ── KITCHEN ──
  function renderKitchen() {
    app.innerHTML = `
      <div class="summary"><span><b>${state.have.size}</b>of ${ingredients.length} items in your kitchen</span></div>
      <div class="row" style="margin-bottom:16px">
        <button class="btn" data-action="starter">Load starter kit</button>
        <button class="btn" data-action="clearHave">Clear all</button>
        <span class="opt">Tick what you have. The number on the right is how many meals use it.</span>
      </div>
      <div class="cats">${Object.entries(categories).map(([cat, label]) => {
        const items = ingredients.filter(i => i.cat === cat);
        return `<section class="cat"><h3>${esc(label)}
          <span><button class="btn small" data-action="catAll" data-value="${cat}">All</button>
          <button class="btn small" data-action="catNone" data-value="${cat}">None</button></span></h3>
          ${items.map(i => `<div class="item">
            <input type="checkbox" id="h-${i.id}" data-action="toggleHave" data-value="${i.id}" ${state.have.has(i.id) ? 'checked' : ''}>
            <label for="h-${i.id}">${esc(i.name)}<small>keeps ${esc(i.keeps)}${i.note ? ' · ' + esc(i.note) : ''}</small></label>
            <span class="used">${i.cat === 'basics' && usedCount(i.id) < 5 ? 'most meals' : usedCount(i.id) + (usedCount(i.id) === 1 ? ' meal' : ' meals')}</span></div>`).join('')}
        </section>`;
      }).join('')}</div>`;
  }

  // ── SHOP ──
  function groupedList(ids) {
    return Object.entries(categories).map(([cat, label]) => {
      const inCat = ids.filter(id => byId[id].cat === cat);
      return inCat.length ? `<div class="group-h">${esc(label)}</div><ul class="plain">${inCat.map(id =>
        `<li><span>${esc(name(id))}</span><span class="used">keeps ${esc(byId[id].keeps)}</span></li>`).join('')}</ul>` : '';
    }).join('');
  }

  function renderShop() {
    const plannedRecipes = recipes.filter(r => state.planned.has(r.id));
    const toBuy = L.shoppingList(plannedRecipes, state.have);
    const scores = L.unlockScores(recipes.filter(r => !state.skipped.has(r.id)), ingredients, state.have)
      .filter(s => s.usedIn > 0).slice(0, 15);
    app.innerHTML = `<div class="shop">
      <section class="panel">
        <h2>Best things to buy next</h2>
        <p class="hint">Ranked by how many new meals each item unlocks on its own, given what you already have.</p>
        ${scores.length ? `<table><tr><th>Item</th><th class="num">New meals</th><th class="num">Used in</th><th></th></tr>
          ${scores.map(s => `<tr><td>${esc(name(s.id))}<br><span class="used">keeps ${esc(byId[s.id].keeps)}</span></td>
            <td class="num ${s.unlocks ? 'unlock' : ''}">+${s.unlocks}</td><td class="num">${s.usedIn}</td>
            <td><button class="btn small" data-action="gotIt" data-value="${s.id}">I have it</button></td></tr>`).join('')}</table>`
          : '<div class="empty">You already have everything.</div>'}
      </section>
      <section class="panel">
        <h2>Shopping list for your plan</h2>
        <p class="hint">Add meals with “Add to plan” on the Cook tab. Everything they need that you don't have shows here.</p>
        ${plannedRecipes.length ? `<ul class="plain">${plannedRecipes.map(r =>
          `<li><span>${esc(r.name)}</span><button class="btn small" data-action="plan" data-value="${r.id}">Remove</button></li>`).join('')}</ul>
          <div class="group-h" style="margin-top:18px">To buy (${toBuy.length})</div>
          ${toBuy.length ? groupedList(toBuy) + `<div class="row" style="margin-top:14px">
            <button class="btn primary" data-action="copy">Copy list</button>
            <button class="btn" data-action="bought">Mark all as bought</button></div>`
            : '<p class="hint">You have everything for these meals.</p>'}
          <div class="row" style="margin-top:10px"><button class="btn small" data-action="clearPlan">Clear plan</button></div>`
          : '<div class="empty">No meals planned yet.</div>'}
      </section></div>`;
  }

  function render() {
    document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === state.tab));
    ({ cook: renderCook, kitchen: renderKitchen, shop: renderShop })[state.tab]();
    save();
  }

  // ── events ──
  const toggle = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));
  const actions = {
    status: v => (state.f.status = v),
    time: v => (state.f.time = Number(v)),
    protein: v => toggle(state.f.proteins, v),
    tag: v => toggle(state.f.tags, v),
    showSkipped: () => (state.f.showSkipped = !state.f.showSkipped),
    plan: v => toggle(state.planned, v),
    skip: v => toggle(state.skipped, v),
    toggleHave: v => toggle(state.have, v),
    starter: () => { state.have = new Set(starter); toast('Starter kit loaded'); },
    clearHave: () => { state.have.clear(); },
    catAll: c => ingredients.filter(i => i.cat === c).forEach(i => state.have.add(i.id)),
    catNone: c => ingredients.filter(i => i.cat === c).forEach(i => state.have.delete(i.id)),
    gotIt: v => { state.have.add(v); toast(`Added ${name(v)}`); },
    clearPlan: () => state.planned.clear(),
    bought: () => {
      L.shoppingList(recipes.filter(r => state.planned.has(r.id)), state.have).forEach(id => state.have.add(id));
      toast('Marked as bought');
    },
    copy: () => {
      const ids = L.shoppingList(recipes.filter(r => state.planned.has(r.id)), state.have);
      const text = ids.map(id => '- ' + name(id)).join('\n');
      navigator.clipboard?.writeText(text).then(() => toast('List copied'), () => toast('Copy failed, select the list instead'));
      return 'norender';
    },
    surprise: () => {
      const list = filtered();
      if (!list.length) { toast('Nothing matches. Loosen the filters.'); return 'norender'; }
      const pick = list[Math.floor(Math.random() * list.length)];
      const el = document.getElementById('r-' + pick.id);
      document.querySelectorAll('.card.flash').forEach(c => c.classList.remove('flash'));
      el.classList.add('flash');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(pick.name);
      return 'norender';
    },
  };

  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { state.tab = tab.dataset.tab; render(); window.scrollTo(0, 0); return; }
    const el = e.target.closest('[data-action]');
    if (!el || !actions[el.dataset.action]) return;
    const y = window.scrollY;
    if (actions[el.dataset.action](el.dataset.value) !== 'norender') { render(); window.scrollTo(0, y); }
  });

  render();
})();
