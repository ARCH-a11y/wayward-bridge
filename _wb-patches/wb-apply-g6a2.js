// wb-apply-g6a2.js — добор имён, правка ребёнка (имя/стадия/возраст), контролы в карточке
const fs = require("fs");
const F_CHILD = "src/025-src_server_childstate.js";
const F_INDEX = "src/024-src_server_index.js";
const F_CLIENT = "src/019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";
const F_TEST = "wb-test.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 180));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. добор имён старым детям ==");
rep(F_CHILD,
  "    function pickName(s, sex) {",
  '    // у детей, рождённых до появления имён, имя добирается при первом же обращении\n' +
  '    function ensureNames(s) {\n' +
  '      var changed = false;\n' +
  '      for (var i = 0; i < s.children.length; i++) {\n' +
  '        var c = s.children[i];\n' +
  '        if (c && !c.name) { c.name = pickName(s, c.sex); changed = true; }\n' +
  '      }\n' +
  '      return changed;\n' +
  '    }\n\n' +
  '    function pickName(s, sex) {',
  "ensureNames", "function ensureNames(s)");

rep(F_CHILD,
  "      if (s.playthrough !== pt) { var f = empty(); f.playthrough = pt; save(dir, f); return f; }\n      return s;",
  "      if (s.playthrough !== pt) { var f = empty(); f.playthrough = pt; save(dir, f); return f; }\n      if (ensureNames(s)) save(dir, s);\n      return s;",
  "вызов ensureNames", "if (ensureNames(s)) save(dir, s);");

console.log("== 2. правка одного ребёнка ==");
rep(F_CHILD,
  "    module2.exports = { empty: empty,",
  '    var STAGE_AGE = { infant: 15, child: 50, teen: 100, youth: 160 };\n' +
  '    // правка одного ребёнка: имя, стадия, возраст (стадия и bornDay держатся согласованно)\n' +
  '    function patchChild(dir, pt, childId, patch) {\n' +
  '      var s = forPlaythrough(dir, pt);\n' +
  '      var c = childById(s, childId);\n' +
  '      if (!c) return null;\n' +
  '      patch = patch || {};\n' +
  '      if (typeof patch.name === "string" && patch.name.trim()) c.name = patch.name.trim().slice(0, 24);\n' +
  '      if (typeof patch.stage === "string" && STAGE_AGE[patch.stage] != null) c.bornDay = (s.lastDay || 0) - STAGE_AGE[patch.stage];\n' +
  '      if (typeof patch.bornDay === "number" && isFinite(patch.bornDay)) c.bornDay = Math.round(patch.bornDay);\n' +
  '      if (c.bornDay > (s.lastDay || 0)) c.bornDay = s.lastDay || 0;\n' +
  '      c.stage = stageOf((s.lastDay || 0) - c.bornDay);\n' +
  '      if (!c.name) c.name = pickName(s, c.sex);\n' +
  '      save(dir, s);\n' +
  '      return s;\n' +
  '    }\n\n' +
  '    module2.exports = { empty: empty,',
  "patchChild", "function patchChild(dir, pt, childId, patch)");

rep(F_CHILD,
  "personFor: personFor, promote: promote };",
  "personFor: personFor, promote: promote, patchChild: patchChild };",
  "экспорт", "patchChild: patchChild");

console.log("== 3. роут ==");
rep(F_INDEX,
  "personFor: childstatePerson, promote: childstatePromote } = require_childstate();",
  "personFor: childstatePerson, promote: childstatePromote, patchChild: childstatePatchChild } = require_childstate();",
  "require", "childstatePatchChild");

(function route() {
  const src = rd(F_INDEX);
  if (src.indexOf('"/bridge/api/childstate/child"') >= 0) { console.log("  = уже: роут"); return; }
  const a = src.indexOf('"/bridge/api/childstate/promote"');
  if (a < 0) throw new Error("НЕ НАЙДЕН роут promote");
  const close = src.indexOf("\n      }\n", a);
  if (close < 0) throw new Error("НЕ НАЙДЕН конец блока promote");
  const at = close + "\n      }\n".length;
  const code = '' +
'      if (p === "/bridge/api/childstate/child" && m === "POST") {\n' +
'        const body = await readJson(req);\n' +
'        const cs4 = childstatePatchChild(store.dataDir, String(body.playthrough || ""), String(body.childId || ""), body.patch || {});\n' +
'        if (!cs4) return send(res, 404, { error: "Нет такого ребёнка." });\n' +
'        return send(res, 200, { ok: true, state: withChildLook(cs4) });\n' +
'      }\n';
  wr(F_INDEX, src.slice(0, at) + code + src.slice(at));
  console.log("  + роут childstate/child");
})();

console.log("== 4. контролы в карточке ==");
rep(F_CLIENT,
  '(c.stage || "?") + ", " + age + " дн" + (c.lookText ? " — " + c.lookText : "")),',
  '(c.stage || "?") + ", " + age + " дн" + (c.lookText ? " — " + c.lookText : "")), ' +
  'h("div", { style: "display:flex;gap:4px;align-items:center;padding:2px 4px" }, ' +
  'h("input", { class: "sel xs", value: c.name || "", placeholder: "имя", onchange: function() { patchChild(c.id, { name: this.value }); } }), ' +
  'h("select", { class: "sel xs", onchange: function() { patchChild(c.id, { stage: this.value }); } }, ' +
  '["infant", "child", "teen", "youth"].map(function(st) { return h("option", { value: st, selected: c.stage === st }, st); })), ' +
  'h("button", { type: "button", class: "link", title: "Взрослеть на 30 дней", onclick: function() { patchChild(c.id, { bornDay: (c.bornDay || 0) - 30 }); } }, "+30 дн")),',
  "контролы", 'placeholder: "имя"');

rep(F_CLIENT,
  "        function promoteChild(c, pt) {",
  '        function patchChild(id, patch) {\n' +
  '          api("POST", "/bridge/api/childstate/child", { playthrough: pt, childId: id, patch: patch }).then(function(j) {\n' +
  '            if (j && j.state) S.st.childstate = j.state;\n' +
  '            render();\n' +
  '          });\n' +
  '        }\n' +
  '        function promoteChild(c, pt) {',
  "patchChild в клиенте", "function patchChild(id, patch)");

console.log("== 5. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("G6: добор имён", "function ensureNames(s)");
  put("G6: правка ребёнка", "function patchChild(dir, pt, childId, patch)");
  put("G6: роут правки ребёнка", "/bridge/api/childstate/child");
  put("G6: выбор стадии в UI", '["infant", "child", "teen", "youth"]');
  put("G6: кнопка взросления", "+30 дн");
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("== 6. тесты ==");
{
  const t = rd(F_TEST);
  const from = "  c.kill();\n  await sleep(300);";
  if (t.indexOf("G6: стадия ставится вручную") >= 0) console.log("  = уже: тесты");
  else if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН финал теста");
  else {
    const code = '' +
'  // --- G6a2: правка ребёнка и добор имён ---\n' +
'  const g6st = await api("POST", "/bridge/api/childstate/child", { playthrough: "pt-pers", childId: "q1", patch: { stage: "teen" } });\n' +
'  ok("G6: стадия ставится вручную", safe(g6st.json, ["state", "children", 0, "stage"]) === "teen");\n' +
'  ok("G6: возраст под стадию", ((safe(g6st.json, ["state", "lastDay"]) || 0) - (safe(g6st.json, ["state", "children", 0, "bornDay"]) || 0)) >= 75);\n' +
'  const g6nm = await api("POST", "/bridge/api/childstate/child", { playthrough: "pt-pers", childId: "q1", patch: { name: "Марта" } });\n' +
'  ok("G6: имя правится руками", safe(g6nm.json, ["state", "children", 0, "name"]) === "Марта");\n' +
'  const g6up = await api("POST", "/bridge/api/childstate/child", { playthrough: "pt-pers", childId: "q1", patch: { bornDay: (safe(g6nm.json, ["state", "children", 0, "bornDay"]) || 0) - 30 } });\n' +
'  ok("G6: взросление сдвигает возраст", ((safe(g6up.json, ["state", "lastDay"]) || 0) - (safe(g6up.json, ["state", "children", 0, "bornDay"]) || 0)) >= 130);\n' +
'  await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-nm", patch: { children: [{ id: "n1", sex: "m", bornDay: 5, stage: "child", look: LOOK }] } });\n' +
'  const g6bf = await api("GET", "/bridge/api/childstate/person?playthrough=pt-nm&childId=n1&her=elena");\n' +
'  ok("G6: имя добирается старым детям", String(safe(g6bf.json, ["person", "name"]) || "").length > 1);\n' +
'  const g6no2 = await api("POST", "/bridge/api/childstate/child", { playthrough: "pt-pers", childId: "нет", patch: { stage: "teen" } });\n' +
'  ok("G6: правка несуществующего -> 404", g6no2.status === 404);\n' +
'  c.kill();\n  await sleep(300);';
    wr(F_TEST, t.replace(from, code));
    console.log("  + 6 тестов");
  }
}
console.log("\nГОТОВО.");