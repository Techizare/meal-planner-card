class MealPlannerCard extends MPBase {
  setConfig(config) {
    if (!config || !config.meals_entity) throw new Error("meal-planner-card: meals_entity is required (a todo.* list)");
    this._cfg = Object.assign({ title: "Meals", shopping_entity: null, busy_calendars: ["calendar.cherisha_work"], busy_label: "Cherisha working",
      busy_from: "16:00", busy_to: "19:30", quick_mins: 30, defrost_time: "06:00" }, config);
    if (Array.isArray(config.aisles) && config.aisles.length) this._aisles = config.aisles;
    this._meals = null; this._shop = []; this._q = ""; this._tag = "All"; this._wk = 0;
  }
  getCardSize() { return 14; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  _start() {
    this._started = true;
    this._feeds = [];
    this._mf = new TodoFeed(this._cfg.meals_entity, (items, err) => {
      this._err = err || null;
      this._meals = items ? items.map(parseMeal).sort((a, b) => a.name.localeCompare(b.name)) : (this._meals || []);
      this._paint();
      if (this._sheet && this._sheet.kind === "meal") this._sheetMeal(this._sheet.uid, true);
    });
    this._feeds.push(this._mf);
    if (this._cfg.shopping_entity) {
      this._sf = new TodoFeed(this._cfg.shopping_entity, (items) => {
        this._shop = items ? items.map(parseShop) : this._shop;
        if (this._sheet && this._sheet.kind === "meal") this._sheetMeal(this._sheet.uid, true);
      });
      this._feeds.push(this._sf);
    }
    for (const f of this._feeds) f.start(this._hass);
    if (!this._timer) this._timer = setInterval(() => { if (today() !== this._t) this._paint(); }, 60000);
    this._build();
  }

  _build() {
    if (this._built) return;
    this._built = true;
    this.shadowRoot.innerHTML = `<style>${PL_STYLE}</style><ha-card><div id="body"></div></ha-card>`;
    const card = this.shadowRoot.querySelector("ha-card");
    card.addEventListener("click", (e) => {
      if (this._noClick) { this._noClick = false; e.stopPropagation(); return; }
      const b = e.target.closest("[data-a]"); if (b) this._act(b.dataset.a, b);
    });
    card.addEventListener("input", (e) => { if (e.target.id === "q") { this._q = e.target.value; this._paintLib(); } });
    this._dragSetup(card);
    this._paint();
  }

  // ---------- drag a meal idea onto a night ----------
  // Pointer events rather than HTML5 drag and drop, which does nothing on a touchscreen.

  _dragSetup(card) {
    card.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || this._drag) return;
      const tile = e.target.closest(".lib .ml[data-uid]"); if (!tile) return;
      const touch = e.pointerType !== "mouse";
      const g = this._drag = { uid: tile.dataset.uid, tile, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, on: false };
      if (touch) g.timer = setTimeout(() => { if (this._drag === g) this._dragStart(); }, 280);
    });
    window.addEventListener("pointermove", (e) => {
      const g = this._drag; if (!g || e.pointerId !== g.id) return;
      g.x = e.clientX; g.y = e.clientY;
      const far = Math.hypot(g.x - g.x0, g.y - g.y0) > 8;
      if (!g.on) {
        if (!far) return;
        if (e.pointerType === "mouse") this._dragStart(); else { this._dragEnd(); return; }  // a swipe before the hold: let it scroll
      }
      this._dragMove();
    });
    window.addEventListener("pointerup", (e) => { const g = this._drag; if (g && e.pointerId === g.id) this._dragEnd(true); });
    window.addEventListener("pointercancel", (e) => { const g = this._drag; if (g && e.pointerId === g.id) this._dragEnd(); });
    // Once a held tile is lifted, stop the finger from scrolling the page.
    card.addEventListener("touchmove", (e) => { if (this._drag && this._drag.on) e.preventDefault(); }, { passive: false });
    card.addEventListener("contextmenu", (e) => { if (this._drag) e.preventDefault(); });
  }

  _dragStart() {
    const g = this._drag; const m = this._meal(g.uid); if (!m) { this._dragEnd(); return; }
    g.on = true;
    g.tile.classList.add("lift");
    this.shadowRoot.querySelector("ha-card").classList.add("dragging");
    const gh = g.ghost = document.createElement("div"); gh.className = "ghost";
    gh.innerHTML = thumb(m) + `<div class="n">${esc(m.name)}</div>`;
    this.shadowRoot.appendChild(gh);
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) { /* not allowed */ }
    this._dragMove();
  }

  _dragMove() {
    const g = this._drag; if (!g || !g.on) return;
    g.ghost.style.left = g.x + "px"; g.ghost.style.top = g.y + "px";
    const el = this.shadowRoot.elementFromPoint(g.x, g.y);
    const dy = el && el.closest(".dy");
    const over = dy && !dy.classList.contains("past") ? dy : null;
    if (over !== g.over) { if (g.over) g.over.classList.remove("over"); if (over) over.classList.add("over"); g.over = over; }
    // Near the top or bottom of the screen, scroll so the week strip can be reached from far down the library.
    const edge = 70, h = window.innerHeight;
    const v = g.y < edge ? -(edge - g.y) / 4 : g.y > h - edge ? (g.y - (h - edge)) / 4 : 0;
    if (v && !g.raf) {
      const step = () => {
        const d = this._drag; if (!d || !d.on) return;
        const vv = d.y < edge ? -(edge - d.y) / 4 : d.y > h - edge ? (d.y - (h - edge)) / 4 : 0;
        if (!vv) { d.raf = 0; return; }
        this._scroller().scrollBy(0, vv); this._dragMoveNoScroll(); d.raf = requestAnimationFrame(step);
      };
      g.raf = requestAnimationFrame(step);
    }
    // On a phone the week strip scrolls sideways; nudge it when the tile is near either end.
    const wk = this.shadowRoot.querySelector(".narrow .wk");
    if (wk) { const r = wk.getBoundingClientRect(); if (g.y > r.top && g.y < r.bottom) { if (g.x < r.left + 40) wk.scrollLeft -= 12; else if (g.x > r.right - 40) wk.scrollLeft += 12; } }
  }
  _dragMoveNoScroll() {
    const g = this._drag; const el = this.shadowRoot.elementFromPoint(g.x, g.y); const dy = el && el.closest(".dy");
    const over = dy && !dy.classList.contains("past") ? dy : null;
    if (over !== g.over) { if (g.over) g.over.classList.remove("over"); if (over) over.classList.add("over"); g.over = over; }
  }

  // The nearest ancestor that actually scrolls, crossing shadow roots (HA scrolls a view container, not always the window).
  _scroller() {
    let n = this;
    while (n) {
      n = n.parentNode || n.host;
      if (n && n.nodeType === 1) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight) return n; }
      if (n === document) break;
    }
    return document.scrollingElement || document.documentElement;
  }

  async _dragEnd(drop) {
    const g = this._drag; if (!g) return;
    this._drag = null;
    clearTimeout(g.timer); if (g.raf) cancelAnimationFrame(g.raf);
    if (!g.on) return;
    this._noClick = true; setTimeout(() => { this._noClick = false; }, 400);
    g.tile.classList.remove("lift");
    if (g.ghost) g.ghost.remove();
    if (g.over) g.over.classList.remove("over");
    const card = this.shadowRoot.querySelector("ha-card"); if (card) card.classList.remove("dragging");
    if (!drop || !g.over) return;
    const d = g.over.dataset.d; const m = this._meal(g.uid); if (!m || !d) return;
    if (m.plan.includes(d)) { this._toast(`${m.name} is already on ${d === today() ? "tonight" : DOW_LONG[dowIdx(d)]}`); return; }
    await this._togglePlan(g.uid, d);
  }

  // ---------- painting ----------

  _paint() {
    if (!this._built) return;
    const t = this._t = today();
    const body = this.shadowRoot.getElementById("body");
    if (this._meals === null) { body.innerHTML = `<div class="mut">Loading meals…</div>`; return; }
    const ws = addDays(weekStart(t), this._wk * 7);
    const planned = (d) => this._meals.filter((m) => m.plan.includes(d));
    const tonight = planned(t);
    let nPlanned = 0;
    for (let i = 0; i < 7; i++) if (planned(addDays(ws, i)).length) nPlanned++;

    let tn;
    if (tonight.length) {
      const m = tonight[0];
      tn = `<div class="tn">${thumb(m).replace('class="th "', `class="th" data-a="open" data-uid="${esc(m.uid)}"`)}
        <div class="bd"><div class="k">Tonight · ${DOW_LONG[dowIdx(t)]}</div><div class="n">${esc(m.name)}</div>
        <div class="mt">${m.mins ? `<span class="chip">⏱ ${esc(m.mins)} min</span>` : ""}<span class="chip${factor(m, t) !== 1 ? " on" : ""}" data-a="day" data-d="${t}" style="cursor:pointer" title="Tap to change how many people">👥 For ${nightServes(m, t)} tonight</span>
        ${noIngs(m) ? `<span class="chip noi" data-a="open" data-uid="${esc(m.uid)}" style="cursor:pointer">⚠️ No ingredients</span>` : ""}${m.tags.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>
        ${tonight.length > 1 ? `<div class="mut" style="font-size:13px">Also: ${tonight.slice(1).map((x) => esc(x.name)).join(", ")}</div>` : ""}
        <div class="act">${m.cooked === t ? `<span class="chip" style="background:#43a04722;color:#43a047">✓ Cooked</span>` : `<button class="btn pri" data-a="cooked" data-uid="${esc(m.uid)}">✓ We had this</button>`}
        <button class="btn" data-a="open" data-uid="${esc(m.uid)}">Ingredients</button><button class="btn" data-a="day" data-d="${t}">Swap</button></div></div></div>`;
    } else {
      tn = `<div class="tn empty"><div class="bd"><div class="k">Tonight · ${DOW_LONG[dowIdx(t)]}</div><div class="n">Nothing planned yet</div>
        <div class="act"><button class="btn pri" data-a="day" data-d="${t}">Pick a meal</button><button class="btn" data-a="surprise">🎲 Surprise me</button></div></div></div>`;
    }

    let wk = "";
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i); const ms = planned(d);
      const cls = "dy" + (d === t ? " td" : "") + (d < t ? " past" : "");
      const fz = d >= t && ms.some((m) => m.ingredients.some((x) => x.frozen));
      // The count for the meal shown on the tile; filled in when it isn't the usual number.
      const sv = ms[0];
      const head = `<div class="dh"><span class="dn">${d === t ? "Today" : DOW[i]}</span><span class="dd">${dayNum(d)} ${monShort(d)}</span>${fz ? `<span class="fz" title="Something to defrost">❄️</span>` : ""}</div>`;
      const svb = sv ? `<span class="svb${factor(sv, d) !== 1 ? " ch" : ""}" title="${esc(sv.name)} for ${nightServes(sv, d)}${factor(sv, d) !== 1 ? ` (usually ${servesN(sv)})` : ""}">👥 ${nightServes(sv, d)}</span>` : "";
      if (ms.length) {
        wk += `<div class="${cls}" data-a="day" data-d="${d}">${head}${thumb(ms[0])}${svb}<div class="mn">${hpill(ms[0])}${noIngs(ms[0]) ? `<span class="noi" title="No ingredients: nothing for it on the shopping list">⚠️ </span>` : ""}${esc(ms[0].name)}</div>${ms.length > 1 ? `<div class="more">+${ms.length - 1} more</div>` : ""}</div>`;
      } else {
        wk += `<div class="${cls}" data-a="day" data-d="${d}">${head}<div class="add">+</div></div>`;
      }
    }
    const nFill = this._fillDays().length;
    // The week's average health: every planned meal with a rating (yours or the estimate), each night's meals all counted.
    const wkH = []; for (let i = 0; i < 7; i++) for (const m of planned(addDays(ws, i))) { const h = healthOf(m); if (h) wkH.push(h.score); }
    const wkAvg = wkH.length ? wkH.reduce((a, b) => a + b, 0) / wkH.length : null;
    const wkB = wkAvg != null ? healthBand(Math.round(wkAvg)) : null;
    const wkLabel = this._wk === 0 ? "This week" : this._wk === 1 ? "Next week" : this._wk === -1 ? "Last week" : `Week of ${dayNum(ws)} ${monShort(ws)}`;

    const tags = ["All", ...new Set(this._meals.flatMap((m) => m.tags))];
    // Meals with nothing to shop for get their own filter, so they're easy to find and fill in.
    const nNoi = this._meals.filter(noIngs).length;
    if (this._tag === NOI && !nNoi) this._tag = "All";
    const shut = this._ideasShut();
    body.innerHTML = `
      ${this._err ? `<div class="warn">${esc(this._err)} Create a Local To-do list called “Meals” (Settings → Integrations → Local To-do).</div>` : ""}
      ${this._sf && this._hass.states[this._cfg.shopping_entity] && !this._sf.canDescribe() ? `<div class="warn">${esc(this._cfg.shopping_entity)} can’t store quantities or aisles. Point shopping_entity at a Local To-do list.</div>` : ""}
      ${tn}
      ${this._defrostHtml()}
      <div class="sec"><span class="l">${wkLabel}</span><span class="chip">${nPlanned}<span class="wl"> of 7 nights planned</span><span class="ws">/7</span></span>${wkB ? `<span class="chip hav" style="--hc:${wkB[2]}" title="Average health rating of the ${wkH.length} rated meal${wkH.length === 1 ? "" : "s"} planned this week (estimates, or your own rating where you set one)">🩺<span class="wl"> Avg</span> <b>${wkAvg.toFixed(1)}</b> · ${wkB[1]}</span>` : ""}<span class="sp"></span>
        ${nFill ? `<button class="btn sm fillb" data-a="fill" title="Draft dinners for the empty nights">✨ Fill my week</button>` : ""}
        <button class="btn sm ico" data-a="wk" data-k="-1" aria-label="Previous week">‹</button>
        ${this._wk ? `<button class="btn sm" data-a="wk" data-k="0">Today</button>` : ""}
        <button class="btn sm ico" data-a="wk" data-k="1" aria-label="Next week">›</button></div>
      <div class="wk">${wk}</div>
      ${nFill ? `<button class="btn fillb fillb2" data-a="fill">✨ Fill my week · ${nFill} empty night${nFill === 1 ? "" : "s"}</button>` : ""}
      <div class="sec"><span class="l fold" data-a="ideas" role="button" aria-expanded="${!shut}">${shut ? "▸" : "▾"} Meal ideas</span><span class="chip" data-a="ideas" style="cursor:pointer">${this._meals.length}</span><span class="sp"></span>
        ${shut ? "" : `<span class="hint">Drag one onto a night to plan it</span>`}<button class="btn sm" data-a="new">＋ New meal</button></div>
      ${shut ? `<div class="shut mut" data-a="ideas">Meal ideas are folded away. Tap to show all ${this._meals.length}.</div>` : `<div class="fl"><input class="i" id="q" placeholder="Search meals or ingredients" value="${esc(this._q)}">
        <div class="tgw">${this._rowHtml("tg", tags.map((x) => `<span class="chip${x === this._tag ? " on" : ""}" data-a="tag" data-t="${esc(x)}">${esc(x)}</span>`).join("")
          + (nNoi ? `<span class="chip noi${this._tag === NOI ? " on" : ""}" data-a="tag" data-t="${NOI}" title="Meals with no ingredients: planning them adds nothing to the shopping list">⚠️ No ingredients · ${nNoi}</span>` : ""), "tg")}</div></div>
      <div id="lib"></div>`}`;
    this._paintLib();
    this._resize();
    this._scrollToday();
  }

  // On a phone the week scrolls sideways; start it at today rather than Monday.
  _scrollToday() {
    const wk = this.shadowRoot.querySelector(".narrow .wk"); if (!wk) return;
    const td = wk.querySelector(".dy.td"); if (td) wk.scrollLeft = Math.max(0, td.offsetLeft - 16);
  }
  _resize() { super._resize(); this._scrollToday(); this._rows(); }

  _paintLib() {
    const el = this.shadowRoot.getElementById("lib"); if (!el) return;
    const t = this._t || today();
    if (!this._meals.length) {
      el.innerHTML = `<div class="empty-lib"><div style="font-size:40px">🍽️</div><p>No meals saved yet.</p>
        <button class="btn pri" data-a="new">＋ Add a meal</button> <button class="btn" data-a="seed">Load ${PLACEHOLDER_MEALS.length} example meals</button></div>`;
      return;
    }
    const q = this._q.trim().toLowerCase();
    const ws = weekStart(t);
    // Least recently had first, so meals we haven't had for a while are the ones on show; meals already planned ahead go last.
    const ahead = (m) => m.plan.some((d) => d > t) ? 1 : 0;
    const list = this._meals.filter((m) => (this._tag === "All" || (this._tag === NOI ? noIngs(m) : m.tags.includes(this._tag))) &&
      (!q || m.name.toLowerCase().includes(q) || m.ingredients.some((i) => i.name.toLowerCase().includes(q)) || m.tags.some((x) => x.toLowerCase().includes(q))))
      .sort((a, b) => ahead(a) - ahead(b) || lastHad(a, t).localeCompare(lastHad(b, t)) || a.name.localeCompare(b.name));
    el.innerHTML = `<div class="lib">${list.map((m) => {
      const next = m.plan.filter((d) => d >= t).sort()[0];
      const pin = next ? (next === t ? "Tonight" : daysBetween(ws, next) < 7 ? DOW[dowIdx(next)] : `${dayNum(next)} ${monShort(next)}`) : "";
      return `<div class="ml" data-a="open" data-uid="${esc(m.uid)}">${pin ? `<span class="pin">📅 ${pin}</span>` : ""}${popular(m, t) ? `<span class="pop" title="Popular in our house">🔥</span>` : ""}${thumb(m)}
        <div class="b"><div class="n">${esc(m.name)}</div><div class="m">${hpill(m)}${m.mins ? esc(m.mins) + " min · " : ""}${esc(ago(lastHad(m, t), t))}</div>${noIngs(m) ? `<div class="m noi">⚠️ No ingredients</div>` : ""}</div></div>`;
    }).join("")}<div class="ml new" data-a="new"><span class="plus">＋</span><span>New meal</span></div></div>
    ${list.length ? "" : `<p class="mut">No meals match.</p>`}`;
  }

  // ---------- actions ----------

  _meal(uid) { return (this._meals || []).find((m) => m.uid === uid); }

  // Folding Meal ideas is remembered on this screen, so the panel and a phone can differ.
  _ideasShut() { try { return localStorage.getItem("meal-planner-ideas-shut") === "1"; } catch (e) { return false; } }
  _ideasToggle() { const v = !this._ideasShut(); try { localStorage.setItem("meal-planner-ideas-shut", v ? "1" : "0"); } catch (e) { /* storage off */ } this._paint(); }

  // Today's frozen ingredients, until someone taps Taken out (remembered on this screen for today).
  _defrostList(d) {
    return this._meals.filter((m) => m.plan.includes(d)).flatMap((m) => m.ingredients.filter((x) => x.frozen).map((x) => ({ m, x: Object.assign({}, x, { qty: scaleQty(x.qty, factor(m, d)) }) })));
  }
  _defrostHtml() {
    const t = today(), list = this._defrostList(t);
    let off = false; try { off = localStorage.getItem("meal-planner-defrost") === t; } catch (e) { /* storage off */ }
    if (!list.length || off) return "";
    return `<div class="dfz"><span class="t">❄️ <b>Take out of the freezer:</b> ${list.map(({ m, x }) => `${esc(x.qty ? x.qty + " " : "")}${esc(x.name)} <span class="mut">(${esc(m.name)})</span>`).join(", ")}</span>
      <button class="btn sm" data-a="dfzok">✓ Taken out</button></div>`;
  }

  _act(a, b) {
    const uid = b.dataset.uid;
    if (a === "dfzok") { try { localStorage.setItem("meal-planner-defrost", today()); } catch (e) { /* storage off */ } this._paint(); return; }
    if (a === "open") this._sheetMeal(uid);
    else if (a === "srl" || a === "srr") this._rowScroll(b, a === "srr" ? 1 : -1);
    else if (a === "day") this._sheetPick(b.dataset.d);
    else if (a === "wk") { this._wk = b.dataset.k === "0" ? 0 : this._wk + Number(b.dataset.k); this._paint(); }
    else if (a === "tag") { this._tag = b.dataset.t; this._paint(); }
    else if (a === "new") this._sheetEdit(null);
    else if (a === "ideas") this._ideasToggle();
    else if (a === "fill") this._fillWeek();
    else if (a === "seed") this._seed();
    else if (a === "cooked") this._cooked(uid);
    else if (a === "surprise") {
      const t = today(); const ws = weekStart(t);
      const pool = this._meals.filter((m) => !m.plan.some((d) => d >= ws && d < addDays(ws, 7)));
      if (!pool.length) return;
      pool.sort((x, y) => lastHad(x, t).localeCompare(lastHad(y, t)));
      const pick = pool[Math.floor(Math.random() * Math.min(3, pool.length))];
      this._sheetMeal(pick.uid, false, "Haven’t had this for a while");
    }
  }

  async _seed() {
    for (const p of PLACEHOLDER_MEALS) {
      const m = placeholderMeal(p);
      await this._mf.call("add_item", { item: m.name, description: composeMeal(m) });
    }
    this._toast("Added " + PLACEHOLDER_MEALS.length + " example meals");
  }

  async _saveMeal(m) { await this._mf.call("update_item", { item: m.uid, rename: m.name, description: composeMeal(m) }); }

  async _cooked(uid) {
    const m = this._meal(uid); if (!m) return;
    m.cooked = today(); m.had = [...new Set([...(m.had || []), m.cooked])]; await this._saveMeal(m); this._toast("Enjoy! " + (m.emoji || ""));
  }

  // Plan or un-plan one night, and move that meal's share of the shopping list with it.
  async _togglePlan(uid, d, quiet) {
    const m = this._meal(uid); if (!m) return 0;
    const t = today();
    const on = !m.plan.includes(d);
    m.plan = on ? [...m.plan, d] : m.plan.filter((x) => x !== d);
    // had: keeps the history once old plans drop off, for Popular and the ideas order.
    m.had = [...new Set([...(m.had || []), ...m.plan])].filter((x) => (on || x !== d) && x >= addDays(t, -365));
    m.plan = m.plan.filter((x) => x >= addDays(t, -14));
    await this._saveMeal(m);
    if (!this._sf) return 0;
    const n = on ? await this._addShare(m, d, m.ingredients.filter((i) => !isPantry(i))) : await this._dropShare(m.name, d);
    if (quiet) return n;
    if (on) this._toast(`${m.emoji || ""} ${m.name} on ${d === t ? "tonight" : DOW_LONG[dowIdx(d)]} · ${n} item${n === 1 ? "" : "s"} added to the list`);
    else this._toast(`${m.name} taken off ${DOW_LONG[dowIdx(d)]}` + (n ? ` · ${n} item${n === 1 ? "" : "s"} removed` : ""));
    return n;
  }

  // One at a time, each starting from a fresh read of the list, so quick plans in a row can't add the same thing twice.
  // force: a tap on ＋ in the meal sheet. It goes on even if this night's line was ticked or taken off as "we have it".
  _addShare(m, d, ings, force) {
    const run = () => this._addShareNow(m, d, ings, force);
    this._shareQ = (this._shareQ || Promise.resolve()).then(run, run);
    return this._shareQ;
  }
  async _addShareNow(m, d, ings, force) {
    const fresh = await this._sf.fetch(); if (fresh) this._shop = fresh.map(parseShop);
    const open = this._shop.filter((s) => !s.done);
    const merged = new Map();
    for (const i of ings) {
      const k = normName(i.name);
      if (merged.has(k)) merged.get(k).qtys.push(i.qty); else merged.set(k, { i, qtys: [i.qty] });
    }
    let n = 0;
    const mine = (f) => f.meal === m.name && f.date === d, fx = factor(m, d);
    for (const [k, { i, qtys }] of merged) {
      const qty = sumQty(qtys.filter(Boolean).map((q) => scaleQty(q, fx))) || "1";
      if (!force && this._shop.some((s) => s.done && normName(s.name) === k && s.for.some(mine))) continue;
      // Taken off as "we have it" for this night: planning or saving the meal again doesn't put it back.
      if (!force && ISO.test(d) && this._shop.some((s) => !s.done && normName(s.name) === k && (s.have || []).some(mine))) continue;
      if (force) for (const s of open.filter((x) => normName(x.name) === k && (x.have || []).some(mine))) {
        s.have = s.have.filter((f) => !mine(f));
        if (s !== open.find((x) => normName(x.name) === k)) await this._sf.call("update_item", { item: s.uid, description: composeShop(s) });
      }
      const ex = open.find((s) => normName(s.name) === k);
      if (ex) {
        if (ex.for.some(mine)) continue;
        ex.for.push({ meal: m.name, date: d, qty });
        ex.have = (ex.have || []).filter((f) => !mine(f));
        await this._sf.call("update_item", { item: ex.uid, description: composeShop(ex) });
      } else {
        const nm = shopName(i.name);
        const s = { name: nm, qty: "", aisle: i.aisle || guessAisle(nm), for: [{ meal: m.name, date: d, qty }], have: [], notes: "" };
        await this._sf.call("add_item", { item: nm, description: composeShop(s) });
        open.push(Object.assign(s, { uid: null, done: false }));
      }
      n++;
    }
    return n;
  }

  async _dropShare(meal, d) {
    let n = 0;
    const mine = (f) => f.meal === meal && f.date === d;
    for (const s of this._shop.filter((x) => !x.done && (x.for.some(mine) || (x.have || []).some(mine)))) {
      const was = s.for.length;
      s.for = s.for.filter((f) => !mine(f)); s.have = (s.have || []).filter((f) => !mine(f));
      if (!s.for.length && !s.qty && !s.have.length) await this._sf.call("remove_item", { item: s.uid });
      else await this._sf.call("update_item", { item: s.uid, description: composeShop(s) });
      if (was > s.for.length) n++;
    }
    return n;
  }

  // ---------- sheets ----------

  _weekDays() { const ws = addDays(weekStart(today()), this._wk * 7); return Array.from({ length: 7 }, (_, i) => addDays(ws, i)); }

  _sheetMeal(uid, refresh, note) {
    const m = this._meal(uid);
    if (!m) { if (refresh) this._closeSheet(); return; }
    if (refresh && (!this._sheet || this._sheet.kind !== "meal")) return;
    const t = today();
    // A line counts as this meal's only when it carries a share for this meal; another meal's line for the same thing is shown, not ticked.
    const lines = (i) => this._shop.filter((s) => !s.done && !isGhost(s) && normName(s.name) === normName(i.name));
    const onList = (i) => lines(i).find((s) => s.for.some((f) => f.meal === m.name));
    const haveIt = (i) => this._shop.some((s) => !s.done && normName(s.name) === normName(i.name) && (s.have || []).some((f) => f.meal === m.name && f.date >= t));
    const others = (i) => [...new Set(lines(i).flatMap((s) => s.for.length ? s.for.filter((f) => f.meal !== m.name).map((f) => f.meal) : ["by hand"]))];
    const days = this._weekDays();
    const html = `
      <div class="hero"><button class="btn ico x" data-a="close" aria-label="Close">✕</button>${thumb(m)}</div>
      <div class="pad">
        ${note ? `<div class="chip" style="margin-bottom:8px">🎲 ${esc(note)}</div>` : ""}
        <h2>${esc(m.name)}</h2>
        <div class="mt2">${m.mins ? `<span class="chip">⏱ ${esc(m.mins)} min</span>` : ""}<span class="chip">👥 Serves ${servesN(m)}</span>
          ${m.tags.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}<span class="chip">${esc(ago(lastHad(m, t), t))}</span>${popular(m, t) ? `<span class="chip pop2">🔥 Popular · ${eaten(m, t).filter((d) => d >= addDays(t, -POPULAR_DAYS)).length} times lately</span>` : ""}</div>
        ${this._nutHtml(m)}
        <h3>Plan it</h3>
        <div class="wkn"><span class="mut">Tap a night. Its ingredients go on the shopping list.</span><span class="sp"></span>
          <button class="btn sm ico" data-a="swk" data-k="-1">‹</button><button class="btn sm ico" data-a="swk" data-k="1">›</button></div>
        <div class="days">${days.map((d, i) => `<button class="dc${m.plan.includes(d) ? " on" : ""}${d === t ? " td" : ""}" data-a="plan" data-d="${d}" ${d < t && !m.plan.includes(d) ? "disabled" : ""}>
          <b>${d === t ? "Today" : DOW[i]}</b><span>${dayNum(d)} ${monShort(d)}</span></button>`).join("")}</div>
        ${(() => { const other = m.plan.filter((d) => d >= t && !days.includes(d)).sort(); return other.length ? `<div class="mut" style="font-size:13px;margin-top:8px">Also planned: ${other.map((d) => DOW[dowIdx(d)] + " " + dayNum(d) + " " + monShort(d)).join(", ")}</div>` : ""; })()}
        <h3>Ingredients${m.ingredients.length ? ` · ${m.ingredients.length}` : ""}</h3>
        ${m.ingredients.length ? `<div class="ings">${m.ingredients.map((i, k) => {
          const a = this._aisle(i.aisle); const on = onList(i);
          return `<div class="ig"><span class="ai" style="background:${a.colour}26">${a.icon}</span><span class="q">${esc(i.qty)}</span>
            <span class="nm">${esc(i.name)}<small>${esc(i.aisle)}${i.frozen ? " · ❄️ defrost" : ""}${isPantry(i) ? " · check the pantry" : ""}${on ? " · on the list" : (() => { const o = others(i); return o.length ? " · on the list for " + esc(o.join(", ")) : haveIt(i) ? " · we have it" : ""; })()}</small></span>
            ${this._sf ? `<button class="tgl${on ? " on" : ""}" data-a="ing" data-k="${k}" aria-label="${on ? "On the list" : "Add to list"}">${on ? "✓" : "＋"}</button>` : ""}</div>`;
        }).join("")}</div>` : `<div class="warn">⚠️ <b>No ingredients yet.</b> Planning this meal puts nothing on the shopping list until some are added.</div>
          ${suggestFor(m.name) ? `<button class="btn" data-a="suggest">💡 Suggest ingredients</button> ` : ""}<button class="btn" data-a="edit">✎ Add ingredients</button>`}
        ${m.notes ? `<h3>Notes</h3><div class="notes">${esc(m.notes)}</div>` : ""}
      </div>
      <div class="foot"><button class="btn" data-a="edit">✎ Edit</button>
        ${m.cooked === t ? "" : `<button class="btn" data-a="cooked">✓ Had it today</button>`}
        <span class="sp"></span><button class="btn pri" data-a="close">Done</button></div>`;
    if (refresh && this._ov) {
      const sh = this._ov.querySelector(".sh"); const st = sh.scrollTop; sh.innerHTML = html; sh.scrollTop = st; return;
    }
    this._openSheet(html, (a, b) => {
      const mm = this._meal(uid); if (!mm) return;
      if (a === "close") this._closeSheet();
      else if (a === "plan") this._togglePlan(uid, b.dataset.d);
      else if (a === "swk") { this._wk += Number(b.dataset.k); this._paint(); this._sheetMeal(uid, true, note); }
      else if (a === "edit") this._sheetEdit(uid);
      else if (a === "suggest") this._sheetEdit(uid, true);
      else if (a === "cooked") this._cooked(uid);
      else if (a === "hrate") { const p = this._ov && this._ov.querySelector(".hpick"); if (p) p.hidden = !p.hidden; }
      else if (a === "hset" || a === "hclr") {
        mm.health = a === "hset" ? String(b.dataset.k) : "";
        this._saveMeal(mm); this._sheetMeal(uid, true, note);
        this._toast(a === "hset" ? `${mm.name} rated ${mm.health}/10` : `${mm.name} back to the estimate`);
      }
      else if (a === "ing") {
        const i = mm.ingredients[Number(b.dataset.k)]; const on = onList(i);
        if (on) {
          // Untick takes off only this meal's share; other meals keep theirs.
          // Remembered as "we have it", so the shop's ＋ doesn't offer it again for these nights.
          const gone = on.for.filter((f) => f.meal === mm.name);
          on.for = on.for.filter((f) => f.meal !== mm.name);
          on.have = [...(on.have || []), ...gone.filter((f) => ISO.test(f.date))];
          if (!on.for.length && !on.qty && !on.have.length) this._sf.call("remove_item", { item: on.uid }); else this._sf.call("update_item", { item: on.uid, description: composeShop(on) });
          this._toast(i.name + " off the list for " + mm.name);
        } else {
          // For the next night it's planned, at that night's head count; "extra" only when it isn't planned.
          const nd = mm.plan.filter((d) => d >= today()).sort()[0];
          this._addShare(mm, nd || "extra", [i], true);
          this._toast(i.name + " added" + (nd ? ` for ${nd === today() ? "tonight" : DOW_LONG[dowIdx(nd)]} (${nightServes(mm, nd)} people)` : ""));
        }
      }
    });
    this._sheet = { kind: "meal", uid };
  }

  // The meal sheet's health rating (with the reason for each point) and macro ring. Both are estimates.
  _nutHtml(m) {
    const r = nutrition(m), h = healthOf(m);
    const ok = !!(r && r.ok);
    const tot = !ok ? 1 : r.p * 4 + r.c * 4 + r.f * 9 || 1, pc = (v) => Math.round(v * 100 / tot);
    const leg = !ok ? "" : [["c", "Carbs", r.c, r.c * 4], ["f", "Fat", r.f, r.f * 9], ["p", "Protein", r.p, r.p * 4]].map(([k, l, g, kc]) =>
      `<div><i style="background:${MACRO_COL[k]}"></i>${l}<b>${Math.round(g)} g · ${pc(kc)}%</b></div>`).join("") + `<div class="mut">Fibre<b>${Math.round(r.fib)} g</b></div>`;
    const band = h ? healthBand(h.score) : [0, "Not rated", "#8fa3ad"];
    const why = ok && r.health ? r.health.why : [];
    const dcol = (d) => d > 0 ? "#2e9d57" : d < 0 ? "#d64541" : "var(--secondary-text-color)";
    const hc = `<div class="hc" style="--hc:${band[2]}">
        <div class="hh"><span class="hs">${h ? h.score : "?"}</span><span class="hl"><b>${band[1]}</b><span>${!h ? (r ? "Not enough known ingredients to estimate" : "No ingredients to estimate from") : h.own ? `Your rating${h.est ? ` · estimate ${h.est}/10` : ""}` : "Health estimate, out of 10"}</span></span>
          <button class="btn sm" data-a="hrate">✎ Rate it myself</button></div>
        ${!ok ? "" : why.length ? `<ul class="why">${why.map((w) => `<li><span class="d" style="--dc:${dcol(w.d)}">${w.d > 0 ? "+" + w.d : w.d < 0 ? "−" + -w.d : "·"}</span><span>${esc(w.t)}</span></li>`).join("")}</ul>` : `<div class="mut" style="font-size:13px;margin-top:8px">An ordinary home-cooked dinner: nothing pushes it up or down.</div>`}
        <div class="hpick" hidden>${Array.from({ length: 10 }, (_, k) => k + 1).map((n) => `<button style="--hc:${healthBand(n)[2]}" class="${h && h.own && h.score === n ? "on" : ""}" data-a="hset" data-k="${n}" aria-label="Rate ${n} out of 10">${n}</button>`).join("")}
          ${h && h.own ? `<button class="btn sm" style="width:auto;border-radius:999px;border-width:1px" data-a="hclr">${h.est ? `↺ Use the estimate (${h.est})` : "↺ Clear my rating"}</button>` : ""}</div></div>`;
    if (!r) return `<div class="nut">${hc}</div>`;
    const est = `Estimate for one serve (serves ${r.serves}), worked out from the ingredient list with typical values. It isn't measured, so treat it as a rough guide.${r.unknown.length ? ` Not recognised, so not counted: ${esc(r.unknown.join(", "))}.` : ""}${r.guessed ? ` ${r.guessed} amount${r.guessed === 1 ? "" : "s"} guessed (no quantity given).` : ""}`;
    return `<div class="nut">${ok ? `<div class="rg">${macroRing(r, 112)}</div><div class="lg">${leg}</div>` : ""}${hc}<div class="est">${est}</div></div>`;
  }

  // The people stepper on a planned meal in the night sheet.
  _svHtml(m, d) {
    const base = servesN(m);
    const n = nightServes(m, d);
    return `<div class="svs" data-a="nop"><button data-a="ppl" data-uid="${esc(m.uid)}" data-k="-1" aria-label="Fewer people" ${n <= 1 ? "disabled" : ""}>−</button><b>${n}</b>
      <button data-a="ppl" data-uid="${esc(m.uid)}" data-k="1" aria-label="More people" ${n >= 30 ? "disabled" : ""}>+</button><span>${n === 1 ? "person" : "people"}${n !== base ? ` <span class="ch">· usually ${base}</span>` : ""}</span></div>`;
  }

  // Changes one night's head count straight away on screen; the save and the list update follow once the taps stop.
  _stepServes(uid, d, k) {
    const m = this._meal(uid); if (!m) return;
    // The head count before this run of taps: the list changes by the difference once they stop.
    this._pplFrom = this._pplFrom || {};
    if (!((uid + "@" + d) in this._pplFrom)) this._pplFrom[uid + "@" + d] = nightServes(m, d);
    const n = Math.max(1, Math.min(30, nightServes(m, d) + k));
    m.ppl = Object.assign({}, m.ppl || {});
    if (n === servesN(m)) delete m.ppl[d]; else m.ppl[d] = n;
    this._pplWant = this._pplWant || {};
    this._pplWant[uid + "@" + d] = m.ppl[d] || 0;
    this._paint();
    this._pplT = this._pplT || {};
    clearTimeout(this._pplT[uid + "@" + d]);
    this._pplT[uid + "@" + d] = setTimeout(() => {
      const run = () => this._saveServes(uid, d);
      this._shareQ = (this._shareQ || Promise.resolve()).then(run, run);
    }, 900);
  }
  async _saveServes(uid, d) {
    const m = this._meal(uid); if (!m) return;
    const key = uid + "@" + d, want = (this._pplWant || {})[key];
    const from = (this._pplFrom || {})[key]; if (this._pplFrom) delete this._pplFrom[key];
    m.ppl = Object.assign({}, m.ppl || {});
    if (want) m.ppl[d] = want; else delete m.ppl[d];
    // A meal with no Serves set was counted as 4: write that down, so the 4 it scales from stays put.
    if (!(parseFloat(m.serves) > 0)) m.serves = String(DEFAULT_SERVES);
    try { await this._saveMeal(m); } catch (e) { this._toast("Couldn't save that: " + ((e && e.message) || e)); return; }
    const to = nightServes(m, d);
    let n = 0;
    if (this._sf && from && from !== to) try { n = await this._rescale(m, d, from, to); } catch (e) { this._toast("Saved, but the list didn't update: " + ((e && e.message) || e)); return; }
    this._toast(`👥 ${m.name} for ${to} on ${d === today() ? "tonight" : DOW_LONG[dowIdx(d)]}` + (n ? ` · ${n} item${n === 1 ? "" : "s"} on the list updated` : ""));
  }
  // Changes the list by the difference between the old and new head count, ingredient by ingredient.
  // More people: the extra goes on the list, even for a night the last shop covered (it shows as a top-up).
  // Fewer: it comes off this night's share of open lines; anything already ticked was bought.
  // "We have it" covered the old count: more people still puts the extra on the list.
  async _rescale(m, d, from, to) {
    const fresh = await this._sf.fetch(); if (fresh) this._shop = fresh.map(parseShop);
    const base = servesN(m), mine = (f) => f.meal === m.name && f.date === d, ext = (f) => f.meal === m.name && f.date === "extra";
    const ings = m.ingredients.filter((i) => i.name && !isPantry(i));
    const keys = [...new Set(ings.map((i) => normName(i.name)))];
    let n = 0;
    for (const k of keys) {
      const own = ings.filter((i) => normName(i.name) === k), qs = own.map((i) => i.qty).filter(Boolean);
      if (!qs.length) continue;
      const a = qtyMap(qs.map((q) => scaleQty(q, from / base))).by, b = qtyMap(qs.map((q) => scaleQty(q, to / base))).by;
      const up = new Map(), down = new Map();
      for (const u of new Set([...a.keys(), ...b.keys()])) {
        const x = (b.get(u) || { n: 0 }).n - (a.get(u) || { n: 0 }).n, e = b.get(u) || a.get(u);
        if (x > 1e-6) up.set(u, { n: x, u: e.u }); else if (x < -1e-6) down.set(u, { n: -x, u: e.u });
      }
      if (!up.size && !down.size) continue;
      const open = this._shop.filter((s) => !s.done && normName(s.name) === k), changed = new Set();
      {
        if (down.size) {
          for (const pick of [mine, ext]) for (const s of open) for (const f of s.for.filter(pick)) {
            const q = qtyMap([f.qty]); let hit = false;
            for (const [u, need] of down) {
              const e = q.by.get(u); if (!e || need.n < 1e-6) continue;
              const take = Math.min(e.n, need.n); e.n -= take; need.n -= take; hit = true;
            }
            if (!hit) continue;
            changed.add(s);
            const left = mapQty(q);
            if (left) f.qty = left; else s.for = s.for.filter((x) => x !== f);
          }
        }
        if (up.size) {
          const add = mapQty({ by: up, loose: [] });
          const s = open.find((x) => x.for.some(mine)) || open.find((x) => x.for.some(ext)) || open.find((x) => !isGhost(x)) || open[0];
          if (s) {
            const f = s.for.find(mine);
            if (f) { const q = qtyMap([f.qty]); for (const [u, e] of up) { const g = q.by.get(u); if (g) g.n += e.n; else q.by.set(u, { n: e.n, u: e.u }); } f.qty = mapQty(q); }
            else s.for.push({ meal: m.name, date: d, qty: add });
            changed.add(s);
          } else {
            const i = own[0], nm = shopName(i.name);
            const ns = { name: nm, qty: "", aisle: i.aisle || guessAisle(nm), for: [{ meal: m.name, date: d, qty: add }], have: [], notes: "" };
            await this._sf.call("add_item", { item: nm, description: composeShop(ns) });
            this._shop.push(Object.assign(ns, { uid: null, done: false })); n++;
          }
        }
      }
      for (const s of changed) {
        try {
          if (!s.for.length && !s.qty && !(s.have || []).length) await this._sf.call("remove_item", { item: s.uid });
          else await this._sf.call("update_item", { item: s.uid, description: composeShop(s) });
          n++;
        } catch (e) { /* changed elsewhere first */ }
      }
    }
    return n;
  }

  _sheetPick(d) {
    const t = today();
    const cur = this._meals.filter((m) => m.plan.includes(d));
    const html = `<div class="pad" style="position:relative"><button class="btn ico x" data-a="close" aria-label="Close" style="background:none;color:inherit;border:1px solid var(--divider-color)">✕</button>
      <h2>${d === t ? "Tonight" : DOW_LONG[dowIdx(d)]} <span class="mut" style="font-weight:500;font-size:16px">${dayNum(d)} ${monShort(d)}</span></h2>
      ${cur.length ? `<h3>Planned</h3><div class="pick">${cur.map((m) => `<div class="ml" data-a="open" data-uid="${esc(m.uid)}"><button class="rmb" data-a="rm" data-uid="${esc(m.uid)}" aria-label="Remove ${esc(m.name)} from this night">✕ Remove</button>${thumb(m)}<div class="b"><div class="n">${esc(m.name)}</div>${noIngs(m) ? `<div class="m noi">⚠️ No ingredients: nothing goes on the list</div>` : ""}${this._svHtml(m, d)}</div></div>`).join("")}</div>` : ""}
      <h3>${cur.length ? "Add another" : "Pick a meal"}</h3>
      <div class="pick">${this._meals.filter((m) => !cur.includes(m)).sort((x, y) => lastHad(x, t).localeCompare(lastHad(y, t)) || x.name.localeCompare(y.name)).map((m) =>
        `<div class="ml" data-a="pick" data-uid="${esc(m.uid)}">${popular(m, t) ? `<span class="pop" title="Popular in our house">🔥</span>` : ""}${thumb(m)}<div class="b"><div class="n">${esc(m.name)}</div><div class="m">${hpill(m)}${esc(ago(lastHad(m, t), t))}</div>${noIngs(m) ? `<div class="m noi">⚠️ No ingredients</div>` : ""}</div></div>`).join("")}
        <div class="ml new" data-a="new"><span class="plus">＋</span><span>New meal</span></div></div></div>`;
    this._openSheet(html, async (a, b) => {
      if (a === "close") this._closeSheet();
      else if (a === "pick") { this._closeSheet(); await this._togglePlan(b.dataset.uid, d); }
      else if (a === "rm") { await this._togglePlan(b.dataset.uid, d); this._sheetPick(d); }
      else if (a === "ppl") { this._stepServes(b.dataset.uid, d, +b.dataset.k); this._sheetPick(d); }
      else if (a === "nop") { /* the count itself: not a tap to open */ }
      else if (a === "open") { this._closeSheet(); this._sheetMeal(b.dataset.uid); }
      else if (a === "new") this._sheetEdit(null);
    });
    this._sheet = { kind: "pick" };
  }

  // ---------- ✨ Fill my week ----------
  // Drafts dinners for the shown week's empty nights; nothing is planned until "Plan N nights".

  // The empty nights of the shown week, from tonight on.
  _fillDays() {
    const t = today();
    return this._weekDays().filter((d) => d >= t && !(this._meals || []).some((m) => m.plan.includes(d)));
  }
  _hm(s, dflt) { const mm = String(s || "").match(/^(\d{1,2}):(\d{2})/); return mm ? +mm[1] * 60 + +mm[2] : dflt; }
  _isQuick(m) {
    const n = parseFloat(String(m.mins || "").replace(",", "."));
    return (n > 0 && n <= (+this._cfg.quick_mins || 30)) || m.tags.some((x) => /^(quick|fast|easy|speedy)/i.test(x));
  }
  _hasFrozen(m) { return m.ingredients.some((x) => x.frozen); }
  // A ❄️ meal needs the morning defrost reminder still to come: any later night, or tonight before the reminder time.
  _defrostOk(d) {
    const t = today(); if (d > t) return true; if (d < t) return false;
    const now = new Date(); return now.getHours() * 60 + now.getMinutes() < this._hm(this._cfg.defrost_time, 360);
  }

  // Evenings someone is at work, from the busy calendars: an all-day event, or a timed one overlapping busy_from to busy_to.
  async _busyNights(days) {
    const busy = {}, errs = [];
    const cals = [].concat(this._cfg.busy_calendars || []).filter(Boolean);
    if (!days.length || !cals.length) return { busy, errs };
    const from = this._hm(this._cfg.busy_from, 960), to = this._hm(this._cfg.busy_to, 1170);
    const at = (iso, min) => { const [y, m, d] = parts(iso); return new Date(y, m - 1, d, 0, min); };
    const lo = at(days[0], 0).toISOString(), hi = at(addDays(days[days.length - 1], 1), 0).toISOString();
    for (const c of cals) {
      if (!this._hass.states[c]) { errs.push(c); continue; }
      let evs;
      try { evs = await this._hass.callApi("GET", `calendars/${c}?start=${encodeURIComponent(lo)}&end=${encodeURIComponent(hi)}`); }
      catch (e) { errs.push(c); continue; }
      for (const ev of evs || []) {
        const s = ev.start || {}, e = ev.end || {};
        for (const d of days) {
          let hit = false, till = null;
          if (s.date && !s.dateTime) hit = s.date <= d && (e.date || addDays(s.date, 1)) > d;   // all-day; the end date is exclusive
          else if (s.dateTime) {
            const a = new Date(s.dateTime), b = new Date(e.dateTime || s.dateTime);
            hit = a < at(d, to) && b > at(d, from);
            if (hit) till = b >= at(d, 24 * 60) ? 24 * 60 : b.getHours() * 60 + b.getMinutes();
          }
          if (!hit) continue;
          const o = busy[d] || (busy[d] = { till: null });
          if (till != null && (o.till == null || till > o.till)) o.till = till;
        }
      }
    }
    return { busy, errs };
  }
  _clock(min) {
    if (min >= 24 * 60) return "late";
    const h = Math.floor(min / 60), mm = min % 60;
    return (h % 12 || 12) + (mm ? ":" + P2(mm) : "") + (h < 12 ? "am" : "pm");
  }

  // Meals had or planned from the week before the drafted week to the week after it: kept out unless nothing else fits.
  _fillBlock(ws) {
    const lo = addDays(ws, -7), hi = addDays(ws, 13);
    return new Set(this._meals.filter((m) => [...(m.had || []), ...m.plan, m.cooked].some((d) => d && d >= lo && d <= hi)).map((m) => m.uid));
  }

  // Meals for one night, best first. used: meals already on other nights of the draft. all: every meal (the chooser).
  _fillRank(d, used, all) {
    const f = this._fill, t = today(), busy = !!f.busy[d];
    const base = this._meals.filter((m) => (all || !used.has(m.uid)) && (!this._hasFrozen(m) || this._defrostOk(d)));
    const fresh = base.filter((m) => !f.block.has(m.uid));
    const pool = all || !fresh.length ? base : fresh;
    const score = (m) => {
      const last = lastHad(m, t), gap = last ? Math.min(daysBetween(last, t), 120) : 100;
      return gap + (f.jit[m.uid] || 0) + (popular(m, t) ? 8 : 0) - (noIngs(m) ? 25 : 0) - (f.block.has(m.uid) ? 500 : 0) + (busy && this._isQuick(m) ? 1000 : 0);
    };
    return pool.map((m) => ({ m, s: score(m) })).sort((a, b) => b.s - a.s || a.m.name.localeCompare(b.m.name)).map((x) => x.m);
  }

  _fillUsed(except) { const f = this._fill; return new Set(f.days.filter((d) => d !== except && !f.skip[d] && f.pick[d]).map((d) => f.pick[d])); }

  // Busy nights first, so the quick meals go where they are needed. keep: nights to leave as they are.
  _fillDraft(keep) {
    const f = this._fill;
    const used = keep ? new Set(f.days.filter((d) => keep.has(d) && !f.skip[d] && f.pick[d]).map((d) => f.pick[d])) : new Set();
    const order = [...f.days].sort((a, b) => (f.busy[b] ? 1 : 0) - (f.busy[a] ? 1 : 0) || a.localeCompare(b));
    for (const d of order) {
      if (keep && keep.has(d)) continue;
      if (f.skip[d]) continue;
      const m = this._fillRank(d, used)[0];
      f.pick[d] = m ? m.uid : null; if (m) used.add(m.uid);
    }
  }
  _fillJitter() { const j = {}; for (const m of this._meals) j[m.uid] = Math.random() * 30; return j; }

  async _fillWeek() {
    const days = this._fillDays();
    if (!days.length) { this._toast("Every night this week is already planned"); return; }
    if (!this._meals.length) { this._toast("Add some meals first"); return; }
    const ws = addDays(weekStart(today()), this._wk * 7);
    this._fill = { ws, days, busy: {}, errs: [], loading: true, pick: {}, skip: {}, jit: this._fillJitter(), block: this._fillBlock(ws) };
    this._fillPaint();
    const r = await this._busyNights(days);
    if (!this._fill || this._fill.ws !== ws) return;
    Object.assign(this._fill, r, { loading: false });
    this._fillDraft();
    this._fillPaint();
  }

  _fillRow(d) {
    const f = this._fill, t = today(), b = f.busy[d];
    const day = `<div class="fd"><b>${d === t ? "Tonight" : DOW[dowIdx(d)]}</b><span>${dayNum(d)} ${monShort(d)}</span></div>`;
    const busyChip = b ? `<span class="chip fbz">💼 ${esc(this._cfg.busy_label)}${b.till != null ? " till " + this._clock(b.till) : ""}</span>` : "";
    if (f.skip[d]) {
      return `<div class="fr off">${day}<div class="fb"><div class="n mut">Left empty</div><div class="fc">${busyChip}</div></div>
        <div class="fa"><button class="btn sm" data-a="fon" data-d="${d}">↺ Fill</button></div></div>`;
    }
    const m = f.pick[d] && this._meal(f.pick[d]);
    if (!m) {
      return `<div class="fr">${day}<div class="fb"><div class="n mut">No meal fits this night</div><div class="fc">${busyChip}</div></div>
        <div class="fa"><button class="btn sm ico" data-a="fskip" data-d="${d}" title="Leave this night empty" aria-label="Leave this night empty">✕</button></div></div>`;
    }
    const used = this._fillUsed(d);
    const where = (uid) => f.days.filter((x) => x !== d && !f.skip[x] && f.pick[x] === uid).map((x) => (x === t ? "tonight" : DOW[dowIdx(x)]));
    const opts = this._fillRank(d, used, true).map((x) => {
      const w = where(x.uid);
      return `<option value="${esc(x.uid)}"${x.uid === m.uid ? " selected" : ""}>${esc(x.name)}${x.mins ? " · " + esc(x.mins) + " min" : ""}${w.length ? " · also " + w.join(", ") : ""}</option>`;
    }).join("") + this._meals.filter((x) => this._hasFrozen(x) && !this._defrostOk(d)).map((x) => `<option disabled>${esc(x.name)} · ❄️ too late to defrost</option>`).join("");
    const quick = this._isQuick(m), last = lastHad(m, t);
    const chips = [
      busyChip,
      b && !quick ? `<span class="chip noi">⚠️ No quick meal left</span>` : "",
      m.mins ? `<span class="chip${b && quick ? " fq" : ""}">⏱ ${esc(m.mins)} min</span>` : (b && quick ? `<span class="chip fq">⏱ Quick</span>` : ""),
      this._hasFrozen(m) ? `<span class="chip ffz" title="The ${esc(this._cfg.defrost_time)} reminder puts it on Highlights that morning">❄️ Defrost reminder ${d === t ? "this morning" : DOW[dowIdx(d)] + " " + esc(this._cfg.defrost_time)}</span>` : "",
      f.block.has(m.uid) ? `<span class="chip noi">🔁 Had or planned recently</span>` : `<span class="chip">${esc(ago(last, t))}</span>`,
      popular(m, t) ? `<span class="chip">🔥 Popular</span>` : "",
      noIngs(m) ? `<span class="chip noi">⚠️ No ingredients</span>` : "",
    ].filter(Boolean).join("");
    return `<div class="fr">${day}${thumb(m, "fth")}
      <div class="fb"><label class="fsw" title="Choose a different meal"><span class="fn">${esc(m.name)}</span><span class="car">▾</span><select class="fs" data-d="${d}" aria-label="Meal for ${DOW_LONG[dowIdx(d)]}">${opts}</select></label>
        <div class="fc">${chips}</div></div>
      <div class="fa"><button class="btn sm ico" data-a="fswap" data-d="${d}" title="Another meal" aria-label="Another meal">🔄</button>
        <button class="btn sm ico" data-a="fskip" data-d="${d}" title="Leave this night empty" aria-label="Leave this night empty">✕</button></div></div>`;
  }

  _fillPaint() {
    const f = this._fill; if (!f) return;
    const n = f.days.filter((d) => !f.skip[d] && f.pick[d]).length;
    const nBusy = Object.keys(f.busy).length;
    const wkWord = this._wk === 0 ? "This week" : this._wk === 1 ? "Next week" : `Week of ${dayNum(f.ws)} ${monShort(f.ws)}`;
    const html = `<div class="pad" style="position:relative"><button class="btn ico x" data-a="close" aria-label="Close" style="background:none;color:inherit;border:1px solid var(--divider-color)">✕</button>
      <h2>✨ Fill my week</h2>
      <p class="mut fsub">${wkWord} · ${f.days.length} empty night${f.days.length === 1 ? "" : "s"}${f.loading ? "" : nBusy ? ` · ${nBusy} busy evening${nBusy === 1 ? "" : "s"} get quick meals` : " · no busy evenings"}. Change anything, then plan. Nothing is planned until you do.</p>
      ${f.errs.length ? `<div class="warn">Couldn’t read ${f.errs.map(esc).join(", ")}, so no evenings are marked busy.</div>` : ""}
      ${f.loading ? `<div class="mut" style="padding:24px 0;text-align:center">Checking the calendar…</div>` : `<div class="fw">${f.days.map((d) => this._fillRow(d)).join("")}</div>`}</div>
      <div class="foot"><button class="btn" data-a="freroll"${f.loading ? " disabled" : ""}>🎲 Shuffle</button><span class="sp"></span>
        <button class="btn" data-a="cancel">Cancel</button>
        <button class="btn pri" data-a="fgo"${f.loading || !n ? " disabled" : ""}>✓ Plan ${n} night${n === 1 ? "" : "s"}</button></div>`;
    const sh = this._ov && this._sheet && this._sheet.kind === "fill" && this._ov.querySelector(".sh");
    if (sh) { const y = sh.scrollTop; sh.innerHTML = html; sh.scrollTop = y; return; }
    this._openSheet(html, (a, b) => this._fillAct(a, b), (e) => {
      const s = e.target.closest && e.target.closest("select.fs"); if (!s || !this._fill) return;
      this._fill.pick[s.dataset.d] = s.value;
      // The meal was on another night: that night gets the next best instead, so nothing is cooked twice.
      for (const d of this._fill.days) if (d !== s.dataset.d && this._fill.pick[d] === s.value && !this._fill.skip[d]) { this._fill.pick[d] = null; this._fillDraft(new Set(this._fill.days.filter((x) => x !== d))); }
      this._fillPaint();
    }, { guard: true, guardMsg: "Tap Plan to keep this draft, or Cancel to throw it away." });
    this._sheet = { kind: "fill" };
  }

  async _fillAct(a, b) {
    const f = this._fill; if (!f) { this._closeSheet(); return; }
    const d = b.dataset.d;
    if (a === "close" || a === "cancel") { this._fill = null; this._closeSheet(); return; }
    if (f.loading) return;
    if (a === "fswap") {
      const list = this._fillRank(d, this._fillUsed(d));
      if (list.length < 2 && list[0] && list[0].uid === f.pick[d]) { this._toast("No other meal fits this night"); return; }
      const i = list.findIndex((m) => m.uid === f.pick[d]);
      const next = list[(i + 1) % list.length]; if (next) f.pick[d] = next.uid;
    } else if (a === "fskip") { f.skip[d] = true; f.pick[d] = null; }
    else if (a === "fon") { f.skip[d] = false; this._fillDraft(new Set(f.days.filter((x) => x !== d))); }
    else if (a === "freroll") { f.jit = this._fillJitter(); this._fillDraft(new Set(f.days.filter((x) => f.skip[x]))); }
    else if (a === "fgo") { await this._fillGo(); return; }
    this._fillPaint();
  }

  async _fillGo() {
    const f = this._fill; this._fill = null; this._closeSheet();
    const todo = f.days.filter((d) => !f.skip[d] && f.pick[d]);
    this._toast(`Planning ${todo.length} night${todo.length === 1 ? "" : "s"}…`);
    let nights = 0, items = 0, taken = 0;
    for (const d of todo) {
      // Another screen may have planned this night meanwhile; leave it alone.
      if (this._meals.some((m) => m.plan.includes(d))) { taken++; continue; }
      try { items += await this._togglePlan(f.pick[d], d, true) || 0; nights++; }
      catch (e) { this._toast("Couldn’t plan " + DOW_LONG[dowIdx(d)] + ": " + ((e && e.message) || e)); return; }
    }
    this._toast(`✨ Planned ${nights} night${nights === 1 ? "" : "s"}` + (this._sf ? ` · ${items} item${items === 1 ? "" : "s"} on the list` : "") + (taken ? ` · ${taken} already planned elsewhere` : ""));
  }


  _sheetEdit(uid, useSuggest) {
    const src = uid ? this._meal(uid) : null;
    const dkey = uid || "new", dr = draftGet(dkey);
    const blank = { uid: null, name: "", emoji: "🍽️", img: "", tags: [], serves: "4", mins: "", plan: [], cooked: "", ingredients: [{ qty: "", name: "", aisle: "Produce", staple: false }], notes: "" };
    const m = dr ? dr : src ? JSON.parse(JSON.stringify(src)) : blank;
    const keep = () => draftPut(dkey, m);
    const empty = () => !m.ingredients.some((i) => String(i.name || "").trim());
    let sug = empty() ? suggestFor(m.name) : null;
    const applySug = () => { m.ingredients = sug.map((i) => ({ ...i, _aisleSet: true })); sug = null; };
    // Ingredients already used anywhere, one spelling each (a capitalised one wins), for the
    // type-ahead list and so "butter" saves as the "Butter" the other meals already use.
    const known = new Map();
    for (const x of [...(this._meals || []).flatMap((mm) => mm.ingredients), ...(this._shop || [])]) {
      const nm = String(x.name || "").trim(), k = nm.toLowerCase(); if (!nm) continue;
      const had = known.get(k);
      if (!had || (had.name[0] !== had.name[0].toUpperCase() && nm[0] === nm[0].toUpperCase())) known.set(k, { name: nm, aisle: (had && had.aisle) || x.aisle });
    }
    const knownOpts = [...known.values()].sort((a, b) => a.name.localeCompare(b.name)).map((x) => `<option value="${esc(x.name)}"></option>`).join("");
    if (useSuggest && sug) applySug();
    const sugBox = () => sug ? `💡 Suggested ingredients for this meal (${sug.length}). Check them and change anything before you save.<span class="sp"></span><button class="btn sm pri" data-a="usesug">Use these</button>` : "";
    const aisleOpts = (sel) => this._aisles.map((a) => `<option value="${esc(a.name)}"${a.name === sel ? " selected" : ""}>${a.icon} ${esc(a.name)}</option>`).join("");
    const rows = () => m.ingredients.map((i, k) => `<div class="er" data-k="${k}">
        <input class="i" data-f="qty" value="${esc(i.qty)}" placeholder="500 g" autocapitalize="none" autocorrect="off">
        <input class="i" data-f="name" list="ingk" value="${esc(i.name)}" placeholder="Ingredient" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off">
        <select class="i" data-f="aisle" aria-label="Aisle">${aisleOpts(i.aisle)}</select>
        <button class="st${isPantry(i) ? " on" : ""}" data-a="staple" data-k="${k}" title="Pantry staple: not added to the list automatically">⭐</button>
        <button class="st fz${i.frozen ? " on" : ""}" data-a="frz" data-k="${k}" title="Frozen: remind us to take it out the morning it's planned">❄️</button>
        <button class="rm" data-a="rmi" data-k="${k}" aria-label="Remove">✕</button></div>`).join("");
    const html = `<div class="pad">
      <h2>${src ? "Edit meal" : "New meal"}</h2>
      ${dr ? `<div class="draftn">📝 Brought back your unsaved changes<span class="sp"></span><button class="btn sm" data-a="undraft">Start over</button></div>` : ""}
      <label class="f">Name</label><input class="i" data-f="m.name" value="${esc(m.name)}" placeholder="e.g. Lamb shanks">
      <label class="f">Picture</label><div class="emo">${[...new Set(EMOJI)].map((e) => `<button class="${e === m.emoji ? "on" : ""}" data-a="emo" data-e="${e}">${e}</button>`).join("")}</div>
      <div class="emoc"><input class="i" id="emoin" maxlength="16" value="${EMOJI.includes(m.emoji) ? "" : esc(m.emoji)}" placeholder="🙂" aria-label="Any emoji"><span class="mut">or type or paste any emoji here</span></div>
      <label class="f">Photo URL (optional, e.g. /local/meals/lamb.jpg)</label><input class="i" data-f="m.img" value="${esc(m.img)}" placeholder="Leave blank to use the picture above">
      <div class="row2"><div><label class="f">Serves</label><input class="i" data-f="m.serves" value="${esc(m.serves)}" placeholder="${DEFAULT_SERVES}" inputmode="numeric"></div>
        <div><label class="f">Minutes</label><input class="i" data-f="m.mins" value="${esc(m.mins)}" inputmode="numeric"></div>
        <div><label class="f">Tags</label><input class="i" data-f="m.tags" value="${esc(m.tags.join(", "))}" placeholder="Quick, Family"></div></div>
      <h3>Ingredients</h3>
      ${useSuggest && !sug ? `<div class="draftn">💡 Suggested ingredients filled in. Change, add or remove anything, then Save.</div>` : ""}
      <div class="draftn sugg"${sug ? "" : " hidden"}>${sugBox()}</div>
      <div class="erh"><span>Qty</span><span>Name</span><span class="ha">Aisle</span><span title="Pantry staple">⭐</span><span title="Needs defrosting">❄️</span><span></span></div>
      <datalist id="ingk">${knownOpts}</datalist>
      <div id="rows">${rows()}</div>
      <button class="btn sm" data-a="addi">＋ Ingredient</button>
      <span class="mut" style="font-size:12px;margin-left:8px">⭐ = pantry staple. Staples and anything in the Pantry aisle aren't added to the list; they show under Check the pantry. ❄️ = needs defrosting: you get a reminder the morning it's planned.</span>
      <label class="f">Notes</label><textarea class="i" data-f="m.notes" placeholder="Method, where the recipe lives…">${esc(m.notes)}</textarea>
      </div>
      <div class="foot">${src ? `<button class="btn del" data-a="del">Delete</button>` : ""}<span class="sp"></span>
        <button class="btn" data-a="cancel">Cancel</button><button class="btn pri" data-a="save">Save</button></div>`;
    const ov = this._openSheet(html, async (a, b) => {
      if (a === "cancel") { draftDel(dkey); if (src) this._sheetMeal(uid); else this._closeSheet(); return; }
      if (a === "undraft") { draftDel(dkey); this._sheetEdit(uid); return; }
      if (a === "usesug") { if (!sug) return; applySug(); ov.querySelector("#rows").innerHTML = rows(); const sb = ov.querySelector(".sugg"); sb.hidden = true; sb.innerHTML = ""; }
      else if (a === "emo") { m.emoji = b.dataset.e; ov.querySelector("#emoin").value = ""; ov.querySelectorAll(".emo button").forEach((x) => x.classList.toggle("on", x === b)); }
      else if (a === "staple") { const i = m.ingredients[Number(b.dataset.k)], on = !isPantry(i); i.staple = on; i.list = !on && PANTRY_AISLES.includes(i.aisle); b.classList.toggle("on", on); }
      else if (a === "frz") { const i = m.ingredients[Number(b.dataset.k)]; i.frozen = !i.frozen; b.classList.toggle("on", i.frozen); keep(); }
      else if (a === "rmi") { m.ingredients.splice(Number(b.dataset.k), 1); ov.querySelector("#rows").innerHTML = rows(); }
      else if (a === "addi") { m.ingredients.push({ qty: "", name: "", aisle: "Produce", staple: false }); ov.querySelector("#rows").innerHTML = rows(); const n = ov.querySelectorAll('#rows [data-f="qty"]'); n[n.length - 1].focus(); }
      else if (a === "del") {
        if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Tap again to delete"; return; }
        await this._mf.call("remove_item", { item: uid }); draftDel(dkey); this._closeSheet(); this._toast("Deleted " + m.name); return;
      } else if (a === "save") {
        m.name = m.name.trim();
        if (!m.name) { ov.querySelector('[data-f="m.name"]').focus(); return; }
        m.ingredients = m.ingredients.filter((i) => i.name.trim());
        for (const i of m.ingredients) { const kn = known.get(i.name.trim().toLowerCase()); i.name = kn ? kn.name : i.name.trim(); }
        if (src) {
          if (src.name !== m.name) await this._renameShares(src.name, m.name);
          await this._mf.call("update_item", { item: uid, rename: m.name, description: composeMeal(m) });
          draftDel(dkey); this._sheet = { kind: "meal", uid }; this._sheetMeal(uid);
          await this._syncAisles(m);
          // Nights already planned pick up any ingredients added here.
          if (this._sf) {
            let n = 0;
            for (const d of m.plan.filter((x) => x >= today())) n += await this._addShare(m, d, m.ingredients.filter((i) => !isPantry(i)));
            if (n) this._toast(`${n} new ingredient${n === 1 ? "" : "s"} added to the shopping list`);
          }
        } else {
          await this._mf.call("add_item", { item: m.name, description: composeMeal(m) });
          await this._syncAisles(m);
          draftDel(dkey); this._closeSheet(); this._toast("Saved " + m.name);
        }
        return;
      }
      keep();
    }, (e) => {
      if (e.target.id === "emoin") {
        const v = e.target.value.trim();
        if (v) { m.emoji = v; ov.querySelectorAll(".emo button").forEach((x) => x.classList.toggle("on", x.dataset.e === v)); }
        keep(); return;
      }
      const f = e.target.dataset.f; if (!f) return;
      if (f.startsWith("m.")) {
        const k = f.slice(2); m[k] = k === "tags" ? e.target.value.split(",").map((x) => x.trim()).filter(Boolean) : e.target.value;
        if (k === "name") { sug = empty() ? suggestFor(m.name) : null; const sb = ov.querySelector(".sugg"); sb.innerHTML = sugBox(); sb.hidden = !sug; }
        keep(); return;
      }
      const r = e.target.closest(".er"); if (!r) return;
      const i = m.ingredients[Number(r.dataset.k)];
      i[f] = e.target.value;
      const kn = f === "name" && known.get(String(i.name).trim().toLowerCase());
      if (kn && kn.aisle && !i._aisleSet) { i.aisle = kn.aisle; r.querySelector('[data-f="aisle"]').value = kn.aisle; }
      else if (f === "name") { const g = guessAisle(i.name); if (g !== "Other" && !i._aisleSet) { i.aisle = g; r.querySelector('[data-f="aisle"]').value = g; } }
      if (f === "aisle") { i._aisleSet = true; i._aisleUser = true; }
      if (f === "name" && sug && !empty()) { sug = null; const sb = ov.querySelector(".sugg"); sb.hidden = true; sb.innerHTML = ""; }
      keep();
    }, { guard: true });
    if (dr || useSuggest) ov._dirty = true;
    ov.addEventListener("change", (e) => { if (e.target.dataset.f === "aisle") { const r = e.target.closest(".er"); const i = m.ingredients[Number(r.dataset.k)]; i.aisle = e.target.value; i._aisleSet = true; i._aisleUser = true; keep(); } });
    this._sheet = { kind: "edit" };
  }

  // An aisle picked by hand in the editor belongs to the ingredient, not just this meal: other meals using it
  // and its shopping list lines move too (a line otherwise keeps the aisle of the meal that first added it).
  async _syncAisles(m) {
    const ch = m.ingredients.filter((i) => i._aisleUser && i.aisle);
    if (!ch.length) return;
    const pick = (name) => ch.find((x) => normName(x.name) === normName(name));
    for (const o of this._meals || []) {
      if (o.uid === m.uid) continue;
      let hit = false;
      for (const i of o.ingredients) { const c = pick(i.name); if (c && i.aisle !== c.aisle) { i.aisle = c.aisle; hit = true; } }
      if (hit) await this._saveMeal(o);
    }
    if (this._sf) for (const s of this._shop || []) {
      const c = pick(s.name);
      if (c && s.aisle !== c.aisle) { s.aisle = c.aisle; await this._sf.call("update_item", { item: s.uid, description: composeShop(s) }); }
    }
  }

  async _renameShares(from, to) {
    if (!this._sf) return;
    for (const s of this._shop.filter((x) => x.for.some((f) => f.meal === from))) {
      s.for.forEach((f) => { if (f.meal === from) f.meal = to; });
      await this._sf.call("update_item", { item: s.uid, description: composeShop(s) });
    }
  }
}

// =====================================================================
// shopping-list-card
// =====================================================================

