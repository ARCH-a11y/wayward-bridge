"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");
const log = [];
const rep = (s, a, b, tag) => { if (s.includes(b)) { log.push(tag + ": уже есть"); return s; } if (!s.includes(a)) { log.push(tag + ": НЕ НАЙДЕН anchor"); return s; } log.push(tag + ": ок"); return s.replace(a, b); };

// --- модуль: current + set ---
let m = rd("src/025-src_server_childstate.js");
if (m.includes("function set(dir, pt, patch)")) log.push("модуль set: уже есть");
else {
  const a = "    module2.exports = {";
  const fn = '    function current(dir) { return load(dir); }\n\n' +
    '    function set(dir, pt, patch) {\n' +
    '      var s = forPlaythrough(dir, pt);\n' +
    '      for (var k in patch) {\n' +
    '        if (patch[k] && typeof patch[k] === "object" && !Array.isArray(patch[k]) && s[k] && typeof s[k] === "object" && !Array.isArray(s[k])) {\n' +
    '          for (var j in patch[k]) s[k][j] = patch[k][j];\n' +
    '        } else {\n' +
    '          s[k] = patch[k];\n' +
    '        }\n' +
    '      }\n' +
    '      save(dir, s);\n' +
    '      return s;\n' +
    '    }\n\n';
  m = m.replace(a, fn + a);
  m = m.replace("prompt: prompt };", "prompt: prompt, current: current, set: set };");
  wr("src/025-src_server_childstate.js", m);
  log.push("модуль current+set: добавлены");
}

// --- 024: require, stateFor, роут set ---
let i24 = rd("src/024-src_server_index.js");
i24 = rep(i24,
  'var { forPlaythrough: childstateFor, tick: childstateTick, prompt: childstatePrompt } = require_childstate();',
  'var { forPlaythrough: childstateFor, tick: childstateTick, prompt: childstatePrompt, current: childstateCurrent, set: childstateSet } = require_childstate();',
  "024 require set");

if (!i24.includes("childstate: childstateCurrent")) {
  const si = i24.indexOf("function stateFor");
  const ri = i24.indexOf("return {", si);
  if (si < 0 || ri < 0) log.push("024 stateFor: НЕ НАЙДЕН return {");
  else { i24 = i24.slice(0, ri + 8) + "\n      childstate: childstateCurrent(store.dataDir)," + i24.slice(ri + 8); log.push("024 stateFor: childstate добавлен"); }
} else log.push("024 stateFor: уже есть");

i24 = rep(i24,
  '        return send(res, 200, { ok: true, state: cs });\n      }',
  '        return send(res, 200, { ok: true, state: cs });\n      }\n' +
  '      if (p === "/bridge/api/childstate/set" && m === "POST") {\n' +
  '        const body = await readJson(req);\n' +
  '        const cs2 = childstateSet(store.dataDir, String(body.playthrough || ""), body.patch || {});\n' +
  '        return send(res, 200, { ok: true, state: cs2 });\n' +
  '      }',
  "024 роут set");
wr("src/024-src_server_index.js", i24);

// --- 019: stateSec, вызов, живот в BODY_PARTS ---
let a19 = rd("src/019-src_server_assets.generated.js");
if (a19.includes("function stateSec()")) log.push("019 stateSec: уже есть");
else if (!a19.includes("        function bodySec() {")) log.push("019 stateSec: НЕ НАЙДЕН anchor bodySec");
else {
  const fn = `        function stateSec() {
          var her = activeHer();
          var pt = her && her.save || "";
          var cs = (S.st && S.st.childstate) || null;
          var preg = cs && cs.pregnancy || { active: false, day: 0, fatherId: "", known: false };
          var post = cs && cs.postpartum || { blockUntilDay: 0, milkUntilDay: 0 };
          var kids = cs && cs.children || [];
          var stage = !preg.active ? "нет" : preg.day < 10 ? "не видно" : preg.day < 20 ? "слегка" : preg.day < 30 ? "заметно" : "большой";
          function set(patch) {
            api("POST", "/bridge/api/childstate/set", { playthrough: pt, patch: patch }).then(function(j) {
              if (j && j.state) S.st.childstate = j.state;
              render();
            });
          }
          function cell(label, val) {
            return h("div", { class: "pcell" },
              h("div", { class: "phead" }, h("span", { class: "plab" }, label)),
              h("div", { style: "padding:2px 4px;font-size:12px" }, val));
          }
          var out = sec(
            "Состояние",
            "#a78bfa",
            "Беременность, цикл и дети. Живёт отдельно от промптов.",
            h("div", { class: "pgrid" },
              cell("Стадия", stage),
              cell("Срок", preg.active ? preg.day + " / 40" : "—"),
              cell("Отец", preg.fatherId || "неизвестен"),
              cell("Знает", preg.known ? "да" : "нет"),
              cell("Цикл", cs && cs.cycle ? cs.cycle.day + " / " + cs.cycle.length : "—"),
              cell("Дети", String(kids.length)),
              cell("Молоко", post.milkUntilDay > ((cs && cs.lastDay) || 0) ? "да" : "нет"),
              cell("Желание", cs && cs.childWish ? (cs.childWish.mode || "нет") : "—")
            ),
            row(
              sbtn("Зачать", "#7c3aed", function() { set({ pregnancy: { active: true, day: 0, fatherId: "", known: false } }); }),
              sbtn("Прервать", "#57534e", function() { set({ pregnancy: { active: false, day: 0 } }); }),
              sbtn("+7 дней", "#0369a1", function() { set({ pregnancy: { day: Math.min(40, (preg.day || 0) + 7) } }); }),
              sbtn("Раскрыть", "#0f766e", function() { set({ pregnancy: { known: true } }); })
            )
          );
          out.setAttribute("data-sec", "state");
          return out;
        }
`;
  a19 = a19.replace("        function bodySec() {", fn + "        function bodySec() {");
  log.push("019 stateSec: добавлена");
}

a19 = rep(a19, "return [charSec, bodySec(), quarantineSec(),", "return [charSec, stateSec(), bodySec(), quarantineSec(),", "019 вызов секции");

if (!a19.includes('["belly"')) {
  const bi = a19.indexOf("var BODY_PARTS = [");
  const be = a19.indexOf("];", bi);
  if (bi < 0 || be < 0) log.push("019 BODY_PARTS: НЕ НАЙДЕН");
  else { a19 = a19.slice(0, be) + '["belly", "Живот"], ' + a19.slice(be); log.push("019 BODY_PARTS: живот добавлен"); }
} else log.push("019 BODY_PARTS: уже есть");
wr("src/019-src_server_assets.generated.js", a19);

// --- verify ---
(function () {
  let v = rd("wb-verify.js");
  if (v.includes("F3 секция Состояние")) { log.push("verify: маркеры уже есть"); return; }
  const mm = v.match(/(const CHECKS = \[[ \t]*\r?\n)/);
  if (!mm) { log.push("verify: НЕ НАЙДЕН CHECKS"); return; }
  const mk = [
    '  ["F3 секция Состояние", "function stateSec()", 1],',
    '  ["F3 вызов секции", "stateSec(), bodySec()", 1],',
    '  ["F3 живот в UI", "[\\"belly\\", \\"Живот\\"]", 1],',
    '  ["F3 роут childstate/set", "/bridge/api/childstate/set", 1],',
    '  ["F3 childstate в stateFor", "childstate: childstateCurrent", 1],',
    '  ["F3 модуль set", "function set(dir, pt, patch)", 1],',
  ].join("\n") + "\n";
  wr("wb-verify.js", v.replace(mm[1], mm[1] + mk));
  log.push("verify: маркеры добавлены");
})();

console.log(log.join("\n"));
