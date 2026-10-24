"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// --- модуль ---
let m = rd("src/025-src_server_childstate.js");
m = rep(m, 'pregnancy: { active: false, day: 0, fatherId: "", known: false },\n        childWish:',
           'pregnancy: { active: false, day: 0, fatherId: "", known: false, revealDay: 0, forced: false },\n        childWish:', "модуль empty pregnancy");
m = rep(m, '      s.pregnancy = { active: false, day: 0, fatherId: "", known: false };',
           '      s.pregnancy = { active: false, day: 0, fatherId: "", known: false, revealDay: 0, forced: false };', "модуль birth reset");

// сокрытие + желание цели в тике (перед зачатием)
m = rep(m,
  '      if (!s.pregnancy.active && day > (s.postpartum.blockUntilDay || 0) && ctx.encounters) {',
  '      if (s.pregnancy.active && !s.pregnancy.known) {\n' +
  '        var tr = Number(ctx.trust || 0);\n' +
  '        if (s.pregnancy.day >= 16) {\n' +
  '          s.pregnancy.known = true; s.pregnancy.forced = true; s.pregnancy.revealDay = day;\n' +
  '        } else if (typeof ctx.revealForce === "boolean" ? ctx.revealForce : Math.random() < (0.12 + tr / 200)) {\n' +
  '          s.pregnancy.known = true; s.pregnancy.revealDay = day;\n' +
  '        }\n' +
  '      }\n\n' +
  '      if (s.childWish.mode === "none" && s.children.length === 0 && !s.pregnancy.active && Number(ctx.trust || 0) >= 60) {\n' +
  '        s.childWish.mode = "target"; s.childWish.targetId = "player";\n' +
  '      }\n\n' +
  '      if (!s.pregnancy.active && day > (s.postpartum.blockUntilDay || 0) && ctx.encounters) {',
  "модуль сокрытие+желание");

m = rep(m, '          s.pregnancy.known = false;\n          s.pregnancy.fatherId = ctx.patronId && !ctx.group ? String(ctx.patronId) : "";',
           '          s.pregnancy.known = Number(ctx.trust || 0) >= 50;\n          s.pregnancy.fatherId = ctx.patronId && !ctx.group ? String(ctx.patronId) : "";', "модуль known при зачатии");

m = rep(m, '      if (s.childWish.targetId && ctx.patronId) base *= ctx.patronId === s.childWish.targetId ? 1.5 : 0.6;',
           '      if (s.childWish.mode === "target") base *= 1.1;\n      if (s.childWish.targetId && ctx.patronId) base *= ctx.patronId === s.childWish.targetId ? 1.5 : 0.6;', "модуль шанс желания");
wr("src/025-src_server_childstate.js", m);

// --- схема + дефолты ---
let sc = rd("src/001-src_server_schema.js");
sc = rep(sc, "pregnancy:  { active: bool(), day: num(0, 1e5), fatherId: str(), known: bool() },",
             "pregnancy:  { active: bool(), day: num(0, 1e5), fatherId: str(), known: bool(), revealDay: num(0, 1e9), forced: bool() },", "схема pregnancy");
wr("src/001-src_server_schema.js", sc);
let df = rd("src/004-src_server_defaults.js");
df = rep(df, "pregnancy:  { active: false, day: 0, fatherId: \"\", known: false },",
             "pregnancy:  { active: false, day: 0, fatherId: \"\", known: false, revealDay: 0, forced: false },", "дефолты pregnancy");
wr("src/004-src_server_defaults.js", df);

// --- клиент: доверие в ctx ---
let a = rd("src/019-src_server_assets.generated.js");
a = rep(a, '            var sc = g.activeScene || {}, pat = sc.patron || {};',
           '            var sc = g.activeScene || {}, pat = sc.patron || {};\n            var ch = g.characters && g.characters[g.primaryCharacterId];\n            var trust = ch && ch.relationship ? Number(ch.relationship.trust) : 0;', "клиент trust");
a = rep(a, '              encounters: dayEncounters\n            };',
           '              encounters: dayEncounters,\n              trust: trust\n            };', "клиент trust в ctx");
wr("src/019-src_server_assets.generated.js", a);

// --- UI: желание цели ---
a = rep(a,
  '            })) : null,\n            row(\n              sbtn("Зачать"',
  '            })) : null,\n' +
  '            row((function() {\n' +
  '              var cur = cs && cs.childWish ? cs.childWish.mode : "none";\n' +
  '              var sel = h("select", { class: "sel xs", onchange: function() { set({ childWish: { mode: sel.value } }); } },\n' +
  '                ["none", "target"].map(function(mm2) { return h("option", { value: mm2, selected: mm2 === cur }, mm2); }));\n' +
  '              var ti = h("input", { class: "sel xs", value: cs && cs.childWish ? (cs.childWish.targetId || "") : "", placeholder: "цель: player или id", onchange: function() { set({ childWish: { targetId: ti.value } }); } });\n' +
  '              return h("span", {}, sel, " ", ti);\n' +
  '            })()),\n' +
  '            row(\n              sbtn("Зачать"',
  "UI желание");
wr("src/019-src_server_assets.generated.js", a);

// --- verify ---
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("F5 сокрытие")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F5 сокрытие: вынужденное", "s.pregnancy.day >= 16", 1],',
    '  ["F5 сокрытие: порог доверия", "known = Number(ctx.trust || 0) >= 50", 1],',
    '  ["F5 желание цели", "s.childWish.mode = \\"target\\"; s.childWish.targetId = \\"player\\"", 1],',
    '  ["F5 шанс желания", "if (s.childWish.mode === \\"target\\") base *= 1.1;", 1],',
    '  ["F5 клиент trust", "Number(ch.relationship.trust)", 1],',
    '  ["F5 UI желание", "цель: player или id", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

// --- тест ---
(function () {
  const TF = "wb-test.js";
  let t = rd(TF);
  if (t.includes("F5: низкое доверие")) { log.push("тест: уже есть"); return; }
  const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
  if (!t.includes(kill)) { log.push("тест: НЕ НАЙДЕН финальный c.kill"); return; }
  const NEW = [
    '  // --- F5: сокрытие и желание цели ---',
    '  const cLow = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-low", day: 1, ctx: { encounters: 1, force: true, trust: 20 } });',
    '  ok("F5: низкое доверие -> скрывает", safe(cLow.json, ["state", "pregnancy", "known"]) === false);',
    '  let cR;',
    '  for (let d = 2; d <= 17; d++) cR = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-low", day: d, ctx: { encounters: 0, trust: 20, revealForce: false } });',
    '  ok("F5: на 16 дне вынужденное раскрытие", safe(cR.json, ["state", "pregnancy", "known"]) === true && safe(cR.json, ["state", "pregnancy", "forced"]) === true);',
    '  const cHi = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-hi", day: 1, ctx: { encounters: 1, force: true, trust: 80 } });',
    '  ok("F5: высокое доверие -> знает сразу", safe(cHi.json, ["state", "pregnancy", "known"]) === true);',
    '  ok("F5: желание цели при доверии", safe(cHi.json, ["state", "childWish", "targetId"]) === "player");',
    '',
  ];
  t = t.replace(kill, NEW.join("\n") + kill);
  wr(TF, t);
  log.push("тест: добавлен");
})();

console.log(log.join("\n"));
