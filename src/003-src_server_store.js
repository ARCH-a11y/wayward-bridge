// Аддоны: упорядоченный стек оверлеев, порядок задаёт setAddonStack.
// src/server/store.js
var require_store = __commonJS({
  "src/server/store.js"(exports2, module2) {
    "use strict";
    function shapeDiff(sent, kept) {
      if (typeof sent === "string" && typeof kept === "string" && sent.length > kept.length) return { kind: "string", from: sent.length, to: kept.length };
      if (typeof sent === "number" && typeof kept === "number" && sent !== kept) return { kind: "number", from: sent, to: kept };
      if (Array.isArray(sent) && Array.isArray(kept) && sent.length > kept.length) return { kind: "array", from: sent.length, to: kept.length };
      if (sent && kept && typeof sent === "object" && typeof kept === "object" && !Array.isArray(sent) && !Array.isArray(kept)) {
        const dropped = Object.keys(sent).filter((k) => !Object.prototype.hasOwnProperty.call(kept, k));
        if (dropped.length) return { kind: "keys", count: dropped.length, dropped: dropped.slice(0, 8) };
      }
      return null;
    }
    var fs = require("fs");
    var path = require("path");
    var { SCHEMA, LAYER, validatorFor, clean } = require_schema();
    var { itemPaths, addonItems, addonValue, GLOBAL_ITEMS } = require_items();
    var isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
    var clone = (v) => v === void 0 ? void 0 : JSON.parse(JSON.stringify(v));
    var equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    function merge(base, over) {
      if (!isObj(over)) return over === void 0 ? clone(base) : clone(over);
      const out = isObj(base) ? clone(base) : {};
      for (const [k, v] of Object.entries(over)) out[k] = isObj(v) ? merge(out[k], v) : clone(v);
      return out;
    }
    function getAt(obj, p) {
      return p.reduce((o, k) => o == null ? void 0 : o[k], obj);
    }
    function setAt(obj, p, v) {
      let o = obj;
      for (const k of p.slice(0, -1)) {
        if (!isObj(o[k])) o[k] = {};
        o = o[k];
      }
      Object.defineProperty(o, p[p.length - 1], { value: v, writable: true, enumerable: true, configurable: true });
    }
    function deleteAt(obj, p) {
      const parents = [];
      let o = obj;
      for (const k of p.slice(0, -1)) {
        if (!isObj(o[k])) return;
        parents.push([o, k]);
        o = o[k];
      }
      delete o[p[p.length - 1]];
      for (let i = parents.length - 1; i >= 1; i--) {
        const [parent, key] = parents[i];
        if (isObj(parent[key]) && !Object.keys(parent[key]).length) delete parent[key];
      }
    }
    function writeAtomic(file, text) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = file + "." + process.pid + ".tmp";
      fs.writeFileSync(tmp, text, "utf8");
      for (let i = 0; ; i++) {
        try {
          fs.renameSync(tmp, file);
          return;
        } catch (e) {
          if (i >= 8 || !["EPERM", "EBUSY", "EACCES"].includes(e.code)) {
            try {
              fs.rmSync(tmp, { force: true });
            } catch (_) {
            }
            throw e;
          }
          const until = Date.now() + 25 * (i + 1);
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, until - Date.now()));
        }
      }
    }
    var FAMILY_KEYS = ["checkpoint", "unet", "clip", "vae", "useCheckpointVae", "sampler", "scheduler", "clipSkip", "quality", "negative"];
    function migratePipelineV1(p) {
      if (!isObj(p) || isObj(p.families)) return p;
      const fam = ["anima", "illustrious", "pony", "noobai"].includes(p.family) ? p.family : "anima";
      const f = {};
      for (const k of FAMILY_KEYS) if (p[k] !== void 0 && p[k] !== "" && p[k] !== 0) f[k] = p[k];
      if (Number(p.steps) > 0 || Number(p.cfg) > 0) f.turbo = { enabled: true, steps: Number(p.steps) || void 0, cfg: Number(p.cfg) || void 0 };
      if (Array.isArray(p.loras)) f.loras = p.loras.map((l) => ({ model: l.model, strength: l.strength, enabled: l.enabled, words: l.triggers || [], removed: [], groups: [] }));
      const out = { families: Object.keys(f).length ? { [fam]: f } : {} };
      if (p.family) out.family = p.family;
      for (const k of ["scene", "portrait"]) if (p[k]) out[k] = p[k];
      if (isObj(p.teacache)) out.teacache = p.teacache;
      if (isObj(p.sdxlCache)) out.sdxlCache = Object.assign({}, p.sdxlCache, p.sdxlCache.mode === "easycache" ? { easyReuse: p.sdxlCache.threshold, easyStart: p.sdxlCache.start, easyEnd: p.sdxlCache.end } : {});
      return out;
    }
    function migrate(raw) {
      if (!isObj(raw) || Number(raw.version) >= 3) return raw;
      if (Number(raw.version) === 2) {
        const out2 = clone(raw);
        for (const h of Object.keys(out2.heroine || {})) if (isObj(out2.heroine[h])) delete out2.heroine[h].pipeline;
        out2.version = 3;
        return out2;
      }
      const out = clone(raw);
      if (isObj(out.layer) && out.layer.pipeline) out.layer.pipeline = migratePipelineV1(out.layer.pipeline);
      for (const h of Object.keys(out.heroine || {})) if (isObj(out.heroine[h])) delete out.heroine[h].pipeline;
      out.version = 3;
      return out;
    }
    var DEFAULT_SETTINGS = () => ({
      version: 3,
      app: { comfyUrl: "http://127.0.0.1:8188", modelsDir: "", gameDir: "", freshImages: false, libraryEnabled: true, redrawChanged: true, seedMode: "random", comfyOutputDir: "", retention: { enabled: false, maxImages: 100 }, redrawAfterSave: true, ffmpegPath: "", savedMedia: { enabled: false }, tagDelete: false, sharedNegatives: false, drawAhead: false, drawAheadCount: 3, shortcuts: true },
      layer: {},
      heroine: {},
      // per playthrough: saves[<heroine>.<save id>] = that save's settings (a full copy, like heroine[...]);
      // saveInfo[<id>] = { heroine, name, at }
      saves: {},
      saveInfo: {},
      addons: [],
      picks: {},
      legacy: {}
    });
    var Store = class {
      constructor(dataDir, getDefaultLayer) {
        this.dataDir = dataDir;
        this.file = path.join(dataDir, "settings.json");
        this.addonDir = path.join(dataDir, "addons");
        this.backupDir = path.join(dataDir, "backups");
        this.getDefaultLayer = getDefaultLayer;
        this.revision = 0;
        this.changed = /* @__PURE__ */ new Map();
        this.listeners = /* @__PURE__ */ new Set();
        this.settings = DEFAULT_SETTINGS();
        this.addonCache = /* @__PURE__ */ new Map();
        this.activeSave = "";
      }
      // ---- per-save settings ------------------------------------------------------
      /**
       * Which saved settings a heroine uses: the save being played when it is hers, else her most
       * recently played save, else her heroine settings (from before saves had their own).
       */
      layerIdFor(heroineId, settings) {
        settings = settings || this.settings;
        const info = settings.saveInfo || {}, saves = settings.saves || {};
        if (!heroineId) return "";
        if (this.activeSave && saves[this.activeSave] && info[this.activeSave] && info[this.activeSave].heroine === heroineId) return this.activeSave;
        let best = "", at = -1;
        for (const [id, m] of Object.entries(info)) if (m && m.heroine === heroineId && saves[id] && (m.at || 0) > at) {
          best = id;
          at = m.at || 0;
        }
        return best;
      }
      /** The settings path of a heroine's own settings: ['saves', id] or ['heroine', id]. */
      layerPathFor(heroineId, settings) {
        const id = this.layerIdFor(heroineId, settings);
        return id ? ["saves", id] : ["heroine", heroineId];
      }
      heroineLayer(heroineId, settings) {
        settings = settings || this.settings;
        const id = this.layerIdFor(heroineId, settings);
        return (id ? settings.saves[id] : settings.heroine[heroineId]) || {};
      }
      /** A save seen for the first time starts from her most recent settings ("the last settings used for her"). */
      useSave(saveId, heroineId, name) {
        const st = this.settings;
        st.saves = st.saves || {};
        st.saveInfo = st.saveInfo || {};
        const isNew = !st.saves[saveId];
        if (isNew) {
          st.saves[saveId] = clone(this.heroineLayer(heroineId)) || {};
          const from = this.layerIdFor(heroineId) || heroineId;
          st.picks = st.picks || {};
          if (st.picks[from] && !st.picks[saveId]) st.picks[saveId] = clone(st.picks[from]);
        }
        st.saveInfo[saveId] = { heroine: heroineId, name: String(name || (st.saveInfo[saveId] || {}).name || "").slice(0, 80), at: Date.now() };
        this.activeSave = saveId;
        this.revision = (this.revision || 0) + 1;
        writeAtomic(this.file, JSON.stringify(this.settings, null, 2) + "\n");
        return isNew;
      }
      exists() {
        return fs.existsSync(this.file);
      }
      load() {
        fs.mkdirSync(this.addonDir, { recursive: true });
        if (this.exists()) {
          let raw;
          try {
            raw = JSON.parse(fs.readFileSync(this.file, "utf8"));
          } catch (e) {
            const bad = this.file + ".unreadable-" + Date.now();
            fs.copyFileSync(this.file, bad);
            console.warn("[bridge] settings.json could not be read; kept a copy at", bad, "and started fresh.");
            raw = {};
          }
          this.settings = this.normalize(raw);
        } else {
          this.settings = DEFAULT_SETTINGS();
        }
        return this;
      }
      normalize(raw) {
        const base = DEFAULT_SETTINGS();
        raw = migrate(raw);
        const c = clean(SCHEMA, raw) || {};
        repairStrayCharacters(c);
        return {
          version: 3,
          app: Object.assign(base.app, c.app || {}),
          layer: c.layer || {},
          heroine: c.heroine || {},
          saves: c.saves || {},
          saveInfo: c.saveInfo || {},
          addons: (c.addons || []).filter((f) => fs.existsSync(path.join(this.addonDir, path.basename(f)))),
          picks: c.picks || {},
          legacy: c.legacy || {}
        };
      }
      save(reason) {
        try {
          rememberLoras(this.settings);
        } catch (_) {
        }
        if (this.exists()) {
          fs.mkdirSync(this.backupDir, { recursive: true });
          const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-") + "-" + Math.random().toString(36).slice(2, 7);
          fs.copyFileSync(this.file, path.join(this.backupDir, "settings-" + stamp + ".json"));
          const all = fs.readdirSync(this.backupDir).filter((n) => n.startsWith("settings-")).sort();
          for (const old of all.slice(0, Math.max(0, all.length - 50))) fs.rmSync(path.join(this.backupDir, old), { force: true });
        }
        writeAtomic(this.file, JSON.stringify(this.settings, null, 2) + "\n");
        this.revision++;
        for (const fn of this.listeners) {
          try {
            fn({ reason, revision: this.revision });
          } catch (_) {
          }
        }
      }
      onChange(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
      }
      // ---- add-ons --------------------------------------------------------------
      listAddons() {
        let files = [];
        try {
          files = fs.readdirSync(this.addonDir).filter((n) => n.toLowerCase().endsWith(".json")).sort();
        } catch (_) {
        }
        return files.map((file) => {
          const a = this.readAddon(file);
          return { file, name: a && a.name || file.replace(/\.json$/i, ""), description: a && a.description || "", active: this.settings.addons.includes(file), valid: !!a };
        });
      }
      readAddon(file) {
        const fp = path.join(this.addonDir, path.basename(file));
        let st;
        try {
          st = fs.statSync(fp);
        } catch (_) {
          return null;
        }
        const hit = this.addonCache.get(fp);
        if (hit && hit.mtime === st.mtimeMs) return hit.data;
        let data = null;
        try {
          const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
          if (raw && raw.format === "wayward-addon") {
            const heroine = {};
            for (const [h, l] of Object.entries(raw.heroine || {})) heroine[h] = clean(LAYER, l) || {};
            data = { name: String(raw.name || ""), description: String(raw.description || ""), layer: clean(LAYER, raw.layer) || {}, heroine };
          }
        } catch (_) {
        }
        this.addonCache.set(fp, { mtime: st.mtimeMs, data });
        return data;
      }
      importAddon(content, filename) {
        let raw = content;
        if (typeof raw === "string") raw = JSON.parse(raw);
        if (!raw || raw.format !== "wayward-addon") throw new Error('Not a Wayward add-on file (missing "format": "wayward-addon").');
        const name = String(raw.name || filename || "add-on").trim() || "add-on";
        const file = this.uniqueAddonFile(name);
        writeAtomic(path.join(this.addonDir, file), JSON.stringify(raw, null, 2) + "\n");
        return file;
      }
      /** Add prompts to an existing add-on (the "Save into add-on" action). */
      mergeIntoAddon(file, layer, heroine) {
        const fp = path.join(this.addonDir, path.basename(file));
        const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
        if (!raw || raw.format !== "wayward-addon") throw httpError(400, "Not an add-on file.");
        raw.layer = merge(raw.layer || {}, clean(LAYER, layer) || {});
        for (const [h, l] of Object.entries(heroine || {})) {
          raw.heroine = raw.heroine || {};
          raw.heroine[h] = merge(raw.heroine[h] || {}, clean(LAYER, l) || {});
        }
        writeAtomic(fp, JSON.stringify(raw, null, 2) + "\n");
        this.addonCache.delete(fp);
        this.save("addon-merged");
      }
      createAddon(name, description, layer, heroine) {
        const file = this.uniqueAddonFile(name);
        const rec = { format: "wayward-addon", version: 1, name: String(name), description: String(description || ""), layer: clean(LAYER, layer) || {} };
        if (heroine && Object.keys(heroine).length) rec.heroine = heroine;
        writeAtomic(path.join(this.addonDir, file), JSON.stringify(rec, null, 2) + "\n");
        return file;
      }
      uniqueAddonFile(name) {
        const safe = String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim().slice(0, 60) || "add-on";
        let file = safe + ".json", n = 2;
        while (fs.existsSync(path.join(this.addonDir, file))) file = safe + " (" + n++ + ").json";
        return file;
      }
      removeAddon(file) {
        file = path.basename(file);
        this.settings.addons = this.settings.addons.filter((f) => f !== file);
        for (const scope of Object.values(this.settings.picks || {})) for (const [it, f] of Object.entries(scope || {})) if (f === file) delete scope[it];
        fs.rmSync(path.join(this.addonDir, file), { force: true });
        this.save("addon-removed");
      }
      setAddonStack(files) {
        const known = new Set(this.listAddons().filter((a) => a.valid).map((a) => a.file));
        this.settings.addons = (files || []).map((f) => path.basename(String(f))).filter((f, i, a) => known.has(f) && a.indexOf(f) === i);
        this.save("addon-stack");
      }
      // ---- layers ---------------------------------------------------------------
      itemsOf(file) {
        const a = this.readAddon(file);
        if (!a) return /* @__PURE__ */ new Set();
        if (!a.__items) Object.defineProperty(a, "__items", { value: addonItems(a), enumerable: false });
        return a.__items;
      }
      /** Where one prompt comes from for this heroine: 'mine' or an add-on file. */
      sourceOf(item, heroineId, settings) {
        settings = settings || this.settings;
        const scope = GLOBAL_ITEMS.has(item) ? "_all" : this.layerIdFor(heroineId, settings) || heroineId;
        const pick = scope && settings.picks && settings.picks[scope] ? settings.picks[scope][item] : void 0;
        if (pick === "mine") return "mine";
        if (pick && this.readAddon(pick) && this.itemsOf(pick).has(item)) return pick;
        for (let i = settings.addons.length - 1; i >= 0; i--) if (this.itemsOf(settings.addons[i]).has(item)) return settings.addons[i];
        return "mine";
      }
      /** Items that some add-on could supply for this heroine (enabled ones, or picked). */
      candidateItems(heroineId, settings) {
        settings = settings || this.settings;
        const out = /* @__PURE__ */ new Set();
        for (const f of settings.addons) for (const it of this.itemsOf(f)) out.add(it);
        for (const scope of [this.layerIdFor(heroineId, settings) || heroineId, "_all"]) for (const [it, f] of Object.entries((settings.picks || {})[scope] || {})) if (f !== "mine") out.add(it);
        return out;
      }
      effective(heroineId) {
        const defaults = this.getDefaultLayer();
        let eff = merge(merge(defaults, this.settings.layer), heroineId && this.heroineLayer(heroineId) || {});
        for (const item of this.candidateItems(heroineId)) {
          if (item === "character" && !heroineId) continue;
          const src = this.sourceOf(item, heroineId);
          if (src === "mine") continue;
          const a = this.readAddon(src);
          for (const rel of itemPaths(item, heroineId)) {
            const v = addonValue(a, rel, heroineId);
            if (v === void 0) continue;
            setAt(eff, rel, isObj(v) ? merge(getAt(defaults, rel), v) : clone(v));
          }
        }
        return eff;
      }
      /** Name of what set prompts/pipeline path `rel` for this heroine (for the inspector). */
      originOf(rel, heroineId) {
        const { itemOf } = require_items();
        const item = itemOf(rel);
        if (item) {
          const src = this.sourceOf(item, heroineId);
          if (src !== "mine") {
            const a = this.readAddon(src);
            return "Add-on: " + (a && a.name || src);
          }
        }
        const nameOf = (id) => {
          const n = getAt(this.heroineLayer(id), ["prompts", "heroines", id, "name"]);
          return n || id.charAt(0).toUpperCase() + id.slice(1);
        };
        if (heroineId && getAt(this.heroineLayer(heroineId), rel) !== void 0) return "Your settings \u2014 " + nameOf(heroineId) + (this.layerIdFor(heroineId) ? " (this save)" : " only");
        if (getAt(this.settings.layer, rel) !== void 0) return "Your settings \u2014 all heroines (shared or imported)";
        return "Game default";
      }
      // ---- edits ----------------------------------------------------------------
      /**
       * ops: [{ path: ['layer'|'heroine'|'app', ...], value } | { path, delete: true }]
       * A value equal to what the layers below already give is stored as "no change".
       */
      patch(ops, baseRevision) {
        if (!Array.isArray(ops) || !ops.length) return { ok: true, revision: this.revision };
        const warnings = this.lastWarnings = [];
        const next = clone(this.settings);
        const touched = [];
        for (const op of ops) {
          let p = (op && Array.isArray(op.path) ? op.path : []).map(String);
          if (!p.length || !["layer", "heroine", "saves", "app", "picks"].includes(p[0])) throw httpError(400, "Unknown settings path: " + p.join("."));
          const owner = p[0] === "heroine" ? p[1] : p[0] === "saves" ? ((next.saveInfo || {})[p[1]] || {}).heroine : "";
          if (owner && p[2] === "prompts" && p[3] === "heroines" && p[4] && p[4] !== owner) p = this.layerPathFor(p[4], next).concat(p.slice(2));
          const key = p.join(".");
          if (baseRevision != null && (this.changed.get(key) || 0) > baseRevision) {
            throw httpError(409, "This setting was changed elsewhere since you opened it: " + key);
          }
          if (op.delete) {
            deleteAt(next, p);
            touched.push(key);
            continue;
          }
          const v = validatorFor(p);
          if (!v) throw httpError(400, "Unknown settings path: " + key);
          const value = clean(v, op.value);
          if (value === void 0) throw httpError(400, "Invalid value for " + key);
          const _d = shapeDiff(op.value, value);
          if (_d) warnings.push(Object.assign({ path: key }, _d));
          const below = p[0] === "app" || p[0] === "picks" ? void 0 : this.valueBelow(next, p);
          if (below !== void 0 && equal(below, value)) deleteAt(next, p);
          else setAt(next, p, value);
          touched.push(key);
        }
        this.settings = next;
        this.save("patch");
        for (const k of touched) this.changed.set(k, this.revision);
        return { ok: true, revision: this.revision };
      }
      /** Run fn with unsaved edits applied (nothing is written): previews of drafts. */
      withDrafts(ops, fn) {
        if (!Array.isArray(ops) || !ops.length) return fn();
        const keep = this.settings;
        const next = clone(keep);
        for (const op of ops) {
          const p = (op && Array.isArray(op.path) ? op.path : []).map(String);
          if (!p.length || !["layer", "heroine", "saves", "app", "picks"].includes(p[0])) continue;
          if (op.delete) {
            deleteAt(next, p);
            continue;
          }
          const v = validatorFor(p);
          const value = v ? clean(v, op.value) : void 0;
          if (value !== void 0) setAt(next, p, value);
        }
        this.settings = next;
        try {
          return fn();
        } finally {
          this.settings = keep;
        }
      }
      /** What the layers under the edited one give for this path (to keep storage sparse). */
      valueBelow(settings, p) {
        const rel = p[0] === "layer" ? p.slice(1) : p.slice(2);
        let acc = this.getDefaultLayer();
        if (p[0] === "heroine" || p[0] === "saves") acc = merge(acc, settings.layer);
        return getAt(acc, rel);
      }
      /** Adopt imported settings, keeping only what differs from the layers below. */
      adoptImport(imp) {
        const s = DEFAULT_SETTINGS();
        s.app = Object.assign(s.app, clean(SCHEMA.app, imp.app || {}) || {});
        const defaults = this.getDefaultLayer();
        s.layer = sparseDiff(clean(LAYER, imp.layer || {}) || {}, defaults) || {};
        const below = merge(defaults, s.layer);
        for (const [h, l] of Object.entries(imp.heroine || {})) {
          const d = sparseDiff(clean(LAYER, l) || {}, below);
          if (d && Object.keys(d).length) s.heroine[h] = d;
        }
        s.legacy = clean(SCHEMA.legacy, imp.legacy || {}) || {};
        this.settings = s;
        this.save("import");
      }
      undo() {
        let all = [];
        try {
          all = fs.readdirSync(this.backupDir).filter((n) => n.startsWith("settings-")).sort();
        } catch (_) {
        }
        const last = all[all.length - 1];
        if (!last) return false;
        const raw = JSON.parse(fs.readFileSync(path.join(this.backupDir, last), "utf8"));
        this.settings = this.normalize(raw);
        writeAtomic(this.file, JSON.stringify(this.settings, null, 2) + "\n");
        fs.rmSync(path.join(this.backupDir, last), { force: true });
        this.revision++;
        /* changed не чистим: после undo устаревший клиент должен получить 409 */
        for (const fn of this.listeners) {
          try {
            fn({ reason: "undo", revision: this.revision });
          } catch (_) {
          }
        }
        return true;
      }
    };
    function sparseDiff(value, below) {
      if (!isObj(value)) return equal(value, below) ? void 0 : clone(value);
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        const d = sparseDiff(v, isObj(below) ? below[k] : void 0);
        if (d !== void 0 && !(isObj(d) && !Object.keys(d).length)) out[k] = d;
      }
      return Object.keys(out).length ? out : void 0;
    }
    function rememberLoras(st) {
      const base = (m) => String(m || "").replace(/\\/g, "/").split("/").pop().toLowerCase();
      const key = (w) => String(w).trim().toLowerCase();
      const lib = [];
      for (const e of st.app.loraMemory || []) {
        const t = lib.find((x) => x.model === e.model);
        if (!t) {
          lib.push({ model: e.model, words: [...e.words || []], removed: [...e.removed || []], groups: [...e.groups || []] });
          continue;
        }
        for (const w of e.words || []) if (!t.words.some((x) => key(x) === key(w))) t.words.push(w);
        for (const w of e.removed || []) if (!t.removed.some((x) => key(x) === key(w))) t.removed.push(w);
        for (const g of e.groups || []) if (!t.groups.some((x) => key(x.name) === key(g.name))) t.groups.push(g);
      }
      const visit = (layer) => {
        for (const f of Object.values(((layer || {}).pipeline || {}).families || {})) for (const l of f && f.loras || []) {
          if (!l || !l.model) continue;
          const has = (l.words || []).length || (l.removed || []).length || (l.groups || []).length;
          if (!has) {
            delete l.words;
            delete l.removed;
            delete l.groups;
            continue;
          }
          let e = lib.find((x) => x.model === l.model) || lib.find((x) => base(x.model) === base(l.model));
          if (!e) {
            e = { model: l.model, words: [], removed: [], groups: [] };
            lib.push(e);
          }
          for (const w of l.words || []) if (!e.words.some((x) => key(x) === key(w))) e.words.push(w);
          for (const w of l.removed || []) if (!e.removed.some((x) => key(x) === key(w)) && !e.words.some((x) => key(x) === key(w))) e.removed.push(w);
          for (const g of l.groups || []) if (!e.groups.some((x) => key(x.name) === key(g.name))) e.groups.push(g);
          delete l.words;
          delete l.removed;
          delete l.groups;
        }
      };
      visit(st.layer);
      for (const l of Object.values(st.heroine || {})) visit(l);
      for (const l of Object.values(st.saves || {})) visit(l);
      st.app.loraMemory = lib.slice(-400);
    }
    function repairStrayCharacters(c) {
      for (const [id, layer] of Object.entries(c.saves || {})) {
        const own = ((c.saveInfo || {})[id] || {}).heroine, hs = layer && layer.prompts && layer.prompts.heroines;
        if (own && hs) {
          for (const b of Object.keys(hs)) if (b !== own) delete hs[b];
        }
      }
      const H = c.heroine || {};
      for (const [a, layer] of Object.entries(H)) {
        const hs = layer && layer.prompts && layer.prompts.heroines;
        if (!hs || typeof hs !== "object") continue;
        for (const b of Object.keys(hs)) {
          if (b === a) continue;
          const mine = H[b] = H[b] || {};
          mine.prompts = mine.prompts || {};
          mine.prompts.heroines = mine.prompts.heroines || {};
          const own = mine.prompts.heroines[b] || {};
          mine.prompts.heroines[b] = Object.assign({}, hs[b], own);
          delete hs[b];
          console.warn("[bridge] moved " + b + "'s character prompt out of " + a + "'s settings");
        }
        if (!Object.keys(hs).length) delete layer.prompts.heroines;
      }
    }
    function httpError(status, message) {
      const e = new Error(message);
      e.status = status;
      return e;
    }
    module2.exports = { Store, migrate, merge, getAt, writeAtomic, httpError, clone, equal, sparseDiff };
  }
});

