const MP_VERSION = "1.28";
const P2 = (n) => String(n).padStart(2, "0");
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function today() { const d = new Date(); return d.getFullYear() + "-" + P2(d.getMonth() + 1) + "-" + P2(d.getDate()); }
function parts(iso) { const [y, m, d] = iso.split("-").map(Number); return [y, m, d]; }
function addDays(iso, n) { const [y, m, d] = parts(iso); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.getUTCFullYear() + "-" + P2(t.getUTCMonth() + 1) + "-" + P2(t.getUTCDate()); }
function dowIdx(iso) { const [y, m, d] = parts(iso); return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; }
function weekStart(iso) { return addDays(iso, -dowIdx(iso)); }
function daysBetween(a, b) { const [y1, m1, d1] = parts(a), [y2, m2, d2] = parts(b); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000); }
function dayNum(iso) { return parts(iso)[2]; }
function monShort(iso) { return MON[parts(iso)[1] - 1]; }
const ISO = /^\d{4}-\d{2}-\d{2}$/;
// "Tonight", "Sat" within the coming week, otherwise "4 Nov", so a next-week Wednesday is not mistaken for this one.
function longDay(d) { return DOW[dowIdx(d)] + " " + dayNum(d) + " " + monShort(d); }
function dayWord(d) { const t = today(); const n = daysBetween(t, d); return n === 0 ? "Tonight" : n > 0 && n < 7 ? DOW[dowIdx(d)] : dayNum(d) + " " + monShort(d); }

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const DEFAULT_AISLES = [
  { name: "Produce", icon: "🥬", colour: "#5fb86a" },
  { name: "Meat & Fish", icon: "🥩", colour: "#e5615e" },
  { name: "Dairy & Eggs", icon: "🧀", colour: "#e9b949" },
  { name: "Bakery", icon: "🍞", colour: "#c8915a" },
  { name: "Pantry", icon: "🥫", colour: "#ee8455" },
  { name: "Spices", icon: "🌶️", colour: "#d4663a" },
  { name: "Condiments", icon: "🫙", colour: "#b8913a" },
  { name: "Frozen", icon: "🧊", colour: "#4cb5e6" },
  { name: "Snacks & Drinks", icon: "🧃", colour: "#b07cd1" },
  { name: "Household", icon: "🧻", colour: "#8fa3ad" },
  { name: "Other", icon: "📦", colour: "#a7adb4" },
];

// First match wins, so the more specific words come first.
const GUESS = [
  // Spices and Condiments first: "garlic powder" isn't Produce, "peanut butter" isn't Dairy.
  [/(cumin|paprika|turmeric|garam masala|chill?i (powder|flakes)|cinnamon|nutmeg|oregano|curry powder|cayenne|cardamom|star anise|five spice|mixed herbs|italian herbs|dried herbs|seasoning|spice|\bsalt\b|black pepper|cracked pepper|white pepper|peppercorn|bay lea|sesame seed|mustard seed|fennel seed|garlic powder|onion powder|stock powder|chicken salt)/i, "Spices"],
  [/(tomato sauce|bbq sauce|barbecue sauce|soy sauce|fish sauce|oyster sauce|worcestershire|hoisin|sriracha|sweet chill?i sauce|hot sauce|mayo|mustard|ketchup|relish|chutney|pickle|vinegar|tartare|aioli|dressing|gochujang|kecap|mirin|pesto|salsa|honey|\bjam\b|peanut butter|vegemite|marmite|maple syrup|sesame oil)/i, "Condiments"],
  [/(frozen|ice ?cream|peas|chips|edamame|ice\b)/i, "Frozen"],
  [/(milk|cream|cheese|butter|yog|egg|parmesan|mozzarella|feta|sour cream)/i, "Dairy & Eggs"],
  [/(chicken|beef|mince|lamb|pork|bacon|ham|sausage|salmon|fish|prawn|tarakihi|steak|pepperoni|tuna)/i, "Meat & Fish"],
  [/(bread|bun|roll|naan|wrap|tortilla|pizza base|bagel|croissant|loaf)/i, "Bakery"],
  [/(apple|banana|onion|garlic|carrot|potato|kumara|kūmara|tomato|lettuce|avocado|lemon|lime|pumpkin|capsicum|mushroom|cucumber|ginger|coriander|parsley|spinach|broccoli|berr|grape|orange|kiwi|celery|herb|salad|coleslaw|veg)/i, "Produce"],
  [/(chip|crisp|biscuit|chocolate|lolly|juice|soft drink|coke|beer|wine|coffee|tea\b|snack)/i, "Snacks & Drinks"],
  [/(toilet|paper towel|dishwash|detergent|soap|shampoo|cleaner|bin bag|foil|glad|tissue|nappy|battery|batteries)/i, "Household"],
  [/(rice|pasta|spaghetti|noodle|flour|sugar|oil|sauce|stock|tin|can|jar|passata|spice|salt|pepper|taco|cereal|oat|syrup|honey|vinegar|soy|bean|lentil)/i, "Pantry"],
];
function guessAisle(name) { for (const [re, a] of GUESS) if (re.test(name)) return a; return "Other"; }

