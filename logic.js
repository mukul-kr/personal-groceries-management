// Pure functions. Works in the browser (window.MealLogic) and in Node (require).
(function (root) {
  function missingFor(recipe, have) {
    return recipe.needs.filter(id => !have.has(id));
  }

  function cookable(recipes, have) {
    return recipes.filter(r => missingFor(r, have).length === 0);
  }

  function almost(recipes, have, n = 1) {
    return recipes.filter(r => {
      const m = missingFor(r, have).length;
      return m >= 1 && m <= n;
    });
  }

  // For each ingredient you don't have: how many meals become cookable if you
  // buy just that one, and how many meals use it at all.
  function unlockScores(recipes, ingredients, have) {
    return ingredients
      .filter(i => !have.has(i.id))
      .map(i => {
        let unlocks = 0, usedIn = 0;
        for (const r of recipes) {
          const inNeeds = r.needs.includes(i.id);
          if (inNeeds || (r.optional || []).includes(i.id)) usedIn++;
          if (inNeeds) {
            const m = missingFor(r, have);
            if (m.length === 1 && m[0] === i.id) unlocks++;
          }
        }
        return { id: i.id, unlocks, usedIn };
      })
      .sort((a, b) => b.unlocks - a.unlocks || b.usedIn - a.usedIn);
  }

  function shoppingList(recipes, have) {
    const out = new Set();
    for (const r of recipes) for (const id of missingFor(r, have)) out.add(id);
    return [...out];
  }

  function validateData(ingredients, recipes) {
    const errors = [];
    const ids = new Set();
    for (const i of ingredients) {
      if (ids.has(i.id)) errors.push(`duplicate ingredient id: ${i.id}`);
      ids.add(i.id);
    }
    const seen = new Set();
    for (const r of recipes) {
      if (seen.has(r.id)) errors.push(`duplicate recipe id: ${r.id}`);
      seen.add(r.id);
      for (const id of [...r.needs, ...(r.optional || [])]) {
        if (!ids.has(id)) errors.push(`recipe ${r.id} uses unknown ingredient: ${id}`);
      }
    }
    return errors;
  }

  const api = { missingFor, cookable, almost, unlockScores, shoppingList, validateData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MealLogic = api;
})(this);
