// ---------- quantities ----------

const UNIT = { g: "g", gram: "g", grams: "g", kg: "kg", kgs: "kg", ml: "ml", l: "L", litre: "L", litres: "L", liter: "L", liters: "L" };
function parseQty(s) {
  s = String(s || "").trim();
  if (!s) return null;
  s = s.replace(/(\d)?\s*([¼½¾⅓⅔⅛])/g, (x, w, f) => (w || "0") + "+" + FRAC_IN[f]);
  // Whole and fraction first ("1 1/2", "1/2"), so "1/2" never reads as 1 of a unit called "/2".
  const m = s.match(/^(\d+\s*\+\s*\d+\/\d+|\d+\s+\d+\/\d+|\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!m) return { n: null, u: s };
  let n = m[1].split(/\s*\+\s*|\s+(?=\d+\s*\/)/).reduce((a, x) => a + (x.includes("/") ? x.split("/").map((y) => Number(y.trim())).reduce((p, q) => p / q) : parseFloat(x.replace(",", "."))), 0);
  let u = m[2].trim();
  const k = UNIT[u.toLowerCase()];
  if (k === "kg") { n *= 1000; u = "g"; } else if (k === "L") { n *= 1000; u = "ml"; } else if (k) u = k;
  return { n, u };
}
const FRAC_IN = { "¼": "1/4", "½": "1/2", "¾": "3/4", "⅓": "1/3", "⅔": "2/3", "⅛": "1/8" };
const FRAC_OUT = [[0.25, "¼"], [0.5, "½"], [0.75, "¾"], [1 / 3, "⅓"], [2 / 3, "⅔"], [0.125, "⅛"]];
// 0.5 shows as ½ and 1.5 as 1½; anything else keeps two decimals at most.
function trimNum(n) {
  const w = Math.floor(n + 1e-9), f = n - w, g = FRAC_OUT.find(([v]) => Math.abs(f - v) < 0.01);
  if (g && f > 0.01) return (w ? String(w) : "") + g[1];
  return String(Math.round(n * 100) / 100);
}
function fmtQty(q) {
  if (q.u === "g" && q.n >= 1000) return trimNum(q.n / 1000) + " kg";
  if (q.u === "ml" && q.n >= 1000) return trimNum(q.n / 1000) + " L";
  let u = q.u;
  if (u && q.n > 1 && !/^(g|ml)$/.test(u) && !/s$/.test(u)) u += /(ch|sh|x)$/i.test(u) ? "es" : "s";
  return trimNum(q.n) + (u ? " " + u : "");
}
// "bunches", "bunch" and "Bunch" are one unit; so are "tins" and "tin".
function unitOne(u) { return u.replace(/(ch|sh|x)es$/i, "$1").replace(/s$/i, ""); }
function sumQty(list) {
  const by = new Map(); const loose = [];
  for (const s of list) {
    const q = parseQty(s); if (!q) continue;
    if (q.n == null) { if (!loose.includes(q.u)) loose.push(q.u); continue; }
    const key = unitOne(q.u.toLowerCase());
    const e = by.get(key);
    if (e) e.n += q.n; else by.set(key, { n: q.n, u: unitOne(q.u) || q.u });
  }
  return [...[...by.values()].map(fmtQty), ...loose].join(" + ");
}
// Servings: a meal's ingredients are written for its "serves"; a night can be cooked for more or fewer.
// A meal with no Serves set counts as serving 4, so every meal has a number to step up or down.
const DEFAULT_SERVES = 4;
function servesN(m) { const n = parseFloat(String((m && m.serves) || "").replace(",", ".")); return n > 0 ? n : DEFAULT_SERVES; }
function nightServes(m, d) { return (m.ppl && m.ppl[d]) || servesN(m); }
function factor(m, d) { const b = servesN(m), n = m.ppl && m.ppl[d]; return b && n && n !== b ? n / b : 1; }
// Amounts by unit ("200 g + 1 tin" is { g: 200, tin: 1 }), so a change in head count can be added or taken off a line.
function qtyMap(list) {
  const by = new Map(), loose = [];
  for (const s of list) for (const part of String(s || "").split(/\s+\+\s+/)) {
    const q = parseQty(part); if (!q) continue;
    if (q.n == null) { if (!loose.includes(q.u)) loose.push(q.u); continue; }
    const key = unitOne(q.u.toLowerCase()), e = by.get(key);
    if (e) e.n += q.n; else by.set(key, { n: q.n, u: unitOne(q.u) || q.u });
  }
  return { by, loose };
}
function mapQty(m) { return [...[...m.by.values()].filter((e) => e.n > 1e-6).map(fmtQty), ...m.loose].join(" + "); }
// "500 g" for 6 instead of 4 is "750 g"; an amount with no number ("a handful") stays as it is.
function scaleQty(s, f) {
  if (f === 1 || !s) return s;
  const q = parseQty(s); if (!q || q.n == null) return s;
  // Things bought whole (onions, tins, packs) round up; measured amounts keep their fraction.
  const n = /^(g|ml|tbsp|tsp|tablespoons?|teaspoons?|cups?)$/i.test(q.u) ? q.n * f : Math.ceil(q.n * f - 1e-9);
  return fmtQty({ n, u: q.u });
}
// Assumed to be in the cupboard: held back from the list and shown under Check the pantry instead.
// These aisles count as cupboard stock: their ingredients go under Check the pantry, not on the list.
const PANTRY_AISLES = ["Pantry", "Spices", "Condiments"];
// A meal with no ingredients typed in: planning it puts nothing on the list, so it's flagged.
function noIngs(m) { return !(m.ingredients || []).some((i) => i.name); }
const NOI = "__noi";
function isPantry(i) { return !i.list && (!!i.staple || PANTRY_AISLES.includes(i.aisle)); }
function normName(s) { return shopName(s).toLowerCase().replace(/(es|s)$/, ""); }
// "Tomato (finely diced)" goes on the list as "Tomato": the bracket is how to prep it, not what to buy.
function shopName(s) { return String(s || "").replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim() || String(s || "").trim(); }
// A line kept only to remember "we have it" for some meals: not shown, but it stops the list asking again.
function isGhost(s) { return !s.done && !s.for.length && !s.qty && (s.have || []).length > 0; }
// Every day a meal was had or planned up to today, newest first (had: + plan: + cooked:).
// Tonight's plan only counts once tonight is over (or "We had this" is tapped).
function eaten(m, t) { return [...new Set([...[...(m.had || []), ...m.plan].filter((d) => d < t), m.cooked].filter((d) => d && ISO.test(d) && d <= t))].sort().reverse(); }
function lastHad(m, t) { return eaten(m, t)[0] || ""; }
const POPULAR_DAYS = 90, POPULAR_N = 3;
function popular(m, t) { const lo = addDays(t, -POPULAR_DAYS); return eaten(m, t).filter((d) => d >= lo).length >= POPULAR_N; }

