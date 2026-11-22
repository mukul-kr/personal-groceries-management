import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY, daysLeft, daysSince, formatDaysLeft } from '../src/core/dates.js';
import { formatQty } from '../src/core/units.js';
import { expiryOnBuy, applyOpen, applyFreeze, applyThaw, isExpired } from '../src/core/expiry.js';

const now = Date.UTC(2026, 10, 22, 12); // Nov 22 2026, noon

test('daysLeft rounds partial days up; past is <= 0', () => {
  assert.equal(daysLeft(now + 1.2 * DAY, now), 2);
  assert.equal(daysLeft(now + 0.5 * DAY, now), 1);
  assert.ok(daysLeft(now - 1, now) <= 0);
});

test('daysSince returns fractional days', () => {
  assert.equal(daysSince(now - 3 * DAY, now), 3);
});

test('formatDaysLeft speaks plainly', () => {
  assert.equal(formatDaysLeft(-1), 'expired');
  assert.equal(formatDaysLeft(0), 'today');
  assert.equal(formatDaysLeft(1), 'tomorrow');
  assert.equal(formatDaysLeft(5), '5 days');
  assert.equal(formatDaysLeft(20), '3 wks');
  assert.equal(formatDaysLeft(90), 'months');
});

test('formatQty picks readable units', () => {
  assert.equal(formatQty(1200, 'g'), '1.2 kg');
  assert.equal(formatQty(200, 'g'), '200 g');
  assert.equal(formatQty(1000, 'ml'), '1 L');
  assert.equal(formatQty(250, 'ml'), '250 ml');
  assert.equal(formatQty(3, 'pcs'), '3');
  assert.equal(formatQty(2.5, 'pcs'), '2.5');
});

test('expiryOnBuy adds fresh shelf life', () => {
  assert.equal(expiryOnBuy({ shelf: { fresh: 5 } }, now), now + 5 * DAY);
});

test('applyOpen takes the sooner of current expiry and opened shelf life', () => {
  const puree = { shelf: { fresh: 365, opened: 5, frozen: null } };
  const p = { id: 'p1', qty: 200, state: 'sealed', boughtAt: now, expiresAt: now + 365 * DAY };
  const opened = applyOpen(p, puree, now + 10 * DAY);
  assert.equal(opened.state, 'opened');
  assert.equal(opened.expiresAt, now + 15 * DAY);

  const paneer = { shelf: { fresh: 6, opened: 3, frozen: 60 } };
  const q = { id: 'p2', qty: 200, state: 'sealed', boughtAt: now, expiresAt: now + 1 * DAY };
  assert.equal(applyOpen(q, paneer, now).expiresAt, now + 1 * DAY);

  const noOpened = { shelf: { fresh: 30, opened: null, frozen: null } };
  assert.equal(applyOpen(q, noOpened, now).expiresAt, q.expiresAt);
  assert.equal(p.state, 'sealed', 'input not mutated');
});

test('applyFreeze resets expiry to frozen shelf life; refuses unfreezable items', () => {
  const chicken = { id: 'chicken', shelf: { fresh: 2, opened: null, frozen: 90 } };
  const p = { id: 'p', qty: 500, state: 'sealed', boughtAt: now, expiresAt: now + 2 * DAY };
  const f = applyFreeze(p, chicken, now);
  assert.equal(f.state, 'frozen');
  assert.equal(f.expiresAt, now + 90 * DAY);
  assert.throws(() => applyFreeze(p, { id: 'curd', shelf: { fresh: 6, opened: 4, frozen: null } }, now), /cannot freeze curd/);
});

test('applyThaw gives one day, marked opened', () => {
  const t = applyThaw({ id: 'p', state: 'frozen', expiresAt: now + 80 * DAY }, now);
  assert.equal(t.state, 'opened');
  assert.equal(t.expiresAt, now + DAY);
});

test('isExpired at or after expiry', () => {
  assert.equal(isExpired({ expiresAt: now }, now), true);
  assert.equal(isExpired({ expiresAt: now + 1 }, now), false);
});
