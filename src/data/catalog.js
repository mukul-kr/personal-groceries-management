// ─────────────────────────────────────────────────────────────────────────────
// Built-in items. Edit here to change defaults for everyone; edits made in the
// app's Settings are kept separately and never overwritten.
//
// it(id, name, cat, unit, usualPack, source, [fresh, opened, frozen], lowAt, deduct, mealUse, note?)
//   unit      g | ml | pcs
//   usualPack what you normally buy (in unit)
//   source    online (Blinkit/Zepto/…) | store (local shop)
//   shelf     days: fresh = as bought, opened = after opening (null: no change),
//             frozen = in the freezer (null: don't freeze)
//   lowAt     put on the shopping list at or below this amount
//   deduct    whether cooking a meal takes this from stock (false for masalas etc.)
//   mealUse   typical amount one meal uses
// ─────────────────────────────────────────────────────────────────────────────

export const categories = {
  basics: 'Basics',
  dry: 'Dry pantry',
  flavor: 'Sauces & masalas',
  keeps: 'Keeps 2–4 weeks',
  fresh: 'Fresh',
  frozen: 'Freezer',
};

// Which Stock view an item belongs to.
export const place = { basics: 'pantry', dry: 'pantry', flavor: 'pantry', keeps: 'fridge', fresh: 'fridge', frozen: 'freezer' };

const it = (id, name, cat, unit, usualPack, source, [fresh, opened, frozen], lowAt, deduct, mealUse, note) =>
  ({ id, name, cat, unit, usualPack, source, shelf: { fresh, opened, frozen }, lowAt, deduct, mealUse, ...(note ? { note } : {}) });

export const items = [
  // basics: meals don't deduct these; mark them low yourself
  it('salt', 'Salt', 'basics', 'g', 1000, 'online', [730, null, null], 100, false, 3),
  it('oil', 'Cooking oil', 'basics', 'ml', 1000, 'online', [270, 180, null], 200, false, 10),
  it('ghee', 'Ghee', 'basics', 'ml', 500, 'online', [270, 180, null], 100, false, 10),
  it('turmeric', 'Turmeric (haldi)', 'basics', 'g', 100, 'online', [365, 365, null], 20, false, 1),
  it('chilli', 'Red chilli powder', 'basics', 'g', 100, 'online', [365, 365, null], 20, false, 1),
  it('jeera', 'Cumin seeds (jeera)', 'basics', 'g', 100, 'online', [365, 365, null], 20, false, 2),
  it('mustard', 'Mustard seeds (rai)', 'basics', 'g', 100, 'online', [365, 365, null], 20, false, 2),
  it('garam', 'Garam masala', 'basics', 'g', 100, 'online', [270, 270, null], 20, false, 1),
  it('dhania_pd', 'Coriander powder', 'basics', 'g', 100, 'online', [270, 270, null], 20, false, 2),
  it('pepper', 'Black pepper', 'basics', 'g', 100, 'online', [365, 365, null], 20, false, 2),
  it('hing', 'Hing (asafoetida)', 'basics', 'g', 50, 'online', [365, 365, null], 10, false, 1),
  it('sugar', 'Sugar', 'basics', 'g', 1000, 'online', [730, null, null], 100, false, 5),

  // dry pantry
  it('rice', 'Rice', 'dry', 'g', 5000, 'online', [365, 270, null], 1000, true, 80),
  it('poha', 'Poha (thick)', 'dry', 'g', 500, 'online', [180, 90, null], 150, true, 70),
  it('oats', 'Rolled oats', 'dry', 'g', 1000, 'online', [270, 120, null], 200, true, 50),
  it('sooji', 'Roasted sooji / rava', 'dry', 'g', 500, 'online', [180, 90, null], 150, true, 60),
  it('vermicelli', 'Roasted vermicelli', 'dry', 'g', 400, 'online', [270, 120, null], 100, true, 60),
  it('dalia', 'Dalia (broken wheat)', 'dry', 'g', 500, 'online', [270, 120, null], 150, true, 50),
  it('besan', 'Besan (gram flour)', 'dry', 'g', 500, 'online', [180, 90, null], 150, true, 60),
  it('sattu', 'Sattu', 'dry', 'g', 500, 'online', [180, 90, null], 100, true, 40),
  it('moong', 'Moong dal (yellow)', 'dry', 'g', 1000, 'online', [365, 270, null], 200, true, 50),
  it('masoor', 'Masoor dal (red)', 'dry', 'g', 1000, 'online', [365, 270, null], 200, true, 50),
  it('soya', 'Soya chunks', 'dry', 'g', 200, 'online', [365, 180, null], 50, true, 40),
  it('soya_gran', 'Soya granules', 'dry', 'g', 200, 'online', [365, 180, null], 50, true, 40),
  it('canned_chana', 'Ready chickpeas (tin)', 'dry', 'g', 400, 'online', [365, 3, null], 0, true, 200, 'once opened, keep in fridge'),
  it('canned_rajma', 'Ready rajma (tin)', 'dry', 'g', 400, 'online', [365, 3, null], 0, true, 200, 'once opened, keep in fridge'),
  it('peanuts', 'Roasted peanuts', 'dry', 'g', 200, 'online', [120, 60, null], 50, true, 25),
  it('roasted_chana', 'Roasted chana', 'dry', 'g', 200, 'online', [120, 60, null], 50, true, 30),
  it('makhana', 'Makhana', 'dry', 'g', 100, 'online', [180, 30, null], 20, true, 30),
  it('pb', 'Peanut butter', 'dry', 'g', 350, 'online', [270, 90, null], 80, true, 30),
  it('noodles', 'Hakka noodles', 'dry', 'g', 300, 'online', [270, 180, null], 0, true, 75),
  it('pasta', 'Pasta (penne)', 'dry', 'g', 500, 'online', [365, 180, null], 100, true, 90),
  it('uht_milk', 'UHT tetra milk', 'dry', 'ml', 1000, 'online', [90, 2, null], 0, true, 200, 'once opened, 2 days in fridge'),
  it('honey', 'Honey', 'dry', 'g', 250, 'online', [730, 730, null], 50, true, 15),

  // sauces & masalas (not deducted, except tomato puree which is used by the cup)
  it('gg_paste', 'Ginger-garlic paste', 'flavor', 'g', 200, 'online', [180, 60, null], 30, false, 10),
  it('tomato_puree', 'Tomato puree (tetra)', 'flavor', 'g', 200, 'online', [365, 5, 60], 0, true, 100),
  it('soy', 'Soy sauce', 'flavor', 'ml', 200, 'online', [365, 180, null], 30, false, 10),
  it('vinegar', 'Vinegar', 'flavor', 'ml', 600, 'online', [730, 365, null], 50, false, 5),
  it('schezwan', 'Schezwan chutney', 'flavor', 'g', 250, 'online', [180, 60, null], 30, false, 30),
  it('ketchup', 'Ketchup', 'flavor', 'g', 500, 'online', [270, 90, null], 50, false, 20),
  it('mayo', 'Mayonnaise', 'flavor', 'g', 250, 'online', [180, 60, null], 30, false, 30),
  it('pickle', 'Pickle (achar)', 'flavor', 'g', 300, 'online', [365, 270, null], 50, false, 15),
  it('chilli_flakes', 'Chilli flakes', 'flavor', 'g', 50, 'online', [365, 270, null], 10, false, 2),
  it('oregano', 'Oregano', 'flavor', 'g', 50, 'online', [365, 270, null], 10, false, 2),
  it('peri_peri', 'Peri-peri masala', 'flavor', 'g', 100, 'online', [365, 270, null], 10, false, 3),
  it('kasuri_methi', 'Kasuri methi', 'flavor', 'g', 50, 'online', [365, 270, null], 10, false, 2),
  it('chaat_masala', 'Chaat masala', 'flavor', 'g', 100, 'online', [365, 270, null], 10, false, 2),
  it('pav_bhaji_masala', 'Pav bhaji masala', 'flavor', 'g', 100, 'online', [365, 270, null], 10, false, 5),
  it('sambar_masala', 'Sambar powder', 'flavor', 'g', 100, 'online', [365, 270, null], 10, false, 5),

  // keeps 2–4 weeks
  it('onion', 'Onions', 'keeps', 'pcs', 8, 'store', [28, null, null], 2, true, 1, '1 kg is about 8'),
  it('potato', 'Potatoes', 'keeps', 'pcs', 6, 'store', [28, null, null], 1, true, 1),
  it('eggs', 'Eggs', 'keeps', 'pcs', 12, 'online', [21, null, null], 3, true, 2),
  it('lemon', 'Lemons', 'keeps', 'pcs', 4, 'store', [14, 3, null], 0, true, 1),
  it('carrot', 'Carrots', 'keeps', 'pcs', 4, 'store', [18, null, null], 0, true, 1),
  it('cabbage', 'Cabbage', 'keeps', 'pcs', 1, 'store', [14, 5, null], 0, true, 0.25),
  it('cheese', 'Cheese slices', 'keeps', 'pcs', 10, 'online', [60, 14, 90], 2, true, 1),
  it('butter', 'Butter', 'keeps', 'g', 100, 'online', [60, 30, 180], 20, false, 10),
  it('curry_leaves', 'Curry leaves', 'keeps', 'g', 50, 'store', [14, null, 60], 0, false, 5),

  // fresh
  it('tomato', 'Tomatoes', 'fresh', 'pcs', 6, 'store', [7, null, null], 1, true, 1),
  it('green_chilli', 'Green chillies', 'fresh', 'g', 100, 'store', [10, null, 60], 20, false, 5),
  it('curd', 'Curd (dahi)', 'fresh', 'g', 400, 'online', [6, 4, null], 100, true, 100),
  it('paneer', 'Paneer', 'fresh', 'g', 200, 'online', [6, 3, 60], 0, true, 100),
  it('bread', 'Bread / pav', 'fresh', 'pcs', 10, 'online', [5, null, 60], 2, true, 2, 'slices or pav'),
  it('capsicum', 'Capsicum', 'fresh', 'pcs', 2, 'store', [7, 3, null], 0, true, 1),
  it('cucumber', 'Cucumber', 'fresh', 'pcs', 2, 'store', [7, null, null], 0, true, 1),
  it('spinach', 'Spinach (palak)', 'fresh', 'g', 250, 'store', [4, null, null], 0, true, 125),
  it('mushroom', 'Mushrooms', 'fresh', 'g', 200, 'online', [5, null, null], 0, true, 100),
  it('banana', 'Bananas', 'fresh', 'pcs', 6, 'store', [5, null, null], 0, true, 1),

  // freezer (bought frozen; "fresh" here means as kept in the freezer)
  it('roti', 'Frozen rotis', 'frozen', 'pcs', 10, 'online', [90, null, null], 3, true, 3),
  it('paratha', 'Frozen parathas', 'frozen', 'pcs', 5, 'online', [90, null, null], 1, true, 1),
  it('peas', 'Frozen peas', 'frozen', 'g', 500, 'online', [180, null, null], 100, true, 50),
  it('corn', 'Frozen sweet corn', 'frozen', 'g', 500, 'online', [180, null, null], 100, true, 50),
  it('mixed_veg', 'Frozen mixed veg', 'frozen', 'g', 500, 'online', [180, null, null], 100, true, 100),
  it('chicken', 'Chicken (boneless)', 'fresh', 'g', 500, 'store', [2, null, 90], 0, true, 250, 'fresh from the shop: cook or freeze within 2 days'),
];

// Used for the ?demo preview and the "starter kitchen" option in Settings.
export const starterStock = [
  'salt', 'oil', 'ghee', 'turmeric', 'chilli', 'jeera', 'mustard', 'garam', 'dhania_pd', 'pepper', 'hing', 'sugar',
  'rice', 'poha', 'oats', 'besan', 'masoor', 'moong', 'soya', 'soya_gran', 'peanuts', 'pb', 'canned_chana',
  'gg_paste', 'tomato_puree', 'soy', 'schezwan', 'pickle', 'chaat_masala', 'kasuri_methi',
  'onion', 'potato', 'eggs', 'lemon', 'curd', 'bread', 'tomato', 'green_chilli',
  'roti', 'paratha', 'peas',
];
