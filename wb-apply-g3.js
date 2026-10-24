"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// 1. looks: экспорт словаря
let L = rd("src/026-src_server_looks.js");
L = rep(L, "module2.exports = { random: random, extract: extract, child: child, describe: describe };",
           "module2.exports = { random: random, extract: extract, child: child, describe: describe, SCALE: SCALE, FREE: FREE };", "looks export vocab");
wr("src/026-src_server_looks.js", L);

// 2. модуль: переброс look
let m = rd("src/025-src_server_childstate.js");
if (!m.includes("function rerollLook")) {
  const fn = '    function rerollLook(dir, pt, childId) {\n' +
    '      var s = forPlaythrough(dir, pt);\n' +
    '      for (var i = 0; i < s.children.length; i++) {\n' +
    '        if (s.children[i].id === childId) { s.children[i].look = looks.child(s.pregnancy.motherLook, s.pregnancy.fatherLook); }\n' +
    '      }\n' +
    '      save(dir, s);\n' +
    '      return s;\n' +
    '    }\n\n';
  m = m.replace("    module2.exports = {", fn + "    module2.exports = {");
  m = m.replace("set: set };", "set: set, rerollLook: rerollLook };");
  log.push("модуль rerollLook: добавлен");
} else log.push("модуль rerollLook: уже есть");
wr("src/025-src_server_childstate.js", m);

// 3. 024: require, роуты, lookVocab
let i24 = rd("src/024-src_server_index.js");
i24 = rep(i24, "var { extract: looksExtract, describe: looksDescribe, random: looksRandom } = require_looks();",
               "var { extract: looksExtract, describe: looksDescribe, random: looksRandom, SCALE: LOOKS_SCALE, FREE: LOOKS_FREE } = require_looks();", "024 require vocab");
i24 = rep(i24, "set: childstateSet } = require_childstate();", "set: childstateSet, rerollLook: childstateReroll } = require_childstate();", "024 require reroll");
i24 = rep(i24, '      childstate: (function () {',
               '      lookVocab: { scale: LOOKS_SCALE, free: LOOKS_FREE },\n      childstate: (function () {', "024 lookVocab");
i24 = rep(i24,
  '        return send(res, 200, { ok: true, state: cs2 });\n      }',
  '        return send(res, 200, { ok: true, state: cs2 });\n      }\n' +
  '      if (p === "/bridge/api/childstate/reroll" && m === "POST") {\n' +
  '        const body = await readJson(req);\n' +
  '        const cs3 = childstateReroll(store.dataDir, String(body.playthrough || ""), String(body.childId || ""));\n' +
  '        return send(res, 200, { ok: true, state: cs3 });\n' +
  '      }\n' +
  '      if (p === "/bridge/api/player/random" && m === "POST") {\n' +
  '        const l = looksRandom(); l.set = true;\n' +
  '        try { store.patch([{ path: ["layer", "player", "look"], value: l }], store.revision); } catch (e) {}\n' +
  '        return send(res, 200, { ok: true, look: l });\n' +
  '      }',
  "024 роуты reroll/random");
wr("src/024-src_server_index.js", i24);

// 4. 019: секция паспорта + кнопка переброса у ребёнка
let a = rd("src/019-src_server_assets.generated.js");
if (!a.includes("function passportSec()")) {
  const fn = `        function passportSec() {
          var rb = ["player", "look"];
          var V = (S.st && S.st.lookVocab) || { scale: {}, free: {} };
          var ALL = Object.assign({}, V.scale, V.free);
          var F = [["hair", "волосы"], ["hairType", "тип волос"], ["eyes", "глаза"], ["skin", "кожа"], ["face", "лицо"], ["build", "телосложение"], ["bust", "грудь"], ["hips", "бёдра"]];
          var out = sec(
            "ГГ (вы)",
            "#22d3ee",
            "Внешность игрока: наследуется детьми и уходит в промпт, когда вы в кадре.",
            h("div", { class: "pgrid" }, F.map(function(f) {
              var rel = rb.concat(f[0]);
              var cur = E(rel) || "";
              var sel = h("select", { class: "sel xs", onchange: function() { if (sel.value) edit(rel, sel.value); else restore(rel); } },
                [""].concat(ALL[f[0]] || []).map(function(v2) { return h("option", { value: v2, selected: v2 === cur }, v2 || "—"); }));
              return h("div", { class: "pcell" }, h("div", { class: "phead" }, h("span", { class: "plab" }, f[1]), badgeFor(rel)), sel);
            })),
            row(sbtn("Случайно", "#0e7490", function() {
              api("POST", "/bridge/api/player/random", {}).then(function() { return api("GET", "/bridge/api/state"); }).then(function(r) { if (r && r.json) setState(r.json); render(); });
            }))
          );
          out.setAttribute("data-sec", "passport");
          return out;
        }
`;
  a = a.replace("        function bodySec() {", fn + "        function bodySec() {");
  log.push("019 passportSec: добавлена");
} else log.push("019 passportSec: уже есть");
a = rep(a, "return [charSec, stateSec(), bodySec(),", "return [charSec, stateSec(), passportSec(), bodySec(),", "019 вызов passportSec");

a = rep(a,
  '            kids.length ? h("div", { class: "pgrid" }, kids.map(function(c, i) {\n              var age = ((cs && cs.lastDay) || 0) - (c.bornDay || 0);\n              return cell("#" + (i + 1) + " " + (c.sex === "f" ? "девочка" : "мальчик"), (c.stage || "?") + ", " + age + " дн" + (c.fatherId ? ", отец " + c.fatherId : ""));\n            })) : null,',
  '            kids.length ? h("div", { class: "pgrid" }, kids.map(function(c, i) {\n              var age = ((cs && cs.lastDay) || 0) - (c.bornDay || 0);\n              return h("div", { class: "pcell" },\n                h("div", { class: "phead" }, h("span", { class: "plab" }, "#" + (i + 1) + " " + (c.sex === "f" ? "девочка" : "мальчик")), h("button", { type: "button", class: "link", title: "Перебросить внешность", onclick: function() { api("POST", "/bridge/api/childstate/reroll", { playthrough: pt, childId: c.id }).then(function(j) { if (j && j.state) S.st.childstate = j.state; render(); }); } }, "↻")),\n                h("div", { style: "padding:2px 4px;font-size:12px" }, (c.stage || "?") + ", " + age + " дн" + (c.lookText ? " — " + c.lookText : "")));\n            })) : null,',
  "019 карточка ребёнка");
wr("src/019-src_server_assets.generated.js", a);

// verify
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("G3 секция паспорт")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["G3 секция паспорт", "function passportSec()", 1],',
    '  ["G3 вызов паспорта", "stateSec(), passportSec(), bodySec()", 1],',
    '  ["G3 роут random", "/bridge/api/player/random", 1],',
    '  ["G3 роут reroll", "/bridge/api/childstate/reroll", 1],',
    '  ["G3 lookVocab", "lookVocab: { scale: LOOKS_SCALE", 1],',
    '  ["G3 карточка ребёнка", "Перебросить внешность", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
