import { daysSince, formatDaysLeft } from './dates.js';
import { cookStatus } from './stock.js';

const lastCooked = (history, mealId) =>
  history.reduce((t, h) => (h.type === 'cooked' && h.mealId === mealId && h.at > t ? h.at : t), -Infinity);

export function rankMeals(state, now) {
  const itemsById = Object.fromEntries(state.items.map(i => [i.id, i]));
  const { planned = [], skipped = [] } = state.settings;
  const out = [];
  for (const meal of state.meals) {
    if (skipped.includes(meal.id)) continue;
    const status = cookStatus(meal, itemsById, state.purchases, now);
    if (!status.cookable) continue;

    const urgent = status.uses
      .filter(u => u.daysLeft != null)
      .map(u => ({ ...u, bonus: Math.max(0, 5 - u.daysLeft) * (u.optional ? 0.5 : 1) }))
      .filter(u => u.bonus > 0)
      .sort((a, b) => b.bonus - a.bonus);
    let score = urgent.reduce((s, u) => s + u.bonus, 0);
    const reasons = urgent.slice(0, 2).map(u =>
      `Uses ${(itemsById[u.itemId]?.name || u.itemId).toLowerCase()} (${formatDaysLeft(u.daysLeft)})`);

    if (planned.includes(meal.id)) { score += 2; reasons.push('Planned'); }

    const ago = daysSince(lastCooked(state.history, meal.id), now);
    if (ago < 5) {
      score -= ago < 2 ? 3 : 1;
      const d = Math.max(0, Math.floor(ago));
      reasons.push(d === 0 ? 'Cooked today' : `Cooked ${d} day${d === 1 ? '' : 's'} ago`);
    }
    out.push({ meal, status, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score || a.meal.minutes - b.meal.minutes || a.meal.name.localeCompare(b.meal.name));
}
