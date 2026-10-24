// src/server/schema.js
var require_schema = __commonJS({
  "src/server/schema.js"(exports2, module2) {
    "use strict";
    var cutAt = (s, max) => {
      if (s.length <= max) return s;
      const head = s.slice(0, max);
      const c = head.lastIndexOf(",");
      if (c > max * 0.5) return head.slice(0, c).replace(/[\s,]+$/, "");
      const w = head.search(/\s\S*$/);
      return w > 0 ? head.slice(0, w).trim() : head;
    };
    var str = (max = 32e3) => (v) => typeof v === "string" ? cutAt(v, max) : void 0;
    var bool = () => (v) => typeof v === "boolean" ? v : void 0;
    var num = (lo, hi) => (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : void 0;
    };
    var oneOf = (...vals) => (v) => vals.includes(v) ? v : void 0;
    var strList = (maxItems = 64) => (v) => Array.isArray(v) && v.length <= maxItems && v.every((x) => typeof x === "string") ? v.map(String) : void 0;
    var tagList = (max) => (v) => {
      if (!Array.isArray(v)) return [];
      const seen = /* @__PURE__ */ new Set(), out = [];
      for (const x of v) {
        if (typeof x !== "string" || !x.trim()) continue;
        const k = x.trim().toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(x.trim());
      }
      return out.slice(0, max);
    };
    var id = /^[A-Za-z0-9_.' -]{1,80}$/;
    var PART_LABELS = ["Quality", "Arousal", "Aftermath", "Gaze", "Intoxication", "Reaction", "Focus", "Narration", "Gender", "Group", "Pose", "FlashAnatomy"];
    var group = (v) => v && typeof v === "object" && typeof v.name === "string" && v.name.trim() && Array.isArray(v.tags) ? { name: v.name.trim().slice(0, 60), tags: v.tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()).slice(0, 64) } : void 0;
    var lora = (v) => {
      if (!v || typeof v !== "object" || typeof v.model !== "string" || !v.model.trim()) return void 0;
      return {
        model: v.model.trim(),
        strength: num(-4, 4)(v.strength) ?? 1,
        enabled: v.enabled !== false,
        // words / removed / groups now live in the LoRA library (app.loraMemory); kept here only so
        // older settings and add-ons can be read (and moved into the library on the next save)
        words: tagList(200)(v.words),
        removed: tagList(400)(v.removed),
        groups: Array.isArray(v.groups) ? v.groups.map(group).filter(Boolean).slice(0, 80) : [],
        // only for some pictures: 'scene:<id>', 'look:<id>', 'task:<id>', 'outfit:<id>' (empty = every heroine picture)
        only: tagList(200)(v.only),
        // the trigger words a scoped LoRA adds to the pictures it is used for
        trigger: tagList(200)(v.trigger)
      };
    };
    var loraMemory = (v) => Array.isArray(v) ? v.map((x) => {
      const l = lora(x);
      return l && { model: l.model, words: l.words, removed: l.removed, groups: l.groups };
    }).filter(Boolean).slice(-400) : void 0;
    var loras = (v) => {
      if (!Array.isArray(v)) return void 0;
      const l = v.map(lora).filter(Boolean);
      return l.length <= 50 ? l : void 0;
    };
    var archetypes = (v) => Array.isArray(v) && v.length <= 64 ? v.filter((a) => a && typeof a === "object").map((a) => ({ label: String(a.label || ""), tags: String(a.tags || "") })) : void 0;
    var rule = (v) => v && typeof v === "object" ? {
      find: str(4e3)(v.find) || "",
      replace: str(4e3)(v.replace) || "",
      target: oneOf("positive", "negative")(v.target) || "positive",
      part: str(80)(v.part) || "",
      on: v.on !== false
    } : void 0;
    var rules = (v) => Array.isArray(v) && v.length <= 300 ? v.map(rule).filter((r) => r && (r.find.trim() || r.replace.trim())) : void 0;
    var anyJson = (v) => v !== void 0 && JSON.stringify(v).length < 2e5 ? v : void 0;
    var PROMPTS = {
      heroines: { "*": { base: str(), negative: str(), name: str(60), sections: { "*": { tags: str(), negative: str(), on: bool() } }, quarantine: { "*": { tags: str(), negative: str(), when: str(60), mode: oneOf("auto", "always", "never") } } } },
      outfits: { "*": { tags: str(), negative: str(), boldness: num(0, 100) } },
      scenes: { "*": strList(32) },
      looks: { "*": strList(32) },
      tasks: { "*": str() },
      reactions: { "*": str() },
      expressions: { "*": str() },
      moods: { scene: { "*": str() }, work: { "*": str() }, patron: { "*": str() } },
      rooms: { "*": { detail: str(), short: str() } },
      exposure: { "*": str() },
      parts: { "*": { mode: oneOf("game", "replace", "off"), text: str() } },
      conditions: { "*": { sources: tagList(8), keywords: tagList(400) } },
      negatives: { base: str(), extras: { "*": str() } },
      rules,
      rulesAll: rules,
      patrons: { quality: str(), negative: str(), archetypes, named: { "*": { prompt: str(), negative: str(), seed: num(0, 1e16) } } }
    };
    var FAMILY_FIELDS = {
      checkpoint: str(400),
      unet: str(400),
      clip: str(400),
      vae: str(400),
      useCheckpointVae: bool(),
      sampler: str(80),
      scheduler: str(80),
      clipSkip: num(1, 12),
      turbo: { enabled: bool(), steps: num(1, 200), cfg: num(0, 30) },
      quality: str(),
      negative: str(),
      loras
    };
    var PIPELINE = {
      family: oneOf("anima", "illustrious", "pony", "noobai"),
      families: { anima: FAMILY_FIELDS, illustrious: FAMILY_FIELDS, pony: FAMILY_FIELDS, noobai: FAMILY_FIELDS },
      scene: { width: num(256, 4096), height: num(256, 4096) },
      portrait: { width: num(256, 4096), height: num(256, 4096) },
      // a different picture size for single scenes (scene / look_<id> / task_<id>)
      sceneSizes: { "*": { width: num(256, 4096), height: num(256, 4096) } },
      // hi-res fix: draw, upscale, then add detail with a low denoise
      hires: { enabled: bool(), scale: num(1.1, 2), denoise: num(0.05, 1), steps: num(0, 100), model: str(400) },
      // face / hand fix after drawing (Impact Pack FaceDetailer)
      detail: { face: bool(), hands: bool(), denoise: num(0.05, 1), faceModel: str(400), handModel: str(400), portraits: bool() },
      upscaler: str(400),
      // The old mod's "Output GIF": turn pictures into short looping GIFs (WAN image-to-video + ffmpeg).
      gif: { enabled: bool(), fps: num(1, 30), seconds: num(1, 10), prompt: str(), negative: str(), useScene: bool() },
      teacache: {
        enabled: bool(),
        version: oneOf("v1 (Legacy Fast)", "v2 (Standard Precise)"),
        device: oneOf("cuda", "cpu"),
        adaptive: bool(),
        threshold: num(0.01, 1),
        early: num(0.05, 1),
        late: num(1, 4),
        start: num(0, 1),
        end: num(0, 1)
      },
      sdxlCache: {
        enabled: bool(),
        mode: oneOf("donut", "easycache"),
        preset: oneOf("balanced", "conservative", "aggressive"),
        device: oneOf("cuda", "cpu"),
        verbose: bool(),
        threshold: num(0, 100),
        start: num(0, 1),
        end: num(0, 1),
        easyReuse: num(0, 3),
        easyStart: num(0, 1),
        easyEnd: num(0, 1)
      }
    };
    var CHILDSTATE = {
      playthrough: str(),
      lastDay: num(0, 1e4),
      cycle: { on: bool(), day: num(0, 1e5), length: num(0, 400), window: num(0, 400) },
      pregnancy: { active: bool(), day: num(0, 1e5), fatherId: str(), known: bool(), revealDay: num(0, 1e9), forced: bool(), motherLook: (v) => v && typeof v === "object" ? v : void 0, fatherLook: (v) => v && typeof v === "object" ? v : void 0 },
      childWish: { mode: str(), targetId: str() },
      children: (v) => Array.isArray(v) ? v : void 0,
      postpartum: { blockUntilDay: num(0, 1e9), milkUntilDay: num(0, 1e9) },
      lastBirth: { day: num(0, 1e9), outcome: str(), count: num(0, 10) }
    };
    var PLAYER = { look: { hair: str(), hairType: str(), eyes: str(), skin: str(), face: str(), build: str(), bust: str(), hips: str(), set: bool() } };
    var LAYER = { prompts: PROMPTS, pipeline: PIPELINE, childstate: CHILDSTATE, player: PLAYER };
    var SCHEMA = {
      version: num(1, 1e3),
      app: {
        comfyUrl: str(400),
        modelsDir: str(1e3),
        gameDir: str(1e3),
        freshImages: bool(),
        libraryEnabled: bool(),
        redrawChanged: bool(),
        seedMode: oneOf("random", "stable"),
        comfyOutputDir: str(1e3),
        retention: { enabled: bool(), maxImages: num(1, 99999) },
        redrawAfterSave: bool(),
        ffmpegPath: str(1e3),
        savedMedia: { enabled: bool() },
        tagDelete: bool(),
        sharedNegatives: bool(),
        learnIgnore: strList(500),
        drawAhead: bool(),
        drawAheadCount: num(1, 10),
        shortcuts: bool(),
        loraMemory
      },
      // Which add-on supplies each prompt: picks[heroine][item] = 'mine' | add-on file ('_all' = pipeline).
      picks: { "*": { "*": str(400) } },
      layer: LAYER,
      heroine: { "*": LAYER },
      // each playthrough's own settings (see Store.layerIdFor) and what it is
      saves: { "*": LAYER },
      saveInfo: { "*": { heroine: str(80), name: str(80), at: num(0, 1e16) } },
      addons: strList(32),
      legacy: { "*": anyJson }
    };
    function validatorFor(path) {
      let node = SCHEMA;
      for (const seg of path) {
        if (typeof node === "function") return null;
        if (!node || typeof node !== "object") return null;
        if (Object.prototype.hasOwnProperty.call(node, seg)) node = node[seg];
        else if (node["*"] && id.test(String(seg))) node = node["*"];
        else return null;
      }
      return node;
    }
    function clean(node, value) {
      if (typeof node === "function") return node(value);
      if (!node || typeof node !== "object" || !value || typeof value !== "object" || Array.isArray(value)) return void 0;
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        
        const child = Object.prototype.hasOwnProperty.call(node, k) ? node[k] : node["*"] && id.test(k) ? node["*"] : null;
        if (!child) continue;
        const c = clean(child, v);
        if (c !== void 0) Object.defineProperty(out, k, { value: c, writable: true, enumerable: true, configurable: true });
      }
      return out;
    }
    module2.exports = { SCHEMA, LAYER, PIPELINE, FAMILY_FIELDS, PART_LABELS, validatorFor, clean };
  }
});

