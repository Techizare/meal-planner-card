class ShoppingListCard extends MPBase {
  setConfig(config) {
    if (!config || !config.entity) throw new Error("shopping-list-card: entity is required (a todo.* list)");
    this._cfg = Object.assign({ title: "Shopping", meals_entity: null, staples_entity: "todo.staples", shop_entity: "input_text.meals_shop", quick_add: ["Milk", "Bread", "Eggs", "Bananas", "Butter", "Cheese", "Apples", "Toilet paper", "Coffee", "Yoghurt"] }, config);
    if (Array.isArray(config.aisles) && config.aisles.length) this._aisles = config.aisles;
    this._items = null; this._meals = []; this._showDone = true; this._staples = null; this._pOpen = true; this._sel = new Set(); this._past = new Set();
  }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  _start() {
    this._started = true;
    this._feeds = [];
    this._f = new TodoFeed(this._cfg.entity, (items, err) => {
      this._err = err || null; this._items = items ? items.map(parseShop) : (this._items || []); this._paint();
      // A short random wait, so two screens showing the list don't both merge the same double-up.
      clearTimeout(this._mt); this._mt = setTimeout(() => this._mergeDupes().then(() => this._tidy()), 700 + Math.random() * 1500);
    });
    this._feeds.push(this._f);
    if (this._cfg.meals_entity) {
      this._feeds.push(this._mf = new TodoFeed(this._cfg.meals_entity, (items) => {
        if (!items) return;
        this._meals = items.map(parseMeal); this._paint();
        clearTimeout(this._tt); this._tt = setTimeout(() => this._tidy(), 1500 + Math.random() * 1500);
      }));
    }
    if (this._cfg.staples_entity && this._hass.states[this._cfg.staples_entity]) {
      this._stf = new TodoFeed(this._cfg.staples_entity, (items) => {
        if (!items) return;
        this._staples = items.map((i) => ({ uid: i.uid, name: i.summary }));
        this._paint(); if (this._sheet === "staples") this._sheetStaples(true);
      });
      this._feeds.push(this._stf);
    }
    for (const f of this._feeds) f.start(this._hass);
    this._build();
  }

  _build() {
    if (this._built) return;
    this._built = true;
    this.shadowRoot.innerHTML = `<style>${SL_STYLE}</style><ha-card>
      <div id="top"></div>
      <div class="qa"><input class="i" id="add" placeholder="Add an item, e.g. 2 kg potatoes" enterkeyhint="done" autocomplete="off">
        <button class="btn pri" data-a="add" aria-label="Add">＋</button></div>
      <div class="qkw">${this._rowHtml("qk", "", "qk", "qk")}</div>
      <div id="list"></div></ha-card>`;
    const card = this.shadowRoot.querySelector("ha-card");
    card.addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (b) this._act(b.dataset.a, b); });
    this.shadowRoot.getElementById("add").addEventListener("keydown", (e) => { if (e.key === "Enter") this._quickAdd(); });
    this._paint();
  }

  _resize() { super._resize(); if (this.shadowRoot) { this._rows(); this._edges(this.shadowRoot.querySelector(".nts")); } }

  set hass(h) {
    super.hass = h;
    const st = this._cfg && h.states[this._cfg.shop_entity], v = st ? st.state : "";
    if (v !== this._shopS) { const first = this._shopS === undefined; this._shopS = v; this._shopW = null; if (!first) this._paint(); }
  }

  // The shop: { s, n } = next shop start and end (unset = worked out), { l, f, u } = last shop day and the nights it covered.
  // Kept in an input_text helper so every screen agrees; this screen's storage stands in if there is none.
  _shop() {
    if (this._shopW) return this._shopW;
    const st = this._hass && this._hass.states[this._cfg.shop_entity];
    let raw = st ? st.state : ""; if (!st) { try { raw = localStorage.getItem("meal-planner-shop"); } catch (e) { /* storage off */ } }
    try { const o = JSON.parse(raw || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; }
  }
  _shopPut(patch) {
    const o = Object.assign({}, this._shop(), patch), v = JSON.stringify(o);
    this._shopW = o;
    if (this._hass.states[this._cfg.shop_entity]) this._hass.callService("input_text", "set_value", { entity_id: this._cfg.shop_entity, value: v });
    else try { localStorage.setItem("meal-planner-shop", v); } catch (e) { /* storage off */ }
    this._paint();
  }
  _rngTxt() { const { s, e } = this._rng || {}; return !s ? "" : s === e ? dayWord(s) : dayWord(s) + " → " + dayWord(e); }
  // A share for a night the last shop covered, still open: missed, or added since. It goes on the next shop.
  _topUp(d) { const c = this._cov; return !!c && d >= today() && d >= c.f && d <= c.u && !this._sel.has(d); }
  _want(d) { return !ISO.test(d) || this._sel.has(d) || this._topUp(d); }
  // An item counts if it is for a night of the next shop, a top-up, or was added by hand or from a meal sheet.
  _inSel(s) { return !this._sel.size || !s.for.length || !!s.qty || s.for.some((f) => this._want(f.date)); }
  _tot(s) { return this._sel.size ? sumQty([s.qty, ...s.for.filter((f) => this._want(f.date)).map((f) => f.qty)].filter(Boolean)) : s.total; }

  _emojiFor(meal) { const m = this._meals.find((x) => x.name === meal); return m ? (m.emoji || "🍽️") : "🍽️"; }

  _paint() {
    if (!this._built) return;
    const top = this.shadowRoot.getElementById("top"), list = this.shadowRoot.getElementById("list"), qk = this.shadowRoot.getElementById("qk");
    if (this._items === null) { list.innerHTML = `<div class="mut">Loading…</div>`; return; }
    const all = this._items.filter((s) => !s.done && !isGhost(s)), done = this._items.filter((s) => s.done);
    const nightsHtml = this._nightsHtml(all);
    const open = all.filter((s) => this._inSel(s));
    const meals = new Set(open.flatMap((s) => s.for.filter((f) => !this._sel.size || this._want(f.date)).map((f) => f.meal)));
    const extras = open.filter((s) => !s.for.length).length;
    const pct = all.length + done.length ? Math.round((done.length / (all.length + done.length)) * 100) : 0;
    top.innerHTML = `${this._err ? `<div class="warn">${esc(this._err)} Create a Local To-do list called “Shopping”.</div>` : ""}
      ${!this._err && this._f.hass && this._hass.states[this._cfg.entity] && !this._f.canDescribe() ? `<div class="warn">This list can’t store quantities or aisles, so everything lands in Other. A Local To-do list can.</div>` : ""}
      <div class="top"><div class="big">${open.length}</div><div class="lbl"><b style="color:var(--primary-text-color);font-size:15px">${esc(this._cfg.title)}</b><br>
        ${open.length ? `to get${meals.size ? ` · for ${meals.size} meal${meals.size === 1 ? "" : "s"}` : ""}${extras ? ` · ${extras} extra${extras === 1 ? "" : "s"}` : ""}` : "nothing to get"}</div>
        <span class="sp"></span>${open.length && this._wbOn() ? `<button class="btn sm" data-a="trolley" aria-label="Fill the Woolworths trolley">🛒<span class="bt"> Trolley</span></button>` : ""}${open.length ? `<button class="btn sm" data-a="send" aria-label="Send the list">📤<span class="bt"> Send</span></button>` : ""}${done.length ? `<button class="btn sm" data-a="clear">Clear ${done.length}<span class="bt"> ticked</span></button>` : ""}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>${nightsHtml}`;
    const nts = top.querySelector(".nts"); if (nts) nts.addEventListener("scroll", () => this._edges(nts), { passive: true });
    const have = new Set(all.map((s) => normName(s.name)));
    const quick = this._staples ? this._staples.map((x) => x.name) : this._cfg.quick_add;
    qk.innerHTML = quick.map((q) => `<span class="chip${have.has(normName(q)) ? " got" : ""}" data-a="qk" data-n="${esc(q)}">${have.has(normName(q)) ? "✓" : "＋"} ${esc(q)}</span>`).join("")
      + (this._stf ? `<span class="chip ed" data-a="qkedit" aria-label="Edit quick-add items">✎ Edit</span>` : "");

    if (!all.length && !done.length) { list.innerHTML = `<div class="empty"><div class="e">🛒</div><p>The list is empty. Plan a meal or add something above.</p></div>`; this._resize(); return; }
    const row = (s) => {
      const a = this._aisle(s.aisle);
      // One chip per meal that needs it, named, with its night(s) in the tooltip.
      const days = [...new Set(s.for.map((f) => f.meal))].map((meal) => {
        const ds = s.for.filter((f) => f.meal === meal).map((f) => f.date), iso = ds.filter((d) => ISO.test(d));
        const tu = iso.some((d) => this._topUp(d)), off = this._sel.size && !ds.some((d) => this._want(d));
        return `<span class="chip${off ? " off" : ""}${tu ? " tu" : ""}" title="${esc(iso.map(longDay).join(", ") || "Added from the meal")}${tu ? " · since the last shop" : ""}">${this._emojiFor(meal)} ${esc(meal)}</span>`;
      }).join("") + (s.qty && s.for.length ? `<span class="chip" title="Added by hand, on top of the meals">✍️ ${esc(s.qty)} extra</span>` : "");
      return `<div class="it${s.done ? " done" : ""}" style="--gc:${a.colour}"><button class="ck${s.done ? " on" : ""}" data-a="tick" data-uid="${esc(s.uid)}" aria-label="${s.done ? "Untick" : "Tick"} ${esc(s.name)}">${s.done ? "✓" : ""}</button>
        <div class="tx" data-a="edit" data-uid="${esc(s.uid)}"><div class="nm">${esc(s.name)}</div>${days || s.notes ? `<div class="sb">${days}${s.notes ? `<span class="chip">📝 ${esc(s.notes.split("\n")[0])}</span>` : ""}</div>` : ""}</div>
        ${this._tot(s) ? `<span class="qt">${esc(this._tot(s))}</span>` : ""}
        ${s.done ? "" : `<button class="hv" data-a="have" data-uid="${esc(s.uid)}" title="We already have it: take it off the list" aria-label="We have ${esc(s.name)}, take it off">✕</button>`}</div>`;
    };
    // The next shop decides what is shown (open is already filtered to it).
    const sel = this._sel, nt = sel.size > 0 || this._past.size > 0, shown = open;
    let html = "";
    for (const a of this._aisles) {
      const its = shown.filter((s) => this._aisle(s.aisle).name === a.name).sort((x, y) => x.name.localeCompare(y.name));
      if (!its.length) continue;
      html += `<div class="grp" style="--gc:${a.colour}"><div class="gh"><span class="gi">${a.icon}</span><span class="gn">${esc(a.name)}</span><span class="gc">${its.length}</span></div>${its.map(row).join("")}</div>`;
    }
    if (!open.length) html += `<div class="empty"><div class="e">🎉</div><p>All done. Everything is in the trolley.</p></div>`;
    let trolley = "";
    if (done.length) {
      trolley = `<div class="grp trolley"><div class="gh" data-a="fold" style="cursor:pointer"><span class="gi">🛒</span><span class="gn">In the trolley</span><span class="gc">${done.length} ${this._showDone ? "▾" : "▸"}</span></div>
        ${this._showDone ? done.sort((x, y) => x.name.localeCompare(y.name)).map(row).join("") : ""}</div>`;
    }
    list.innerHTML = `${nt ? this._nightBanner(sel, shown) : ""}<div class="cols">${html}</div>${this._pantryHtml(all)}${trolley}`;
    this._resize();
  }

  _item(uid) { return (this._items || []).find((s) => s.uid === uid); }

  // Nights the list is for, oldest first: those open items are for, plus every night planned from today on.
  // miss lists planned meals whose shoppable ingredients have no line on the list yet (ticked lines, and nights the last shop covered, count as got).
  _nights(open) {
    const out = new Map(), t = today(), all = this._items || [], sh = this._shop();
    const got = (d) => sh.u && sh.u >= t && d >= sh.f && d <= sh.u; // the last shop covered it, so nothing is missing
    const night = (d) => { if (!out.has(d)) out.set(d, { d, meals: new Set(), miss: [] }); return out.get(d); };
    for (const s of open) for (const f of s.for) if (ISO.test(f.date)) night(f.date).meals.add(f.meal);
    for (const m of this._meals) for (const d of m.plan) {
      if (d < t) continue;
      const n = night(d); n.meals.add(m.name);
      const mine = (f) => f.meal === m.name && f.date === d;
      const ings = m.ingredients.filter((i) => i.name && !isPantry(i) && !all.some((s) => (s.for.some(mine) || (s.have || []).some(mine)) && normName(s.name) === normName(i.name)));
      if (ings.length && !got(d)) n.miss.push({ m, ings });
    }
    return [...out.values()].sort((a, b) => a.d.localeCompare(b.d)).map((n) => Object.assign(n, { meals: [...n.meals] }));
  }

  // Works out the next shop (into this._rng and this._sel, every night in it) and draws the shop rows.
  _nightsHtml(open) {
    const ns = this._nights(open), t = today(), sh = this._shop();
    const cov = this._cov = sh.u && sh.u >= t && ISO.test(sh.f) ? { f: sh.f, u: sh.u } : null;
    const s = ISO.test(sh.s || "") && sh.s >= t ? sh.s : cov ? addDays(cov.u, 1) : t;
    const after = ns.filter((n) => n.d >= s);
    const e = ISO.test(sh.n || "") && sh.n >= s ? sh.n : after.length ? after[after.length - 1].d : s;
    this._rng = { s, e };
    const sel = this._sel = new Set();
    for (let d = s, i = 0; d <= e && i < 60; d = addDays(d, 1), i++) sel.add(d);
    for (const d of this._past) if (d < t && ns.some((n) => n.d === d)) sel.add(d); else this._past.delete(d);
    const chips = ns.map((n) => {
      const past = n.d < t, on = sel.has(n.d), got = !on && cov && n.d >= cov.f && n.d <= cov.u;
      const lbl = past ? "⌛ " + dayNum(n.d) + " " + monShort(n.d) : dayWord(n.d);
      return `<span class="chip${past ? " past" : ""}${n.miss.length ? " miss" : ""}${on ? " on" : ""}${got ? " got" : ""}" data-a="night" aria-pressed="${on}" data-d="${n.d}" title="${esc(n.meals.join(", "))}">${got ? "✓ " : ""}${n.meals.map((m) => this._emojiFor(m)).join("")} ${lbl}${n.miss.length ? `<b class="mi">＋</b>` : ""}</span>`;
    }).join("");
    const miss = ns.some((n) => n.miss.length);
    const last = sh.l && ISO.test(sh.l) ? `Last shop ${longDay(sh.l)}${cov ? `, got ✓ ${dayWord(cov.f)}${cov.f === cov.u ? "" : " – " + dayWord(cov.u)}` : ""}. ` : "";
    return `<div class="shp"><span class="t">🛒 <b>Next shop</b> · ${this._rngTxt()}</span><button class="btn sm pri" data-a="shopdone">✓ Done<span class="bt"> shopping</span></button></div>
      ${ns.length ? `<div class="nts" aria-label="Nights">${chips}</div>` : ""}
      <div class="nh mut">${last}${ns.length ? `Tap a night to stretch the shop to it; tap its first night to leave that out${miss ? `. <b>＋</b> = ingredients not on the list yet` : ""}.` : ""}</div>`;
  }

  // Tapping a night: outside the shop stretches it to there, inside sets the end, the first night trims it off. Gone nights toggle for Take off.
  _tapNight(d) {
    const t = today(), { s, e } = this._rng;
    if (d < t) { if (this._past.has(d)) this._past.delete(d); else this._past.add(d); this._paint(); return; }
    let ns = s, ne = e;
    if (d < s) ns = d;
    else if (d > e) ne = d;
    else if (d === s && s < e) ns = this._nights((this._items || []).filter((x) => !x.done)).map((n) => n.d).find((x) => x > d) || addDays(d, 1);
    else ne = d;
    if (ns > ne) ne = ns;
    this._shopPut({ s: ns, n: ne });
  }

  _sheetDone() {
    const items = this._items || [], ticked = items.filter((x) => x.done).length, left = items.filter((x) => !x.done && !isGhost(x) && this._inSel(x)).length;
    let when = today(), all = false;
    const html = `<div class="pad"><h2>Done shopping?</h2>
      <p class="mut" style="margin:6px 0 12px;font-size:14px;line-height:1.5">This shop covers <b>${esc(this._rngTxt())}</b>.${ticked ? ` The ${ticked} ticked item${ticked === 1 ? " comes" : "s come"} off the list.` : ""} Meals you add to these nights later come back as top-ups.</p>
      <label class="f">Shopped</label><div class="tg"><span class="chip on" data-a="when" data-k="0">Today</span><span class="chip" data-a="when" data-k="-1">Yesterday</span></div>
      ${left ? `<label class="f">The ${left} not ticked</label><div class="tg"><span class="chip on" data-a="rest" data-k="0">Keep for next time</span><span class="chip" data-a="rest" data-k="1">Got them all</span></div>` : ""}</div>
      <div class="foot"><button class="btn" data-a="close">Cancel</button><span class="sp"></span><button class="btn pri" data-a="ok">✓ Done shopping</button></div>`;
    const ov = this._openSheet(html, async (a, b) => {
      if (a === "close") this._closeSheet();
      else if (a === "when") { when = addDays(today(), Number(b.dataset.k)); ov.querySelectorAll("[data-a=when]").forEach((c) => c.classList.toggle("on", c === b)); }
      else if (a === "rest") { all = b.dataset.k === "1"; ov.querySelectorAll("[data-a=rest]").forEach((c) => c.classList.toggle("on", c === b)); }
      else if (a === "ok") { this._closeSheet(); await this._shopDone(when, all); }
    });
  }

  // Records the next shop as the last one (joined onto the last one when they meet) and clears the ticked items.
  // With all, the unticked items were bought too: their shares for this shop go, and a line with nothing else left goes.
  async _shopDone(when, all) {
    const { s, e } = this._rng, c = this._cov, join = c && s <= addDays(c.u, 1);
    const txt = this._rngTxt();
    if (all) for (const x of (this._items || []).filter((i) => !i.done && !isGhost(i) && this._inSel(i))) {
      const keep = x.for.filter((f) => ISO.test(f.date) && !this._want(f.date));
      if (!keep.length) await this._f.call("remove_item", { item: x.uid });
      else if (keep.length < x.for.length || x.qty) { x.for = keep; x.qty = ""; await this._f.call("update_item", { item: x.uid, description: composeShop(x) }); }
    }
    this._shopPut({ l: when, f: join && c.f < s ? c.f : s, u: join && c.u > e ? c.u : e, s: null, n: null });
    if ((this._items || []).some((x) => x.done)) await this._f.call("remove_completed_items", {});
    this._toast("Shop saved: " + txt);
  }

  _nightBanner(sel, shown) {
    const t = today(), past = [...this._past].sort();
    const ns = this._nights((this._items || []).filter((s) => !s.done)).filter((x) => sel.has(x.d) && x.d >= t);
    const miss = ns.flatMap((n) => n.miss), nMiss = miss.reduce((a, x) => a + x.ings.length, 0);
    if (!miss.length && !past.length) return "";
    const missTxt = miss.length ? `＋ Not on the list yet: ${miss.map((x) => `${esc(x.m.emoji || "🍽️")} ${esc(x.m.name)} (${x.ings.length})`).join(", ")}.` : "";
    const pastTxt = past.length ? `⌛ ${past.map((d) => dayNum(d) + " " + monShort(d)).join(", ")} ${past.length === 1 ? "has" : "have"} been and gone. Got ${past.length === 1 ? "it" : "them"} already? Take ${past.length === 1 ? "it" : "them"} off the list.` : "";
    return `<div class="nf${miss.length ? "" : " past"}"><span class="t">${[missTxt, pastTxt].filter(Boolean).join("<br>")}</span>
      ${miss.length ? `<button class="btn sm pri" data-a="nfill">＋ Add ${nMiss} ingredient${nMiss === 1 ? "" : "s"}</button>` : ""}${past.length ? `<button class="btn sm" data-a="ndrop">Take off</button>` : ""}</div>`;
  }

  // Puts the missing ingredients of the selected nights' meals on the list, one share per meal and night.
  async _fillNights(ds) {
    if (this._filling) return;
    this._filling = true;
    let n = 0;
    try {
      const fresh = await this._f.fetch(); if (fresh) this._items = fresh.map(parseShop);
      let open = this._items.filter((s) => !s.done);
      for (const nt of this._nights(open).filter((x) => ds.includes(x.d))) for (const { m, ings } of nt.miss) {
        const merged = new Map();
        for (const i of ings) { const k = normName(i.name); if (merged.has(k)) merged.get(k).q.push(i.qty); else merged.set(k, { i, q: [i.qty] }); }
        for (const [k, { i, q }] of merged) {
          const share = { meal: m.name, date: nt.d, qty: sumQty(q.filter(Boolean).map((x) => scaleQty(x, factor(m, nt.d)))) || "1" };
          const ex = open.find((s) => normName(s.name) === k);
          if (ex && ex.uid) { ex.for.push(share); await this._f.call("update_item", { item: ex.uid, description: composeShop(ex) }); }
          else {
            const nm = shopName(i.name);
            const s = { name: nm, qty: "", aisle: i.aisle || guessAisle(nm), for: [share], have: [], notes: "" };
            await this._f.call("add_item", { item: nm, description: composeShop(s) });
            // Read it back, so a later meal needing the same thing joins this line rather than making another.
            const again = await this._f.fetch();
            if (again) open = again.map(parseShop).filter((x) => !x.done); else open.push(Object.assign(s, { uid: null, done: false }));
          }
          n++;
        }
      }
    } finally { this._filling = false; }
    this._toast(`Added ${n} ingredient${n === 1 ? "" : "s"} to the list`);
  }

  // Drops a night's share from every open item; an item that was only for that night goes.
  async _dropNights(ds) {
    let n = 0;
    for (const s of (this._items || []).filter((x) => !x.done && x.for.some((f) => ds.includes(f.date)))) {
      s.for = s.for.filter((f) => !ds.includes(f.date));
      if (!s.for.length && !s.qty) await this._f.call("remove_item", { item: s.uid });
      else await this._f.call("update_item", { item: s.uid, description: composeShop(s) });
      n++;
    }
    for (const d of ds) this._past.delete(d);
    this._paint();
    this._toast(`Took ${ds.length === 1 ? longDay(ds[0]) : ds.length + " nights"} off · ${n} item${n === 1 ? "" : "s"}`);
  }

  // Pantry ingredients of meals planned from today on: kept off the list, but listed to check the cupboard against.
  // A tick is keyed on the meals and nights that need the item, so planning another meal that needs it asks again.
  _pantryChecks() {
    const t = today(), out = new Map(), cov = this._cov;
    for (const m of this._meals) for (const d of m.plan) {
      if (d < t || (this._sel.size && !this._sel.has(d))) continue;
      if (!this._sel.size && cov && d >= cov.f && d <= cov.u) continue; // the last shop covered it
      for (const i of m.ingredients) {
        if (!isPantry(i) || !i.name) continue;
        const k = normName(i.name);
        if (!out.has(k)) out.set(k, { name: i.name, for: [] });
        out.get(k).for.push({ meal: m.name, date: d, qty: scaleQty(i.qty, factor(m, d)) || "1" });
      }
    }
    return [...out.values()].map((p) => Object.assign(p, { key: normName(p.name) + "|" + p.for.map((f) => f.meal + "@" + f.date).sort().join(",") }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  _pantryHave() { try { return JSON.parse(localStorage.getItem(PANTRY_KEY) || "{}") || {}; } catch (e) { return {}; } }
  _pantrySet(all) { try { localStorage.setItem(PANTRY_KEY, JSON.stringify(all)); } catch (e) { /* storage off */ } }

  _pantryHtml(open) {
    const pc = this._pc = this._pantryChecks();
    if (!pc.length) return "";
    const have = this._pantryHave();
    // A line for it, open or already ticked into the trolley, means it is sorted; a "we have it" line counts as checked.
    const lines = (p) => (this._items || []).filter((s) => normName(s.name) === normName(p.name));
    const where = (p) => { const ls = lines(p); return ls.some((s) => !s.done && !isGhost(s)) ? "list" : ls.some((s) => s.done) ? "trolley" : ""; };
    const ghost = (p) => lines(p).some((s) => isGhost(s));
    const state = (p) => where(p) ? 2 : have[p.key] || ghost(p) ? 1 : 0;
    const left = pc.filter((p) => !state(p)).length;
    const rows = [...pc].sort((a, b) => state(a) - state(b)).map((p) => {
      const st = state(p), k = pc.indexOf(p);
      const days = [...new Set(p.for.map((f) => f.meal))].map((meal) => `<span class="chip" title="${esc(p.for.filter((f) => f.meal === meal).map((f) => longDay(f.date)).join(", "))}">${this._emojiFor(meal)} ${esc(meal)}</span>`).join("");
      return `<div class="it${st ? " done" : ""}" style="--gc:#ee8455">
        <button class="ck${st === 1 ? " on" : ""}" data-a="phave" data-k="${k}" aria-label="${st === 1 ? "Not sure I have" : "Have"} ${esc(p.name)}" ${st === 2 ? "disabled" : ""}>${st === 1 ? "✓" : ""}</button>
        <div class="tx" data-a="pedit" data-k="${k}"><div class="nm">${esc(p.name)}</div><div class="sb">${days}</div></div>
        <span class="qt">${esc(sumQty(p.for.map((f) => f.qty)))}</span>
        ${st === 2 ? `<span class="chip">${where(p) === "trolley" ? "🛒 In the trolley" : "On the list"}</span>` : `<button class="btn sm" data-a="padd" data-k="${k}">＋ List</button>`}</div>`;
    }).join("");
    return `<div class="grp pantry" style="--gc:#ee8455"><div class="gh" data-a="pfold" style="cursor:pointer"><span class="gi">🫙</span><span class="gn">Check the pantry</span>
      <span class="gc">${left ? left + " to check" : "All checked"} ${this._pOpen ? "▾" : "▸"}</span></div>
      ${this._pOpen ? `<div class="phint mut">For ${this._sel.size ? "the next shop" : "meals planned from today"}. Tick what's in the cupboard; ＋ List adds what you need.</div>${rows}` : ""}</div>`;
  }

  _aisleOfIng(name) { const k = normName(name); for (const m of this._meals || []) for (const i of m.ingredients) if (normName(i.name) === k && i.aisle) return i.aisle; return ""; }
  async _pantryAdd(p) {
    const ex = (this._items || []).find((s) => !s.done && normName(s.name) === normName(p.name));
    if (ex) {
      for (const f of p.for) if (!ex.for.some((x) => x.meal === f.meal && x.date === f.date)) ex.for.push(f);
      await this._f.call("update_item", { item: ex.uid, description: composeShop(ex) });
    } else {
      const nm = shopName(p.name);
      const s = { name: nm, qty: "", aisle: this._aisleOfIng(p.name) || "Pantry", for: p.for.map((f) => Object.assign({}, f)), have: [], notes: "" };
      await this._f.call("add_item", { item: nm, description: composeShop(s) });
    }
    this._toast("Added " + p.name);
  }

  // Two open lines for the same thing become one: the older line keeps the meals, quantities and notes of both.
  async _mergeDupes() {
    if (this._merging || !this._items || !this._f.canDescribe()) return;
    const groups = new Map();
    for (const s of this._items.filter((x) => !x.done)) { const k = normName(s.name); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); }
    const dupes = [...groups.values()].filter((g) => g.length > 1);
    if (!dupes.length) return;
    this._merging = true;
    try {
      for (const [keep, ...rest] of dupes) {
        for (const s of rest) {
          for (const f of s.for) if (!keep.for.some((x) => x.meal === f.meal && x.date === f.date)) keep.for.push(f);
          for (const f of s.have || []) if (!keep.have.some((x) => x.meal === f.meal && x.date === f.date)) keep.have.push(f);
          keep.qty = sumQty([keep.qty, s.qty].filter(Boolean));
          if (s.notes && !keep.notes.includes(s.notes)) keep.notes = [keep.notes, s.notes].filter(Boolean).join("\n");
        }
        await this._f.call("update_item", { item: keep.uid, description: composeShop(keep) });
        for (const s of rest) { try { await this._f.call("remove_item", { item: s.uid }); } catch (e) { /* the other screen got there first */ } }
      }
      this._toast(dupes.length === 1 ? "Merged a double-up: " + dupes[0][0].name : "Merged " + dupes.length + " double-ups");
    } finally { this._merging = false; }
  }

  _act(a, b) {
    if (a === "add") this._quickAdd();
    else if (a === "qk") this._addName(b.dataset.n, "");
    else if (a === "tick") { const s = this._item(b.dataset.uid); if (s) this._f.call("update_item", { item: s.uid, status: s.done ? "needs_action" : "completed" }); }
    else if (a === "clear") this._f.call("remove_completed_items", {});
    else if (a === "fold") { this._showDone = !this._showDone; this._paint(); }
    else if (a === "edit") this._sheetEdit(b.dataset.uid);
    else if (a === "have") { const s = this._item(b.dataset.uid); if (s) this._haveIt(s); }
    else if (a === "qkedit") this._sheetStaples();
    else if (a === "send") this._sheetSend();
    else if (a === "trolley") this._sheetTrolley();
    else if (a === "night") this._tapNight(b.dataset.d);
    else if (a === "shopdone") this._sheetDone();
    else if (a === "srl" || a === "srr") this._rowScroll(b, a === "srr" ? 1 : -1);
    else if (a === "nfill") this._fillNights([...this._sel]);
    else if (a === "ndrop") { if (this._past.size) this._dropNights([...this._past]); }
    else if (a === "pfold") { this._pOpen = !this._pOpen; this._paint(); }
    else if (a === "pedit") { const p = (this._pc || [])[Number(b.dataset.k)]; if (p) this._sheetPantry(p); }
    else if (a === "padd") { const p = (this._pc || [])[Number(b.dataset.k)]; if (p) this._pantryAdd(p); }
    else if (a === "phave") {
      const p = (this._pc || [])[Number(b.dataset.k)]; if (!p) return;
      const all = this._pantryHave();
      // A "we have it" line (left when ✕ took it off the list) also ticks it, so unticking clears that too.
      const ghosts = (this._items || []).filter((s) => isGhost(s) && normName(s.name) === normName(p.name));
      if (all[p.key] || ghosts.length) {
        delete all[p.key];
        for (const g of ghosts) { this._items = this._items.filter((s) => s !== g); this._f.call("remove_item", { item: g.uid }).catch(() => {}); }
      } else all[p.key] = Date.now();
      for (const k of Object.keys(all)) if (Date.now() - all[k] > 30 * 864e5) delete all[k];
      this._pantrySet(all); this._paint();
    }
  }

  // The open items as plain text, aisle by aisle, for pasting anywhere.
  _listText() {
    const open = (this._items || []).filter((s) => !s.done && !isGhost(s) && this._inSel(s));
    const t = today();
    const out = [`Shopping list, ${dayNum(t)} ${monShort(t)}` + (this._rng ? " · for " + this._rngTxt() : "")];
    for (const a of this._aisles) {
      const its = open.filter((s) => this._aisle(s.aisle).name === a.name).sort((x, y) => x.name.localeCompare(y.name));
      if (!its.length) continue;
      out.push("", a.name);
      for (const s of its) out.push("- " + s.name + (this._tot(s) ? " (" + this._tot(s) + ")" : "") + (s.notes ? " - " + s.notes.split("\n")[0] : ""));
    }
    return out.join("\n");
  }

  _sheetSend() {
    const text = this._listText();
    const n = (this._items || []).filter((s) => !s.done && !isGhost(s) && this._inSel(s)).length;
    const canShare = !!navigator.share;
    const html = `<div class="pad">
      <h2>Send the list</h2>
      <p class="mut" style="margin:6px 0 12px;font-size:13px">${n} item${n === 1 ? "" : "s"} in aisle order. ${canShare ? "Share it straight to an app, or copy it" : "Copy it"} and paste it into the supermarket app, a message or notes.</p>
      <textarea class="i snd" readonly>${esc(text)}</textarea>
      </div>
      <div class="foot"><button class="btn" data-a="close">Close</button><span class="sp"></span>
        <button class="btn" data-a="done">✓ Done shopping…</button>${canShare ? `<button class="btn" data-a="share">📤 Share…</button>` : ""}<button class="btn pri" data-a="copy">📋 Copy</button></div>`;
    const ov = this._openSheet(html, async (a) => {
      if (a === "close") this._closeSheet();
      else if (a === "done") this._sheetDone();
      else if (a === "share") { try { await navigator.share({ title: "Shopping list", text }); } catch (e) { /* cancelled */ } }
      else if (a === "copy") this._toast(await this._copy(text, ov.querySelector("textarea")) ? "Copied. Paste it wherever you like." : "Couldn't copy here. Select the text and copy it.");
    });
    ov.querySelector("textarea").addEventListener("focus", (e) => e.target.select());
  }

  // navigator.clipboard needs https; on a plain-http panel fall back to selecting the text and execCommand.
  async _copy(text, ta) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* fall through */ }
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, text.length); return document.execCommand("copy"); } catch (e) { return false; }
  }

  // The quick-add chips, one item each in the staples list.
  _sheetStaples(refresh) {
    const list = this._staples || [];
    const rows = list.length ? `<div class="stl">${list.map((x) => `<div class="str"><span class="nm">${esc(x.name)}</span>
      <button class="rm" data-a="srm" data-uid="${esc(x.uid)}" aria-label="Remove ${esc(x.name)}">✕</button></div>`).join("")}</div>` : `<p class="mut">No quick-add items yet.</p>`;
    if (refresh && this._ov) { const el = this._ov.querySelector("#strows"); if (el) el.innerHTML = rows; return; }
    const html = `<div class="pad">
      <h2>Quick-add items</h2>
      <p class="mut" style="margin:6px 0 12px;font-size:13px">One tap on the list adds these. Add the things you buy most weeks.</p>
      <div id="strows">${rows}</div>
      <div class="sta"><input class="i" id="stnew" placeholder="e.g. Sourdough" enterkeyhint="done" autocomplete="off"><button class="btn pri" data-a="sadd">＋ Add</button></div>
      </div>
      <div class="foot"><span class="sp"></span><button class="btn pri" data-a="close">Done</button></div>`;
    const add = async () => {
      const el = this._ov && this._ov.querySelector("#stnew"); if (!el) return;
      let v = el.value.trim(); if (!v) return;
      v = v.charAt(0).toUpperCase() + v.slice(1);
      el.value = ""; el.focus();
      if ((this._staples || []).some((x) => normName(x.name) === normName(v))) { this._toast(v + " is already there"); return; }
      await this._stf.call("add_item", { item: v });
    };
    const ov = this._openSheet(html, async (a, b) => {
      if (a === "close") this._closeSheet();
      else if (a === "sadd") add();
      else if (a === "srm") await this._stf.call("remove_item", { item: b.dataset.uid });
    });
    ov.querySelector("#stnew").addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
    this._sheet = "staples";
  }

  _quickAdd() {
    const el = this.shadowRoot.getElementById("add");
    const v = el.value.trim(); if (!v) return;
    const m = v.match(/^(\d+(?:[.,/]\d+)?\s*(?:kg|g|ml|l|L|x|×|pk|packs?|bags?|jars?|tins?|cans?|bottles?|dozen)?)\s+(.+)$/i);
    let qty = m ? m[1].replace(/\s*[x×]$/i, "").trim() : "", name = m ? m[2] : v;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    this._addName(name, qty);
    el.value = ""; el.focus();
  }

  // Typing something already on the list adds to it as an extra of its own (1 if no amount is given),
  // on top of what the meals need: the meals' shares are untouched, so it stays when a meal is unplanned.
  async _addName(name, qty) {
    const same = (s) => !s.done && normName(s.name) === normName(name);
    const ex = (this._items || []).find((s) => same(s) && !isGhost(s)) || (this._items || []).find((s) => same(s) && this._f.canDescribe());
    if (ex && this._f.canDescribe()) {
      const before = ex.qty;
      ex.qty = sumQty([ex.qty || (ex.for.length || isGhost(ex) ? "" : "1"), qty || "1"].filter(Boolean)) || qty || "1";
      await this._f.call("update_item", { item: ex.uid, description: composeShop(ex) });
      const tot = sumQty([ex.qty, ...ex.for.map((f) => f.qty)].filter(Boolean));
      this._toast(ex.for.length ? `${shopName(ex.name)} · ${ex.qty} extra on top of the meals · ${tot} in all` : `${shopName(ex.name)} · now ${tot}`);
      return;
    }
    const s = { name, qty, aisle: guessAisle(name), for: [], have: [], notes: "" };
    if (this._f.canDescribe()) await this._f.call("add_item", { item: name, description: composeShop(s) });
    else await this._f.call("add_item", { item: name + (qty ? " (" + qty + ")" : "") });
    this._toast("Added " + name);
  }

  // "We have it": off the list now. Its planned nights are remembered under have:, so the shop's ＋ and
  // re-saving the meal don't bring it back; a line added by hand just goes.
  async _haveIt(s) {
    const keep = s.for.filter((f) => ISO.test(f.date));
    s.have = [...(s.have || []), ...keep.filter((f) => !(s.have || []).some((x) => x.meal === f.meal && x.date === f.date))];
    s.for = []; s.qty = "";
    if (!s.have.length) await this._f.call("remove_item", { item: s.uid });
    else await this._f.call("update_item", { item: s.uid, description: composeShop(s) });
    this._toast(shopName(s.name) + " taken off the list");
  }

  // Keeps the list in step with the meals: a meal's share goes when the meal no longer uses that ingredient
  // (or the night was unplanned), brackets come off names, and old "we have it" notes expire.
  async _tidy() {
    if (this._tidying || !this._items || !this._meals.length || !this._f.canDescribe()) return;
    this._tidying = true;
    const t = today();
    let n = 0;
    try {
      for (const s of this._items.filter((x) => !x.done)) {
        const k = normName(s.name);
        const ok = (f, have) => {
          const m = this._meals.find((x) => x.name === f.meal); if (!m) return true; // a meal we can't see (renamed mid-save): leave it
          const ings = m.ingredients.filter((i) => normName(i.name) === k);
          if (!ings.length) return false;
          if (!ISO.test(f.date)) return !have || m.plan.some((d) => d >= t);
          if (f.date < t) return !have;
          return m.plan.includes(f.date);
        };
        const nf = s.for.filter((f) => ok(f, false)), nh = (s.have || []).filter((f) => ok(f, true)), nm = shopName(s.name);
        if (nf.length === s.for.length && nh.length === (s.have || []).length && nm === s.name) continue;
        // Never empty a line that had shares here and still has a hand-added quantity: just drop the shares.
        const was = s.for.length + (s.have || []).length;
        s.for = nf; s.have = nh;
        try {
          if (was && !s.for.length && !s.qty && !s.have.length) await this._f.call("remove_item", { item: s.uid });
          else await this._f.call("update_item", { item: s.uid, rename: nm, description: composeShop(Object.assign(s, { name: nm })) });
          n++;
        } catch (e) { /* another screen changed it first */ }
      }
    } finally { this._tidying = false; }
    return n;
  }

  // Whether the meals that use this treat it as a pantry staple; null when no meal uses it.
  _stapleOf(name) {
    const k = normName(name), hits = this._meals.flatMap((m) => m.ingredients.filter((i) => normName(i.name) === k));
    return hits.length ? hits.some((i) => isPantry(i)) : null;
  }
  _stapleHtml(name) {
    const st = this._stapleOf(name), n = this._meals.filter((m) => m.ingredients.some((i) => normName(i.name) === normName(name))).length;
    if (st === null || !this._mf) return "";
    return `<label class="f">In ${n} meal${n === 1 ? "" : "s"}</label><div class="tg"><span class="chip${st ? " on" : ""}" data-a="pst" data-k="1">⭐ Pantry staple</span><span class="chip${st ? "" : " on"}" data-a="pst" data-k="0">Always on the list</span></div>
      <div class="mut" style="font-size:12.5px;margin-top:6px">A staple stays off the list and shows under Check the pantry, so you only add it when you're out.</div>
      <div class="tg" style="margin-top:10px"><span class="chip${this._frozenOf(name) ? " on" : ""}" data-a="frz">❄️ Needs defrosting</span></div>
      <div class="mut" style="font-size:12.5px;margin-top:6px">Frozen things get a reminder the morning their meal is planned.</div>`;
  }
  _frozenOf(name) { const k = normName(name); return this._meals.some((m) => m.ingredients.some((i) => normName(i.name) === k && i.frozen)); }
  async _frozenTap(name) {
    this._closeSheet();
    const k = normName(name), on = !this._frozenOf(name);
    for (const m of this._meals) {
      const ings = m.ingredients.filter((i) => normName(i.name) === k); if (!ings.length) continue;
      for (const i of ings) i.frozen = on;
      await this._mf.call("update_item", { item: m.uid, rename: m.name, description: composeMeal(m) });
    }
    this._toast(on ? `❄️ ${name} needs defrosting now` : `${name} no longer needs defrosting`);
  }
  async _stapleTap(name, on) {
    this._closeSheet();
    if (this._stapleOf(name) === on) return;
    await this._setStaple(name, on);
    this._toast(on ? `⭐ ${name} is a pantry staple now` : `${name} will go on the list for its meals`);
  }

  // Makes an ingredient a staple (or not) in every meal that uses it, then moves its planned shares off (or onto) the list.
  async _setStaple(name, on) {
    const k = normName(name), t = today(), back = [];
    let aisle = "";
    for (const m of this._meals) {
      const ings = m.ingredients.filter((i) => normName(i.name) === k); if (!ings.length) continue;
      for (const i of ings) { i.staple = on; i.list = !on && PANTRY_AISLES.includes(i.aisle); aisle = aisle || i.aisle; }
      await this._mf.call("update_item", { item: m.uid, rename: m.name, description: composeMeal(m) });
      if (!on) for (const d of m.plan) if (d >= t) back.push({ meal: m.name, date: d, qty: sumQty(ings.map((i) => scaleQty(i.qty, factor(m, d))).filter(Boolean)) || "1" });
    }
    const ex = (this._items || []).find((x) => !x.done && normName(x.name) === k);
    if (on) {
      if (!ex) return;
      // Shares for planned nights come off; anything added by hand or from a meal sheet stays.
      ex.for = ex.for.filter((f) => !ISO.test(f.date));
      if (!ex.for.length && !ex.qty) await this._f.call("remove_item", { item: ex.uid });
      else await this._f.call("update_item", { item: ex.uid, description: composeShop(ex) });
    } else if (back.length) {
      if (ex) {
        for (const f of back) if (!ex.for.some((x) => x.meal === f.meal && x.date === f.date)) ex.for.push(f);
        await this._f.call("update_item", { item: ex.uid, description: composeShop(ex) });
      } else await this._f.call("add_item", { item: shopName(name), description: composeShop({ name: shopName(name), qty: "", aisle: aisle || guessAisle(name), for: back, have: [], notes: "" }) });
    }
  }

  _sheetPantry(p) {
    const html = `<div class="pad"><h2>${esc(p.name)}</h2>
      <p class="mut" style="margin:6px 0 0;font-size:14px">For ${[...new Set(p.for.map((f) => this._emojiFor(f.meal) + " " + f.meal + " (" + dayWord(f.date) + ")"))].map(esc).join(", ")}</p>
      ${this._stapleHtml(p.name)}</div>
      <div class="foot"><span class="sp"></span><button class="btn pri" data-a="close">Close</button></div>`;
    this._openSheet(html, (a, b) => { if (a === "close") this._closeSheet(); else if (a === "pst") this._stapleTap(p.name, b.dataset.k === "1"); else if (a === "frz") this._frozenTap(p.name); });
  }

  _sheetEdit(uid) {
    const s0 = this._item(uid); if (!s0) return;
    const s = JSON.parse(JSON.stringify(s0));
    const html = `<div class="pad">
      <h2>Edit item</h2>
      <label class="f">Name</label><input class="i" data-f="name" value="${esc(s.name)}">
      <label class="f">${s.for.length ? "Extra quantity (on top of the meals below)" : "Quantity"}</label><input class="i" data-f="qty" value="${esc(s.qty)}" placeholder="e.g. 2 L">
      ${s.for.length ? `<div class="fromm mut">From meals: ${s.for.map((f) => `${this._emojiFor(f.meal)} ${esc(f.meal)}${ISO.test(f.date) ? " (" + dayWord(f.date) + ")" : ""} ${esc(f.qty)}`).join(" · ")}</div>` : ""}
      <label class="f">Aisle</label>
      <div class="ais">${this._aisles.map((a) => `<span class="chip${a.name === this._aisle(s.aisle).name ? " on" : ""}" style="--ac:${a.colour}" data-a="ais" data-n="${esc(a.name)}">${a.icon} ${esc(a.name)}</span>`).join("")}</div>
      <label class="f">Note</label><input class="i" data-f="notes" value="${esc(s.notes)}" placeholder="Brand, size, “only if on special”…">
      ${this._stapleHtml(s0.name)}
      </div>
      <div class="foot"><button class="btn del" data-a="del">✕ Take off the list</button>
        ${this._stf && !(this._staples || []).some((x) => normName(x.name) === normName(s.name)) ? `<button class="btn" data-a="staple">＋ Quick-add</button>` : ""}
        <span class="sp"></span><button class="btn" data-a="cancel">Cancel</button><button class="btn pri" data-a="save">Save</button></div>`;
    const ov = this._openSheet(html, async (a, b) => {
      if (a === "cancel") this._closeSheet();
      else if (a === "staple") { await this._stf.call("add_item", { item: s.name.trim() || s0.name }); b.remove(); this._toast((s.name.trim() || s0.name) + " added to quick-add"); }
      else if (a === "pst") this._stapleTap(s0.name, b.dataset.k === "1");
      else if (a === "frz") this._frozenTap(s0.name);
      else if (a === "ais") { s.aisle = b.dataset.n; ov.querySelectorAll(".ais .chip").forEach((x) => x.classList.toggle("on", x === b)); }
      else if (a === "del") { this._closeSheet(); await this._haveIt(s0); }
      else if (a === "save") {
        s.name = s.name.trim() || s0.name;
        await this._f.call("update_item", { item: uid, rename: s.name, description: composeShop(s) });
        this._closeSheet();
      }
    }, (e) => { const f = e.target.dataset.f; if (f) s[f] = e.target.value; }, { guard: true });
  }
}

