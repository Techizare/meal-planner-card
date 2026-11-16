// ---------- item formats ----------

const MEAL_KEYS = ["emoji", "img", "tags", "serves", "mins", "plan", "servings", "cooked", "had", "health"];
function parseMeal(it) {
  const lines = String(it.description || "").split("\n");
  const m = { uid: it.uid, name: it.summary, health: "", emoji: "", img: "", tags: [], serves: "", mins: "", plan: [], ppl: {}, cooked: "", had: [], ingredients: [], notes: "" };
  let i = 0;
  const hasHdr = lines.length && /^(\w+):/.test(lines[0]) && MEAL_KEYS.includes(lines[0].split(":")[0].toLowerCase());
  if (hasHdr) {
    for (; i < lines.length && lines[i].trim() !== "---"; i++) {
      const mm = lines[i].match(/^(\w+):\s*(.*)$/); if (!mm) continue;
      const k = mm[1].toLowerCase(), v = mm[2].trim();
      if (k === "tags") m.tags = v.split(",").map((x) => x.trim()).filter(Boolean);
      else if (k === "plan") m.plan = v.split(",").map((x) => x.trim()).filter((x) => ISO.test(x));
      else if (k === "cooked") m.cooked = ISO.test(v) ? v : "";
      else if (k === "had") m.had = v.split(",").map((x) => x.trim()).filter((x) => ISO.test(x));
      else if (k === "servings") for (const x of v.split(",")) { const mm2 = x.trim().match(/^(\d{4}-\d{2}-\d{2})\s*=\s*(\d+)$/); if (mm2 && +mm2[2] > 0) m.ppl[mm2[1]] = +mm2[2]; }
      else if (MEAL_KEYS.includes(k)) m[k] = v;
    }
    i++;
    for (; i < lines.length && lines[i].trim() !== "---"; i++) {
      let l = lines[i].trim(); if (!l) continue;
      let staple = false, list = false, frozen = false;
      for (let g = 0; g < 4; g++) {
        if (/^\u2744/.test(l)) { frozen = true; l = l.replace(/^\u2744\uFE0F?/, "").trim(); }
        else if (l.startsWith("*")) { staple = true; l = l.slice(1).trim(); }
        else if (l.startsWith("!")) { list = true; l = l.slice(1).trim(); }
        else break;
      }
      const p = l.split("|").map((x) => x.trim());
      const ing = p.length >= 2 ? { qty: p[0], name: p[1], aisle: p[2] || guessAisle(p[1]), staple, list, frozen } : { qty: "", name: p[0], aisle: guessAisle(p[0]), staple, list, frozen };
      if (ing.name) m.ingredients.push(ing);
    }
    i++;
  }
  m.notes = lines.slice(i).join("\n").trim();
  return m;
}
function composeMeal(m) {
  const h = [];
  if (m.emoji) h.push("emoji: " + m.emoji);
  if (m.img) h.push("img: " + m.img);
  if (m.tags.length) h.push("tags: " + m.tags.join(", "));
  if (m.serves) h.push("serves: " + m.serves);
  if (m.mins) h.push("mins: " + m.mins);
  if (m.plan.length) h.push("plan: " + [...new Set(m.plan)].sort().join(", "));
  const ppl = Object.keys(m.ppl || {}).filter((d) => m.plan.includes(d) && m.ppl[d] > 0 && m.ppl[d] !== servesN(m)).sort();
  if (ppl.length) h.push("servings: " + ppl.map((d) => d + "=" + m.ppl[d]).join(", "));
  if (m.cooked) h.push("cooked: " + m.cooked);
  if ((m.had || []).length) h.push("had: " + [...new Set(m.had)].sort().slice(-30).join(", "));
  if (parseInt(m.health, 10) >= 1) h.push("health: " + parseInt(m.health, 10));
  if (!h.length) h.push("emoji: 🍽️");
  const ing = m.ingredients.filter((x) => x.name).map((x) => (x.staple ? "* " : x.list ? "! " : "") + (x.frozen ? "\u2744 " : "") + [x.qty || "", x.name, x.aisle || guessAisle(x.name)].join(" | "));
  return h.join("\n") + "\n---\n" + ing.join("\n") + "\n---\n" + (m.notes || "");
}

function parseShop(it) {
  const s = { uid: it.uid, name: it.summary, done: it.status === "completed", qty: "", aisle: "", for: [], have: [], notes: "" };
  const lines = String(it.description || "").split("\n");
  const rest = [];
  for (const l of lines) {
    const mm = l.match(/^(qty|aisle|for|have):\s*(.*)$/i);
    if (!mm) { rest.push(l); continue; }
    const k = mm[1].toLowerCase(), v = mm[2].trim();
    if (k === "for" || k === "have") {
      s[k] = v.split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
        const eq = x.lastIndexOf("="); const key = eq > 0 ? x.slice(0, eq) : x; const qty = eq > 0 ? x.slice(eq + 1) : "";
        const at = key.lastIndexOf("@");
        return { meal: at > 0 ? key.slice(0, at) : key, date: at > 0 ? key.slice(at + 1) : "", qty };
      });
    } else s[k] = v;
  }
  s.notes = rest.join("\n").trim();
  if (!s.aisle) s.aisle = guessAisle(s.name);
  s.total = sumQty([s.qty, ...s.for.map((f) => f.qty)].filter(Boolean));
  return s;
}
function composeShop(s) {
  const l = [];
  if (s.qty) l.push("qty: " + s.qty);
  l.push("aisle: " + (s.aisle || guessAisle(s.name)));
  if (s.for.length) l.push("for: " + s.for.map((f) => f.meal + "@" + f.date + "=" + (f.qty || "")).join("; "));
  if ((s.have || []).length) l.push("have: " + s.have.map((f) => f.meal + "@" + f.date + "=" + (f.qty || "")).join("; "));
  if (s.notes) l.push(s.notes);
  return l.join("\n");
}

// ---------- the to-do feed ----------

class TodoFeed {
  constructor(ent, cb) { this.ent = ent; this.cb = cb; }
  async start(hass) {
    this.hass = hass;
    if (!hass.states[this.ent]) { this.cb(null, this.ent + " does not exist yet."); return; }
    try {
      this.unsub = await hass.connection.subscribeMessage((m) => this.cb((m && m.items) || []), { type: "todo/item/subscribe", entity_id: this.ent });
    } catch (e) { this.poll = true; this.load(); }
  }
  update(hass) {
    this.hass = hass;
    if (!this.poll) return;
    const s = hass.states[this.ent]; const sig = s ? s.state + "@" + s.last_updated : "-";
    if (sig !== this.sig) { this.sig = sig; this.load(); }
  }
  async load() {
    try {
      const r = await this.hass.callWS({ type: "call_service", domain: "todo", service: "get_items", target: { entity_id: this.ent }, return_response: true });
      this.cb(((r && r.response && r.response[this.ent]) || {}).items || []);
    } catch (e) { this.cb(null, (e && e.message) || String(e)); }
  }
  // A fresh read of the list, for when a stale copy could make a double-up.
  async fetch() {
    try {
      const r = await this.hass.callWS({ type: "call_service", domain: "todo", service: "get_items", target: { entity_id: this.ent }, return_response: true });
      return ((r && r.response && r.response[this.ent]) || {}).items || null;
    } catch (e) { return null; }
  }
  stop() { if (this.unsub) { try { this.unsub(); } catch (e) { /* gone */ } this.unsub = null; } }
  canDescribe() { const s = this.hass && this.hass.states[this.ent]; return !!s && ((s.attributes.supported_features || 0) & 64) === 64; }
  async call(svc, data) { await this.hass.callService("todo", svc, Object.assign({ entity_id: this.ent }, data)); if (this.poll) this.load(); }
}

