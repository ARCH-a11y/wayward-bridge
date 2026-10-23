"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// --- модуль: роды с риском ---
let m = rd("src/025-src_server_childstate.js");
m = rep(m,
  '    function birth(s, day, boost) {\n' +
  '      var n = Math.random() < TWINS * (1 + (boost || 0)) ? 2 : 1;\n' +
  '      for (var i = 0; i < n; i++) {\n' +
  '        s.children.push({\n' +
  '          id: "c" + day.toString(36) + i + Math.random().toString(36).slice(2, 6),\n' +
  '          sex: Math.random() < 0.5 ? "f" : "m",\n' +
  '          fatherId: s.pregnancy.fatherId || "",\n' +
  '          bornDay: day, stage: "infant"\n' +
  '        });\n' +
  '      }\n' +
  '      s.pregnancy = { active: false, day: 0, fatherId: "", known: false };\n' +
  '      s.postpartum.blockUntilDay = day + BLOCK;\n' +
  '      s.postpartum.milkUntilDay = day + MILK;\n' +
  '      return n;\n' +
  '    }',
  '    function birth(s, day, ctx) {\n' +
  '      ctx = ctx || {};\n' +
  '      var risk = 0.30;\n' +
  '      if (ctx.healer) risk -= 0.12;\n' +
  '      if (Number(ctx.trust) > 60) risk -= 0.08;\n' +
  '      risk = Math.max(0.05, Math.min(0.6, risk));\n' +
  '      var outcome = ctx.birthForce;\n' +
  '      if (outcome !== "smooth" && outcome !== "hard" && outcome !== "bad") {\n' +
  '        outcome = Math.random() < risk ? (Math.random() < 0.35 ? "bad" : "hard") : "smooth";\n' +
  '      }\n' +
  '      var block = outcome === "smooth" ? BLOCK : outcome === "hard" ? 35 : 50;\n' +
  '      var milk = outcome === "smooth" ? MILK : outcome === "hard" ? 30 : 40;\n' +
  '      var n = Math.random() < TWINS * (1 + (ctx.boost || 0)) ? 2 : 1;\n' +
  '      for (var i = 0; i < n; i++) {\n' +
  '        s.children.push({\n' +
  '          id: "c" + day.toString(36) + i + Math.random().toString(36).slice(2, 6),\n' +
  '          sex: Math.random() < 0.5 ? "f" : "m",\n' +
  '          fatherId: s.pregnancy.fatherId || "",\n' +
  '          bornDay: day, stage: "infant", birth: outcome\n' +
  '        });\n' +
  '      }\n' +
  '      s.pregnancy = { active: false, day: 0, fatherId: "", known: false };\n' +
  '      s.postpartum.blockUntilDay = day + block;\n' +
  '      s.postpartum.milkUntilDay = day + milk;\n' +
  '      s.lastBirth = { day: day, outcome: outcome, count: n };\n' +
  '      return n;\n' +
  '    }',
  "модуль birth");

m = rep(m, 'if (s.pregnancy.day >= TERM) birth(s, day, ctx.boost);', 'if (s.pregnancy.day >= TERM) birth(s, day, ctx);', "модуль вызов birth");
m = rep(m, '        postpartum: { blockUntilDay: 0, milkUntilDay: 0 }\n      };', '        postpartum: { blockUntilDay: 0, milkUntilDay: 0 },\n        lastBirth: { day: 0, outcome: "", count: 0 }\n      };', "модуль empty lastBirth");
wr("src/025-src_server_childstate.js", m);

// --- схема + дефолты ---
let sc = rd("src/001-src_server_schema.js");
sc = rep(sc, 'postpartum: { blockUntilDay: num(0, 1e9), milkUntilDay: num(0, 1e9) },', 'postpartum: { blockUntilDay: num(0, 1e9), milkUntilDay: num(0, 1e9) },\n  lastBirth: { day: num(0, 1e9), outcome: str(), count: num(0, 10) },', "схема lastBirth");
wr("src/001-src_server_schema.js", sc);

let df = rd("src/004-src_server_defaults.js");
df = rep(df, 'postpartum: { blockUntilDay: 0, milkUntilDay: 0 },', 'postpartum: { blockUntilDay: 0, milkUntilDay: 0 },\n  lastBirth: { day: 0, outcome: "", count: 0 },', "дефолты lastBirth");
wr("src/004-src_server_defaults.js", df);

// --- verify ---
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("F4 роды с риском")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F4 роды с риском", "var risk = 0.30", 1],',
    '  ["F4 исходы родов", "outcome === \\"hard\\" ? 35 : 50", 1],',
    '  ["F4 lastBirth", "s.lastBirth = { day: day, outcome: outcome, count: n };", 1],',
    '  ["F4 схема lastBirth", "lastBirth: { day: num(0, 1e9)", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
