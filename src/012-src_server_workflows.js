// src/server/workflows.js
var require_workflows = __commonJS({
  "src/server/workflows.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var clamp = (n, lo, hi, fb) => {
      const x = Number(n);
      return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fb;
    };
    var round8 = (n) => Math.max(64, Math.round((Number(n) || 512) / 8) * 8);
    function pickModel(list, wanted) {
      if (!wanted) return wanted;
      if (!Array.isArray(list) || !list.length || list.includes(wanted)) return wanted;
      const base = (s) => String(s).replace(/\\/g, "/").split("/").pop().toLowerCase();
      return list.find((m) => base(m) === base(wanted)) || wanted;
    }
    function fitInputs(caps, cls, inputs) {
      const known = caps && caps.inputs && caps.inputs[cls];
      if (!known) return inputs;
      const out = {};
      for (const k of known) if (inputs[k] !== void 0) out[k] = inputs[k];
      if (inputs.model) out.model = inputs.model;
      return out;
    }
    function buildAnima(a) {
      const { p, caps } = a;
      const g = {};
      g["1"] = { class_type: "UNETLoader", inputs: { unet_name: pickModel(caps && caps.models.unet, p.unet), weight_dtype: "default" } };
      g["2"] = { class_type: "CLIPLoader", inputs: { clip_name: pickModel(caps && caps.models.clip, p.clip), type: "stable_diffusion", device: "default" } };
      g["3"] = { class_type: "VAELoader", inputs: { vae_name: pickModel(caps && caps.models.vae, p.vae) } };
      let model = ["1", 0];
      let id = 20;
      for (const l of a.loras) {
        const n = String(id++);
        g[n] = { class_type: "LoraLoaderModelOnly", inputs: { model, lora_name: pickModel(caps && caps.models.lora, l.model), strength_model: l.strength } };
        model = [n, 0];
      }
      if (p.teacache && p.teacache.enabled) {
        const cls = caps && caps.nodes.teacache;
        if (cls) {
          const tc = p.teacache, t = clamp(tc.threshold, 0.01, 1, 0.15);
          g["40"] = { class_type: cls, inputs: fitInputs(caps, cls, {
            model,
            threshold: t,
            rel_l1_thresh: t,
            teacache_version: tc.version || "v1 (Legacy Fast)",
            adaptive_mode: tc.adaptive !== false,
            early_steps_factor: clamp(tc.early, 0.05, 1, 0.4),
            late_steps_factor: clamp(tc.late, 1, 4, 1.8),
            start_percent: clamp(tc.start, 0, 1, 0),
            end_percent: clamp(tc.end, 0, 1, 1),
            cache_device: tc.device || "cuda"
          }) };
          model = ["40", 0];
        } else a.notes.push("TeaCache is on but this ComfyUI has no TeaCache node, so it was left out.");
      }
      g["4"] = { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: a.positive } };
      g["5"] = { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: a.negative } };
      g["6"] = { class_type: "EmptyLatentImage", inputs: { width: a.width, height: a.height, batch_size: 1 } };
      g["7"] = { class_type: "KSampler", inputs: { model, positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0], seed: a.seed, steps: a.steps, cfg: a.cfg, sampler_name: p.sampler, scheduler: p.scheduler, denoise: 1 } };
      g["8"] = { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["3", 0] } };
      g["9"] = { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: a.prefix } };
      return g;
    }
    function buildCheckpoint(a) {
      const { p, caps } = a;
      const g = {};
      g["1"] = { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: pickModel(caps && caps.models.checkpoint, p.checkpoint) } };
      let model = ["1", 0], clip = ["1", 1];
      let vae = ["1", 2];
      if (!p.useCheckpointVae && p.vae) {
        g["3"] = { class_type: "VAELoader", inputs: { vae_name: pickModel(caps && caps.models.vae, p.vae) } };
        vae = ["3", 0];
      }
      let id = 20;
      for (const l of a.loras) {
        const n = String(id++);
        g[n] = { class_type: "LoraLoader", inputs: { model, clip, lora_name: pickModel(caps && caps.models.lora, l.model), strength_model: l.strength, strength_clip: l.strength } };
        model = [n, 0];
        clip = [n, 1];
      }
      const skip = clamp(p.clipSkip, 1, 12, 1);
      if (skip >= 2) {
        g["10"] = { class_type: "CLIPSetLastLayer", inputs: { clip, stop_at_clip_layer: -skip } };
        clip = ["10", 0];
      }
      const sc = p.sdxlCache || {};
      if (sc.enabled) {
        const cls = sc.mode === "easycache" ? caps && caps.nodes.easycache : caps && caps.nodes.donut;
        if (cls) {
          const inputs = sc.mode === "easycache" ? { model, reuse_threshold: clamp(sc.easyReuse, 0, 3, 0.2), start_percent: clamp(sc.easyStart, 0, 1, 0.15), end_percent: clamp(sc.easyEnd, 0, 1, 0.95), verbose: !!sc.verbose } : { model, cache_threshold: clamp(sc.threshold, 0, 100, 0.35), rel_l1_thresh: clamp(sc.threshold, 0, 100, 0.35), start_percent: clamp(sc.start, 0, 1, 0), end_percent: clamp(sc.end, 0, 1, 1), cache_device: sc.device || "cuda", enable: true, cache_mode: sc.preset || "balanced" };
          g["40"] = { class_type: cls, inputs: fitInputs(caps, cls, inputs) };
          model = ["40", 0];
        } else a.notes.push("SDXL cache is on but this ComfyUI has no " + (sc.mode === "easycache" ? "EasyCache" : "Donut cache") + " node, so it was left out.");
      }
      g["4"] = { class_type: "CLIPTextEncode", inputs: { clip, text: a.positive } };
      g["5"] = { class_type: "CLIPTextEncode", inputs: { clip, text: a.negative } };
      g["6"] = { class_type: "EmptyLatentImage", inputs: { width: a.width, height: a.height, batch_size: 1 } };
      g["7"] = { class_type: "KSampler", inputs: { model, positive: ["4", 0], negative: ["5", 0], latent_image: ["6", 0], seed: a.seed, steps: a.steps, cfg: a.cfg, sampler_name: p.sampler, scheduler: p.scheduler, denoise: 1 } };
      g["8"] = { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae } };
      g["9"] = { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: a.prefix } };
      return g;
    }
    function addHires(g, a, args) {
      const hr = a.p.hires || {};
      if (!hr.enabled || args.portrait || args.noHires) return;
      const scale = clamp(hr.scale, 1.1, 2, 1.5);
      const w = round8(a.width * scale), h = round8(a.height * scale);
      const vae = g["8"].inputs.vae;
      let img = ["8", 0];
      if (hr.model) {
        const caps = args.caps;
        g["70"] = { class_type: "UpscaleModelLoader", inputs: { model_name: pickModel(caps && caps.models && caps.models.upscale, hr.model) } };
        g["71"] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["70", 0], image: img } };
        img = ["71", 0];
      }
      g["52"] = { class_type: "ImageScale", inputs: { image: img, upscale_method: "lanczos", width: w, height: h, crop: "disabled" } };
      g["53"] = { class_type: "VAEEncode", inputs: { pixels: ["52", 0], vae } };
      const k = g["7"].inputs;
      g["54"] = { class_type: "KSampler", inputs: Object.assign({}, k, { latent_image: ["53", 0], denoise: clamp(hr.denoise, 0.05, 1, 0.4), steps: Math.max(1, Math.round(Number(hr.steps) || Math.max(4, Math.round(a.steps / 2)))) }) };
      g["55"] = { class_type: "VAEDecode", inputs: { samples: ["54", 0], vae } };
      g["9"].inputs.images = ["55", 0];
      a.notes.push("Hi-res fix: drawn at " + a.width + " \xD7 " + a.height + ", finished at " + w + " \xD7 " + h + ".");
    }
    function addDetailers(g, a, args) {
      const d = a.p.detail || {};
      if (!(d.face || d.hands) || args.noDetail || args.portrait && !d.portraits) return;
      const caps = args.caps;
      const cls = caps && caps.nodes && caps.nodes.faceDetailer, prov = caps && caps.nodes && caps.nodes.detectorProvider;
      if (caps && (!cls || !prov)) {
        a.notes.push("Face / hand fix is on, but ComfyUI does not have the FaceDetailer / UltralyticsDetectorProvider nodes (Impact Pack and Impact Subpack), so it was left out.");
        return;
      }
      const models = caps && caps.models && caps.models.detector || [];
      const pick = (wanted, re) => wanted || models.find((m) => re.test(m)) || "";
      const src = g["9"].inputs.images;
      const k = g["7"].inputs;
      const clip = g["4"].inputs.clip, vae = g["8"].inputs.vae;
      let img = src, id = 60;
      const one = (model, label) => {
        if (!model) {
          a.notes.push("Face / hand fix: no " + label + " detector model found (put e.g. " + (label === "face" ? "face_yolov8m.pt" : "hand_yolov8s.pt") + " in ComfyUI/models/ultralytics/bbox).");
          return;
        }
        const pid = String(id++), did = String(id++);
        g[pid] = { class_type: prov || "UltralyticsDetectorProvider", inputs: { model_name: model } };
        const inputs = {
          image: img,
          model: k.model,
          clip,
          vae,
          positive: k.positive,
          negative: k.negative,
          bbox_detector: [pid, 0],
          guide_size: 512,
          guide_size_for: true,
          max_size: 1024,
          seed: a.seed,
          steps: Math.max(4, Math.round(a.steps * 0.6)),
          cfg: k.cfg,
          sampler_name: k.sampler_name,
          scheduler: k.scheduler,
          denoise: clamp(d.denoise, 0.05, 1, 0.4),
          feather: 5,
          noise_mask: true,
          force_inpaint: true,
          bbox_threshold: 0.5,
          bbox_dilation: 10,
          bbox_crop_factor: 3,
          sam_detection_hint: "center-1",
          sam_dilation: 0,
          sam_threshold: 0.93,
          sam_bbox_expansion: 0,
          sam_mask_hint_threshold: 0.7,
          sam_mask_hint_use_negative: "False",
          drop_size: 10,
          wildcard: "",
          cycle: 1,
          inpaint_model: false,
          noise_mask_feather: 20,
          tiled_encode: false,
          tiled_decode: false
        };
        g[did] = { class_type: cls || "FaceDetailer", inputs: fitInputs(caps, cls || "FaceDetailer", inputs) };
        for (const key of ["image", "clip", "vae", "positive", "negative", "bbox_detector"]) g[did].inputs[key] = inputs[key];
        img = [did, 0];
        a.notes.push("Face / hand fix: " + label + "s redrawn with " + String(model).split("/").pop() + ".");
      };
      if (d.face) one(pick(d.faceModel, /face/i), "face");
      if (d.hands) one(pick(d.handModel, /hand/i), "hand");
      g["9"].inputs.images = img;
    }
    function fillTemplate(tpl, vars) {
      const walk = (v) => {
        if (typeof v === "string") {
          const exact = v.match(/^\{\{(\w+)\}\}$/);
          if (exact && Object.prototype.hasOwnProperty.call(vars, exact[1])) return vars[exact[1]];
          return v.replace(/\{\{(\w+)\}\}/g, (m, k) => Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m);
        }
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
        return v;
      };
      return walk(tpl);
    }
    function userTemplate(workflowDir, family, kind) {
      for (const name of [family + "-" + kind + ".json", family + ".json"]) {
        const fp = path.join(workflowDir, name);
        if (fs.existsSync(fp)) {
          try {
            return { name, graph: JSON.parse(fs.readFileSync(fp, "utf8")) };
          } catch (e) {
            throw new Error("Workflow file " + name + " is not valid JSON: " + e.message);
          }
        }
      }
      return null;
    }
    function buildGraph(args) {
      const p = args.p;
      const notes = [];
      const loras = args.portrait ? [] : (p.loras || []).filter((l) => l.enabled !== false && l.model);
      const a = Object.assign({}, args, {
        notes,
        loras,
        width: round8(args.width),
        height: round8(args.height),
        steps: Math.max(1, Math.round(Number(p.steps) || 20)),
        cfg: Number(p.cfg) || 5
      });
      const kind = args.portrait ? "portrait" : "scene";
      const tpl = args.workflowDir ? userTemplate(args.workflowDir, p.family, kind) : null;
      if (tpl) {
        notes.push("Using your workflow file " + tpl.name + ".");
        const graph2 = fillTemplate(tpl.graph, {
          positive: a.positive,
          negative: a.negative,
          seed: a.seed,
          width: a.width,
          height: a.height,
          steps: a.steps,
          cfg: a.cfg,
          sampler: p.sampler,
          scheduler: p.scheduler,
          checkpoint: p.checkpoint,
          unet: p.unet,
          clip: p.clip,
          vae: p.vae,
          prefix: a.prefix,
          lora: loras[0] && loras[0].model || "",
          lora_strength: loras[0] && loras[0].strength || 1
        });
        return { graph: graph2, notes };
      }
      const graph = p.family === "anima" ? buildAnima(a) : buildCheckpoint(a);
      addHires(graph, a, args);
      addDetailers(graph, a, args);
      if (p.upscaler && !args.portrait && !(typeof g !== "undefined" && g && g["70"]) && !(typeof graph !== "undefined" && graph && graph["70"])) {
        const caps = args.caps;
        const up = pickModel(caps && caps.models && caps.models.upscale, p.upscaler);
        graph["50"] = { class_type: "UpscaleModelLoader", inputs: { model_name: up } };
        graph["51"] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["50", 0], image: ["8", 0] } };
        graph["9"].inputs.images = ["51", 0];
      }
      return { graph, notes };
    }
    module2.exports = { buildGraph, fillTemplate, pickModel };
  }
});

