// src/server/updates.js
var require_updates = __commonJS({
  "src/server/updates.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    function flatten(prompts) {
      const out = {};
      const walk = (v, p) => {
        if (typeof v === "string") {
          if (v.trim()) out[p.join(".")] = v;
          return;
        }
        if (Array.isArray(v)) {
          v.forEach((x, i) => {
            if (typeof x === "string") walk(x, p.concat(String(i)));
          });
          return;
        }
        if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p.concat(k));
      };
      for (const [sec, v] of Object.entries(prompts || {})) {
        if (sec === "parts" || sec === "exposure" || sec === "rules" || sec === "rulesAll") continue;
        if (sec === "patrons") {
          walk({ quality: v.quality, negative: v.negative }, ["patrons"]);
          (v.archetypes || []).forEach((a, i) => walk(a.tags, ["patrons", "archetypes", String(i)]));
          continue;
        }
        walk(v, [sec]);
      }
      for (const k of Object.keys(out)) if (/\.(name|group)$/.test(k) || /^heroines\.custom_/.test(k)) delete out[k];
      return out;
    }
    function diff(oldFlat, newFlat) {
      const changed = [], added = [], removed = [];
      for (const [k, v] of Object.entries(newFlat)) {
        if (!(k in oldFlat)) added.push({ path: k, now: v });
        else if (oldFlat[k] !== v) changed.push({ path: k, was: oldFlat[k], now: v });
      }
      for (const [k, v] of Object.entries(oldFlat)) if (!(k in newFlat)) removed.push({ path: k, was: v });
      return { changed, added, removed };
    }
    function affectedEdits(d, settings) {
      const touched = new Map([...d.changed.map((x) => [x.path, x]), ...d.removed.map((x) => [x.path, Object.assign({ gone: true }, x)])]);
      const out = [];
      const visit = (layer, who) => {
        const mine = flatten(layer && layer.prompts || {});
        for (const k of Object.keys(mine)) {
          const hit = touched.get(k) || touched.get(k.replace(/\.\d+$/, "")) || [...touched.keys()].filter((t) => t.startsWith(k + ".")).map((t) => touched.get(t))[0];
          if (hit) out.push({ path: k, who, yours: mine[k], was: hit.was, now: hit.now || "", gone: !!hit.gone });
        }
      };
      visit(settings.layer, "all heroines");
      for (const [h, l] of Object.entries(settings.heroine || {})) visit(l, h);
      for (const [id, l] of Object.entries(settings.saves || {})) visit(l, ((settings.saveInfo || {})[id] || {}).name || id);
      return out;
    }
    var UpdateCheck = class {
      constructor(dataDir) {
        this.file = path.join(dataDir, "game-snapshot.json");
        this.report = null;
        this.lastHash = "";
      }
      read() {
        try {
          return JSON.parse(fs.readFileSync(this.file, "utf8"));
        } catch (_) {
          return null;
        }
      }
      write(snap) {
        try {
          fs.mkdirSync(path.dirname(this.file), { recursive: true });
          fs.writeFileSync(this.file, JSON.stringify(snap) + "\n");
        } catch (_) {
        }
      }
      /** Called whenever the game's index.html is (re)read. */
      check(hash, version, prompts, settings) {
        if (!hash || hash === this.lastHash) return this.report;
        this.lastHash = hash;
        const flat = flatten(prompts);
        const snap = this.read();
        if (!snap) {
          this.write({ hash, version, at: Date.now(), prompts: flat });
          this.report = null;
          return null;
        }
        if (snap.hash === hash) {
          this.report = snap.pending || null;
          return this.report;
        }
        const d = diff(snap.prompts || {}, flat);
        const n = d.changed.length + d.added.length + d.removed.length;
        this.report = n ? Object.assign({ from: snap.version || snap.hash, to: version || hash, at: Date.now(), hash }, d, { edits: affectedEdits(d, settings) }) : null;
        if (!n) this.write({ hash, version, at: Date.now(), prompts: flat });
        else {
          snap.pending = this.report;
          this.write(snap);
        }
        this.pendingFlat = flat;
        this.pendingMeta = { hash, version };
        return this.report;
      }
      /** "Got it": the new game becomes the baseline. */
      acknowledge(prompts) {
        const flat = this.pendingFlat || flatten(prompts);
        const meta = this.pendingMeta || { hash: this.lastHash, version: "" };
        this.write({ hash: meta.hash, version: meta.version, at: Date.now(), prompts: flat });
        this.report = null;
      }
    };
    module2.exports = { UpdateCheck, flatten, diff, affectedEdits };
  }
});

