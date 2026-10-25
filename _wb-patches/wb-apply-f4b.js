"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// --- 1. схема: починить num() без границ + lastBirth ---
let sc = rd("src/001-src_server_schema.js");
sc = rep(sc, "bornDay: num(), stage: str()", "bornDay: num(0, 1e9), stage: str()", "схема bornDay");
sc = rep(sc, "postpartum: { blockUntilDay: num(), milkUntilDay: num() },",
             "postpartum: { blockUntilDay: num(0, 1e9), milkUntilDay: num(0, 1e9) },\n  lastBirth: { day: num(0, 1e9), outcome: str(), count: num(0, 10) },",
             "схема postpartum+lastBirth");
wr("src/001-src_server_schema.js", sc);

// --- 2. 016: детская в AP ---
let g = rd("src/016-src_server_game.js");
g = rep(g, "const hooks = { parts: false };", "const hooks = { parts: false, nursery: false };", "016 hooks.nursery");
g = rep(g,
  '        } else hooks.customWives = false;',
  '        } else hooks.customWives = false;\n' +
  '        const nurseryHtml = addNursery(html);\n' +
  '        if (nurseryHtml !== html && stillCompiles(original, nurseryHtml)) {\n' +
  '          html = nurseryHtml;\n' +
  '          hooks.nursery = true;\n' +
  '        } else hooks.nursery = false;',
  "016 вызов addNursery");
g = rep(g,
  '    var STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\\(\\)\\(([A-Za-z0-9_$]+)\\(\\(e,t\\)=>\\(\\{state:/;',
  '    function addNursery(html) {\n' +
  '      const re = /const AP=\\[\\{id:"upgrade_interior"/;\n' +
  '      if (!re.test(html)) return html;\n' +
  '      return html.replace(re, \'const AP=[{id:"nursery",label:"Build a nursery",description:"A warm room off the landing: cribs, a rug, a small stove. Somewhere for a child to sleep.",cost:150,qualityBoost:0,logText:"The nursery is ready \\u2014 cribs along the wall, a rug, a small stove. Now there is somewhere for a child to sleep."},{id:"upgrade_interior"\');\n' +
  '    }\n' +
  '    var STORE_RE = /const ([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\\(\\)\\(([A-Za-z0-9_$]+)\\(\\(e,t\\)=>\\(\\{state:/;',
  "016 addNursery fn");
g = rep(g, "module2.exports = { Game, findGameDir, MIME, PARTS_RE, addCustomWives };",
             "module2.exports = { Game, findGameDir, MIME, PARTS_RE, addCustomWives, addNursery };",
             "016 export");
wr("src/016-src_server_game.js", g);

// --- 3. 019: автовыдача детской + дети в меню ---
let a = rd("src/019-src_server_assets.generated.js");
if (!a.includes("function grantNursery()")) {
  const grant = `        function grantNursery() {
          try {
            window.__WB_STORE__.setState(function(x) {
              var st = x.state || {}, tav = st.tavern || {};
              var q = (tav.qualityUpgrades || []).slice();
              if (q.indexOf("nursery") >= 0) return {};
              q.push("nursery");
              var ns = {};
              for (var k in st) ns[k] = st[k];
              ns.tavern = Object.assign({}, tav, { qualityUpgrades: q });
              return { state: ns };
            });
          } catch (e) {}
        }
`;
  if (!a.includes("        function checkDay() {")) log.push("019 grantNursery: НЕ НАЙДЕН checkDay");
  else { a = a.replace("        function checkDay() {", grant + "        function checkDay() {"); log.push("019 grantNursery: добавлена"); }
} else log.push("019 grantNursery: уже есть");

a = rep(a,
  'api("POST", "/bridge/api/childstate/tick", { playthrough: pt, day: day, ctx: ctx }).catch(function() {});',
  'api("POST", "/bridge/api/childstate/tick", { playthrough: pt, day: day, ctx: ctx }).then(function(j) {\n              if (j && j.state && j.state.children && j.state.children.length) grantNursery();\n            }).catch(function() {});',
  "019 автовыдача при детях");

a = rep(a,
  '              cell("Желание", cs && cs.childWish ? (cs.childWish.mode || "нет") : "—")\n            ),\n            row(',
  '              cell("Желание", cs && cs.childWish ? (cs.childWish.mode || "нет") : "—")\n            ),\n' +
  '            kids.length ? h("div", { class: "pgrid" }, kids.map(function(c, i) {\n' +
  '              var age = ((cs && cs.lastDay) || 0) - (c.bornDay || 0);\n' +
  '              return cell("#" + (i + 1) + " " + (c.sex === "f" ? "девочка" : "мальчик"), (c.stage || "?") + ", " + age + " дн" + (c.fatherId ? ", отец " + c.fatherId : ""));\n' +
  '            })) : null,\n            row(',
  "019 дети в меню");
wr("src/019-src_server_assets.generated.js", a);

// --- 4. verify ---
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("F4 детская в AP")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F4 детская в AP", "addNursery", 1],',
    '  ["F4 AP nursery", "id:\\"nursery\\"", 1],',
    '  ["F4 автовыдача детской", "function grantNursery()", 1],',
    '  ["F4 дети в меню", "kids.map(function(c, i)", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

// --- 5. тест: исходы родов ---
(function () {
  const TF = "wb-test.js";
  let t = rd(TF);
  if (t.includes("F4: тяжёлые роды")) { log.push("тест: уже есть"); return; }
  const kill = "  c.kill();\n  await sleep(300);\n  fs.rmSync(DATA, { recursive: true, force: true });";
  if (!t.includes(kill)) { log.push("тест: НЕ НАЙДЕН финальный c.kill"); return; }
  const NEW = [
    '  // --- F4: роды с риском ---',
    '  let rHard;',
    '  await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-hard", day: 1, ctx: { encounters: 1, force: true } });',
    '  for (let d = 2; d <= 41; d++) rHard = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-hard", day: d, ctx: { encounters: 0, birthForce: "hard" } });',
    '  ok("F4: исход родов записан", safe(rHard.json, ["state", "lastBirth", "outcome"]) === "hard");',
    '  ok("F4: тяжёлые роды — длиннее блок", (safe(rHard.json, ["state", "postpartum", "blockUntilDay"]) || 0) >= 76);',
    '  let rSmooth;',
    '  await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-smooth", day: 1, ctx: { encounters: 1, force: true } });',
    '  for (let d = 2; d <= 41; d++) rSmooth = await api("POST", "/bridge/api/childstate/tick", { playthrough: "pt-smooth", day: d, ctx: { encounters: 0, birthForce: "smooth" } });',
    '  ok("F4: гладкие роды — короткий блок", (safe(rSmooth.json, ["state", "postpartum", "blockUntilDay"]) || 0) === 61);',
    '',
  ];
  t = t.replace(kill, NEW.join("\n") + kill);
  wr(TF, t);
  log.push("тест: добавлен");
})();

console.log(log.join("\n"));
