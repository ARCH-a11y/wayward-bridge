// wb-apply-g7g.js — кнопки удаления, маркеры и тесты (шаги 3-5 из g7f)
const fs = require("fs");
const F_CLIENT = "src/019-src_server_assets.generated.js";
const F_VERIFY = "wb-verify.js";
const F_TEST = "wb-test.js";

function rd(f) { return fs.readFileSync(f, "utf8"); }
function wr(f, s) { fs.writeFileSync(f, s, "utf8"); }
function rep(f, from, to, label, guard) {
  const src = rd(f);
  if (guard && src.indexOf(guard) >= 0) { console.log("  = уже: " + label); return; }
  const i = src.indexOf(from);
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 200));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. кнопка удаления ребёнка ==");
rep(F_CLIENT,
  '}, "дом") : null),',
  '}, "дом") : null, h("button", { type: "button", class: "link", title: "Удалить ребёнка", onclick: function() { removeChild2(c, pt); } }, "✕") : null),',
  "кнопка ✕", '"Удалить ребёнка"');

rep(F_CLIENT,
  "        function patchChild(id, patch, pt) {",
  '        function removeChild2(c, pt) {\n' +
  '          api("POST", "/bridge/api/childstate/remove-child", { playthrough: pt, childId: c.id }).then(function(j) {\n' +
  '            if (!j || !j.state) { say((j && j.error) || "Не вышло.", false); return; }\n' +
  '            S.st.childstate = j.state;\n' +
  '            var s = window.__WB_STORE__;\n' +
  '            if (s && s.getState) {\n' +
  '              var key = "wb" + c.id, pid = "person:" + key;\n' +
  '              s.setState(function(x) {\n' +
  '                var g = x.state || {}, her = g.primaryCharacterId;\n' +
  '                var st = {};\n' +
  '                for (var k in g) st[k] = g[k];\n' +
  '                st.visitingPeople = (g.visitingPeople || []).filter(function(e) { return e.personId !== key; });\n' +
  '                if (g.locations) {\n' +
  '                  var locs = {};\n' +
  '                  Object.keys(g.locations).forEach(function(k2) {\n' +
  '                    var o = g.locations[k2] && g.locations[k2].occupants;\n' +
  '                    locs[k2] = Object.assign({}, g.locations[k2], { occupants: (o || []).filter(function(v) { return v !== pid; }) });\n' +
  '                  });\n' +
  '                  st.locations = locs;\n' +
  '                }\n' +
  '                if (her && g.circles && g.circles[her]) {\n' +
  '                  var c0 = g.circles[her], circles = Object.assign({}, g.circles);\n' +
  '                  circles[her] = Object.assign({}, c0, {\n' +
  '                    persons: (c0.persons || []).filter(function(p) { return p.id !== key; }),\n' +
  '                    links: (c0.links || []).filter(function(l) { return l.to !== pid && l.from !== pid; })\n' +
  '                  });\n' +
  '                  st.circles = circles;\n' +
  '                }\n' +
  '                return { state: st };\n' +
  '              });\n' +
  '            }\n' +
  '            lastHomeSig = "";\n' +
  '            lastMirror = "";\n' +
  '            say((c.name || "Ребёнок") + " удалён", true);\n' +
  '            render();\n' +
  '          }).catch(function() { say("Не вышло.", false); });\n' +
  '        }\n' +
  '        function patchChild(id, patch, pt) {',
  "removeChild2", "function removeChild2(c, pt)");

console.log("== 2. кнопка «убрать срок» ==");
rep(F_CLIENT,
  'sbtn("Зачать", "#7c3aed", function() { set({ pregnancy: { active: true, day: 0, fatherId: "", known: false } }); }),',
  'sbtn("Зачать", "#7c3aed", function() { set({ pregnancy: { active: true, day: 0, fatherId: "", known: false } }); }), sbtn("Убрать срок", "#57534e", function() { set({ pregnancy: { active: false, day: 0, fatherId: "", known: false }, postpartum: { blockUntilDay: 0, milkUntilDay: 0 } }); }),',
  "кнопка убрать срок", '"Убрать срок"');

console.log("== 3. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("G7: удаление ребёнка", "function removeChild(dir, pt, childId)");
  put("G7: роут удаления", "/bridge/api/childstate/remove-child");
  put("G7: кнопка удаления", "Удалить ребёнка");
  put("G7: кнопка убрать срок", "Убрать срок");
  put("G7: сейв главнее файла", "loadingSave = true;");
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("== 4. тесты ==");
{
  const t = rd(F_TEST);
  const from = "  c.kill();\n  await sleep(300);";
  if (t.indexOf("G7: ребёнок удаляется") >= 0) console.log("  = уже: тесты");
  else if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН финал теста");
  else {
    const code = '' +
'  // --- G7: удаление ---\n' +
'  await api("POST", "/bridge/api/childstate/load", { playthrough: "pt-rm", state: { lastDay: 5, children: [\n' +
'    { id: "r1", sex: "f", name: "Лиза", bornDay: 1, stage: "child" },\n' +
'    { id: "r2", sex: "m", name: "Отто", bornDay: 1, stage: "child" }\n' +
'  ] } });\n' +
'  const g9 = await api("POST", "/bridge/api/childstate/remove-child", { playthrough: "pt-rm", childId: "r1" });\n' +
'  ok("G7: ребёнок удаляется", (safe(g9.json, ["state", "children"]) || []).length === 1 && safe(g9.json, ["state", "children", 0, "id"]) === "r2");\n' +
'  const g9b = await api("POST", "/bridge/api/childstate/remove-child", { playthrough: "pt-rm", childId: "нет" });\n' +
'  ok("G7: удаление несуществующего -> 404", g9b.status === 404);\n' +
'  const g9c = await api("GET", "/bridge/api/childstate?playthrough=pt-rm");\n' +
'  ok("G7: удаление сохранилось", (safe(g9c.json, ["children"]) || []).length === 1);\n' +
'  c.kill();\n  await sleep(300);';
    wr(F_TEST, t.replace(from, code));
    console.log("  + 3 теста");
  }
}

console.log("\n== синтаксис клиента ==");
try { new (require("vm").Script)(rd(F_CLIENT)); console.log("  ок"); } catch (e) { throw new Error("СИНТАКСИС: " + e.message); }
console.log("\nГОТОВО.");