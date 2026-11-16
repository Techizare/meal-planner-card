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
button.chip { cursor:pointer; border:none; font:inherit; font-size:13px; font-weight:600; }
button.chip:hover { filter:brightness(.96); }
.sdays { display:flex; gap:6px; overflow-x:auto; padding:2px 0 10px; scrollbar-width:none; }
.sdays::-webkit-scrollbar { display:none; }
.sdays button { flex:none; height:36px; padding:0 14px; border-radius:999px; border:1.5px solid var(--divider-color, rgba(127,127,127,.35)); background:none; color:var(--primary-text-color, inherit); font:inherit; font-size:13.5px; font-weight:600; cursor:pointer; }
.sdays button.on { border-color:var(--primary-color, #03a9f4); background:color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent); }
.sdays button small { font-weight:500; color:var(--secondary-text-color, #777); margin-left:4px; }
.slots { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:8px; }
.slots button { min-height:58px; border-radius:14px; border:1.5px solid var(--divider-color, rgba(127,127,127,.35)); background:none; color:var(--primary-text-color, inherit); font:inherit; cursor:pointer; text-align:left; padding:8px 12px; }
.slots button b { display:block; font-size:15px; }
.slots button span { font-size:12.5px; color:var(--secondary-text-color, #777); }
.slots button.on { border-color:#43a047; background:color-mix(in srgb, #43a047 14%, transparent); }
.slots button:disabled { opacity:.45; cursor:default; }
.seg { display:inline-flex; margin-top:12px; padding:3px; border-radius:999px; background:color-mix(in srgb, var(--primary-text-color, #000) 7%, transparent); }
.seg button { height:36px; padding:0 16px; border:none; border-radius:999px; background:none; color:var(--primary-text-color, inherit); font:inherit; font-size:14px; font-weight:600; cursor:pointer; }
.seg button.on { background:var(--card-background-color, #fff); box-shadow:0 1px 3px rgba(0,0,0,.18); }
.stp { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:0 0 10px; font-size:14.5px; }
.slots.pk { grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); }
.stl { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:8px; }
.stl button { border-radius:14px; border:1.5px solid var(--divider-color, rgba(127,127,127,.35)); background:none; color:var(--primary-text-color, inherit); font:inherit; cursor:pointer; text-align:left; padding:10px 12px; }
.stl button b { display:block; font-size:15px; }
.stl button span { font-size:12.5px; color:var(--secondary-text-color, #777); }
.stl button.on { border-color:var(--primary-color, #03a9f4); background:color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent); }
.pinr { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:0 0 12px; }
.pinr .i { width:120px; font-size:20px; letter-spacing:6px; text-align:center; }
ha-card.xs .ln { grid-template-columns:minmax(0,1fr) auto 32px; }
ha-card.xs .ln .pr { grid-column:1; grid-row:2; text-align:left; }
ha-card.xs .ln .st { grid-column:2; grid-row:1 / span 2; }
ha-card.xs .ln .rm { grid-column:3; grid-row:1 / span 2; }
`;

const capFirst = (t) => { t = String(t || "").trim(); return t ? t[0].toUpperCase() + t.slice(1) : t; };
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
  // The wall panel is a kiosk: no link out to a full-screen browser tab there.
  // It is spotted by the onscreen keyboard switch or ?kiosk / ?keyboard in the
  // address; website_link: true or false in the card config overrides that.
  _panel() {
    if (this._cfg.website_link === true) return false;
    if (this._cfg.website_link === false) return true;
    let osk = false; try { osk = localStorage.getItem("osk-enabled") === "1"; } catch (e) {}
    return osk || /[?&](keyboard|kiosk)\b/.test(location.search);
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
      return `<div class="ln${p != null ? " pend" : ""}"><div class="nm"><b>${esc(capFirst(l.name))}</b>${l.brand ? `<span class="mut">${esc(l.brand)}</span>` : ""}</div>
        <div class="pr">${p != null ? "…" : money(l.cents)}${l.saved && p == null ? `<small>saved ${money(l.saved)}</small>` : ""}</div>
        <div class="st"><button data-a="dec" data-v="${esc(l.variant)}" aria-label="One less ${esc(l.name)}">−</button><b>${fmtQ(l, q)}</b><button data-a="inc" data-v="${esc(l.variant)}" aria-label="One more ${esc(l.name)}">＋</button></div>
        <button class="rm" data-a="rm" data-v="${esc(l.variant)}" aria-label="Remove ${esc(l.name)}">✕</button></div>`;
    };
    const shown = lines.filter((l) => this._pend[l.variant] !== 0);
    el.innerHTML = `<div class="hd"><span class="t">🛒 ${esc(this._cfg.title)}</span>
        <span class="s">${known ? `${shown.length} item${shown.length === 1 ? "" : "s"}${c.total_cents != null ? " · " + money(c.total_cents) : ""}` : ""}</span><span class="sp"></span>
        <button class="btn sm" data-a="refresh" ${this._busy ? "disabled" : ""} aria-label="Refresh the trolley">↻<span class="bt"> Refresh</span></button>
        ${this._panel() ? "" : `<a class="btn sm" href="https://www.woolworths.co.nz/cart" target="_blank" rel="noopener" aria-label="Open the trolley in Woolworths">↗<span class="bt"> Woolworths</span></a>`}</div>
      ${known ? `<div class="meta">${c.has_slot ? `<button class="chip ok" data-a="slots" aria-label="Change the slot">${(c.slot_info || {}).method === "pickup" ? "🛍️" : "🚚"} ${esc(this._slotText(c))} · Change</button>` : `<button class="chip no" data-a="slots">🚚 Book a delivery or pickup slot</button>`}
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
  // ---- delivery slots ----
  _day(iso) {
    const d = new Date(iso), t = new Date(); t.setHours(0, 0, 0, 0);
    const n = Math.round((new Date(d).setHours(0, 0, 0, 0) - t) / 86400000);
    return n === 0 ? "Today" : n === 1 ? "Tomorrow" : d.toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" });
  }
  _hm(iso) {
    const d = new Date(iso), h = d.getHours(), m = d.getMinutes();
    return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
  }
  _range(s) { return `${this._hm(s.start)} – ${this._hm(s.end)}`; }
  _slotText(c) {
    const s = c.slot_info;
    if (!s || !s.start) return c.slot || "Slot booked";
    return `${s.method === "pickup" ? "Pick up " : ""}${this._day(s.start)}, ${this._range(s)}${s.method === "pickup" && s.store ? " · " + s.store.replace(/ Woolworths$/, "") : ""}`;
  }
  async _loadSlots(mode, store) {
    const key = mode;
    this._slots = Object.assign({}, this._slots, { [key]: null });
    this._sheetSlots(true);
    try { this._slots[key] = await this._wb("slots", Object.assign({ method: mode }, store ? { store } : {}), 120000); }
    catch (e) { this._slots[key] = { error: e.message || String(e) }; }
    if (this._sheet === "slots") this._sheetSlots(true);
  }
  async _loadStores() {
    if (this._stores) return;
    this._stores = { loading: true }; this._sheetSlots(true);
    try { this._stores = await this._wb("stores", { q: this._cfg.store_search || "Hamilton" }, 90000); }
    catch (e) { this._stores = { error: e.message || String(e) }; }
    if (this._sheet === "slots") this._sheetSlots(true);
  }
  _slotGrid(S, cur) {
    const days = [];
    for (const s of S.slots || []) { const dt = new Date(s.start), k = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`; let d = days.find((x) => x.k === k); if (!d) days.push(d = { k, iso: s.start, list: [] }); d.list.push(s); }
    const pick = this._smode === "pickup";
    if (!days.length) return `<p class="mut">Woolworths isn't offering any ${pick ? "pickup times at this store" : "delivery times to " + esc(S.address || "your address")} right now.</p>`;
    const open = (d) => d.list.filter((s) => s.available).length;
    if (!days.find((d) => d.k === this._sday)) this._sday = ((cur && days.find((d) => d.list.some((s) => s.id === cur))) || days.find(open) || days[0]).k;
    const day = days.find((d) => d.k === this._sday);
    const what = pick ? "pickup" : "delivery";
    return `<div class="sdays">${days.map((d) => `<button data-a="sday" data-k="${d.k}" class="${d.k === this._sday ? "on" : ""}">${esc(this._day(d.iso))}<small>${open(d) ? open(d) + " free" : "full"}</small></button>`).join("")}</div>
      <div class="slots${pick ? " pk" : ""}">${day.list.map((s) => `<button data-a="sbook" data-id="${esc(s.id)}" class="${s.id === cur ? "on" : ""}" ${s.available && s.id !== cur ? "" : "disabled"}>
        <b>${esc(this._range(s))}</b><span>${s.id === cur ? "✓ Booked" : !s.available ? (/cutoff/.test(s.why || "") ? "Closed" : "Full") : s.fee_cents != null ? (s.fee_cents ? money(s.fee_cents) + " " + what : "Free " + what) : ""}</span></button>`).join("")}</div>`;
  }
  async _sheetSlots(refresh) {
    if (this._wbLocked()) { this._needPin = true; this._paint(); this._toast("Enter your household PIN first."); return; }
    const c = this._cart() || {}, cur = (c.slot_info || {}).id;
    if (!refresh) { this._smode = (c.slot_info || {}).method === "pickup" ? "pickup" : (this._smode || "delivery"); this._slots = {}; this._spick = false; this._sday = null; }
    const pick = this._smode === "pickup", S = (this._slots || {})[this._smode];
    let body;
    if (this._sbusy) body = `<div class="busy"><i></i>${esc(this._sbusy)}</div>`;
    else if (pick && this._spick) {
      const T = this._stores || {};
      const curStore = (S && S.store) || T.current || {};
      body = T.loading ? `<div class="busy"><i></i>Finding Woolworths stores…</div>` : T.error ? `<div class="warn">${esc(T.error)}</div>`
        : `<div class="stl">${(T.stores || []).map((t) => `<button data-a="sstore" data-id="${esc(t.id)}" data-n="${esc(t.name)}" class="${t.id === curStore.id ? "on" : ""}"><b>${esc(t.name.replace(/ Woolworths$/, ""))}</b><span>${esc([t.street, t.suburb].filter(Boolean).join(", "))}</span></button>`).join("")}</div>`;
    }
    else if (!S) body = `<div class="busy"><i></i>Asking Woolworths for ${pick ? "pickup" : "delivery"} times… about 15 seconds</div>`;
    else if (S.error) body = `<div class="warn">${esc(S.error)}</div>`;
    else body = (pick ? `<div class="stp"><span>🛍️ <b>${esc((S.store || {}).name || "")}</b></span><button class="btn sm" data-a="sstores">Change store</button></div>` : "") + this._slotGrid(S, cur);
    const sub = pick ? (this._spick ? "Pick the store you'll collect from. It's remembered for next time." : "Tap a time to book it on the trolley. Then check out and pay in the Woolworths app before the cut-off.")
      : `${S && S.address ? `To ${esc(S.address)}. ` : ""}Tap a time to book it on the trolley. Then check out and pay in the Woolworths app before the cut-off.`;
    const html = `<div class="pad"><h2>${pick ? "🛍️ Click &amp; collect" : "🚚 Delivery"} slot</h2>
      <div class="seg" role="tablist"><button data-a="smode" data-m="delivery" class="${pick ? "" : "on"}" role="tab" aria-selected="${!pick}">🚚 Delivery</button><button data-a="smode" data-m="pickup" class="${pick ? "on" : ""}" role="tab" aria-selected="${pick}">🛍️ Click &amp; collect</button></div>
      <p class="mut" style="margin:10px 0 12px;font-size:13px">${sub}</p>
      ${body}</div>
      <div class="foot"><button class="btn" data-a="${pick && this._spick ? "sback" : "close"}">${pick && this._spick ? "Back" : "Close"}</button><span class="sp"></span>
        ${cur && !this._spick ? `<button class="btn" data-a="sclear" ${this._sbusy ? "disabled" : ""}>Let the slot go</button>` : ""}</div>`;
    if (refresh && this._ov && this._sheet === "slots") { const sh = this._ov.querySelector(".sh"), y = sh.scrollTop; sh.innerHTML = html; sh.scrollTop = y; }
    else {
      this._openSheet(html, (a, b) => {
        if (a === "close") this._closeSheet();
        else if (a === "smode") {
          if (b.dataset.m === this._smode) return;
          this._smode = b.dataset.m; this._spick = false; this._sday = null;
          if (!(this._smode in this._slots)) this._loadSlots(this._smode); else this._sheetSlots(true);
        }
        else if (a === "sstores") { this._spick = true; this._sheetSlots(true); this._loadStores(); }
        else if (a === "sback") { this._spick = false; this._sheetSlots(true); }
        else if (a === "sstore") { this._spick = false; this._sday = null; this._loadSlots("pickup", { id: b.dataset.id, name: b.dataset.n }); }
        else if (a === "sday") { this._sday = b.dataset.k; this._sheetSlots(true); }
        else if (a === "sbook") this._book(b.dataset.id);
        else if (a === "sclear") this._book("");
      });
      this._sheet = "slots";
    }
    if (!refresh) this._loadSlots(this._smode);
  }
  async _book(id) {
    if (this._sbusy || this._busy) return;
    const s = (((this._slots || {})[this._smode] || {}).slots || []).find((x) => x.id === id);
    this._sbusy = id ? `Booking ${this._day(s ? s.start : "")} ${s ? this._range(s) : ""}…` : "Letting the slot go…";
    this._sheetSlots(true);
    try {
      if (!(await this._run(() => this._wb("slot_set", { slot: id }, 120000)))) return;
      if (this._sheet === "slots") this._closeSheet();
      const c = this._cart() || {};
      this._toast(id ? (c.has_slot ? `Booked: ${this._slotText(c)}. Check out in the Woolworths app.` : "Woolworths didn't keep that slot.") : "Slot let go.");
    } finally { this._sbusy = ""; if (this._sheet === "slots") this._sheetSlots(true); }
  }
  _line(v) { return ((this._cart() || {}).lines || []).find((l) => l.variant === v); }
  _act(a, b) {
    if (a === "refresh") return this._run(() => this._wb("cart", {}, 120000));
    if (a === "slots") return this._sheetSlots();
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
    try { await fn(); return true; }
    catch (e) { this._toast(e.message || String(e)); if (this._wbLocked()) this._needPin = true; return false; }
    finally { this._busy = false; if (after) after(); this._paint(); }
  }
}
Object.assign(WooliesTrolleyCard.prototype, {
  _wb: ShoppingListCard.prototype._wb,
  _wbPinCall: ShoppingListCard.prototype._wbPinCall,
  _wbAdmin: ShoppingListCard.prototype._wbAdmin,
  _wbLocked: ShoppingListCard.prototype._wbLocked,
});
