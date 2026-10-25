// wb-apply-g7f.js — загрузка сейва ловится всегда + кнопки удаления
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
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 200));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. удаление ребёнка ==");
rep(F_CHILD,
  "    module2.exports = { empty: empty,",
  '    function removeChild(dir, pt, childId) {\n' +
  '      var s = forPlaythrough(dir, pt);\n' +
  '      var before = s.children.length;\n' +
  '      s.children = s.children.filter(function (c) { return c.id !== childId; });\n' +
  '      if (s.children.length === before) return null;\n' +
  '      save(dir, s);\n' +
  '      return s;\n' +
  '    }\n\n' +
  '    module2.exports = { empty: empty,',
  "removeChild", "function removeChild(dir, pt, childId)");

rep(F_CHILD, "replace: replace };", "replace: replace, removeChild: removeChild };", "экспорт", "removeChild: removeChild");

rep(F_INDEX,
  "replace: childstateReplace } = require_childstate();",
  "replace: childstateReplace, removeChild: childstateRemoveChild } = require_childstate();",
  "require", "childstateRemoveChild");

(function route() {
  const src = rd(F_INDEX);
  if (src.indexOf('"/bridge/api/childstate/remove-child"') >= 0) { console.log("  = уже: роут"); return; }
  const a = src.indexOf('"/bridge/api/childstate/load"');
  if (a < 0) throw new Error("НЕ НАЙДЕН роут load");
  const close = src.indexOf("\n      }\n", a);
  if (close < 0) throw new Error("НЕ НАЙДЕН конец блока load");
  const at = close + "\n      }\n".length;
  const code = '' +
'      if (p === "/bridge/api/childstate/remove-child" && m === "POST") {\n' +
'        const body = await readJson(req);\n' +
'        const cs6 = childstateRemoveChild(store.dataDir, String(body.playthrough || ""), String(body.childId || ""));\n' +
'        if (!cs6) return send(res, 404, { error: "Нет такого ребёнка." });\n' +
'        return send(res, 200, { ok: true, state: withChildLook(cs6) });\n' +
'      }\n';
  wr(F_INDEX, src.slice(0, at) + code + src.slice(at));
  console.log("  + роут remove-child");
})();

console.log("== 2. сейв главнее файла (слежение, а не один раз) ==");
rep(F_CLIENT,
  '        var wbChildLoadedFor = "", lastMirror = "";\n' +
  '        function loadChildFromSave(pt) {\n' +
  '          if (wbChildLoadedFor === pt) return;\n' +
  '          wbChildLoadedFor = pt;\n' +
  '          var s = window.__WB_STORE__;\n' +
  '          if (!s || !s.getState) return;\n' +
  '          var g = s.getState().state || {};\n' +
  '          if (!g.wbChild) return;\n' +
  '          api("POST", "/bridge/api/childstate/load", { playthrough: pt, state: g.wbChild }).then(function(j) {\n' +
  '            if (j && j.state) { S.st.childstate = j.state; lastMirror = ""; lastHomeSig = ""; render(); }\n' +
  '          }).catch(function() {});\n' +
  '        }',
  '        var lastMirror = "", loadingSave = false;\n' +
  '        // сейв игры главнее файла мода: разошлись — значит загрузили сейв, применяем его\n' +
  '        function loadChildFromSave(pt) {\n' +
  '          var s = window.__WB_STORE__;\n' +
  '          if (!s || !s.getState) return;\n' +
  '          var g = s.getState().state || {};\n' +
  '          var wb = g.wbChild;\n' +
  '          if (!wb) return;\n' +
  '          var sig = JSON.stringify(wb);\n' +
  '          if (sig === lastMirror) return;\n' +
  '          var cur = S.st && S.st.childstate ? JSON.stringify(S.st.childstate) : "";\n' +
  '          if (sig === cur) { lastMirror = sig; return; }\n' +
  '          lastMirror = sig;\n' +
  '          loadingSave = true;\n' +
  '          api("POST", "/bridge/api/childstate/load", { playthrough: pt, state: wb }).then(function(j) {\n' +
  '            loadingSave = false;\n' +
  '            if (j && j.state) { S.st.childstate = j.state; lastMirror = ""; lastHomeSig = ""; lastBelly = ""; render(); }\n' +
  '          }).catch(function() { loadingSave = false; });\n' +
  '        }',
  "слежение за сейвом", "loadingSave = true;");

rep(F_CLIENT,
  "        function mirrorChild() {\n          var cs = S.st && S.st.childstate, s = window.__WB_STORE__;",
  "        function mirrorChild() {\n          if (loadingSave) return;\n          var cs = S.st && S.st.childstate, s = window.__WB_STORE__;",
  "не зеркалить во время загрузки", "if (loadingSave) return;");

console.log("== 3. кнопки удаления ==");
rep(F_CLIENT,
  'onclick: function() { removeChild2(c, pt); }',
  'onclick: function() { removeChild2(c, pt); }',
  "(проверка)", "нет");
rep(F_CLIENT,
  '}, "дом") : null) : null),',
  '}, "дом") : null), h("button", { type: "button", class: "link", title: "Удалить ребёнка", onclick: function() { removeChild2(c, pt); } }, "✕") : null),',
  "кнопка удаления ребёнка", '"Удалить ребёнка"');

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

rep(F_CLIENT,
  'sbtn("Зачать", "#7c3aed", function() { set({ pregnancy: { active: true, day: 0, fatherId: "", known: false } }); }),',
  'sbtn("Зачать", "#7c3aed", function() { set({ pregnancy: { active: true, day: 0, fatherId: "", known: false } }); }), sbtn("Убрать срок", "#57534e", function() { set({ pregnancy: { active: false, day: 0, fatherId: "", known: false }, postpartum: { blockUntilDay: 0, milkUntilDay: 0 } }); }),',
  "кнопка «убрать срок»", '"Убрать срок"');

console.log("== 4. маркеры ==");
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

console.log("== 5. тесты ==");
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

console.log("\n== синтаксис ==");
try { new (require("vm").Script)(rd(F_CLIENT)); console.log("  клиент: ок"); } catch (e) { throw new Error("СИНТАКСИС: " + e.message); }
try { new (require("vm").Script)(rd(F_CHILD)); console.log("  childstate: ок"); } catch (e) { throw new Error("СИНТАКСИС childstate: " + e.message); }
console.log("\nГОТОВО.");