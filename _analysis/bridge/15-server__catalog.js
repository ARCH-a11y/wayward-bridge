// src/server/catalog.js
var require_catalog = __commonJS({
  "src/server/catalog.js"(exports2, module2) {
    "use strict";
    var vm = require("vm");
    function balancedLiteral(src, open) {
      const pairs = { "{": "}", "[": "]" };
      const stack = [];
      for (let i = open; i < src.length && i < open + 4e5; i++) {
        const c = src[i];
        if (c === '"' || c === "'" || c === "`") {
          const q = c;
          for (i++; i < src.length; i++) {
            if (src[i] === "\\") {
              i++;
              continue;
            }
            if (src[i] === q) break;
          }
          continue;
        }
        if (pairs[c]) stack.push(pairs[c]);
        else if (c === "}" || c === "]") {
          if (stack.pop() !== c) return null;
          if (!stack.length) return src.slice(open, i + 1);
        }
      }
      return null;
    }
    function evalLiteral(text) {
      if (!text) return null;
      try {
        return vm.runInNewContext("(" + text + ")", /* @__PURE__ */ Object.create(null), { timeout: 200 });
      } catch (_) {
        return null;
      }
    }
    function allIndexes(src, needle) {
      const out = [];
      let i = -1;
      while ((i = src.indexOf(needle, i + 1)) >= 0) out.push(i);
      return out;
    }
    function findTable(src, needle, accept) {
      for (const i of allIndexes(src, needle)) {
        const obj = evalLiteral(balancedLiteral(src, i));
        if (obj && typeof obj === "object" && (!accept || accept(obj))) return obj;
      }
      return null;
    }
    var isTagText = (s) => typeof s === "string" && /,/.test(s) && !/^(ring|bg|text)-/.test(s);
    var strVals = (o) => Object.values(o).filter((v) => typeof v === "string");
    function unescapeJs(s) {
      try {
        return JSON.parse('"' + s.replace(/\n/g, "\\n") + '"');
      } catch (_) {
        return s;
      }
    }
    var STR = '"((?:[^"\\\\]|\\\\.)*)"';
    function findHeroines(src) {
      const out = {};
      const re = new RegExp("imageBase:" + STR, "g");
      let m;
      while (m = re.exec(src)) {
        const back = src.slice(Math.max(0, m.index - 4e3), m.index);
        const ids = [...back.matchAll(/\{id:"([a-z0-9_]+)",name:"([^"]+)"/g)];
        if (!ids.length) continue;
        const [, archetype, name] = ids[ids.length - 1];
        const fwd = src.slice(m.index, m.index + 3e3);
        const neg = fwd.match(new RegExp("imageNegative:" + STR));
        const short = archetype.split("_")[0];
        if (out[short]) continue;
        out[short] = { archetype, name, base: unescapeJs(m[1]), negative: neg ? unescapeJs(neg[1]) : "" };
      }
      return out;
    }
    function findOutfits(src) {
      const out = {};
      const re = new RegExp("imageTags:" + STR, "g");
      let m;
      while (m = re.exec(src)) {
        const back = src.slice(Math.max(0, m.index - 2500), m.index);
        const ids = [...back.matchAll(/\{id:"([a-z0-9_]+)",name:"([^"]+)"/g)];
        if (!ids.length) continue;
        const [, id, name] = ids[ids.length - 1];
        if (out[id]) continue;
        const next = src.indexOf('{id:"', m.index);
        const fwd = src.slice(m.index, next > 0 ? Math.min(next, m.index + 3e3) : m.index + 3e3);
        const neg = fwd.match(new RegExp("negativeImageTags:" + STR));
        const bold = (back.slice(back.lastIndexOf('{id:"' + id)) + fwd).match(/boldnessScore:(\d+)/);
        const wear = (back.slice(back.lastIndexOf('{id:"' + id)) + fwd).match(/wear:"([a-z_]+)"/);
        out[id] = { name, tags: unescapeJs(m[1]), negative: neg ? unescapeJs(neg[1]) : "", boldness: bold ? Number(bold[1]) : null, wear: wear ? wear[1] : "" };
      }
      return out;
    }
    function extractCatalog(html) {
      const src = String(html || "");
      const found = {};
      const t = (name, value) => {
        found[name] = !!(value && Object.keys(value).length);
        return value || {};
      };
      const scenes = t("scenes", findTable(src, "{kissing:[", (o) => Array.isArray(o.kissing)));
      const tasks = t("tasks", findTable(src, '{idle:"', (o) => isTagText(o.idle) || /standing/.test(o.idle)));
      const looks = t("looks", findTable(src, "{tits:[", (o) => Array.isArray(o.tits)));
      const reactions = t("reactions", findTable(src, '{pleased:"', (o) => strVals(o).some(isTagText)));
      const expressions = t("expressions", findTable(src, '{chatting:"', (o) => /smile|blush/.test(o.chatting || "")));
      const moodScene = t("moodScene", findTable(src, '{smile:"', (o) => /smile/.test(o.smile || "")));
      const moodWork = t("moodWork", findTable(src, '{happy:"', (o) => strVals(o).every(isTagText) && "content" in o));
      const roomDetail = t("roomDetail", findTable(src, '{taproom:"', (o) => /tavern interior/.test(o.taproom || "") && !/^\(/.test(o.taproom)));
      const roomShort = t("roomShort", findTable(src, '{taproom:"', (o) => /^\(/.test(o.taproom || "")));
      const heroines = t("heroines", findHeroines(src));
      const outfits = t("outfits", findOutfits(src));
      let archIdx = src.search(/\[\{label:"Grizzled veteran"/);
      if (archIdx < 0) {
        const m = src.match(/=\[\{label:"[^"]{1,60}",tags:"1boy\b/);
        archIdx = m ? m.index + 1 : -1;
      }
      const before = archIdx >= 0 ? src.slice(Math.max(0, archIdx - 600), archIdx).match(/=\s*"((?:masterpiece|best quality)[^"]*)",[A-Za-z0-9_$]+=$/) : null;
      const pq = before || src.match(/"(masterpiece, best quality, portrait, upper body, medieval tavern background[^"]*)"/);
      const textConst = (name) => {
        if (!name) return null;
        const e = name.replace(/\$/g, "\\$");
        const m = src.match(new RegExp("[,;{ ]" + e + '=(?:"((?:[^"\\\\]|\\\\.)*)"|`([^`]*)`)'));
        if (!m) return null;
        if (m[1] !== void 0) return [0, unescapeJs(m[1])];
        return [0, m[2].replace(/\$\{([A-Za-z0-9_$]+)\}/g, (_, n) => {
          const r = src.match(new RegExp("[,;{ ]" + n.replace(/\$/g, "\\$") + '="((?:[^"\\\\]|\\\\.)*)"'));
          return r ? unescapeJs(r[1]) : "";
        })];
      };
      const pnv = src.match(/key:`patron_[^`]*`,prompt:[A-Za-z0-9_$]+,negativePrompt:([A-Za-z0-9_$]+)/);
      const pn = pnv && textConst(pnv[1]) || src.match(/"(worst quality, low quality, blurry, bad anatomy[^"]*female, girl, woman, breasts)"/);
      const archetypes = archIdx >= 0 ? evalLiteral(balancedLiteral(src, archIdx)) || [] : [];
      const patrons = t("patrons", { quality: pq ? pq[1] : "", negative: pn ? pn[1] : "", archetypes: Array.isArray(archetypes) ? archetypes : [] });
      let quality = "";
      const qm = src.match(/\{label:"Quality",tags:([A-Za-z0-9_$]+)\}/);
      if (qm) {
        const qv = src.match(new RegExp("[,;{ ]" + qm[1].replace(/\$/g, "\\$") + '="((?:[^"\\\\]|\\\\.)*)"'));
        if (qv) quality = unescapeJs(qv[1]);
      }
      found.quality = !!quality;
      const strConst = (name) => {
        if (!name) return "";
        const m = src.match(new RegExp("[,;{ ]" + name.replace(/\$/g, "\\$") + '="((?:[^"\\\\]|\\\\.)*)"'));
        return m ? unescapeJs(m[1]) : "";
      };
      const arrConst = (name) => {
        if (!name) return null;
        const re = new RegExp("[,;{ ]" + name.replace(/\$/g, "\\$") + "=\\[");
        const m = re.exec(src);
        return m ? evalLiteral(balancedLiteral(src, m.index + m[0].length - 1)) : null;
      };
      const objConst = (name) => {
        if (!name) return null;
        const re = new RegExp("[,;{ ]" + name.replace(/\$/g, "\\$") + "=\\{");
        let m;
        const g = new RegExp(re.source, "g");
        while (m = g.exec(src)) {
          const v = evalLiteral(balancedLiteral(src, m.index + m[0].length - 1));
          if (v && typeof v === "object" && Object.keys(v).length) return v;
        }
        return null;
      };
      const sexM = src.match(/if\(e==="sex"\)\{const r=[A-Za-z0-9_$]+\(([A-Za-z0-9_$]+),/);
      const roughM = src.match(/if\(e==="sex_rough"\)\{const r=[A-Za-z0-9_$]+\(([A-Za-z0-9_$]+),/);
      const sexList = arrConst(sexM && sexM[1]), roughList = arrConst(roughM && roughM[1]);
      const extraScenes = {};
      if (Array.isArray(sexList) && sexList.length) extraScenes.sex = sexList.map((x) => String(x.tags || x));
      if (Array.isArray(roughList) && roughList.length) extraScenes.sex_rough = roughList.map((x) => String(x.tags || x));
      const bedM = src.match(/function [A-Za-z0-9_$]+\(e,t,o\)\{const n=([A-Za-z0-9_$]+)\[e\]\?\?\[\],s=([A-Za-z0-9_$]+)\[e\]/);
      const bed = bedM ? objConst(bedM[2]) : null;
      const bedScenes = {};
      for (const [id, v] of Object.entries(bed || {})) if (Array.isArray(v) && v.length) bedScenes[id + "_bed"] = v.map(String);
      found.sexScenes = !!extraScenes.sex;
      found.bedScenes = Object.keys(bedScenes).length > 0;
      const pm = findTable(src, "{reluctant:{early:", (o) => o.reluctant && typeof o.reluctant.early === "string");
      const patronMoods = {};
      for (const [state, stages] of Object.entries(pm || {})) for (const [stage, text] of Object.entries(stages || {})) if (typeof text === "string") patronMoods[state + "_" + stage] = text;
      found.patronMoods = Object.keys(patronMoods).length > 0;
      const yxM = src.match(/function [A-Za-z0-9_$]+\(e\)\{if\(e\.inBed\)return ([A-Za-z0-9_$]+);if\(e\.room==="back_room"\)return`\$\{([A-Za-z0-9_$]+)\}[^`]*`;if\(e\.room==="bathhouse"\)return[^`]*`\$\{([A-Za-z0-9_$]+)\}/);
      const roomCode = yxM ? { in_bed: strConst(yxM[1]), back_room: strConst(yxM[2]), bathhouse: strConst(yxM[3]) } : {};
      found.roomCode = !!yxM;
      const negatives = findNegatives(src, strConst, objConst);
      found.baseNegative = !!negatives.base;
      found.negativeExtras = negatives.extras.length > 0;
      const rooms = {};
      for (const id of /* @__PURE__ */ new Set([...Object.keys(roomDetail), ...Object.keys(roomShort)])) {
        rooms[id] = { detail: roomDetail[id] || "", short: roomShort[id] || "" };
      }
      for (const [id, text] of Object.entries(roomCode)) {
        if (!text) continue;
        rooms[id] = rooms[id] || { detail: "", short: "" };
        if (!rooms[id].detail) rooms[id].detail = text;
        if (!rooms[id].short) rooms[id].short = text;
      }
      return {
        heroines,
        outfits,
        scenes: Object.assign({}, scenes, extraScenes, bedScenes),
        tasks,
        looks,
        reactions,
        expressions,
        moods: { scene: moodScene, work: moodWork, patron: patronMoods },
        rooms,
        patrons,
        quality,
        negatives,
        found
      };
    }
    function bodyAt(src, i) {
      const b = src.indexOf("{", i);
      return b >= 0 ? balancedLiteral(src, b) || "" : "";
    }
    function stringLits(text) {
      return [...String(text).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => unescapeJs(m[1]));
    }
    var NEG_LABELS = [
      [/cleavage, breasts_out/, "covered_outfit", "Keeps a modest outfit covered (outfit boldness under 30)"],
      [/3girls|bad proportions/, "patron_one_girl", "Patron scene: only one girl"],
      [/^1boy, 2boys, male/, "no_man", "Scene without a man"],
      [/group sex/, "one_patron", "Only one patron"],
      [/^4boys$/, "joined_4boys", "Patrons who joined in (3 or fewer men)"],
      [/^5boys$/, "joined_5boys", "Patrons who joined in (4 or fewer men)"],
      [/^crowd$/, "joined_crowd", "Patrons who joined in"],
      [/^looking at viewer$/, "patron_gaze", "Patron scene: she looks at him, not at you"],
      [/crossdressing/, "patron_dress", "Patron scene: the man is not in a dress"],
      [/multiple views, split screen$/, "exposed_one_girl", "Exposed or naked: only one girl"],
      [/bathtub|toilet/, "bath_attendant", "Bath attendant scene"],
      [/^cum on/, "cum_places", "Where cum may not go"]
    ];
    function findNegatives(src, strConst, objConst) {
      const out = { base: "", extras: [] };
      const tpl = [...src.matchAll(/[A-Za-z0-9_$]+=`(worst quality, low quality, blurry, bad anatomy[^`]*)`/g)].map((m) => m[1]).find((t) => !/female, girl, woman/.test(t));
      if (tpl) out.base = tpl.replace(/\$\{([A-Za-z0-9_$]+)\}/g, (_, n) => strConst(n));
      const add = (id, label, text) => {
        text = String(text || "").replace(/^,\s*/, "").trim();
        if (!text || out.extras.some((e) => e.text === text)) return;
        let uid = id, n = 2;
        while (out.extras.some((e) => e.id === uid)) uid = id + "_" + n++;
        out.extras.push({ id: uid, label, text });
      };
      const nm = src.match(/negativePrompt:([A-Za-z0-9_$]+),parts:/);
      if (nm) {
        const v = nm[1].replace(/\$/g, "\\$");
        const end = nm.index;
        const start = src.lastIndexOf("let " + nm[1] + "=", end);
        if (start > 0 && end - start < 2e4) {
          const region = src.slice(start, end);
          let k = 0;
          for (const s of stringLits(region)) {
            if (!/^, \S/.test(s)) continue;
            const t = s.slice(2);
            const hit = NEG_LABELS.find(([re]) => re.test(t));
            if (hit) add(hit[1], hit[2], t);
            else add("extra_" + ++k, "Extra for this kind of picture", t);
          }
          const fm = region.match(new RegExp(v + '\\+=", "\\+([A-Za-z0-9_$]+)\\[[a-z]\\]'));
          for (const [key, text] of Object.entries(fm && objConst(fm[1]) || {})) if (typeof text === "string") add(key, "She is " + key + " (no happy faces)", text);
          const rm = region.match(new RegExp("const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\\([a-z]\\);\\1&&\\(" + v + "\\+="));
          if (rm) {
            const fi = src.search(new RegExp("function " + rm[2].replace(/\$/g, "\\$") + "\\("));
            const body = fi >= 0 ? bodyAt(src, fi) : "";
            const roomAt = (pos) => {
              const before = body.slice(0, pos);
              const all = [...before.matchAll(/inBed|room==="([a-z_]+)"/g)];
              const last = all[all.length - 1];
              return last ? last[1] || "in_bed" : "room";
            };
            const hits = [];
            for (const m of body.matchAll(/[?:{]([A-Za-z_$][A-Za-z0-9_$]*)(?=[:?`}])|\$\{([A-Za-z0-9_$]+)\}/g)) {
              const t = strConst(m[1] || m[2]);
              if (t && /,/.test(t)) hits.push([m.index, t]);
            }
            for (const m of body.matchAll(/\}, ([^`$]+)`/g)) hits.push([m.index, m[1]]);
            hits.sort((a, b) => a[0] - b[0]);
            for (const [pos, t] of hits) {
              const r = roomAt(pos);
              add("room_" + r, "Room: " + r.replace(/_/g, " ") + " (keeps other places out)", t);
            }
          }
        }
      }
      const ei = src.indexOf('{positive:"",negative:"",covered:""}');
      if (ei > 0) {
        const fstart = src.lastIndexOf("function ", ei);
        const body = bodyAt(src, fstart);
        const arr = (body.match(/const [A-Za-z0-9_$]+=\[\],([A-Za-z0-9_$]+)=\[\]/) || [])[1];
        if (arr) for (const m of body.matchAll(new RegExp(arr.replace(/\$/g, "\\$") + '\\.push\\(("(?:[^"\\\\]|\\\\.)*")\\)', "g"))) {
          const t = stringLits(m[1])[0];
          add("exposure_off", "Exposure: clothes she took off stay off (" + t.split(",")[0].replace(/[()]|:[0-9.]+/g, "") + "\u2026)", t);
        }
        const cv = body.match(/covered:([A-Za-z0-9_$]+)\(/);
        if (cv) {
          const ci = src.search(new RegExp("function " + cv[1].replace(/\$/g, "\\$") + "\\("));
          if (ci >= 0) add("exposure_covered", "Exposure: parts that stay covered", [...new Set(stringLits(bodyAt(src, ci)))].join(", "));
        }
      }
      return out;
    }
    module2.exports = { extractCatalog, balancedLiteral, evalLiteral };
  }
});

