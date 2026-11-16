// ---------- shared look ----------

function thumb(m, cls) {
  const h = hash(m.name) % 360;
  const bg = `background:radial-gradient(120% 90% at 20% 15%, hsla(${h},90%,80%,.55), transparent 60%),linear-gradient(135deg, hsl(${h} 62% 58%), hsl(${(h + 38) % 360} 66% 44%))`;
  const img = m.img ? `<img src="${esc(m.img)}" alt="" loading="lazy" onerror="this.remove()">` : "";
  return `<div class="th ${cls || ""}" style="${bg}"><span class="em">${esc(m.emoji || "🍽️")}</span>${img}</div>`;
}

const BASE = `
:host { display:block; min-width:0; }
* { box-sizing:border-box; }
ha-card { display:block; padding:16px; overflow:hidden; color:var(--primary-text-color); font-size:15px; }
button { font:inherit; color:inherit; }
.hd { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.hd .t { font-size:20px; font-weight:700; letter-spacing:-.2px; }
.hd .s { color:var(--secondary-text-color); font-size:13px; }
.hd .sp { flex:1; }
.btn { border:1px solid var(--divider-color); background:none; border-radius:999px; padding:0 14px; height:38px; cursor:pointer; font-size:14px; font-weight:600;
  display:inline-flex; align-items:center; gap:6px; white-space:nowrap; -webkit-tap-highlight-color:transparent; }
.btn:hover { background:color-mix(in srgb, var(--primary-text-color) 6%, transparent); }
.btn.pri { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color, #fff); }
.btn.del { color:var(--error-color, #d64541); border-color:color-mix(in srgb, var(--error-color, #d64541) 45%, transparent); }
.btn.sm { height:32px; padding:0 11px; font-size:13px; }
.ico { width:38px; padding:0; justify-content:center; font-size:18px; }
.th { position:relative; overflow:hidden; display:grid; place-items:center; }
.th .em { font-size:44px; line-height:1; filter:drop-shadow(0 3px 5px rgba(0,0,0,.25)); }
.th img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.th::after { content:""; position:absolute; inset:0; background:radial-gradient(circle at 50% 120%, rgba(0,0,0,.18), transparent 60%); pointer-events:none; }
.chip { display:inline-flex; align-items:center; gap:4px; height:26px; padding:0 10px; border-radius:999px; font-size:12.5px; font-weight:600;
  background:color-mix(in srgb, var(--primary-text-color) 7%, transparent); color:var(--secondary-text-color); white-space:nowrap; }
.mut { color:var(--secondary-text-color); }
/* Rows that scroll sideways: the end with more to see fades out and gets a round arrow button. */
.srw { position:relative; min-width:0; }
.sr { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; scroll-behavior:smooth; }
.sr::-webkit-scrollbar { display:none; }
.sr.e-r { -webkit-mask-image:linear-gradient(to right, #000 calc(100% - 64px), transparent calc(100% - 8px)); mask-image:linear-gradient(to right, #000 calc(100% - 64px), transparent calc(100% - 8px)); }
.sr.e-l { -webkit-mask-image:linear-gradient(to right, transparent 8px, #000 56px); mask-image:linear-gradient(to right, transparent 8px, #000 56px); }
.sr.e-l.e-r { -webkit-mask-image:linear-gradient(to right, transparent 8px, #000 56px, #000 calc(100% - 64px), transparent calc(100% - 8px)); mask-image:linear-gradient(to right, transparent 8px, #000 56px, #000 calc(100% - 64px), transparent calc(100% - 8px)); }
.srb { position:absolute; top:50%; width:32px; height:32px; margin-top:-16px; border-radius:50%; border:none; padding:0; cursor:pointer; z-index:2;
  background:var(--primary-color); color:var(--text-primary-color, #fff); font-size:20px; font-weight:700; line-height:1; display:grid; place-items:center;
  box-shadow:0 2px 6px rgba(0,0,0,.28); opacity:0; pointer-events:none; transition:opacity .2s; -webkit-tap-highlight-color:transparent; }
.srb.l { left:0; } .srb.r { right:0; }
.srw.l .srb.l, .srw.r .srb.r { opacity:1; pointer-events:auto; }
.srw.hint .srb.r { animation:srnudge 1s ease-in-out 2; }
@keyframes srnudge { 0%, 100% { transform:translateX(0); } 50% { transform:translateX(5px); } }
@media (prefers-reduced-motion: reduce) { .srw.hint .srb.r { animation:none; } .sr { scroll-behavior:auto; } }
.noi { color:var(--warning-color, #c98a00) !important; font-weight:700; }
.warn { padding:10px 12px; border-radius:10px; font-size:13px; margin-bottom:12px;
  background:color-mix(in srgb, var(--warning-color, #f4b400) 16%, transparent); border:1px solid color-mix(in srgb, var(--warning-color, #f4b400) 45%, transparent); }
.toast { position:fixed; left:50%; bottom:28px; transform:translate(-50%, 20px); opacity:0; transition:all .25s; z-index:10001; pointer-events:none;
  background:var(--primary-text-color); color:var(--card-background-color, #fff); padding:10px 18px; border-radius:999px; font-weight:600; font-size:14px; box-shadow:0 6px 20px rgba(0,0,0,.25); }
.toast.on { opacity:1; transform:translate(-50%, 0); }

/* sheets */
.ov { position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding:24px;
  animation:mp-fade .15s ease; }
.sh { width:min(680px, 100%); max-height:min(88vh, 900px); overflow:auto; border-radius:20px; background:var(--card-background-color, #fff);
  color:var(--primary-text-color); box-shadow:0 20px 60px rgba(0,0,0,.35); animation:mp-up .2s ease; }
.sh.nudge { animation:mpnudge .32s ease; }
@keyframes mpnudge { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-8px); } 75% { transform:translateX(8px); } }
.draftn { display:flex; align-items:center; gap:8px; margin:0 0 10px; padding:8px 12px; border-radius:12px; background:rgba(255,138,101,.16); font-size:13px; }
.draftn .sp { flex:1; }
.draftn[hidden] { display:none; }
.draftn.sugg { background:rgba(255,213,79,.18); flex-wrap:wrap; }
.gmsg { position:sticky; bottom:64px; margin:0 16px 8px; padding:10px 14px; border-radius:12px; background:#ff8a65; color:#1a1a1a; font-size:14px; font-weight:600; text-align:center; }
.sh .pad { padding:18px 20px 20px; }
.sh h2 { margin:0; font-size:22px; letter-spacing:-.3px; }
.sh h3 { margin:18px 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:.6px; color:var(--secondary-text-color); }
.sh .foot { position:sticky; bottom:0; display:flex; gap:8px; flex-wrap:wrap; padding:12px 20px; background:var(--card-background-color, #fff);
  border-top:1px solid var(--divider-color); }
.sh .foot .sp { flex:1; }
.sh .x { position:absolute; top:12px; right:12px; z-index:2; background:rgba(0,0,0,.35); color:#fff; border:none; }
@media (max-width: 600px) {
  .ov { padding:0; align-items:flex-end; }
  .sh { border-radius:20px 20px 0 0; max-height:92vh; }
}
@keyframes mp-fade { from { opacity:0; } }
@keyframes mp-up { from { transform:translateY(24px); opacity:.4; } }
label.f { display:block; font-size:12px; font-weight:600; color:var(--secondary-text-color); margin:12px 0 4px; }
input.i, select.i, textarea.i { width:100%; height:42px; border-radius:10px; border:1px solid var(--divider-color); padding:0 12px; font:inherit; font-size:15px;
  background:color-mix(in srgb, var(--primary-text-color) 3%, var(--card-background-color, #fff)); color:var(--primary-text-color); outline:none; }
textarea.i { height:auto; min-height:84px; padding:10px 12px; resize:vertical; }
input.i:focus, select.i:focus, textarea.i:focus { border-color:var(--primary-color); box-shadow:0 0 0 2px color-mix(in srgb, var(--primary-color) 25%, transparent); }
`;

// Unsaved meal edits live in this browser (localStorage) until Save or Cancel, so they survive a stray tap or tab change.
const DRAFT_KEY = "meal-planner-drafts", DRAFT_DAYS = 14;
function draftAll() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") || {}; } catch (e) { return {}; } }
function draftSave(all) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(all)); } catch (e) { /* storage off: no drafts */ } }
function draftGet(k) { const d = draftAll()[k]; return d && Date.now() - d.t < DRAFT_DAYS * 864e5 ? d.m : null; }
function draftPut(k, m) { const all = draftAll(); all[k] = { t: Date.now(), m }; draftSave(all); }
function draftDel(k) { const all = draftAll(); if (k in all) { delete all[k]; draftSave(all); } }

class MPBase extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._aisles = DEFAULT_AISLES; }
  _aisle(name) { return this._aisles.find((a) => a.name === name) || this._aisles[this._aisles.length - 1]; }
  _toast(msg) {
    let t = this.shadowRoot.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; this.shadowRoot.appendChild(t); }
    t.textContent = msg; t.classList.add("on");
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove("on"), 2200);
  }
  _openSheet(html, onClick, onInput, opts = {}) {
    this._closeSheet();
    const ov = document.createElement("div"); ov.className = "ov";
    ov.innerHTML = `<div class="sh" role="dialog">${html}</div>`;
    // Editor sheets ("guard") ignore a tap outside once something has changed, so a stray tap can't throw work away.
    ov.addEventListener("click", (e) => {
      if (e.target === ov) {
        if (opts.guard && ov._dirty) {
          const sh = ov.querySelector(".sh"); sh.classList.remove("nudge"); void sh.offsetWidth; sh.classList.add("nudge");
          let g = sh.querySelector(".gmsg");
          if (!g) { g = document.createElement("div"); g.className = "gmsg"; g.textContent = opts.guardMsg || "You have unsaved changes. Tap Save to keep them, or Cancel to throw them away."; sh.insertBefore(g, sh.querySelector(".foot")); }
          clearTimeout(ov._gt); ov._gt = setTimeout(() => g.remove(), 4000);
          return;
        }
        this._closeSheet(); return;
      }
      const b = e.target.closest("[data-a]");
      if (b) { if (b.dataset.a !== "cancel" && b.dataset.a !== "close") ov._dirty = true; onClick(b.dataset.a, b, e); }
    });
    ov.addEventListener("input", () => { ov._dirty = true; });
    ov.addEventListener("change", () => { ov._dirty = true; });
    if (onInput) ov.addEventListener("input", onInput);
    this.shadowRoot.appendChild(ov); this._ov = ov;
    return ov;
  }
  _closeSheet() { if (this._ov) { this._ov.remove(); this._ov = null; this._sheet = null; } }
  // A sideways row of chips with ‹ › buttons; key names it so the first-time nudge plays once per row.
  _rowHtml(cls, inner, key, id) {
    return `<div class="srw" data-k="${key}"><div class="sr ${cls}"${id ? ` id="${id}"` : ""}>${inner}</div>
      <button class="srb l" data-a="srl" aria-label="Scroll left">‹</button><button class="srb r" data-a="srr" aria-label="Scroll right">›</button></div>`;
  }
  _rowScroll(b, dir) { const r = b.parentElement.querySelector(".sr"); if (r) r.scrollBy({ left: dir * Math.max(120, r.clientWidth * 0.7) }); }
  // Fades and arrows follow the scroll position; a mouse wheel scrolls the row sideways.
  _rows() {
    for (const r of this.shadowRoot.querySelectorAll(".sr")) {
      if (!r._wired) {
        r._wired = true;
        r.addEventListener("scroll", () => this._edges(r), { passive: true });
        r.addEventListener("wheel", (e) => {
          if (r.scrollWidth <= r.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          e.preventDefault(); r.scrollLeft += e.deltaY;
        }, { passive: false });
      }
      this._edges(r);
    }
  }
  _edges(el) {
    if (!el) return;
    const l = el.scrollLeft > 4, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    el.classList.toggle("e-l", l); el.classList.toggle("e-r", r);
    const w = el.parentElement;
    if (w && w.classList.contains("srw")) {
      w.classList.toggle("l", l); w.classList.toggle("r", r);
      this._hinted = this._hinted || {};
      if (r && !this._hinted[w.dataset.k]) { this._hinted[w.dataset.k] = true; w.classList.add("hint"); }
    }
  }
  _resize() {
    const w = this.offsetWidth || 0;
    const c = this.shadowRoot.querySelector("ha-card"); if (!c) return;
    c.classList.toggle("narrow", w > 0 && w < 640);
    c.classList.toggle("xs", w > 0 && w < 420);
  }
  connectedCallback() {
    if (!this._ro && window.ResizeObserver) { this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this); }
    if (this._hass && !this._started) this._start();
  }
  disconnectedCallback() {
    for (const f of this._feeds || []) f.stop();
    this._started = false;
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    clearInterval(this._timer); this._timer = null;
  }
  set hass(h) {
    this._hass = h;
    if (!this._started) this._start(); else for (const f of this._feeds || []) f.update(h);
  }
}

// =====================================================================
// meal-planner-card
// =====================================================================

