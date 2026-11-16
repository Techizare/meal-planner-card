// 🛒 Woolworths trolley, part of the shopping list card (needs the Woolies Bridge add-on; admins only).
// Kept in its own file and mixed into the class, so the shopping list file stays readable.
Object.assign(ShoppingListCard.prototype, {
  _wbOn() { const h = this._hass; return !!(h && h.states["sensor.woolies_bridge"] && h.user && h.user.is_admin); },
  // One request to the add-on: fire woolies_request, wait for the woolies_result with the same id.
  async _wb(op, data = {}, ms = 90000) {
    if (!this._wbSub) {
      this._wbWait = {};
      this._wbSub = this._hass.connection.subscribeEvents((ev) => {
        const d = ev.data || {}, w = this._wbWait[d.id]; if (!w) return;
        delete this._wbWait[d.id]; clearTimeout(w.t);
        d.ok ? w.res(d.data) : w.rej(new Error(d.error || "Woolies Bridge failed"));
      }, "woolies_result").catch((e) => { this._wbSub = null; throw e; });
    }
    await this._wbSub;
    const id = Math.random().toString(36).slice(2);
    const p = new Promise((res, rej) => { this._wbWait[id] = { res, rej, t: setTimeout(() => { delete this._wbWait[id]; rej(new Error("No answer from the Woolies Bridge add-on. Is it running?")); }, ms) }; });
    await this._hass.callWS({ type: "fire_event", event_type: "woolies_request", event_data: Object.assign({ id, op }, data) });
    return p;
  },
  _wbItems() { return (this._items || []).filter((s) => (!s.done || (this._wres || {})[s.uid]) && !isGhost(s) && this._inSel(s)).sort((a, b) => this._aisles.indexOf(this._aisle(a.aisle)) - this._aisles.indexOf(this._aisle(b.aisle)) || a.name.localeCompare(b.name)); },
  // How many to put in the trolley: counts stay counts; grams and millilitres are worked out from the pack size;
  // loose produce sold by weight goes in by the kilo.
  _wbQty(s, mt) {
    const tot = qtyMap([this._tot(s) || s.qty || "1"]), by = [...tot.by.entries()];
    const meas = by.find(([k]) => k === "g" || k === "ml"), cnt = by.find(([k]) => k !== "g" && k !== "ml");
    if (mt.dual && meas && meas[0] === "g" && !cnt) return { qty: Math.max(0.1, Math.round(meas[1].n / 100) / 10), unit: "Kilogram" };
    if (cnt && !meas) return { qty: Math.max(1, Math.ceil(cnt[1].n - 1e-9)), unit: "Each" };
    if (meas) {
      const pk = parseQty(String(mt.size || "").replace(/(\d)([a-z])/i, "$1 $2"));
      if (pk && pk.n && pk.u === meas[0]) return { qty: Math.max(1, Math.ceil(meas[1].n / pk.n - 0.05)), unit: "Each" };
    }
    return { qty: 1, unit: "Each" };
  },
  _wbRow(s) {
    const k = normName(s.name), mt = (this._wmap || {})[k], q = this._wq[s.uid] || (mt && !mt.skip ? this._wbQty(s, mt) : null);
    const st = this._wres[s.uid];
    return `<div class="wbr${mt && mt.skip ? " skip" : ""}"><div class="wbt"><b>${esc(s.name)}</b> <span class="mut">${esc(this._tot(s) || "")}</span>
        ${st ? `<span class="wbs ${st.ok ? "ok" : "bad"}">${st.ok ? "✓ in trolley" : "⚠️ " + esc(st.error)}</span>` : ""}</div>
      <div class="wbm">${!mt ? `<button class="btn sm pri" data-a="wbpick" data-uid="${esc(s.uid)}">🔎 Choose product</button>`
        : mt.skip ? `<span class="mut">Not buying online</span><button class="btn sm" data-a="wbpick" data-uid="${esc(s.uid)}">Choose product</button>`
        : `<span class="wbp" data-a="wbpick" data-uid="${esc(s.uid)}" title="Tap to change">${esc(mt.name)}${mt.size ? ` <span class="mut">${esc(mt.size)}</span>` : ""}${mt.price ? ` <span class="mut">$${Number(mt.price).toFixed(2)}</span>` : ""}</span>
          <span class="svs wq"><button data-a="wbq" data-uid="${esc(s.uid)}" data-k="-1" aria-label="Fewer">−</button><b>${q.unit === "Kilogram" ? q.qty + " kg" : q.qty}</b><button data-a="wbq" data-uid="${esc(s.uid)}" data-k="1" aria-label="More">+</button></span>`}</div></div>`;
  },
  async _sheetTrolley(refresh) {
    this._wq = this._wq || {}; this._wres = this._wres || {};
    if (!refresh) { this._wmap = null; this._wres = {}; }
    const its = this._wbItems();
    const sen = this._hass.states["sensor.woolies_bridge"] || { state: "unknown", attributes: {} };
    const ready = (this._wmap ? its.filter((s) => { const m = this._wmap[normName(s.name)]; return m && !m.skip && !(this._wres[s.uid] || {}).ok; }) : []);
    const todo = this._wmap ? its.filter((s) => !this._wmap[normName(s.name)]).length : 0;
    const body = !this._wmap ? `<p class="mut">Loading your product matches…</p>` : !its.length ? `<p class="mut">Nothing on the next shop.</p>` : its.map((s) => this._wbRow(s)).join("");
    const html = `<div class="pad"><h2>🛒 Fill the Woolworths trolley</h2>
      <p class="mut" style="margin:6px 0 10px;font-size:13px">Pick the product for each item once and it's remembered. Then one tap adds them all. Book the slot and check out in the Woolworths app.
      ${sen.state === "error" || sen.state === "signed_out" ? `<br><span class="noi">⚠️ ${esc(sen.attributes.last_error || "Woolies Bridge needs attention.")}</span>` : ""}</p>
      ${todo ? `<div class="nh mut" style="margin:0 0 8px">${todo} item${todo === 1 ? "" : "s"} still to match.</div>` : ""}
      <div id="wbrows">${body}</div></div>
      <div class="foot"><button class="btn" data-a="close">Close</button><span class="sp"></span>
        <label class="wbk"><input type="checkbox" id="wbtick" ${this._wtick === false ? "" : "checked"}> Tick off</label>
        <button class="btn pri" data-a="wbadd" ${ready.length && !this._wbusy ? "" : "disabled"}>${this._wbusy ? "Adding…" : `Add ${ready.length} to trolley`}</button></div>`;
    if (refresh && this._ov && this._sheet === "trolley") { const sh = this._ov.querySelector(".sh"), y = sh.scrollTop; sh.innerHTML = html; sh.scrollTop = y; }
    else {
      this._openSheet(html, async (a, b) => {
        if (a === "close") this._closeSheet();
        else if (a === "wbpick") { const s = this._item(b.dataset.uid); if (s) this._sheetWSearch(s); }
        else if (a === "wbq") {
          const s = this._item(b.dataset.uid), mt = s && this._wmap[normName(s.name)]; if (!mt) return;
          const q = Object.assign({}, this._wq[s.uid] || this._wbQty(s, mt)), step = q.unit === "Kilogram" ? 0.1 : 1;
          q.qty = Math.max(step, Math.round((q.qty + step * Number(b.dataset.k)) * 10) / 10); this._wq[s.uid] = q; this._sheetTrolley(true);
        } else if (a === "wbadd") this._wbAdd();
      });
      this._ov.addEventListener("change", (e) => { if (e.target.id === "wbtick") this._wtick = e.target.checked; });
      this._sheet = "trolley";
    }
    if (!this._wmap) {
      try { this._wmap = await this._wb("map_get", {}, 30000); } catch (e) { this._wmap = {}; this._toast(e.message); }
      if (this._sheet === "trolley") this._sheetTrolley(true);
    }
  },
  async _wbAdd() {
    const its = this._wbItems().filter((s) => { const m = this._wmap[normName(s.name)]; return m && !m.skip && !(this._wres[s.uid] || {}).ok; });
    if (!its.length || this._wbusy) return;
    this._wbusy = true; this._sheetTrolley(true);
    const items = its.map((s) => { const mt = this._wmap[normName(s.name)], q = this._wq[s.uid] || this._wbQty(s, mt); return { ref: s.uid, sku: mt.sku, qty: q.qty, unit: q.unit, name: s.name }; });
    try {
      const r = await this._wb("add", { items }, 60000 + items.length * 15000);
      for (const u of r.added || []) this._wres[u] = { ok: true };
      for (const f of r.failed || []) this._wres[f.ref] = { ok: false, error: f.error };
      if (this._wtick !== false) for (const u of r.added || []) this._f.call("update_item", { item: u, status: "completed" }).catch(() => {});
      this._toast(`🛒 ${(r.added || []).length} added to the trolley` + ((r.failed || []).length ? ` · ${r.failed.length} didn't go in` : ""));
    } catch (e) { this._toast(e.message); }
    this._wbusy = false; this._sheetTrolley(true);
  },
  // Search Woolworths for one list item and remember the product picked for it.
  _sheetWSearch(s, results, q) {
    q = q == null ? shopName(s.name) : q;
    const mt = (this._wmap || {})[normName(s.name)];
    const list = results === undefined ? `<p class="mut">Searching…</p>` : !results.length ? `<p class="mut">Nothing found. Try other words.</p>`
      : `<div class="wbl">${results.map((p, i) => `<div class="wbo${mt && mt.sku === p.sku ? " on" : ""}" data-a="wbset" data-k="${i}"><div><b>${esc(p.name)}</b>${p.brand ? ` <span class="mut">${esc(p.brand)}</span>` : ""}<div class="mut" style="font-size:12.5px">${esc(p.size || "")}${p.supports_dual_pricing ? " · sold by weight or each" : ""}${p.in_stock === false ? " · out of stock" : ""}</div></div>
          <div class="wbpr">${p.is_special && p.sale_price ? `<b class="sp2">$${Number(p.sale_price).toFixed(2)}</b>` : `$${Number(p.price || 0).toFixed(2)}`}</div></div>`).join("")}</div>`;
    const html = `<div class="pad"><h2>${esc(s.name)} <span class="mut" style="font-weight:500;font-size:15px">${esc(this._tot(s) || "")}</span></h2>
      <div class="sta" style="margin:8px 0 12px"><input class="i" id="wbq" value="${esc(q)}" enterkeyhint="search" autocomplete="off"><button class="btn pri" data-a="wbgo">🔎 Search</button></div>
      ${list}</div>
      <div class="foot"><button class="btn" data-a="back">‹ Back</button><span class="sp"></span>
        ${mt ? `<button class="btn" data-a="wbforget">Forget match</button>` : ""}<button class="btn" data-a="wbskip">Don't buy online</button></div>`;
    const go = async (text) => {
      this._sheetWSearch(s, undefined, text);
      try { const r = await this._wb("search", { q: text, limit: 20 }, 120000); if (this._sheet === "wsearch") this._sheetWSearch(s, r, text); }
      catch (e) { this._toast(e.message); if (this._sheet === "wsearch") this._sheetWSearch(s, [], text); }
    };
    const save = async (match) => {
      const key = normName(s.name);
      try { await this._wb("map_set", { key, match }, 30000); } catch (e) { this._toast(e.message); return; }
      if (match) this._wmap[key] = match; else delete this._wmap[key];
      delete this._wq[s.uid]; this._closeSheet(); this._sheetTrolley(true);
    };
    const ov = this._openSheet(html, async (a, b) => {
      if (a === "back") { this._closeSheet(); this._sheetTrolley(true); }
      else if (a === "wbgo") { const v = ov.querySelector("#wbq").value.trim(); if (v) go(v); }
      else if (a === "wbset") { const p = results[Number(b.dataset.k)]; if (p) save({ sku: p.sku, name: p.name, brand: p.brand || "", size: p.size || "", price: p.is_special && p.sale_price ? p.sale_price : p.price, dual: !!p.supports_dual_pricing }); }
      else if (a === "wbskip") save({ skip: true });
      else if (a === "wbforget") save(null);
    });
    ov.querySelector("#wbq").addEventListener("keydown", (e) => { if (e.key === "Enter") { const v = e.target.value.trim(); if (v) go(v); } });
    this._sheet = "wsearch";
    if (results === undefined && q && !this._wbSearching) { this._wbSearching = true; go(q).finally(() => { this._wbSearching = false; }); }
  }

});
