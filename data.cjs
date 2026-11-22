// ─────────────────────────────────────────────────────────────────────────────
// ALL THE CONTENT LIVES HERE. Edit freely, then reload index.html.
//
// Add an ingredient:  { id: 'tofu', name: 'Tofu', cat: 'fresh', keeps: '1 week' }
// Add a meal:         r('id', 'Name', minutes, [needs], [optional], [tags], 'protein', 'how')
//   needs     – must have these to cook it (basics like salt/oil count too)
//   optional  – nice to have; never blocks a meal
//   protein   – egg | paneer | soya | chicken | dal | beans | veg
//   tags      – any words; these show as filters: no-cook, kettle, one-pot,
//               comfort, chinese, south, street, continental, breakfast, snack
// Run `node --test` afterwards: it catches typos in ingredient ids.
// ─────────────────────────────────────────────────────────────────────────────
(function (root) {
  const categories = {
    basics: 'Basics (always in the kitchen)',
    dry: 'Dry pantry (buy monthly)',
    flavor: 'Sauces & masalas (last months)',
    keeps: 'Keeps 2–4 weeks',
    fresh: 'Fresh (buy weekly)',
    frozen: 'Freezer',
  };

  const ingredients = [
    // basics
    { id: 'salt', name: 'Salt', cat: 'basics', keeps: '1 year+' },
    { id: 'oil', name: 'Cooking oil', cat: 'basics', keeps: '6 months' },
    { id: 'ghee', name: 'Ghee', cat: 'basics', keeps: '6 months' },
    { id: 'turmeric', name: 'Turmeric (haldi)', cat: 'basics', keeps: '1 year' },
    { id: 'chilli', name: 'Red chilli powder', cat: 'basics', keeps: '1 year' },
    { id: 'jeera', name: 'Cumin seeds (jeera)', cat: 'basics', keeps: '1 year' },
    { id: 'mustard', name: 'Mustard seeds (rai)', cat: 'basics', keeps: '1 year' },
    { id: 'garam', name: 'Garam masala', cat: 'basics', keeps: '6 months' },
    { id: 'dhania_pd', name: 'Coriander powder', cat: 'basics', keeps: '6 months' },
    { id: 'pepper', name: 'Black pepper', cat: 'basics', keeps: '1 year' },
    { id: 'hing', name: 'Hing (asafoetida)', cat: 'basics', keeps: '1 year' },
    { id: 'sugar', name: 'Sugar', cat: 'basics', keeps: '1 year+' },

    // dry pantry
    { id: 'rice', name: 'Rice', cat: 'dry', keeps: '1 year' },
    { id: 'poha', name: 'Poha (thick)', cat: 'dry', keeps: '3 months' },
    { id: 'oats', name: 'Rolled oats', cat: 'dry', keeps: '6 months' },
    { id: 'sooji', name: 'Roasted sooji / rava', cat: 'dry', keeps: '4 months' },
    { id: 'vermicelli', name: 'Roasted vermicelli (semiya)', cat: 'dry', keeps: '6 months' },
    { id: 'dalia', name: 'Dalia (broken wheat)', cat: 'dry', keeps: '6 months' },
    { id: 'besan', name: 'Besan (gram flour)', cat: 'dry', keeps: '4 months' },
    { id: 'sattu', name: 'Sattu (roasted chana flour)', cat: 'dry', keeps: '4 months' },
    { id: 'moong', name: 'Moong dal (yellow)', cat: 'dry', keeps: '1 year' },
    { id: 'masoor', name: 'Masoor dal (red)', cat: 'dry', keeps: '1 year' },
    { id: 'soya', name: 'Soya chunks', cat: 'dry', keeps: '1 year' },
    { id: 'soya_gran', name: 'Soya granules (keema)', cat: 'dry', keeps: '1 year' },
    { id: 'canned_chana', name: 'Ready chickpeas (tin/tetra)', cat: 'dry', keeps: '1 year' },
    { id: 'canned_rajma', name: 'Ready rajma (tin/tetra)', cat: 'dry', keeps: '1 year' },
    { id: 'peanuts', name: 'Roasted peanuts', cat: 'dry', keeps: '3 months' },
    { id: 'roasted_chana', name: 'Roasted chana', cat: 'dry', keeps: '3 months' },
    { id: 'makhana', name: 'Makhana', cat: 'dry', keeps: '6 months' },
    { id: 'pb', name: 'Peanut butter', cat: 'dry', keeps: '6 months' },
    { id: 'noodles', name: 'Hakka noodles', cat: 'dry', keeps: '9 months' },
    { id: 'pasta', name: 'Pasta (penne)', cat: 'dry', keeps: '1 year' },
    { id: 'uht_milk', name: 'UHT tetra milk', cat: 'dry', keeps: '3 months sealed' },
    { id: 'honey', name: 'Honey', cat: 'dry', keeps: '1 year+' },

    // sauces & masalas
    { id: 'gg_paste', name: 'Ginger-garlic paste', cat: 'flavor', keeps: '2 months (fridge)' },
    { id: 'tomato_puree', name: 'Tomato puree (tetra)', cat: 'flavor', keeps: '1 year sealed' },
    { id: 'soy', name: 'Soy sauce', cat: 'flavor', keeps: '1 year' },
    { id: 'vinegar', name: 'Vinegar', cat: 'flavor', keeps: '1 year+' },
    { id: 'schezwan', name: 'Schezwan chutney', cat: 'flavor', keeps: '3 months (fridge)' },
    { id: 'ketchup', name: 'Ketchup', cat: 'flavor', keeps: '6 months' },
    { id: 'mayo', name: 'Mayonnaise', cat: 'flavor', keeps: '2 months (fridge)' },
    { id: 'pickle', name: 'Pickle (achar)', cat: 'flavor', keeps: '1 year' },
    { id: 'chilli_flakes', name: 'Chilli flakes', cat: 'flavor', keeps: '1 year' },
    { id: 'oregano', name: 'Oregano', cat: 'flavor', keeps: '1 year' },
    { id: 'peri_peri', name: 'Peri-peri masala', cat: 'flavor', keeps: '1 year' },
    { id: 'kasuri_methi', name: 'Kasuri methi', cat: 'flavor', keeps: '1 year' },
    { id: 'chaat_masala', name: 'Chaat masala', cat: 'flavor', keeps: '1 year' },
    { id: 'pav_bhaji_masala', name: 'Pav bhaji masala', cat: 'flavor', keeps: '1 year' },
    { id: 'sambar_masala', name: 'Sambar powder', cat: 'flavor', keeps: '1 year' },

    // keeps 2–4 weeks
    { id: 'onion', name: 'Onions', cat: 'keeps', keeps: '3–4 weeks (dry basket)' },
    { id: 'potato', name: 'Potatoes', cat: 'keeps', keeps: '3–4 weeks (dry basket)' },
    { id: 'eggs', name: 'Eggs', cat: 'keeps', keeps: '3 weeks (fridge)' },
    { id: 'lemon', name: 'Lemons', cat: 'keeps', keeps: '2–3 weeks (fridge)' },
    { id: 'carrot', name: 'Carrots', cat: 'keeps', keeps: '2–3 weeks (fridge)' },
    { id: 'cabbage', name: 'Cabbage', cat: 'keeps', keeps: '2 weeks (fridge)' },
    { id: 'cheese', name: 'Cheese slices', cat: 'keeps', keeps: '1 month+ (fridge)' },
    { id: 'butter', name: 'Butter', cat: 'keeps', keeps: '1 month+ (fridge)' },
    { id: 'curry_leaves', name: 'Curry leaves', cat: 'keeps', keeps: '2 weeks (fridge, dry box)' },

    // fresh weekly
    { id: 'tomato', name: 'Tomatoes', cat: 'fresh', keeps: '1 week', note: 'tomato puree works in a pinch' },
    { id: 'green_chilli', name: 'Green chillies', cat: 'fresh', keeps: '1–2 weeks (fridge)' },
    { id: 'curd', name: 'Curd (dahi)', cat: 'fresh', keeps: '5–7 days' },
    { id: 'paneer', name: 'Paneer', cat: 'fresh', keeps: '5–7 days', note: 'freezes fine' },
    { id: 'bread', name: 'Bread / pav', cat: 'fresh', keeps: '4–5 days', note: 'freezes fine' },
    { id: 'capsicum', name: 'Capsicum', cat: 'fresh', keeps: '1 week (fridge)' },
    { id: 'cucumber', name: 'Cucumber', cat: 'fresh', keeps: '1 week (fridge)' },
    { id: 'spinach', name: 'Spinach (palak)', cat: 'fresh', keeps: '3–4 days' },
    { id: 'mushroom', name: 'Mushrooms', cat: 'fresh', keeps: '5 days (fridge)' },
    { id: 'banana', name: 'Bananas', cat: 'fresh', keeps: '4–5 days' },

    // freezer
    { id: 'roti', name: 'Frozen rotis', cat: 'frozen', keeps: '3 months' },
    { id: 'paratha', name: 'Frozen parathas / Malabar parotta', cat: 'frozen', keeps: '3 months' },
    { id: 'peas', name: 'Frozen peas', cat: 'frozen', keeps: '6 months' },
    { id: 'corn', name: 'Frozen sweet corn', cat: 'frozen', keeps: '6 months' },
    { id: 'mixed_veg', name: 'Frozen mixed veg', cat: 'frozen', keeps: '6 months' },
    { id: 'chicken', name: 'Boneless chicken (frozen)', cat: 'frozen', keeps: '3 months' },
  ];

  // A sensible first shop: mostly long-lasting, few weekly items.
  const starter = [
    'salt', 'oil', 'ghee', 'turmeric', 'chilli', 'jeera', 'mustard', 'garam', 'dhania_pd', 'pepper', 'hing', 'sugar',
    'rice', 'poha', 'oats', 'besan', 'masoor', 'moong', 'soya', 'soya_gran', 'peanuts', 'pb', 'canned_chana',
    'gg_paste', 'tomato_puree', 'soy', 'schezwan', 'pickle', 'chaat_masala', 'kasuri_methi',
    'onion', 'potato', 'eggs', 'lemon', 'curd', 'bread', 'tomato', 'green_chilli',
    'roti', 'paratha', 'peas',
  ];

  const recipes = [];
  function r(id, name, time, needs, optional, tags, protein, how) {
    // salt + oil are assumed for anything cooked; listed so the math is honest.
    recipes.push({ id, name, time, needs, optional, tags, protein, how });
  }

  // ── EGGS ───────────────────────────────────────────────────────────────────
  r('egg_bhurji_roti', 'Egg bhurji + roti', 12, ['eggs', 'onion', 'tomato', 'green_chilli', 'roti', 'salt', 'oil'], ['cheese', 'peas'], ['breakfast'], 'egg',
    'Sauté onion + chilli, add tomato, turmeric, chilli powder, salt. Scramble in 3 eggs. Warm rotis on the tawa.');
  r('egg_chaat', 'Boiled egg chaat', 12, ['eggs', 'onion', 'chaat_masala'], ['lemon', 'green_chilli', 'tomato'], ['kettle', 'snack'], 'egg',
    'Pour kettle water over eggs in a pot, boil 9 min. Halve, top with onion, chaat masala, lemon.');
  r('masala_omelette_toast', 'Masala omelette + toast', 10, ['eggs', 'onion', 'green_chilli', 'bread', 'salt', 'oil'], ['tomato', 'cheese'], ['breakfast'], 'egg',
    'Beat 3 eggs with onion, chilli, salt, turmeric. Cook on a hot pan, fold. Toast bread in the same pan.');
  r('egg_fried_rice', 'Egg fried rice', 12, ['eggs', 'rice', 'soy', 'gg_paste', 'oil'], ['carrot', 'capsicum', 'peas', 'vinegar', 'onion'], ['chinese'], 'egg',
    'Scramble 2 eggs, push aside. Fry ginger-garlic + veg on high, add cold rice, soy sauce, pepper. Toss.');
  r('egg_roll', 'Egg kathi roll', 10, ['eggs', 'paratha', 'onion', 'oil'], ['ketchup', 'schezwan', 'mayo', 'chaat_masala'], ['street'], 'egg',
    'Pour 2 beaten eggs on the tawa, press a paratha on top, flip. Add onion + sauce, roll.');
  r('egg_curry', 'Egg curry + rice', 25, ['eggs', 'onion', 'tomato', 'gg_paste', 'rice', 'oil'], ['kasuri_methi', 'curd'], ['comfort'], 'egg',
    'Boil eggs. Make onion-tomato masala with ginger-garlic, turmeric, chilli, garam masala; add water, drop in eggs, simmer 5 min.');
  r('egg_noodles', 'Egg hakka noodles', 15, ['eggs', 'noodles', 'soy', 'oil'], ['capsicum', 'carrot', 'vinegar', 'schezwan', 'cabbage'], ['chinese'], 'egg',
    'Boil noodles 3 min (kettle water). Scramble eggs, add veg on high flame, toss noodles with soy, vinegar, pepper.');
  r('cheese_omelette', 'Cheese omelette + toast', 8, ['eggs', 'cheese', 'bread', 'butter'], ['chilli_flakes', 'oregano', 'pepper'], ['breakfast', 'continental'], 'egg',
    'Butter in pan, 3 beaten eggs, lay a cheese slice, fold. Toast bread alongside.');
  r('egg_oats', 'Masala oats + boiled eggs', 12, ['eggs', 'oats', 'onion'], ['peas', 'carrot', 'corn'], ['breakfast', 'kettle'], 'egg',
    'Sauté onion + veg, add oats, spices and kettle water, simmer 3 min. Top with 2 sliced boiled eggs.');
  r('egg_poha', 'Egg poha', 12, ['eggs', 'poha', 'onion', 'oil'], ['peas', 'peanuts', 'lemon', 'curry_leaves'], ['breakfast'], 'egg',
    'Rinse poha. Mustard seeds + onion + turmeric, scramble 2 eggs in, fold in poha, lemon.');
  r('egg_mayo_sandwich', 'Egg mayo sandwich', 12, ['eggs', 'bread', 'mayo'], ['cucumber', 'pepper', 'onion'], ['kettle'], 'egg',
    'Boil 2 eggs, mash with mayo, salt, pepper. Spread on bread, add cucumber.');
  r('bombay_toast', 'Savoury French toast', 10, ['eggs', 'bread', 'onion', 'green_chilli', 'oil'], ['ketchup'], ['breakfast', 'street'], 'egg',
    'Beat eggs with onion, chilli, salt. Dip bread slices, pan-fry both sides.');
  r('egg_pepper_fry', 'Egg pepper fry + rice', 15, ['eggs', 'onion', 'curry_leaves', 'pepper', 'rice'], ['gg_paste'], ['south'], 'egg',
    'Halve boiled eggs. Fry onion, curry leaves, lots of pepper, turmeric; toss eggs in. Eat with rice.');
  r('egg_shakshuka', 'Masala shakshuka + bread', 15, ['eggs', 'tomato_puree', 'onion', 'bread'], ['chilli_flakes', 'cheese', 'capsicum'], ['continental'], 'egg',
    'Cook onion + puree + spices into thick sauce, make wells, crack in 2–3 eggs, cover 5 min. Mop with bread.');
  r('egg_semiya', 'Egg semiya upma', 15, ['eggs', 'vermicelli', 'onion'], ['peas', 'carrot', 'curry_leaves'], ['south', 'kettle'], 'egg',
    'Mustard + onion + veg, scramble eggs, add vermicelli and 1 cup kettle water, cook till dry.');
  r('anda_bhurji_pav', 'Anda bhurji pav', 12, ['eggs', 'onion', 'tomato', 'bread', 'butter', 'pav_bhaji_masala'], ['green_chilli'], ['street'], 'egg',
    'Butter, onion, tomato, a spoon of pav bhaji masala, scramble eggs in. Butter-toast pav.');
  r('egg_pasta', 'Pepper egg pasta', 15, ['eggs', 'pasta', 'cheese', 'pepper'], ['chilli_flakes', 'butter'], ['continental'], 'egg',
    'Boil pasta. Off the heat, toss with beaten egg + torn cheese + pepper + splash of pasta water till creamy.');
  r('schezwan_egg_rice', 'Schezwan egg rice', 12, ['eggs', 'rice', 'schezwan', 'oil'], ['capsicum', 'onion'], ['chinese'], 'egg',
    'Scramble eggs, add 2 spoons schezwan chutney and cold rice, toss on high.');
  r('spinach_mushroom_omelette', 'Spinach-mushroom omelette', 10, ['eggs', 'spinach', 'mushroom', 'oil'], ['cheese', 'bread'], ['breakfast', 'continental'], 'egg',
    'Sauté mushrooms then spinach till wilted, pour 3 beaten eggs over, fold.');
  r('egg_corn_bowl', 'Egg & corn salad bowl', 12, ['eggs', 'corn', 'onion', 'lemon'], ['cucumber', 'peri_peri', 'chaat_masala'], ['kettle', 'snack'], 'egg',
    'Boil eggs; pour kettle water over corn for 3 min. Mix with onion, lemon, salt, peri-peri.');
  r('aloo_anda_bhurji', 'Aloo-anda bhurji + roti', 20, ['eggs', 'potato', 'onion', 'roti', 'oil'], ['green_chilli'], ['comfort'], 'egg',
    'Fry small potato cubes till soft, add onion + spices, scramble eggs in. Serve with roti.');

  // ── PANEER ─────────────────────────────────────────────────────────────────
  r('paneer_bhurji_roti', 'Paneer bhurji + roti', 12, ['paneer', 'onion', 'tomato', 'roti', 'oil'], ['kasuri_methi', 'peas', 'capsicum', 'green_chilli'], [], 'paneer',
    'Onion, tomato, spices; crumble 100 g paneer in, cook 2 min, finish with kasuri methi.');
  r('chilli_paneer_rice', 'Chilli paneer + rice', 18, ['paneer', 'capsicum', 'onion', 'soy', 'gg_paste', 'rice'], ['vinegar', 'schezwan'], ['chinese'], 'paneer',
    'Sear paneer cubes. High flame: ginger-garlic, onion, capsicum, soy, vinegar, chilli. Toss paneer back. Rice on the side.');
  r('paneer_tikka_roll', 'Paneer tikka roll', 15, ['paneer', 'curd', 'paratha', 'onion'], ['capsicum', 'mayo', 'chaat_masala'], ['street'], 'paneer',
    'Coat paneer cubes in curd + chilli + garam masala, sear on tawa. Roll in paratha with onion.');
  r('palak_paneer', 'Quick palak paneer + roti', 20, ['paneer', 'spinach', 'onion', 'gg_paste', 'roti'], ['curd', 'kasuri_methi'], ['comfort'], 'paneer',
    'Wilt chopped spinach into onion-ginger-garlic masala, mash a bit, add paneer, 2 min.');
  r('matar_paneer', 'Matar paneer + rice', 20, ['paneer', 'peas', 'onion', 'tomato_puree', 'rice'], ['kasuri_methi', 'curd'], ['comfort'], 'paneer',
    'Onion + puree + spices, add peas and a cup of water, simmer 5 min, add paneer.');
  r('paneer_sandwich', 'Grilled paneer sandwich', 10, ['paneer', 'bread', 'butter'], ['capsicum', 'chilli_flakes', 'oregano', 'cheese', 'onion'], ['continental'], 'paneer',
    'Grate paneer with salt, pepper, chilli flakes. Fill bread, butter outside, press on tawa.');
  r('paneer_fried_rice', 'Paneer fried rice', 15, ['paneer', 'rice', 'soy', 'oil'], ['peas', 'carrot', 'capsicum', 'gg_paste'], ['chinese'], 'paneer',
    'Sear paneer cubes, add veg, cold rice, soy, pepper. High flame.');
  r('paneer_pepper_fry', 'Paneer pepper fry', 12, ['paneer', 'onion', 'pepper', 'curry_leaves'], ['capsicum', 'roti'], ['south'], 'paneer',
    'Curry leaves + onion in oil, turmeric, loads of pepper, toss paneer till coated.');
  r('achari_paneer_rice', 'Achari paneer rice', 12, ['paneer', 'rice', 'pickle', 'onion'], ['curd'], [], 'paneer',
    'Fry onion, add grated paneer + 1 spoon pickle masala, toss in rice.');
  r('peri_paneer_bowl', 'Peri-peri paneer & corn bowl', 12, ['paneer', 'corn', 'peri_peri'], ['capsicum', 'rice', 'mayo'], ['continental'], 'paneer',
    'Sear paneer + corn in butter/oil, dust peri-peri. Eat as-is or over rice.');
  r('paneer_paratha', 'Paneer-stuffed parotta', 12, ['paneer', 'paratha', 'onion', 'green_chilli'], ['curd', 'pickle'], ['breakfast'], 'paneer',
    'Mix grated paneer, onion, chilli, salt. Spread on half a parotta while it warms, fold, crisp both sides.');
  r('paneer_pasta', 'Masala paneer pasta', 18, ['paneer', 'pasta', 'tomato_puree'], ['cheese', 'oregano', 'capsicum', 'onion'], ['continental'], 'paneer',
    'Boil pasta. Puree + onion + chilli flakes into sauce, add paneer cubes and pasta.');
  r('paneer_chilla', 'Paneer-stuffed besan chilla', 15, ['besan', 'paneer', 'onion'], ['curd', 'green_chilli'], ['breakfast'], 'paneer',
    'Thin besan batter with onion, salt, ajwain/jeera. Spread on tawa, add grated paneer, fold.');
  r('kadai_paneer', 'Kadai paneer + roti', 20, ['paneer', 'capsicum', 'onion', 'tomato', 'roti'], ['kasuri_methi'], [], 'paneer',
    'Onion-tomato masala with coriander powder + garam masala, add capsicum chunks and paneer, 3 min.');
  r('paneer_chaat', 'Paneer chaat salad', 5, ['paneer', 'cucumber', 'onion', 'chaat_masala', 'lemon'], ['roasted_chana', 'tomato'], ['no-cook', 'snack'], 'paneer',
    'Cube everything, toss with lemon and chaat masala.');
  r('paneer_noodles', 'Schezwan paneer noodles', 15, ['paneer', 'noodles', 'schezwan'], ['capsicum', 'carrot', 'cabbage'], ['chinese'], 'paneer',
    'Boil noodles. Sear paneer, add veg, noodles and 2 spoons schezwan.');
  r('paneer_makhani', 'Quick paneer makhani + roti', 20, ['paneer', 'tomato_puree', 'butter', 'roti'], ['kasuri_methi', 'uht_milk', 'gg_paste'], ['comfort'], 'paneer',
    'Butter + ginger-garlic + puree + chilli + garam masala + pinch sugar, simmer, splash of milk, add paneer.');

  // ── SOYA ───────────────────────────────────────────────────────────────────
  r('soya_pulao', 'Soya pulao', 20, ['soya', 'rice', 'onion'], ['peas', 'carrot', 'curd'], ['one-pot', 'kettle'], 'soya',
    'Soak soya in kettle water 5 min, squeeze. Jeera + onion + soya + rice + spices + 2× water. 2 whistles or covered 15 min.');
  r('soya_keema_pav', 'Soya keema pav', 18, ['soya_gran', 'onion', 'tomato', 'pav_bhaji_masala', 'bread'], ['peas', 'butter'], ['street', 'kettle'], 'soya',
    'Soak granules, squeeze. Onion-tomato + pav bhaji masala, add granules + peas, cook 5 min. Butter-toast pav.');
  r('soya_curry', 'Soya chunk curry + rice', 20, ['soya', 'onion', 'tomato', 'gg_paste', 'rice'], ['curd', 'kasuri_methi'], ['comfort', 'kettle'], 'soya',
    'Soak soya. Onion-tomato-ginger-garlic masala, add soya and water, simmer 8 min. Stir in curd off heat.');
  r('chilli_soya', 'Chilli soya + rice', 15, ['soya', 'capsicum', 'onion', 'soy', 'gg_paste', 'rice'], ['vinegar', 'schezwan'], ['chinese', 'kettle'], 'soya',
    'Soak + squeeze soya, pan-sear. Toss with onion, capsicum, soy, vinegar, chilli on high flame.');
  r('soya_semiya', 'Soya semiya upma', 15, ['soya_gran', 'vermicelli', 'onion'], ['peas', 'curry_leaves', 'lemon'], ['south', 'kettle'], 'soya',
    'Mustard + onion, soaked granules, vermicelli, kettle water; cook till dry, lemon.');
  r('soya_roll', 'Soya keema roll', 15, ['soya_gran', 'paratha', 'onion'], ['mayo', 'schezwan', 'capsicum'], ['street', 'kettle'], 'soya',
    'Spiced soya keema rolled in a crisp paratha with onion and sauce.');
  r('peanut_soya_rice', 'Peanut-garlic soya rice', 15, ['soya', 'rice', 'pb', 'soy'], ['capsicum', 'chilli_flakes', 'gg_paste'], ['chinese', 'kettle'], 'soya',
    'Whisk 1 spoon PB + soy + water. Sear soaked soya, pour sauce, toss with rice.');
  r('soya_poha', 'Soya poha', 12, ['soya_gran', 'poha', 'onion'], ['peanuts', 'lemon', 'peas'], ['breakfast', 'kettle'], 'soya',
    'Regular poha with a handful of soaked granules fried in with the onion.');
  r('soya_keema_rice', 'Soya keema-matar rice bowl', 18, ['soya_gran', 'peas', 'onion', 'rice', 'tomato_puree'], ['curd'], ['kettle'], 'soya',
    'Onion + puree + garam masala, add granules + peas, cook dry. Over rice.');
  r('soya_fried_rice', 'Soya fried rice', 15, ['soya_gran', 'rice', 'soy'], ['carrot', 'capsicum', 'corn'], ['chinese', 'kettle'], 'soya',
    'Fry soaked granules till crisp-ish, add veg, rice, soy, pepper.');
  r('soya_sukka_roti', 'Dry soya masala + roti', 15, ['soya', 'onion', 'roti'], ['capsicum', 'kasuri_methi'], ['kettle'], 'soya',
    'Soaked soya fried with onion, chilli, coriander powder, garam masala till browned.');
  r('soya_bolognese', 'Soya bolognese pasta', 20, ['soya_gran', 'pasta', 'tomato_puree', 'onion'], ['oregano', 'cheese', 'chilli_flakes'], ['continental', 'kettle'], 'soya',
    'Onion + granules + puree + oregano, simmer 5 min, toss with pasta, top with cheese.');
  r('soya_noodles', 'Schezwan soya noodles', 15, ['soya', 'noodles', 'schezwan'], ['capsicum', 'carrot', 'cabbage'], ['chinese', 'kettle'], 'soya',
    'Boil noodles, sear soaked soya, toss all with schezwan.');

  // ── CHICKEN ────────────────────────────────────────────────────────────────
  r('chicken_curry_rice', 'Quick chicken curry + rice', 30, ['chicken', 'onion', 'tomato', 'gg_paste', 'rice'], ['curd', 'kasuri_methi'], ['comfort'], 'chicken',
    'Brown onion, ginger-garlic, tomato, spices. Add chicken cubes, cook 10 min, add water, simmer 8.');
  r('chicken_roll', 'Chicken kathi roll', 20, ['chicken', 'paratha', 'onion', 'curd'], ['capsicum', 'mayo', 'schezwan'], ['street'], 'chicken',
    'Marinate strips in curd + chilli + garam masala 5 min, sear hot. Roll in paratha with onion.');
  r('chicken_fried_rice', 'Chicken fried rice', 20, ['chicken', 'rice', 'soy', 'gg_paste'], ['eggs', 'carrot', 'peas'], ['chinese'], 'chicken',
    'Sear small chicken pieces, add ginger-garlic, veg, cold rice, soy, pepper.');
  r('chilli_chicken', 'Chilli chicken + rice', 25, ['chicken', 'capsicum', 'onion', 'soy', 'gg_paste', 'rice'], ['vinegar', 'schezwan'], ['chinese'], 'chicken',
    'Sear chicken, then onion + capsicum + soy + vinegar + chilli on high flame.');
  r('pepper_chicken', 'Pepper chicken + rice', 25, ['chicken', 'onion', 'pepper', 'curry_leaves', 'rice'], ['gg_paste'], ['south'], 'chicken',
    'Curry leaves + onion, chicken, turmeric, cook covered 10 min, finish with lots of pepper.');
  r('peri_chicken_bowl', 'Peri-peri chicken rice bowl', 20, ['chicken', 'rice', 'peri_peri'], ['corn', 'capsicum', 'mayo'], ['continental'], 'chicken',
    'Toss chicken in peri-peri + oil, sear. Over rice with corn and a mayo drizzle.');
  r('chicken_sandwich', 'Chicken mayo sandwich', 20, ['chicken', 'bread', 'mayo'], ['cucumber', 'pepper', 'cheese'], ['continental'], 'chicken',
    'Cook chicken with salt + pepper, shred, mix with mayo. Sandwich.');
  r('chicken_noodles', 'Chicken hakka noodles', 20, ['chicken', 'noodles', 'soy'], ['capsicum', 'carrot', 'schezwan', 'cabbage'], ['chinese'], 'chicken',
    'Boil noodles. Sear chicken strips, veg, noodles, soy, vinegar.');
  r('chicken_pulao', 'One-pot chicken pulao', 30, ['chicken', 'rice', 'onion', 'curd'], ['gg_paste', 'peas'], ['one-pot'], 'chicken',
    'Brown onion, chicken + curd + spices 5 min, add rice + 2× water. Covered 15 min or 2 whistles.');
  r('chicken_pasta', 'Creamy chicken pasta', 25, ['chicken', 'pasta', 'uht_milk', 'cheese'], ['oregano', 'chilli_flakes', 'mushroom'], ['continental'], 'chicken',
    'Sear chicken, add milk + 2 cheese slices till saucy, toss pasta in.');
  r('achari_chicken', 'Achari chicken + roti', 25, ['chicken', 'pickle', 'curd', 'onion', 'roti'], [], [], 'chicken',
    'Onion, chicken, 1 spoon pickle masala + curd, cook covered till done.');
  r('chicken_saag', 'Chicken saag + roti', 30, ['chicken', 'spinach', 'onion', 'gg_paste', 'roti'], ['curd'], ['comfort'], 'chicken',
    'Chicken in onion-ginger-garlic masala 10 min, add chopped spinach, cook down.');

  // ── DAL & BESAN ────────────────────────────────────────────────────────────
  r('moong_khichdi', 'Moong dal khichdi', 25, ['moong', 'rice', 'ghee'], ['peas', 'carrot', 'curd', 'pickle'], ['one-pot', 'comfort'], 'dal',
    'Equal rice + moong, turmeric, salt, 4× water. 3 whistles. Jeera-ghee tadka on top.');
  r('masoor_tadka_rice', 'Masoor dal tadka + rice', 20, ['masoor', 'onion', 'tomato', 'rice'], ['gg_paste', 'kasuri_methi'], ['comfort', 'kettle'], 'dal',
    'Boil masoor with turmeric in kettle water 12 min (no soak). Tadka: jeera, onion, tomato, chilli.');
  r('masoor_roti', 'Masoor dal + roti', 20, ['masoor', 'onion', 'roti'], ['tomato', 'pickle'], ['kettle'], 'dal',
    'Same quick masoor dal, eaten with warm rotis.');
  r('dalia_khichdi', 'Masoor-dalia khichdi', 25, ['masoor', 'dalia'], ['peas', 'carrot', 'curd'], ['one-pot', 'comfort'], 'dal',
    'Dalia + masoor + turmeric + salt + 4× water, 3 whistles. Ghee on top.');
  r('dal_palak', 'Dal palak + rice', 25, ['moong', 'spinach', 'rice'], ['gg_paste', 'tomato'], ['comfort'], 'dal',
    'Cook moong dal, stir in chopped spinach for 2 min, jeera-garlic tadka.');
  r('besan_chilla', 'Besan chilla + curd', 15, ['besan', 'onion', 'curd'], ['green_chilli', 'tomato', 'spinach'], ['breakfast'], 'dal',
    'Besan + water + onion + chilli + salt into pouring batter. Thin pancakes on greased tawa.');
  r('besan_toast', 'Besan toast', 12, ['besan', 'bread', 'onion'], ['paneer', 'green_chilli', 'tomato'], ['breakfast', 'street'], 'dal',
    'Thick spiced besan batter spread on bread, pan-toast batter side down till golden.');
  r('quick_kadhi', 'Quick kadhi + rice', 25, ['besan', 'curd', 'rice'], ['curry_leaves', 'onion'], ['comfort'], 'dal',
    'Whisk curd + 2 tbsp besan + water + turmeric. Simmer 10 min stirring. Jeera-hing-curry leaf tadka.');
  r('veg_chilla', 'Veggie besan chilla', 15, ['besan', 'carrot', 'onion'], ['spinach', 'curd', 'ketchup'], ['breakfast'], 'dal',
    'Grate carrot into the besan batter with onion. Cook like a dosa.');
  r('sambar_rice', 'Quick sambar rice', 25, ['masoor', 'sambar_masala', 'rice'], ['carrot', 'tomato', 'onion', 'curry_leaves'], ['south', 'one-pot'], 'dal',
    'Masoor + rice + veg + sambar powder + tamarind/lemon + 4× water, 3 whistles. Mustard-curry leaf tadka.');
  r('dal_fry_jeera_rice', 'Moong dal fry + jeera rice', 25, ['moong', 'onion', 'tomato', 'rice'], ['gg_paste'], ['comfort'], 'dal',
    'Pressure moong. Fry onion, tomato, spices, mix in dal. Jeera-ghee rice alongside.');
  r('pithla_roti', 'Pithla + roti', 15, ['besan', 'onion', 'green_chilli', 'roti'], ['curry_leaves'], [], 'dal',
    'Mustard, onion, chilli; whisk in besan-water, stir till thick. Eat with roti.');
  r('sattu_drink', 'Sattu namkeen drink', 3, ['sattu', 'lemon'], ['onion', 'chaat_masala', 'green_chilli'], ['no-cook', 'snack'], 'dal',
    '3 tbsp sattu, water, lemon, salt, roasted jeera. Shake in a bottle.');
  r('sattu_roti_roll', 'Sattu masala roti roll', 12, ['sattu', 'roti', 'onion'], ['pickle', 'green_chilli', 'lemon'], [], 'dal',
    'Mix sattu with onion, chilli, lemon, pickle oil. Spread inside a hot roti, fold and crisp.');

  // ── BEANS (ready tins) ─────────────────────────────────────────────────────
  r('chana_masala_roti', 'Chana masala + roti', 15, ['canned_chana', 'onion', 'tomato_puree', 'roti'], ['chaat_masala', 'gg_paste'], [], 'beans',
    'Onion + puree + garam masala, add drained chana + water, mash a few, simmer 5 min.');
  r('rajma_chawal', 'Rajma chawal', 18, ['canned_rajma', 'onion', 'tomato_puree', 'rice'], ['gg_paste', 'curd'], ['comfort'], 'beans',
    'Onion + ginger-garlic + puree + spices, rajma + water, simmer 8 min, mash some for body.');
  r('chana_chaat', 'Chana chaat', 5, ['canned_chana', 'onion', 'lemon', 'chaat_masala'], ['cucumber', 'tomato', 'green_chilli'], ['no-cook', 'snack'], 'beans',
    'Rinse chana, toss with chopped veg, lemon, chaat masala.');
  r('rajma_quesadilla', 'Rajma quesadilla', 12, ['canned_rajma', 'cheese', 'roti'], ['corn', 'onion', 'peri_peri'], ['continental'], 'beans',
    'Mash rajma with salt + chilli. Spread on roti with cheese + corn, fold, crisp on tawa.');
  r('chana_wrap', 'Chana-curd wrap', 10, ['canned_chana', 'curd', 'lemon', 'roti'], ['cucumber', 'onion', 'gg_paste'], [], 'beans',
    'Mash chana with thick curd, lemon, garlic, salt (rough hummus). Wrap in warm roti with cucumber.');
  r('rajma_bowl', 'Rajma corn burrito bowl', 15, ['canned_rajma', 'corn', 'rice', 'onion'], ['cheese', 'curd', 'peri_peri', 'capsicum'], ['continental'], 'beans',
    'Warm rajma with onion, chilli, jeera. Rice + rajma + corn + curd in a bowl.');
  r('chana_pulao', 'Chana pulao', 20, ['canned_chana', 'rice', 'onion'], ['peas', 'curd'], ['one-pot'], 'beans',
    'Jeera, onion, chana, garam masala, rice, 2× water. 2 whistles.');
  r('roasted_chana_chaat', 'Roasted chana-peanut chaat', 5, ['roasted_chana', 'peanuts', 'onion', 'lemon'], ['tomato', 'cucumber', 'chaat_masala'], ['no-cook', 'snack'], 'beans',
    'Toss everything with lemon and chaat masala.');
  r('chana_palak', 'Chana palak + roti', 18, ['canned_chana', 'spinach', 'onion', 'roti'], ['gg_paste'], [], 'beans',
    'Onion masala, add chana and chopped spinach, cook 5 min.');
  r('beans_toast', 'Masala beans on toast', 10, ['canned_rajma', 'bread', 'tomato_puree'], ['cheese', 'onion', 'chilli_flakes'], ['continental', 'breakfast'], 'beans',
    'Simmer rajma in puree with chilli + pinch sugar. Pile on buttered toast.');

  // ── VEG / LIGHT / BREAKFAST ────────────────────────────────────────────────
  r('kanda_poha', 'Kanda poha', 12, ['poha', 'onion', 'peanuts'], ['peas', 'lemon', 'curry_leaves', 'green_chilli', 'potato'], ['breakfast'], 'veg',
    'Rinse poha. Mustard, peanuts, onion, turmeric, fold poha in, lemon.');
  r('dahi_chura', 'Dahi chura', 3, ['poha', 'curd'], ['banana', 'honey', 'sugar'], ['no-cook', 'breakfast'], 'veg',
    'Rinse poha, mix with curd and banana/honey. Done.');
  r('rava_upma', 'Rava upma', 15, ['sooji', 'onion'], ['peas', 'carrot', 'curry_leaves', 'peanuts'], ['south', 'kettle', 'breakfast'], 'veg',
    'Mustard + onion + veg, add sooji, then 2× kettle water while stirring. Cover 2 min.');
  r('semiya_upma', 'Semiya upma', 12, ['vermicelli', 'onion'], ['peas', 'carrot', 'peanuts', 'curry_leaves'], ['south', 'kettle', 'breakfast'], 'veg',
    'Mustard + onion + veg, vermicelli, 1.5× kettle water, cook till dry.');
  r('masala_oats', 'Masala oats', 10, ['oats', 'onion'], ['peas', 'corn', 'carrot', 'cheese'], ['kettle', 'breakfast'], 'veg',
    'Onion + veg + spices, oats, kettle water, 3 min. Cheese slice on top if you like.');
  r('pb_overnight_oats', 'PB banana overnight oats', 3, ['oats', 'uht_milk', 'pb', 'banana'], ['honey'], ['no-cook', 'breakfast'], 'veg',
    'Night before: oats + milk + 1 spoon PB in a jar. Morning: slice banana on top.');
  r('pb_banana_toast', 'PB banana toast', 5, ['bread', 'pb', 'banana'], ['honey', 'uht_milk'], ['no-cook', 'breakfast'], 'veg',
    'Toast, PB, sliced banana, honey. Glass of milk alongside.');
  r('veg_dalia', 'Veg dalia', 20, ['dalia', 'onion'], ['peas', 'carrot', 'mixed_veg'], ['one-pot'], 'veg',
    'Roast dalia in ghee, onion + veg + spices, 3× water, 2 whistles.');
  r('sweet_dalia', 'Sweet milk dalia', 15, ['dalia', 'uht_milk'], ['banana', 'honey', 'sugar'], ['breakfast', 'comfort'], 'veg',
    'Cook dalia in water till soft, add milk + sugar, simmer 3 min.');
  r('aloo_roti_roll', 'Masala aloo roti roll', 18, ['potato', 'roti', 'onion'], ['curd', 'pickle', 'cheese'], [], 'veg',
    'Pressure potatoes, mash with onion + spices, roll in roti, crisp on tawa.');
  r('jeera_aloo_roti', 'Jeera aloo + roti', 20, ['potato', 'roti'], ['curd', 'pickle'], ['comfort'], 'veg',
    'Small potato cubes, jeera, turmeric, chilli, cover and cook 10 min till crisp-soft.');
  r('curd_rice', 'Curd rice', 5, ['rice', 'curd'], ['curry_leaves', 'cucumber', 'pickle'], ['south', 'comfort'], 'veg',
    'Mash leftover rice with curd + salt. Mustard + curry leaf tadka if you can be bothered.');
  r('veg_pulao_raita', 'Frozen-veg pulao + raita', 20, ['mixed_veg', 'rice', 'curd'], ['onion'], ['one-pot'], 'veg',
    'Jeera + onion + frozen veg + rice + garam masala + 2× water, 2 whistles. Curd with salt + jeera on the side.');
  r('masala_corn', 'Masala corn cup', 8, ['corn', 'butter', 'chaat_masala'], ['lemon', 'chilli_flakes'], ['snack', 'kettle'], 'veg',
    'Kettle water over corn 3 min, drain, butter + chaat masala + lemon.');
  r('roasted_makhana', 'Roasted makhana', 6, ['makhana', 'ghee'], ['chaat_masala', 'peri_peri'], ['snack'], 'veg',
    'Dry roast makhana in a spoon of ghee till crunchy, salt + pepper.');
  r('mushroom_toast', 'Garlic mushroom toast', 12, ['mushroom', 'bread', 'butter', 'gg_paste'], ['cheese', 'chilli_flakes', 'oregano'], ['continental'], 'veg',
    'Butter + garlic + sliced mushrooms till browned, salt + pepper, pile on toast.');
  r('bombay_sandwich', 'Bombay veg sandwich', 7, ['bread', 'cucumber', 'tomato', 'onion', 'butter'], ['cheese', 'chaat_masala', 'potato'], ['no-cook', 'street'], 'veg',
    'Buttered bread, layers of veg, chaat masala, cheese. No toasting needed.');
  r('chilli_cheese_toast', 'Chilli cheese toast', 8, ['bread', 'cheese', 'green_chilli'], ['capsicum', 'onion', 'oregano'], ['snack', 'street'], 'veg',
    'Bread + chopped chilli + cheese slice, covered on tawa till melted.');
  r('red_pasta', 'Desi red sauce pasta', 18, ['pasta', 'tomato_puree', 'onion'], ['cheese', 'oregano', 'chilli_flakes', 'capsicum', 'corn'], ['continental'], 'veg',
    'Boil pasta. Onion + puree + chilli + oregano + pinch sugar, toss pasta.');
  r('veg_hakka', 'Veg hakka noodles', 15, ['noodles', 'soy', 'capsicum', 'carrot'], ['cabbage', 'vinegar', 'onion'], ['chinese'], 'veg',
    'Boil noodles 3 min. Shred veg, toss on very high flame with noodles, soy, vinegar, pepper.');
  r('schezwan_veg_rice', 'Schezwan veg rice', 12, ['rice', 'schezwan'], ['carrot', 'capsicum', 'corn', 'peas', 'onion'], ['chinese'], 'veg',
    'Fry whatever veg you have, 2 spoons schezwan, cold rice. Toss.');
  r('shortcut_pav_bhaji', 'Shortcut pav bhaji', 25, ['mixed_veg', 'potato', 'pav_bhaji_masala', 'bread', 'butter', 'tomato_puree'], ['onion', 'lemon'], ['street', 'comfort'], 'veg',
    'Pressure potato + frozen veg, mash. Butter + onion + puree + masala, add mash, simmer. Butter-toast pav.');
  r('mushroom_matar', 'Mushroom matar + roti', 18, ['mushroom', 'peas', 'onion', 'tomato', 'roti'], ['kasuri_methi'], [], 'veg',
    'Onion-tomato masala, mushrooms + peas, cook 7 min.');
  r('spinach_corn_sandwich', 'Cheesy spinach-corn sandwich', 12, ['spinach', 'corn', 'cheese', 'bread'], ['butter', 'oregano'], ['continental'], 'veg',
    'Wilt spinach + corn with garlic, salt, pepper. Fill bread with cheese, toast.');
  r('lemon_rice', 'Lemon rice', 10, ['rice', 'lemon', 'peanuts', 'curry_leaves'], ['green_chilli'], ['south'], 'veg',
    'Mustard, peanuts, curry leaves, turmeric, toss in rice, squeeze lemon.');
  r('cabbage_poriyal', 'Cabbage-peas poriyal + rice', 15, ['cabbage', 'peas', 'curry_leaves', 'rice'], ['carrot'], ['south'], 'veg',
    'Mustard + curry leaves, shredded cabbage + peas + turmeric, cook covered 6 min.');
  r('aloo_matar_roti', 'Aloo matar + roti', 22, ['potato', 'peas', 'onion', 'tomato', 'roti'], ['kasuri_methi'], ['comfort'], 'veg',
    'Onion-tomato masala, potato cubes + peas + water, 2 whistles.');
  r('curd_power_bowl', 'Curd, chana & banana bowl', 2, ['curd', 'roasted_chana', 'banana'], ['honey', 'peanuts'], ['no-cook', 'breakfast'], 'veg',
    'Bowl of curd, handful of roasted chana, sliced banana, honey.');
  r('lazy_paratha_plate', 'Paratha, raita & pickle', 7, ['paratha', 'curd', 'pickle'], ['cucumber', 'onion'], ['comfort'], 'veg',
    'Crisp a frozen paratha, curd with salt + jeera, pickle on the side.');
  r('veg_maggi_noodles', 'Masala veg noodles', 12, ['noodles', 'onion', 'tomato'], ['peas', 'carrot', 'capsicum', 'cheese'], ['comfort'], 'veg',
    'Desi-style: onion, tomato, chilli, garam masala, a little water, toss boiled noodles in.');
  r('corn_cheese_toast', 'Corn cheese toast', 10, ['corn', 'cheese', 'bread'], ['oregano', 'chilli_flakes', 'capsicum'], ['snack', 'continental'], 'veg',
    'Corn + chopped cheese + pepper on bread, cover on tawa till melted.');

  const api = { categories, ingredients, recipes, starter };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MEAL_DATA = api;
})(this);
