const SL_STYLE = BASE + `
.wbr { padding:10px 0; border-bottom:1px solid var(--divider-color); }
.wbr.skip { opacity:.55; }
.wbt { font-size:14.5px; }
.wbm { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:6px; font-size:13.5px; }
.wbp { flex:1 1 200px; cursor:pointer; text-decoration:underline dotted; text-underline-offset:3px; }
.wbs { font-size:12px; font-weight:700; margin-left:6px; }
.wbs.ok { color:#43a047; } .wbs.bad { color:var(--error-color, #d64541); }
.svs { display:flex; align-items:center; gap:6px; font-size:13px; }
.svs button { width:34px; height:34px; border-radius:50%; border:1px solid var(--divider-color); background:var(--secondary-background-color); color:var(--primary-text-color); font-size:18px; font-weight:700; cursor:pointer; line-height:1; padding:0; }
.svs b { text-align:center; font-size:15px; }
.svs.wq { margin-top:0; }
.svs.wq b { min-width:44px; }
.wbk { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--secondary-text-color); }
.wbl { display:flex; flex-direction:column; gap:6px; }
.wbo { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--divider-color); border-radius:12px; cursor:pointer; font-size:14px; }
.wbo > div:first-child { flex:1; min-width:0; }
.wbo.on { border-color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 12%, transparent); }
.wbpr { font-weight:700; white-space:nowrap; }
.wbpr .sp2 { color:#e53935; }
.top { display:flex; align-items:flex-end; gap:12px; margin-bottom:12px; }
.top .big { font-size:40px; font-weight:800; line-height:1; letter-spacing:-1px; }
.top .lbl { font-size:13px; color:var(--secondary-text-color); line-height:1.35; }
.top .sp { flex:1; }
.bar { height:6px; border-radius:3px; background:color-mix(in srgb, var(--primary-text-color) 8%, transparent); overflow:hidden; margin-bottom:14px; }
.bar i { display:block; height:100%; background:#43a047; border-radius:3px; transition:width .4s ease; }
.qa { display:flex; gap:8px; margin-bottom:8px; }
.qa input.i { flex:1; height:46px; border-radius:999px; padding-left:18px; font-size:16px; }
.qa .btn { height:46px; width:46px; padding:0; justify-content:center; font-size:22px; }
.qk .chip { cursor:pointer; height:32px; border:1px solid var(--divider-color); background:none; color:var(--primary-text-color); font-weight:600; }
.qk .chip.got { opacity:.45; }
.qk .chip.ed { border-style:dashed; color:var(--secondary-text-color); }
.stl { border:1px solid var(--divider-color); border-radius:14px; overflow:hidden; }
.str { display:flex; align-items:center; gap:10px; padding:0 6px 0 14px; min-height:48px; border-top:1px solid var(--divider-color); font-size:15px; font-weight:600; }
.str:first-child { border-top:none; }
.str .nm { flex:1; min-width:0; }
.str .rm { width:38px; height:38px; border:none; background:none; cursor:pointer; font-size:18px; color:var(--secondary-text-color); border-radius:50%; }
.str .rm:hover { color:var(--error-color, #d64541); }
.sta { display:flex; gap:8px; margin-top:12px; }
.sta input.i { flex:1; }
.top .btn + .btn { margin-left:6px; }
.xs .top .bt { display:none; }
textarea.snd { min-height:260px; font-size:14px; line-height:1.5; font-family:inherit; }
.grp { margin-bottom:12px; border-radius:14px; border:1px solid var(--divider-color); overflow:hidden; }
.gh { display:flex; align-items:center; gap:8px; padding:8px 12px; font-size:13px; font-weight:750; letter-spacing:.3px;
  background:color-mix(in srgb, var(--gc) 13%, transparent); border-bottom:1px solid color-mix(in srgb, var(--gc) 25%, transparent); }
.gh .gi { font-size:17px; }
.gh .gn { flex:1; }
.gh .gc { font-weight:600; color:var(--secondary-text-color); }
.it { display:flex; align-items:center; gap:12px; padding:0 8px 0 10px; min-height:54px; border-top:1px solid var(--divider-color); -webkit-tap-highlight-color:transparent; }
.it:first-of-type { border-top:none; }
.gh + .it { border-top:none; }
.ck { flex:none; width:32px; height:32px; border-radius:50%; border:2px solid color-mix(in srgb, var(--gc, #888) 70%, var(--divider-color)); background:none; cursor:pointer;
  display:grid; place-items:center; color:#fff; font-size:16px; font-weight:800; transition:all .15s; }
.ck.on { background:#43a047; border-color:#43a047; }
.it .tx { flex:1; min-width:0; cursor:pointer; padding:7px 0; }
.it .nm { font-size:16px; font-weight:600; line-height:1.25; }
.it .sb { display:flex; gap:4px; flex-wrap:wrap; margin-top:3px; }
.it .sb .chip { height:21px; padding:0 7px; font-size:11.5px; }
.it .qt { flex:none; font-size:14px; font-weight:700; padding:4px 10px; border-radius:999px; background:color-mix(in srgb, var(--gc, #888) 16%, transparent); max-width:42%; text-align:right; }
.it.done .nm { text-decoration:line-through; color:var(--secondary-text-color); }
.it.done .qt, .it.done .sb { opacity:.5; }
.trolley .gh { --gc:#43a047; }
.it .hv { flex:none; width:34px; height:34px; border-radius:50%; border:none; background:none; cursor:pointer; font-size:15px; color:var(--secondary-text-color); margin-left:-6px; }
.it .hv:hover { color:var(--error-color, #d64541); background:color-mix(in srgb, var(--error-color, #d64541) 10%, transparent); }
.empty { text-align:center; padding:26px 10px; color:var(--secondary-text-color); }
.empty .e { font-size:44px; }
.cols { columns:2 300px; column-gap:12px; }
.cols .grp { break-inside:avoid; display:inline-block; width:100%; }
.narrow .cols { columns:1; }
.ais { display:flex; flex-wrap:wrap; gap:6px; }
.ais .chip { cursor:pointer; height:34px; padding:0 12px; font-size:13px; border:1.5px solid transparent; }
.ais .chip.on { border-color:var(--ac); background:color-mix(in srgb, var(--ac) 20%, transparent); color:var(--primary-text-color); }
.fromm { font-size:13px; margin-top:8px; line-height:1.6; }
.pantry .phint { font-size:12.5px; padding:8px 12px 2px; }
.pantry .it .btn { flex:none; }
.shp { display:flex; align-items:center; gap:8px; margin:-2px 0 10px; font-size:14.5px; }
.shp .t { flex:1; min-width:0; }
.nts { display:flex; align-items:center; gap:6px; overflow-x:auto; scrollbar-width:none; margin:0 0 14px; }
.nts .chip.got { opacity:.55; }
.tg { display:flex; gap:6px; flex-wrap:wrap; }
.tg .chip { cursor:pointer; height:34px; border:1.5px solid transparent; }
.tg .chip.on { border-color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 18%, transparent); color:var(--primary-text-color); }
.it .sb .chip.tu { border:1px dashed var(--primary-color); }
.nts::-webkit-scrollbar { display:none; }
.nts .nl { flex:none; font-size:12.5px; font-weight:700; color:var(--secondary-text-color); }
.nts .chip { flex:none; cursor:pointer; height:32px; border:1.5px solid transparent; }
.nts .chip.on { border-color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 18%, transparent); }
.nts .chip.past { border:1.5px dashed #e0a030; background:color-mix(in srgb, #e0a030 14%, transparent); }
.nts .chip.past.on { border-style:solid; }
.nts .chip.miss:not(.on) { border:1.5px dashed var(--primary-color); }
.nts .chip .mi { color:var(--primary-color); margin-left:2px; }
.nf { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 12px; margin-bottom:12px; border-radius:12px; font-size:13.5px; line-height:1.4;
  background:color-mix(in srgb, var(--primary-color) 10%, transparent); }
.nf.past { background:color-mix(in srgb, #e0a030 16%, transparent); }
.nf .t { flex:1; min-width:180px; }
.nh { font-size:12px; margin:-10px 0 12px; }
.it .sb .chip.off { opacity:.4; }
.qkw { margin-bottom:14px; }
/* the nights row fades at the end that has more */
.nts.e-r { -webkit-mask-image:linear-gradient(to right, #000 calc(100% - 56px), transparent); mask-image:linear-gradient(to right, #000 calc(100% - 56px), transparent); }
.nts.e-l { -webkit-mask-image:linear-gradient(to right, transparent, #000 32px); mask-image:linear-gradient(to right, transparent, #000 32px); }
.nts.e-l.e-r { -webkit-mask-image:linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 56px), transparent); mask-image:linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 56px), transparent); }
`;
const PANTRY_KEY = "meal-planner-pantry-have";

