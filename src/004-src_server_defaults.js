// src/server/defaults.js
var require_defaults = __commonJS({
  "src/server/defaults.js"(exports2, module2) {
    "use strict";
    var SIZE = {
      sdxl: { mp: { lo: 0.6, best: 1, hi: 1.6 }, ratio: { min: 0.45, max: 2.2 }, name: "SDXL-type models (Illustrious, Pony, NoobAI)" },
      anima: { mp: { lo: 0.5, best: 1.5, hi: 2.4 }, ratio: { min: 0.43, max: 2.33 }, name: "Anima / Z-Image models" }
    };
    var FAMILY = {
      anima: { unet: "anima-base-v1.0.safetensors", clip: "qwen_3_06b_base.safetensors", vae: "qwen_image_vae.safetensors", sampler: "euler", scheduler: "simple", steps: 8, cfg: 1.5, quality: "masterpiece, best quality, newest", negative: "low quality, worst quality, blurry, bad anatomy, bad hands, watermark, text", size: SIZE.anima },
      illustrious: { sampler: "euler_ancestral", scheduler: "normal", steps: 24, cfg: 5.5, quality: "masterpiece, best quality, amazing quality, very aesthetic, absurdres", negative: "lowres, worst quality, bad quality, bad anatomy, bad hands, extra fingers, missing fingers, extra limbs, watermark, text, blurry", size: SIZE.sdxl },
      pony: { sampler: "euler_ancestral", scheduler: "normal", steps: 25, cfg: 7, quality: "score_9, score_8_up, score_7_up, source_anime", negative: "score_4, score_5, score_6, lowres, bad anatomy, bad hands, watermark, text", size: SIZE.sdxl },
      noobai: { sampler: "euler_ancestral", scheduler: "normal", steps: 28, cfg: 5, quality: "masterpiece, best quality, newest, absurdres, highres", negative: "worst quality, old, early, low quality, lowres, bad anatomy, bad hands, watermark", size: SIZE.sdxl }
    };
    function buildDefaultLayer(catalog) {
      const c = catalog || {};
      const heroines = {};
      for (const [id, h] of Object.entries(c.heroines || {})) heroines[id] = { base: h.base || "", negative: h.negative || "", name: h.name || id };
      const outfits = {};
      const groupOf = (id, o) => o.wear === "sleep" ? "Sleepwear" : o.wear === "bath" ? "Bath" : /^(naked|nude|panties_only)$/.test(id) ? "Nude" : (o.boldness || 0) >= 50 ? "Revealing" : "Everyday";
      for (const [id, o] of Object.entries(c.outfits || {})) outfits[id] = { name: o.name || "", group: groupOf(id, o), tags: o.tags || "", negative: o.negative || "", boldness: o.boldness == null ? 0 : o.boldness };
      const listMap = (m) => Object.fromEntries(Object.entries(m || {}).map(([k, v]) => [k, Array.isArray(v) ? v.map(String) : [String(v || "")]]));
      const strMap = (m) => Object.fromEntries(Object.entries(m || {}).filter(([, v]) => typeof v === "string"));
      return {
        childstate: {
          playthrough: "",
          lastDay: 0,
          cycle:      { on: true, day: 0, length: 28, window: 4 },
          pregnancy:  { active: false, day: 0, fatherId: "", known: false },
          childWish:  { mode: "none", targetId: "" },
          children:   [],
          postpartum: { blockUntilDay: 0, milkUntilDay: 0 },
        },
        prompts: {
          heroines,
          outfits,
          scenes: listMap(c.scenes),
          looks: listMap(c.looks),
          tasks: strMap(c.tasks),
          reactions: strMap(c.reactions),
          expressions: strMap(c.expressions),
          moods: { scene: strMap(c.moods && c.moods.scene), work: strMap(c.moods && c.moods.work), patron: strMap(c.moods && c.moods.patron) },
          rooms: JSON.parse(JSON.stringify(c.rooms || {})),
          exposure: {},
          parts: {},
          // the game's own negative prompt: its base list and the extras it adds in some situations
          negatives: {
            base: c.negatives && c.negatives.base || "",
            extras: Object.fromEntries((c.negatives && c.negatives.extras || []).map((x) => [x.id, x.text]))
          },
          rules: [],
          rulesAll: [],
          patrons: {
            quality: c.patrons && c.patrons.quality || "",
            negative: c.patrons && c.patrons.negative || "",
            archetypes: c.patrons && c.patrons.archetypes || [],
            named: {}
          },
          conditions: {
            vagina_visible: { sources: ["outfit", "exposure", "scene"], keywords: ["nude", "pussy", "spread", "no_panties", "see-through", "microskirt", "vaginal"] },
            ass_visible: { sources: ["outfit", "exposure", "scene"], keywords: ["nude", "ass", "anus", "anal", "bare_hips", "bent_over", "on_side"] },
            nipples_visible: { sources: ["outfit", "exposure"], keywords: ["nude", "topless", "see-through", "nipples_visible_through_clothes", "wet_clothes"] }
          }
        },
        pipeline: {
          family: "anima",
          families: Object.fromEntries(Object.keys(FAMILY).map((f) => [f, {
            checkpoint: "",
            unet: "",
            clip: "",
            vae: "",
            useCheckpointVae: true,
            sampler: "",
            scheduler: "",
            clipSkip: f === "anima" ? 1 : 2,
            turbo: { enabled: false, steps: FAMILY[f].steps, cfg: FAMILY[f].cfg },
            quality: "",
            negative: "",
            loras: []
          }])),
          scene: { width: 1216, height: 832 },
          // what the game asks for (its picture box is 1216:832)
          portrait: { width: 512, height: 512 },
          sceneSizes: {},
          hires: { enabled: false, scale: 1.5, denoise: 0.4, steps: 0, model: "" },
          detail: { face: false, hands: false, denoise: 0.4, faceModel: "", handModel: "", portraits: false },
          upscaler: "",
          teacache: { enabled: false, version: "v1 (Legacy Fast)", device: "cuda", adaptive: true, threshold: 0.15, early: 0.4, late: 1.8, start: 0, end: 1 },
          gif: { enabled: false, fps: 8, seconds: 3, prompt: "2D anime animation, hair sway, seamless loop, infinite loop, same start and end state, looping, static camera, return to starting frame, no mouth movement", negative: "", useScene: false },
          sdxlCache: { enabled: false, mode: "donut", preset: "balanced", device: "cuda", verbose: false, threshold: 0.35, start: 0, end: 1, easyReuse: 0.2, easyStart: 0.15, easyEnd: 0.95 }
        }
      };
    }
    function resolvePipeline(p) {
      const family = FAMILY[p.family] ? p.family : "anima";
      const fam = FAMILY[family];
      const f = p.families && p.families[family] || {};
      const pick = (v, d) => v === "" || v == null || v === 0 ? d : v;
      const turbo = f.turbo || {};
      return {
        family,
        checkpoint: f.checkpoint || "",
        unet: pick(f.unet, fam.unet || ""),
        clip: pick(f.clip, fam.clip || ""),
        vae: pick(f.vae, fam.vae || ""),
        useCheckpointVae: f.useCheckpointVae !== false,
        sampler: pick(f.sampler, fam.sampler),
        scheduler: pick(f.scheduler, fam.scheduler),
        clipSkip: f.clipSkip || 1,
        steps: turbo.enabled ? pick(turbo.steps, fam.steps) : fam.steps,
        cfg: turbo.enabled ? pick(turbo.cfg, fam.cfg) : fam.cfg,
        quality: pick(f.quality, fam.quality),
        negative: pick(f.negative, fam.negative),
        qualityIsDefault: pick(f.quality, null) == null,
        negativeIsDefault: pick(f.negative, null) == null,
        loras: f.loras || [],
        scene: p.scene,
        portrait: p.portrait,
        upscaler: pick(f.upscaler, ""),
        // the 2.0 upscaler option became the hi-res fix
        sceneSizes: p.sceneSizes || {},
        hires: p.hires || {},
        detail: p.detail || {},
        gif: p.gif || {},
        teacache: p.teacache || {},
        sdxlCache: p.sdxlCache || {}
      };
    }
    module2.exports = { buildDefaultLayer, resolvePipeline, FAMILY };
  }
});

