"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// --- 1. модуль генов ---
const LOOKS = `// src/server/looks.js
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
    module2.exports = { random: random, extract: extract, child: child, describe: describe };
  }
});
`;
wr("src/026-src_server_looks.js", LOOKS);
log.push("модуль looks создан");

// ORDER: 026 после 025
let ol = rd("src/ORDER.txt").split(/\r?\n/).map(l => l.trim()).filter(Boolean).filter(l => !/026-src_server_looks/.test(l));
const i25 = ol.findIndex(l => /^025-/.test(l));
ol.splice(i25 >= 0 ? i25 + 1 : ol.length, 0, "026-src_server_looks.js");
wr("src/ORDER.txt", ol.join("\n") + "\n");
log.push("ORDER.txt: 026 добавлен");

// --- 2. схема ---
let sc = rd("src/001-src_server_schema.js");
if (!sc.includes("var PLAYER")) {
  const a = "    var LAYER = {";
  const def = '    var PLAYER = { look: { hair: str(), hairType: str(), eyes: str(), skin: str(), face: str(), build: str(), bust: str(), hips: str(), set: bool() } };\n';
  sc = sc.replace(a, def + a);
  sc = sc.replace("childstate: CHILDSTATE };", "childstate: CHILDSTATE, player: PLAYER };");
  log.push("схема: PLAYER добавлен");
} else log.push("схема: PLAYER уже есть");
sc = rep(sc, "known: bool(), revealDay: num(0, 1e9), forced: bool() },",
             "known: bool(), revealDay: num(0, 1e9), forced: bool(), motherLook: (v) => v && typeof v === \"object\" ? v : void 0, fatherLook: (v) => v && typeof v === \"object\" ? v : void 0 },", "схема motherLook/fatherLook");
wr("src/001-src_server_schema.js", sc);

let df = rd("src/004-src_server_defaults.js");
if (!df.includes("player: {")) {
  df = df.replace("childstate: {", 'player: { look: { hair: "", hairType: "", eyes: "", skin: "", face: "", build: "", bust: "", hips: "", set: false } },\n  childstate: {');
  log.push("дефолты: player добавлен");
} else log.push("дефолты: player уже есть");
wr("src/004-src_server_defaults.js", df);

// --- 3. модуль childstate: родители, look при рождении ---
let m = rd("src/025-src_server_childstate.js");
m = rep(m, '    var { writeAtomic } = require_store();', '    var { writeAtomic } = require_store();\n    var looks = require_looks();', "модуль require looks");
m = rep(m, '          fatherId: s.pregnancy.fatherId || "",\n          bornDay: day, stage: "infant", birth: outcome',
           '          fatherId: s.pregnancy.fatherId || "",\n          bornDay: day, stage: "infant", birth: outcome,\n          look: looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook)', "модуль look при рождении");
m = rep(m, '          s.pregnancy.fatherId = ctx.patronId && !ctx.group ? String(ctx.patronId) : "";',
           '          s.pregnancy.fatherId = (ctx.father || ctx.patronId) && !ctx.group ? String(ctx.father || ctx.patronId) : "";\n' +
           '          s.pregnancy.motherLook = ctx.motherLook || looks.random();\n' +
           '          s.pregnancy.fatherLook = ctx.fatherLook || null;', "модуль родители при зачатии");
m = rep(m, '      if (s.childWish.targetId && ctx.patronId) base *= ctx.patronId === s.childWish.targetId ? 1.5 : 0.6;',
           '      var fk = ctx.father || ctx.patronId;\n      if (s.childWish.targetId && fk) base *= fk === s.childWish.targetId ? 1.5 : 0.6;', "модуль шанс по отцу");
wr("src/025-src_server_childstate.js", m);

// --- 4. 024: require looks, контекст родителей, lookText в state ---
let i24 = rd("src/024-src_server_index.js");
i24 = rep(i24, 'var { forPlaythrough: childstateFor, tick: childstateTick, prompt: childstatePrompt, current: childstateCurrent, set: childstateSet } = require_childstate();',
               'var { forPlaythrough: childstateFor, tick: childstateTick, prompt: childstatePrompt, current: childstateCurrent, set: childstateSet } = require_childstate();\n    var { extract: looksExtract, describe: looksDescribe, random: looksRandom } = require_looks();', "024 require looks");
i24 = rep(i24, '        const body = await readJson(req);\n        const cs = childstateTick(store.dataDir,',
               '        const body = await readJson(req);\n        const ctx2 = Object.assign({}, body.ctx || {});\n        try {\n          const hero = currentHeroine();\n          const hh = (store.settings.layer.prompts.heroines || {})[hero] || {};\n          const txt = [hh.base].concat(Object.keys(hh.sections || {}).map((kk) => hh.sections[kk] && hh.sections[kk].tags)).filter(Boolean).join(", ");\n          ctx2.motherLook = looksExtract(txt);\n          if (ctx2.father === "player" || ctx2.patronId === "player") {\n            const cur = (store.settings.layer.player || {}).look;\n            if (cur && cur.set) ctx2.fatherLook = cur;\n            else { const l = looksRandom(); l.set = true; try { store.patch([{ path: ["layer", "player", "look"], value: l }], store.revision); } catch (e) {} ctx2.fatherLook = l; }\n          }\n        } catch (e) {}\n        const cs = childstateTick(store.dataDir,', "024 контекст родителей");
i24 = rep(i24, '        const cs = childstateTick(store.dataDir, String(body.playthrough || ""), Number(body.day) || 0, body.ctx || {});',
               '        const cs = childstateTick(store.dataDir, String(body.playthrough || ""), Number(body.day) || 0, ctx2);', "024 ctx2 в tick");
i24 = rep(i24, '      childstate: childstateCurrent(store.dataDir),',
               '      childstate: (function () { var c = childstateCurrent(store.dataDir); if (c && c.children) c = Object.assign({}, c, { children: c.children.map(function (k) { return Object.assign({}, k, { lookText: looksDescribe(k.look, k.stage, k.sex) }); }) }); return c; })(),', "024 lookText");
wr("src/024-src_server_index.js", i24);

// --- 5. клиент: father в ctx ---
let a = rd("src/019-src_server_assets.generated.js");
a = rep(a, '              encounters: dayEncounters,\n              trust: trust\n            };',
           '              encounters: dayEncounters,\n              trust: trust,\n              father: String(pat.customerId || (sc.sex ? "player" : ""))\n            };', "клиент father");
wr("src/019-src_server_assets.generated.js", a);

// --- 6. verify ---
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("G модуль looks")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["G модуль looks", "var require_looks = __commonJS", 1],',
    '  ["G гены: смешение", "function inherit(a, b, list)", 1],',
    '  ["G фильтр стадии", "small budding breasts", 1],',
    '  ["G схема player", "var PLAYER = {", 1],',
    '  ["G look при рождении", "look: looks.child(", 1],',
    '  ["G клиент father", "sc.sex ? \\"player\\"", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
