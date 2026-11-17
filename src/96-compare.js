// ⚖️ Price comparison, part of the shopping list card: every item on the next shop, priced at Woolworths and at
// Pak'nSave side by side, with the cheaper one marked and a total for the items both shops have.
// Each shop keeps its own product matches in the Woolies Bridge add-on (Pak'nSave as shop "pns").
// Pak'nSave matches can start as first guesses ("Guess the rest"); a guess is dashed until someone checks it.
Object.assign(ShoppingListCard.prototype, {
  _smap(shop) { return shop === "woolworths" ? this._wmap : (this._fmaps = this._fmaps || {})[shop]; },
  _setSmap(shop, m) { if (shop === "woolworths") this._wmap = m; else (this._fmaps = this._fmaps || {})[shop] = m; },
  // How much of a matched product the list needs, and what that costs. Pak'nSave meat and produce sold by weight is
  // priced per kilo: grams on the list become kilos, and a count uses the shop's average weight for one.
  _lineCost(s, mt, shop) {
    if (!mt || mt.skip || !(Number(mt.price) > 0)) return null;
    if (shop !== "woolworths" && mt.per_kg) {
      const tot = qtyMap([this._tot(s) || s.qty || "1"]), by = [...tot.by.entries()];
      const g = by.find(([k]) => k === "g"), kgE = by.find(([k]) => k === "kg"), cnt = by.find(([k]) => k !== "g" && k !== "ml" && k !== "kg");
      let kg = g ? g[1].n / 1000 : kgE ? kgE[1].n : cnt && mt.avg_g ? cnt[1].n * mt.avg_g / 1000 : 0.5;
      kg = Math.max(0.1, Math.round(kg * 10) / 10);
      return { qty: kg, unit: "kg", cost: kg * mt.price };
    }
    const q = (shop === "woolworths" && this._wq && this._wq[s.uid]) || this._wbQty(s, mt);
    return { qty: q.qty, unit: q.unit === "Kilogram" ? "kg" : "", cost: q.qty * mt.price };
  },
  _cmpCell(s, shop, mt, lc, win) {
    const pick = `data-a="cpick" data-uid="${esc(s.uid)}" data-shop="${shop}"`;
    if (!mt) return `<button class="cc none" ${pick}>＋ Choose</button>`;
    if (mt.skip) return `<button class="cc none" ${pick}><span class="mut">Not buying here</span></button>`;
    const each = lc ? (lc.unit === "kg" ? `${lc.qty} kg × $${Number(mt.price).toFixed(2)}` : `${lc.qty} × $${Number(mt.price).toFixed(2)}`) : "";
    return `<button class="cc${win ? " win" : ""}${mt.guess ? " guess" : ""}${mt.missing ? " gone" : ""}" ${pick}>
      <span class="cn">${esc(mt.name)}${mt.size && !mt.per_kg ? ` <span class="mut">${esc(mt.size)}</span>` : ""}</span>
      <span class="cq"><span class="mut">${mt.missing ? "not found today" : mt.guess ? "guess · tap to check" : esc(each)}</span><b>${lc ? "$" + lc.cost.toFixed(2) : ""}</b></span></button>`;
  },
  async _sheetCompare(refresh) {
    const shop = "pns", other = SHOP_NAME[shop];
    this._wq = this._wq || {};
    if (!refresh) { this._wmap = null; this._setSmap(shop, null); this._cst = null; this._cstOpen = false; }
    const W = this._wmap, F = this._smap(shop), its = this._wbItems();
    let body = "", head = "";
    if (this._wbLocked()) {
      body = `<div class="wbpin"><p class="mut">Enter your household PIN to compare prices.</p>
        <div class="wbpr"><input class="i" id="wbpin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="PIN">
        <button class="btn pri" data-a="wbunlock">Unlock</button></div></div>`;
    } else if (!W || !F) body = `<p class="mut">Loading your product matches…</p>`;
    else if (!its.length) body = `<p class="mut">Nothing on the next shop.</p>`;
    else {
      let tw = 0, tf = 0, both = 0, oldest = "";
      const rows = its.map((s) => {
        const k = normName(s.name), mw = W[k], mf = F[k], lw = this._lineCost(s, mw, "woolworths"), lf = this._lineCost(s, mf, shop);
        for (const m of [mw, mf]) if (m && !m.skip && m.at && (!oldest || m.at < oldest)) oldest = m.at;
        const ok = lw && lf && !(mf && mf.guess);
        if (ok) { tw += lw.cost; tf += lf.cost; both++; }
        const ww = lw && lf && lw.cost < lf.cost - 0.005, fw = lw && lf && lf.cost < lw.cost - 0.005;
        return `<div class="cmr"><div class="cmn"><b>${esc(s.name)}</b> <span class="mut">${esc(this._tot(s) || "")}</span></div>
          <div class="cmg">${this._cmpCell(s, "woolworths", mw, lw, ww)}${this._cmpCell(s, shop, mf, lf, fw)}</div></div>`;
      }).join("");
      const d = tw - tf, unF = its.filter((s) => !F[normName(s.name)]).length, guesses = its.filter((s) => (F[normName(s.name)] || {}).guess).length;
      head = `<div class="cmt">${both ? `<div class="cmb">${Math.abs(d) < 0.01 ? "Same price at both" : `<b>${d > 0 ? other : "Woolworths"}</b> is <b>$${Math.abs(d).toFixed(2)}</b> cheaper`}</div>
          <div class="cmh"><span>Woolworths <b>$${tw.toFixed(2)}</b></span><span>${esc(other)} <b>$${tf.toFixed(2)}</b></span></div>
          <div class="mut cmx">On the ${both} item${both === 1 ? "" : "s"} matched at both shops${guesses ? `, not counting ${guesses} guess${guesses === 1 ? "" : "es"} still to check` : ""}. Slot fees aren't included (Pak'nSave Click &amp; collect is $5).</div>`
        : `<div class="mut">Match items at both shops to see which is cheaper.</div>`}
        ${oldest && oldest < today() ? `<div class="mut cmx">Some prices are from ${esc(longDay(oldest))}. Tap ↻ Today's prices.</div>` : ""}</div>
        <div class="cma">${unF ? `<button class="btn sm pri" data-a="cguess"${this._cbusy ? " disabled" : ""}>✨ Guess the other ${unF}</button>` : ""}<button class="btn sm" data-a="cprices"${this._cbusy ? " disabled" : ""}>↻ Today's prices</button>${this._cbusy ? `<span class="mut">${esc(this._cbusy)}</span>` : ""}</div>
        <div class="cmg cmcol"><span>Woolworths</span><span>${esc(other)}</span></div>`;
      body = rows;
    }
    const st = this._cst && this._cst.current;
    const stores = this._cstOpen && this._cst ? `<div class="cstl">${(this._cst.stores || []).filter((x) => x.click_collect).map((x, i) => `<button class="${st && st.id === x.id ? "on" : ""}" data-a="cstore" data-k="${i}"><b>${esc(x.name)}</b><span class="mut">${esc(x.address)}</span></button>`).join("")}</div>` : "";
    const html = `<div class="pad"><h2>⚖️ Woolworths vs ${esc(other)}</h2>
      <div class="cstp"><span>${esc(other)} store: <b>${esc(st ? st.name.replace(/^PAK'nSAVE\s*/i, "") : this._cst ? "not picked yet" : "…")}</b></span><button class="btn sm" data-a="cstores">${this._cstOpen ? "Done" : st ? "Change store" : "Pick a store"}</button></div>
      ${stores}<div id="cmrows">${head}${body}</div></div>
      <div class="foot"><button class="btn" data-a="close">Close</button><span class="sp"></span>${this._wbOn() ? `<button class="btn" data-a="ctrolley">🛒 Woolworths trolley</button>` : ""}</div>`;
    if (refresh && this._ov && this._sheet === "compare") { const sh = this._ov.querySelector(".sh"), y = sh.scrollTop; sh.innerHTML = html; sh.scrollTop = y; }
    else {
      this._openSheet(html, (a, b) => {
        if (a === "close") this._closeSheet();
        else if (a === "wbunlock") this._wbUnlock();
        else if (a === "cpick") { const s = this._item(b.dataset.uid); if (s) { this._wsBack = "compare"; this._sheetWSearch(s, undefined, null, b.dataset.shop); } }
        else if (a === "cstores") { this._cstOpen = !this._cstOpen; this._sheetCompare(true); }
        else if (a === "cstore") this._cmpStore(((this._cst && this._cst.stores) || []).filter((x) => x.click_collect)[Number(b.dataset.k)]);
        else if (a === "cguess") this._cmpGuess();
        else if (a === "cprices") this._cmpPrices();
        else if (a === "ctrolley") { this._closeSheet(); this._sheetTrolley(); }
      });
      this._ov.addEventListener("keydown", (e) => { if (e.target.id === "wbpin" && e.key === "Enter") this._wbUnlock(); });
      this._sheet = "compare";
    }
    if (this._wbLocked()) return;
    if (!W || !F || !this._cst) {
      try {
        if (!W) this._wmap = await this._wb("map_get", {}, 30000);
        if (!F) this._setSmap(shop, await this._wb("map_get", { shop }, 30000));
        if (!this._cst) { this._cst = await this._wb("fs_stores", { shop, q: this._cfg.pns_store_search || "Hamilton" }, 60000); if (!this._cst.current) this._cstOpen = true; }
      } catch (e) { this._toast(e.message); if (!this._wmap) this._wmap = {}; if (!this._smap(shop)) this._setSmap(shop, {}); if (!this._cst) this._cst = { stores: [] }; }
      if (this._sheet === "compare") this._sheetCompare(true);
    }
  },
  async _cmpBusy(label, fn) {
    if (this._cbusy) return;
    this._cbusy = label; this._sheetCompare(true);
    try { await fn(); } catch (e) { this._toast(e.message); }
    this._cbusy = ""; if (this._sheet === "compare") this._sheetCompare(true);
  },
  _cmpStore(x) {
    if (!x) return;
    this._cmpBusy("Changing store…", async () => {
      const cur = await this._wb("fs_store_set", { shop: "pns", store: { id: x.id, name: x.name } }, 30000);
      this._cst.current = cur; this._cstOpen = false;
      // Prices differ between stores, so re-price the matches at the new one.
      const r = await this._wb("fs_prices", { shop: "pns" }, 180000); this._setSmap("pns", r.map);
    });
  },
  _cmpGuess() {
    if (!this._cst || !this._cst.current) { this._cstOpen = true; this._toast("Pick a Pak'nSave store first."); this._sheetCompare(true); return; }
    const F = this._smap("pns") || {}, W = this._wmap || {};
    const items = this._wbItems().filter((s) => !F[normName(s.name)]).map((s) => { const k = normName(s.name), w = W[k]; return { key: k, q: shopName(s.name), size: w && !w.skip ? w.size || "" : "" }; });
    if (!items.length) return;
    this._cmpBusy(`Searching Pak'nSave for ${items.length} item${items.length === 1 ? "" : "s"}…`, async () => {
      const r = await this._wb("fs_suggest", { shop: "pns", items }, 60000 + items.length * 3000);
      this._setSmap("pns", r.map); this._toast(`✨ ${r.made} guessed. Dashed ones need a quick check.`);
    });
  },
  _cmpPrices() {
    this._cmpBusy("Checking today's prices…", async () => {
      const n = Object.keys(this._wmap || {}).length + Object.keys(this._smap("pns") || {}).length;
      const [w, f] = await Promise.all([this._wb("w_prices", {}, 60000 + n * 2000), this._cst && this._cst.current ? this._wb("fs_prices", { shop: "pns" }, 60000 + n * 2000) : null]);
      if (w && w.map) this._wmap = w.map;
      if (f && f.map) this._setSmap("pns", f.map);
      this._toast("↻ Prices are up to date.");
    });
  }
});
