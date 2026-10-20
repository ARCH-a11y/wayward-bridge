// src/server/library.js
var require_library = __commonJS({
  "src/server/library.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var { writeAtomic } = require_store();
    var safe = (s) => String(s || "").replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 150) || "image";
    var Library = class {
      constructor(dir) {
        this.dir = dir;
        this.indexFile = path.join(dir, "index.json");
        this.index = {};
        this.generatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      load() {
        fs.mkdirSync(this.dir, { recursive: true });
        try {
          this.index = JSON.parse(fs.readFileSync(this.indexFile, "utf8")) || {};
        } catch (_) {
          this.index = {};
        }
        for (const [k, list] of Object.entries(this.index)) {
          this.index[k] = (Array.isArray(list) ? list : []).filter((e) => e && e.file && fs.existsSync(path.join(this.dir, e.file)));
          if (!this.index[k].length) delete this.index[k];
        }
        return this;
      }
      persist() {
        writeAtomic(this.indexFile, JSON.stringify(this.index));
        this.generatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      add(key, buf, ext, meta) {
        const folder = /^patron_/i.test(key) ? "patrons" : safe(String(key).split("__")[0]);
        fs.mkdirSync(path.join(this.dir, folder), { recursive: true });
        let stem = folder + "/" + safe(key) + "__" + Date.now().toString(36), file = stem + (ext || ".png"), n = 2;
        while (fs.existsSync(path.join(this.dir, file))) file = stem + "-" + n++ + (ext || ".png");
        fs.writeFileSync(path.join(this.dir, file), buf);
        (this.index[key] = this.index[key] || []).push(Object.assign({ file, at: Date.now() }, meta || {}));
        this.persist();
        return file;
      }
      keyForFile(rel) {
        rel = String(rel || "").replace(/^wb\//, "");
        for (const [k, list] of Object.entries(this.index)) if (list.some((e) => e.file === rel)) return k;
        return "";
      }
      latest(key) {
        const l = this.index[key];
        return l && l.length ? l[l.length - 1] : null;
      }
      history(key) {
        return (this.index[key] || []).slice().reverse();
      }
      rate(key, rating) {
        const e = this.latest(key);
        if (e) {
          e.rating = rating;
          this.persist();
        }
      }
      removeLatest(key) {
        const l = this.index[key];
        if (!l || !l.length) return false;
        const e = l.pop();
        fs.rmSync(path.join(this.dir, e.file), { force: true });
        if (!l.length) delete this.index[key];
        this.persist();
        return true;
      }
      /** Delete one picture (by file, else the newest of the key). */
      remove(key, file) {
        if (!file) return this.removeLatest(key);
        key = key || this.keyForFile(file);
        const l = this.index[key] || [];
        const i = l.findIndex((e2) => e2.file === file);
        if (i < 0) return false;
        const [e] = l.splice(i, 1);
        fs.rmSync(path.join(this.dir, e.file), { force: true });
        if (!l.length) delete this.index[key];
        this.persist();
        return true;
      }
      /** "Save current scene": a kept picture is never auto-deleted. */
      keep(key, file, on) {
        key = key || this.keyForFile(file);
        const l = this.index[key] || [];
        const e = file ? l.find((x) => x.file === file) : l[l.length - 1];
        if (!e) return false;
        if (on) {
          e.keep = true;
          e.rating = "good";
        } else delete e.keep;
        this.persist();
        return true;
      }
      /** Make an older image the current one for its key. */
      promote(key, file) {
        const l = this.index[key] || [];
        const i = l.findIndex((e) => e.file === file);
        if (i < 0) return false;
        l.push(l.splice(i, 1)[0]);
        this.persist();
        return true;
      }
      filePath(rel) {
        const fp = path.resolve(this.dir, rel);
        return fp.startsWith(path.resolve(this.dir) + path.sep) ? fp : null;
      }
      counts() {
        const out = {};
        for (const k of Object.keys(this.index)) {
          const c = /^patron_/i.test(k) ? null : k.split("__")[0];
          if (c) out[c] = (out[c] || 0) + 1;
        }
        return out;
      }
      /** The game's image-pack format (packFormat 1). */
      pack(enabled, isStale) {
        const entries = {};
        let stale = 0;
        if (enabled) for (const k of Object.keys(this.index)) {
          const e = this.latest(k);
          if (!e) continue;
          if (isStale && isStale(e)) {
            stale++;
            continue;
          }
          entries[k] = { imagePath: "wb/" + e.file, talentName: k, imageType: "portrait" };
        }
        this.lastStale = stale;
        return { packFormat: 1, packId: "wayward-bridge-library", generatedAt: this.generatedAt, characters: Object.keys(this.counts()), entries };
      }
      /**
       * Auto-delete: keep at most `max` pictures. Older versions of a scene go first; the
       * picture the game currently shows for a scene goes only if that is still not enough.
       */
      prune(max) {
        max = Math.max(1, Number(max) || 100);
        const all = [];
        for (const [k, list] of Object.entries(this.index)) list.forEach((e, i) => {
          if (!e.keep) all.push({ k, e, latest: i === list.length - 1 });
        });
        const keptCount = Object.values(this.index).reduce((n, l) => n + l.filter((e) => e.keep).length, 0);
        max = Math.max(0, max - keptCount);
        if (all.length <= max) return 0;
        all.sort((a, b) => a.latest - b.latest || a.e.at - b.e.at);
        let removed = 0;
        for (const item of all.slice(0, all.length - max)) {
          fs.rmSync(path.join(this.dir, item.e.file), { force: true });
          this.index[item.k] = this.index[item.k].filter((x) => x !== item.e);
          if (!this.index[item.k].length) delete this.index[item.k];
          removed++;
        }
        this.persist();
        return removed;
      }
      stats() {
        return { keys: Object.keys(this.index).length, images: Object.values(this.index).reduce((n, l) => n + l.length, 0) };
      }
    };
    module2.exports = { Library };
  }
});

