// =====================================================================
// woolies-trolley-card: what's in the Woolworths trolley right now
// =====================================================================
// Shows the copy of the trolley the Woolies Bridge add-on keeps on sensor.woolies_bridge (attribute "cart"),
// so it paints instantly. Refresh reads the live trolley; − / + / ✕ change it. Every live request runs the add-on's
// headless browser (about 10-15 s), so quantity taps are gathered for a moment and sent together.

const TC_STYLE = BASE + `
.hd { flex-wrap:wrap; row-gap:6px; }
.hd a.btn { text-decoration:none; color:inherit; }
ha-card.narrow .bt { display:none; }
.meta { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin:-4px 0 12px; }
.chip.ok { background:color-mix(in srgb, #43a047 16%, transparent); color:#2e7d32; }
.chip.no { background:color-mix(in srgb, var(--warning-color, #f4b400) 18%, transparent); color:var(--primary-text-color); }
.busy { display:flex; align-items:center; gap:8px; font-size:13px; margin:0 0 10px; color:var(--secondary-text-color); }
.busy i { width:14px; height:14px; border-radius:50%; border:2px solid var(--divider-color); border-top-color:var(--primary-color); animation:tcspin .8s linear infinite; }
@keyframes tcspin { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .busy i { animation:none; } }
.ln { display:grid; grid-template-columns:minmax(0,1fr) auto auto 36px; align-items:center; gap:10px; padding:8px 0; border-top:1px solid var(--divider-color); }
.ln:first-child { border-top:none; }
.ln.pend { opacity:.55; }
.ln .nm { min-width:0; }
.ln .nm b { display:block; font-weight:600; font-size:14.5px; line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.ln .nm span { font-size:12px; }
.ln .pr { text-align:right; font-variant-numeric:tabular-nums; font-weight:600; font-size:14px; white-space:nowrap; }
.ln .pr small { display:block; font-weight:600; font-size:11.5px; color:#2e7d32; }
.st { display:flex; align-items:center; gap:2px; border:1px solid var(--divider-color); border-radius:999px; height:34px; }
.st button { width:34px; height:32px; border:none; background:none; cursor:pointer; font-size:18px; border-radius:999px; -webkit-tap-highlight-color:transparent; }
.st button:hover { background:color-mix(in srgb, var(--primary-text-color) 6%, transparent); }
.st b { min-width:36px; text-align:center; font-variant-numeric:tabular-nums; font-size:14px; }
.rm { width:34px; height:34px; border-radius:50%; border:none; background:none; cursor:pointer; color:var(--secondary-text-color); font-size:16px; }
.rm:hover { color:var(--error-color, #d64541); background:color-mix(in srgb, var(--error-color, #d64541) 10%, transparent); }
.tot { display:flex; justify-content:space-between; gap:10px; padding:10px 0 0; margin-top:4px; border-top:2px solid var(--divider-color); font-weight:700; }
.tot span { font-variant-numeric:tabular-nums; }
.fee { display:flex; justify-content:space-between; font-size:13px; color:var(--secondary-text-color); padding-top:6px; }
.empty { text-align:center; padding:18px 0 8px; color:var(--secondary-text-color); }
.empty .e { font-size:40px; }
.pinr { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:0 0 12px; }
.pinr .i { width:120px; font-size:20px; letter-spacing:6px; text-align:center; }
ha-card.xs .ln { grid-template-columns:minmax(0,1fr) auto 32px; }
ha-card.xs .ln .pr { grid-column:1; grid-row:2; text-align:left; }
ha-card.xs .ln .st { grid-column:2; grid-row:1 / span 2; }
ha-card.xs .ln .rm { grid-column:3; grid-row:1 / span 2; }
`;

const money = (c) => (c == null || isNaN(c) ? "" : "$" + (Number(c) / 100).toFixed(2));

class WooliesTrolleyCard extends MPBase {
  setConfig(config) {
    this._cfg = Object.assign({ title: "Woolworths trolley", entity: "sensor.woolies_bridge" }, config || {});
    this._pend = {}; this._busy = false;
  }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  _start() {
    this._started = true; this._feeds = [];
    this._build();
    clearInterval(this._timer); this._timer = setInterval(() => this._paint(), 60000);
  }
  set hass(h) {
    super.hass = h;
    const st = h.states[this._cfg.entity], key = st ? st.state + "|" + JSON.stringify(st.attributes.cart || null) : "none";
    if (key !== this._key) { this._key = key; this._paint(); }
  }
  _build() {
    if (this._built) return;
    this._built = true;
    this.shadowRoot.innerHTML = `<style>${TC_STYLE}</style><ha-card><div id="c"></div></ha-card>`;
    const card = this.shadowRoot.querySelector("ha-card");
    card.addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (b) this._act(b.dataset.a, b); });
    card.addEventListener("keydown", (e) => { if (e.target.id === "tcpin" && e.key === "Enter") this._act("unlock"); });
    this._paint();
  }
  _cart() { const st = this._hass && this._hass.states[this._cfg.entity]; return st ? (st.attributes.cart || {}) : null; }
  _ago(iso) {
    const t = Date.parse(iso || ""); if (!t) return "";
    const m = Math.round((Date.now() - t) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
  }
  _paint() {
    if (!this._built || !this._hass) return;
    const el = this.shadowRoot.getElementById("c"), c = this._cart();
    if (c === null) { el.innerHTML = `<div class="warn">The Woolies Bridge add-on isn't running, so the trolley can't be shown.</div>`; return; }
    const lines = (c.lines || []).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const known = !!c.at, locked = this._wbLocked();
    const fees = (c.fees || []).filter((f) => f.cents);
    const fmtQ = (l, q) => l.kg ? `${Number(q).toFixed(1).replace(/\.0$/, "")} kg` : String(q);
    const row = (l) => {
      const p = this._pend[l.variant], q = p != null ? p : l.qty;
      if (p === 0) return "";
      return `<div class="ln${p != null ? " pend" : ""}"><div class="nm"><b>${esc(l.name)}</b>${l.brand ? `<span class="mut">${esc(l.brand)}</span>` : ""}</div>
        <div class="pr">${p != null ? "…" : money(l.cents)}${l.saved && p == null ? `<small>saved ${money(l.saved)}</small>` : ""}</div>
        <div class="st"><button data-a="dec" data-v="${esc(l.variant)}" aria-label="One less ${esc(l.name)}">−</button><b>${fmtQ(l, q)}</b><button data-a="inc" data-v="${esc(l.variant)}" aria-label="One more ${esc(l.name)}">＋</button></div>
        <button class="rm" data-a="rm" data-v="${esc(l.variant)}" aria-label="Remove ${esc(l.name)}">✕</button></div>`;
    };
    const shown = lines.filter((l) => this._pend[l.variant] !== 0);
    el.innerHTML = `<div class="hd"><span class="t">🛒 ${esc(this._cfg.title)}</span>
        <span class="s">${known ? `${shown.length} item${shown.length === 1 ? "" : "s"}${c.total_cents != null ? " · " + money(c.total_cents) : ""}` : ""}</span><span class="sp"></span>
        <button class="btn sm" data-a="refresh" ${this._busy ? "disabled" : ""} aria-label="Refresh the trolley">↻<span class="bt"> Refresh</span></button>
        <a class="btn sm" href="https://www.woolworths.co.nz/cart" target="_blank" rel="noopener" aria-label="Open the trolley in Woolworths">↗<span class="bt"> Woolworths</span></a></div>
      ${known ? `<div class="meta">${c.has_slot ? `<span class="chip ok">🚚 ${esc(c.slot || "Delivery slot booked")}</span>` : `<span class="chip no">No delivery slot booked yet</span>`}
        <span class="mut" style="font-size:12.5px">Updated ${this._ago(c.at)}</span></div>` : ""}
      ${(c.issues || []).map((i) => `<div class="warn">${esc(i)}</div>`).join("")}
      ${this._busy ? `<div class="busy"><i></i>Talking to Woolworths… about 15 seconds</div>` : ""}
      ${locked && this._needPin ? `<div class="pinr"><span class="mut">Enter your household PIN to change the trolley.</span>
        <input class="i" id="tcpin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="PIN"><button class="btn pri" data-a="unlock">Unlock</button></div>` : ""}
      ${!known ? `<div class="empty"><div class="e">🛒</div><p>Not read yet. Tap Refresh to load the trolley.</p></div>`
        : !lines.length ? `<div class="empty"><div class="e">🛒</div><p>The trolley is empty. Fill it from the shopping list's 🛒 Trolley button.</p></div>`
        : `<div class="lns">${lines.map(row).join("")}</div>
          ${fees.map((f) => `<div class="fee"><span>${f.type === "bagFee" ? "Bags" : esc(f.type)}</span><span>${money(f.cents)}</span></div>`).join("")}
          ${c.total_cents != null ? `<div class="tot"><span>Total</span><span>${money(c.total_cents)}</span></div>` : ""}`}`;
    this._resize();
    if (this._needPin && locked) { const i = el.querySelector("#tcpin"); if (i && !i.value) i.focus(); }
  }
  _line(v) { return ((this._cart() || {}).lines || []).find((l) => l.variant === v); }
  _act(a, b) {
    if (a === "refresh") return this._run(() => this._wb("cart", {}, 120000));
    if (a === "unlock") {
      const i = this.shadowRoot.getElementById("tcpin"), v = i ? i.value.trim() : "";
      if (!/^[0-9]{4}$/.test(v)) { this._toast("A PIN is four digits."); return; }
      WB.pin = v; this._needPin = false; this._paint();
      if (Object.keys(this._pend).length) this._flush(); return;
    }
    const l = b && this._line(b.dataset.v); if (!l) return;
    const step = l.kg ? 0.1 : 1, cur = this._pend[l.variant] != null ? this._pend[l.variant] : Number(l.qty) || 0;
    let q = a === "inc" ? cur + step : a === "dec" ? cur - step : 0;
    q = Math.max(0, Math.round(q * 10) / 10);
    this._pend[l.variant] = q; this._paint();
    clearTimeout(this._pt); this._pt = setTimeout(() => this._flush(), 1500);
  }
  _flush() {
    const changes = Object.entries(this._pend).map(([variant, qty]) => ({ variant, qty }));
    if (!changes.length) return;
    if (this._busy) { clearTimeout(this._pt); this._pt = setTimeout(() => this._flush(), 1500); return; }
    this._run(async () => {
      const r = await this._wb("cart_set", { changes }, 180000);
      const f = (r && r.failed) || [];
      if (f.length) this._toast(`${f.length} change${f.length === 1 ? "" : "s"} didn't go through: ${f[0].error}`);
      return r;
    }, () => { for (const ch of changes) if (this._pend[ch.variant] === ch.qty) delete this._pend[ch.variant]; });
  }
  async _run(fn, after) {
    if (this._wbLocked()) { this._needPin = true; this._paint(); return; }
    this._busy = true; this._paint();
    try { await fn(); }
    catch (e) { this._toast(e.message || String(e)); if (this._wbLocked()) this._needPin = true; }
    finally { this._busy = false; if (after) after(); this._paint(); }
  }
}
Object.assign(WooliesTrolleyCard.prototype, {
  _wb: ShoppingListCard.prototype._wb,
  _wbPinCall: ShoppingListCard.prototype._wbPinCall,
  _wbAdmin: ShoppingListCard.prototype._wbAdmin,
  _wbLocked: ShoppingListCard.prototype._wbLocked,
});
