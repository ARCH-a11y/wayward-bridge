// src/server/looks.js
var require_looks = __commonJS({
  "src/server/looks.js"(exports2, module2) {
    "use strict";
    var SCALE = {
      hair: ["black", "dark brown", "chestnut", "auburn", "ginger", "blonde", "platinum"],
      skin: ["fair", "light", "olive", "tan", "brown"],
      eyes: ["brown", "hazel", "green", "grey", "blue"]
    };
    var FREE = {
      hairType: ["straight", "wavy", "curly"],
      face: ["round", "oval", "sharp", "soft"],
      build: ["slim", "lithe", "soft", "sturdy"],
      bust: ["small", "modest", "full", "heavy"],
      hips: ["narrow", "soft", "wide"]
    };
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function random() {
      var l = {};
      for (var k in SCALE) l[k] = pick(SCALE[k]);
      for (var k2 in FREE) l[k2] = pick(FREE[k2]);
      return l;
    }
    function extract(text) {
      var t = String(text || "").toLowerCase(), l = {};
      for (var k in SCALE) { var a = SCALE[k]; for (var i = 0; i < a.length; i++) if (t.indexOf(a[i]) >= 0) { l[k] = a[i]; break; } }
      for (var k2 in FREE) { var b = FREE[k2]; for (var j = 0; j < b.length; j++) if (t.indexOf(b[j]) >= 0) { l[k2] = b[j]; break; } }
      return l;
    }
    function idx(list, v) { var i = list.indexOf(v); return i < 0 ? Math.floor(list.length / 2) : i; }
    function inherit(a, b, list) {
      if (!a) return b; if (!b) return a;
      var r = Math.random();
      if (r < 0.3 || a === b) return a;
      if (r < 0.6) return b;
      var m = Math.round((idx(list, a) + idx(list, b)) / 2);
      if (Math.random() < 0.15) m += Math.random() < 0.5 ? -1 : 1;
      return list[Math.max(0, Math.min(list.length - 1, m))];
    }
    function child(mother, father) {
      var m = mother || random(), f = father || random(), l = {};
      for (var k in SCALE) l[k] = inherit(m[k], f[k], SCALE[k]);
      for (var k2 in FREE) l[k2] = Math.random() < 0.5 ? (m[k2] || pick(FREE[k2])) : (f[k2] || pick(FREE[k2]));
      return l;
    }
    // фильтры: по полу убираем чужое, по стадии подавляем вторичное
    function describe(look, stage, sex) {
      if (!look) return "";
      var t = [];
      if (look.hair) t.push(look.hair + (look.hairType ? " " + look.hairType : "") + " hair");
      if (look.eyes) t.push(look.eyes + " eyes");
      if (look.skin) t.push(look.skin + " skin");
      if (look.face) t.push(look.face + " face");
      if (stage !== "infant" && look.build) t.push(look.build + " build");
      var grown = stage === "youth" || stage === "adult";
      if (sex === "f") {
        if (stage === "teen") t.push("small budding breasts", "hips filling out");
        else if (grown) t.push((look.bust || "modest") + " breasts", (look.hips || "soft") + " hips");
      } else if (grown) {
        t.push("broad shoulders");
      }
      return t.join(", ");
    }
    var AGE_TAGS = {
      infant: "baby, 1 year old, chubby cheeks, big round eyes",
      child: "child, 7 years old",
      teen: "teenager, 14 years old",
      youth: "young adult",
      adult: "adult"
    };
    // промпт портрета ребёнка: пол, возрастная стадия и его гены
    function portraitPrompt(look, opts) {
      opts = opts || {};
      var sex = opts.sex === "m" ? "m" : "f";
      var stage = opts.stage || "child";
      var t = [];
      t.push("masterpiece, best quality, " + (sex === "f" ? "1girl" : "1boy") + ", solo, portrait, upper body, looking at viewer");
      t.push(AGE_TAGS[stage] || AGE_TAGS.child);
      var d = describe(look, stage, sex);
      if (d) t.push(d);
      t.push("medieval tavern interior background, warm candlelight, soft focus");
      return { positive: t.join(", "), negative: "lowres, bad anatomy, bad hands, extra fingers, fewer fingers, text, watermark, signature, blurry, worst quality, low quality" };
    }
    module2.exports = { random: random, extract: extract, child: child, describe: describe, portraitPrompt: portraitPrompt, SCALE: SCALE, FREE: FREE };
  }
});
