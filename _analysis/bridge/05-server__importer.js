// src/server/importer.js
var require_importer = __commonJS({
  "src/server/importer.js"(exports2, module2) {
    "use strict";
    var FULL = { pippa: "pippa_waif", mara: "mara_citygirl", elena: "elena_farmgirl" };
    var OLD_WORK_MOODS = { great: "happy", good: "content", neutral: "okay", tired: "unhappy", stressed: "miserable" };
    var s = (v) => typeof v === "string" ? v : "";
    var nonEmpty = (v) => typeof v === "string" && v.trim() !== "";
    var FAMILIES = ["anima", "illustrious", "pony", "noobai"];
    var OLD_QUALITY = { anima: "masterpiece, best quality, newest", other: "masterpiece, best quality, score_9, score_8_up, score_7_up, source_anime" };
    var bool = (v) => v === true || v === "true" || v === "True";
    function importLoras(list) {
      return (Array.isArray(list) ? list : []).filter((l) => l && (typeof l === "string" || l.model)).map((l) => {
        if (typeof l === "string") return { model: l, strength: 1, words: [], removed: [], groups: [] };
        return {
          model: String(l.model),
          strength: Number.isFinite(Number(l.strength)) ? Number(l.strength) : 1,
          words: (l.extraTriggers || []).map(String),
          removed: (l.removedTriggers || []).map(String),
          groups: (Array.isArray(l.groups) ? l.groups : []).filter((g) => g && g.name && Array.isArray(g.tags)).map((g) => ({ name: String(g.name), tags: g.tags.map(String) }))
        };
      });
    }
    function importFamily(cc, turbo) {
      cc = cc || {};
      const fam = FAMILIES.includes(cc.pipeline) ? cc.pipeline : "anima";
      const f = {
        checkpoint: s(cc.checkpoint),
        unet: s(cc.unet),
        clip: s(cc.clip),
        vae: s(cc.vae),
        useCheckpointVae: cc.useCheckpointVae == null ? void 0 : bool(cc.useCheckpointVae),
        sampler: s(cc.sampler),
        scheduler: s(cc.scheduler),
        clipSkip: Number(cc.clipSkip) || void 0,
        quality: fam === "anima" ? OLD_QUALITY.anima : OLD_QUALITY.other,
        // the old mod's prefix, same look
        loras: Array.isArray(cc.loras) ? importLoras(cc.loras) : void 0
      };
      const t = turbo || cc.turbo;
      if (t && typeof t === "object") f.turbo = { enabled: !!t.enabled, steps: Number(t.steps) || void 0, cfg: Number(t.cfg) || void 0 };
      for (const k of Object.keys(f)) if (f[k] === void 0 || f[k] === "") delete f[k];
      if (f.turbo) {
        for (const k of Object.keys(f.turbo)) if (f.turbo[k] === void 0) delete f.turbo[k];
      }
      return { family: fam, settings: f };
    }
    function importCaches(cc) {
      const out = {};
      const tea = cc && cc.animaTeaCache;
      if (tea && typeof tea === "object") out.teacache = {
        enabled: !!tea.enabled,
        version: tea.teacache_version === "v2 (Standard Precise)" ? tea.teacache_version : "v1 (Legacy Fast)",
        device: tea.cache_device === "cpu" ? "cpu" : "cuda",
        adaptive: tea.adaptive_mode !== false,
        threshold: Number(tea.threshold) || 0.15,
        early: Number(tea.early_steps_factor) || 0.4,
        late: Number(tea.late_steps_factor) || 1.8,
        start: Number(tea.start_percent) || 0,
        end: tea.end_percent == null ? 1 : Number(tea.end_percent)
      };
      const sx = cc && cc.sdxlCache;
      if (sx && typeof sx === "object") out.sdxlCache = {
        enabled: !!sx.enabled,
        mode: sx.mode === "easycache" ? "easycache" : "donut",
        preset: ["balanced", "conservative", "aggressive"].includes(sx.cache_mode) ? sx.cache_mode : "balanced",
        device: sx.cache_device === "cpu" ? "cpu" : "cuda",
        verbose: !!sx.verbose,
        threshold: Number(sx.cache_threshold) || 0.35,
        start: Number(sx.start_percent) || 0,
        end: sx.end_percent == null ? 1 : Number(sx.end_percent),
        easyReuse: Number(sx.reuse_threshold) || 0.2,
        easyStart: sx.easy_start == null ? 0.15 : Number(sx.easy_start),
        easyEnd: sx.easy_end == null ? 0.95 : Number(sx.easy_end)
      };
      return out;
    }
    function importPipeline(cfg) {
      const cc = cfg.comfyConfig || {};
      const p = { families: {} };
      for (const [fam, snap] of Object.entries(cfg.comfyByPipeline || {})) {
        if (!snap || typeof snap !== "object" || !FAMILIES.includes(fam)) continue;
        p.families[fam] = importFamily(Object.assign({}, snap, { pipeline: fam })).settings;
      }
      if (FAMILIES.includes(cc.pipeline)) {
        const cur = importFamily(cc, cfg.turbo);
        p.family = cur.family;
        p.families[cur.family] = Object.assign({}, p.families[cur.family] || {}, cur.settings);
      }
      Object.assign(p, importCaches(cc));
      if (cfg.scene && cfg.scene.width) p.scene = { width: Number(cfg.scene.width), height: Number(cfg.scene.height) };
      if (cfg.avatar && cfg.avatar.width) p.portrait = { width: Number(cfg.avatar.width), height: Number(cfg.avatar.height) };
      if (cc.upscaler) p.upscaler = String(cc.upscaler);
      return p;
    }
    function importPrompts(po, catalog) {
      po = po || {};
      const out = { heroines: {}, outfits: {}, scenes: {}, looks: {}, tasks: {}, expressions: {}, moods: { scene: {}, work: {} }, rooms: {}, exposure: {}, parts: {}, patrons: {} };
      for (const [short, full] of Object.entries(FULL)) {
        const rec = po.heroines && po.heroines[short] || {};
        const base = nonEmpty(rec.imageBase) ? rec.imageBase : po.base && nonEmpty(po.base[full]) ? po.base[full] : "";
        const neg = nonEmpty(rec.imageNegative) ? rec.imageNegative : po.heroineNegatives && nonEmpty(po.heroineNegatives[full]) ? po.heroineNegatives[full] : "";
        const h = {};
        if (base) h.base = base;
        if (neg) h.negative = neg;
        if (po.heroineNames && nonEmpty(po.heroineNames[short])) h.name = po.heroineNames[short];
        if (Object.keys(h).length) out.heroines[short] = h;
      }
      for (const [id, o] of Object.entries(po.outfit || {})) {
        if (!o || typeof o !== "object") continue;
        const r = {};
        if (typeof o.imageTags === "string") r.tags = o.imageTags;
        if (typeof o.negativeImageTags === "string") r.negative = o.negativeImageTags;
        if (o.boldnessScore != null) r.boldness = Number(o.boldnessScore) || 0;
        if (Object.keys(r).length) out.outfits[id] = r;
      }
      const expressions = new Set(Object.keys(catalog && catalog.expressions || {}));
      const sceneIds = new Set(Object.keys(catalog && catalog.scenes || {}));
      for (const [id, v] of Object.entries(po.scenes || {})) {
        const list = (Array.isArray(v) ? v : [v]).map(String);
        if (!list.some((x) => x.trim())) continue;
        if (id.startsWith("look_")) out.looks[id.slice(5)] = list;
        else if (id.startsWith("task_")) out.tasks[id.slice(5)] = list[0];
        else if (expressions.has(id) && !sceneIds.has(id)) out.expressions[id] = list[0];
        else out.scenes[id] = list;
      }
      const moods = po.moods || {};
      for (const [k, v] of Object.entries(moods.scene || {})) if (nonEmpty(v)) out.moods.scene[k] = v;
      for (const [k, v] of Object.entries(moods.work || {})) if (nonEmpty(v)) out.moods.work[OLD_WORK_MOODS[k] || k] = v;
      for (const [id, v] of Object.entries(po.locations || {})) {
        if (!v || typeof v !== "object") continue;
        const r = {};
        if (nonEmpty(v.detail)) r.detail = v.detail;
        if (nonEmpty(v.short)) r.short = v.short;
        if (Object.keys(r).length) out.rooms[id] = r;
      }
      for (const [mask, v] of Object.entries(po.exposure || {})) if (/^[01]{7}$/.test(mask) && nonEmpty(v)) out.exposure[mask] = v;
      const LABEL = { arousal: "Arousal", aftermath: "Aftermath", gaze: "Gaze", intoxication: "Intoxication", reaction: "Reaction", focus: "Focus", narration: "Narration", gender: "Gender", group: "Group", pose: "Pose" };
      const gs = po.gameState || {}, use = po.gameStateUse || {};
      for (const [k, label] of Object.entries(LABEL)) if (use[k]) out.parts[label] = { mode: nonEmpty(gs[k]) ? "replace" : "off", text: s(gs[k]) };
      const pt = po.patrons || {};
      if (nonEmpty(pt.quality)) out.patrons.quality = pt.quality;
      if (nonEmpty(pt.negative)) out.patrons.negative = pt.negative;
      if (Array.isArray(pt.archetypes) && pt.archetypes.length) out.patrons.archetypes = pt.archetypes;
      const named = {};
      for (const [name, v] of Object.entries(po.namedPatrons || {})) if (v && (nonEmpty(v.prompt) || nonEmpty(v.tags))) named[String(name).toLowerCase()] = { prompt: s(v.prompt || v.tags), negative: s(v.negative) };
      if (Object.keys(named).length) out.patrons.named = named;
      return out;
    }
    function importOldConfig(cfg, catalog) {
      cfg = cfg || {};
      const po = cfg.promptOverrides || {};
      const layer = {
        prompts: importPrompts(po, catalog),
        pipeline: importPipeline(cfg)
      };
      const heroine = {};
      for (const [short, pack] of Object.entries(po.heroinePacks || {})) {
        if (!pack || typeof pack !== "object" || !Object.keys(pack).length) continue;
        const hp = importPrompts({
          outfit: pack.outfits,
          scenes: pack.scenes,
          locations: pack.locations,
          moods: pack.moods,
          exposure: pack.exposure,
          patrons: pack.patrons,
          namedPatrons: pack.namedPatrons
        }, catalog);
        if (pack.prompts) {
          const h = {};
          if (nonEmpty(pack.prompts.imageBase)) h.base = pack.prompts.imageBase;
          if (nonEmpty(pack.prompts.imageNegative)) h.negative = pack.prompts.imageNegative;
          if (Object.keys(h).length) hp.heroines = { [short]: h };
        }
        heroine[short] = { prompts: hp };
      }
      const app = {};
      if (nonEmpty(cfg.comfyUrl)) app.comfyUrl = cfg.comfyUrl.replace(/\/+$/, "");
      if (nonEmpty(cfg.comfyModelsDir)) app.modelsDir = cfg.comfyModelsDir;
      if (nonEmpty(cfg.gameDir)) app.gameDir = cfg.gameDir;
      if (cfg.reuseSceneSeed) app.seedMode = "stable";
      if (nonEmpty(cfg.comfyOutputDir)) app.comfyOutputDir = cfg.comfyOutputDir;
      if (cfg.imageRetention && typeof cfg.imageRetention === "object") app.retention = { enabled: !!cfg.imageRetention.enabled, maxImages: Number(cfg.imageRetention.maxImages) || 100 };
      const ff = nonEmpty(cfg.ffmpegPath) ? cfg.ffmpegPath : cfg.gif && nonEmpty(cfg.gif.ffmpegPath) ? cfg.gif.ffmpegPath : "";
      if (ff) app.ffmpegPath = ff;
      if (cfg.savedSceneMedia && typeof cfg.savedSceneMedia === "object") app.savedMedia = { enabled: !!cfg.savedSceneMedia.enabled };
      if (cfg.gif && typeof cfg.gif === "object") {
        const g = cfg.gif;
        layer.pipeline.gif = { enabled: !!(g.enabled || cfg.outputFormat === "gif" || cfg.gifEnabled), fps: Math.max(1, Math.min(30, Number(g.fps) || 8)), seconds: Math.max(1, Math.min(10, Number(g.durationSec) || 3)) };
        if (typeof g.prompt === "string") layer.pipeline.gif.prompt = g.prompt;
        if (typeof g.negative === "string") layer.pipeline.gif.negative = g.negative;
      }
      const legacy = {};
      if (po.player) legacy.player = po.player;
      if (po.sceneRoles) legacy.sceneRoles = po.sceneRoles;
      return { app, layer, heroine, legacy };
    }
    module2.exports = { importOldConfig };
  }
});

