// wb-apply-g6c.js — обратимость переезда, дневной быт ребёнка, childstate в сейве игры
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
  if (i < 0) throw new Error("НЕ НАЙДЕН анкор [" + label + "]:\n" + from.slice(0, 190));
  wr(f, src.slice(0, i) + to + src.slice(i + from.length));
  console.log("  + " + label);
}

console.log("== 1. переезд обратим ==");
rep(F_CHILD,
  '    function moveOutIfGrown(c) {\n      if (c.stage === "youth" && !c.movedOut) { c.movedOut = true; c.home = pickHome(); }\n      return c;\n    }',
  '    function moveOutIfGrown(c) {\n      if (c.stage === "youth") {\n        if (!c.movedOut) { c.movedOut = true; c.home = pickHome(); }\n      } else if (c.movedOut) {\n        c.movedOut = false;\n      }\n      return c;\n    }',
  "обратимость", '} else if (c.movedOut) {');

console.log("== 2. загрузка childstate из сейва ==");
rep(F_CHILD,
  "    module2.exports = { empty: empty,",
  '    // состояние ребёнка из сейва игры перекрывает файл мода\n' +
  '    function replace(dir, pt, incoming) {\n' +
  '      var f = empty();\n' +
  '      if (incoming && typeof incoming === "object") {\n' +
  '        for (var k in incoming) if (k !== "playthrough" && incoming[k] !== void 0) f[k] = incoming[k];\n' +
  '      }\n' +
  '      f.playthrough = pt;\n' +
  '      if (!Array.isArray(f.children)) f.children = [];\n' +
  '      if (!f.pregnancy || typeof f.pregnancy !== "object") f.pregnancy = empty().pregnancy;\n' +
  '      if (!f.postpartum || typeof f.postpartum !== "object") f.postpartum = empty().postpartum;\n' +
  '      if (!f.cycle || typeof f.cycle !== "object") f.cycle = empty().cycle;\n' +
  '      if (!f.childWish || typeof f.childWish !== "object") f.childWish = empty().childWish;\n' +
  '      if (!f.lastBirth || typeof f.lastBirth !== "object") f.lastBirth = empty().lastBirth;\n' +
  '      if (typeof f.lastDay !== "number") f.lastDay = 0;\n' +
  '      ensureNames(f);\n' +
  '      save(dir, f);\n' +
  '      return f;\n' +
  '    }\n\n' +
  '    module2.exports = { empty: empty,',
  "replace", "function replace(dir, pt, incoming)");

rep(F_CHILD,
  "patchChild: patchChild };",
  "patchChild: patchChild, replace: replace };",
  "экспорт", "replace: replace }");

rep(F_INDEX,
  "patchChild: childstatePatchChild } = require_childstate();",
  "patchChild: childstatePatchChild, replace: childstateReplace } = require_childstate();",
  "require", "childstateReplace");

(function route() {
  const src = rd(F_INDEX);
  if (src.indexOf('"/bridge/api/childstate/load"') >= 0) { console.log("  = уже: роут"); return; }
  const a = src.indexOf('"/bridge/api/childstate/child"');
  if (a < 0) throw new Error("НЕ НАЙДЕН роут child");
  const close = src.indexOf("\n      }\n", a);
  if (close < 0) throw new Error("НЕ НАЙДЕН конец блока child");
  const at = close + "\n      }\n".length;
  const code = '' +
'      if (p === "/bridge/api/childstate/load" && m === "POST") {\n' +
'        const body = await readJson(req);\n' +
'        const cs5 = childstateReplace(store.dataDir, String(body.playthrough || ""), body.state || {});\n' +
'        return send(res, 200, { ok: true, state: withChildLook(cs5) });\n' +
'      }\n';
  wr(F_INDEX, src.slice(0, at) + code + src.slice(at));
  console.log("  + роут childstate/load");
})();

console.log("== 3. клиент: сейв-синхрон и дневной быт ==");
rep(F_CLIENT,
  "        function syncChildHome(c) {\n          var store = window.__WB_STORE__;\n          if (!store || !store.getState) { say(\"Игра не отдала стор.\", false); return; }\n          var her = (store.getState().state || {}).primaryCharacterId;\n          if (!her) return;\n          var pid = \"person:wb\" + c.id, key = \"wb\" + c.id;\n          store.setState(function(x) {\n            var g = x.state || {}, slot = g.slot || 0;\n            var vp = (g.visitingPeople || []).filter(function(e) { return e.personId !== key; });\n            var locs = Object.assign({}, g.locations || {}), occ = {};\n            Object.keys(locs).forEach(function(k) {\n              var o = locs[k] && locs[k].occupants;\n              if (o && o.indexOf(pid) >= 0) occ[k] = o.filter(function(v) { return v !== pid; });\n            });\n            if (!c.movedOut) {\n              vp.push({ of: her, personId: key, arrivedSlot: slot, leaveAtSlot: slot + 1e6, toSee: false, home: true });\n              occ.nursery = (((locs.nursery && locs.nursery.occupants) || []).filter(function(v) { return v !== pid; })).concat([pid]);\n            }\n            Object.keys(occ).forEach(function(k) {\n              locs[k] = Object.assign({}, locs[k] || { occupants: [] }, { occupants: occ[k] });\n            });\n            var st = {};\n            for (var k2 in g) st[k2] = g[k2];\n            st.visitingPeople = vp;\n            st.locations = locs;\n            return { state: st };\n          });\n        }",
  '        var lastHomeSig = "";\n' +
  '        function homeSig() {\n' +
  '          var cs = S.st && S.st.childstate;\n' +
  '          var s = window.__WB_STORE__;\n' +
  '          if (!cs || !s || !s.getState) return "";\n' +
  '          var g = s.getState().state || {};\n' +
  '          return (g.phase || "") + "|" + (cs.children || []).map(function(c) { return c.id + c.stage + (c.movedOut ? "1" : "0"); }).join(",");\n' +
  '        }\n' +
  '        // дети живут в детской, днём (service) играют в таверне; уехавшие — вне дома\n' +
  '        function syncChildHome(force) {\n' +
  '          var s = window.__WB_STORE__;\n' +
  '          if (!s || !s.getState) { if (force) say("Игра не отдала стор.", false); return; }\n' +
  '          var her = (s.getState().state || {}).primaryCharacterId;\n' +
  '          var cs = S.st && S.st.childstate;\n' +
  '          if (!her || !cs) return;\n' +
  '          var sig = homeSig();\n' +
  '          if (!force && sig === lastHomeSig) return;\n' +
  '          lastHomeSig = sig;\n' +
  '          s.setState(function(x) {\n' +
  '            var g = x.state || {}, slot = g.slot || 0, phase = g.phase || "";\n' +
  '            var kids = (cs.children || []).filter(function(c) { return c.promoted; });\n' +
  '            var keys = kids.map(function(c) { return "wb" + c.id; });\n' +
  '            var pids = keys.map(function(k) { return "person:" + k; });\n' +
  '            var vp = (g.visitingPeople || []).filter(function(e) { return keys.indexOf(e.personId) < 0; });\n' +
  '            var locs = Object.assign({}, g.locations || {}), occ = {};\n' +
  '            Object.keys(locs).forEach(function(k) {\n' +
  '              var o = locs[k] && locs[k].occupants;\n' +
  '              if (!o) return;\n' +
  '              var f = o.filter(function(v) { return pids.indexOf(v) < 0; });\n' +
  '              if (f.length !== o.length) occ[k] = f;\n' +
  '            });\n' +
  '            kids.forEach(function(c) {\n' +
  '              if (c.movedOut) return;\n' +
  '              var pid = "person:wb" + c.id;\n' +
  '              var room = (phase === "service" && c.stage !== "infant") ? "taproom" : "nursery";\n' +
  '              vp.push({ of: her, personId: "wb" + c.id, arrivedSlot: slot, leaveAtSlot: slot + 1e6, toSee: false, home: true });\n' +
  '              var base = occ[room] != null ? occ[room] : ((locs[room] && locs[room].occupants) || []);\n' +
  '              occ[room] = base.filter(function(v) { return pids.indexOf(v) < 0; }).concat([pid]);\n' +
  '            });\n' +
  '            Object.keys(occ).forEach(function(k) {\n' +
  '              locs[k] = Object.assign({}, locs[k] || { occupants: [] }, { occupants: occ[k] });\n' +
  '            });\n' +
  '            var st = {};\n' +
  '            for (var k2 in g) st[k2] = g[k2];\n' +
  '            st.visitingPeople = vp;\n' +
  '            st.locations = locs;\n' +
  '            return { state: st };\n' +
  '          });\n' +
  '        }\n' +
  '        // состояние ребёнка едет вместе с сейвом игры\n' +
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
  '        }\n' +
  '        function mirrorChild() {\n' +
  '          var cs = S.st && S.st.childstate, s = window.__WB_STORE__;\n' +
  '          if (!cs || !s || !s.getState) return;\n' +
  '          var sig = JSON.stringify(cs);\n' +
  '          if (sig === lastMirror) return;\n' +
  '          lastMirror = sig;\n' +
  '          s.setState(function(x) {\n' +
  '            var g = x.state || {};\n' +
  '            if (JSON.stringify(g.wbChild) === sig) return {};\n' +
  '            var st = {};\n' +
  '            for (var k in g) st[k] = g[k];\n' +
  '            st.wbChild = cs;\n' +
  '            return { state: st };\n' +
  '          });\n' +
  '        }',
  "syncChildHome/mirror", "function loadChildFromSave(pt)");

rep(F_CLIENT,
  "            if (!day || day === lastTickDay) return;\n            var her = activeHer();\n            var pt = her && her.save;\n            if (!pt) return;",
  "            var her = activeHer();\n            var pt = her && her.save;\n            if (!pt) return;\n            loadChildFromSave(pt);\n            mirrorChild();\n            syncChildHome();\n            if (!day || day === lastTickDay) return;",
  "вызовы в checkDay", "loadChildFromSave(pt);\n            mirrorChild();");

rep(F_CLIENT,
  "              syncChildHome(c);\n              if (j.state) S.st.childstate = j.state;",
  "              if (j.state) S.st.childstate = j.state;\n              syncChildHome(true);",
  "promote -> force sync", "syncChildHome(true);");

rep(F_CLIENT,
  'onclick: function() { syncChildHome(c); say("Место жительства обновлено"); render(); }',
  'onclick: function() { syncChildHome(true); say("Место жительства обновлено"); render(); }',
  "кнопка дом", "syncChildHome(true); say(");

console.log("== 4. маркеры ==");
(function verify() {
  const v = rd(F_VERIFY);
  const m = v.match(/(var|const|let)\s+CHECKS\s*=\s*\[/);
  if (!m) throw new Error("НЕ НАЙДЕН массив CHECKS");
  const at = m.index + m[0].length;
  const add = [];
  const put = (n, s) => { if (v.indexOf('"' + n + '"') < 0) add.push('  ["' + n + '", ' + JSON.stringify(s) + ', 1],'); };
  put("G6c: переезд обратим", "} else if (c.movedOut) {");
  put("G6c: childstate из сейва", "function replace(dir, pt, incoming)");
  put("G6c: роут load", "/bridge/api/childstate/load");
  put("G6c: зеркало в сейв", "st.wbChild = cs;");
  put("G6c: загрузка из сейва", "function loadChildFromSave(pt)");
  put("G6c: днём в таверне", 'phase === "service" && c.stage !== "infant"');
  if (add.length) { wr(F_VERIFY, v.slice(0, at) + "\n" + add.join("\n") + v.slice(at)); console.log("  + " + add.length + " маркеров"); }
  else console.log("  = уже: маркеры");
})();

console.log("== 5. тесты ==");
{
  const t = rd(F_TEST);
  const from = "  c.kill();\n  await sleep(300);";
  if (t.indexOf("G6c: состояние грузится из сейва") >= 0) console.log("  = уже: тесты");
  else if (t.indexOf(from) < 0) throw new Error("НЕ НАЙДЕН финал теста");
  else {
    const code = '' +
'  // --- G6c: childstate из сейва и обратимость ---\n' +
'  const g8 = await api("POST", "/bridge/api/childstate/load", { playthrough: "pt-load", state: { lastDay: 12, children: [{ id: "z1", sex: "f", name: "Роза", bornDay: 2, stage: "child" }] } });\n' +
'  ok("G6c: состояние грузится из сейва", safe(g8.json, ["state", "lastDay"]) === 12 && (safe(g8.json, ["state", "children"]) || []).length === 1);\n' +
'  const g8b = await api("GET", "/bridge/api/childstate?playthrough=pt-load");\n' +
'  ok("G6c: и держится после чтения", safe(g8b.json, ["lastDay"]) === 12 && safe(g8b.json, ["children", 0, "name"]) === "Роза");\n' +
'  const g8c = await api("POST", "/bridge/api/childstate/load", { playthrough: "pt-load", state: { lastDay: 3, children: [] } });\n' +
'  ok("G6c: загрузка раннего сейва убирает ребёнка", (safe(g8c.json, ["state", "children"]) || []).length === 0 && safe(g8c.json, ["state", "lastDay"]) === 3);\n' +
'  await api("POST", "/bridge/api/childstate/set", { playthrough: "pt-back", patch: { children: [{ id: "b1", sex: "m", bornDay: 0, stage: "youth" }] } });\n' +
'  const g8d = await api("GET", "/bridge/api/childstate/person?playthrough=pt-back&childId=b1&her=elena");\n' +
'  ok("G6c: youth = уехал", safe(g8d.json, ["movedOut"]) === true);\n' +
'  await api("POST", "/bridge/api/childstate/child", { playthrough: "pt-back", childId: "b1", patch: { stage: "child" } });\n' +
'  const g8e = await api("GET", "/bridge/api/childstate/person?playthrough=pt-back&childId=b1&her=elena");\n' +
'  ok("G6c: возраст назад = дома", safe(g8e.json, ["movedOut"]) === false && safe(g8e.json, ["person", "lives"]) === "home");\n' +
'  c.kill();\n  await sleep(300);';
    wr(F_TEST, t.replace(from, code));
    console.log("  + 5 тестов");
  }
}

console.log("== 6. синтаксис ==");
try { new (require("vm").Script)(rd(F_CLIENT)); console.log("  клиент: ок"); } catch (e) { throw new Error("СИНТАКСИС КЛИЕНТА: " + e.message); }
console.log("\nГОТОВО.");