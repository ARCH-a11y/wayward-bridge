// src/server/learn.js
var require_learn = __commonJS({
  "src/server/learn.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var { splitTags, tagKey } = require_tags();
    var Ratings = class {
  constructor(dataDir) {
    this.file = path.join(dataDir, "ratings.jsonl");
    this.cache = null;
    this.pending = 0;
  }
  all() {
    if (this.cache) return this.cache;
    let text = "";
    try {
      text = fs.readFileSync(this.file, "utf8");
    } catch (_) {
      return this.cache = [];
    }
    const out = [];
    for (const l of text.split("\n").slice(-3e3)) {
      if (!l.trim()) continue;
      try {
        out.push(JSON.parse(l));
      } catch (_) {
      }
    }
    return this.cache = out;
  }
  add(verdict, key, prompt2, negative, file) {
    if (!prompt2) return;
    const all = this.all();
    if (file && all.some((r) => r.file === file && r.verdict === verdict)) return;
    const rec = { at: Date.now(), verdict, key: String(key || ""), file: String(file || ""), prompt: String(prompt2), negative: String(negative || "") };
    all.push(rec);
    if (all.length > 3e3) all.splice(0, all.length - 3e3);
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.appendFileSync(this.file, JSON.stringify(rec) + "\n");
      if (++this.pending >= 2e3) this.compact();
    } catch (_) {
    }
  }
  compact() {
    try {
      const keep = this.all().map((r) => JSON.stringify(r)).join("\n") + "\n";
      const tmp = this.file + ".tmp";
      fs.writeFileSync(tmp, keep);
      fs.renameSync(tmp, this.file);
      this.pending = 0;
    } catch (_) {
    }
  }
  counts() {
    const a = this.all();
    return { good: a.filter((r) => r.verdict === "good").length, bad: a.filter((r) => r.verdict === "bad").length };
  }
};
    function suggestions(records, ignore) {
      const skip = new Set((ignore || []).map(tagKey));
      const good = records.filter((r) => r.verdict === "good"), bad = records.filter((r) => r.verdict === "bad");
      const need = 3;
      if (good.length < need || bad.length < need) return { enough: false, good: good.length, bad: bad.length, need, prompt: [], negative: [] };
      const tally = (list, field) => {
        const m = /* @__PURE__ */ new Map();
        for (const r of list) {
          const seen = /* @__PURE__ */ new Set();
          for (const t of splitTags(r[field])) {
            const k = tagKey(t);
            if (!k || seen.has(k)) continue;
            seen.add(k);
            const e = m.get(k) || { tag: t, n: 0 };
            e.n++;
            m.set(k, e);
          }
        }
        return m;
      };
      const pick = (gMap, bMap, field, wantBad) => {
        const out = [];
        for (const k of /* @__PURE__ */ new Set([...gMap.keys(), ...bMap.keys()])) {
          if (skip.has(k)) continue;
          const g = (gMap.get(k) || { n: 0 }).n, b = (bMap.get(k) || { n: 0 }).n;
          const pg = g / good.length, pb = b / bad.length;
          const gap = wantBad ? pb - pg : pg - pb;
          if (gap >= 0.4 && (wantBad ? b : g) >= 2) out.push({ tag: (bMap.get(k) || gMap.get(k)).tag, inBad: b, inGood: g, gap: Math.round(gap * 100) / 100 });
        }
        return out.sort((x, y) => y.gap - x.gap).slice(0, 15);
      };
      return {
        enough: true,
        good: good.length,
        bad: bad.length,
        need,
        prompt: pick(tally(good, "prompt"), tally(bad, "prompt"), "prompt", true),
        negative: pick(tally(good, "negative"), tally(bad, "negative"), "negative", false)
      };
    }
    module2.exports = { Ratings, suggestions };
  }
});

