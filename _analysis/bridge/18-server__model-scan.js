// src/server/model-scan.js
var require_model_scan = __commonJS({
  "src/server/model-scan.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var MODEL_FILE_EXTS = /* @__PURE__ */ new Set([".safetensors", ".ckpt", ".pt", ".pth", ".sft", ".bin", ".gguf"]);
    var MODEL_SCAN = { dir: "", files: { checkpoint: [], unet: [], clip: [], vae: [], lora: [], upscale: [] }, error: null, scannedAt: 0 };
    function classifyModelRel(rel) {
      const segs = String(rel || "").replace(/\\/g, "/").toLowerCase().split("/").slice(0, -1);
      const kinds = [
        ["checkpoint", /^(checkpoints?)$/],
        ["unet", /^(unet|unets|diffusion_models)$/],
        ["clip", /^(clip|text_encoders?|clip_vision)$/],
        ["vae", /^(vae|vaes)$/],
        ["lora", /^(loras?|lycoris)$/],
        ["upscale", /^(upscale_models|upscale|esrgan)$/]
      ];
      for (const seg of segs) for (const [k, re] of kinds) if (re.test(seg)) return k;
      if (segs.length && /^(sdxl|illustrious)$/.test(segs[0])) return "checkpoint";
      return null;
    }
    function comfyRelativeName(rel, kind) {
      const n = String(rel || "").replace(/\\/g, "/");
      const prefixes = {
        checkpoint: ["checkpoints/", "checkpoint/", "sdxl/", "illustrious/"],
        unet: ["unet/", "unets/", "diffusion_models/"],
        clip: ["clip/", "text_encoders/", "text_encoder/", "clip_vision/"],
        vae: ["vae/", "vaes/"],
        lora: ["loras/", "lora/", "lycoris/"]
      };
      const low = n.toLowerCase();
      for (const pref of prefixes[kind] || []) {
        const i = low.indexOf(pref);
        if (i >= 0) return n.slice(i + pref.length);
      }
      const slash = n.lastIndexOf("/");
      return slash >= 0 ? n.slice(slash + 1) : n;
    }
    function baseFromFolder(rel) {
      const segs = String(rel || "").replace(/\\/g, "/").toLowerCase().split("/").slice(0, -1);
      const map = [["Anima", /^anima/], ["Illustrious", /^(illustrious|ilxl|il)$/], ["NoobAI", /^noob/], ["Pony", /^pony/], ["Flux", /^flux/], ["SD 1.5", /^(sd15|sd1\.5|sd ?1\.5)$/], ["SDXL", /^sdxl$/]];
      for (const seg of segs) for (const [label, re] of map) if (re.test(seg)) return label;
      return "";
    }
    function extractLoraBase(fullPath) {
      try {
        const fd = fs.openSync(fullPath, "r");
        const head = Buffer.alloc(8);
        fs.readSync(fd, head, 0, 8, 0);
        const metaLen = Number(head.readBigUInt64LE(0));
        if (!Number.isFinite(metaLen) || metaLen < 2 || metaLen > 2e6) {
          fs.closeSync(fd);
          return "";
        }
        const metaBuf = Buffer.alloc(metaLen);
        fs.readSync(fd, metaBuf, 0, metaLen, 8);
        fs.closeSync(fd);
        let parsed;
        try {
          parsed = JSON.parse(metaBuf.toString("utf8"));
        } catch (_) {
          return "";
        }
        const meta = parsed && parsed.__metadata__ && typeof parsed.__metadata__ === "object" ? parsed.__metadata__ : parsed || {};
        const blob = [
          meta["ss_base_model_version"],
          meta["modelspec.architecture"],
          meta["ss_sd_model_name"],
          meta["modelspec.title"],
          meta["ss_output_name"],
          meta["ss_network_module"]
        ].map((x) => String(x || "").toLowerCase()).join(" ");
        const found = [];
        const add = (label, re) => {
          if (re.test(blob) && !found.includes(label)) found.push(label);
        };
        add("Anima", /anima/);
        add("Illustrious", /illustrious/);
        add("NoobAI", /noobae|noobai|noob[_-]?ai/);
        add("Pony", /pony|ponyv6|pony diffusion/);
        add("SDXL", /sdxl|xl\b|sd_xl/);
        add("Flux", /flux/);
        add("SD 1.5", /sd15|sd1\.5|v1-5|stable-diffusion-v1/);
        add("SD 2.1", /\bv2\b|sd2/);
        return found.slice(0, 3).join(", ");
      } catch (_) {
        return "";
      }
    }
    function extractLoraCategory(rel, displayName, trigger) {
      const pathLow = String(rel || "").replace(/\\/g, "/").toLowerCase();
      const nameLow = String(displayName || "").replace(/\\/g, "/").toLowerCase();
      const trig = String(trigger || "").trim();
      const folder = pathLow.split("/").slice(0, -1).join("/");
      const rules = [
        ["Character", /\b(chars?|characters?|people|person|waifu|oc)\b/],
        ["Style", /\b(styles?|artist|artstyle|drawnby|painting)\b/],
        ["Clothing", /\b(cloth(?:ing|es)?|outfit|dress|costume|uniform|armor|fashion)\b/],
        ["Pose", /\b(poses?|action|composition|gesture)\b/],
        ["Quality", /\b(quality|detailer|enhance|fixer|helper|upscale)\b/],
        ["Effect", /\b(effects?|lighting|light|overlay|filter)\b/],
        ["Concept", /\b(concepts?|theme|scene|object|item|prop)\b/]
      ];
      function match(text) {
        for (const [label, re] of rules) {
          if (re.test(text)) return label;
        }
        return "";
      }
      const fromFolder = match(folder.replace(/[_-]+/g, " "));
      if (fromFolder) return fromFolder;
      const fromName = match(nameLow.replace(/[_-]+/g, " "));
      if (fromName) return fromName;
      if (/^@[a-z0-9]/i.test(trig) || /^@[a-z0-9]/i.test(nameLow)) return "Character";
      if (/^[a-z][a-z0-9'\-]+ [a-z][a-z0-9'\-]+$/i.test(trig) && trig.split(" ").length <= 3) return "Character";
      return "Other";
    }
    var LAST_LORA_IGNORED = [];
    function extractLoraTrigger(fullPath, displayName) {
      LAST_LORA_IGNORED = [];
      try {
        const sideTxt = String(fullPath).replace(/\.(safetensors|ckpt|pt|pth|sft|bin|gguf)$/i, ".txt");
        if (fs.existsSync(sideTxt)) {
          const txt = fs.readFileSync(sideTxt, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
          if (txt && txt.length < 240) return txt;
        }
      } catch (_) {
      }
      const DESCRIPTOR = new Set("1girl 1boy 1other 2girls 3girls solo solo focus looking at viewer masterpiece best quality high quality ultra-detailed score 9 breasts large breasts huge breasts nipples navel pussy ass thighs thick thighs penis testicles uncensored mosaic censoring hetero sex vaginal oral paizuri cowgirl position doggystyle straddling girl on top sex from behind nude completely nude blush smile open mouth closed mouth sweat long hair short hair very long hair blonde hair black hair brown hair red hair pink hair orange hair white hair white background simple background full body standing sitting outdoors indoors sky cloud day water wet jewelry earrings gloves jacket swimsuit bikini hood cloak wings horns pointy ears red eyes blue eyes green eyes brown eyes yellow eyes purple eyes multiple girls male focus pubic hair huge ass ass focus backboob grabbing pov motion lines steaming body window pillow tattoo lips underwear panties twintails hair ornament hair bun collarbone erection ass grab elf dark elf dark-skinned female dark skin close-up censored bar censor speech bubble japanese text narrowed eyes eyebrows visible through hair ponytail face bangs fang fangs shoes dress skirt hat bow tail belt shirt boots yukata tiara denim nekomata bara".split("  ").join(" ").split(" ").length ? "1girl,1boy,1other,2girls,3girls,solo,solo focus,looking at viewer,masterpiece,best quality,high quality,ultra-detailed,breasts,large breasts,huge breasts,nipples,navel,pussy,ass,thighs,thick thighs,penis,testicles,uncensored,hetero,sex,vaginal,oral,nude,completely nude,blush,smile,open mouth,closed mouth,sweat,long hair,short hair,very long hair,blonde hair,black hair,brown hair,red hair,pink hair,orange hair,white hair,white background,simple background,full body,standing,sitting,outdoors,indoors,sky,cloud,day,water,wet,jewelry,earrings,gloves,jacket,swimsuit,bikini,hood,cloak,wings,horns,pointy ears,red eyes,blue eyes,green eyes,brown eyes,yellow eyes,purple eyes,multiple girls,male focus,pubic hair,huge ass,ass focus,backboob,grabbing,pov,window,pillow,tattoo,lips,underwear,panties,twintails,hair ornament,hair bun,collarbone,erection,elf,dark elf,dark-skinned female,dark skin,close-up,censored,bar censor,speech bubble,japanese text,narrowed eyes,ponytail,face,bangs,fang,fangs,shoes,dress,skirt,hat,bow,tail,belt,shirt,boots,yukata,tiara,denim,bara,sleeves,sleeve,long sleeves,short sleeves".split(",") : []);
      function norm(s) {
        return String(s || "").toLowerCase().replace(/[@._\-]+/g, " ").replace(/\s+/g, " ").trim();
      }
      function nameParts(name) {
        const base = String(name || "").replace(/\.(safetensors|ckpt|pt|pth|sft|bin|gguf)$/i, "");
        const parts = norm(base).split(" ").filter((p) => p.length >= 3 && !/^(v\d+|anima|animabase\d*|lora|lycoris|sdxl|illustrious|test|base)$/i.test(p));
        return { base, parts, norm: norm(base) };
      }
      const EXTRA_IGNORE = "tongue,heart,bra,breast,breasts,choker,teeth,tooth,fang,fangs,eye,eyes,hair,ear,ears,nose,mouth,lip,lips,skin,blush,sweat,nipple,nipples,areola,areolae,pussy,penis,ass,butt,thigh,thighs,hip,hips,waist,navel,belly,arm,arms,hand,hands,finger,fingers,leg,legs,foot,feet,toe,toes,neck,collarbone,shoulder,shoulders,back,chest,cleavage,midriff,bare,nude,naked,clothed,panties,panty,underwear,lingerie,bikini,swimsuit,braid,twintails,ponytail,bangs,sidelocks,ahoge,horns,wings,tail,ears,pointy,elf,demon,angel,gloves,glove,boots,shoe,shoes,socks,stockings,thighhighs,pantyhose,garter,choker,collar,necklace,earrings,earring,jewelry,bracelet,ring,hat,cap,crown,tiara,ribbon,bow,bowtie,dress,skirt,shirt,blouse,jacket,coat,cape,cloak,hoodie,pants,shorts,jeans,kimono,yukata,armor,leotard,bodysuit,uniform,apron,scarf,tie,belt,zipper,button,lace,frills,see-through,transparent,wet,shiny,glow,light,shadow,solo,1girl,1boy,looking,viewer,smile,open,closed,sitting,standing,lying,kneeling,from,behind,above,below,close-up,portrait,full,body,upper,simple,white,black,background".split(",");
      EXTRA_IGNORE.forEach((w) => DESCRIPTOR.add(w));
      const GENERIC = new Set("car,cars,vehicle,truck,bike,motorcycle,weapon,sword,swords,gun,guns,knife,knives,spear,axe,bow,staff,shield,armor,cum,semen,doggystyle,cowgirl,missionary,paizuri,oral,anal,sex,fucking,ahegao,boy,girl,man,woman,male,female,person,people,human,character,figure,object,item,thing,stuff,background,foreground,sky,cloud,floor,wall,bed,chair,table,room,indoor,outdoor,day,night,light,dark,shadow,image,photo,artwork,artist,style,quality,masterpiece,score".split(","));
      function isDescriptor(tag) {
        const n = norm(tag);
        if (!n) return true;
        if (DESCRIPTOR.has(n)) return true;
        const words = n.split(" ").filter(Boolean);
        if (!words.length) return true;
        const descWords = words.filter((w) => DESCRIPTOR.has(w) || DESCRIPTOR.has(w.replace(/s$/, "")));
        if (descWords.length >= Math.ceil(words.length / 2)) return true;
        return false;
      }
      function isGeneric(tag) {
        const n = norm(tag);
        if (!n) return true;
        if (GENERIC.has(n)) return true;
        const words = n.split(" ").filter(Boolean);
        return words.some((w) => GENERIC.has(w) || GENERIC.has(w.replace(/s$/, "")));
      }
      function keepCase(variants, fallback) {
        if (!variants || !variants.length) return fallback;
        variants.sort((a, b) => b.n - a.n);
        return variants[0].tag;
      }
      function isSpacedPhrase(tag) {
        const t = String(tag || "").trim();
        return /^[a-z0-9@][a-z0-9_@\-]* [a-z0-9][a-z0-9_\-]*$/i.test(t);
      }
      function isConnectedAtTag(tag) {
        return /^@[a-z0-9][a-z0-9_\-]*(?:[ _][a-z0-9][a-z0-9_\-]*)*$/i.test(String(tag || "").trim());
      }
      function decodeLeet(s) {
        return String(s || "").toLowerCase().replace(/@/g, "a").replace(/\$/g, "s").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t").replace(/8/g, "b").replace(/9/g, "g");
      }
      function isLeetToken(tag) {
        const tok = String(tag || "").trim();
        if (!tok || tok.length < 3 || tok.length > 32) return false;
        if (isDescriptor(tok)) return false;
        if (!/[a-z]/i.test(tok)) return false;
        if (!/[0-9$]/.test(tok)) return false;
        if (/^v?\d+$/i.test(tok)) return false;
        return true;
      }
      function overlapScore(tag, name) {
        const variants = [norm(tag), norm(decodeLeet(tag))].filter(Boolean);
        let best = 0;
        for (const tn of variants) {
          if (tn.length < 3) continue;
          for (const part of name.parts) {
            if (part.length < 3) continue;
            if (tn === part) best = Math.max(best, part.length + 8);
            else if (part.length >= 4 && (tn.includes(part) || part.includes(tn))) best = Math.max(best, Math.min(part.length, tn.length));
          }
        }
        return best;
      }
      try {
        const fd = fs.openSync(fullPath, "r");
        const head = Buffer.alloc(8);
        fs.readSync(fd, head, 0, 8, 0);
        const metaLen = Number(head.readBigUInt64LE(0));
        if (!Number.isFinite(metaLen) || metaLen < 2 || metaLen > 2e6) {
          fs.closeSync(fd);
          return "";
        }
        const metaBuf = Buffer.alloc(metaLen);
        fs.readSync(fd, metaBuf, 0, metaLen, 8);
        fs.closeSync(fd);
        let parsed;
        try {
          parsed = JSON.parse(metaBuf.toString("utf8"));
        } catch (_) {
          return "";
        }
        const meta = parsed && parsed.__metadata__ && typeof parsed.__metadata__ === "object" ? parsed.__metadata__ : parsed || {};
        const keys = ["modelspec.trigger_phrase", "trigger", "trigger_word", "trigger_words", "activation text", "activation_text", "ss_token_strings"];
        for (const k of keys) {
          let v = meta[k];
          if (Array.isArray(v)) v = v.filter(Boolean).join(", ");
          if (typeof v === "string" && v.trim() && v.trim().length <= 200) return v.trim();
        }
        const name = nameParts(displayName || path.basename(fullPath) || meta["ss_output_name"] || meta["modelspec.title"] || "");
        if (meta.ss_tag_frequency) {
          let freq = meta.ss_tag_frequency;
          if (typeof freq === "string") {
            try {
              freq = JSON.parse(freq);
            } catch (_) {
              freq = null;
            }
          }
          if (freq && typeof freq === "object") {
            let takeTop = function(list) {
              const seen = [];
              for (let i = 0; i < list.length && seen.length < 3; i++) {
                const item = list[i];
                const tag = keepCase(item.variants, item.tag);
                if (seen.some((s) => s.toLowerCase() === tag.toLowerCase())) continue;
                if (isGeneric(tag) && i !== 0) continue;
                seen.push(tag);
              }
              return seen.join(", ");
            };
            const counts = /* @__PURE__ */ new Map();
            for (const bucket of Object.values(freq)) {
              if (!bucket || typeof bucket !== "object") continue;
              for (const [tag, n] of Object.entries(bucket)) {
                const tok = String(tag || "").trim();
                if (!tok || isDescriptor(tok)) {
                  if (tok) LAST_LORA_IGNORED.push(tok);
                  continue;
                }
                const key = tok.toLowerCase();
                const prev = counts.get(key) || { tag: tok, n: 0, variants: [] };
                prev.n += Number(n) || 0;
                prev.variants.push({ tag: tok, n: Number(n) || 0 });
                if ((Number(n) || 0) >= (prev.variants[0] && prev.variants[0].n || 0)) prev.tag = tok;
                counts.set(key, prev);
              }
            }
            const atTags = [];
            const leetTags = [];
            const named = [];
            const invented = [];
            for (const rec of counts.values()) {
              const tag = rec.tag;
              const n = rec.n;
              const at = isConnectedAtTag(tag);
              const leet = isLeetToken(tag);
              const spaced = isSpacedPhrase(tag);
              const ov = overlapScore(tag, name);
              const item = { tag, n, ov, variants: rec.variants, at };
              if (at) atTags.push(item);
              else if (leet) leetTags.push(item);
              else if (ov >= 3 || spaced && ov >= 3) named.push(item);
              else if (n >= 10 && /^[a-z]{2,6}$/i.test(tag) && !isDescriptor(tag)) invented.push(item);
            }
            if (atTags.length) {
              atTags.sort((a, b) => b.ov - a.ov || b.n - a.n);
              const withName = atTags.filter((x) => x.ov >= 3);
              return takeTop(withName.length ? withName : atTags);
            }
            const leetNamed = leetTags.filter((x) => x.ov >= 3).sort((a, b) => b.ov - a.ov || b.n - a.n);
            if (leetNamed.length) return takeTop(leetNamed);
            if (named.length) {
              named.sort((a, b) => b.ov - a.ov || b.n - a.n);
              return takeTop(named);
            }
            const pool = invented.concat(leetTags).sort((a, b) => b.n - a.n);
            if (pool.length) {
              const top = pool[0].n;
              return takeTop(pool.filter((x) => x.n >= top * 0.6));
            }
          }
        }
        const atInName = String(name.base).match(/@[a-z0-9][a-z0-9_\-]*(?:[ _][a-z0-9][a-z0-9_\-]*)*/i);
        if (atInName) return atInName[0].trim();
      } catch (_) {
      }
      return "";
    }
    function extractLoraIgnoredList(fullPath, displayName, keptTrigger) {
      const kept = new Set(String(keptTrigger || "").split(/[,\n|]/).map((s) => s.trim().toLowerCase()).filter(Boolean));
      const out = [];
      const add = (w) => {
        w = String(w || "").trim();
        if (!w || w.length < 2 || w.length > 48) return;
        const low = w.toLowerCase();
        if (kept.has(low)) return;
        if (out.some((x) => x.toLowerCase() === low)) return;
        out.push(w);
      };
      try {
        const sideTxt = String(fullPath).replace(/\.(safetensors|ckpt|pt|pth|sft|bin|gguf)$/i, ".txt");
        if (fs.existsSync(sideTxt)) {
          String(fs.readFileSync(sideTxt, "utf8") || "").split(/\r?\n/).forEach((line, idx) => {
            if (idx === 0) return;
            String(line).split(/[,|]/).forEach(add);
          });
        }
      } catch (_) {
      }
      try {
        const fd = fs.openSync(fullPath, "r");
        const head = Buffer.alloc(8);
        fs.readSync(fd, head, 0, 8, 0);
        const metaLen = Number(head.readBigUInt64LE(0));
        let meta = {};
        if (Number.isFinite(metaLen) && metaLen >= 2 && metaLen <= 2e6) {
          const buf = Buffer.alloc(metaLen);
          fs.readSync(fd, buf, 0, metaLen, 8);
          try {
            meta = JSON.parse(buf.toString("utf8"));
          } catch (_) {
            meta = {};
          }
        }
        fs.closeSync(fd);
        const md = meta && meta.__metadata__ && typeof meta.__metadata__ === "object" ? meta.__metadata__ : meta;
        ["ss_tag_frequency", "tag_frequency"].forEach((k) => {
          let freq = md && md[k];
          if (typeof freq === "string") {
            try {
              freq = JSON.parse(freq);
            } catch (_) {
              freq = null;
            }
          }
          if (!freq || typeof freq !== "object") return;
          const walk = (obj) => {
            if (!obj || typeof obj !== "object") return;
            Object.keys(obj).forEach((key) => {
              const val = obj[key];
              if (val && typeof val === "object" && !Array.isArray(val)) walk(val);
              else add(key);
            });
          };
          walk(freq);
        });
      } catch (_) {
      }
      return out.slice(0, 60);
    }
    function scanComfyModelsDir(rawDir) {
      const result = { dir: "", files: { checkpoint: [], unet: [], clip: [], vae: [], lora: [] }, error: null, scannedAt: Date.now(), counts: {} };
      const input = String(rawDir || "").trim();
      if (!input) {
        result.error = "No models folder path set";
        MODEL_SCAN = result;
        return result;
      }
      let root = path.resolve(input);
      result.dir = root;
      if (!fs.existsSync(root)) {
        result.error = "Path does not exist: " + root;
        MODEL_SCAN = result;
        return result;
      }
      let st;
      try {
        st = fs.statSync(root);
      } catch (e) {
        result.error = String(e.message || e);
        MODEL_SCAN = result;
        return result;
      }
      if (!st.isDirectory()) {
        result.error = "Not a folder: " + root;
        MODEL_SCAN = result;
        return result;
      }
      const nestedModels = path.join(root, "models");
      if (fs.existsSync(nestedModels) && fs.statSync(nestedModels).isDirectory()) {
        root = nestedModels;
        result.dir = root;
      }
      const found = { checkpoint: /* @__PURE__ */ new Map(), unet: /* @__PURE__ */ new Map(), clip: /* @__PURE__ */ new Map(), vae: /* @__PURE__ */ new Map(), lora: /* @__PURE__ */ new Map(), upscale: /* @__PURE__ */ new Map() };
      const maxFiles = 8e3;
      let seen = 0;
      function walk(dir, relBase) {
        if (seen >= maxFiles) return;
        let entries;
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (_) {
          return;
        }
        for (const ent of entries) {
          if (seen >= maxFiles) return;
          if (ent.name === "." || ent.name === "..") continue;
          if (ent.name.startsWith(".")) continue;
          const full = path.join(dir, ent.name);
          const rel = relBase ? relBase + "/" + ent.name : ent.name;
          if (ent.isDirectory()) {
            walk(full, rel);
            continue;
          }
          if (!ent.isFile()) continue;
          const ext = path.extname(ent.name).toLowerCase();
          if (!MODEL_FILE_EXTS.has(ext)) continue;
          seen++;
          const kind = classifyModelRel(rel);
          if (!kind) continue;
          const name = comfyRelativeName(rel, kind);
          const rec2 = { name, file: ent.name, rel: name };
          try {
            rec2.rel = rel.split("\\").join("/");
          } catch (_) {
          }
          if (kind === "lora") {
            rec2.trigger = extractLoraTrigger(full, name);
            rec2.ignored = LAST_LORA_IGNORED && LAST_LORA_IGNORED.length ? LAST_LORA_IGNORED.slice(0, 60) : extractLoraIgnoredList(full, name, rec2.trigger);
            rec2.base = extractLoraBase(full) || baseFromFolder(rel);
            rec2.category = extractLoraCategory(rel, name, rec2.trigger);
          }
          if (!found[kind].has(name)) found[kind].set(name, rec2);
        }
      }
      walk(root, "");
      for (const kind of Object.keys(found)) {
        result.files[kind] = Array.from(found[kind].values()).sort((a, b) => a.name.localeCompare(b.name));
        result.counts[kind] = result.files[kind].length;
      }
      result.total = seen;
      MODEL_SCAN = result;
      console.log("[tavern-bridge] models scan", root, result.counts);
      return result;
    }
    function lastScan() {
      return MODEL_SCAN;
    }
    module2.exports = { scanComfyModelsDir, lastScan, extractLoraTrigger, extractLoraBase };
  }
});

