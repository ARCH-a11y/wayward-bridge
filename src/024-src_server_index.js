// src/server/index.js
var require_server = __commonJS({
  "src/server/index.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var fs = require("fs");
    var path = require("path");
    var crypto = require("crypto");
    var { Store, httpError, getAt } = require_store();
    var { buildDefaultLayer, resolvePipeline, FAMILY } = require_defaults();
    var { importOldConfig } = require_importer();
    var { compose, synthesize } = require_prompt();
    var { Media } = require_media();
    var { parseImageKey, heroineOf, exposureMask } = require_keyparse();
    var { Comfy } = require_comfy();
    var { buildGraph } = require_workflows();
    var { Library } = require_library();
    var { Jobs } = require_jobs();
    var { Game, findGameDir, MIME } = require_game();
    var { loraInfo } = require_lora_info();
    var { scanComfyModelsDir } = require_model_scan();
    var assets = require_assets();
    var { UpdateCheck, flatten: flattenPrompts } = require_updates();
    var { addonItems } = require_items();
    var { clean: cleanSchema, LAYER: LAYER_SCHEMA } = require_schema();
    var { forPlaythrough: childstateFor, tick: childstateTick, prompt: childstatePrompt, current: childstateCurrent, set: childstateSet } = require_childstate();
    var { extract: looksExtract, describe: looksDescribe, random: looksRandom } = require_looks();
    var { Ratings, suggestions } = require_learn();
    var maintainer = require_maintainer();
    var VERSION = assets.VERSION || "dev";
    function isSea() {
      try {
        return require("node:sea").isSea();
      } catch (_) {
        return false;
      }
    }
    var BASE_DIR = isSea() ? path.dirname(process.execPath) : __dirname;
    var args = parseArgs(process.argv.slice(2));
    var DATA_DIR = path.resolve(args.data || process.env.WB_DATA || path.join(BASE_DIR, "wayward-bridge-data"));
    function parseArgs(list) {
      const out = {};
      for (let i = 0; i < list.length; i++) {
        const m = list[i].match(/^--([a-z-]+)(?:=(.*))?$/);
        if (m) out[m[1]] = m[2] !== void 0 ? m[2] : list[i + 1] && !list[i + 1].startsWith("--") ? list[++i] : true;
      }
      return out;
    }
    var game = new Game({ bootstrap: assets.BOOTSTRAP, menuUrl: "/bridge/menu.js?v=" + assets.MENU_HASH, privateDirs: [DATA_DIR] });
    var defaultLayerCache = { key: "", layer: buildDefaultLayer(null) };
    var customHeroines = {
      file: path.join(DATA_DIR, "custom-heroines.json"),
      data: null,
      all() {
        if (!this.data) {
          try {
            this.data = JSON.parse(fs.readFileSync(this.file, "utf8")) || {};
          } catch (_) {
            this.data = {};
          }
        }
        return this.data;
      },
      save() {
        try {
          fs.mkdirSync(path.dirname(this.file), { recursive: true });
          fs.writeFileSync(this.file, JSON.stringify(this.data, null, 1));
        } catch (_) {
        }
      },
      /** The list the game keeps in the browser: names, and which ones still exist. */
      sync(list) {
        const all = this.all(), keep = /* @__PURE__ */ new Set();
        for (const w of list || []) {
          const id = String(w.id || "");
          if (!/^custom_[a-z0-9]+$/i.test(id)) continue;
          keep.add(id);
          all[id] = Object.assign({}, all[id], { name: String(w.name || all[id] && all[id].name || "Custom").slice(0, 40), hidden: false });
        }
        for (const id of Object.keys(all)) if (!keep.has(id) && /^custom_/i.test(id)) all[id].hidden = true;
        this.save();
      },
      /**
       * The game's description for her, from the Base part of its picture requests. Everyday
       * pictures send all of it (so an edit in the builder shows); scenes send a shortened copy,
       * which only counts while nothing longer is known.
       */
      observe(id, base, whole) {
        const all = this.all();
        const text = String(base || "").replace(/^(\s*(1girl|solo)\s*,)+\s*/i, "").trim();
        if (!text) return;
        const cur = all[id] || {};
        const take = whole ? text !== cur.base : !cur.base || text.length > cur.base.length;
        if (take || cur.hidden) {
          all[id] = Object.assign({}, cur, { base: take ? text : cur.base, name: cur.name || id, hidden: false });
          this.save();
        }
      }
    };
    function defaultLayer() {
      const c = game.load();
      const key = c ? c.hash : "";
      if (defaultLayerCache.key !== key) defaultLayerCache = { key, layer: buildDefaultLayer(c && c.catalog) };
      const H = defaultLayerCache.layer.prompts.heroines;
      for (const [id, x] of Object.entries(customHeroines.all())) if (!x.hidden && !(c && c.catalog && c.catalog.heroines && c.catalog.heroines[id])) H[id] = { base: x.base || "", negative: x.negative || "", name: x.name || id, custom: true };
      for (const id of Object.keys(H)) if (H[id].custom && (!customHeroines.all()[id] || customHeroines.all()[id].hidden)) delete H[id];
      return defaultLayerCache.layer;
    }
    var store = new Store(DATA_DIR, defaultLayer);
    var updates = new UpdateCheck(DATA_DIR);
    var ratings = new Ratings(DATA_DIR);
    function gameUpdate() {
      const c = game.load();
      if (!c) return null;
      maintainerReport(c);
      return updates.check(c.hash, c.version, defaultLayer().prompts, store.settings);
    }
    var maintainerHash = "";
    function maintainerReport(c) {
      if (!c.original || c.hash === maintainerHash) return;
      maintainerHash = c.hash;
      try {
        const snap = updates.read();
        const r = maintainer.writeReport(DATA_DIR, c.original, { hash: c.hash, bridge: VERSION, previousFlat: snap && snap.hash !== c.hash ? snap.prompts : null });
        if (r.problems) console.warn("[bridge] compatibility check: " + r.problems + " thing(s) the mod relies on were not found in this game version (details: " + r.file + ")");
      } catch (e) {
        console.warn("[bridge] compatibility check failed:", e.message);
      }
    }
    var library = new Library(path.join(DATA_DIR, "library"));
    var comfy = new Comfy(() => store.settings.app.comfyUrl);
    var media = new Media(() => store.settings.app, DATA_DIR);
    var observed = { exposure: {} };
    var renders = [];
    var drawnWith = /* @__PURE__ */ new Map();
    var lastRequest = /* @__PURE__ */ new Map();
    var lastKey = "";
    var lastHeroine = "";
    var sse = /* @__PURE__ */ new Set();
    function broadcast(event) {
      const line = "data: " + JSON.stringify(event) + "\n\n";
      for (const res of sse) {
        try {
          res.write(line);
        } catch (_) {
        }
      }
    }
    store.onChange((e) => broadcast({ type: "settings", revision: e.revision, reason: e.reason }));
    function heroineIds() {
      const d = defaultLayer().prompts.heroines || {};
      return [.../* @__PURE__ */ new Set([...Object.keys(d), "pippa", "mara", "elena"])];
    }
    function originFn(heroine) {
      return (p) => store.originOf(["prompts", ...p], heroine);
    }
    var activeHeroine = "";
    function currentHeroine() {
      return activeHeroine || lastHeroine || heroineIds()[0] || "";
    }
    function heroineNames() {
      const out = {};
      for (const id of heroineIds()) {
        const n = getAt(store.effective(id), ["prompts", "heroines", id, "name"]);
        if (n) out[id] = n;
      }
      return out;
    }
    function seedFor(key, bypass) {
      if (store.settings.app.seedMode === "stable" && !bypass && store.settings.app.savedMedia && store.settings.app.savedMedia.enabled) return parseInt(crypto.createHash("sha1").update(key).digest("hex").slice(0, 12), 16);
      return Math.floor(Math.random() * 1e15);
    }
    function loraWords(l) {
      const { splitTags, tagKey } = require_tags();
      const scan = getModelScan(false);
      const norm = String(l.model || "").replace(/\\/g, "/"), base = norm.split("/").pop();
      const list = (scan.files || {}).lora || [];
      const it = list.find((x) => String(x.name).replace(/\\/g, "/") === norm) || list.find((x) => String(x.name).replace(/\\/g, "/").split("/").pop() === base);
      const lib = store.settings.app.loraMemory || [], lbase = base.toLowerCase();
      const e = lib.find((x) => x.model === l.model) || lib.find((x) => String(x.model).replace(/\\/g, "/").split("/").pop().toLowerCase() === lbase) || {};
      const found = splitTags(it && it.trigger ? String(it.trigger).replace(/[\n|;]/g, ",") : "").concat(e.words || [], l.words || [], l.trigger || []);
      const removed = new Set([...e.removed || [], ...l.removed || []].map(tagKey));
      const seen = /* @__PURE__ */ new Set();
      return found.filter((w) => {
        const k = tagKey(w);
        if (!k || removed.has(k) || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    function loraApplies(only, parsed) {
      return only.some((o) => {
        const i = String(o).indexOf(":");
        const k = String(o).slice(0, i), v = String(o).slice(i + 1);
        if (k === "scene") return parsed.scene === v || parsed.scene === v.replace(/_bed$/, "");
        if (k === "look") return parsed.lookFocus === v;
        if (k === "task") return parsed.task === v;
        if (k === "outfit") return parsed.outfit === v;
        return false;
      });
    }
    function applyPipeOverride(pipe, o) {
      if (o.checkpoint) pipe.checkpoint = String(o.checkpoint);
      if (o.unet) pipe.unet = String(o.unet);
      if (o.loraStrength && typeof o.loraStrength === "object") pipe.loras = pipe.loras.map((l) => o.loraStrength[l.model] != null ? Object.assign({}, l, { strength: Number(o.loraStrength[l.model]) }) : l);
      if (o.lorasOff) pipe.loras = [];
    }
    function patronSeed(parsed, heroine) {
      const name = String(parsed.patron || "").toLowerCase();
      const named = getAt(store.effective(heroine || currentHeroine()).prompts, ["patrons", "named", name]);
      if (named && named.seed != null) return Number(named.seed);
      return parseInt(crypto.createHash("sha1").update("patron:" + name).digest("hex").slice(0, 12), 16);
    }
    function sizeId(parsed) {
      return parsed.scene ? String(parsed.scene) : parsed.lookFocus ? "look_" + parsed.lookFocus : parsed.task ? "task_" + parsed.task : "";
    }
    function planRender(req) {
      const key = String(req.talentId || "");
      const parsed = parseImageKey(key);
      const heroine = parsed.kind === "patron" ? "" : heroineOf(parsed, heroineIds());
      const forHeroine = parsed.kind === "patron" && req.forHeroine && heroineIds().includes(String(req.forHeroine)) ? String(req.forHeroine) : "";
      const eff = store.effective(heroine || forHeroine || currentHeroine());
      const pipe = resolvePipeline(eff.pipeline);
      const scopedOn = [];
      pipe.loras = (pipe.loras || []).filter((l) => {
        if (!l.only || !l.only.length) return true;
        const hit = loraApplies(l.only, parsed);
        if (hit && l.enabled !== false) scopedOn.push(l);
        return hit;
      });
      if (req.pipeOverride) applyPipeOverride(pipe, req.pipeOverride);
      const d = defaultLayer();
      const child = childstatePrompt(store.dataDir);
      const synth = !req.prompt && !(Array.isArray(req.parts) && req.parts.length) && parsed.kind !== "patron" ? synthesize(parsed, heroine, eff.prompts, child) : null;
      const r = compose({
        parsed,
        heroine,
        gamePrompt: req.prompt || "",
        gameNegative: synth ? synth.negative : req.negativePrompt || "",
        forceVariant: !!req.forceVariant,
        parts: synth ? synth.parts : Array.isArray(req.parts) ? req.parts : null,
        defaults: d.prompts,
        prompts: eff.prompts,
        pipeline: pipe,
        gameQuality: game.catalog && game.catalog.quality || "",
        gameNegatives: game.catalog && game.catalog.negatives || null,
        origin: originFn(heroine),
        child
      });
      if (scopedOn.length && parsed.kind !== "patron") {
        const words = [...new Set(scopedOn.flatMap((l) => loraWords(l)))];
        if (words.length) {
          const have = new Set(r.positive.split(",").map((t) => t.trim().toLowerCase()));
          const add = words.filter((w2) => !have.has(String(w2).trim().toLowerCase()));
          if (add.length) r.positive = r.positive + ", " + add.join(", ");
          r.explain.push({ label: "LoRA trigger words", game: "", final: add.join(", "), changes: [{ id: scopedOn.map((l) => String(l.model).split("/").pop()).join(", "), to: add.join(", "), source: "Pipeline & models: LoRA for this scene / outfit" }] });
        }
      }
      const w = Number(req.width), h = Number(req.height);
      const portrait = parsed.kind === "patron" || w > 0 && w <= 640 && Math.abs(w - h) <= 32;
      const sid = sizeId(parsed);
      const own = !portrait && sid && pipe.sceneSizes && pipe.sceneSizes[sid];
      const size = portrait ? pipe.portrait : own && own.width && own.height ? own : pipe.scene;
      return { key, parsed, heroine, forHeroine, pipe, r, portrait, size };
    }
    async function render(job) {
      const req = job.req;
      const plan = planRender(req);
      const { key, pipe, r, portrait, size } = plan;
      const seed = Number.isFinite(Number(req.seed)) && req.seed !== "" && req.seed != null ? Number(req.seed) : plan.parsed.kind === "patron" ? patronSeed(plan.parsed, plan.forHeroine) : seedFor(key, req.bypassCache);
      const caps = await comfy.capabilities();
      const { graph, notes } = buildGraph({
        p: pipe,
        caps,
        positive: r.positive,
        negative: r.negative,
        seed,
        width: size.width,
        height: size.height,
        portrait,
        prefix: "wayward/" + key.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 120),
        workflowDir: path.join(DATA_DIR, "workflows")
      });
      {
        const fam = FAMILY[pipe.family] || {}, sz = fam.size;
        const mp = size.width * size.height / 1048576, ratio = size.width / size.height;
        if (sz && (mp > sz.mp.hi * 1.15 || ratio < sz.ratio.min * 0.95 || ratio > sz.ratio.max * 1.05)) notes.push("Picture size " + size.width + " \xD7 " + size.height + " (" + mp.toFixed(2) + " MP) is " + (mp > sz.mp.hi * 1.15 ? "bigger" : "a more extreme shape") + " than " + sz.name + " draw well (about " + sz.mp.lo + "\u2013" + sz.mp.hi + ' MP); bodies may come out stretched or doubled. Pipeline & models \u203A "Fit picture to my screen" suggests a better size.');
      }
      if (req.pipeOverride) {
        const o = req.pipeOverride;
        notes.push("Compare models: " + [o.checkpoint && "checkpoint " + String(o.checkpoint).split("/").pop(), o.unet && "UNET " + String(o.unet).split("/").pop(), o.lorasOff && "no LoRAs", o.loraStrength && Object.keys(o.loraStrength).length && "LoRA strength " + Object.entries(o.loraStrength).map(([m, v]) => String(m).split("/").pop() + " " + v).join(", ")].filter(Boolean).join(" \xB7 ") + " (this picture only; your settings are unchanged)");
      }
      const promptId = await comfy.submit(graph);
      job.onCancel = () => comfy.cancel(promptId);
      job.comfyId = promptId;
      if (job.cancelled) job.onCancel();
      const img = await comfy.waitForImage(promptId, 10 * 60 * 1e3, () => job.cancelled);
      if (!img) return {};
      let buf = await comfy.view(img);
      let ext = path.extname(img.filename || ".png").toLowerCase() || ".png";
      const gifSet = pipe.gif || {};
      if (gifSet.enabled && !portrait && !job.cancelled) {
        try {
          buf = await media.makeGif({ comfy, buf, prompt: gifPrompt(gifSet, r), negative: gifSet.negative, fps: gifSet.fps, seconds: gifSet.seconds, workflowDir: path.join(DATA_DIR, "workflows"), isCancelled: () => job.cancelled });
          ext = ".gif";
        } catch (e) {
          notes.push("GIF failed, kept the still picture: " + e.message);
          console.warn("[bridge] GIF failed:", e.message);
        }
      }
      const gameReq = { talentId: key, prompt: req.prompt || "", negativePrompt: req.negativePrompt || "", parts: Array.isArray(req.parts) ? req.parts : void 0, width: req.width, height: req.height, forceVariant: req.forceVariant ? true : void 0 };
      let file, image, imagePath;
      if (req.saveTo === "saved") {
        const sv = media.save(buf, ext, plan.parsed, plan.heroine || currentHeroine());
        file = sv.rel;
        imagePath = "saved/" + sv.rel;
        image = "/images/" + imagePath.split("/").map(encodeURIComponent).join("/");
      } else {
        file = library.add(key, buf, ext, { seed, prompt: r.positive, negative: r.negative, family: pipe.family, req: gameReq, heroine: plan.heroine });
        imagePath = "wb/" + file;
        image = "/images/wb/" + file.split("/").map(encodeURIComponent).join("/");
      }
      const rec = {
        key,
        at: Date.now(),
        seed,
        file,
        image,
        positive: r.positive,
        negative: r.negative,
        explain: r.explain,
        warnings: [...r.warnings, ...notes],
        usingParts: r.usingParts,
        family: pipe.family,
        ms: Date.now() - job.startedAt
      };
      renders.unshift(rec);
      {
        const who = plan.parsed.kind === "patron" ? "patron" : plan.heroine;
        const used = store.layerIdFor(plan.parsed.kind === "patron" ? plan.forHeroine || currentHeroine() : plan.heroine) || (plan.parsed.kind === "patron" ? plan.forHeroine || currentHeroine() : plan.heroine);
        if (who) {
          if (!drawnWith.has(who)) drawnWith.set(who, /* @__PURE__ */ new Set());
          drawnWith.get(who).add(used);
        }
      }
      if (renders.length > 40) renders.pop();
      if (req.aheadFor && req.aheadRev === store.revision) ahead.ready.set(req.aheadFor, { imagePath, rev: store.revision, at: Date.now() });
      if (req.saveTo !== "saved") autoDelete();
      broadcast({ type: "render", key, image: rec.image });
      console.log("[bridge] drew", key, "(" + rec.ms + " ms, seed " + seed + ")" + (r.usingParts ? "" : " [whole-prompt mode]"));
      return { imagePath };
    }
    function gifPrompt(g, r) {
      const scene = g.useScene && r && r.explain ? (r.explain.find((e) => e.label === "Scene" || e.label === "Task" || e.label === "Focus") || {}).final || "" : "";
      return [scene, g.prompt || ""].filter((x) => String(x).trim()).join(", ") || "2D anime animation, slow breathing, hair sway";
    }
    var PATH_KEYS = ["comfyUrl", "modelsDir", "gameDir", "comfyOutputDir", "ffmpegPath"];
    function makeBackup() {
      const addons = {};
      for (const a of store.listAddons()) {
        try {
          addons[a.file] = JSON.parse(fs.readFileSync(path.join(store.addonDir, a.file), "utf8"));
        } catch (_) {
        }
      }
      return { format: "wayward-bridge-backup", version: 1, bridge: VERSION, at: (/* @__PURE__ */ new Date()).toISOString(), settings: store.settings, presets: readPresets(), addons };
    }
    function parseBackup(content) {
      let raw = content;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          throw httpError(400, "Not a JSON file: " + e.message);
        }
      }
      if (!raw || raw.format !== "wayward-bridge-backup" || !raw.settings) throw httpError(400, 'Not a Wayward Bridge backup (made with "Export everything").');
      return raw;
    }
    function backupSummary(raw) {
      const st = raw.settings || {};
      const count = (o) => o && typeof o === "object" ? Object.keys(o).length : 0;
      const heroines = Object.keys(st.heroine || {});
      const rules = (((st.layer || {}).prompts || {}).rulesAll || []).length + heroines.reduce((n, h) => n + (((st.heroine[h] || {}).prompts || {}).rules || []).length, 0);
      const presets = Object.values(raw.presets || {}).reduce((n, k) => n + count(k), 0);
      const paths = PATH_KEYS.filter((k) => (st.app || {})[k]).map((k) => ({ key: k, theirs: st.app[k], mine: store.settings.app[k] || "" }));
      return { bridge: raw.bridge || "", at: raw.at || "", heroines, sharedSections: Object.keys((st.layer || {}).prompts || {}), pipeline: !!(st.layer || {}).pipeline, addons: Object.keys(raw.addons || {}), addonsOn: (st.addons || []).length, presets, rules, paths };
    }
    function restoreBackup(raw, keepPaths) {
      for (const [file, content] of Object.entries(raw.addons || {})) {
        if (!content || content.format !== "wayward-addon") continue;
        require_store().writeAtomic(path.join(store.addonDir, path.basename(file)), JSON.stringify(content, null, 2) + "\n");
      }
      store.addonCache.clear();
      if (raw.presets && typeof raw.presets === "object") writePresets(raw.presets);
      const next = store.normalize(raw.settings);
      if (keepPaths) for (const k of PATH_KEYS) next.app[k] = store.settings.app[k];
      store.settings = next;
      store.save("backup-restored");
    }
    function typicalMs() {
      const ms = renders.slice(0, 10).map((r) => r.ms).filter((x) => x > 0);
      return ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : 0;
    }
    function jobLabel(j) {
      if (j.req.saveTo === "saved") return "Generate all scenes";
      if (j.priority === "batch") return "game: drawing ahead";
      if (j.priority === "ahead") return "mod: drawing ahead";
      if (j.req.pipeOverride) return "compare models";
      return j.req.bypassCache ? "redraw" : "game";
    }
    function jobsInfo() {
      const avg = typicalMs();
      const items = jobs.activeJobs().map((j, i) => {
        const pr = j.comfyId ? comfy.progress.get(j.comfyId) : null;
        const elapsed = j.status === "processing" && j.startedAt ? Date.now() - j.startedAt : 0;
        return {
          id: j.id,
          key: j.req.talentId || "",
          status: j.status,
          kind: jobLabel(j),
          position: i,
          step: pr && pr.max ? { value: pr.value, max: pr.max } : null,
          estimate: !pr && elapsed && avg ? Math.min(0.97, elapsed / avg) : null,
          elapsed
        };
      });
      return { items, batchLeft: jobs.counts().batchLeft, genAll: genAll.running ? { done: genAll.done, total: genAll.total, message: genAll.message } : null, ahead: ahead.status(), typicalMs: Math.round(avg) };
    }
    function explainComfyError(msg, pipe, caps) {
      const m = String(msg || "");
      if (/fetch failed|ECONNREFUSED|ENOTFOUND|timeout|aborted/i.test(m) && !/did not finish/.test(m)) return "ComfyUI is not reachable at " + comfy.base() + ". Is it running, and is the address in Config right?";
      if (/out of memory|CUDA error: out of memory|OutOfMemory|allocat/i.test(m)) return "Your graphics card ran out of memory (VRAM). Try a smaller picture size, turn off the hi-res fix, use fewer LoRAs, or start ComfyUI with --lowvram.";
      const missingNode = m.match(/(?:Cannot execute because node|node type|class_type)\s+['"]?([A-Za-z0-9_ ()-]+?)['"]?\s+(?:does not exist|not found|is not)/i);
      if (missingNode) return 'ComfyUI does not have the node "' + missingNode[1] + '". Install the custom node that provides it (ComfyUI Manager \u203A Install Missing Custom Nodes), or turn off the option that needs it.';
      if (/value_not_in_list|not in list|Value not in list/i.test(m)) {
        const field = (m.match(/(ckpt_name|unet_name|clip_name|vae_name|lora_name|model_name|sampler_name|scheduler)/) || [])[1] || "a model";
        const names = { ckpt_name: "checkpoint", unet_name: "UNET model", clip_name: "CLIP model", vae_name: "VAE", lora_name: "LoRA", model_name: "upscale model", sampler_name: "sampler", scheduler: "scheduler" };
        return "ComfyUI does not have the " + (names[field] || field) + " chosen in Pipeline & models. Pick it again from the list (Config \u203A Scan again if the list is old). ComfyUI said: " + m.slice(0, 300);
      }
      if (/did not finish/.test(m)) return "ComfyUI took too long. It may be busy with other work, or loading a model for the first time; try again.";
      return m;
    }
    function pipelineWarnings(pipe, caps) {
      const out = [];
      if (!caps || !caps.models) return out;
      const has = (list, name) => !name || !list || !list.length || list.some((x) => x === name || x.replace(/\\/g, "/").split("/").pop() === String(name).replace(/\\/g, "/").split("/").pop());
      if (pipe.family === "anima") {
        if (!has(caps.models.unet, pipe.unet)) out.push('UNET "' + pipe.unet + `" is not in ComfyUI's list.`);
        if (!has(caps.models.clip, pipe.clip)) out.push('CLIP "' + pipe.clip + `" is not in ComfyUI's list.`);
        if (!has(caps.models.vae, pipe.vae)) out.push('VAE "' + pipe.vae + `" is not in ComfyUI's list.`);
      } else {
        if (!pipe.checkpoint) out.push("No checkpoint is chosen for " + pipe.family + ".");
        else if (!has(caps.models.checkpoint, pipe.checkpoint)) out.push('Checkpoint "' + pipe.checkpoint + `" is not in ComfyUI's list.`);
      }
      for (const l of pipe.loras || []) if (l.enabled !== false && !has(caps.models.lora, l.model)) out.push('LoRA "' + l.model + `" is not in ComfyUI's list.`);
      if (caps.samplers && caps.samplers.length && pipe.sampler && !caps.samplers.includes(pipe.sampler)) out.push('Sampler "' + pipe.sampler + '" is not offered by this ComfyUI.');
      if (caps.schedulers && caps.schedulers.length && pipe.scheduler && !caps.schedulers.includes(pipe.scheduler)) out.push('Scheduler "' + pipe.scheduler + '" is not offered by this ComfyUI.');
      if (pipe.hires && pipe.hires.enabled && pipe.hires.model && !has(caps.models.upscale, pipe.hires.model)) out.push('Upscale model "' + pipe.hires.model + `" is not in ComfyUI's list.`);
      const dt = pipe.detail || {};
      if (dt.face || dt.hands) {
        if (!caps.nodes || !caps.nodes.faceDetailer || !caps.nodes.detectorProvider) out.push("Face / hand fix is on, but ComfyUI does not have the Impact Pack (FaceDetailer) and Impact Subpack (UltralyticsDetectorProvider) nodes.");
        else if (!(caps.models.detector || []).length) out.push("Face / hand fix: no detector models found (ComfyUI/models/ultralytics/bbox, e.g. face_yolov8m.pt, hand_yolov8s.pt).");
      }
      return out;
    }
    async function testPipeline(b) {
      const t0 = Date.now();
      const heroine = String(b && b.heroine || currentHeroine());
      const pipe = resolvePipeline(store.effective(heroine).pipeline);
      if (!await comfy.ping()) return { ok: false, error: explainComfyError("fetch failed", pipe), warnings: [] };
      const caps = await comfy.capabilities(true);
      const warnings = pipelineWarnings(pipe, caps);
      const positive = [pipe.quality, "1girl, solo, upper body, smile, simple background"].filter(Boolean).join(", ");
      try {
        const { graph, notes } = buildGraph({ p: pipe, caps, positive, negative: pipe.negative || "", seed: 12345, width: 512, height: 512, portrait: false, noHires: !(b && b.hires), noDetail: !(b && b.hires), prefix: "wayward/test-pipeline", workflowDir: path.join(DATA_DIR, "workflows") });
        const id = await comfy.submit(graph);
        const img = await comfy.waitForImage(id, 5 * 60 * 1e3);
        if (!img) return { ok: false, error: "Cancelled.", warnings };
        const buf = await comfy.view(img);
        return { ok: true, ms: Date.now() - t0, warnings, notes, family: pipe.family, image: "data:image/" + (path.extname(img.filename || ".png").slice(1) || "png") + ";base64," + buf.toString("base64") };
      } catch (e) {
        return { ok: false, error: explainComfyError(e.message, pipe, caps), raw: e.message, warnings };
      }
    }
    var genAll = { running: false, stop: false, total: 0, done: 0, failed: 0, skipped: 0, message: "", startedAt: 0, etaMs: 0, heroine: "" };
    function genAllLists(heroine) {
      const P = store.effective(heroine).prompts || {};
      return { scenes: Object.keys(P.scenes || {}), outfits: Object.keys(P.outfits || {}), rooms: Object.keys(P.rooms || {}), moods: Object.keys((P.moods || {}).scene || {}) };
    }
    function startGenAll(o) {
      if (genAll.running) throw httpError(409, "Generate all scenes is already running.");
      const heroine = String(o.heroine || currentHeroine());
      const L = genAllLists(heroine);
      const live = parseImageKey(lastKey || "");
      const cur = { outfit: live.outfit || "modest", room: live.room || "taproom", mood: live.mood || "shy" };
      const ex = (k) => new Set((o["exclude" + k] || []).map(String));
      const pickList = (vary, all, k, current) => {
        const l = vary === false ? [current] : all.filter((x) => !ex(k).has(x));
        return l.length ? l : [current];
      };
      const scenes = L.scenes.filter((x) => !ex("Scenes").has(x));
      const outfits = pickList(o.varyOutfits, L.outfits, "Outfits", cur.outfit);
      const rooms = pickList(o.varyRooms, L.rooms, "Rooms", cur.room);
      const moods = pickList(o.varyMoods, L.moods, "Moods", cur.mood);
      const count = Math.max(1, Math.min(20, Number(o.count) || 5));
      const fill = !!o.fillGaps;
      Object.assign(genAll, { running: true, stop: false, total: scenes.length * outfits.length * rooms.length * moods.length * count, done: 0, failed: 0, skipped: 0, fill, message: "starting", startedAt: Date.now(), etaMs: 0, heroine });
      (async () => {
        try {
          outer: for (const sc of scenes) for (const of of outfits) for (const rm of rooms) for (const md of moods) {
            const have = fill ? media.countFor(parseImageKey(heroine + "__scene-" + sc + "__outfit-" + of + "__room-" + rm + "__mood-" + md + "__v-0"), heroine) : 0;
            if (have) {
              const skip = Math.min(have, count);
              genAll.skipped += skip;
              genAll.total -= skip;
            }
            for (let v = have; v < count; v++) {
              if (genAll.stop) break outer;
              genAll.message = [sc, of, rm, md, "#" + (v + 1)].join(" / ");
              const key = heroine + "__scene-" + sc + "__outfit-" + of + "__room-" + rm + "__mood-" + md + "__v-" + v;
              const job = jobs.create({ talentId: key, prompt: "", negativePrompt: "", saveTo: "saved", bypassCache: true }, "interactive");
              await waitFor(job, 30 * 60 * 1e3);
              if (job.status === "completed" && job.imagePath) genAll.done++;
              else {
                genAll.failed++;
                genAll.message = job.error || "failed";
              }
              const finished = genAll.done + genAll.failed;
              genAll.etaMs = Math.round((Date.now() - genAll.startedAt) / finished * (genAll.total - finished));
            }
          }
          genAll.message = genAll.stop ? "stopped" : "finished";
        } catch (e) {
          genAll.message = e.message;
        } finally {
          genAll.running = false;
          genAll.etaMs = 0;
        }
      })();
    }
    var jobs = new Jobs(render, broadcast);
    var ahead = {
      ready: /* @__PURE__ */ new Map(),
      // key -> { imagePath, rev, at }
      job: null,
      enabled() {
        return !!store.settings.app.drawAhead && !(store.settings.app.savedMedia && store.settings.app.savedMedia.enabled);
      },
      status() {
        this.prune();
        return { enabled: this.enabled(), ready: this.ready.size, drawing: !!(this.job && (this.job.status === "pending" || this.job.status === "processing")) };
      },
      prune() {
        for (const [k, v] of this.ready) if (v.rev !== store.revision || Date.now() - v.at > 30 * 60 * 1e3) this.ready.delete(k);
      },
      clear() {
        this.ready.clear();
        if (this.job && this.job.status !== "completed") jobs.cancel(this.job.id);
        this.job = null;
      },
      take(key) {
        this.prune();
        const v = this.ready.get(key);
        if (!v) return null;
        this.ready.delete(key);
        const fp = library.filePath(String(v.imagePath).replace(/^wb\//, ""));
        return fp && fs.existsSync(fp) ? v : null;
      },
      tick() {
        if (!this.enabled()) {
          if (this.ready.size || this.job) this.clear();
          return;
        }
        this.prune();
        if (this.job && (this.job.status === "pending" || this.job.status === "processing")) return;
        this.job = null;
        if (jobs.activeJobs().length || !comfy.online) return;
        const want = Math.max(1, Math.min(10, Number(store.settings.app.drawAheadCount) || 3));
        if (this.ready.size >= want) return;
        const ids = heroineIds(), cur = currentHeroine();
        const keys = [...lastRequest.keys()].reverse().filter((k) => k !== lastKey && !/^patron_/i.test(k) && !this.ready.has(k) && parseImageKey(k).kind !== "other" && heroineOf(parseImageKey(k), ids) === cur);
        const key = keys[0];
        if (!key) return;
        this.job = jobs.createLow(Object.assign({}, lastRequest.get(key), { talentId: key, bypassCache: true, aheadFor: key, aheadRev: store.revision }));
      }
    };
    setInterval(() => {
      try {
        ahead.tick();
      } catch (e) {
        console.warn("[bridge] draw ahead:", e.message);
      }
    }, 4e3).unref();
    function autoDelete() {
      const r = store.settings.app.retention || {};
      if (!r.enabled) return;
      const max = Math.max(1, Number(r.maxImages) || 100);
      const n = library.prune(max);
      let m = 0;
      const out = String(store.settings.app.comfyOutputDir || "").trim();
      if (out) {
        const dir = path.join(out, "wayward");
        try {
          const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f)).map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => a.t - b.t);
          for (const x of files.slice(0, Math.max(0, files.length - max))) {
            fs.rmSync(path.join(dir, x.f), { force: true });
            m++;
          }
        } catch (_) {
        }
      }
      if (n || m) console.log("[bridge] auto-delete removed", n, "library and", m, "ComfyUI output pictures");
    }
    var PRESET_FILE = path.join(DATA_DIR, "presets.json");
    var PRESET_KINDS = ["character", "outfit", "scene", "mood", "location", "model", "exposure", "parts", "patrons"];
    function readPresets() {
      try {
        return JSON.parse(fs.readFileSync(PRESET_FILE, "utf8")) || {};
      } catch (_) {
        return {};
      }
    }
    function writePresets(all) {
      require_store().writeAtomic(PRESET_FILE, JSON.stringify(all, null, 2) + "\n");
    }
    function importOldPresets(local, server2) {
      const J = (k) => {
        const v = local[k];
        if (!v) return {};
        if (typeof v === "object") return v;
        try {
          return JSON.parse(v) || {};
        } catch (_) {
          return {};
        }
      };
      const groups = Object.assign({ prompt: {}, comfy: {}, outfit: {} }, server2 && server2.groups || {}, J("wayward_preset_groups"));
      const src = {
        prompt: Object.assign({}, server2 && server2.prompt || {}, J("wayward_prompt_presets")),
        comfy: Object.assign({}, server2 && server2.comfy || {}, J("wayward_comfy_presets")),
        outfit: Object.assign({}, server2 && server2.outfit || {}, J("wayward_outfit_presets")),
        scene: J("wayward_scene_presets"),
        mood: J("wayward_mood_presets"),
        loc: J("wayward_location_presets")
      };
      const g2 = { scene: J("wayward_scene_preset_groups"), mood: J("wayward_mood_preset_groups"), loc: J("wayward_location_preset_groups") };
      const all = readPresets();
      let n = 0;
      const put = (kind, name, group, data) => {
        all[kind] = all[kind] || {};
        let nm = String(name).slice(0, 70), i = 2;
        while (all[kind][nm] && JSON.stringify(all[kind][nm].data) !== JSON.stringify(data)) nm = String(name).slice(0, 66) + " (" + i++ + ")";
        if (!all[kind][nm]) n++;
        all[kind][nm] = { group: String(group || "Old mod").slice(0, 60), data, at: Date.now() };
      };
      const P = (po) => importOldConfig({ promptOverrides: po }, game.catalog).layer.prompts;
      for (const [name, v] of Object.entries(src.prompt)) if (v && typeof v === "object") put("character", name, groups.prompt[name], { base: String(v.imageBase || ""), negative: String(v.imageNegative || "") });
      for (const [name, v] of Object.entries(src.comfy)) {
        if (!v || typeof v !== "object") continue;
        const pl = importOldConfig({ comfyConfig: v, turbo: v.turbo }, game.catalog).layer.pipeline;
        const fam = pl.family || v.pipeline || "anima";
        put("model", name, groups.comfy[name], { family: fam, settings: (pl.families || {})[fam] || {} });
      }
      for (const [name, v] of Object.entries(src.outfit)) {
        if (!v || typeof v !== "object") continue;
        const o = Object.assign({}, v);
        const exp = o.__exposure;
        delete o.__exposure;
        const pr = P({ outfit: o, exposure: exp || {} });
        put("outfit", name, groups.outfit[name], { outfits: pr.outfits, exposure: pr.exposure });
      }
      for (const [name, v] of Object.entries(src.scene)) {
        if (v && typeof v === "object") {
          const pr = P({ scenes: v });
          put("scene", name, g2.scene[name], { scenes: pr.scenes, looks: pr.looks, tasks: pr.tasks, expressions: pr.expressions });
        }
      }
      for (const [name, v] of Object.entries(src.mood)) {
        if (v && typeof v === "object") put("mood", name, g2.mood[name], { moods: P({ moods: v }).moods });
      }
      for (const [name, v] of Object.entries(src.loc)) {
        if (v && typeof v === "object") put("location", name, g2.loc[name], { rooms: P({ locations: v }).rooms });
      }
      writePresets(all);
      return n;
    }
    function convertOldPack(raw, fallbackName) {
      if (!raw || typeof raw !== "object" || raw.format === "wayward-addon" || !raw.data || typeof raw.data !== "object") return null;
      const d = raw.data, type = String(raw.type || "");
      const P = (po) => importOldConfig({ promptOverrides: po }, game.catalog).layer.prompts;
      let layer = {};
      if (type === "character") {
        const pr = P(d);
        const heroines = {};
        if (typeof d.imageBase === "string" && d.imageBase.trim()) heroines.any = { base: d.imageBase, negative: String(d.imageNegative || "") };
        Object.assign(heroines, pr.heroines);
        layer = { prompts: { heroines } };
      } else if (type === "clothing" || type === "exposure") {
        const outfit = Object.assign({}, d.outfit || {});
        for (const [id, o] of Object.entries(d.outfitOverrides || {})) outfit[id] = Object.assign({}, outfit[id], o, { imageTags: o && (o.imageTags || o.tags) || "" });
        const pr = P({ outfit, exposure: d.exposure || {} });
        layer = { prompts: { outfits: pr.outfits, exposure: pr.exposure } };
      } else if (type === "scene") {
        const pr = P({ scenes: d.scenes || {} });
        layer = { prompts: { scenes: pr.scenes, looks: pr.looks, tasks: pr.tasks, expressions: pr.expressions } };
      } else if (type === "mood") layer = { prompts: { moods: P({ moods: d.moods || {} }).moods } };
      else if (type === "location") layer = { prompts: { rooms: P({ locations: d.locations || {} }).rooms } };
      else if (type === "pipeline") {
        const pl = importOldConfig({ comfyConfig: d }, game.catalog).layer.pipeline;
        layer = { pipeline: { family: pl.family, families: pl.families } };
      } else throw httpError(400, 'Unknown old add-on type "' + type + '".');
      return { format: "wayward-addon", version: 1, name: String(raw.name || fallbackName || type), description: "Imported from the old mod (" + type + ")", layer };
    }
    function importOldPacks(dir) {
      let n = 0;
      for (const type of ["character", "clothing", "exposure", "scene", "mood", "location", "pipeline"]) {
        let files = [];
        try {
          files = fs.readdirSync(path.join(dir, type)).filter((f) => f.toLowerCase().endsWith(".json"));
        } catch (_) {
          continue;
        }
        for (const f of files) {
          try {
            const raw = JSON.parse(fs.readFileSync(path.join(dir, type, f), "utf8"));
            const conv = convertOldPack(Object.assign({ type }, raw), f.replace(/\.json$/i, ""));
            if (conv) {
              store.importAddon(conv, conv.name);
              n++;
            }
          } catch (e) {
            console.warn("[bridge] could not import old add-on", f, "-", e.message);
          }
        }
      }
      return n;
    }
    var modelScan = null;
    function getModelScan(force) {
      const dir = String(store.settings.app.modelsDir || "").trim();
      if (!dir) return { dir: "", files: {}, error: "No models folder set", counts: {} };
      if (!force && modelScan && modelScan.dirKey === dir) return modelScan;
      try {
        modelScan = Object.assign(scanComfyModelsDir(dir), { dirKey: dir });
      } catch (e) {
        modelScan = { dir, files: {}, error: String(e.message || e), counts: {}, dirKey: dir };
      }
      return modelScan;
    }
    function modelLists() {
      const scan = getModelScan(false);
      const caps = comfy.caps;
      const out = {};
      for (const kind of ["checkpoint", "unet", "clip", "vae", "lora", "upscale"]) {
        const byName = /* @__PURE__ */ new Map();
        for (const it of (scan.files || {})[kind] || []) byName.set(it.name.replace(/\\/g, "/"), Object.assign({}, it, { name: it.name.replace(/\\/g, "/") }));
        for (const n of caps && caps.models && caps.models[kind] || []) {
          const k = n.replace(/\\/g, "/");
          if (!byName.has(k)) byName.set(k, { name: k });
        }
        out[kind] = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
      }
      return { files: out, dir: scan.dir || "", error: scan.error || "", counts: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])) };
    }
    function isStale(entry) {
      if (!entry || !entry.req) return false;
      try {
        const plan = planRender(entry.req);
        return plan.r.positive !== entry.prompt || plan.r.negative !== entry.negative;
      } catch (_) {
        return false;
      }
    }
    function send(res, status, body, headers) {
      const isBuf = Buffer.isBuffer(body);
      const text = isBuf || typeof body === "string" ? body : JSON.stringify(body);
      res.writeHead(status, Object.assign({
        "Content-Type": isBuf ? "application/octet-stream" : typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }, headers || {}));
      res.end(text);
    }
    function localOrigin(origin) {
      if (!origin) return false;
      if (origin === "null") return true;
      try {
        return /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/i.test(new URL(origin).hostname);
      } catch (_) {
        return false;
      }
    }
    function corsOf(req) {
      const origin = req.headers.origin;
      const h = { "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
      if (origin && allowedOrigin(req)) h["Access-Control-Allow-Origin"] = origin;
      return h;
    }
    function allowedOrigin(req) {
      const origin = req.headers.origin;
      if (!origin) return true;
      if (localOrigin(origin)) return true;
      try {
        return new URL(origin).host === String(req.headers.host || "");
      } catch (_) {
        return false;
      }
    }
    async function readJson(req, limit = 20 * 1024 * 1024) {
      const chunks = [];
      let size = 0;
      for await (const c of req) {
        size += c.length;
        if (size > limit) throw httpError(413, "Request too large");
        chunks.push(c);
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch (_) {
        throw httpError(400, "Invalid JSON");
      }
    }
    function trusted(req) {
      const origin = req.headers.origin;
      if (!origin) return !req.headers["sec-fetch-site"] || req.headers["sec-fetch-site"] === "same-origin" || req.headers["sec-fetch-site"] === "none";
      try {
        const u = new URL(origin);
        return u.host === String(req.headers.host || "") || /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/i.test(u.hostname);
      } catch (_) {
        return false;
      }
    }
    function requestFor(key) {
      if (/^patron_/i.test(key) && !lastRequest.get(key)) {
        for (const [k, v] of lastRequest) if (k.toLowerCase() === String(key).toLowerCase()) return Object.assign({}, v, { talentId: k });
      }
      return lastRequest.get(key) || lastRequest.get(String(key).replace(/__v-\d+$/, "")) && Object.assign({}, lastRequest.get(String(key).replace(/__v-\d+$/, "")), { talentId: key }) || library.latest(key) && library.latest(key).req || { talentId: key, prompt: "", negativePrompt: "" };
    }
    var nextSeed = /* @__PURE__ */ new Map();
    function waitFor(job, ms) {
      return new Promise((resolve) => {
        const t0 = Date.now();
        const tick = () => {
          if (job.status === "completed" || job.status === "error" || Date.now() - t0 >= ms) return resolve();
          setTimeout(tick, 100);
        };
        tick();
      });
    }
    function jobReply(job) {
      if (!job) return { status: "error", error: "unknown job" };
      if (job.status === "completed") return job.imagePath ? { status: "completed", promptId: job.id, imagePath: job.imagePath, cached: false } : { status: "error", promptId: job.id, error: "cancelled" };
      if (job.status === "error") return { status: "error", promptId: job.id, error: job.error };
      return { status: job.status === "processing" ? "processing" : "queued", promptId: job.id, progress: comfy.progress.get(job.comfyId) || null };
    }
    async function health() {
      const up = await comfy.ping();
      const c = jobs.counts();
      return { status: up ? "ok" : "error", comfyui: up ? "connected" : "unavailable", server: "wayward-bridge", version: VERSION, capabilities: ["pack", "batch"], images: library.stats().images, jobs: { active: c.processing + c.pending, queued: c.pending } };
    }
    function diagnostics() {
      const c = game.load();
      return {
        version: VERSION,
        dataDir: DATA_DIR,
        node: process.version,
        game: { dir: game.dir, ok: game.ok(), version: c ? c.version : "", hooks: c ? c.hooks : {}, tables: c ? c.catalog.found : {} },
        comfy: { url: comfy.base(), online: comfy.online, error: comfy.capsError, nodes: comfy.caps ? comfy.caps.nodes : null },
        library: library.stats(),
        jobs: jobs.counts()
      };
    }
    function liveInfo() {
      if (!lastKey) return null;
      const parsed = parseImageKey(lastKey);
      const req = lastRequest.get(lastKey) || (library.latest(lastKey) || {}).req || null;
      const parts = {};
      for (const prt of req && req.parts || []) if (prt && prt.label) parts[prt.label] = String(prt.tags || "");
      return { key: lastKey, parsed, heroine: parsed.kind === "patron" ? "" : heroineOf(parsed, heroineIds()), parts };
    }
    function stateFor() {
      const heroine = currentHeroine();
      const addons = store.listAddons().map((a) => Object.assign(a, { layer: (store.readAddon(a.file) || {}).layer || {}, heroine: (store.readAddon(a.file) || {}).heroine || {}, items: [...store.itemsOf(a.file)] }));
      return {
      childstate: (function () { var c = childstateCurrent(store.dataDir); if (c && c.children) c = Object.assign({}, c, { children: c.children.map(function (k) { return Object.assign({}, k, { lookText: looksDescribe(k.look, k.stage, k.sex) }); }) }); return c; })(),
        revision: store.revision,
        app: store.settings.app,
        defaults: defaultLayer(),
        you: store.settings.layer,
        heroineLayers: store.settings.heroine,
        saves: store.settings.saves || {},
        saveInfo: store.settings.saveInfo || {},
        activeSave: store.activeSave,
        addons,
        stack: store.settings.addons,
        picks: store.settings.picks,
        families: FAMILY,
        currentHeroine: heroine,
        activeHeroine,
        lastKey,
        live: liveInfo(),
        observed,
        legacy: store.settings.legacy,
        caps: comfy.caps,
        diagnostics: diagnostics(),
        gameUpdate: gameUpdate(),
        negativeExtras: (game.catalog && game.catalog.negatives && game.catalog.negatives.extras || []).map((x) => ({ id: x.id, label: x.label }))
      };
    }
    function pictureFrom(b) {
      let src = String(b.src || "");
      try {
        src = decodeURIComponent(src);
      } catch (_) {
      }
      let file = String(b.file || "").replace(/^.*?\/images\/wb\//, "").replace(/^wb\//, "");
      try {
        file = decodeURIComponent(file);
      } catch (_) {
      }
      if (!file && /\/images\/wb\//.test(src)) file = src.replace(/^.*?\/images\/wb\//, "").split("?")[0];
      if (!file && /\/images\/saved\//.test(src)) {
        const rel = src.replace(/^.*?\/images\/saved\//, "").split("?")[0];
        const fp = media.filePath(rel);
        return fp && fs.existsSync(fp) ? { kind: "saved", rel, fp, key: String(b.key || lastKey || "") } : { kind: "gone" };
      }
      const key = String(b.key || file && library.keyForFile(file) || lastKey || "");
      if (file) {
        const e2 = library.history(key).find((x) => x.file === file);
        return e2 ? { kind: "wb", e: e2, key, fp: library.filePath(e2.file) } : { kind: "gone", key };
      }
      if (src && !/^data:/.test(src)) return { kind: "other", key };
      const e = library.latest(key);
      return e ? { kind: "wb", e, key, fp: library.filePath(e.file) } : { kind: "none", key };
    }
    async function handleBridge(req, res, p, url) {
      if (!trusted(req)) return send(res, 403, { error: "Only the game page served by Wayward Bridge can use this." });
      const m = req.method;
      if (p === "/bridge/api/state" && m === "GET") return send(res, 200, stateFor());
      if (p === "/bridge/api/ping" && m === "GET") return send(res, 200, { ok: true, revision: store.revision });
      if (p === "/bridge/api/childstate" && m === "GET") {
        return send(res, 200, childstateFor(store.dataDir, String(url.searchParams.get("playthrough") || "")));
      }
      if (p === "/bridge/api/childstate/tick" && m === "POST") {
        const body = await readJson(req);
        const ctx2 = Object.assign({}, body.ctx || {});
        try {
          const hero = currentHeroine();
          const hh = (store.settings.layer.prompts.heroines || {})[hero] || {};
          const txt = [hh.base].concat(Object.keys(hh.sections || {}).map((kk) => hh.sections[kk] && hh.sections[kk].tags)).filter(Boolean).join(", ");
          ctx2.motherLook = looksExtract(txt);
          if (ctx2.father === "player" || ctx2.patronId === "player") {
            const cur = (store.settings.layer.player || {}).look;
            if (cur && cur.set) ctx2.fatherLook = cur;
            else { const l = looksRandom(); l.set = true; try { store.patch([{ path: ["layer", "player", "look"], value: l }], store.revision); } catch (e) {} ctx2.fatherLook = l; }
          }
        } catch (e) {}
        const cs = childstateTick(store.dataDir, String(body.playthrough || ""), Number(body.day) || 0, ctx2);
        return send(res, 200, { ok: true, state: cs });
      }
      if (p === "/bridge/api/childstate/set" && m === "POST") {
        const body = await readJson(req);
        const cs2 = childstateSet(store.dataDir, String(body.playthrough || ""), body.patch || {});
        return send(res, 200, { ok: true, state: cs2 });
      }
      if (p === "/bridge/api/settings" && m === "PATCH") {
        const body = await readJson(req);
        const r = store.patch(body.ops, body.revision);
        return send(res, 200, Object.assign(r, { state: stateFor(), warnings: store.lastWarnings || [] }));
      }
      if (p === "/bridge/api/undo" && m === "POST") return send(res, 200, { ok: store.undo(), state: stateFor() });
      if (p === "/bridge/api/events" && m === "GET") {
        res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
        res.write('data: {"type":"hello"}\n\n');
        sse.add(res);
        const ping = setInterval(() => {
          try {
            res.write(": ping\n\n");
          } catch (_) {
          }
        }, 25e3);
        req.on("close", () => {
          clearInterval(ping);
          sse.delete(res);
        });
        return;
      }
      if (p === "/bridge/api/addons/preview" && m === "POST") {
        const body = await readJson(req);
        let raw = body.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch (e) {
            throw httpError(400, "Not a JSON file: " + e.message);
          }
        }
        const conv = convertOldPack(raw, body.name) || raw;
        if (!conv || conv.format !== "wayward-addon") throw httpError(400, "Not a Wayward add-on file.");
        const a = { layer: cleanSchema(LAYER_SCHEMA, conv.layer) || {}, heroine: {} };
        for (const [h, l] of Object.entries(conv.heroine || {})) a.heroine[h] = cleanSchema(LAYER_SCHEMA, l) || {};
        const heroine = String(body.heroine || currentHeroine());
        const cur = flattenPrompts(store.effective(heroine).prompts);
        const theirs = flattenPrompts(Object.assign({}, a.layer.prompts || {}, (a.heroine[heroine] || {}).prompts || {}));
        const changes = [];
        let same = 0, added = 0;
        for (const [k, v] of Object.entries(theirs)) {
          if (!(k in cur)) {
            added++;
            changes.push({ path: k, now: "", theirs: v });
          } else if (cur[k] !== v) changes.push({ path: k, now: cur[k], theirs: v });
          else same++;
        }
        const rules = [...(a.layer.prompts || {}).rulesAll || [], ...(a.layer.prompts || {}).rules || []];
        const pl = a.layer.pipeline || {};
        return send(res, 200, {
          name: String(conv.name || body.name || "add-on"),
          description: String(conv.description || ""),
          items: [...addonItems(a)],
          changes: changes.slice(0, 60),
          changeCount: changes.length,
          same,
          added,
          rules: rules.length,
          pipeline: pl.family || Object.keys(pl).length ? { family: pl.family || "", families: Object.keys(pl.families || {}) } : null,
          heroines: Object.keys(a.heroine),
          layer: a.layer,
          heroine: a.heroine
        });
      }
      if (p === "/bridge/api/addons/import" && m === "POST") {
        const body = await readJson(req);
        let raw = body.content;
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch (e) {
            throw httpError(400, "Not a JSON file: " + e.message);
          }
        }
        const file = store.importAddon(convertOldPack(raw, body.name) || raw, body.name);
        return send(res, 200, { ok: true, file, state: stateFor() });
      }
      if (p === "/bridge/api/addons/create" && m === "POST") {
        const body = await readJson(req);
        const file = store.createAddon(String(body.name || "My add-on"), body.description, body.layer || {}, body.heroine);
        return send(res, 200, { ok: true, file, state: stateFor() });
      }
      if (p === "/bridge/api/addons/stack" && m === "POST") {
        const body = await readJson(req);
        store.setAddonStack(body.files);
        return send(res, 200, { ok: true, state: stateFor() });
      }
      if (p.startsWith("/bridge/api/addons/") && (m === "GET" || m === "DELETE")) {
        const file = path.basename(decodeURIComponent(p.slice("/bridge/api/addons/".length)));
        if (m === "DELETE") {
          store.removeAddon(file);
          return send(res, 200, { ok: true, state: stateFor() });
        }
        const fp = path.join(store.addonDir, file);
        if (!fs.existsSync(fp)) return send(res, 404, { error: "not found" });
        return send(res, 200, fs.readFileSync(fp, "utf8"), { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="' + file.replace(/"/g, "") + '"' });
      }
      if (p === "/bridge/api/renders" && m === "GET") {
        const there = (r) => {
          try {
            const fp = String(r.image || "").startsWith("/images/saved/") ? media.filePath(r.file) : library.filePath(r.file);
            return !!fp && fs.existsSync(fp);
          } catch (_) {
            return false;
          }
        };
        for (let i = renders.length - 1; i >= 0; i--) if (!there(renders[i])) renders.splice(i, 1);
        return send(res, 200, { renders });
      }
      if (p === "/bridge/api/models" && m === "GET") {
        if (url.searchParams.get("rescan")) getModelScan(true);
        return send(res, 200, modelLists());
      }
      if (p === "/bridge/api/presets" && m === "GET") return send(res, 200, { presets: readPresets() });
      if (p === "/bridge/api/presets" && m === "POST") {
        const b = await readJson(req);
        const kind = String(b.kind || ""), name = String(b.name || "").trim().slice(0, 80);
        if (!PRESET_KINDS.includes(kind) || !name) throw httpError(400, "Preset needs a kind and a name.");
        const all = readPresets();
        all[kind] = all[kind] || {};
        all[kind][name] = { group: String(b.group || "").trim().slice(0, 60), data: b.data == null ? {} : b.data, at: Date.now() };
        writePresets(all);
        return send(res, 200, { ok: true, presets: all });
      }
      if (p === "/bridge/api/presets" && m === "DELETE") {
        const kind = String(url.searchParams.get("kind") || ""), name = String(url.searchParams.get("name") || "");
        const all = readPresets();
        if (all[kind]) delete all[kind][name];
        writePresets(all);
        return send(res, 200, { ok: true, presets: all });
      }
      if (p === "/bridge/api/preview" && m === "POST") {
        const body = await readJson(req);
        const key = String(body.key || lastKey || "");
        const prev = requestFor(key);
        const plan = store.withDrafts(body.ops, () => planRender(prev));
        return send(res, 200, { key, positive: plan.r.positive, negative: plan.r.negative, explain: plan.r.explain, warnings: plan.r.warnings, usingParts: plan.r.usingParts, drafts: Array.isArray(body.ops) ? body.ops.length : 0 });
      }
      if (p === "/bridge/api/explain" && m === "GET") {
        let file = String(url.searchParams.get("file") || "").replace(/^.*?\/images\/wb\//, "").replace(/^wb\//, "");
        try {
          file = decodeURIComponent(file);
        } catch (_) {
        }
        const key = String(url.searchParams.get("key") || file && library.keyForFile(file) || lastKey || "");
        const rec = renders.find((r) => file && r.file === file) || renders.find((r) => r.key === key);
        if (rec) return send(res, 200, { key: rec.key, seed: rec.seed, positive: rec.positive, negative: rec.negative, explain: rec.explain, drawn: true });
        const e = file && library.history(key).find((x) => x.file === file) || library.latest(key);
        const plan = planRender(requestFor(key));
        return send(res, 200, { key, seed: e ? e.seed : null, positive: e ? e.prompt : plan.r.positive, negative: e ? e.negative : plan.r.negative, explain: plan.r.explain, drawn: !!e });
      }
      if (p === "/bridge/api/use-picture" && m === "POST") {
        const b = await readJson(req);
        const key = String(b.key || "");
        let img = String(b.image || "");
        try {
          img = decodeURIComponent(img);
        } catch (_) {
        }
        let rel;
        if (/\/images\/wb\//.test(img)) {
          rel = img.replace(/^.*?\/images\/wb\//, "");
          if (!library.promote(key || library.keyForFile(rel), rel)) return send(res, 404, { error: "That picture is no longer in the library." });
        } else if (/\/images\/saved\//.test(img)) {
          const fp = media.filePath(img.replace(/^.*?\/images\/saved\//, ""));
          if (!fp || !fs.existsSync(fp)) return send(res, 404, { error: "That saved picture is gone." });
          rel = library.add(key, fs.readFileSync(fp), path.extname(fp), { req: requestFor(key) });
        } else return send(res, 400, { error: "Unknown picture." });
        broadcast({ type: "render", key });
        return send(res, 200, { ok: true, key, imagePath: "wb/" + rel, image: "/images/wb/" + rel.split("/").map(encodeURIComponent).join("/") });
      }
      if (p === "/bridge/api/redraw" && m === "POST") {
        const body = await readJson(req);
        const key = String(body.key || "");
        if (!key) return send(res, 400, { error: "No picture key." });
        const prev = requestFor(key);
        const seed = body.seed === "same" ? (library.latest(key) || {}).seed : body.seed;
        const over = body.pipeOverride && typeof body.pipeOverride === "object" ? { checkpoint: body.pipeOverride.checkpoint, unet: body.pipeOverride.unet, loraStrength: body.pipeOverride.loraStrength, lorasOff: !!body.pipeOverride.lorasOff } : void 0;
        const job = jobs.create(Object.assign({}, prev, { talentId: key, bypassCache: true, seed, pipeOverride: over, forHeroine: /^patron_/i.test(key) && body.heroine ? String(body.heroine) : void 0 }), "interactive");
        if (!body.wait) return send(res, 200, { ok: true, id: job.id });
        await waitFor(job, 10 * 60 * 1e3);
        const e = library.latest(key);
        if (job.status !== "completed" || !job.imagePath) return send(res, 500, { error: job.error || "The picture could not be drawn." });
        return send(res, 200, { ok: true, id: job.id, imagePath: job.imagePath, image: "/images/" + job.imagePath, seed: e && e.seed });
      }
      if (p === "/bridge/api/picture" && m === "GET") {
        let file = String(url.searchParams.get("file") || "").replace(/^.*?\/images\/wb\//, "").replace(/^wb\//, "");
        try {
          file = decodeURIComponent(file);
        } catch (_) {
        }
        let key = String(url.searchParams.get("key") || "");
        if (file) key = library.keyForFile(file) || key;
        const list = key ? library.history(key) : [];
        const e = file && list.find((x) => x.file === file) || list[0] || null;
        return send(res, 200, { key, file: e ? e.file : "", seed: e ? e.seed : null, rating: e ? e.rating || "" : "", kept: !!(e && e.keep), versions: list.length, prompt: e ? e.prompt : "", negative: e ? e.negative : "" });
      }
      if (p === "/bridge/api/next-seed" && m === "POST") {
        const b = await readJson(req);
        const key = String(b.key || "");
        const seed = b.seed === "same" ? (library.latest(key) || {}).seed : b.seed;
        if (!key || seed == null || seed === "") {
          nextSeed.delete(key);
          return send(res, 200, { ok: false, error: "No seed known for this picture yet." });
        }
        nextSeed.set(key, Number(seed));
        setTimeout(() => nextSeed.delete(key), 6e4);
        return send(res, 200, { ok: true, seed: Number(seed) });
      }
      if (p === "/bridge/api/picture/keep" && m === "POST") {
        const b = await readJson(req);
        return send(res, 200, { ok: library.keep(String(b.key || ""), String(b.file || ""), b.keep !== false) });
      }
      if (p === "/bridge/api/picture/delete" && m === "POST") {
        const b = await readJson(req);
        const pic = pictureFrom(b);
        if (pic.kind === "saved") return send(res, 200, { ok: media.remove(pic.rel), saved: true });
        if (pic.kind === "wb") {
          ratings.add("bad", pic.key, pic.e.prompt, pic.e.negative, pic.e.file);
          return send(res, 200, { ok: library.remove(pic.key, pic.e.file) });
        }
        return send(res, 200, { ok: false });
      }
      if (p === "/bridge/api/library" && m === "GET") return send(res, 200, { key: url.searchParams.get("key"), history: library.history(String(url.searchParams.get("key") || "")) });
      if (p === "/bridge/api/library/promote" && m === "POST") {
        const b = await readJson(req);
        return send(res, 200, { ok: library.promote(String(b.key), String(b.file)) });
      }
      if (p === "/bridge/api/library/remove-latest" && m === "POST") {
        const b = await readJson(req);
        return send(res, 200, { ok: library.removeLatest(String(b.key)) });
      }
      if (p === "/bridge/api/comfy/refresh" && m === "POST") {
        await comfy.ping();
        await comfy.capabilities(true);
        return send(res, 200, { caps: comfy.caps, diagnostics: diagnostics() });
      }
      if (p === "/bridge/api/lora-info" && m === "GET") return send(res, 200, loraInfo(store.settings.app.modelsDir, String(url.searchParams.get("model") || "")));
      if (p === "/bridge/api/import-old" && m === "POST") {
        const body = await readJson(req);
        store.adoptImport(importOldConfig(body.config, game.catalog));
        return send(res, 200, { ok: true, state: stateFor() });
      }
      if (p === "/bridge/api/game-dir" && m === "POST") {
        const body = await readJson(req);
        const dir = String(body.dir || "").trim();
        if (!fs.existsSync(path.join(dir, "index.html"))) throw httpError(400, "No index.html in that folder.");
        store.patch([{ path: ["app", "gameDir"], value: dir }]);
        game.setDir(dir);
        return send(res, 200, { ok: true });
      }
      if (p.startsWith("/bridge/api/addons/") && p.endsWith("/merge") && m === "POST") {
        const file = path.basename(decodeURIComponent(p.slice("/bridge/api/addons/".length, -"/merge".length)));
        const body = await readJson(req);
        store.mergeIntoAddon(file, body.layer || {}, body.heroine);
        return send(res, 200, { ok: true, state: stateFor() });
      }
      if (p === "/bridge/api/saved" && m === "GET") {
        const h = String(url.searchParams.get("heroine") || currentHeroine());
        return send(res, 200, { heroine: h, root: media.savedRoot(), scenes: media.scenes(h), lists: genAllLists(h), genAll });
      }
      if (p === "/bridge/api/saved/list" && m === "GET") {
        const key = String(url.searchParams.get("key") || "");
        const pk = parseImageKey(key);
        const files = media.list(pk, heroineOf(pk, heroineIds())).map((f) => Object.assign(f, { url: "/images/saved/" + f.rel.split("/").map(encodeURIComponent).join("/") }));
        return send(res, 200, { key, files });
      }
      if (p === "/bridge/api/saved/save" && m === "POST") {
        const b = await readJson(req);
        const pic = pictureFrom(b);
        const parsed = parseImageKey(pic.key || "");
        if (parsed.kind === "patron") return send(res, 400, { error: "Patron portraits are not saved as scenes." });
        if (pic.kind === "saved") return send(res, 200, { ok: true, already: true, saved: pic.rel, folder: pic.rel.split("/").slice(0, -1).join(" / "), root: media.savedRoot() });
        if (pic.kind === "other") return send(res, 400, { error: "This is the game's own picture, not one the mod drew. Draw one first (Generate new)." });
        if (pic.kind !== "wb" || !pic.fp || !fs.existsSync(pic.fp)) return send(res, 404, { error: "No picture to save yet for this scene." });
        const before = pic.e.savedRel && media.filePath(pic.e.savedRel);
        if (before && fs.existsSync(before)) return send(res, 200, { ok: true, already: true, saved: pic.e.savedRel, folder: pic.e.savedRel.split("/").slice(0, -1).join(" / "), root: media.savedRoot() });
        const sv = media.save(fs.readFileSync(pic.fp), path.extname(pic.fp), parsed, heroineOf(parsed, heroineIds()));
        pic.e.savedRel = sv.rel;
        library.persist();
        if (b.keep) library.keep(pic.key, pic.e.file, true);
        ratings.add("good", pic.key, pic.e.prompt, pic.e.negative, pic.e.file);
        return send(res, 200, { ok: true, saved: sv.rel, folder: Object.values(sv.v).join(" / "), root: media.savedRoot() });
      }
      if (p === "/bridge/api/saved/heroines" && m === "GET") return send(res, 200, { heroines: media.heroines() });
      if (p === "/bridge/api/saved/scenes" && m === "GET") {
        const h = String(url.searchParams.get("heroine") || currentHeroine());
        return send(res, 200, { heroine: h, scenes: media.scenes(h), lists: genAllLists(h) });
      }
      if (p === "/bridge/api/saved/browse" && m === "GET") {
        const h = String(url.searchParams.get("heroine") || currentHeroine()), sc = String(url.searchParams.get("scene") || "");
        const files = sc ? media.browse(h, sc).map((f) => Object.assign(f, { url: "/images/saved/" + f.rel.split("/").map(encodeURIComponent).join("/") })) : [];
        return send(res, 200, { heroine: h, scene: sc, files });
      }
      if (p === "/bridge/api/saved/fav" && m === "POST") {
        const b = await readJson(req);
        if (!media.filePath(String(b.rel || ""))) throw httpError(400, "Bad picture.");
        media.setFav(String(b.rel), b.on !== false);
        return send(res, 200, { ok: true });
      }
      if (p === "/bridge/api/saved/delete" && m === "POST") {
        const b = await readJson(req);
        return send(res, 200, { ok: media.remove(String(b.rel || "")) });
      }
      if (p === "/bridge/api/saved/move" && m === "POST") {
        const b = await readJson(req);
        return send(res, 200, { ok: true, rel: media.move(String(b.rel || ""), { outfit: b.outfit, room: b.room, mood: b.mood }) });
      }
      if (p === "/bridge/api/saved/clear" && m === "POST") {
        const b = await readJson(req);
        const h = String(b.heroine || currentHeroine());
        const n = b.all ? media.clear(h) : b.scene ? media.clear(h, String(b.scene), { outfit: b.outfit, room: b.room, mood: b.mood }) : 0;
        return send(res, 200, { ok: true, removed: n, scenes: media.scenes(h) });
      }
      if (p === "/bridge/api/gen-all" && m === "POST") {
        startGenAll(await readJson(req));
        return send(res, 200, { ok: true, genAll });
      }
      if (p === "/bridge/api/gen-all" && m === "GET") return send(res, 200, { genAll });
      if (p === "/bridge/api/gen-all/stop" && m === "POST") {
        genAll.stop = true;
        return send(res, 200, { ok: true, genAll });
      }
      if (p === "/bridge/api/ffmpeg-check" && m === "GET") {
        media._ff = null;
        const bin = media.ffmpeg();
        return send(res, 200, { found: !!bin, path: bin });
      }
      if (p === "/bridge/api/gif" && m === "POST") {
        const b = await readJson(req);
        const pic = pictureFrom(b);
        if (pic.kind === "other") return send(res, 400, { error: "This is the game's own picture, not one the mod drew." });
        if (pic.kind !== "wb" && pic.kind !== "saved" || !pic.fp || !fs.existsSync(pic.fp)) return send(res, 404, { error: "No picture to animate yet." });
        const key = pic.key;
        const e = pic.e || library.latest(key) || { req: requestFor(key) };
        const src = fs.readFileSync(pic.fp);
        if (src.slice(0, 3).toString("ascii") === "GIF") return send(res, 400, { error: "This picture is already a GIF." });
        const parsed = parseImageKey(key);
        const hero = parsed.kind === "patron" ? currentHeroine() : heroineOf(parsed, heroineIds());
        const g = resolvePipeline(store.effective(hero).pipeline).gif || {};
        let r = null;
        try {
          r = planRender(e.req || { talentId: key }).r;
        } catch (_) {
        }
        const gif = await media.makeGif({ comfy, buf: src, prompt: gifPrompt(g, r), negative: g.negative, fps: g.fps, seconds: g.seconds, workflowDir: path.join(DATA_DIR, "workflows") });
        const nf = library.add(key, gif, ".gif", { seed: e.seed, prompt: e.prompt, negative: e.negative, family: e.family, req: e.req || requestFor(key), gifOf: pic.kind === "wb" ? e.file : "saved/" + pic.rel });
        broadcast({ type: "render", key });
        return send(res, 200, { ok: true, imagePath: "wb/" + nf, image: "/images/wb/" + nf.split("/").map(encodeURIComponent).join("/") });
      }
      if (p === "/bridge/api/presets/import-old" && m === "POST") {
        const b = await readJson(req);
        const n = importOldPresets(b.local || {}, b.server || {});
        return send(res, 200, { ok: true, imported: n, presets: readPresets() });
      }
      if (p === "/bridge/api/test-pipeline" && m === "POST") return send(res, 200, await testPipeline(await readJson(req)));
      if (p === "/bridge/api/learn" && m === "GET") return send(res, 200, suggestions(ratings.all(), store.settings.app.learnIgnore || []));
      if (p === "/bridge/api/learn/ignore" && m === "POST") {
        const b = await readJson(req);
        const list = [...new Set([...store.settings.app.learnIgnore || [], String(b.tag || "").trim()].filter(Boolean))].slice(-500);
        store.patch([{ path: ["app", "learnIgnore"], value: list }]);
        return send(res, 200, suggestions(ratings.all(), list));
      }
      if (p === "/bridge/api/jobs" && m === "GET") return send(res, 200, jobsInfo());
      if (p === "/bridge/api/jobs/cancel" && m === "POST") {
        const b = await readJson(req);
        if (b.what === "batch") jobs.batchControl("clear");
        else if (b.what === "genall") genAll.stop = true;
        else if (b.what === "ahead") ahead.clear();
        else jobs.cancel(String(b.id || ""));
        return send(res, 200, jobsInfo());
      }
      if (p === "/bridge/api/backup" && m === "GET") {
        const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        return send(res, 200, JSON.stringify(makeBackup(), null, 1), { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="wayward-bridge-backup-' + stamp + '.json"' });
      }
      if (p === "/bridge/api/backup/preview" && m === "POST") {
        const b = await readJson(req, 200 * 1024 * 1024);
        return send(res, 200, backupSummary(parseBackup(b.content)));
      }
      if (p === "/bridge/api/backup/restore" && m === "POST") {
        const b = await readJson(req, 200 * 1024 * 1024);
        restoreBackup(parseBackup(b.content), b.keepPaths !== false);
        return send(res, 200, { ok: true, state: stateFor() });
      }
      if (p === "/bridge/api/active-heroine" && m === "POST") {
        const b = await readJson(req);
        const id = heroineFromSave(String(b.archetype || ""), b.generated && typeof b.generated === "object" ? b.generated : null, String(b.name || ""));
        if (!id) return send(res, 200, { heroine: "", state: stateFor() });
        const fp = String(b.save || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
        const saveId = fp ? id + "." + fp : "";
        const prevSave = store.activeSave;
        const isNew = saveId ? store.useSave(saveId, id, b.name) : false;
        if (!saveId) store.activeSave = "";
        if (id !== activeHeroine) {
          activeHeroine = id;
          lastHeroine = id;
          if (lastKey && !/^patron_/i.test(lastKey) && heroineOf(parseImageKey(lastKey), heroineIds()) !== id) lastKey = "";
        }
        ahead.clear();
        const layerNow = store.layerIdFor(id) || id, drawn = drawnWith.get(id) || /* @__PURE__ */ new Set(), drawnP = drawnWith.get("patron") || /* @__PURE__ */ new Set();
        const stale = !b.first && !b.idChange && prevSave !== store.activeSave && ([...drawn].some((x) => x !== layerNow) || [...drawnP].some((x) => x !== layerNow));
        if (b.first || stale) drawnWith.clear();
        else if (b.idChange && prevSave) {
          for (const set of drawnWith.values()) if (set.delete(prevSave)) set.add(store.activeSave);
        }
        if (isNew) console.log("[bridge] new save of " + id + " (" + (b.name || id) + "): it starts with her most recent settings");
        return send(res, 200, { heroine: id, save: store.activeSave, isNew, reload: stale, archetype: String(b.archetype || ""), state: stateFor() });
      }
      if (p === "/bridge/api/custom-heroines" && m === "POST") {
        const b = await readJson(req);
        customHeroines.sync(b.list);
        return send(res, 200, { ok: true, state: stateFor() });
      }
      if (p === "/bridge/api/maintainer/report" && m === "GET") {
        const c = game.load();
        if (!c) return send(res, 404, { error: "game not found" });
        const r = maintainer.checkGame(c.original, { previousFlat: (updates.read() || {}).prompts });
        if (url.searchParams.get("format") === "json") {
          delete r.catalog;
          return send(res, 200, r);
        }
        res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" });
        return res.end(maintainer.toMarkdown(r, { hash: c.hash, bridge: VERSION }));
      }
      if (p === "/bridge/api/game-update/ack" && m === "POST") {
        updates.acknowledge(defaultLayer().prompts);
        return send(res, 200, { ok: true, state: stateFor() });
      }
      if (p === "/bridge/api/tag-aliases" && m === "GET") {
        return send(res, 200, assets.aliases(), { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "max-age=86400" });
      }
      if (p === "/bridge/api/tags" && m === "GET") {
        return send(res, 200, assets.tags(), { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "max-age=86400" });
      }
      return send(res, 404, { error: "unknown bridge endpoint" });
    }
    async function handleGameApi(req, res, p, url) {
      const m = req.method;
      if (p === "/api/image/health" && m === "GET") {
        const h = await health();
        return send(res, h.comfyui === "connected" ? 200 : 503, h, corsOf(req));
      }
      if (p === "/api/pack" && m === "GET") {
        const useSaved = !!(store.settings.app.savedMedia && store.settings.app.savedMedia.enabled);
        const on = useSaved && store.settings.app.libraryEnabled && !store.settings.app.freshImages;
        const pack = library.pack(on, store.settings.app.redrawChanged !== false ? isStale : null);
        if (useSaved) {
          for (const k of Object.keys(pack.entries)) {
            const pk = parseImageKey(k);
            const hit = media.pick(pk, heroineOf(pk, heroineIds()));
            if (hit) pack.entries[k].imagePath = "saved/" + hit.rel;
          }
        }
        return send(res, 200, pack, corsOf(req));
      }
      if (p === "/api/image/generate" && m === "POST") {
        const body = await readJson(req);
        const key = String(body.talentId || "");
        lastKey = key;
        lastRequest.delete(key);
        lastRequest.set(key, body);
        if (lastRequest.size > 500) lastRequest.delete(lastRequest.keys().next().value);
        if (Array.isArray(body.parts)) {
          const pk = parseImageKey(key);
          if (/^(custom|random)_/i.test(pk.character || "")) {
            const bp = body.parts.find((x) => x && x.label === "Base");
            if (bp) customHeroines.observe(pk.character, bp.tags, !pk.scene);
          }
          const ex = body.parts.find((x) => x && x.label === "Exposure");
          const mask = exposureMask(parseImageKey(key).exposure);
          if (ex && mask) observed.exposure[mask] = String(ex.tags || "");
        }
        const parsedKey = parseImageKey(key);
        if (parsedKey.kind !== "patron") lastHeroine = heroineOf(parsedKey, heroineIds()) || lastHeroine;
        if (store.settings.app.savedMedia && store.settings.app.savedMedia.enabled && !body.bypassCache) {
          const hit = media.pick(parsedKey, heroineOf(parsedKey, heroineIds()));
          if (hit) return send(res, 200, { status: "completed", promptId: "saved-" + Date.now(), imagePath: "saved/" + hit.rel, cached: true }, corsOf(req));
        }
        if (nextSeed.has(key)) {
          body.seed = nextSeed.get(key);
          nextSeed.delete(key);
        }
        const prevPic = library.latest(key);
        const usingSaved = !!(store.settings.app.savedMedia && store.settings.app.savedMedia.enabled);
        if (usingSaved && !body.bypassCache && prevPic && prevPic.seed != null && body.seed == null) body.seed = prevPic.seed;
        if (!body.bypassCache) {
          const ready = ahead.take(key);
          if (ready) return send(res, 200, { status: "completed", promptId: "ahead-" + Date.now(), imagePath: ready.imagePath, cached: false }, corsOf(req));
        }
        const aj = ahead.job && (ahead.job.status === "processing" || ahead.job.status === "pending") ? ahead.job : null;
        let fromAhead = null;
        if (aj && aj.req.talentId === key && !body.bypassCache) {
          aj.req.aheadFor = null;
          fromAhead = aj;
          jobs.promote(aj);
        } else if (aj && aj.status === "processing") jobs.cancel(aj.id);
        const same = fromAhead || !body.bypassCache && jobs.activeFor(key);
        const job = same || jobs.create(body, "interactive");
        await waitFor(job, 1500);
        return send(res, 200, jobReply(job), corsOf(req));
      }
      if (p.startsWith("/api/image/status/") && m === "GET") {
        const job = jobs.get(decodeURIComponent(p.slice("/api/image/status/".length)));
        if (job) await waitFor(job, 2e4);
        return send(res, 200, jobReply(job), corsOf(req));
      }
      if (p === "/api/image/cancel" && m === "POST") {
        const b = await readJson(req);
        return send(res, 200, { ok: jobs.cancel(String(b.promptId || "")) }, corsOf(req));
      }
      if (p === "/api/review/mark" && m === "POST") {
        const b = await readJson(req);
        library.rate(String(b.talentName || ""), b.rating === "good" ? "good" : "regen");
        return send(res, 200, { ok: true }, corsOf(req));
      }
      if (p === "/api/image-hit" && m === "POST") {
        const b = await readJson(req);
        const k = library.keyForFile(b.imagePath);
        if (k && !/^patron_/i.test(k)) {
          lastKey = k;
          lastHeroine = heroineOf(parseImageKey(k), heroineIds()) || lastHeroine;
        }
        return send(res, 200, { ok: true }, corsOf(req));
      }
      if (p === "/api/wife-image-counts" && m === "GET") return send(res, 200, { counts: library.counts() }, corsOf(req));
      if (p === "/api/batch/enqueue" && m === "POST") {
        const b = await readJson(req);
        const items = Array.isArray(b.items) ? b.items : [];
        const fresh = items.filter((it) => it && it.talentId && !library.latest(String(it.talentId)));
        const jobId = jobs.enqueueBatch(fresh, b.jobId, b.start);
        return send(res, 200, { accepted: fresh.length, alreadyCached: items.length - fresh.length, jobId }, corsOf(req));
      }
      if (p === "/api/batch/status" && m === "GET") return send(res, 200, jobs.batchStatus(), corsOf(req));
      if (/^\/api\/batch\/(pause|resume|clear)$/.test(p) && m === "POST") return send(res, 200, jobs.batchControl(p.split("/").pop()), corsOf(req));
      if (p === "/api/video/check" && m === "GET") return send(res, 200, { exists: false }, corsOf(req));
      if (p.startsWith("/api/video/status/")) return send(res, 200, { status: "error", error: "Videos are not available with Wayward Bridge." }, corsOf(req));
      if (p === "/api/video/generate") return send(res, 501, { ok: false, error: "Videos are not available with Wayward Bridge. Use the GIF button on the picture." }, corsOf(req));
      return null;
    }
    function heroineFromSave(arch, gen, name) {
      const cat = game.catalog && game.catalog.heroines || {};
      const builtIn = Object.keys(cat).find((k) => cat[k] && cat[k].archetype === arch);
      let id = "";
      if (gen && gen.shortname && (!arch || gen.id === arch)) id = String(gen.shortname);
      else if (builtIn) id = builtIn;
      else if (gen && gen.shortname) id = String(gen.shortname);
      else if (heroineIds().includes(arch)) id = arch;
      else id = heroineIds().find((k) => arch.startsWith(k + "_")) || Object.keys(cat)[0] || "";
      if (!id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) return "";
      if (!cat[id] && (gen || /^(custom|random)_/i.test(id))) {
        const all = customHeroines.all(), cur = all[id] || {};
        const base = gen && typeof gen.imageBase === "string" ? gen.imageBase.replace(/^(\s*(1girl|solo)\s*,)+\s*/i, "").trim() : "";
        all[id] = Object.assign(
          {},
          cur,
          { name: String(gen && gen.name || name || cur.name || id).slice(0, 40), hidden: false },
          base && !cur.base ? { base } : {},
          gen && typeof gen.imageNegative === "string" && !cur.negative ? { negative: gen.imageNegative } : {}
        );
        customHeroines.save();
      }
      return id;
    }
    function setupPage() {
      return `<!doctype html><meta charset="utf-8"><title>Wayward Bridge</title><body style="font:15px system-ui;background:#1c1917;color:#e7e5e4;max-width:640px;margin:60px auto;padding:0 16px"><h1 style="color:#fbbf24">Wayward Bridge</h1><p>I could not find the game. Put this program in the game folder (next to <code>index.html</code>), or paste the game folder here:</p><form onsubmit="event.preventDefault();fetch('/bridge/api/game-dir',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:this.d.value})}).then(r=>r.json()).then(j=>j.ok?location.reload():alert(j.error))"><input name="d" style="width:100%;padding:8px;background:#292524;color:#fff;border:1px solid #57534e;border-radius:6px" placeholder="C:\\Games\\Wayward"><p><button style="padding:8px 16px">Use this folder</button></p></form><p style="color:#a8a29e">Settings are kept in ` + DATA_DIR.replace(/</g, "&lt;") + "</p>";
    }
    var server = http.createServer(async (req, res) => {
      const url = new URL(req.url, "http://localhost");
      const p = url.pathname;
      try {
        if (req.method === "OPTIONS") {
          res.writeHead(204, Object.assign({ "Access-Control-Max-Age": "86400" }, corsOf(req)));
          return res.end();
        }
        if (p.startsWith("/bridge/api/")) return await handleBridge(req, res, p, url);
        if (p === "/bridge/menu.js") return send(res, 200, assets.MENU_JS, { "Content-Type": MIME[".js"], "Cache-Control": "max-age=31536000, immutable" });
        if (p.startsWith("/api/") && !allowedOrigin(req)) return send(res, 403, { error: "Only the game page can use this." });
        if (p.startsWith("/api/")) {
          const handled = await handleGameApi(req, res, p, url);
          if (handled !== null) return;
          return send(res, 404, { error: "not found" }, corsOf(req));
        }
        if (p.startsWith("/images/wb/")) {
          const fp = library.filePath(decodeURIComponent(p.slice("/images/wb/".length)));
          if (!fp || !fs.existsSync(fp)) return send(res, 404, "not found");
          res.writeHead(200, Object.assign({ "Content-Type": MIME[path.extname(fp).toLowerCase()] || "image/png", "Cache-Control": "max-age=31536000, immutable" }, corsOf(req)));
          return fs.createReadStream(fp).pipe(res);
        }
        if (p.startsWith("/images/saved/")) {
          const fp = media.filePath(decodeURIComponent(p.slice("/images/saved/".length)));
          if (!fp || !/\.(png|jpe?g|webp|gif)$/i.test(fp) || !fs.existsSync(fp)) return send(res, 404, "not found");
          res.writeHead(200, Object.assign({ "Content-Type": MIME[path.extname(fp).toLowerCase()] || "image/png", "Cache-Control": "no-store" }, corsOf(req)));
          return fs.createReadStream(fp).pipe(res);
        }
        if (!game.ok()) {
          if (p === "/" || p === "/index.html") return send(res, 200, setupPage(), { "Content-Type": MIME[".html"] });
          return send(res, 404, "not found");
        }
        if (game.serve(req, res, p, store.settings.app.freshImages || !(store.settings.app.savedMedia && store.settings.app.savedMedia.enabled), p === "/" || p === "/index.html" ? heroineNames() : null)) return;
        send(res, 404, "not found");
      } catch (e) {
        const status = e.status || 500;
        if (status >= 500) console.error("[bridge] error on", req.method, p, "-", e.stack || e);
        if (!res.headersSent) send(res, status, { error: String(e.message || e) });
        else try {
          res.end();
        } catch (_) {
        }
      }
    });
    function repairSceneMoods() {
      const cat = game.catalog;
      if (!cat || !cat.scenes || !cat.expressions) return;
      const { overlap, splitTags: st } = require_tags();
      const ops = [];
      const fix = (prefix, layer) => {
        const ex = layer && layer.prompts && layer.prompts.expressions || {};
        for (const [id, text] of Object.entries(ex)) {
          if (!cat.scenes[id] || typeof text !== "string") continue;
          const asScene = Math.max(0, ...[].concat(cat.scenes[id]).map((v) => overlap(st(text), v)));
          const asMood = overlap(st(text), cat.expressions[id] || "");
          if (asScene <= asMood) continue;
          ops.push({ path: [...prefix, "prompts", "expressions", id], delete: true });
          if (!(layer.prompts.scenes && layer.prompts.scenes[id])) ops.push({ path: [...prefix, "prompts", "scenes", id], value: [text] });
        }
      };
      fix(["layer"], store.settings.layer);
      for (const [h, l] of Object.entries(store.settings.heroine || {})) fix(["heroine", h], l);
      for (const [id, l] of Object.entries(store.settings.saves || {})) fix(["saves", id], l);
      if (ops.length) {
        store.patch(ops);
        console.log("[bridge] moved", ops.filter((o) => o.delete).length, "scene prompt(s) that had been imported as scene moods back to their scenes");
      }
    }
    function perHeroinePicks() {
      const all = (store.settings.picks || {})._all || {};
      const moved = Object.keys(all).filter((it) => it === "pipeline" || it === "patrons" || it.startsWith("named."));
      if (!moved.length) return;
      const ops = [];
      for (const h of heroineIds()) for (const it of moved) if (getAt(store.settings.picks, [h, it]) === void 0) ops.push({ path: ["picks", h, it], value: all[it] });
      for (const it of moved) ops.push({ path: ["picks", "_all", it], delete: true });
      store.patch(ops);
      console.log("[bridge] add-on picks for models and patron portraits are now kept per heroine");
    }
    function firstRunImport() {
      if (store.exists()) return;
      const candidates = [path.join(BASE_DIR, "config.json"), path.join(BASE_DIR, "server", "config.json"), game.dir && path.join(game.dir, "server", "config.json")].filter(Boolean);
      const old = candidates.find((f) => fs.existsSync(f));
      if (!old) {
        store.save("first-run");
        return;
      }
      try {
        const cfg = JSON.parse(fs.readFileSync(old, "utf8"));
        store.adoptImport(importOldConfig(cfg, game.catalog));
        console.log("[bridge] imported your old settings from", old, "(the old file was not changed)");
        const packDir = [String(cfg.addonPacksDir || "").trim(), path.join(path.dirname(old), "add-on packs")].find((d) => d && fs.existsSync(d));
        if (packDir) {
          const n = importOldPacks(packDir);
          if (n) console.log("[bridge] imported", n, "old add-on packs from", packDir);
        }
        const oldPresets = path.join(path.dirname(old), "presets.json");
        if (fs.existsSync(oldPresets)) {
          try {
            const n = importOldPresets({}, JSON.parse(fs.readFileSync(oldPresets, "utf8")));
            console.log("[bridge] imported", n, "presets from", oldPresets);
          } catch (e) {
            console.warn("[bridge] could not import", oldPresets, "-", e.message);
          }
        }
      } catch (e) {
        console.warn("[bridge] could not import", old, "-", e.message);
        store.save("first-run");
      }
    }
    function main() {
      if (args["check-game"]) process.exit(maintainer.cli(args, VERSION));
      store.load();
      library.load();
      const dir = findGameDir([args.game, store.settings.app.gameDir, BASE_DIR, path.dirname(BASE_DIR), process.cwd()]);
      if (dir) {
        game.setDir(dir);
        game.load();
      } else console.warn("[bridge] game folder not found yet \u2014 open the page to choose it.");
      firstRunImport();
      repairSceneMoods();
      try {
        perHeroinePicks();
      } catch (e) {
        console.warn("[bridge] could not update add-on picks:", e.message);
      }
      try {
        const u = gameUpdate();
        if (u) console.log("[bridge] the game was updated: " + u.changed.length + " prompt(s) changed, " + u.added.length + " added, " + u.removed.length + " removed (see Config > Game update check)");
      } catch (e) {
        console.warn("[bridge] game update check failed:", e.message);
      }
      const port = Number(args.port || process.env.WB_PORT || 8788);
      const host = String(args.host || process.env.WB_HOST || "127.0.0.1");
      server.on("error", (e) => {
        if (e.code === "EADDRINUSE") console.error("[bridge] port " + port + " is already in use. Is the bridge already running? Start with --port 8790 to use another.");
        else console.error("[bridge]", e.message);
        process.exit(1);
      });
      const apiPort = args["api-port"] === void 0 ? 8189 : Number(args["api-port"]);
      if (apiPort && apiPort !== port) {
        const alias = http.createServer((req, res) => server.emit("request", req, res));
        alias.on("error", (e) => {
          if (e.code === "EADDRINUSE") console.warn("[bridge] port " + apiPort + " is in use (the official image backend?). The game still works, but it will redraw pictures after a reload instead of reusing them.");
          else console.warn("[bridge] port " + apiPort + ":", e.message);
        });
        alias.listen(apiPort, host);
      }
      server.listen(port, host, () => {
        console.log("");
        console.log("  Wayward Bridge " + VERSION);
        console.log("  Play at  http://" + (host === "0.0.0.0" ? "127.0.0.1" : host) + ":" + port + "/");
        console.log("  Data     " + DATA_DIR);
        console.log("  ComfyUI  " + comfy.base() + " (only contacted over HTTP; never started or stopped)");
        console.log("");
        comfy.ping().then((up) => {
          if (up) comfy.capabilities(true);
          else console.warn("[bridge] ComfyUI is not reachable yet; pictures will fail until it is running.");
        });
      });
      const stop = () => {
        console.log("\n[bridge] stopped.");
        process.exit(0);
      };
      process.on("SIGINT", stop);
      process.on("SIGTERM", stop);
    }
    module2.exports = { main, server, store, library, game, planRender };
  }
});

