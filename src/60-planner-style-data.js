const PL_STYLE = BASE + `
.tn { display:grid; grid-template-columns:minmax(200px, 300px) 1fr; gap:18px; align-items:stretch; margin-bottom:18px; border-radius:18px; overflow:hidden;
  background:color-mix(in srgb, var(--primary-color) 8%, transparent); border:1px solid color-mix(in srgb, var(--primary-color) 22%, transparent); }
.tn .th { min-height:168px; height:100%; cursor:pointer; }
.tn .th .em { font-size:84px; }
.tn .bd { padding:16px 18px 16px 0; display:flex; flex-direction:column; gap:6px; min-width:0; }
.tn .k { font-size:12px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; color:var(--primary-color); }
.tn .n { font-size:28px; font-weight:750; letter-spacing:-.5px; line-height:1.1; }
.tn .mt { display:flex; flex-wrap:wrap; gap:6px; }
.tn .act { margin-top:auto; display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; }
.tn.empty { grid-template-columns:1fr; padding:18px; }
.tn.empty .bd { padding:0; }
.narrow .tn { grid-template-columns:1fr; }
.narrow .tn .th { min-height:140px; }
.narrow .tn .bd { padding:0 16px 16px; }
.narrow .tn .n { font-size:23px; }

.sec { display:flex; align-items:center; gap:8px; margin:6px 0 10px; }
.sec .l { white-space:nowrap; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:var(--secondary-text-color); }
.sec .sp { flex:1; }
.wk { position:relative; display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:10px; margin-bottom:20px; }
.dy { border-radius:14px; border:1px solid var(--divider-color); overflow:hidden; cursor:pointer; display:flex; flex-direction:column; min-height:150px;
  background:var(--card-background-color); transition:transform .1s, box-shadow .2s; -webkit-tap-highlight-color:transparent; }
.dy:active { transform:scale(.98); }
.dy .dh { display:flex; align-items:baseline; gap:6px; padding:8px 10px 6px; }
.dy .dn { font-weight:700; font-size:14px; }
.dy .dd { font-size:12px; color:var(--secondary-text-color); }
.dy.td { border-color:var(--primary-color); box-shadow:0 0 0 2px color-mix(in srgb, var(--primary-color) 35%, transparent); }
.dy.td .dn { color:var(--primary-color); }
.dy.past { opacity:.55; }
.dy .th { flex:1; min-height:76px; }
.dy .th .em { font-size:38px; }
.dy .mn { padding:7px 10px 9px; font-size:13px; font-weight:650; line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.dy .more { font-size:11px; color:var(--secondary-text-color); padding:0 10px 8px; margin-top:-6px; }
.dy .add { flex:1; margin:0 8px 8px; border:2px dashed var(--divider-color); border-radius:10px; display:grid; place-items:center; color:var(--secondary-text-color); font-size:26px; }
.dy:hover .add { border-color:var(--primary-color); color:var(--primary-color); }
.narrow .wk { grid-auto-flow:column; grid-template-columns:none; grid-auto-columns:116px; overflow-x:auto; scroll-snap-type:x mandatory; padding-bottom:6px; margin:0 -16px 18px; padding-left:16px; padding-right:16px; scrollbar-width:none; }
.narrow .wk::-webkit-scrollbar { display:none; }
.narrow .dy { scroll-snap-align:start; }

.fl { display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
.fl input.i { flex:1 1 200px; height:40px; border-radius:999px; padding-left:38px;
  background:color-mix(in srgb, var(--primary-text-color) 5%, transparent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='%23888'%3E%3Cpath d='M9.5 3a6.5 6.5 0 0 1 5.2 10.4l5.4 5.4-1.4 1.4-5.4-5.4A6.5 6.5 0 1 1 9.5 3m0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9'/%3E%3C/svg%3E") no-repeat 13px 50%; border-color:transparent; }
.tgw { flex:1 1 100%; min-width:0; }
.tg .chip { flex:none; }
.tg .chip.noi { border:1px dashed currentColor; }
.tg .chip.noi.on { background:var(--warning-color, #c98a00); color:#fff !important; }
.tg .chip { cursor:pointer; height:32px; padding:0 13px; font-size:13px; border:1px solid transparent; }
.tg .chip.on { background:var(--primary-color); color:var(--text-primary-color, #fff); }
.lib { display:grid; grid-template-columns:repeat(auto-fill, minmax(168px, 1fr)); gap:12px; }
.narrow .lib { grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:10px; }
.ml { border-radius:16px; overflow:hidden; cursor:pointer; background:var(--card-background-color); border:1px solid var(--divider-color);
  display:flex; flex-direction:column; transition:transform .1s, box-shadow .2s; position:relative; -webkit-tap-highlight-color:transparent; }
.ml:hover { box-shadow:0 6px 18px rgba(0,0,0,.12); }
.ml:active { transform:scale(.98); }
.ml .th { aspect-ratio:4/3; }
.ml .th .em { font-size:54px; }
.ml .b { padding:9px 11px 11px; }
.ml .n { font-weight:700; font-size:14.5px; line-height:1.25; }
.ml .m { font-size:12px; color:var(--secondary-text-color); margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lib .ml { -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
.ml.lift { transform:scale(.96); opacity:.5; }
.ghost { position:fixed; z-index:10002; width:120px; border-radius:14px; overflow:hidden; pointer-events:none; background:var(--card-background-color, #fff);
  box-shadow:0 14px 34px rgba(0,0,0,.35); transform:translate(-50%, -60%) rotate(-3deg); }
.ghost .th { aspect-ratio:4/3; }
.ghost .th .em { font-size:40px; }
.ghost .n { padding:6px 9px 8px; font-size:12.5px; font-weight:700; line-height:1.2; color:var(--primary-text-color); }
.dragging .dy:not(.past) { border-style:dashed; border-color:color-mix(in srgb, var(--primary-color) 55%, transparent); }
.dy.over { border-style:solid !important; border-color:var(--primary-color) !important; transform:scale(1.04);
  box-shadow:0 0 0 3px color-mix(in srgb, var(--primary-color) 40%, transparent), 0 8px 20px rgba(0,0,0,.15); }
.sec .hint { font-size:12px; color:var(--secondary-text-color); }
.sec .l.fold { cursor:pointer; -webkit-tap-highlight-color:transparent; padding:6px 0; }
.shut { padding:14px; text-align:center; border:2px dashed var(--divider-color); border-radius:14px; cursor:pointer; font-size:14px; }
.narrow .sec .hint { display:none; }
.ml .rmb { position:absolute; top:8px; right:8px; z-index:2; height:32px; padding:0 12px; border-radius:999px; border:none; cursor:pointer; font-size:12.5px; font-weight:700;
  background:rgba(255,255,255,.94); color:var(--error-color, #d64541); box-shadow:0 2px 6px rgba(0,0,0,.18); }
.ml .pin { position:absolute; top:8px; left:8px; z-index:2; height:24px; padding:0 9px; border-radius:999px; font-size:11.5px; font-weight:700;
  background:rgba(255,255,255,.92); color:#333; display:flex; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,.15); }
.ml .pop { position:absolute; top:8px; right:8px; z-index:2; width:28px; height:28px; border-radius:50%; font-size:15px; display:grid; place-items:center;
  background:rgba(255,255,255,.92); box-shadow:0 2px 6px rgba(0,0,0,.15); }
.nut { display:grid; grid-template-columns:auto minmax(150px, 260px) 1fr; gap:14px 16px; align-items:start; margin-top:14px; padding:14px;
  border:1px solid var(--divider-color); border-radius:16px; }
.nut .rg { color:var(--primary-text-color); line-height:0; }
.nut .hc { grid-column:1 / -1; }
.hpick[hidden] { display:none; }
.nut .lg { display:grid; gap:5px; font-size:13px; align-self:center; }
.nut .lg div { display:flex; align-items:center; gap:7px; }
.nut .lg i { width:10px; height:10px; border-radius:50%; flex:none; }
.nut .lg b { margin-left:auto; font-variant-numeric:tabular-nums; }
.nut .lg .mut { font-size:12px; }
.nut .est { grid-column:1 / -1; font-size:11.5px; color:var(--secondary-text-color); line-height:1.4; margin-top:-4px; }
.hc .hh { display:flex; align-items:center; gap:10px; }
.hs { width:46px; height:46px; border-radius:50%; flex:none; display:grid; place-items:center; font-size:21px; font-weight:800; color:#fff; background:var(--hc); }
.hc .hl b { font-size:16px; display:block; }
.hc .hl span { font-size:12px; color:var(--secondary-text-color); }
.hc .hh .btn { margin-left:auto; }
.why { list-style:none; margin:10px 0 0; padding:0; display:grid; gap:6px; font-size:13px; line-height:1.4; }
.why li { display:flex; gap:8px; align-items:flex-start; }
.why .d { flex:none; min-width:30px; height:20px; border-radius:999px; font-size:11.5px; font-weight:800; display:grid; place-items:center;
  background:color-mix(in srgb, var(--dc) 18%, transparent); color:var(--dc); }
.hpick { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; align-items:center; }
.hpick button { width:38px; height:38px; border-radius:50%; border:2px solid var(--hc); background:none; color:var(--primary-text-color); font-weight:800; font-size:14px; cursor:pointer; }
.hpick button.on { background:var(--hc); color:#fff; }
.hp { display:inline-grid; place-items:center; min-width:20px; height:18px; padding:0 5px; border-radius:999px; font-size:11px; font-weight:800; color:#fff; background:var(--hc); margin-right:5px; vertical-align:1px; }
.chip.hav { background:color-mix(in srgb, var(--hc) 20%, transparent); color:var(--primary-text-color); white-space:nowrap; }
.chip.hav b { color:var(--hc); font-weight:800; }
.dy .mn .hp { margin-right:4px; }
.sec .ws { display:none; }
.narrow .sec .wl { display:none; }
.narrow .sec .ws { display:inline; }
.hp.own { box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.75); }
.chip.pop2 { background:color-mix(in srgb, #ff7043 18%, transparent); }
.ml.new { border-style:dashed; border-width:2px; align-items:center; justify-content:center; min-height:180px; color:var(--secondary-text-color); gap:6px; background:none; }
.ml.new .plus { font-size:34px; line-height:1; }
.ml.new:hover { color:var(--primary-color); border-color:var(--primary-color); }
.empty-lib { padding:28px; text-align:center; border:2px dashed var(--divider-color); border-radius:16px; }

/* meal sheet */
.hero { height:220px; position:relative; }
.hero .th { position:absolute; inset:0; }
.hero .th .em { font-size:110px; }
.mt2 { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
.days { display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; }
.dc { border:1px solid var(--divider-color); border-radius:12px; padding:7px 0; text-align:center; cursor:pointer; background:none; }
.dc b { display:block; font-size:13px; }
.dc span { font-size:11.5px; color:var(--secondary-text-color); }
.dc.on { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color, #fff); }
.dc.on span { color:inherit; opacity:.85; }
.dc.td { border-color:var(--primary-color); }
.dc[disabled] { opacity:.4; cursor:default; }
.wkn { display:flex; align-items:center; gap:6px; margin-bottom:8px; font-size:13px; }
.wkn .sp { flex:1; }
.ings { border:1px solid var(--divider-color); border-radius:14px; overflow:hidden; }
.ig { display:flex; align-items:center; gap:10px; padding:8px 8px 8px 12px; border-top:1px solid var(--divider-color); min-height:50px; }
.ig:first-child { border-top:none; }
.ig .ai { width:30px; height:30px; flex:none; border-radius:9px; display:grid; place-items:center; font-size:16px; }
.ig .q { min-width:66px; font-weight:700; font-size:14px; }
.ig .nm { flex:1; min-width:0; }
.ig .nm small { display:block; font-size:11.5px; color:var(--secondary-text-color); }
.ig .tgl { width:38px; height:38px; border-radius:50%; border:1.5px solid var(--divider-color); background:none; cursor:pointer; font-size:18px; display:grid; place-items:center; flex:none; }
.ig .tgl.on { background:#43a047; border-color:#43a047; color:#fff; }
.notes { white-space:pre-wrap; line-height:1.5; font-size:14px; }
.pick { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:10px; }
.pick .ml .th { aspect-ratio:16/10; }
.pick .ml .th .em { font-size:40px; }

/* edit sheet */
.row2 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.emo { display:flex; flex-wrap:wrap; gap:4px; }
.emo button { width:40px; height:40px; border-radius:10px; border:1px solid transparent; background:none; font-size:22px; cursor:pointer; }
.emo { max-height:206px; overflow-y:auto; padding:2px; }
.emoc { display:flex; gap:8px; align-items:center; margin-top:8px; font-size:13px; }
.emoc input.i { width:110px; height:38px; font-size:20px; text-align:center; }
.emo button.on { border-color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 14%, transparent); }
.er { display:grid; grid-template-columns:86px 1fr 132px 40px 40px 34px; gap:6px; align-items:center; margin-bottom:6px; }
.er input.i, .er select.i { height:38px; font-size:14px; padding:0 8px; }
.er .st { width:40px; height:38px; border-radius:10px; border:1px solid var(--divider-color); background:none; cursor:pointer; font-size:16px; opacity:.45; }
.er .st.on { opacity:1; border-color:#e9b949; background:color-mix(in srgb, #e9b949 18%, transparent); }
.er .st.fz.on { border-color:#4fc3f7; background:color-mix(in srgb, #4fc3f7 18%, transparent); }
.dfz { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 12px; margin-bottom:12px; border-radius:12px; font-size:14px; line-height:1.4;
  border:1.5px solid #4fc3f7; background:color-mix(in srgb, #4fc3f7 14%, transparent); }
.dfz .t { flex:1 1 220px; }
.dy .dh .fz { margin-left:auto; font-size:12px; }
.dy .svb { align-self:flex-end; position:relative; z-index:1; margin:-28px 6px 6px 0; padding:2px 7px; border-radius:999px; font-size:12px; font-weight:800; line-height:1.4;
  background:rgba(0,0,0,.62); color:#fff; pointer-events:none; white-space:nowrap; }
.dy .svb.ch { background:var(--primary-color); }
.svs { display:flex; align-items:center; gap:6px; margin-top:6px; font-size:13px; }
.svs button { width:34px; height:34px; border-radius:50%; border:1px solid var(--divider-color); background:var(--secondary-background-color); color:var(--primary-text-color); font-size:18px; font-weight:700; cursor:pointer; line-height:1; padding:0; }
.svs button:disabled { opacity:.35; cursor:default; }
.svs b { min-width:22px; text-align:center; font-size:16px; }
.svs .ch { font-size:11.5px; color:var(--primary-color); font-weight:700; }
.er .rm { width:34px; height:34px; border:none; background:none; cursor:pointer; font-size:18px; color:var(--secondary-text-color); }
/* Fill my week */
.fillb { border-color:color-mix(in srgb, var(--primary-color) 55%, transparent); color:var(--primary-color); }
.fillb2 { display:none; }
.narrow .sec .fillb { display:none; }
.narrow .fillb2 { display:flex; width:100%; justify-content:center; margin:-8px 0 20px; }
.fsub { margin:6px 0 12px; font-size:13.5px; line-height:1.45; }
.fw { display:flex; flex-direction:column; gap:8px; }
.fr { display:grid; grid-template-columns:62px 64px 1fr auto; gap:10px; align-items:center; padding:8px; border:1px solid var(--divider-color); border-radius:14px; }
.fr.off { grid-template-columns:62px 1fr auto; opacity:.6; border-style:dashed; }
.fr .fd b { display:block; font-size:14px; }
.fr .fd span { font-size:12px; color:var(--secondary-text-color); }
.fr .fth { width:64px; height:64px; border-radius:12px; }
.fr .fth .em { font-size:32px; }
.fr .fb { min-width:0; }
.fr .fb .n { font-weight:700; }
.fsw { position:relative; display:flex; align-items:center; gap:6px; min-width:0; cursor:pointer; border-radius:6px; }
.fsw .fn { font-size:15.5px; font-weight:750; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
.fsw .car { flex:none; color:var(--secondary-text-color); font-size:13px; }
.fs { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; font-size:16px; }
.fs option { color:#1c1c1e; background:#fff; }
.fsw:focus-within { box-shadow:0 0 0 2px color-mix(in srgb, var(--primary-color) 40%, transparent); }
.fc { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
.fc .chip { height:22px; font-size:11.5px; padding:0 8px; }
.fc .fbz { background:color-mix(in srgb, #c39bd3 26%, transparent); color:var(--primary-text-color); }
.fc .fq { background:color-mix(in srgb, #43a047 20%, transparent); color:var(--primary-text-color); }
.fc .ffz { background:color-mix(in srgb, #4fc3f7 22%, transparent); color:var(--primary-text-color); }
.fr .fa { display:flex; gap:6px; }
.btn[disabled] { opacity:.45; cursor:default; }
@media (max-width: 600px) {
  .fr { grid-template-columns:48px 1fr auto; }
  .fr .fth { display:none; }
  .fr.off { grid-template-columns:48px 1fr auto; }
  .fr .fa { flex-direction:column; }
}
.erh { display:grid; grid-template-columns:86px 1fr 132px 40px 40px 34px; gap:6px; font-size:11px; font-weight:700; color:var(--secondary-text-color); text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
@media (max-width: 600px) {
  .er, .erh { grid-template-columns:60px 1fr 38px 38px 28px; }
  .erh .ha { display:none; }
  .er { row-gap:4px; padding-bottom:8px; margin-bottom:8px; border-bottom:1px solid var(--divider-color); }
  .er select.i { grid-row:2; grid-column:2 / -1; height:34px; font-size:13.5px; }
  .nut { grid-template-columns:auto 1fr; }
  .row2 { grid-template-columns:1fr 1fr; }
}
`;

// Meal pictures, roughly grouped: mains, meat and fish, Asian, breakfast and baking, veg and fruit, treats. Any other emoji can be typed in.
const EMOJI = [
  "🍝", "🍛", "🍲", "🥘", "🫕", "🍜", "🍕", "🍔", "🌭", "🌮", "🌯", "🫔", "🥙", "🥪", "🧆", "🥗", "🥧", "🍟", "🥫",
  "🍗", "🍖", "🥩", "🥓", "🐔", "🐄", "🐖", "🐑", "🐟", "🐠", "🍤", "🦐", "🦑", "🦀", "🦞", "🦪", "🐙",
  "🍣", "🍱", "🍙", "🍚", "🍘", "🥟", "🥠", "🥡", "🍢", "🍥",
  "🍳", "🥚", "🥞", "🧇", "🥯", "🥐", "🍞", "🥖", "🫓", "🥨", "🧀", "🧈", "🥣",
  "🥔", "🍠", "🎃", "🥕", "🌽", "🥦", "🥬", "🥒", "🫑", "🌶️", "🍅", "🍆", "🥑", "🧄", "🧅", "🍄", "🫘", "🥜", "🌰", "🍋", "🍎", "🍓", "🫐", "🍌",
  "🍰", "🎂", "🧁", "🍪", "🍩", "🍮", "🍨", "🍦", "🥧", "🍫", "🍿", "🥤", "☕", "🍷", "🍺", "🔥", "⭐", "❤️",
];

// Suggested ingredients for meals that have none yet, matched on the meal's name (first match wins, so specific
// names sit above general words). Same line format as a saved meal: "qty | name | aisle", "*" = pantry staple.
// Built into the card, so suggestions need no internet or AI service.
const SUGGEST = [
  [/butter\s*sausage/, "8 | Sausages | Meat & Fish; 1 | Onion | Produce; 3 cloves | Garlic | Produce; 1 jar | Butter chicken sauce | Pantry; 1 tin | Chopped tomatoes | Pantry; 200 ml | Cream | Dairy & Eggs; 1 bunch | Coriander | Produce; * 2 cups | Rice | Pantry; 1 pack | Naan bread | Bakery"],
  [/butter\s*chicken/, "1 kg | Chicken thighs | Meat & Fish; 1 | Onion | Produce; 3 cloves | Garlic | Produce; 1 tbsp | Ginger | Produce; 1 tin | Tomato puree | Pantry; 300 ml | Cream | Dairy & Eggs; * 50 g | Butter | Dairy & Eggs; * 2 tbsp | Garam masala | Pantry; * 1 tsp | Ground cumin | Pantry; * 1 tsp | Chilli powder | Pantry; 1 bunch | Coriander | Produce; * 2 cups | Rice | Pantry; 1 pack | Naan bread | Bakery"],
  [/thai.*fish|fish.*curry/, "600 g | White fish fillets | Meat & Fish; 2 tbsp | Thai red curry paste | Pantry; 1 tin | Coconut milk | Pantry; 1 | Red capsicum | Produce; 1 head | Broccoli | Produce; 1 | Lime | Produce; * 1 tbsp | Fish sauce | Pantry; * 1 tsp | Brown sugar | Pantry; 1 bunch | Coriander | Produce; * 2 cups | Jasmine rice | Pantry"],
  [/vindaloo/, "1 kg | Pork shoulder or lamb | Meat & Fish; 2 | Onion | Produce; 4 cloves | Garlic | Produce; 1 tbsp | Ginger | Produce; 1 jar | Vindaloo paste | Pantry; 1 tin | Chopped tomatoes | Pantry; 2 | Potatoes | Produce; * 2 tbsp | Vinegar | Pantry; 1 tub | Natural yoghurt | Dairy & Eggs; * 2 cups | Rice | Pantry; 1 pack | Naan bread | Bakery"],
  [/chill?i/, "500 g | Beef mince | Meat & Fish; 1 | Onion | Produce; 2 cloves | Garlic | Produce; 1 | Red capsicum | Produce; 1 tin | Kidney beans | Pantry; 1 tin | Chopped tomatoes | Pantry; * 2 tbsp | Tomato paste | Pantry; * 2 tsp | Ground cumin | Pantry; * 1 tsp | Chilli powder | Pantry; * 1 tsp | Smoked paprika | Pantry; 1 tub | Sour cream | Dairy & Eggs; 1 cup | Grated cheese | Dairy & Eggs; * 2 cups | Rice | Pantry"],
  [/lamb\s*shank/, "4 | Lamb shanks | Meat & Fish; 1 | Onion | Produce; 2 | Carrots | Produce; 2 sticks | Celery | Produce; 4 cloves | Garlic | Produce; 1 tin | Chopped tomatoes | Pantry; 2 cups | Beef stock | Pantry; 1 cup | Red wine | Snacks & Drinks; * 2 tbsp | Tomato paste | Pantry; * 2 sprigs | Rosemary | Produce; 1.2 kg | Potatoes | Produce; * 50 g | Butter | Dairy & Eggs; * 0.5 cup | Milk | Dairy & Eggs; 1 bag | Frozen peas | Frozen"],
  [/lamb\s*rag[uù]|rag[uù]/, "800 g | Lamb shoulder or mince | Meat & Fish; 1 | Onion | Produce; 1 | Carrot | Produce; 2 sticks | Celery | Produce; 3 cloves | Garlic | Produce; 2 tins | Chopped tomatoes | Pantry; 1 cup | Red wine | Snacks & Drinks; 1 cup | Beef stock | Pantry; * 2 tbsp | Tomato paste | Pantry; * 2 sprigs | Rosemary | Produce; 500 g | Pappardelle or rigatoni | Pantry; 1 wedge | Parmesan | Dairy & Eggs"],
  [/meat\s*curry|\bcurry/, "800 g | Beef or lamb, diced | Meat & Fish; 2 | Onion | Produce; 3 cloves | Garlic | Produce; 1 tbsp | Ginger | Produce; 1 jar | Curry paste | Pantry; 1 tin | Chopped tomatoes | Pantry; 1 tin | Coconut milk | Pantry; 2 | Potatoes | Produce; 1 bag | Baby spinach | Produce; * 2 cups | Rice | Pantry; 1 pack | Naan bread | Bakery"],
  [/steak/, "4 | Sirloin or scotch fillet steaks | Meat & Fish; 4 | Eggs | Dairy & Eggs; 1 bag | Frozen oven chips | Frozen; 1 bag | Salad leaves | Produce; 2 | Tomatoes | Produce; * 2 tbsp | Butter | Dairy & Eggs; * 1 tbsp | Olive oil | Pantry"],
  [/bolognai?se|spag/, "500 g | Beef mince | Meat & Fish; 1 | Onion | Produce; 1 | Carrot | Produce; 2 cloves | Garlic | Produce; 2 tins | Chopped tomatoes | Pantry; * 2 tbsp | Tomato paste | Pantry; * 1 tsp | Dried oregano | Pantry; 500 g | Spaghetti | Pantry; 1 wedge | Parmesan | Dairy & Eggs"],
  [/carbonara/, "500 g | Spaghetti | Pantry; 200 g | Streaky bacon or pancetta | Meat & Fish; 4 | Eggs | Dairy & Eggs; 1 cup | Grated Parmesan | Dairy & Eggs; 2 cloves | Garlic | Produce; * 1 tsp | Cracked black pepper | Pantry"],
  [/chicken.*bacon.*corn|bacon.*corn/, "500 g | Chicken breast | Meat & Fish; 200 g | Bacon | Meat & Fish; 1 tin | Creamed corn | Pantry; 1 cup | Frozen corn | Frozen; 300 ml | Cream | Dairy & Eggs; 2 cloves | Garlic | Produce; 1 bag | Baby spinach | Produce; 500 g | Penne | Pantry; 1 cup | Grated cheese | Dairy & Eggs"],
  [/pasta\s*salad/, "500 g | Spiral pasta | Pantry; 1 | Red capsicum | Produce; 1 | Cucumber | Produce; 1 punnet | Cherry tomatoes | Produce; 1 | Red onion | Produce; 200 g | Ham | Meat & Fish; 1 cup | Frozen corn | Frozen; 0.5 cup | Mayonnaise | Pantry; 1 block | Feta | Dairy & Eggs"],
  [/chicken.*rice|rice.*cucumber/, "800 g | Chicken thighs | Meat & Fish; * 2 cups | Rice | Pantry; 2 | Cucumber | Produce; 1 bunch | Spring onion | Produce; 2 cloves | Garlic | Produce; * 3 tbsp | Soy sauce | Pantry; * 2 tbsp | Honey | Pantry; * 1 tbsp | Sesame oil | Pantry; * 1 tbsp | Rice vinegar | Pantry; * 1 tbsp | Sesame seeds | Pantry"],
  [/devil+ed/, "8 | Sausages | Meat & Fish; 1 | Onion | Produce; 1 | Apple | Produce; 1 tin | Chopped tomatoes | Pantry; * 2 tbsp | Worcestershire sauce | Pantry; * 2 tbsp | Brown sugar | Pantry; * 1 tbsp | Curry powder | Pantry; * 1 tbsp | Vinegar | Pantry; 1 cup | Beef stock | Pantry; 1.2 kg | Potatoes | Produce; 1 bag | Frozen peas | Frozen"],
  [/bangers|sausage/, "8 | Sausages | Meat & Fish; 1.2 kg | Potatoes | Produce; 2 | Onion | Produce; * 50 g | Butter | Dairy & Eggs; * 0.5 cup | Milk | Dairy & Eggs; 1 sachet | Gravy mix | Pantry; 1 bag | Frozen peas | Frozen"],
  [/meatball/, "500 g | Beef or pork mince | Meat & Fish; 1 | Egg | Dairy & Eggs; 0.5 cup | Breadcrumbs | Pantry; 1 | Onion | Produce; 3 cloves | Garlic | Produce; 1 | Red capsicum | Produce; 2 tins | Chopped tomatoes | Pantry; * 2 tsp | Smoked paprika | Pantry; * 1 tsp | Ground cumin | Pantry; 1 bunch | Parsley | Produce; 1 | Crusty bread | Bakery"],
  [/chicken\s*noodle/, "500 g | Chicken thighs | Meat & Fish; 1.5 L | Chicken stock | Pantry; 2 | Carrots | Produce; 2 sticks | Celery | Produce; 1 | Onion | Produce; 2 cloves | Garlic | Produce; 200 g | Egg noodles | Pantry; 1 bunch | Parsley | Produce"],
  [/pumpkin|kumara/, "1 kg | Pumpkin | Produce; 500 g | Kumara | Produce; 1 | Onion | Produce; 2 cloves | Garlic | Produce; 1 L | Vegetable stock | Pantry; 200 ml | Cream | Dairy & Eggs; * 1 tsp | Ground cumin | Pantry; 1 | Crusty bread | Bakery"],
  [/toastie/, "1 loaf | Bread | Bakery; 2 cups | Grated cheese | Dairy & Eggs; * 2 tbsp | Butter | Dairy & Eggs; 4 tins | Soup | Pantry; 100 g | Ham | Meat & Fish"],
  [/nacho/, "500 g | Beef mince | Meat & Fish; 1 | Onion | Produce; 1 tin | Kidney beans | Pantry; 1 sachet | Taco seasoning | Pantry; 1 tin | Chopped tomatoes | Pantry; 1 bag | Corn chips | Snacks & Drinks; 2 cups | Grated cheese | Dairy & Eggs; 1 tub | Sour cream | Dairy & Eggs; 1 jar | Salsa | Pantry; 1 | Avocado | Produce"],
  [/fajita/, "600 g | Chicken breast or beef strips | Meat & Fish; 2 | Capsicums | Produce; 1 | Red onion | Produce; 1 sachet | Fajita seasoning | Pantry; 1 pack | Tortillas | Bakery; 1 tub | Sour cream | Dairy & Eggs; 1 cup | Grated cheese | Dairy & Eggs; 1 | Avocado | Produce; 1 | Lime | Produce; 1 bag | Lettuce | Produce"],
  [/taco/, "500 g | Beef mince | Meat & Fish; 1 sachet | Taco seasoning | Pantry; 1 pack | Taco shells or tortillas | Pantry; 1 | Iceberg lettuce | Produce; 2 | Tomatoes | Produce; 1 | Avocado | Produce; 1 cup | Grated cheese | Dairy & Eggs; 1 tub | Sour cream | Dairy & Eggs; 1 jar | Salsa | Pantry"],
  [/pesto.*salmon|salmon/, "4 | Salmon fillets | Meat & Fish; 3 tbsp | Basil pesto | Pantry; 200 ml | Cream | Dairy & Eggs; 2 cloves | Garlic | Produce; 1 bag | Baby spinach | Produce; 1 punnet | Cherry tomatoes | Produce; 1.2 kg | Potatoes | Produce; * 50 g | Butter | Dairy & Eggs; * 0.5 cup | Milk | Dairy & Eggs; 1 | Lemon | Produce"],
  [/stir\s*fry/, "500 g | Chicken, beef or pork strips | Meat & Fish; 1 bag | Stir fry vegetables | Produce; 2 cloves | Garlic | Produce; 1 tbsp | Ginger | Produce; * 3 tbsp | Soy sauce | Pantry; 2 tbsp | Oyster sauce | Pantry; * 1 tbsp | Sesame oil | Pantry; 400 g | Hokkien noodles | Pantry; 1 bunch | Spring onion | Produce"],
  [/roast/, "1.8 kg | Whole chicken, lamb or pork roast | Meat & Fish; 1.5 kg | Potatoes | Produce; 500 g | Kumara | Produce; 500 g | Pumpkin | Produce; 3 | Carrots | Produce; 1 | Onion | Produce; 1 bag | Frozen peas | Frozen; 1 sachet | Gravy mix | Pantry; * 2 tbsp | Olive oil | Pantry; * 2 sprigs | Rosemary | Produce"],
  [/sandwich/, "1 loaf | Bread | Bakery; 200 g | Sliced ham or chicken | Meat & Fish; 1 | Lettuce | Produce; 2 | Tomatoes | Produce; 1 | Cucumber | Produce; 1 pack | Cheese slices | Dairy & Eggs; * 2 tbsp | Butter | Dairy & Eggs; * 2 tbsp | Mayonnaise | Pantry"],
  [/gnocchi/, "1 kg | Potato gnocchi | Pantry; 200 g | Bacon | Meat & Fish; 2 cloves | Garlic | Produce; 300 ml | Cream | Dairy & Eggs; 1 bag | Baby spinach | Produce; 1 punnet | Mushrooms | Produce; 1 wedge | Parmesan | Dairy & Eggs"],
  [/tortellini|ravioli/, "2 packs | Fresh tortellini | Dairy & Eggs; 1 jar | Tomato pasta sauce | Pantry; 2 cloves | Garlic | Produce; 1 bag | Baby spinach | Produce; 1 wedge | Parmesan | Dairy & Eggs; 1 bunch | Basil | Produce"],
  [/eggplant|aubergine/, "600 g | Chicken thighs | Meat & Fish; 2 | Eggplant | Produce; 1 | Onion | Produce; 3 cloves | Garlic | Produce; 1 tin | Chopped tomatoes | Pantry; 1 cup | Grated mozzarella | Dairy & Eggs; 1 wedge | Parmesan | Dairy & Eggs; 1 bunch | Basil | Produce; * 2 tbsp | Olive oil | Pantry"],
  [/garbanzo|garabanzo|chickpea/, "2 tins | Chickpeas | Pantry; 1 | Onion | Produce; 3 cloves | Garlic | Produce; 1 tbsp | Ginger | Produce; 1 tin | Chopped tomatoes | Pantry; 1 tin | Coconut milk | Pantry; 1 bag | Baby spinach | Produce; * 2 tsp | Garam masala | Pantry; * 1 tsp | Ground cumin | Pantry; * 2 cups | Rice | Pantry"],
  [/risott|regretto/, "1.5 cups | Arborio rice | Pantry; 1.2 L | Chicken stock | Pantry; 1 | Onion | Produce; 2 cloves | Garlic | Produce; 1 punnet | Mushrooms | Produce; 300 g | Chicken breast | Meat & Fish; 0.5 cup | White wine | Snacks & Drinks; 1 wedge | Parmesan | Dairy & Eggs; * 2 tbsp | Butter | Dairy & Eggs; 1 bag | Frozen peas | Frozen"],
  [/marry\s*me/, "4 | Chicken breasts | Meat & Fish; 3 cloves | Garlic | Produce; 0.5 cup | Sun-dried tomatoes | Pantry; 300 ml | Cream | Dairy & Eggs; 1 cup | Chicken stock | Pantry; 0.5 cup | Grated Parmesan | Dairy & Eggs; 1 bag | Baby spinach | Produce; * 1 tsp | Dried Italian herbs | Pantry; 500 g | Pasta or rice | Pantry"],
  [/lasagne|lasagna/, "1 kg | Beef mince | Meat & Fish; 1 | Onion | Produce; 2 cloves | Garlic | Produce; 2 tins | Chopped tomatoes | Pantry; 1 pack | Lasagne sheets | Pantry; 600 ml | Milk | Dairy & Eggs; 2 cups | Grated cheese | Dairy & Eggs; * 50 g | Butter | Dairy & Eggs; * 0.25 cup | Flour | Pantry"],
  [/pizza/, "2 | Pizza bases | Bakery; 0.5 cup | Pizza sauce | Pantry; 2 cups | Grated mozzarella | Dairy & Eggs; 150 g | Ham or pepperoni | Meat & Fish; 1 | Capsicum | Produce; 1 punnet | Mushrooms | Produce"],
  [/burger/, "500 g | Beef mince | Meat & Fish; 4 | Burger buns | Bakery; 1 pack | Cheese slices | Dairy & Eggs; 1 | Lettuce | Produce; 2 | Tomatoes | Produce; 1 | Red onion | Produce; * 2 tbsp | Tomato sauce | Pantry"],
  [/pie/, "2 sheets | Puff pastry | Frozen; 500 g | Beef mince | Meat & Fish; 1 | Onion | Produce; 1 sachet | Gravy mix | Pantry; 1 bag | Frozen mixed veg | Frozen; 1 | Egg | Dairy & Eggs"],
  [/soup/, "1 L | Stock | Pantry; 1 | Onion | Produce; 2 | Carrots | Produce; 2 sticks | Celery | Produce; 2 cloves | Garlic | Produce; 1 tin | Chopped tomatoes | Pantry; 1 | Crusty bread | Bakery"],
  [/noodle|pad\s*thai|ramen/, "400 g | Noodles | Pantry; 400 g | Chicken or pork | Meat & Fish; 1 bag | Stir fry vegetables | Produce; 2 cloves | Garlic | Produce; * 3 tbsp | Soy sauce | Pantry; 1 bunch | Spring onion | Produce; 1 | Lime | Produce"],
  [/pasta|penne|fettuccine|macaroni/, "500 g | Pasta | Pantry; 1 jar | Pasta sauce | Pantry; 2 cloves | Garlic | Produce; 1 | Onion | Produce; 1 bag | Baby spinach | Produce; 1 wedge | Parmesan | Dairy & Eggs"],
  [/salad/, "1 bag | Salad leaves | Produce; 1 | Cucumber | Produce; 1 punnet | Cherry tomatoes | Produce; 1 | Avocado | Produce; 1 block | Feta | Dairy & Eggs; * 2 tbsp | Olive oil | Pantry"],
];
function suggestFor(name) {
  const n = String(name || "").toLowerCase().replace(/&/g, " and ");
  if (!n.trim()) return null;
  const hit = SUGGEST.find(([re]) => re.test(n)); if (!hit) return null;
  return hit[1].split(";").map((l) => {
    l = l.trim(); let staple = false;
    if (l.startsWith("*")) { staple = true; l = l.slice(1).trim(); }
    const [qty, nm, aisle] = l.split("|").map((x) => x.trim());
    return { qty, name: nm, aisle: aisle || guessAisle(nm), staple };
  });
}

const PLACEHOLDER_MEALS = [
  { name: "Spaghetti Bolognese", emoji: "🍝", tags: ["Pasta", "Family"], serves: "4", mins: "40", ingredients: [
    ["500 g", "Beef mince", "Meat & Fish"], ["1", "Brown onion", "Produce"], ["2 cloves", "Garlic", "Produce"], ["1", "Carrot", "Produce"],
    ["700 g", "Passata", "Pantry"], ["500 g", "Spaghetti", "Pantry"], ["50 g", "Parmesan", "Dairy & Eggs"], ["*2 tbsp", "Olive oil", "Pantry"], ["*1 tsp", "Dried oregano", "Pantry"]],
    notes: "Placeholder meal. Simmer the sauce for at least 20 minutes." },
  { name: "Butter Chicken", emoji: "🍛", tags: ["Curry", "Family"], serves: "4", mins: "45", ingredients: [
    ["800 g", "Chicken thighs", "Meat & Fish"], ["1 jar", "Butter chicken sauce", "Pantry"], ["300 ml", "Cream", "Dairy & Eggs"],
    ["2 cups", "Basmati rice", "Pantry"], ["4", "Naan bread", "Bakery"], ["1 bunch", "Coriander", "Produce"]], notes: "Placeholder meal." },
  { name: "Beef Tacos", emoji: "🌮", tags: ["Mexican", "Quick"], serves: "4", mins: "25", ingredients: [
    ["500 g", "Beef mince", "Meat & Fish"], ["1", "Taco kit", "Pantry"], ["1", "Iceberg lettuce", "Produce"], ["2", "Tomato", "Produce"],
    ["1", "Avocado", "Produce"], ["200 g", "Grated cheese", "Dairy & Eggs"], ["250 g", "Sour cream", "Dairy & Eggs"]], notes: "Placeholder meal." },
  { name: "Roast Chicken & Veg", emoji: "🍗", tags: ["Roast", "Sunday"], serves: "5", mins: "90", ingredients: [
    ["1.6 kg", "Whole chicken", "Meat & Fish"], ["1 kg", "Potatoes", "Produce"], ["500 g", "Pumpkin", "Produce"], ["2", "Kumara", "Produce"],
    ["1 bag", "Frozen peas", "Frozen"], ["*1 tbsp", "Gravy granules", "Pantry"]], notes: "Placeholder meal." },
  { name: "Homemade Pizza", emoji: "🍕", tags: ["Family", "Fun"], serves: "4", mins: "35", ingredients: [
    ["2", "Pizza bases", "Bakery"], ["1 jar", "Pizza sauce", "Pantry"], ["300 g", "Mozzarella", "Dairy & Eggs"], ["150 g", "Pepperoni", "Meat & Fish"],
    ["1", "Capsicum", "Produce"], ["100 g", "Mushrooms", "Produce"]], notes: "Placeholder meal." },
  { name: "Salmon Poke Bowls", emoji: "🍣", tags: ["Healthy", "Quick"], serves: "2", mins: "20", ingredients: [
    ["300 g", "Salmon fillet", "Meat & Fish"], ["1 cup", "Sushi rice", "Pantry"], ["1", "Cucumber", "Produce"], ["1", "Avocado", "Produce"],
    ["1 bag", "Edamame", "Frozen"], ["*2 tbsp", "Soy sauce", "Pantry"]], notes: "Placeholder meal." },
  { name: "Chicken Stir-fry", emoji: "🥡", tags: ["Asian", "Quick"], serves: "4", mins: "20", ingredients: [
    ["500 g", "Chicken breast", "Meat & Fish"], ["1 pack", "Stir-fry vegetables", "Produce"], ["2 packs", "Hokkien noodles", "Pantry"],
    ["1 knob", "Ginger", "Produce"], ["*3 tbsp", "Oyster sauce", "Pantry"]], notes: "Placeholder meal." },
  { name: "Shepherd's Pie", emoji: "🥧", tags: ["Comfort"], serves: "6", mins: "70", ingredients: [
    ["500 g", "Lamb mince", "Meat & Fish"], ["1 kg", "Potatoes", "Produce"], ["1", "Brown onion", "Produce"], ["2", "Carrot", "Produce"],
    ["1 bag", "Frozen peas", "Frozen"], ["50 g", "Butter", "Dairy & Eggs"], ["*1 tbsp", "Worcestershire sauce", "Pantry"]], notes: "Placeholder meal." },
  { name: "Fish & Chips Friday", emoji: "🐟", tags: ["Treat"], serves: "4", mins: "30", ingredients: [
    ["600 g", "Tarakihi fillets", "Meat & Fish"], ["1 kg", "Frozen chips", "Frozen"], ["2", "Lemon", "Produce"], ["1 bag", "Coleslaw mix", "Produce"],
    ["*1 jar", "Tartare sauce", "Pantry"]], notes: "Placeholder meal." },
  { name: "Smash Burgers", emoji: "🍔", tags: ["BBQ", "Family"], serves: "4", mins: "25", ingredients: [
    ["500 g", "Beef mince", "Meat & Fish"], ["4", "Burger buns", "Bakery"], ["8", "Cheese slices", "Dairy & Eggs"], ["1", "Tomato", "Produce"],
    ["1", "Iceberg lettuce", "Produce"], ["1", "Red onion", "Produce"], ["*1 bottle", "Tomato sauce", "Pantry"]], notes: "Placeholder meal." },
  { name: "Pumpkin Soup", emoji: "🎃", tags: ["Vegetarian", "Comfort"], serves: "6", mins: "50", ingredients: [
    ["1.5 kg", "Pumpkin", "Produce"], ["1", "Brown onion", "Produce"], ["1 L", "Vegetable stock", "Pantry"], ["200 ml", "Cream", "Dairy & Eggs"],
    ["1 loaf", "Crusty bread", "Bakery"]], notes: "Placeholder meal." },
  { name: "Pancake Sunday", emoji: "🥞", tags: ["Breakfast", "Fun"], serves: "4", mins: "25", ingredients: [
    ["2 cups", "Flour", "Pantry"], ["2", "Eggs", "Dairy & Eggs"], ["500 ml", "Milk", "Dairy & Eggs"], ["1 punnet", "Blueberries", "Produce"],
    ["*1 bottle", "Maple syrup", "Pantry"]], notes: "Placeholder meal." },
];
function placeholderMeal(p) {
  return {
    name: p.name, emoji: p.emoji, img: "", tags: p.tags, serves: p.serves, mins: p.mins, plan: [], cooked: "", notes: p.notes || "",
    ingredients: p.ingredients.map(([q, n, a]) => ({ qty: q.replace(/^\*/, ""), name: n, aisle: a, staple: q.startsWith("*") })),
  };
}

function ago(d, t) {
  if (!d) return "Not had yet";
  const n = daysBetween(d, t);
  if (n <= 0) return "Had today";
  if (n === 1) return "Had yesterday";
  if (n < 14) return "Had " + n + " days ago";
  if (n < 60) return "Had " + Math.round(n / 7) + " weeks ago";
  return "Had " + Math.round(n / 30) + " months ago";
}

