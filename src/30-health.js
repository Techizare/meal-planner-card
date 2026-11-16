// ---------- health rating and macros (v1.25) ----------
// Everything here is an estimate from the ingredient list: a built-in table of rough values per 100 g
// (protein, carbs, fat, fibre) and typical weights, no internet. First match wins, specific words first.
// Kinds: pm processed meat, rm red meat, wm poultry, fi fish, of oily fish, egg, sat rich dairy/coconut,
// dy milk/yoghurt, wg whole grain, rg refined grain, st potato, leg beans/lentils, veg, fr fruit, nut nuts/seeds,
// oil, sug sugar/sweets, upf ultra-processed, fried, cond sauces, sp spices (no macros), x other.
// Options: e = grams each (or per sheet/piece), k = grams per tin/pack/bag/jar, c = grams per cup, d = grams when no amount is given.
const NUT = [
  [/(nacho|taco|fajita|burrito|enchilada|chilli con carne) (seasoning|spice|mix|kit)|seasoning (mix|sachet)|\bgravy/i, "upf", 6, 55, 3, 2, { k: 35, e: 35, d: 35 }],
  [/(risotto|rice) (box|mix|sachet|packet)|rice risotto|flavoured rice|rice sides|pasta sides/i, "upf", 8, 75, 3, 2, { k: 250, e: 250, d: 250 }],
  [/(chicken|tomato|mushroom|pumpkin|vegetable) soup|condensed|packet soup|soup mix|instant noodle|2 minute|mi goreng|cup noodle/i, "upf", 2, 9, 3, 1, { k: 420, e: 420, d: 420 }],
  [/(butter chicken|tikka|korma|masala|rogan josh|vindaloo|simmer|curry|pasta|stir ?fry|carbonara|alfredo|satay|teriyaki|sweet (and|&) sour) sauce|tikka masala|jar(red)? sauce/i, "upf", 2, 9, 7, 1, { k: 485, e: 485, d: 485 }],
  [/(tender|nugget|crumbed|schnitzel|katsu|battered|popcorn chicken|fish finger|kiev|hash ?brown|potato gem|spring roll|dumpling)/i, "fried", 15, 18, 12, 1, { e: 30, k: 500, d: 500 }],
  [/(corn chips|tortilla chips|doritos|crisps|potato chips|chippies)/i, "fried", 7, 60, 25, 4, { k: 230, e: 230, d: 150 }],
  [/(chips|fries|wedges)/i, "fried", 3, 25, 6, 2.5, { k: 1000, e: 1000, d: 500 }],
  [/pastry/i, "upf", 6, 38, 25, 1.5, { e: 170, k: 1000, d: 340 }],
  [/bacon|pancetta/i, "pm", 15, 1, 25, 0, { e: 25, k: 250, d: 200 }],
  [/salami|pepperoni|chorizo|kabana|cabanossi/i, "pm", 22, 2, 34, 0, { e: 10, k: 100, d: 100 }],
  [/sausage|saveloy|frankfurt|hot ?dog|bratwurst|kransky|banger|cheerio/i, "pm", 13, 5, 20, 0.5, { e: 70, k: 500, d: 500 }],
  [/\bham\b|prosciutto|corned beef|pastrami|luncheon|\bspam\b|deli meat|bresaola/i, "pm", 18, 2, 8, 0, { e: 20, k: 200, d: 150 }],
  [/(stock|broth|bouillon)(?! powder)/i, "cond", 0.5, 0.5, 0.2, 0, { c: 240, k: 1000, e: 250, d: 250 }],
  [/mayo|aioli|kewpie|ranch|caesar dressing/i, "cond", 1, 2, 75, 0, { c: 220, k: 400, d: 40 }],
  [/pesto/i, "cond", 4, 6, 40, 2, { k: 190, e: 190, d: 100, c: 240 }],
  [/coconut (milk|cream)/i, "sat", 2, 3, 20, 0, { k: 400, e: 400, c: 240, d: 200 }],
  [/curry paste|laksa paste|tom yum paste/i, "cond", 2, 12, 10, 2, { e: 15, k: 200, d: 30 }],
  [/soy|fish sauce|squid sauce|oyster|worcestershire|kecap|tamari|miso/i, "cond", 5, 8, 0, 0, { c: 255, d: 15 }],
  [/hoisin|gochujang|bbq|barbecue|tomato sauce|ketchup|relish|chutney|sweet chill?i|plum sauce|chill?i sauce|sriracha|siracha|hot sauce|salsa|tabasco/i, "cond", 2, 35, 1, 1, { c: 280, k: 500, d: 15 }],
  [/mustard/i, "cond", 4, 5, 4, 3, { c: 250, d: 10 }],
  [/vinegar|lemon juice|lime juice/i, "x", 0, 10, 0, 0, { c: 240, d: 5 }],
  [/dark chocolate|chocolate|choc chips|cocoa nib/i, "sug", 7, 50, 35, 7, { c: 170, k: 200, e: 10, d: 100 }],
  [/honey|syrup|treacle|\bjam\b|nutella|caramel/i, "sug", 0.3, 82, 0, 0, { c: 340, d: 20 }],
  [/sugar/i, "sug", 0, 100, 0, 0, { c: 200, d: 20 }],
  [/ice ?cream|custard|lollies|marshmallow|biscuit|cookie/i, "sug", 4, 60, 15, 1, { k: 500, e: 15, d: 100 }],
  [/cranberr|raisin|sultana|dried (apricot|fruit|date|fig)|\bdates\b|currant/i, "fr", 1, 75, 1, 5, { c: 130, k: 250, d: 30 }],
  [/peanut butter|almond butter|tahini/i, "nut", 25, 20, 50, 6, { c: 250, d: 30 }],
  [/peanut|almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|pine nut|\bnuts?\b/i, "nut", 22, 15, 52, 8, { c: 140, k: 200, d: 30 }],
  [/sesame seed|chia|flax|linseed|pumpkin seed|sunflower seed|pepita|hemp seed|\bseeds?\b/i, "nut", 18, 25, 45, 15, { c: 140, d: 10 }],
  [/brewer'?s yeast|nutritional yeast/i, "x", 48, 36, 1, 30, { c: 128, d: 10 }],
  [/coconut oil|ghee|lard|dripping/i, "sat", 0, 0, 100, 0, { c: 218, d: 10 }],
  [/\boil\b/i, "oil", 0, 0, 100, 0, { c: 218, d: 10 }],
  [/butter(?!milk| bean|nut)/i, "sat", 1, 0, 81, 0, { c: 227, k: 500, e: 10, d: 20 }],
  [/powder|seasoning|spice|\bherbs\b|cumin|paprika|turmeric|tumeric|cinnamon|oregano|nutmeg|garam|cardamom|clove(s)? ground|star anise|chill?i flakes|bay lea|vanilla|essence|baking soda|bicarb|cream of tartar|stock cube|gelatine?|dried (thyme|parsley|basil|rosemary|sage|dill|mint|chill?i|coriander)|ground (coriander|ginger|cloves|allspice|pepper)|coriander seed|mustard seed|fennel seed|saffron|zest/i, "sp", 0, 0, 0, 0, { d: 0 }],
  [/^(black |white |cracked |ground |sea |rock |table )?(salt|pepper(corns)?)$/i, "sp", 0, 0, 0, 0, { d: 0 }],
  [/cream cheese|mascarpone/i, "sat", 6, 4, 34, 0, { k: 250, c: 230, d: 100 }],
  [/sour cream|creme fraiche|crème fraîche/i, "sat", 3, 4, 20, 0, { k: 250, e: 250, c: 240, d: 100 }],
  [/cream/i, "sat", 2, 3, 35, 0, { c: 240, k: 300, e: 300, d: 150 }],
  [/parmesan|parmigiano|pecorino|grana/i, "sat", 35, 3, 28, 0, { c: 90, k: 200, d: 30 }],
  [/feta|halloumi|haloumi|paneer|goat'?s cheese|ricotta/i, "sat", 15, 2, 21, 0, { k: 200, e: 200, c: 150, d: 100 }],
  [/cheese|cheddar|mozzarella|edam|colby|tasty|gouda|brie|camembert/i, "sat", 25, 1, 33, 0, { c: 100, k: 500, e: 20, d: 100 }],
  [/yog(h)?urt|kefir/i, "dy", 4, 12, 3, 0, { c: 245, k: 150, e: 150, d: 150 }],
  [/milk|buttermilk/i, "dy", 3.4, 5, 3.5, 0, { c: 245, k: 1000, d: 250 }],
  [/egg yolk|yolk/i, "egg", 16, 1, 27, 0, { e: 18, d: 18 }],
  [/\beggs?\b(?! ?noodle)/i, "egg", 12.5, 1, 10, 0, { e: 55, k: 660, d: 110 }],
  [/chicken.*breast|breast/i, "wm", 23, 0, 2, 0, { e: 220, k: 500, d: 500 }],
  [/chicken.*(thigh|drum|wing|leg|maryland)|thigh|drum/i, "wm", 18, 0, 9, 0, { e: 120, k: 1000, d: 500 }],
  [/chicken|turkey|duck/i, "wm", 20, 0, 7, 0, { e: 200, k: 500, d: 500 }],
  [/salmon|sardine|mackerel|trout|kahawai|anchov|herring|eel\b/i, "of", 20, 0, 13, 0, { e: 150, k: 400, d: 150 }],
  [/tuna/i, "fi", 25, 0, 1, 0, { e: 185, k: 185, d: 185 }],
  [/fish|tarakihi|terakihi|snapper|hoki|\bcod\b|gurnard|hake|basa|tilapia|kingfish|blue warehou|prawn|shrimp|squid|calamari|mussel|scallop|crab|lobster|crayfish|oyster/i, "fi", 18, 0, 1.5, 0, { e: 150, k: 500, d: 400 }],
  [/steak|sirloin|scotch fillet|rump|ribeye|eye fillet/i, "rm", 21, 0, 8, 0, { e: 250, d: 500 }],
  [/shank/i, "rm", 18, 0, 12, 0, { e: 300, d: 1200 }],
  [/mince|beef|lamb|pork|veal|venison|mutton|goat|meatball|\bribs?\b|brisket|\bchops?\b/i, "rm", 19, 0, 15, 0, { e: 200, k: 500, d: 500 }],
  [/tofu|tempeh/i, "leg", 12, 2, 7, 1, { k: 300, e: 300, d: 300 }],
  [/kidney bean|black bean|chickpea|garbanzo|lentil|cannellini|butter bean|borlotti|baked bean|pinto|refried|four bean|mixed bean|split pea|hummus|houmous|edamame|haricot/i, "leg", 8, 16, 0.6, 7, { k: 400, e: 400, c: 180, d: 400 }],
  [/rolled oats|\boats\b|porridge|oatmeal/i, "wg", 13, 60, 7, 10, { c: 90, k: 750, d: 200 }],
  [/wholemeal|whole ?wheat|wholegrain|whole grain|brown rice|quinoa|barley|bulgur|bulgar|freekeh|\brye\b|buckwheat|spelt|wild rice/i, "wg", 12, 66, 3, 8, { c: 180, k: 500, e: 40, d: 300 }],
  [/rice noodle|pad thai|vermicelli|rice stick/i, "rg", 6, 80, 1, 1.5, { k: 200, e: 200, d: 250 }],
  [/noodle|hokkien|udon|ramen|soba/i, "rg", 12, 70, 3, 3, { k: 450, e: 450, d: 250 }],
  [/tortellini|ravioli|filled pasta/i, "rg", 11, 45, 8, 2, { k: 375, e: 375, d: 375 }],
  [/gnocchi/i, "rg", 3, 33, 0.5, 2, { k: 500, e: 500, d: 500 }],
  [/pasta|spaghetti|penne|macaroni|fusilli|spiral|lasagne|lasagna|orzo|linguine|fettuccine|tagliatelle|rigatoni|farfalle|seashell|\bshells\b|risoni/i, "rg", 13, 72, 1.5, 3, { c: 100, k: 500, e: 20, d: 400 }],
  [/cous ?cous/i, "rg", 13, 72, 1, 5, { c: 175, k: 500, d: 250 }],
  [/rice/i, "rg", 7, 79, 0.6, 1, { c: 185, k: 1000, e: 75, d: 300 }],
  [/panko|breadcrumb|bread crumb/i, "rg", 12, 72, 4, 4, { c: 60, k: 200, d: 60 }],
  [/flour|cornflour|cornstarch/i, "rg", 10, 76, 1, 3, { c: 125, k: 1000, d: 50 }],
  [/bread|\broll|\bbuns?\b|naan|\bwraps?\b|tortilla|pita|bagel|croissant|loaf|baguette|focaccia|crumpet|muffin/i, "rg", 9, 49, 3, 3, { e: 40, k: 400, c: 50, d: 300 }],
  [/kumara|kūmara|sweet potato|yam/i, "veg", 1.6, 20, 0.1, 3, { e: 250, k: 1000, c: 200, d: 500 }],
  [/potato|mash/i, "st", 2, 17, 0.1, 2, { e: 170, k: 2000, c: 210, d: 600 }],
  [/spring onion|scallion|green onion/i, "veg", 1.8, 7, 0.2, 2.6, { e: 15, k: 100, c: 100, d: 30 }],
  [/garlic/i, "veg", 6, 33, 0.5, 2, { e: 5, k: 40, c: 136, d: 5 }],
  [/ginger|lemongrass|galangal/i, "veg", 1.8, 18, 0.8, 2, { e: 20, k: 50, c: 96, d: 10 }],
  [/chill?i|jalape/i, "veg", 2, 9, 0.4, 1.5, { e: 10, k: 100, d: 10 }],
  [/avocado|guacamole/i, "veg", 2, 2, 15, 7, { e: 150, k: 400, c: 150, d: 150 }],
  [/sun-? ?dried tomato/i, "veg", 5, 25, 14, 6, { e: 6, k: 280, c: 110, d: 60 }],
  [/tomato (paste|puree|purée)/i, "veg", 4, 19, 0.5, 4, { c: 260, k: 140, d: 30 }],
  [/chopped tomato|diced tomato|crushed tomato|tinned tomato|canned tomato|passata|tomatoes in|tomato pasta/i, "veg", 1, 4, 0.2, 1, { k: 400, e: 400, c: 240, d: 400 }],
  [/(sweet ?)?corn|maize/i, "veg", 3, 19, 1.5, 2, { c: 150, k: 400, e: 200, d: 200 }],
  [/\bpeas\b|snow pea|sugar snap|mange/i, "veg", 5, 14, 0.4, 5, { c: 145, k: 500, d: 150 }],
  [/onion|shallot|leek/i, "veg", 1.1, 9, 0.1, 1.7, { e: 150, k: 1000, c: 160, d: 150 }],
  [/carrot/i, "veg", 0.9, 10, 0.2, 2.8, { e: 100, k: 1000, c: 130, d: 100 }],
  [/capsicum|bell pepper|red pepper|green pepper|pepper (red|green|yellow)/i, "veg", 1, 6, 0.3, 2, { e: 160, k: 450, c: 150, d: 160 }],
  [/courgette|zucchini|squash|marrow/i, "veg", 1.2, 3, 0.3, 1, { e: 200, k: 500, c: 125, d: 200 }],
  [/pumpkin|butternut/i, "veg", 1, 7, 0.1, 1.5, { e: 1200, k: 1000, c: 140, d: 500 }],
  [/broccoli|cauli|brussels|cabbage|bok choy|pak choi|kale|silverbeet|chard/i, "veg", 2.8, 6, 0.4, 2.6, { e: 350, k: 300, c: 90, d: 300 }],
  [/spinach|lettuce|rocket|salad|greens|slaw|watercress|mesclun|cos\b/i, "veg", 2, 4, 0.4, 2.2, { e: 300, k: 150, c: 30, d: 120 }],
  [/mushroom/i, "veg", 3, 3, 0.3, 1, { e: 20, k: 200, c: 70, d: 200 }],
  [/celery/i, "veg", 0.7, 3, 0.2, 1.6, { e: 40, k: 500, c: 100, d: 40 }],
  [/cucumber|radish|fennel/i, "veg", 0.7, 3.6, 0.1, 0.6, { e: 300, k: 500, c: 120, d: 150 }],
  [/eggplant|aubergine/i, "veg", 1, 6, 0.2, 3, { e: 300, k: 300, c: 80, d: 300 }],
  [/green bean|runner bean|string bean|asparagus|beetroot|beet\b|turnip|parsnip|swede|okra|artichoke/i, "veg", 2, 8, 0.2, 3, { e: 150, k: 400, c: 110, d: 200 }],
  [/tomato/i, "veg", 0.9, 3.9, 0.2, 1.2, { e: 120, k: 250, c: 180, d: 120 }],
  [/parsley|coriander|cilantro|basil|mint|dill|chives|rosemary|thyme|sage|tarragon|herb/i, "veg", 3, 6, 0.8, 3, { e: 5, k: 30, c: 30, d: 10 }],
  [/lemon|lime|orange|mandarin|grapefruit/i, "fr", 1, 9, 0.3, 2.8, { e: 70, k: 1000, c: 240, d: 70 }],
  [/berr|cherr|grape/i, "fr", 0.7, 12, 0.3, 2.4, { c: 150, k: 250, e: 5, d: 150 }],
  [/banana|apple|pear|peach|plum|apricot|mango|kiwi|feijoa|pineapple|melon|nectarine|fruit/i, "fr", 0.6, 13, 0.3, 2.2, { e: 150, k: 1000, c: 160, d: 150 }],
  [/baking powder|yeast|water|ice\b/i, "sp", 0, 0, 0, 0, { d: 0 }],
];
const NUT_HIT = new Map();
function nutOf(name) {
  const k = shopName(name).toLowerCase();
  if (NUT_HIT.has(k)) return NUT_HIT.get(k);
  const r = NUT.find((x) => x[0].test(k)) || null;
  NUT_HIT.set(k, r); return r;
}
// Grams for one ingredient line. A missing amount uses a typical amount (d), and is counted as a guess.
function nutGrams(qty, o) {
  const s = String(qty || "").trim();
  if (!s) return { g: o.d == null ? 30 : o.d, guess: true };
  const q = parseQty(s);
  if (!q || q.n == null) {
    const w = s.toLowerCase();
    return { g: /drizzle|splash|dash|knob/.test(w) ? 10 : /pinch|sprinkle/.test(w) ? 1 : /handful/.test(w) ? 30 : (o.d == null ? 30 : o.d), guess: true };
  }
  const u = q.u.toLowerCase().replace(/\.$/, "");
  const inner = u.match(/\((\d+(?:\.\d+)?)\s*(g|ml)\)/);
  if (inner) return { g: q.n * parseFloat(inner[1]) };
  const cup = o.c || 240;
  if (!u) return { g: q.n * (o.e || o.d || 100) };
  if (u === "g" || u === "ml") return { g: q.n };
  if (/^(c|cups?|cps?|ups?|mugs?)$/.test(u)) return { g: q.n * cup };
  if (/^(tbsp|tbs|tbl|tablespoons?|tb|t)$/.test(u)) return { g: q.n * cup / 16 };
  if (/^(tsp|teaspoons?|ts)$/.test(u)) return { g: q.n * cup / 48 };
  if (/^cloves?$/.test(u)) return { g: q.n * 5 };
  if (/^(sticks?|stalks?|ribs?)$/.test(u)) return { g: q.n * 40 };
  if (/^(slices?|rashers?)$/.test(u)) return { g: q.n * 25 };
  if (/^(servings?|serves?|portions?)$/.test(u)) return { g: q.n * (o.e || 75) };
  if (/^(sheets?|pieces?|pcs?|fillets?|heads?|whole|large|medium|small|each)$/.test(u)) return { g: q.n * (o.e || 100) };
  if (/^(bunch(es)?|sprigs?)$/.test(u)) return { g: q.n * (o.k || 100) };
  if (/^(tins?|cans?|jars?|pouch(es)?|packs?|packets?|pkts?|bags?|tubs?|pots?|sachets?|blocks?|box(es)?|caps?|punnets?|bottles?|cartons?|trays?|bottles?)$/.test(u)) return { g: q.n * (o.k || o.e || 400) };
  return { g: q.n * (o.e || 100), guess: true };
}
const NUT_CACHE = new Map();
// Totals for one serve, plus the counts the health rating works from. null when there's nothing to go on.
function nutrition(m) {
  const ings = (m.ingredients || []).filter((i) => i.name);
  if (!ings.length) return null;
  const sv = servesN(m);
  const key = sv + "\n" + ings.map((i) => i.qty + "|" + i.name).join("\n");
  if (NUT_CACHE.has(key)) return NUT_CACHE.get(key);
  const r = { p: 0, c: 0, f: 0, fib: 0, kcal: 0, by: {}, names: {}, unknown: [], guessed: 0, counted: 0, serves: sv, plants: new Set() };
  for (const i of ings) {
    const e = nutOf(i.name);
    if (!e) { r.unknown.push(shopName(i.name)); continue; }
    const [, kind, p, c, f, fib, o] = e;
    if (kind === "sp") continue;
    const gg = nutGrams(i.qty, o), g = gg.g / sv;
    r.counted++; if (gg.guess) r.guessed++;
    r.p += p * g / 100; r.c += c * g / 100; r.f += f * g / 100; r.fib += fib * g / 100;
    r.by[kind] = (r.by[kind] || 0) + g;
    if (kind === "sat") r.satFat = (r.satFat || 0) + f * g / 100;
    if (kind === "sug") r.sugar = (r.sugar || 0) + c * g / 100;
    (r.names[kind] = r.names[kind] || []).push(shopName(i.name));
    if (/^(veg|fr|leg|nut|wg)$/.test(kind)) r.plants.add(normName(i.name));
  }
  r.kcal = r.p * 4 + r.c * 4 + r.f * 9;
  r.ok = r.counted > 0 && r.kcal > 30;
  r.rough = r.unknown.length > r.counted / 2 || r.guessed > r.counted / 2;
  r.health = r.ok ? healthScore(r) : null;
  NUT_CACHE.set(key, r);
  return r;
}
const g0 = (n) => Math.round(n / 5) * 5;
const listN = (a) => { const u = [...new Set(a)]; return u.length > 3 ? u.slice(0, 3).join(", ") + " +" + (u.length - 3) : u.join(", "); };
// Starts at 6 (an ordinary home-cooked dinner) and moves for what's in it. Each step is one reason line.
function healthScore(r) {
  const why = []; let s = 6;
  const add = (d, t) => { s += d; why.push({ d, t }); };
  const by = (k) => r.by[k] || 0, nm = (...ks) => listN(ks.flatMap((k) => r.names[k] || []));
  const pm = by("pm");
  if (pm > 0) add(pm >= 60 ? -3 : pm >= 20 ? -2 : -1, `Processed meat (${nm("pm")}), about ${g0(pm) || "<5"} g a serve. The WHO classes it as a Group 1 carcinogen (bowel cancer); the advice is to eat as little as you can.`);
  const rm = by("rm");
  if (rm >= 150) add(-1, `Lots of red meat (${nm("rm")}), about ${g0(rm)} g a serve. The WHO lists red meat as Group 2A (probably carcinogenic); aim for no more than about 350 to 500 g cooked a week.`);
  else if (rm > 0) add(0, `Red meat (${nm("rm")}), about ${g0(rm)} g a serve: fine in moderation.`);
  // Plant-food bonuses (veg, variety, fibre, beans, whole grains) overlap, so together they're capped at +4.
  let plus = 0; const pAdd = (d, t) => { const k = Math.max(0, Math.min(d, 4 - plus)); plus += k; add(k, k < d ? t + " (plant bonuses top out at +4, already reached)" : t); };
  const sweet = (r.sugar || 0) >= 12;
  const plants = by("veg") + by("fr") + by("leg");
  if (plants >= 200) pAdd(2, `Plenty of veg and fruit, about ${g0(plants)} g a serve (that's ${Math.floor(plants / 80)} of your 5+ a day).`);
  else if (plants >= 100) pAdd(1, `Some veg, about ${g0(plants)} g a serve (${Math.floor(plants / 80)} of your 5+ a day).`);
  else if (plants < 40 && !sweet) add(-1, `Little or no veg (about ${g0(plants)} g a serve). Adding a side salad or greens would lift it.`);
  else if (plants >= 40) add(0, `A little veg, about ${g0(plants)} g a serve.`);
  if (r.plants.size >= 5) pAdd(1, `${r.plants.size} different plant foods: variety is good for your gut.`);
  if (r.fib >= 8) pAdd(1, `Good fibre, about ${Math.round(r.fib)} g a serve.`);
  else if (r.fib < 3 && plants >= 40) add(-1, `Low fibre, about ${Math.round(r.fib)} g a serve.`);
  if (by("leg") >= 50) pAdd(1, `Beans or lentils (${nm("leg")}): fibre and plant protein.`);
  if (by("wg") >= 30) pAdd(1, `Whole grains (${nm("wg")}).`);
  if (by("of") >= 60) add(1, `Oily fish (${nm("of")}): omega-3s.`);
  if (by("fried") >= 20) add(-1, `Fried or crumbed (${nm("fried")}).`);
  const upf = (r.names.upf || []).length;
  if (upf && by("upf") >= 15) add(upf >= 2 ? -2 : -1, `Ultra-processed (${nm("upf")}): ready-made sauces, mixes and pastry tend to be high in salt, sugar or fat.`);
  const sf = r.satFat || 0;
  if (sf >= 20) add(sf >= 35 ? -2 : -1, `Rich: lots of cream, cheese, butter or coconut (${nm("sat")}), about ${Math.round(sf)} g fat a serve from them.`);
  const sug = r.sugar || 0;
  if (sug >= 12) add(sug >= 30 ? -2 : -1, `Added sugar (${nm("sug")}), about ${Math.round(sug)} g a serve. The WHO suggests under 25 g a day.`);
  if (r.kcal >= 1000) add(-1, `A big serve, about ${g0(r.kcal)} kcal.`);
  const score = Math.max(1, Math.min(10, s));
  return { score, why };
}
const HEALTH_BANDS = [[9, "Great", "#2e9d57"], [7, "Good", "#7cb342"], [5, "OK", "#e0a526"], [3, "Go easy", "#ef7d32"], [1, "Treat", "#d64541"]];
function healthBand(n) { return HEALTH_BANDS.find((b) => n >= b[0]); }
function hpill(m) {
  const h = healthOf(m); if (!h) return "";
  const b = healthBand(h.score);
  return `<span class="hp${h.own ? " own" : ""}" style="--hc:${b[2]}" title="Health ${h.score}/10 · ${b[1]} (${h.own ? "your rating" : "estimate"})">${h.score}</span>`;
}
// The meal's rating: your own if you set one, otherwise the estimate. null when there's nothing to rate.
function healthOf(m) {
  const own = parseInt(m.health, 10);
  const r = nutrition(m);
  if (own >= 1 && own <= 10) return { score: own, own: true, est: r && r.health ? r.health.score : null };
  return r && r.health ? { score: r.health.score, own: false, est: r.health.score } : null;
}
// The protein / carbs / fat split as a ring, by share of calories, kcal a serve in the middle.
const MACRO_COL = { p: "#f0883e", c: "#2bb3c0", f: "#a46fd6" };
function macroRing(r, size) {
  const R = 40, C = 2 * Math.PI * R, tot = r.p * 4 + r.c * 4 + r.f * 9 || 1;
  let off = 0;
  const arcs = [["c", r.c * 4], ["f", r.f * 9], ["p", r.p * 4]].map(([k, v]) => {
    const len = C * v / tot, gap = len > 6 ? 2 : 0;
    const s = `<circle r="${R}" cx="50" cy="50" fill="none" stroke="${MACRO_COL[k]}" stroke-width="13" stroke-dasharray="${Math.max(0, len - gap).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 50 50)"/>`;
    off += len; return s;
  }).join("");
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Estimated macros: ${Math.round(r.c * 400 / tot)}% carbs, ${Math.round(r.f * 900 / tot)}% fat, ${Math.round(r.p * 400 / tot)}% protein">
    <circle r="${R}" cx="50" cy="50" fill="none" stroke="color-mix(in srgb, currentColor 10%, transparent)" stroke-width="13"/>${arcs}
    <text x="50" y="49" text-anchor="middle" font-size="19" font-weight="800" fill="currentColor">~${g0(r.kcal)}</text>
    <text x="50" y="64" text-anchor="middle" font-size="10" fill="currentColor" opacity=".65">kcal / serve</text></svg>`;
}

